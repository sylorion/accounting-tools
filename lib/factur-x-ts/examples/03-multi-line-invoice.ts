/**
 * Example 03: Multi-Line Invoice - BASIC Profile
 *
 * A complete invoice with multiple product lines.
 * Uses BASIC profile with:
 * - Multiple product lines (5 different items)
 * - Different VAT rates (20%, 10%, 5.5%)
 * - Mixed products and services
 * - Complete totals calculation
 *
 * Perfect for: Retail invoices, mixed product/service sales, restaurant bills
 */

import {
  FacturXInvoice,
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLineImpl,
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
  CurrencyCode,
  TaxCategoryCode,
} from '../src';

import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateMultiLineInvoice() {
  console.log('='.repeat(60));
  console.log('Example 03: Multi-Line Invoice (BASIC Profile)');
  console.log('='.repeat(60));

  // ========================================
  // 1. SELLER (Vendeur)
  // ========================================

  const sellerAddress = PostalAddressImpl.builder()
    .street('55 Avenue des Champs-Élysées')
    .city('Paris')
    .postalCode('75008')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Boutique Premium Paris')
    .address(sellerAddress)
    .vatId('FR55667788990')
    .email('ventes@boutiquepremium.fr')
    .phone('+33 1 53 53 53 53')
    .build();

  // ========================================
  // 2. BUYER (Acheteur)
  // ========================================

  const buyerAddress = PostalAddressImpl.builder()
    .street('88 Rue de la République')
    .city('Bordeaux')
    .postalCode('33000')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Entreprise Cliente SA')
    .address(buyerAddress)
    .vatId('FR99887766554')
    .email('achats@entreprise-cliente.fr')
    .phone('+33 5 56 12 34 56')
    .build();

  // ========================================
  // 3. PAYMENT DETAILS (Modalités de paiement)
  // ========================================

  const invoiceDate = new Date('2025-11-16');
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 45); // 45 days payment terms

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7610107001011234567890129')
    .bic('BREDFRPPXXX')
    .reference('BC-2025-789')
    .dueDate(dueDate)
    .termsDescription('Paiement à 45 jours')
    .build();

  // ========================================
  // 4. DOCUMENT HEADER (En-tête)
  // ========================================

  const header = DocumentHeaderImpl.builder()
    .id('FAC-2025-003')
    .invoiceNumber('FAC-2025-003')
    .name('FACTURE')
    .invoiceDate(invoiceDate)
    .typeCode(DocTypeCode.INVOICE)
    .dueDate(dueDate)
    .purchaseOrderReference('CMD-2025-789')
    .salesOrderReference('SO-2025-321')
    .build();

  // ========================================
  // 5. INVOICE LINES (Lignes de facture)
  // ========================================

  // Line 1: Laptop - 20% VAT (standard rate)
  const line1 = new InvoiceLineImpl(
    'L001',
    'MacBook Pro 16" M3 - 32GB RAM - 1TB SSD',
    2,                         // 2 units
    2499.00,                   // Unit price
    0.20,                      // 20% VAT
    TaxCategoryCode.STANDARD
  );

  // Line 2: Software license - 20% VAT
  const line2 = new InvoiceLineImpl(
    'L002',
    'Licence annuelle Adobe Creative Cloud',
    2,
    599.88,
    0.20,
    TaxCategoryCode.STANDARD
  );

  // Line 3: Office supplies - 20% VAT
  const line3 = new InvoiceLineImpl(
    'L003',
    'Fournitures de bureau (stylos, cahiers, etc.)',
    1,
    149.99,
    0.20,
    TaxCategoryCode.STANDARD
  );

  // Line 4: Books - 5.5% VAT (reduced rate for books in France)
  const line4 = new InvoiceLineImpl(
    'L004',
    'Livres techniques JavaScript et TypeScript',
    5,
    39.90,
    0.055,                     // 5.5% VAT for books
    TaxCategoryCode.REDUCED
  );

  // Line 5: Training - 20% VAT
  const line5 = new InvoiceLineImpl(
    'L005',
    'Formation développement web - 2 jours',
    1,
    1200.00,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const lines = [line1, line2, line3, line4, line5];

  console.log('\n📋 INVOICE LINES / LIGNES DE FACTURE:\n');
  lines.forEach((line, index) => {
    console.log(`  Ligne ${index + 1}:`);
    console.log(`    ${line.description}`);
    console.log(`    Qté: ${line.quantity} x ${line.unitPrice.toFixed(2)}€ HT`);
    console.log(`    TVA: ${(line.vatRate * 100).toFixed(1)}%`);
    console.log(`    Total ligne: ${line.lineTotal.toFixed(2)}€ HT`);
    console.log('');
  });

  // ========================================
  // 6. CREATE INVOICE (Créer la facture)
  // ========================================

  const invoice = new FacturXInvoice(
    FacturxProfile.BASIC,
    header,
    seller,
    buyer,
    payment,
    lines,                     // Multiple lines
    [],                        // No document allowances
    CurrencyCode.EUR
  );

  // ========================================
  // 7. CALCULATE TOTALS (Calculer les totaux)
  // ========================================

  const totals = invoice.finalizeTotals();

  console.log('📊 TOTALS / TOTAUX:\n');
  console.log('  - Total HT (Tax Basis):    ', totals.taxBasis.toFixed(2), '€');
  console.log('  - Total TVA (Tax Total):   ', totals.taxTotal.toFixed(2), '€');
  console.log('  - Total TTC (Grand Total): ', totals.grandTotal.toFixed(2), '€');

  // Detailed tax breakdown
  console.log('\n🔍 TAX BREAKDOWN / DÉTAIL TVA:\n');

  // Calculate by tax rate
  const linesByTaxRate = new Map<number, InvoiceLineImpl[]>();
  lines.forEach(line => {
    const rate = line.vatRate;
    if (!linesByTaxRate.has(rate)) {
      linesByTaxRate.set(rate, []);
    }
    linesByTaxRate.get(rate)!.push(line);
  });

  linesByTaxRate.forEach((linesForRate, rate) => {
    const baseForRate = linesForRate.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxForRate = baseForRate * rate;
    console.log(`  TVA ${(rate * 100).toFixed(1)}%:`);
    console.log(`    Base HT:  ${baseForRate.toFixed(2)}€`);
    console.log(`    Montant:  ${taxForRate.toFixed(2)}€`);
    console.log('');
  });

  // ========================================
  // 8. GENERATE XML (Générer le XML Factur-X)
  // ========================================

  const xml = invoice.generateXml(false);

  // Save XML to file
  const xmlPath = join(__dirname, 'output', '03-multi-line-invoice.xml');
  writeFileSync(xmlPath, xml, 'utf-8');

  console.log('✅ Facture multi-lignes générée avec succès!');
  console.log('📄 Fichier:', xmlPath);
  console.log('\n💡 TIP: Cette facture montre comment gérer plusieurs taux de TVA');

  return {
    invoice,
    xml,
    totals,
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  // Create output directory
  const outputDir = join(__dirname, 'output');
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  generateMultiLineInvoice()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Exemple 03 terminé avec succès!');
      console.log('='.repeat(60));
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

export { generateMultiLineInvoice };
