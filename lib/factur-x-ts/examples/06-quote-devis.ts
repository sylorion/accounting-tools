/**
 * Example 06: Quote / Devis - EN16931 Profile
 *
 * A professional quotation document (pro forma invoice).
 * Uses EN16931 profile with:
 * - Document type: PRO_FORMAT (384)
 * - Multiple product lines with options
 * - Validity period
 * - Optional items and packages
 * - No payment yet (quotation only)
 *
 * Perfect for: Sales quotes, estimates, pro forma invoices, commercial proposals
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

async function generateQuote() {
  console.log('='.repeat(60));
  console.log('Example 06: Quote / Devis (EN16931 Profile)');
  console.log('='.repeat(60));

  // ========================================
  // 1. SELLER (Vendeur)
  // ========================================

  const sellerAddress = PostalAddressImpl.builder()
    .street('50 Rue de la Construction')
    .city('Lyon')
    .postalCode('69003')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Renovation Expert SARL')
    .address(sellerAddress)
    .vatId('FR66778899001')
    .email('devis@renovation-expert.fr')
    .phone('+33 4 72 12 34 56')
    .build();

  // ========================================
  // 2. BUYER (Acheteur potentiel)
  // ========================================

  const buyerAddress = PostalAddressImpl.builder()
    .street('12 Avenue des Propriétaires')
    .city('Lyon')
    .postalCode('69006')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('M. et Mme Dupont')
    .address(buyerAddress)
    .email('dupont.famille@email.fr')
    .phone('+33 6 12 34 56 78')
    .build();

  // ========================================
  // 3. PAYMENT DETAILS (Modalités de paiement)
  // ========================================

  const quoteDate = new Date('2025-11-16');
  const validityDate = new Date(quoteDate);
  validityDate.setDate(validityDate.getDate() + 30); // Quote valid for 30 days

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7610278060010020304050607')
    .bic('CMCIFRPPXXX')
    .termsDescription('Acompte de 30% à la commande, solde à la fin des travaux')
    .build();

  // ========================================
  // 4. DOCUMENT HEADER (En-tête du devis)
  // ========================================

  const header = DocumentHeaderImpl.builder()
    .id('DEVIS-2025-006')
    .invoiceNumber('DEVIS-2025-006')
    .name('DEVIS')
    .invoiceDate(quoteDate)
    .typeCode(DocTypeCode.PRO_FORMAT)  // Pro forma = Quote/Devis
    .dueDate(validityDate)
    .build();

  // ========================================
  // 5. QUOTE LINES (Lignes du devis)
  // ========================================

  // Package 1: Kitchen Renovation
  const line1 = new InvoiceLineImpl(
    'PKG001',
    'PACKAGE CUISINE COMPLÈTE',
    1,
    12500.00,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const line2 = new InvoiceLineImpl(
    'L001',
    '  → Dépose ancienne cuisine',
    1,
    800.00,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const line3 = new InvoiceLineImpl(
    'L002',
    '  → Meubles cuisine haut de gamme (3m linéaire)',
    1,
    6500.00,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const line4 = new InvoiceLineImpl(
    'L003',
    '  → Électroménager encastrable (plaque, four, lave-vaisselle)',
    1,
    3200.00,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const line5 = new InvoiceLineImpl(
    'L004',
    '  → Plomberie et électricité',
    1,
    1500.00,
    0.10,  // 10% VAT for renovation work
    TaxCategoryCode.REDUCED
  );

  const line6 = new InvoiceLineImpl(
    'L005',
    '  → Pose et finitions',
    1,
    500.00,
    0.10,
    TaxCategoryCode.REDUCED
  );

  // Package 2: Bathroom Renovation
  const line7 = new InvoiceLineImpl(
    'PKG002',
    'PACKAGE SALLE DE BAIN',
    1,
    8500.00,
    0.10,
    TaxCategoryCode.REDUCED
  );

  const line8 = new InvoiceLineImpl(
    'L006',
    '  → Dépose ancienne salle de bain',
    1,
    600.00,
    0.10,
    TaxCategoryCode.REDUCED
  );

  const line9 = new InvoiceLineImpl(
    'L007',
    '  → Douche italienne avec paroi',
    1,
    2800.00,
    0.10,
    TaxCategoryCode.REDUCED
  );

  const line10 = new InvoiceLineImpl(
    'L008',
    '  → Meuble vasque double + miroir LED',
    1,
    1500.00,
    0.10,
    TaxCategoryCode.REDUCED
  );

  const line11 = new InvoiceLineImpl(
    'L009',
    '  → Carrelage sol et mur (15m²)',
    1,
    2400.00,
    0.10,
    TaxCategoryCode.REDUCED
  );

  const line12 = new InvoiceLineImpl(
    'L010',
    '  → Plomberie, électricité, ventilation',
    1,
    1200.00,
    0.10,
    TaxCategoryCode.REDUCED
  );

  // Optional items
  const line13 = new InvoiceLineImpl(
    'OPT001',
    'OPTION: Peinture appartement complet',
    1,
    2500.00,
    0.10,
    TaxCategoryCode.REDUCED
  );

  const lines = [
    line1, line2, line3, line4, line5, line6,
    line7, line8, line9, line10, line11, line12,
    line13,
  ];

  console.log('\n📋 QUOTE ITEMS / LIGNES DU DEVIS:\n');
  lines.forEach((line) => {
    const symbol = line.id.startsWith('PKG') ? '📦' :
                   line.id.startsWith('OPT') ? '⭐' : '  ';
    console.log(`${symbol} ${line.description}`);
    console.log(`   ${line.unitPrice.toFixed(2)}€ HT (TVA ${(line.vatRate * 100).toFixed(0)}%)`);
  });

  // ========================================
  // 6. DOCUMENT ALLOWANCES (Remises)
  // ========================================

  const subtotalHT = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  // Early bird discount
  const discount = AllowanceChargeImpl.allowance(
    1000.00,
    'Remise promotion "Rénovation Automne 2025" - 1000€'
  );

  console.log('\n💰 DISCOUNTS / REMISES:');
  console.log(`  - ${discount.reason}`);
  console.log(`  - Montant: ${discount.actualAmount.toFixed(2)}€`);

  // ========================================
  // 7. CREATE QUOTE (Créer le devis)
  // ========================================

  const quote = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    seller,
    buyer,
    payment,
    lines,
    [discount],
    CurrencyCode.EUR
  );

  // ========================================
  // 8. CALCULATE TOTALS (Calculer les totaux)
  // ========================================

  const totals = quote.finalizeTotals();

  console.log('\n📊 QUOTE TOTALS / TOTAUX DU DEVIS:\n');
  console.log('  - Sous-total HT:              ', subtotalHT.toFixed(2), '€');
  console.log('  - Remise "Automne 2025":     -', discount.actualAmount.toFixed(2), '€');
  console.log('  - Total HT après remise:      ', totals.taxBasis.toFixed(2), '€');
  console.log('  - TVA (mixte 10% et 20%):    +', totals.taxTotal.toFixed(2), '€');
  console.log('  - TOTAL TTC:                  ', totals.grandTotal.toFixed(2), '€');

  console.log('\n💳 PAYMENT SCHEDULE / ÉCHÉANCIER:');
  const deposit = totals.grandTotal * 0.30;
  const balance = totals.grandTotal * 0.70;
  console.log('  - Acompte (30%):  ', deposit.toFixed(2), '€');
  console.log('  - Solde (70%):    ', balance.toFixed(2), '€');

  console.log('\n📅 VALIDITY / VALIDITÉ:');
  console.log('  - Date du devis:    ', quoteDate.toLocaleDateString('fr-FR'));
  console.log('  - Valable jusqu\'au: ', validityDate.toLocaleDateString('fr-FR'));
  console.log('  - Durée validité:    30 jours');

  // ========================================
  // 9. GENERATE XML (Générer le XML Factur-X)
  // ========================================

  const xml = quote.generateXml(true);

  // Save XML to file
  const xmlPath = join(__dirname, 'output', '06-quote-devis.xml');
  writeFileSync(xmlPath, xml, 'utf-8');

  console.log('\n✅ Devis généré avec succès!');
  console.log('📄 Fichier:', xmlPath);
  console.log('\n💡 TIP: Un devis utilise le DocTypeCode.PRO_FORMAT (384)');
  console.log('💡 TIP: Pour accepter ce devis, créer une facture avec référence au devis');

  return {
    quote,
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

  generateQuote()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Exemple 06 terminé avec succès!');
      console.log('='.repeat(60));
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

export { generateQuote };
