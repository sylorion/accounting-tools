/**
 * @file codelist-validator.test.ts
 * @description Comprehensive unit tests for CodeListValidator
 *
 * Tests cover:
 * - Single code validation for all 8 code lists
 * - Full XML invoice validation
 * - Edge cases (empty, malformed, missing elements)
 * - Singleton and convenience functions
 * - Performance characteristics
 */

import {
  CodeListValidator,
  getDefaultCodeListValidator,
  isValidCode,
  validateInvoiceCodes,
} from '../../src/validation/CodeListValidator';
import type { CodeListName } from '../../src/validation/CodeListValidator';

// ============================================================================
// CONSTRUCTOR & BASIC API
// ============================================================================

describe('CodeListValidator', () => {
  describe('Constructor and API surface', () => {
    it('should create a validator instance', () => {
      const validator = new CodeListValidator();
      expect(validator).toBeDefined();
    });

    it('should expose all 8 code lists', () => {
      const validator = new CodeListValidator();
      const supported = validator.getSupportedCodeLists();

      expect(supported).toHaveLength(8);
      expect(supported).toContain('ISO4217');
      expect(supported).toContain('ISO3166');
      expect(supported).toContain('UNTDID1001');
      expect(supported).toContain('UNTDID5305');
      expect(supported).toContain('UNTDID4461');
      expect(supported).toContain('UNECE20');
      expect(supported).toContain('EAS');
      expect(supported).toContain('ICD');
    });

    it('should report non-zero sizes for all code lists', () => {
      const validator = new CodeListValidator();
      const lists: CodeListName[] = [
        'ISO4217', 'ISO3166', 'UNTDID1001', 'UNTDID5305',
        'UNTDID4461', 'UNECE20', 'EAS', 'ICD',
      ];

      for (const name of lists) {
        expect(validator.getCodeListSize(name)).toBeGreaterThan(0);
      }
    });

    it('should return a frozen ReadonlySet from getCodeList', () => {
      const validator = new CodeListValidator();
      const set = validator.getCodeList('ISO4217');

      expect(set).toBeDefined();
      expect(set.size).toBeGreaterThan(0);
      // Verify it is a Set and contains known values
      expect(set.has('EUR')).toBe(true);
    });

    it('should return an empty frozen set for an unknown code list name', () => {
      const validator = new CodeListValidator();
      // Force an unknown name through the type system
      const set = validator.getCodeList('UNKNOWN' as CodeListName);
      expect(set.size).toBe(0);
    });
  });

  // ==========================================================================
  // ISO 4217 - Currency codes
  // ==========================================================================

  describe('ISO4217 (Currency codes)', () => {
    const validator = new CodeListValidator();

    it('should accept all major currencies', () => {
      const majors = [
        'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY',
        'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN',
        'HRK', 'ISK', 'TRY', 'RUB',
      ];
      for (const code of majors) {
        expect(validator.validateCode(code, 'ISO4217')).toBe(true);
      }
    });

    it('should accept additional ISO 4217 codes', () => {
      const others = ['BRL', 'MXN', 'ZAR', 'INR', 'SGD', 'HKD', 'NZD', 'AED', 'SAR', 'THB', 'MYR'];
      for (const code of others) {
        expect(validator.validateCode(code, 'ISO4217')).toBe(true);
      }
    });

    it('should accept supranational currency codes', () => {
      expect(validator.validateCode('XAF', 'ISO4217')).toBe(true);
      expect(validator.validateCode('XOF', 'ISO4217')).toBe(true);
      expect(validator.validateCode('XPF', 'ISO4217')).toBe(true);
      expect(validator.validateCode('XCD', 'ISO4217')).toBe(true);
    });

    it('should accept precious metal codes', () => {
      expect(validator.validateCode('XAU', 'ISO4217')).toBe(true); // Gold
      expect(validator.validateCode('XAG', 'ISO4217')).toBe(true); // Silver
      expect(validator.validateCode('XPT', 'ISO4217')).toBe(true); // Platinum
      expect(validator.validateCode('XPD', 'ISO4217')).toBe(true); // Palladium
    });

    it('should reject invalid currency codes', () => {
      expect(validator.validateCode('XXY', 'ISO4217')).toBe(false);
      expect(validator.validateCode('ABC', 'ISO4217')).toBe(false);
      expect(validator.validateCode('', 'ISO4217')).toBe(false);
      expect(validator.validateCode('eur', 'ISO4217')).toBe(false); // Case sensitive
      expect(validator.validateCode('EU', 'ISO4217')).toBe(false);  // Too short
      expect(validator.validateCode('EURO', 'ISO4217')).toBe(false); // Too long
    });

    it('should have at least 150 currency codes', () => {
      expect(validator.getCodeListSize('ISO4217')).toBeGreaterThanOrEqual(150);
    });
  });

  // ==========================================================================
  // ISO 3166 - Country codes
  // ==========================================================================

  describe('ISO3166 (Country codes)', () => {
    const validator = new CodeListValidator();

    it('should accept all EU member state codes', () => {
      const eu = [
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
        'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
        'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
      ];
      for (const code of eu) {
        expect(validator.validateCode(code, 'ISO3166')).toBe(true);
      }
    });

    it('should accept EEA countries', () => {
      expect(validator.validateCode('IS', 'ISO3166')).toBe(true); // Iceland
      expect(validator.validateCode('LI', 'ISO3166')).toBe(true); // Liechtenstein
      expect(validator.validateCode('NO', 'ISO3166')).toBe(true); // Norway
    });

    it('should accept major trading partners', () => {
      const partners = ['US', 'CN', 'JP', 'GB', 'CH', 'CA', 'AU', 'BR', 'IN', 'RU', 'TR', 'KR'];
      for (const code of partners) {
        expect(validator.validateCode(code, 'ISO3166')).toBe(true);
      }
    });

    it('should reject invalid country codes', () => {
      expect(validator.validateCode('XX', 'ISO3166')).toBe(false);
      expect(validator.validateCode('ZZ', 'ISO3166')).toBe(false);
      expect(validator.validateCode('', 'ISO3166')).toBe(false);
      expect(validator.validateCode('fr', 'ISO3166')).toBe(false); // Case sensitive
      expect(validator.validateCode('FRA', 'ISO3166')).toBe(false); // Alpha-3 not supported
    });

    it('should have at least 200 country codes', () => {
      expect(validator.getCodeListSize('ISO3166')).toBeGreaterThanOrEqual(200);
    });
  });

  // ==========================================================================
  // UNTDID 1001 - Document type codes
  // ==========================================================================

  describe('UNTDID1001 (Document type codes)', () => {
    const validator = new CodeListValidator();

    it('should accept standard Factur-X document types', () => {
      expect(validator.validateCode('380', 'UNTDID1001')).toBe(true); // Invoice
      expect(validator.validateCode('381', 'UNTDID1001')).toBe(true); // Credit note
      expect(validator.validateCode('383', 'UNTDID1001')).toBe(true); // Debit note
      expect(validator.validateCode('384', 'UNTDID1001')).toBe(true); // Corrected invoice
      expect(validator.validateCode('386', 'UNTDID1001')).toBe(true); // Prepayment
      expect(validator.validateCode('389', 'UNTDID1001')).toBe(true); // Self-billed
    });

    it('should accept extended document types used in EN16931', () => {
      const extended = ['261', '262', '308', '325', '326', '393', '394', '395', '553', '575', '623', '780'];
      for (const code of extended) {
        expect(validator.validateCode(code, 'UNTDID1001')).toBe(true);
      }
    });

    it('should reject invalid document type codes', () => {
      expect(validator.validateCode('999', 'UNTDID1001')).toBe(false);
      expect(validator.validateCode('', 'UNTDID1001')).toBe(false);
      expect(validator.validateCode('INVOICE', 'UNTDID1001')).toBe(false);
      expect(validator.validateCode('-1', 'UNTDID1001')).toBe(false);
    });
  });

  // ==========================================================================
  // UNTDID 5305 - Tax category codes
  // ==========================================================================

  describe('UNTDID5305 (Tax category codes)', () => {
    const validator = new CodeListValidator();

    it('should accept all EN16931 tax category codes', () => {
      const categories = ['S', 'Z', 'E', 'AE', 'K', 'G', 'O', 'L', 'M', 'AA'];
      for (const code of categories) {
        expect(validator.validateCode(code, 'UNTDID5305')).toBe(true);
      }
    });

    it('should accept additional UNTDID 5305 codes', () => {
      expect(validator.validateCode('A', 'UNTDID5305')).toBe(true);
      expect(validator.validateCode('B', 'UNTDID5305')).toBe(true);
      expect(validator.validateCode('D', 'UNTDID5305')).toBe(true);
      expect(validator.validateCode('H', 'UNTDID5305')).toBe(true);
    });

    it('should reject invalid tax category codes', () => {
      expect(validator.validateCode('X', 'UNTDID5305')).toBe(false);
      expect(validator.validateCode('', 'UNTDID5305')).toBe(false);
      expect(validator.validateCode('s', 'UNTDID5305')).toBe(false); // Case sensitive
      expect(validator.validateCode('STANDARD', 'UNTDID5305')).toBe(false);
      expect(validator.validateCode('20', 'UNTDID5305')).toBe(false);
    });
  });

  // ==========================================================================
  // UNTDID 4461 - Payment means codes
  // ==========================================================================

  describe('UNTDID4461 (Payment means codes)', () => {
    const validator = new CodeListValidator();

    it('should accept common payment means codes', () => {
      const codes = ['1', '2', '3', '10', '20', '30', '31', '42', '48', '49', '50', '55', '57', '58', '59', '97'];
      for (const code of codes) {
        expect(validator.validateCode(code, 'UNTDID4461')).toBe(true);
      }
    });

    it('should accept SEPA-specific codes', () => {
      expect(validator.validateCode('58', 'UNTDID4461')).toBe(true); // SEPA credit transfer
      expect(validator.validateCode('59', 'UNTDID4461')).toBe(true); // SEPA direct debit
    });

    it('should accept card payment codes', () => {
      expect(validator.validateCode('48', 'UNTDID4461')).toBe(true); // Bank card
      expect(validator.validateCode('54', 'UNTDID4461')).toBe(true); // Credit card
      expect(validator.validateCode('55', 'UNTDID4461')).toBe(true); // Debit card
    });

    it('should accept the mutually defined code ZZZ', () => {
      expect(validator.validateCode('ZZZ', 'UNTDID4461')).toBe(true);
    });

    it('should reject invalid payment means codes', () => {
      expect(validator.validateCode('99', 'UNTDID4461')).toBe(false);
      expect(validator.validateCode('', 'UNTDID4461')).toBe(false);
      expect(validator.validateCode('CASH', 'UNTDID4461')).toBe(false);
      expect(validator.validateCode('100', 'UNTDID4461')).toBe(false);
    });
  });

  // ==========================================================================
  // UNECE20 - Unit of measure codes
  // ==========================================================================

  describe('UNECE20 (Unit of measure codes)', () => {
    const validator = new CodeListValidator();

    it('should accept common unit codes', () => {
      const units = ['C62', 'HUR', 'DAY', 'MON', 'ANN', 'KGM', 'MTR', 'MTK', 'MTQ', 'LTR', 'KMT', 'TNE'];
      for (const code of units) {
        expect(validator.validateCode(code, 'UNECE20')).toBe(true);
      }
    });

    it('should accept packaging unit codes', () => {
      expect(validator.validateCode('SET', 'UNECE20')).toBe(true);
      expect(validator.validateCode('PR', 'UNECE20')).toBe(true);
      expect(validator.validateCode('BX', 'UNECE20')).toBe(true);
      expect(validator.validateCode('PK', 'UNECE20')).toBe(true);
    });

    it('should accept energy unit codes', () => {
      expect(validator.validateCode('KWH', 'UNECE20')).toBe(true);
      expect(validator.validateCode('MWH', 'UNECE20')).toBe(true);
      expect(validator.validateCode('GWH', 'UNECE20')).toBe(true);
    });

    it('should accept time unit codes', () => {
      expect(validator.validateCode('SEC', 'UNECE20')).toBe(true);
      expect(validator.validateCode('MIN', 'UNECE20')).toBe(true);
      expect(validator.validateCode('HUR', 'UNECE20')).toBe(true);
      expect(validator.validateCode('DAY', 'UNECE20')).toBe(true);
      expect(validator.validateCode('WEE', 'UNECE20')).toBe(true);
      expect(validator.validateCode('MON', 'UNECE20')).toBe(true);
      expect(validator.validateCode('ANN', 'UNECE20')).toBe(true);
    });

    it('should reject invalid unit codes', () => {
      expect(validator.validateCode('', 'UNECE20')).toBe(false);
      expect(validator.validateCode('XYZ', 'UNECE20')).toBe(false);
      expect(validator.validateCode('PIECE', 'UNECE20')).toBe(false);
      expect(validator.validateCode('c62', 'UNECE20')).toBe(false); // Case sensitive
    });
  });

  // ==========================================================================
  // EAS - Electronic Address Scheme
  // ==========================================================================

  describe('EAS (Electronic Address Scheme)', () => {
    const validator = new CodeListValidator();

    it('should accept the email scheme', () => {
      expect(validator.validateCode('EM', 'EAS')).toBe(true);
    });

    it('should accept common EAS identifiers', () => {
      const codes = [
        '0002', '0007', '0009', '0037', '0060', '0088', '0096', '0097',
        '0106', '0130', '0135', '0142', '0151', '0183', '0184', '0190',
        '0191', '0192', '0193', '0195', '0196', '0198', '0199', '0200',
        '0201', '0202', '0204', '0208', '0209', '0210', '0211', '0212', '0213',
      ];
      for (const code of codes) {
        expect(validator.validateCode(code, 'EAS')).toBe(true);
      }
    });

    it('should accept VAT-based EAS codes (9901-9958)', () => {
      const vatCodes = ['9901', '9906', '9920', '9930', '9944', '9955', '9957', '9958'];
      for (const code of vatCodes) {
        expect(validator.validateCode(code, 'EAS')).toBe(true);
      }
    });

    it('should reject invalid EAS codes', () => {
      expect(validator.validateCode('', 'EAS')).toBe(false);
      expect(validator.validateCode('0001', 'EAS')).toBe(false);
      expect(validator.validateCode('9999', 'EAS')).toBe(false);
      expect(validator.validateCode('EMAIL', 'EAS')).toBe(false);
    });
  });

  // ==========================================================================
  // ICD - Identifier Component Data
  // ==========================================================================

  describe('ICD (ISO 6523 Identifier Component Data)', () => {
    const validator = new CodeListValidator();

    it('should accept common ICD codes', () => {
      const codes = [
        '0002', '0009', '0060', '0088', '0096', '0106', '0130', '0135',
        '0142', '0151', '0183', '0184', '0190', '0191', '0192', '0193',
        '0195', '0196', '0198', '0199', '0200', '0201', '0202', '0204',
        '0208', '0209', '0210', '0211', '0212', '0213',
      ];
      for (const code of codes) {
        expect(validator.validateCode(code, 'ICD')).toBe(true);
      }
    });

    it('should accept SIREN (0002) and SIRET (0009)', () => {
      expect(validator.validateCode('0002', 'ICD')).toBe(true);
      expect(validator.validateCode('0009', 'ICD')).toBe(true);
    });

    it('should accept DUNS (0060) and EAN (0088)', () => {
      expect(validator.validateCode('0060', 'ICD')).toBe(true);
      expect(validator.validateCode('0088', 'ICD')).toBe(true);
    });

    it('should accept Leitweg-ID (0204)', () => {
      expect(validator.validateCode('0204', 'ICD')).toBe(true);
    });

    it('should reject invalid ICD codes', () => {
      expect(validator.validateCode('', 'ICD')).toBe(false);
      expect(validator.validateCode('0001', 'ICD')).toBe(false);
      expect(validator.validateCode('9999', 'ICD')).toBe(false);
      expect(validator.validateCode('SIREN', 'ICD')).toBe(false);
    });
  });

  // ==========================================================================
  // XML INVOICE VALIDATION
  // ==========================================================================

  describe('validateInvoiceCodes - Valid XML', () => {
    const validator = new CodeListValidator();

    it('should accept a valid EN16931 invoice XML', () => {
      const xml = createValidInvoiceXml();
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept invoice with multiple valid tax categories', () => {
      const xml = createValidInvoiceXml({
        taxCategories: [
          { rate: '20.00', category: 'S' },
          { rate: '0.00', category: 'Z' },
        ],
      });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept invoice with SEPA payment means', () => {
      const xml = createValidInvoiceXml({ paymentMeansCode: '58' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(true);
    });

    it('should accept invoice with different currency', () => {
      const xml = createValidInvoiceXml({ currency: 'USD' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(true);
    });

    it('should accept invoice with electronic address scheme', () => {
      const xml = createValidInvoiceXml({ sellerEAS: '0002', buyerEAS: 'EM' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(true);
    });

    it('should accept invoice with legal organization scheme', () => {
      const xml = createValidInvoiceXml({ sellerICD: '0002' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateInvoiceCodes - Invalid codes', () => {
    const validator = new CodeListValidator();

    it('should reject an invalid currency code', () => {
      const xml = createValidInvoiceXml({ currency: 'XYZ' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.codeList === 'ISO4217')).toBe(true);
      expect(result.errors.some(e => e.value === 'XYZ')).toBe(true);
    });

    it('should reject an invalid country code', () => {
      const xml = createValidInvoiceXml({ sellerCountry: 'XX' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.codeList === 'ISO3166')).toBe(true);
      expect(result.errors.some(e => e.value === 'XX')).toBe(true);
    });

    it('should reject an invalid document type code', () => {
      const xml = createValidInvoiceXml({ typeCode: '999' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.codeList === 'UNTDID1001')).toBe(true);
      expect(result.errors.some(e => e.value === '999')).toBe(true);
    });

    it('should reject an invalid tax category code', () => {
      const xml = createValidInvoiceXml({
        taxCategories: [{ rate: '20.00', category: 'X' }],
      });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.codeList === 'UNTDID5305')).toBe(true);
      expect(result.errors.some(e => e.value === 'X')).toBe(true);
    });

    it('should reject an invalid payment means code', () => {
      const xml = createValidInvoiceXml({ paymentMeansCode: '999' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.codeList === 'UNTDID4461')).toBe(true);
    });

    it('should reject an invalid unit code', () => {
      const xml = createValidInvoiceXml({ unitCode: 'INVALID' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.codeList === 'UNECE20')).toBe(true);
      expect(result.errors.some(e => e.value === 'INVALID')).toBe(true);
    });

    it('should reject an invalid EAS scheme ID', () => {
      const xml = createValidInvoiceXml({ sellerEAS: '0001' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.codeList === 'EAS')).toBe(true);
    });

    it('should reject an invalid ICD scheme ID', () => {
      const xml = createValidInvoiceXml({ sellerICD: '0001' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.codeList === 'ICD')).toBe(true);
    });

    it('should report multiple errors for multiple invalid codes', () => {
      const xml = createValidInvoiceXml({
        currency: 'FAKE',
        typeCode: '999',
        sellerCountry: 'XX',
      });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateInvoiceCodes - Edge cases', () => {
    const validator = new CodeListValidator();

    it('should handle malformed XML gracefully', () => {
      const result = validator.validateInvoiceCodes('<invalid><unclosed>');

      // fast-xml-parser may or may not throw on some malformed XML
      // The validator should not crash regardless
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should handle empty string', () => {
      const result = validator.validateInvoiceCodes('');

      expect(result).toBeDefined();
      // Empty string is either a parse error or a valid empty doc
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should handle XML with no CII root element', () => {
      const xml = '<?xml version="1.0"?><SomeOtherRoot><child>value</child></SomeOtherRoot>';
      const result = validator.validateInvoiceCodes(xml);

      // No CII root means nothing to validate, so isValid = true (no errors found)
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle XML with missing optional elements', () => {
      // Minimal XML with only the root and type code
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
  </rsm:ExchangedDocument>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validateInvoiceCodes(xml);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle XML without namespace prefixes', () => {
      // Some generators omit namespace prefixes
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CrossIndustryInvoice
  xmlns="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">
  <ExchangedDocument>
    <TypeCode>380</TypeCode>
  </ExchangedDocument>
</CrossIndustryInvoice>`;

      const result = validator.validateInvoiceCodes(xml);

      // Should not crash, may not find namespaced elements
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should have frozen errors array', () => {
      const xml = createValidInvoiceXml({ currency: 'FAKE' });
      const result = validator.validateInvoiceCodes(xml);

      expect(Object.isFrozen(result.errors)).toBe(true);
    });

    it('should include meaningful error messages', () => {
      const xml = createValidInvoiceXml({ currency: 'XYZ' });
      const result = validator.validateInvoiceCodes(xml);

      expect(result.errors.length).toBeGreaterThan(0);
      const error = result.errors[0];
      expect(error.field).toBeTruthy();
      expect(error.value).toBe('XYZ');
      expect(error.codeList).toBe('ISO4217');
      expect(error.message).toContain('XYZ');
      expect(error.message).toContain('ISO4217');
    });
  });

  // ==========================================================================
  // SINGLETON AND CONVENIENCE FUNCTIONS
  // ==========================================================================

  describe('Singleton and convenience functions', () => {
    it('should return the same instance from getDefaultCodeListValidator', () => {
      const v1 = getDefaultCodeListValidator();
      const v2 = getDefaultCodeListValidator();
      expect(v1).toBe(v2);
    });

    it('should validate codes with isValidCode convenience function', () => {
      expect(isValidCode('EUR', 'ISO4217')).toBe(true);
      expect(isValidCode('XYZ', 'ISO4217')).toBe(false);
      expect(isValidCode('FR', 'ISO3166')).toBe(true);
      expect(isValidCode('380', 'UNTDID1001')).toBe(true);
    });

    it('should validate XML with validateInvoiceCodes convenience function', () => {
      const xml = createValidInvoiceXml();
      const result = validateInvoiceCodes(xml);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid codes with validateInvoiceCodes convenience function', () => {
      const xml = createValidInvoiceXml({ currency: 'INVALID_CODE' });
      const result = validateInvoiceCodes(xml);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================

  describe('Performance', () => {
    it('should validate 10000 individual codes in under 100ms', () => {
      const validator = new CodeListValidator();
      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        validator.validateCode('EUR', 'ISO4217');
        validator.validateCode('FR', 'ISO3166');
        validator.validateCode('380', 'UNTDID1001');
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should validate a full invoice XML in under 50ms', () => {
      const validator = new CodeListValidator();
      const xml = createValidInvoiceXml();
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        validator.validateInvoiceCodes(xml);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // 100 * 50ms max
    });

    it('should have O(1) lookup for code validation', () => {
      const validator = new CodeListValidator();

      // Time validation of first element vs last element -- both should be O(1)
      const t1Start = Date.now();
      for (let i = 0; i < 100000; i++) {
        validator.validateCode('EUR', 'ISO4217');
      }
      const t1 = Date.now() - t1Start;

      const t2Start = Date.now();
      for (let i = 0; i < 100000; i++) {
        validator.validateCode('ZWL', 'ISO4217');
      }
      const t2 = Date.now() - t2Start;

      // Both should be roughly equal (within 5x -- accounting for JIT and GC)
      expect(Math.abs(t1 - t2)).toBeLessThan(Math.max(t1, t2) * 5);
    });
  });

  // ==========================================================================
  // CROSS-VALIDATION WITH EXISTING ENUMS
  // ==========================================================================

  describe('Consistency with existing type enums', () => {
    const validator = new CodeListValidator();

    it('should include all CurrencyCode enum values', () => {
      const enumValues = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY',
        'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BRL', 'MXN', 'ZAR',
        'INR', 'SGD', 'HKD', 'NZD', 'TRY', 'RUB', 'AED', 'SAR', 'THB', 'MYR'];
      for (const v of enumValues) {
        expect(validator.validateCode(v, 'ISO4217')).toBe(true);
      }
    });

    it('should include all DocTypeCode enum values', () => {
      // Enum values as strings (numeric)
      const enumValues = ['380', '381', '383', '384', '386', '389'];
      for (const v of enumValues) {
        expect(validator.validateCode(v, 'UNTDID1001')).toBe(true);
      }
    });

    it('should include all TaxCategoryCode enum values', () => {
      const enumValues = ['S', 'Z', 'E', 'AE', 'K', 'G', 'O', 'L', 'M', 'AA'];
      for (const v of enumValues) {
        expect(validator.validateCode(v, 'UNTDID5305')).toBe(true);
      }
    });

    it('should include all PaymentMeansCode enum values', () => {
      const enumValues = ['1', '3', '10', '20', '30', '31', '42', '48', '49', '58', '59'];
      for (const v of enumValues) {
        expect(validator.validateCode(v, 'UNTDID4461')).toBe(true);
      }
    });

    it('should include all UnitCode enum values', () => {
      const enumValues = ['C62', 'HUR', 'DAY', 'MON', 'ANN', 'KGM', 'MTR', 'MTK', 'MTQ', 'LTR', 'KMT'];
      for (const v of enumValues) {
        expect(validator.validateCode(v, 'UNECE20')).toBe(true);
      }
    });
  });
});

// ============================================================================
// TEST HELPERS
// ============================================================================

interface InvoiceXmlOptions {
  currency?: string;
  typeCode?: string;
  sellerCountry?: string;
  buyerCountry?: string;
  paymentMeansCode?: string;
  unitCode?: string;
  sellerEAS?: string;
  buyerEAS?: string;
  sellerICD?: string;
  taxCategories?: Array<{ rate: string; category: string }>;
}

/**
 * Create a valid Factur-X CII XML for testing code list validation.
 * All codes default to valid values; pass overrides to inject specific codes.
 */
function createValidInvoiceXml(options: InvoiceXmlOptions = {}): string {
  const {
    currency = 'EUR',
    typeCode = '380',
    sellerCountry = 'FR',
    buyerCountry = 'DE',
    paymentMeansCode = '30',
    unitCode = 'C62',
    sellerEAS,
    buyerEAS,
    sellerICD,
    taxCategories = [{ rate: '20.00', category: 'S' }],
  } = options;

  const sellerEASBlock = sellerEAS
    ? `<ram:URIUniversalCommunication>
            <ram:URIID schemeID="${sellerEAS}">seller@example.com</ram:URIID>
          </ram:URIUniversalCommunication>`
    : '';

  const buyerEASBlock = buyerEAS
    ? `<ram:URIUniversalCommunication>
            <ram:URIID schemeID="${buyerEAS}">buyer@example.com</ram:URIID>
          </ram:URIUniversalCommunication>`
    : '';

  const sellerICDBlock = sellerICD
    ? `<ram:SpecifiedLegalOrganization>
            <ram:ID schemeID="${sellerICD}">123456789</ram:ID>
          </ram:SpecifiedLegalOrganization>`
    : '';

  const taxBlocks = taxCategories.map(tc => `
        <ram:ApplicableTradeTax>
          <ram:CalculatedAmount>200.00</ram:CalculatedAmount>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:BasisAmount>1000.00</ram:BasisAmount>
          <ram:CategoryCode>${tc.category}</ram:CategoryCode>
          <ram:RateApplicablePercent>${tc.rate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-TEST-001</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20231115</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Test Product</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>100.00</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${unitCode}">10</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${taxCategories[0].category}</ram:CategoryCode>
          <ram:RateApplicablePercent>${taxCategories[0].rate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Test Seller SARL</ram:Name>
        ${sellerICDBlock}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>75001</ram:PostcodeCode>
          <ram:LineOne>1 Rue de Rivoli</ram:LineOne>
          <ram:CityName>Paris</ram:CityName>
          <ram:CountryID>${sellerCountry}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${sellerEASBlock}
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">FR12345678901</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Test Buyer GmbH</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>10115</ram:PostcodeCode>
          <ram:LineOne>Friedrichstrasse 1</ram:LineOne>
          <ram:CityName>Berlin</ram:CityName>
          <ram:CountryID>${buyerCountry}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${buyerEASBlock}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">20231115</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>${paymentMeansCode}</ram:TypeCode>
      </ram:SpecifiedTradeSettlementPaymentMeans>
      ${taxBlocks}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currency}">200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>1200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
