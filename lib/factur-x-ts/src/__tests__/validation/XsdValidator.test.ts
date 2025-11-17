import {
  XsdValidator,
  getDefaultValidator,
  validateXml,
  validateXmlAsync,
} from '../../validation/XsdValidator';
import { FacturxProfile } from '../../types';

describe('XsdValidator', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const validator = new XsdValidator();
      const stats = validator.getCacheStats();
      expect(stats.capacity).toBe(100);
      expect(stats.size).toBe(0);
    });

    it('should initialize with custom cache size', () => {
      const validator = new XsdValidator({ cacheSize: 50 });
      const stats = validator.getCacheStats();
      expect(stats.capacity).toBe(50);
    });

    it('should initialize with cache disabled', () => {
      const validator = new XsdValidator({ enableCache: false });
      const xml = createValidMinimalXml();
      const result1 = validator.validate(xml, FacturxProfile.MINIMUM);
      const result2 = validator.validate(xml, FacturxProfile.MINIMUM);
      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(false);
    });

    it('should initialize with strict mode enabled', () => {
      const validator = new XsdValidator({ strictMode: true });
      expect(validator).toBeDefined();
    });

    it('should initialize with validateExtensions enabled', () => {
      const validator = new XsdValidator({ validateExtensions: true });
      expect(validator).toBeDefined();
    });
  });

  describe('validate - valid XML', () => {
    let validator: XsdValidator;

    beforeEach(() => {
      validator = new XsdValidator();
    });

    it('should validate minimal MINIMUM profile XML', () => {
      const xml = createValidMinimalXml();
      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
      expect(result.cached).toBe(false);
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should validate BASICWL profile XML', () => {
      const xml = createValidBasicWLXml();
      const result = validator.validate(xml, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.profile).toBe(FacturxProfile.BASICWL);
    });

    it('should validate BASIC profile XML', () => {
      const xml = createValidBasicXml();
      const result = validator.validate(xml, FacturxProfile.BASIC);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.profile).toBe(FacturxProfile.BASIC);
    });

    it('should validate EN16931 profile XML', () => {
      const xml = createValidEN16931Xml();
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.profile).toBe(FacturxProfile.EN16931);
    });

    it('should validate EXTENDED profile XML', () => {
      const xml = createValidExtendedXml();
      const result = validator.validate(xml, FacturxProfile.EXTENDED);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.profile).toBe(FacturxProfile.EXTENDED);
    });
  });

  describe('validate - invalid XML syntax', () => {
    let validator: XsdValidator;

    beforeEach(() => {
      validator = new XsdValidator();
    });

    it('should fail on malformed XML', () => {
      const xml = '<invalid>unclosed tag';
      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('XML_SYNTAX_ERROR');
      expect(result.errors[0].severity).toBe('error');
    });

    it('should fail on XML with mismatched tags', () => {
      const xml = '<root><child></child2></root>';
      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('XML_SYNTAX_ERROR');
    });

    it('should fail on empty string', () => {
      const xml = '';
      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include line and column in syntax errors', () => {
      const xml = '<invalid>unclosed tag';
      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.errors[0].line).toBeDefined();
      expect(result.errors[0].column).toBeDefined();
    });
  });

  describe('validate - missing required elements', () => {
    let validator: XsdValidator;

    beforeEach(() => {
      validator = new XsdValidator();
    });

    it('should fail when MINIMUM profile missing ID', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:TypeCode>380</ram:TypeCode>
  </rsm:ExchangedDocument>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'REQUIRED_ELEMENT_MISSING')).toBe(true);
      expect(result.errors.some(e => e.message.includes('ram:ID'))).toBe(true);
    });

    it('should fail when BASICWL profile missing IssueDateTime', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext></rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction></rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validate(xml, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('IssueDateTime'))).toBe(true);
    });

    it('should fail when EN16931 profile missing currency', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20250101</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>Seller</ram:Name></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>Buyer</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount>20.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>120.00</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('InvoiceCurrencyCode'))).toBe(true);
    });
  });

  describe('validate - invalid data types', () => {
    let validator: XsdValidator;

    beforeEach(() => {
      validator = new XsdValidator();
    });

    it('should fail on invalid currency code', () => {
      const xml = createValidEN16931Xml().replace('EUR', 'INVALID');
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_CURRENCY_CODE')).toBe(true);
    });

    it('should fail on invalid amount format', () => {
      const xml = createValidEN16931Xml().replace('100.00', 'not-a-number');
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_AMOUNT_FORMAT')).toBe(true);
    });

    it('should fail on invalid date format', () => {
      const xml = createValidEN16931Xml().replace('20250101', 'invalid-date');
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_DATE_FORMAT')).toBe(true);
    });

    it('should accept valid date format YYYYMMDD', () => {
      const xml = createValidEN16931Xml();
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(true);
    });

    it('should accept valid date format YYYY-MM-DD', () => {
      const xml = createValidEN16931Xml().replace('20250101', '2025-01-01');
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validate - namespace validation', () => {
    let validator: XsdValidator;

    beforeEach(() => {
      validator = new XsdValidator();
    });

    it('should fail on missing namespace declaration', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">
  <rsm:ExchangedDocumentContext></rsm:ExchangedDocumentContext>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_NAMESPACE')).toBe(true);
    });

    it('should fail on incorrect namespace URI', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="http://wrong.namespace.uri"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
  </rsm:ExchangedDocument>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_NAMESPACE_URI')).toBe(true);
    });
  });

  describe('validate - business rules', () => {
    let validator: XsdValidator;

    beforeEach(() => {
      validator = new XsdValidator();
    });

    it('should warn when grand total does not match tax basis + tax', () => {
      const xml = createValidEN16931Xml()
        .replace('<ram:GrandTotalAmount>120.00</ram:GrandTotalAmount>', '<ram:GrandTotalAmount>999.99</ram:GrandTotalAmount>');

      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Grand total'))).toBe(true);
    });

    it('should pass when grand total matches tax basis + tax', () => {
      const xml = createValidEN16931Xml();
      const result = validator.validate(xml, FacturxProfile.EN16931);

      // Should still be valid (warnings don't make it invalid)
      expect(result.isValid).toBe(true);
    });

    it('should fail when seller name is missing', () => {
      const xml = createValidEN16931Xml().replace('<ram:Name>ACME Corp</ram:Name>', '');
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_SELLER_NAME')).toBe(true);
    });

    it('should fail when buyer name is missing', () => {
      const xml = createValidEN16931Xml()
        .replace(/<ram:BuyerTradeParty>[\s\S]*?<\/ram:BuyerTradeParty>/, '<ram:BuyerTradeParty></ram:BuyerTradeParty>');
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_BUYER_NAME')).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache validation results', () => {
      const validator = new XsdValidator({ cacheSize: 10 });
      const xml = createValidMinimalXml();

      const result1 = validator.validate(xml, FacturxProfile.MINIMUM);
      expect(result1.cached).toBe(false);

      const result2 = validator.validate(xml, FacturxProfile.MINIMUM);
      expect(result2.cached).toBe(true);
    });

    it('should not cache when cache is disabled', () => {
      const validator = new XsdValidator({ enableCache: false });
      const xml = createValidMinimalXml();

      const result1 = validator.validate(xml, FacturxProfile.MINIMUM);
      const result2 = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(false);
    });

    it('should evict LRU items when cache is full', () => {
      const validator = new XsdValidator({ cacheSize: 2 });

      // Add 3 items to cache of size 2
      const xml1 = createValidMinimalXml();
      const xml2 = xml1.replace('INV-001', 'INV-002');
      const xml3 = xml1.replace('INV-001', 'INV-003');

      validator.validate(xml1, FacturxProfile.MINIMUM);
      validator.validate(xml2, FacturxProfile.MINIMUM);
      validator.validate(xml3, FacturxProfile.MINIMUM); // This should evict xml1

      const stats = validator.getCacheStats();
      expect(stats.size).toBe(2);

      // xml1 should no longer be cached
      const result1 = validator.validate(xml1, FacturxProfile.MINIMUM);
      expect(result1.cached).toBe(false);
    });

    it('should clear cache', () => {
      const validator = new XsdValidator();
      const xml = createValidMinimalXml();

      validator.validate(xml, FacturxProfile.MINIMUM);
      let stats = validator.getCacheStats();
      expect(stats.size).toBe(1);

      validator.clearCache();
      stats = validator.getCacheStats();
      expect(stats.size).toBe(0);

      // Next validation should not be cached
      const result = validator.validate(xml, FacturxProfile.MINIMUM);
      expect(result.cached).toBe(false);
    });

    it('should have different cache keys for different profiles', () => {
      const validator = new XsdValidator();
      const xml = createValidEN16931Xml();

      const result1 = validator.validate(xml, FacturxProfile.EN16931);
      const result2 = validator.validate(xml, FacturxProfile.EXTENDED);

      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(false);

      const stats = validator.getCacheStats();
      expect(stats.size).toBe(2);
    });

    it('should move accessed items to head (LRU)', () => {
      const validator = new XsdValidator({ cacheSize: 2 });

      const xml1 = createValidMinimalXml();
      const xml2 = xml1.replace('INV-001', 'INV-002');
      const xml3 = xml1.replace('INV-001', 'INV-003');

      // Add xml1 and xml2 to cache
      validator.validate(xml1, FacturxProfile.MINIMUM);
      validator.validate(xml2, FacturxProfile.MINIMUM);

      // Access xml1 (moves to head)
      validator.validate(xml1, FacturxProfile.MINIMUM);

      // Add xml3 (should evict xml2, not xml1)
      validator.validate(xml3, FacturxProfile.MINIMUM);

      // xml1 should still be cached
      const result1 = validator.validate(xml1, FacturxProfile.MINIMUM);
      expect(result1.cached).toBe(true);

      // xml2 should have been evicted
      const result2 = validator.validate(xml2, FacturxProfile.MINIMUM);
      expect(result2.cached).toBe(false);
    });
  });

  describe('validateAsync', () => {
    it('should validate asynchronously', async () => {
      const validator = new XsdValidator();
      const xml = createValidMinimalXml();

      const result = await validator.validateAsync(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(true);
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
    });

    it('should return cached results asynchronously', async () => {
      const validator = new XsdValidator();
      const xml = createValidMinimalXml();

      await validator.validateAsync(xml, FacturxProfile.MINIMUM);
      const result = await validator.validateAsync(xml, FacturxProfile.MINIMUM);

      expect(result.cached).toBe(true);
    });

    it('should handle validation errors asynchronously', async () => {
      const validator = new XsdValidator();
      const xml = '<invalid>xml';

      const result = await validator.validateAsync(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple documents', () => {
      const validator = new XsdValidator();
      const xml1 = createValidMinimalXml();
      const xml2 = xml1.replace('INV-001', 'INV-002');

      const results = validator.validateBatch([
        { xml: xml1, profile: FacturxProfile.MINIMUM },
        { xml: xml2, profile: FacturxProfile.MINIMUM },
      ]);

      expect(results.length).toBe(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
    });

    it('should handle mixed valid/invalid documents', () => {
      const validator = new XsdValidator();
      const validXml = createValidMinimalXml();
      const invalidXml = '<invalid>xml';

      const results = validator.validateBatch([
        { xml: validXml, profile: FacturxProfile.MINIMUM },
        { xml: invalidXml, profile: FacturxProfile.MINIMUM },
      ]);

      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });

    it('should validate empty batch', () => {
      const validator = new XsdValidator();
      const results = validator.validateBatch([]);

      expect(results.length).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return correct cache statistics', () => {
      const validator = new XsdValidator({ cacheSize: 50 });
      const stats = validator.getCacheStats();

      expect(stats.capacity).toBe(50);
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should update cache size after validations', () => {
      const validator = new XsdValidator();
      const xml1 = createValidMinimalXml();
      const xml2 = xml1.replace('INV-001', 'INV-002');

      validator.validate(xml1, FacturxProfile.MINIMUM);
      validator.validate(xml2, FacturxProfile.MINIMUM);

      const stats = validator.getCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('result immutability', () => {
    it('should freeze error arrays', () => {
      const validator = new XsdValidator();
      const xml = '<invalid>xml';

      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(Object.isFrozen(result.errors)).toBe(true);
      expect(Object.isFrozen(result.warnings)).toBe(true);
    });

    it('should freeze error arrays in valid results', () => {
      const validator = new XsdValidator();
      const xml = createValidMinimalXml();

      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(Object.isFrozen(result.errors)).toBe(true);
      expect(Object.isFrozen(result.warnings)).toBe(true);
    });
  });

  describe('getDefaultValidator', () => {
    it('should return singleton instance', () => {
      const validator1 = getDefaultValidator();
      const validator2 = getDefaultValidator();

      expect(validator1).toBe(validator2);
    });

    it('should return working validator', () => {
      const validator = getDefaultValidator();
      const xml = createValidMinimalXml();

      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateXml convenience function', () => {
    it('should validate using default validator', () => {
      const xml = createValidMinimalXml();
      const result = validateXml(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(true);
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
    });

    it('should handle invalid XML', () => {
      const xml = '<invalid>xml';
      const result = validateXml(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateXmlAsync convenience function', () => {
    it('should validate asynchronously using default validator', async () => {
      const xml = createValidMinimalXml();
      const result = await validateXmlAsync(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(true);
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
    });

    it('should handle invalid XML asynchronously', async () => {
      const xml = '<invalid>xml';
      const result = await validateXmlAsync(xml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createValidMinimalXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>ACME Corp</ram:Name>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Client Ltd</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

function createValidBasicWLXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext></rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20250101</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>ACME Corp</ram:Name>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Client Ltd</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

function createValidBasicXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext></rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20250101</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>ACME Corp</ram:Name>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Client Ltd</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

function createValidEN16931Xml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20250101</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>ACME Corp</ram:Name>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Client Ltd</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount>20.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>120.00</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

function createValidExtendedXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:extended</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20250101</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>ACME Corp</ram:Name>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Client Ltd</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
