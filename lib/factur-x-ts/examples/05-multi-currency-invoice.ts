/**
 * Example 05: Multi-Currency Invoice - EN16931 Profile
 *
 * An international invoice with multiple currencies.
 * Uses EN16931 profile with:
 * - Invoice in USD (primary currency)
 * - Cross-border transaction (FR → US)
 * - International payment terms
 * - VAT exemption for export
 *
 * Perfect for: International sales, export invoices, multi-currency accounting
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

async function generateMultiCurrencyInvoice() {
  console.log('='.repeat(60));
  console.log('Example 05: Multi-Currency Invoice (EN16931 Profile)');
  console.log('='.repeat(60));

  // Exchange rate USD/EUR (example rate)
  const exchangeRate = 1.08; // 1 USD = 1.08 EUR
  console.log(`\n💱 Exchange Rate: 1 USD = ${exchangeRate.toFixed(4)} EUR`);

  // ========================================
  // 1. SELLER (Vendeur) - French company
  // ========================================

  const sellerAddress = PostalAddressImpl.builder()
    .street('200 Rue de l\'Export')
    .city('Paris')
    .postalCode('75016')
    .countryCode('FR')
    .build();

  const seller = TradePartyImpl.builder()
    .name('SaaS Solutions France SAS')
    .address(sellerAddress)
    .vatId('FR33445566778')
    .email('billing@saas-solutions.fr')
    .phone('+33 1 76 54 32 10')
    .build();

  // ========================================
  // 2. BUYER (Acheteur) - US company
  // ========================================

  const buyerAddress = PostalAddressImpl.builder()
    .street('1234 Market Street, Suite 500')
    .city('San Francisco')
    .postalCode('CA 94103')
    .countryCode('US')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Tech Startup Inc.')
    .address(buyerAddress)
    .vatId('US123456789')  // US Tax ID
    .email('accounts@techstartup.com')
    .phone('+1 415 123 4567')
    .build();

  // ========================================
  // 3. PAYMENT DETAILS (Modalités de paiement)
  // ========================================

  const invoiceDate = new Date('2025-11-16');
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days NET

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.CREDIT_TRANSFER)  // International wire transfer
    .iban('FR7630001007941234567890185')
    .bic('BNPAFRPPXXX')
    .reference('INV-US-2025-005')
    .dueDate(dueDate)
    .termsDescription('Payment: NET 30 days - Wire transfer in USD')
    .build();

  // ========================================
  // 4. DOCUMENT HEADER (En-tête)
  // ========================================

  const header = DocumentHeaderImpl.builder()
    .id('INV-US-2025-005')
    .invoiceNumber('INV-US-2025-005')
    .name('INVOICE')
    .invoiceDate(invoiceDate)
    .typeCode(DocTypeCode.INVOICE)
    .dueDate(dueDate)
    .purchaseOrderReference('PO-US-20251015')
    .contractReference('SaaS-ANNUAL-2025')
    .build();

  // ========================================
  // 5. INVOICE LINES (Lignes de facture)
  // ========================================

  // All prices in USD
  const line1 = new InvoiceLineImpl(
    'L001',
    'SaaS Premium Plan - Annual Subscription',
    1,
    12000.00,              // $12,000 USD per year
    0.00,                  // 0% VAT (export)
    TaxCategoryCode.EXPORT // Export - No VAT
  );

  const line2 = new InvoiceLineImpl(
    'L002',
    'Custom Integration Development - 40 hours',
    1,
    8000.00,               // $8,000 USD
    0.00,
    TaxCategoryCode.EXPORT
  );

  const line3 = new InvoiceLineImpl(
    'L003',
    '24/7 Premium Support - Annual',
    1,
    3600.00,               // $3,600 USD
    0.00,
    TaxCategoryCode.EXPORT
  );

  const lines = [line1, line2, line3];

  console.log('\n📋 INVOICE LINES (in USD):\n');
  lines.forEach((line, index) => {
    const usdAmount = line.lineTotal;
    const eurAmount = usdAmount * exchangeRate;
    console.log(`  ${index + 1}. ${line.description}`);
    console.log(`     USD: $${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`     EUR: €${eurAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} (indicative)`);
    console.log('');
  });

  // ========================================
  // 6. CREATE INVOICE (Créer la facture)
  // ========================================

  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    seller,
    buyer,
    payment,
    lines,
    [],
    CurrencyCode.USD       // Invoice currency is USD
  );

  // ========================================
  // 7. CALCULATE TOTALS (Calculer les totaux)
  // ========================================

  const totals = invoice.finalizeTotals();

  console.log('📊 TOTALS:\n');
  console.log('  Currency: USD (United States Dollar)');
  console.log('  - Total USD:           $', totals.taxBasis.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('  - VAT (0% - Export):   $', totals.taxTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('  - Grand Total USD:     $', totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));

  console.log('\n  Informational EUR conversion:');
  console.log('  - Total EUR (≈):        €', (totals.taxBasis * exchangeRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 }));
  console.log('  - Grand Total EUR (≈):  €', (totals.grandTotal * exchangeRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 }));

  console.log('\n🌍 INTERNATIONAL TRANSACTION:');
  console.log('  - Seller Country:    France (FR)');
  console.log('  - Buyer Country:     United States (US)');
  console.log('  - Invoice Currency:  USD');
  console.log('  - VAT Status:        Export - 0% VAT');
  console.log('  - Payment Terms:     NET 30 days');

  // ========================================
  // 8. GENERATE XML (Générer le XML Factur-X)
  // ========================================

  const xml = invoice.generateXml(false);

  // Save XML to file
  const xmlPath = join(__dirname, 'output', '05-multi-currency-invoice.xml');
  writeFileSync(xmlPath, xml, 'utf-8');

  console.log('\n✅ Multi-currency invoice generated successfully!');
  console.log('📄 File:', xmlPath);
  console.log('\n💡 TIP: For export invoices, VAT is typically 0% (Tax Category: E)');
  console.log('💡 TIP: The library supports 30+ currencies including:');
  console.log('   EUR, USD, GBP, CHF, JPY, CAD, AUD, CNY, INR, and more!');

  return {
    invoice,
    xml,
    totals,
    exchangeRate,
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

  generateMultiCurrencyInvoice()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Example 05 completed successfully!');
      console.log('='.repeat(60));
    })
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

export { generateMultiCurrencyInvoice };
