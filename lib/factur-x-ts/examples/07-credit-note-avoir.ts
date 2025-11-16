/**
 * Example 07: Credit Note / Avoir - EN16931 Profile
 *
 * A credit note for product returns or invoice corrections.
 * Uses EN16931 profile with:
 * - Document type: CREDIT_NOTE (381)
 * - Reference to original invoice
 * - Partial return of goods
 * - Refund calculation
 *
 * Perfect for: Product returns, invoice corrections, refunds, cancellations
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

async function generateCreditNote() {
  console.log('='.repeat(60));
  console.log('Example 07: Credit Note / Avoir (EN16931 Profile)');
  console.log('='.repeat(60));

  // ========================================
  // 1. SELLER (Vendeur) - Same as original invoice
  // ========================================

  const sellerAddress = PostalAddressImpl.builder()
    .street('200 Boulevard du E-Commerce')
    .city('Paris')
    .postalCode('75011')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('E-Shop Premium SAS')
    .address(sellerAddress)
    .vatId('FR88990011223')
    .email('retours@eshop-premium.fr')
    .phone('+33 1 80 12 34 56')
    .build();

  // ========================================
  // 2. BUYER (Acheteur) - Same as original invoice
  // ========================================

  const buyerAddress = PostalAddressImpl.builder()
    .street('45 Rue des Acheteurs')
    .city('Lille')
    .postalCode('59000')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Mme Sophie Martin')
    .address(buyerAddress)
    .email('sophie.martin@email.fr')
    .phone('+33 6 98 76 54 32')
    .build();

  // ========================================
  // 3. PAYMENT DETAILS (Modalités de remboursement)
  // ========================================

  const creditNoteDate = new Date('2025-11-16');

  // For credit notes, payment details indicate how refund will be made
  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')  // Customer's bank account for refund
    .reference('REMB-2025-007')
    .termsDescription('Remboursement par virement bancaire sous 5 jours ouvrés')
    .build();

  // ========================================
  // 4. DOCUMENT HEADER (En-tête de l'avoir)
  // ========================================

  const header = DocumentHeaderImpl.builder()
    .id('AVOIR-2025-007')
    .invoiceNumber('AVOIR-2025-007')
    .name('AVOIR')
    .invoiceDate(creditNoteDate)
    .typeCode(DocTypeCode.CREDIT_NOTE)  // Credit note type
    .purchaseOrderReference('FACT-2025-789')  // Reference to original invoice
    .build();

  // ========================================
  // 5. CREDIT NOTE LINES (Lignes de l'avoir)
  // ========================================

  // Original invoice had:
  // - 2x MacBook Pro @ 2499€ = 4998€ HT
  // - 5x Écran Dell @ 449€ = 2245€ HT
  // - 5x Clavier @ 89.90€ = 449.50€ HT
  // - 5x Souris @ 39.90€ = 199.50€ HT

  // Credit note for returns:
  // Return 1x MacBook Pro (defective)
  const returnLine1 = new InvoiceLineImpl(
    'R001',
    'RETOUR: MacBook Pro 16" M3 - 32GB - 1TB (défectueux)',
    1,                         // Returning 1 unit
    2499.00,                   // Same price as original
    0.20,
    TaxCategoryCode.STANDARD
  );

  // Return 2x Dell Monitors (damaged)
  const returnLine2 = new InvoiceLineImpl(
    'R002',
    'RETOUR: Écran Dell 27" UltraSharp 4K (endommagé)',
    2,                         // Returning 2 units
    449.00,
    0.20,
    TaxCategoryCode.STANDARD
  );

  const lines = [returnLine1, returnLine2];

  console.log('\n📋 RETURNED ITEMS / ARTICLES RETOURNÉS:\n');
  lines.forEach((line, index) => {
    console.log(`  ${index + 1}. ${line.description}`);
    console.log(`     Quantité: ${line.quantity}`);
    console.log(`     Prix unitaire: ${line.unitPrice.toFixed(2)}€ HT`);
    console.log(`     Total ligne: ${line.lineTotal.toFixed(2)}€ HT`);
    console.log('');
  });

  // ========================================
  // 6. CREATE CREDIT NOTE (Créer l'avoir)
  // ========================================

  const creditNote = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    seller,
    buyer,
    payment,
    lines,
    [],                        // No additional allowances/charges
    CurrencyCode.EUR
  );

  // ========================================
  // 7. CALCULATE TOTALS (Calculer les totaux)
  // ========================================

  const totals = creditNote.finalizeTotals();

  // Original invoice totals (for reference)
  const originalHT = 2499.00 * 2 + 449.00 * 5 + 89.90 * 5 + 39.90 * 5;
  const originalTVA = originalHT * 0.20;
  const originalTTC = originalHT + originalTVA;

  console.log('📊 CREDIT NOTE TOTALS / TOTAUX DE L\'AVOIR:\n');
  console.log('  - Total HT à rembourser:      ', totals.taxBasis.toFixed(2), '€');
  console.log('  - TVA à rembourser (20%):     ', totals.taxTotal.toFixed(2), '€');
  console.log('  - TOTAL TTC À REMBOURSER:     ', totals.grandTotal.toFixed(2), '€');

  console.log('\n📋 ORIGINAL INVOICE / FACTURE ORIGINALE:\n');
  console.log('  - Facture N°: FACT-2025-789');
  console.log('  - Total HT facture:           ', originalHT.toFixed(2), '€');
  console.log('  - TVA facture (20%):          ', originalTVA.toFixed(2), '€');
  console.log('  - Total TTC facture:          ', originalTTC.toFixed(2), '€');

  console.log('\n💰 BALANCE AFTER CREDIT NOTE / SOLDE APRÈS AVOIR:\n');
  const remainingHT = originalHT - totals.taxBasis;
  const remainingTVA = remainingHT * 0.20;
  const remainingTTC = remainingHT + remainingTVA;
  console.log('  - Reste dû HT:                ', remainingHT.toFixed(2), '€');
  console.log('  - Reste dû TVA:               ', remainingTVA.toFixed(2), '€');
  console.log('  - RESTE DÛ TTC:               ', remainingTTC.toFixed(2), '€');

  console.log('\n🔍 VERIFICATION / VÉRIFICATION:\n');
  console.log('  - Articles retournés:          3 unités (1 MacBook + 2 écrans)');
  console.log('  - Articles conservés:          10 unités (5 claviers + 5 souris)');
  console.log('  - % remboursement:            ', ((totals.grandTotal / originalTTC) * 100).toFixed(1), '%');

  // ========================================
  // 8. GENERATE XML (Générer le XML Factur-X)
  // ========================================

  const xml = creditNote.generateXml(false);

  // Save XML to file
  const xmlPath = join(__dirname, 'output', '07-credit-note-avoir.xml');
  writeFileSync(xmlPath, xml, 'utf-8');

  console.log('\n✅ Avoir généré avec succès!');
  console.log('📄 Fichier:', xmlPath);
  console.log('\n💡 TIP: Un avoir utilise le DocTypeCode.CREDIT_NOTE (381)');
  console.log('💡 TIP: Toujours référencer la facture originale dans purchaseOrderReference');
  console.log('💡 TIP: Les montants de l\'avoir sont positifs (pas négatifs)');

  return {
    creditNote,
    xml,
    totals,
    originalTotals: {
      taxBasis: originalHT,
      taxTotal: originalTVA,
      grandTotal: originalTTC,
    },
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

  generateCreditNote()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Exemple 07 terminé avec succès!');
      console.log('='.repeat(60));
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

export { generateCreditNote };
