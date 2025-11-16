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
} from './src';

const addr = PostalAddressImpl.builder()
  .city('Paris')
  .postalCode('75001')
  .countryCode('FR')
  .build();

const seller = TradePartyImpl.builder()
  .name('Test Seller')
  .address(addr)
  .vatId('FR123')
  .email('test@test.fr')
  .build();

const buyer = TradePartyImpl.builder()
  .name('Test Client')
  .address(addr)
  .email('client@test.fr')
  .build();

const payment = PaymentDetailsImpl.builder()
  .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
  .build();

const header = DocumentHeaderImpl.builder()
  .id('TEST-001')
  .invoiceNumber('TEST-001')
  .invoiceDate(new Date())
  .typeCode(DocTypeCode.INVOICE)
  .build();

const line = new InvoiceLineImpl('L1', 'Test Product', 1, 100, 0.20);

const invoice = new FacturXInvoice(
  FacturxProfile.BASIC,
  header,
  seller,
  buyer,
  payment,
  [line],
  [],
  CurrencyCode.EUR
);

console.log('Testing XML validation...');

// IMPORTANT: Must finalize totals BEFORE generating XML with validation!
invoice.finalizeTotals();

try {
  const xml = invoice.generateXml(true); // WITH validation
  console.log('✅ XML validation PASSED');
  console.log('XML length:', xml.length, 'bytes');
  console.log('First 200 chars:', xml.substring(0, 200));
} catch (error) {
  console.log('❌ XML validation FAILED:');
  console.log(error);
}
