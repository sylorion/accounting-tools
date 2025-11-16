/**
 * Example 01: Simple Invoice - BASIC Profile
 *
 * This is a simple Factur-X invoice with minimal fields.
 * Uses BASIC profile with basic required fields:
 * - 1 product line
 * - No tax (VAT = 0%)
 * - Basic seller/buyer information
 *
 * Perfect for: Simple invoices, non-taxable services, educational purposes
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
} from '../src';

import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateSimpleInvoice() {
  console.log('='.repeat(60));
  console.log('Example 01: Simple Invoice (BASIC Profile)');
  console.log('='.repeat(60));

  // ========================================
  // 1. SELLER (Vendeur)
  // ========================================

  const sellerAddress = PostalAddressImpl.builder()
    .street('10 Rue du Commerce')
    .city('Paris')
    .postalCode('75001')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Ma Petite Entreprise')
    .address(sellerAddress)
    .vatId('FR12345678901')
    .email('contact@mapetiteentreprise.fr')
    .phone('+33 1 23 45 67 89')
    .build();

  // ========================================
  // 2. BUYER (Acheteur)
  // ========================================

  const buyerAddress = PostalAddressImpl.builder()
    .street('25 Avenue Client')
    .city('Lyon')
    .postalCode('69001')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Mon Client SARL')
    .address(buyerAddress)
    .email('achat@monclient.fr')
    .build();

  // ========================================
  // 3. PAYMENT DETAILS (Modalités de paiement)
  // ========================================

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .reference('REF-2025-001')
    .dueDate(new Date('2025-12-31'))
    .termsDescription('Paiement à 30 jours fin de mois')
    .build();

  // ========================================
  // 4. DOCUMENT HEADER (En-tête)
  // ========================================

  const header = DocumentHeaderImpl.builder()
    .id('INV-2025-001')
    .invoiceNumber('INV-2025-001')
    .name('FACTURE')
    .invoiceDate(new Date('2025-11-16'))
    .typeCode(DocTypeCode.INVOICE)
    .dueDate(new Date('2025-12-31'))
    .build();

  // ========================================
  // 5. INVOICE LINES (Lignes de facture)
  // ========================================

  const line1 = new InvoiceLineImpl(
    'L001',                    // ID de ligne
    'Prestation de conseil',   // Description
    1,                         // Quantité
    1000.00,                   // Prix unitaire (HT)
    0.00                       // TVA (0% pour cet exemple simple)
  );

  // ========================================
  // 6. CREATE INVOICE (Créer la facture)
  // ========================================

  const invoice = new FacturXInvoice(
    FacturxProfile.BASIC,    // BASIC profile - simple invoice with lines
    header,
    seller,
    buyer,
    payment,
    [line1],                   // Lignes de facture
    [],                        // Pas de remises document
    CurrencyCode.EUR           // Devise
  );

  // ========================================
  // 7. CALCULATE TOTALS (Calculer les totaux)
  // ========================================

  const totals = invoice.finalizeTotals();

  console.log('\n📊 TOTALS / TOTAUX:');
  console.log('  - Total HT (Tax Basis):    ', totals.taxBasis.toFixed(2), '€');
  console.log('  - Total TVA (Tax Total):   ', totals.taxTotal.toFixed(2), '€');
  console.log('  - Total TTC (Grand Total): ', totals.grandTotal.toFixed(2), '€');

  // ========================================
  // 8. GENERATE XML (Générer le XML Factur-X)
  // ========================================

  const xml = invoice.generateXml(true); // false = skip XSD validation for demo

  // Save XML to file
  const xmlPath = join(__dirname, 'output', '01-simple-invoice.xml');
  writeFileSync(xmlPath, xml, 'utf-8');

  console.log('\n✅ Facture XML générée avec succès!');
  console.log('📄 Fichier:', xmlPath);
  console.log('\n💡 TIP: Vous pouvez valider ce XML avec un validateur XSD EN16931');

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
  // Create output directory if it doesn't exist
  const outputDir = join(__dirname, 'output');
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  generateSimpleInvoice()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Exemple 01 terminé avec succès!');
      console.log('='.repeat(60));
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

export { generateSimpleInvoice };
