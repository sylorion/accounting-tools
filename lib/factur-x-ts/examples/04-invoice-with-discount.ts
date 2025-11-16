/**
 * Example 04: Invoice with Discount - EN16931 Profile
 *
 * A professional invoice with document-level discounts.
 * Uses EN16931 profile (European Standard) with:
 * - Multiple product lines
 * - Document-level allowances (discounts)
 * - Document-level charges (shipping fees)
 * - Complete EN16931 compliance
 *
 * Perfect for: B2B invoices, promotional offers, volume discounts
 */

import {
  FacturXInvoice,
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLineImpl,
  AllowanceChargeImpl,
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
  CurrencyCode,
  TaxCategoryCode,
} from '../src';

import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateInvoiceWithDiscount() {
  console.log('='.repeat(60));
  console.log('Example 04: Invoice with Discount (EN16931 Profile)');
  console.log('='.repeat(60));

  // ========================================
  // 1. SELLER (Vendeur)
  // ========================================

  const sellerAddress = PostalAddressImpl.builder()
    .street('100 Rue de la Distribution')
    .city('Toulouse')
    .postalCode('31000')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Distribution Pro SAS')
    .address(sellerAddress)
    .vatId('FR44556677889')
    .email('factures@distributionpro.fr')
    .phone('+33 5 61 12 34 56')
    .build();

  // ========================================
  // 2. BUYER (Acheteur)
  // ========================================

  const buyerAddress = PostalAddressImpl.builder()
    .street('75 Avenue du Commerce')
    .city('Nantes')
    .postalCode('44000')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Commerce Retail SARL')
    .address(buyerAddress)
    .vatId('FR22334455667')
    .email('comptabilite@commerce-retail.fr')
    .phone('+33 2 40 98 76 54')
    .build();

  // ========================================
  // 3. PAYMENT DETAILS (Modalités de paiement)
  // ========================================

  const invoiceDate = new Date('2025-11-16');
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 60); // 60 days payment terms

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7612345678901234567890123')
    .bic('SOGEFRPPXXX')
    .reference('BC-2025-NOV-004')
    .dueDate(dueDate)
    .termsDescription('Paiement à 60 jours - Escompte 2% si paiement sous 10 jours')
    .build();

  // ========================================
  // 4. DOCUMENT HEADER (En-tête)
  // ========================================

  const header = DocumentHeaderImpl.builder()
    .id('FACT-2025-004')
    .invoiceNumber('FACT-2025-004')
    .name('FACTURE')
    .invoiceDate(invoiceDate)
    .typeCode(DocTypeCode.INVOICE)
    .dueDate(dueDate)
    .purchaseOrderReference('CMD-2025-1015')
    .contractReference('CONTRAT-2025-B2B')
    .build();

  // ========================================
  // 5. INVOICE LINES (Lignes de facture)
  // ========================================

  const line1 = new InvoiceLineImpl(
    'L001',
    'Ordinateur portable Dell XPS 15" - i7 - 16GB',
    10,
    1299.00,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const line2 = new InvoiceLineImpl(
    'L002',
    'Écran Dell 27" UltraSharp 4K',
    10,
    449.00,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const line3 = new InvoiceLineImpl(
    'L003',
    'Clavier mécanique Gaming RGB',
    15,
    89.90,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const line4 = new InvoiceLineImpl(
    'L004',
    'Souris sans fil ergonomique',
    15,
    39.90,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const lines = [line1, line2, line3, line4];

  // Calculate subtotal before discounts
  const subtotalHT = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  console.log('\n📋 INVOICE LINES / LIGNES DE FACTURE:\n');
  lines.forEach((line, index) => {
    console.log(`  ${index + 1}. ${line.description}`);
    console.log(`     ${line.quantity} x ${line.unitPrice.toFixed(2)}€ = ${line.lineTotal.toFixed(2)}€ HT`);
  });
  console.log(`\n  Sous-total HT: ${subtotalHT.toFixed(2)}€`);

  // ========================================
  // 6. DOCUMENT ALLOWANCES & CHARGES
  // ========================================

  // Discount: 10% loyalty discount
  const discount = AllowanceChargeImpl.allowance(
    subtotalHT * 0.10,  // 10% discount
    'Remise fidélité client VIP - 10%'
  );

  // Charge: Shipping fee
  const shippingFee = AllowanceChargeImpl.charge(
    0,  // Free shipping for orders > 10,000€
    'Frais de port (offerts pour commande > 10 000€)'
  );

  const allowancesCharges = [discount, shippingFee];

  console.log('\n💰 ALLOWANCES & CHARGES / REMISES & FRAIS:\n');
  allowancesCharges.forEach((ac) => {
    const type = ac.chargeIndicator ? 'Frais' : 'Remise';
    const sign = ac.chargeIndicator ? '+' : '-';
    console.log(`  ${type}: ${ac.reason || 'N/A'}`);
    console.log(`  ${sign}${ac.actualAmount.toFixed(2)}€`);
  });

  // ========================================
  // 7. CREATE INVOICE (Créer la facture)
  // ========================================

  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,    // EN16931 = European Standard
    header,
    seller,
    buyer,
    payment,
    lines,
    allowancesCharges,         // Document-level allowances/charges
    CurrencyCode.EUR
  );

  // ========================================
  // 8. CALCULATE TOTALS (Calculer les totaux)
  // ========================================

  const totals = invoice.finalizeTotals();

  console.log('\n📊 TOTALS / TOTAUX:\n');
  console.log('  - Sous-total HT:              ', subtotalHT.toFixed(2), '€');
  console.log('  - Remise 10%:                -', (subtotalHT * 0.10).toFixed(2), '€');
  console.log('  - Frais de port:             +', '0.00', '€');
  console.log('  - Total HT après remise:     ', totals.taxBasis.toFixed(2), '€');
  console.log('  - TVA 20%:                   +', totals.taxTotal.toFixed(2), '€');
  console.log('  - Total TTC:                  ', totals.grandTotal.toFixed(2), '€');

  // Calculate expected values
  const expectedBaseAfterDiscount = subtotalHT * 0.90; // -10%
  const expectedTVA = expectedBaseAfterDiscount * 0.20;
  const expectedTTC = expectedBaseAfterDiscount + expectedTVA;

  console.log('\n🔍 VERIFICATION / VÉRIFICATION:');
  console.log('  Base HT attendue:  ', expectedBaseAfterDiscount.toFixed(2), '€');
  console.log('  TVA attendue:      ', expectedTVA.toFixed(2), '€');
  console.log('  TTC attendu:       ', expectedTTC.toFixed(2), '€');
  console.log('  ✓ Calcul correct:  ', Math.abs(totals.grandTotal - expectedTTC) < 0.01);

  console.log('\n💵 SAVINGS / ÉCONOMIES:');
  console.log('  Prix sans remise:  ', (subtotalHT * 1.20).toFixed(2), '€ TTC');
  console.log('  Prix avec remise:  ', totals.grandTotal.toFixed(2), '€ TTC');
  console.log('  Économie:          ', ((subtotalHT * 1.20) - totals.grandTotal).toFixed(2), '€');

  // ========================================
  // 9. GENERATE XML (Générer le XML Factur-X)
  // ========================================

  const xml = invoice.generateXml(false);

  // Save XML to file
  const xmlPath = join(__dirname, 'output', '04-invoice-with-discount.xml');
  writeFileSync(xmlPath, xml, 'utf-8');

  console.log('\n✅ Facture avec remise générée avec succès!');
  console.log('📄 Fichier:', xmlPath);
  console.log('\n💡 TIP: Cette facture est conforme à la norme européenne EN16931');

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

  generateInvoiceWithDiscount()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Exemple 04 terminé avec succès!');
      console.log('='.repeat(60));
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

export { generateInvoiceWithDiscount };
