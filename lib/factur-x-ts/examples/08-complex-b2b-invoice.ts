/**
 * Example 08: Complex B2B Invoice - EXTENDED Profile
 *
 * A comprehensive B2B invoice with all advanced features.
 * Uses EXTENDED profile (most complete) with:
 * - Multiple product lines with different tax rates
 * - Line-level allowances and charges
 * - Document-level allowances and charges
 * - Billing periods
 * - Contract references
 * - Complete EN16931 compliance + extensions
 *
 * Perfect for: Enterprise B2B, complex contracts, subscription billing, professional services
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

async function generateComplexB2BInvoice() {
  console.log('='.repeat(70));
  console.log('Example 08: Complex B2B Invoice - EXTENDED Profile');
  console.log('='.repeat(70));

  // ========================================
  // 1. SELLER (Vendeur) - Complete information
  // ========================================

  const sellerAddress = PostalAddressImpl.builder()
    .street('100 Avenue des Champs-Élysées')
    .city('Paris')
    .postalCode('75008')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Enterprise Solutions International SAS')
    .address(sellerAddress)
    .vatId('FR11223344556')
    .email('billing@esi-consulting.fr')
    .phone('+33 1 42 56 78 90')
    .build();

  // ========================================
  // 2. BUYER (Acheteur) - Complete information
  // ========================================

  const buyerAddress = PostalAddressImpl.builder()
    .street('50 Rue de la Tech')
    .city('Toulouse')
    .postalCode('31000')
    .countryCode('FR')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('InnovateTech France SA')
    .address(buyerAddress)
    .vatId('FR99887766554')
    .email('comptabilite@innovatetech.fr')
    .phone('+33 5 61 12 34 56')
    .build();

  // ========================================
  // 3. PAYMENT DETAILS (Modalités de paiement)
  // ========================================

  const invoiceDate = new Date('2025-11-16');
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 45); // 45 days payment terms

  // Billing period (Q4 2025)
  const billingStart = new Date('2025-10-01');
  const billingEnd = new Date('2025-10-31');

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .reference('CONT-2025-B2B-Q4-008')
    .dueDate(dueDate)
    .termsDescription('Paiement à 45 jours fin de mois - Escompte 3% si règlement à 10 jours')
    .build();

  // ========================================
  // 4. DOCUMENT HEADER (En-tête)
  // ========================================

  const header = DocumentHeaderImpl.builder()
    .id('FACT-B2B-2025-008')
    .invoiceNumber('FACT-B2B-2025-008')
    .name('FACTURE')
    .invoiceDate(invoiceDate)
    .typeCode(DocTypeCode.INVOICE)
    .dueDate(dueDate)
    .billingPeriod(billingStart, billingEnd)
    .purchaseOrderReference('BC-2025-10-456')
    .salesOrderReference('CMD-ESI-2025-789')
    .contractReference('CONTRAT-CONSULTING-2025-ESI')
    .build();

  // ========================================
  // 5. INVOICE LINES (Lignes de facture)
  // ========================================

  // Line 1: Consulting services (standard hours)
  const line1 = new InvoiceLineImpl(
    'SRV-CONS-001',
    'Consulting technique - Forfait mensuel (120 heures)',
    120,                       // 120 hours
    150.00,                    // 150€/hour
    0.20,
    TaxCategoryCode.STANDARD,
    'HUR'                      // Unit: Hour
  );

  // Add early payment discount to this line
  line1.addAllowance(1800.00, 'Remise fidélité client VIP - 10%');

  // Line 2: Extra consulting hours (beyond contract)
  const line2 = new InvoiceLineImpl(
    'SRV-CONS-002',
    'Consulting technique - Heures supplémentaires',
    25,                        // 25 extra hours
    180.00,                    // 180€/hour (premium rate)
    0.20,
    TaxCategoryCode.STANDARD,
    'HUR'
  );

  // Line 3: Cloud Infrastructure (AWS)
  const line3 = new InvoiceLineImpl(
    'CLOUD-AWS-001',
    'Infrastructure Cloud AWS - Forfait Production',
    1,
    3500.00,                   // Monthly flat fee
    0.20,
    TaxCategoryCode.STANDARD,
    'MON'                      // Unit: Month
  );

  // Line 4: Additional storage
  const line4 = new InvoiceLineImpl(
    'CLOUD-AWS-002',
    'Stockage additionnel AWS S3 (500 GB)',
    500,                       // 500 GB
    0.25,                      // 0.25€/GB
    0.20,
    TaxCategoryCode.STANDARD,
    'C62'                      // Unit: Piece
  );

  // Line 5: Premium support
  const line5 = new InvoiceLineImpl(
    'SUP-PREM-001',
    'Support 24/7 Premium - Forfait mensuel',
    1,
    2400.00,
    0.20,
    TaxCategoryCode.STANDARD,
    'MON'
  );

  // Line 6: On-site training
  const line6 = new InvoiceLineImpl(
    'FORM-001',
    'Formation sur site - DevOps & Kubernetes (2 jours)',
    2,                         // 2 days
    1200.00,                   // 1200€/day
    0.20,
    TaxCategoryCode.STANDARD,
    'DAY'                      // Unit: Day
  );

  // Line 7: Security audit
  const line7 = new InvoiceLineImpl(
    'AUD-SEC-001',
    'Audit de sécurité mensuel avec rapport détaillé',
    1,
    1500.00,
    0.20,
    TaxCategoryCode.STANDARD,
    'C62'
  );

  // Line 8: Documentation (reduced VAT)
  const line8 = new InvoiceLineImpl(
    'DOC-001',
    'Documentation technique et guides utilisateur (PDF)',
    3,                         // 3 documents
    80.00,
    0.055,                     // 5.5% VAT for publications in France
    TaxCategoryCode.REDUCED,
    'C62'
  );

  const lines = [line1, line2, line3, line4, line5, line6, line7, line8];

  console.log('\n📋 INVOICE LINES / LIGNES DE FACTURE:\n');
  lines.forEach((line, index) => {
    console.log(`  ${index + 1}. ${line.description}`);
    console.log(`     ${line.quantity} x ${line.unitPrice.toFixed(2)}€ = ${line.lineTotal.toFixed(2)}€ HT`);
    console.log(`     TVA: ${(line.vatRate * 100).toFixed(1)}%`);
    if (line.allowances.length > 0) {
      line.allowances.forEach(a => {
        console.log(`     Remise: -${a.actualAmount.toFixed(2)}€ (${a.reason})`);
      });
    }
    console.log('');
  });

  // Calculate subtotal
  const subtotalHT = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  // ========================================
  // 6. DOCUMENT ALLOWANCES & CHARGES
  // ========================================

  // Document-level discount
  const volumeDiscount = AllowanceChargeImpl.allowance(
    500.00,
    'Remise volume - Contrat annuel > 200 000€'
  );

  // Document-level charge
  const managementFee = AllowanceChargeImpl.charge(
    150.00,
    'Frais de gestion administrative'
  );

  const rushCharge = AllowanceChargeImpl.charge(
    200.00,
    'Supplément urgence - Formation planifiée sous 48h'
  );

  const allowancesCharges = [volumeDiscount, managementFee, rushCharge];

  console.log('💰 DOCUMENT-LEVEL ADJUSTMENTS / AJUSTEMENTS DOCUMENT:\n');
  allowancesCharges.forEach((ac) => {
    const type = ac.chargeIndicator ? '➕ Frais' : '➖ Remise';
    console.log(`  ${type}: ${ac.reason}`);
    console.log(`     ${ac.actualAmount.toFixed(2)}€`);
  });

  // ========================================
  // 7. CREATE INVOICE (Créer la facture)
  // ========================================

  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,   // EXTENDED = Most complete profile
    header,
    seller,
    buyer,
    payment,
    lines,
    allowancesCharges,
    CurrencyCode.EUR
  );

  // ========================================
  // 8. CALCULATE TOTALS (Calculer les totaux)
  // ========================================

  const totals = invoice.finalizeTotals();

  console.log('\n📊 DETAILED TOTALS / TOTAUX DÉTAILLÉS:\n');
  console.log('  ┌─────────────────────────────────────────────────┐');
  console.log('  │ SOUS-TOTAUX PAR CATÉGORIE                       │');
  console.log('  └─────────────────────────────────────────────────┘');

  // Calculate by category
  const consulting = (line1.lineTotal - 1800) + line2.lineTotal;
  const cloud = line3.lineTotal + line4.lineTotal;
  const support = line5.lineTotal;
  const training = line6.lineTotal;
  const audit = line7.lineTotal;
  const documentation = line8.lineTotal;

  console.log(`    Consulting (145h):          ${consulting.toFixed(2)}€ HT`);
  console.log(`    Cloud Infrastructure:       ${cloud.toFixed(2)}€ HT`);
  console.log(`    Premium Support:            ${support.toFixed(2)}€ HT`);
  console.log(`    Formation (2 jours):        ${training.toFixed(2)}€ HT`);
  console.log(`    Audit sécurité:             ${audit.toFixed(2)}€ HT`);
  console.log(`    Documentation:              ${documentation.toFixed(2)}€ HT`);
  console.log('  ' + '─'.repeat(51));
  console.log(`    Sous-total lignes:          ${subtotalHT.toFixed(2)}€ HT`);
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────┐');
  console.log('  │ AJUSTEMENTS DOCUMENT                            │');
  console.log('  └─────────────────────────────────────────────────┘');
  console.log(`    Remise volume:             -${volumeDiscount.actualAmount.toFixed(2)}€`);
  console.log(`    Remise ligne (VIP):      -1800.00€`);
  console.log(`    Frais gestion:            +${managementFee.actualAmount.toFixed(2)}€`);
  console.log(`    Supplément urgence:       +${rushCharge.actualAmount.toFixed(2)}€`);
  console.log('  ' + '─'.repeat(51));
  console.log(`    Base HT après ajustements:  ${totals.taxBasis.toFixed(2)}€`);
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────┐');
  console.log('  │ TVA                                             │');
  console.log('  └─────────────────────────────────────────────────┘');

  // Calculate TVA by rate
  const tva20Base = consulting + cloud + support + training + audit - 500 + 150 + 200;
  const tva55Base = documentation;
  const tva20 = tva20Base * 0.20;
  const tva55 = tva55Base * 0.055;

  console.log(`    Base TVA 20%:               ${tva20Base.toFixed(2)}€`);
  console.log(`    Montant TVA 20%:          +${tva20.toFixed(2)}€`);
  console.log(`    Base TVA 5.5%:              ${tva55Base.toFixed(2)}€`);
  console.log(`    Montant TVA 5.5%:         +${tva55.toFixed(2)}€`);
  console.log('  ' + '─'.repeat(51));
  console.log(`    Total TVA:                +${totals.taxTotal.toFixed(2)}€`);
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────┐');
  console.log('  │ TOTAL                                           │');
  console.log('  └─────────────────────────────────────────────────┘');
  console.log(`    TOTAL TTC:                  ${totals.grandTotal.toFixed(2)}€`);
  console.log('');

  console.log('\n💳 PAYMENT OPTIONS / OPTIONS DE PAIEMENT:\n');
  const escompte = totals.grandTotal * 0.03;
  const netEscompte = totals.grandTotal - escompte;
  console.log(`  Option 1 - Paiement à 45 jours:`);
  console.log(`    Montant:                    ${totals.grandTotal.toFixed(2)}€`);
  console.log('');
  console.log(`  Option 2 - Paiement sous 10 jours (escompte 3%):`);
  console.log(`    Montant:                    ${netEscompte.toFixed(2)}€`);
  console.log(`    Économie:                 -${escompte.toFixed(2)}€`);

  // ========================================
  // 9. GENERATE XML (Générer le XML Factur-X)
  // ========================================

  const xml = invoice.generateXml(false);

  // Save XML to file
  const xmlPath = join(__dirname, 'output', '08-complex-b2b-invoice.xml');
  writeFileSync(xmlPath, xml, 'utf-8');

  console.log('\n✅ Facture B2B complexe générée avec succès!');
  console.log('📄 Fichier:', xmlPath);
  console.log('\n💡 TIP: Profile EXTENDED = Le plus complet (toutes fonctionnalités)');
  console.log('💡 TIP: Cette facture démontre:');
  console.log('   - Plusieurs taux de TVA (20% et 5.5%)');
  console.log('   - Remises au niveau ligne ET document');
  console.log('   - Frais supplémentaires');
  console.log('   - Période de facturation');
  console.log('   - Références contractuelles');
  console.log('   - Conditions de paiement avancées');

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

  generateComplexB2BInvoice()
    .then(() => {
      console.log('\n' + '='.repeat(70));
      console.log('✅ Exemple 08 terminé avec succès!');
      console.log('='.repeat(70));
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

export { generateComplexB2BInvoice };
