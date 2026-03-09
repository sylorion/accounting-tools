/**
 * Example 02: Invoice with VAT - BASIC Profile
 *
 * A standard invoice with VAT/TVA calculation.
 * Uses BASIC profile with:
 * - 1 product line
 * - 20% VAT (French standard rate)
 * - Complete seller/buyer information
 * - Payment terms
 *
 * Perfect for: Standard B2B invoices, service invoices with VAT
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

async function generateInvoiceWithVAT() {
  console.log('='.repeat(60));
  console.log('Example 02: Invoice with VAT (BASIC Profile)');
  console.log('='.repeat(60));

  // ========================================
  // 1. SELLER (Vendeur)
  // ========================================

  const sellerAddress = PostalAddressImpl.builder()
    .street('42 Boulevard de la Tech')
    .city('Paris')
    .postalCode('75002')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Tech Solutions SARL')
    .address(sellerAddress)
    .vatId('FR98765432109')
    .email('facturation@techsolutions.fr')
    .phone('+33 1 40 20 30 40')
    .build();

  // ========================================
  // 2. BUYER (Acheteur)
  // ========================================

  const buyerAddress = PostalAddressImpl.builder()
    .street('15 Rue des Entrepreneurs')
    .city('Marseille')
    .postalCode('13001')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Startup Innovante SAS')
    .address(buyerAddress)
    .vatId('FR11223344556')
    .email('compta@startup-innovante.fr')
    .phone('+33 4 91 12 34 56')
    .build();

  // ========================================
  // 3. PAYMENT DETAILS (Modalités de paiement)
  // ========================================

  const invoiceDate = new Date('2025-11-16');
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630006000011234567890189')
    .bic('AGRIFRPPXXX')
    .reference('REF-2025-1116-002')
    .dueDate(dueDate)
    .termsDescription('Paiement par virement bancaire à 30 jours')
    .build();

  // ========================================
  // 4. DOCUMENT HEADER (En-tête)
  // ========================================

  const header = DocumentHeaderImpl.builder()
    .id('FACT-2025-002')
    .invoiceNumber('FACT-2025-002')
    .name('FACTURE')
    .invoiceDate(invoiceDate)
    .typeCode(DocTypeCode.INVOICE)
    .dueDate(dueDate)
    .purchaseOrderReference('BC-2025-456')
    .build();

  // ========================================
  // 5. INVOICE LINES (Lignes de facture)
  // ========================================

  // Product line with 20% VAT (French standard rate)
  const line1 = new InvoiceLineImpl(
    'L001',
    'Développement application web React + Node.js',
    10,                        // 10 jours de développement
    800.00,                    // 800€ par jour (HT)
    0.20,                      // 20% TVA
    TaxCategoryCode.STANDARD   // Taux standard
  );

  console.log('\n📋 INVOICE LINE / LIGNE DE FACTURE:');
  console.log('  Description:', line1.description);
  console.log('  Quantité:   ', line1.quantity, 'jours');
  console.log('  Prix unit.: ', line1.unitPrice.toFixed(2), '€ HT');
  console.log('  TVA:        ', (line1.vatRate * 100).toFixed(0), '%');
  console.log('  Total ligne:', line1.lineTotal.toFixed(2), '€ HT');

  // ========================================
  // 6. CREATE INVOICE (Créer la facture)
  // ========================================

  const invoice = new FacturXInvoice(
    FacturxProfile.BASIC,      // Profile BASIC pour factures standard
    header,
    seller,
    buyer,
    payment,
    [line1],
    [],                        // Pas de remises document
    CurrencyCode.EUR
  );

  // ========================================
  // 7. CALCULATE TOTALS (Calculer les totaux)
  // ========================================

  const totals = invoice.finalizeTotals();

  console.log('\n📊 TOTALS / TOTAUX:');
  console.log('  - Total HT (Tax Basis):      ', totals.taxBasis.toFixed(2), '€');
  console.log('  - Total TVA 20% (Tax Total): ', totals.taxTotal.toFixed(2), '€');
  console.log('  - Total TTC (Grand Total):   ', totals.grandTotal.toFixed(2), '€');

  // Detailed calculation
  const expectedHT = line1.quantity * line1.unitPrice;
  const expectedTVA = expectedHT * line1.vatRate;
  const expectedTTC = expectedHT + expectedTVA;

  console.log('\n🔍 VERIFICATION / VÉRIFICATION:');
  console.log('  - Attendu HT: ', expectedHT.toFixed(2), '€');
  console.log('  - Attendu TVA:', expectedTVA.toFixed(2), '€');
  console.log('  - Attendu TTC:', expectedTTC.toFixed(2), '€');
  console.log('  - ✓ Calcul correct:', totals.grandTotal === expectedTTC);

  // ========================================
  // 8. GENERATE XML (Générer le XML Factur-X)
  // ========================================

  const xml = invoice.generateXml(true);

  // Save XML to file
  const xmlPath = join(__dirname, 'output', '02-invoice-with-vat.xml');
  writeFileSync(xmlPath, xml, 'utf-8');

  console.log('\n✅ Facture XML avec TVA générée avec succès!');
  console.log('📄 Fichier:', xmlPath);
  console.log('\n💡 TIP: Cette facture utilise le taux de TVA standard français (20%)');

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

  generateInvoiceWithVAT()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Exemple 02 terminé avec succès!');
      console.log('='.repeat(60));
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

export { generateInvoiceWithVAT };
