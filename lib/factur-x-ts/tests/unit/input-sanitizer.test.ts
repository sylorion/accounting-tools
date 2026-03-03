/**
 * @file input-sanitizer.test.ts
 * @description Comprehensive unit tests for InputSanitizer
 */

import {
  sanitizeString,
  escapeXml,
  unescapeXml,
  validateEmail,
  validatePhone,
  validateInvoiceNumber,
  validateCountryCode,
  validateCurrencyCode,
  validateVatNumber,
  validateAmount,
  validateDate,
  combineValidationResults,
  InputSanitizer,
} from '../../src/utils/InputSanitizer';

describe('InputSanitizer', () => {
  describe('sanitizeString', () => {
    it('should return empty string for null', () => {
      expect(sanitizeString(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(sanitizeString(undefined)).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });

    it('should truncate to max length', () => {
      const result = sanitizeString('hello world', { maxLength: 5 });
      expect(result).toBe('hello');
    });

    it('should remove control characters', () => {
      const result = sanitizeString('hello\x00\x01world');
      expect(result).toBe('helloworld');
    });

    it('should escape XML characters by default', () => {
      const result = sanitizeString('hello & <world>');
      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should not escape XML when allowXmlChars is true', () => {
      const result = sanitizeString('hello & <world>', { allowXmlChars: true });
      expect(result).toBe('hello & <world>');
    });

    it('should validate pattern if provided', () => {
      const pattern = /^[a-z]+$/;
      expect(() => sanitizeString('hello', { pattern })).not.toThrow();
      expect(() => sanitizeString('hello123', { pattern })).toThrow();
    });

    it('should handle special characters', () => {
      const result = sanitizeString('a"b\'c&d<e>f');
      expect(result).toBe('a&quot;b&apos;c&amp;d&lt;e&gt;f');
    });

    it('should combine multiple options', () => {
      const result = sanitizeString('  hello world  ', {
        maxLength: 8,
        allowXmlChars: false,
      });
      expect(result).toBe('hello wo');
    });
  });

  describe('escapeXml', () => {
    it('should escape ampersand', () => {
      expect(escapeXml('a & b')).toBe('a &amp; b');
    });

    it('should escape less than', () => {
      expect(escapeXml('a < b')).toBe('a &lt; b');
    });

    it('should escape greater than', () => {
      expect(escapeXml('a > b')).toBe('a &gt; b');
    });

    it('should escape double quotes', () => {
      expect(escapeXml('a "b" c')).toBe('a &quot;b&quot; c');
    });

    it('should escape single quotes', () => {
      expect(escapeXml("a 'b' c")).toBe('a &apos;b&apos; c');
    });

    it('should escape all XML special characters', () => {
      expect(escapeXml('& < > " \'')).toBe('&amp; &lt; &gt; &quot; &apos;');
    });

    it('should not modify normal text', () => {
      expect(escapeXml('hello world')).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(escapeXml('')).toBe('');
    });

    it('should handle repeated special characters', () => {
      expect(escapeXml('&&&')).toBe('&amp;&amp;&amp;');
      expect(escapeXml('<<<')).toBe('&lt;&lt;&lt;');
    });
  });

  describe('unescapeXml', () => {
    it('should unescape &amp;', () => {
      expect(unescapeXml('a &amp; b')).toBe('a & b');
    });

    it('should unescape &lt;', () => {
      expect(unescapeXml('a &lt; b')).toBe('a < b');
    });

    it('should unescape &gt;', () => {
      expect(unescapeXml('a &gt; b')).toBe('a > b');
    });

    it('should unescape &quot;', () => {
      expect(unescapeXml('a &quot;b&quot; c')).toBe('a "b" c');
    });

    it('should unescape &apos;', () => {
      expect(unescapeXml('a &apos;b&apos; c')).toBe("a 'b' c");
    });

    it('should unescape all XML entities', () => {
      expect(unescapeXml('&amp; &lt; &gt; &quot; &apos;')).toBe('& < > " \'');
    });

    it('should be inverse of escapeXml', () => {
      const original = '& < > " \'';
      const escaped = escapeXml(original);
      const unescaped = unescapeXml(escaped);
      expect(unescaped).toBe(original);
    });

    it('should not modify normal text', () => {
      expect(unescapeXml('hello world')).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(unescapeXml('')).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result.isValid).toBe(true);
    });

    it('should validate email with plus', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should validate email with dash', () => {
      const result = validateEmail('first-last@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('required');
    });

    it('should reject null email', () => {
      const result = validateEmail(null);
      expect(result.isValid).toBe(false);
    });

    it('should reject undefined email', () => {
      const result = validateEmail(undefined);
      expect(result.isValid).toBe(false);
    });

    it('should reject email without @', () => {
      const result = validateEmail('invalid.email.com');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid email');
    });

    it('should reject email without domain', () => {
      const result = validateEmail('user@');
      expect(result.isValid).toBe(false);
    });

    it('should reject email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
    });

    it('should return frozen errors array', () => {
      const result = validateEmail('invalid');
      expect(Object.isFrozen(result.errors)).toBe(true);
    });
  });

  describe('validatePhone', () => {
    it('should validate international phone format', () => {
      const result = validatePhone('+33123456789');
      expect(result.isValid).toBe(true);
    });

    it('should validate phone with spaces', () => {
      const result = validatePhone('+33 1 23 45 67 89');
      expect(result.isValid).toBe(true);
    });

    it('should validate phone with dashes', () => {
      const result = validatePhone('+1-555-123-4567');
      expect(result.isValid).toBe(true);
    });

    it('should validate phone with parentheses', () => {
      const result = validatePhone('+1 (555) 123-4567');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty phone', () => {
      const result = validatePhone('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('required');
    });

    it('should reject null phone', () => {
      const result = validatePhone(null);
      expect(result.isValid).toBe(false);
    });

    it('should reject phone with letters', () => {
      const result = validatePhone('+33 ABC 123');
      expect(result.isValid).toBe(false);
    });

    it('should reject too short phone', () => {
      const result = validatePhone('+1');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateInvoiceNumber', () => {
    it('should validate alphanumeric invoice number', () => {
      const result = validateInvoiceNumber('INV-2023-001');
      expect(result.isValid).toBe(true);
    });

    it('should validate invoice number with underscores', () => {
      const result = validateInvoiceNumber('INV_2023_001');
      expect(result.isValid).toBe(true);
    });

    it('should validate invoice number with mixed case', () => {
      const result = validateInvoiceNumber('Inv2023-001');
      expect(result.isValid).toBe(true);
    });

    it('should validate numeric invoice number', () => {
      const result = validateInvoiceNumber('123456');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty invoice number', () => {
      const result = validateInvoiceNumber('');
      expect(result.isValid).toBe(false);
    });

    it('should reject invoice number with spaces', () => {
      const result = validateInvoiceNumber('INV 2023 001');
      expect(result.isValid).toBe(false);
    });

    it('should reject invoice number with special characters', () => {
      const result = validateInvoiceNumber('INV@2023!001');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCountryCode', () => {
    it('should validate 2-letter country code', () => {
      expect(validateCountryCode('FR').isValid).toBe(true);
      expect(validateCountryCode('US').isValid).toBe(true);
      expect(validateCountryCode('GB').isValid).toBe(true);
      expect(validateCountryCode('DE').isValid).toBe(true);
    });

    it('should validate lowercase country code', () => {
      const result = validateCountryCode('fr');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty country code', () => {
      const result = validateCountryCode('');
      expect(result.isValid).toBe(false);
    });

    it('should reject null country code', () => {
      const result = validateCountryCode(null);
      expect(result.isValid).toBe(false);
    });

    it('should reject 3-letter code', () => {
      const result = validateCountryCode('USA');
      expect(result.isValid).toBe(false);
    });

    it('should reject 1-letter code', () => {
      const result = validateCountryCode('F');
      expect(result.isValid).toBe(false);
    });

    it('should reject numeric codes', () => {
      const result = validateCountryCode('12');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCurrencyCode', () => {
    it('should validate 3-letter currency code', () => {
      expect(validateCurrencyCode('EUR').isValid).toBe(true);
      expect(validateCurrencyCode('USD').isValid).toBe(true);
      expect(validateCurrencyCode('GBP').isValid).toBe(true);
      expect(validateCurrencyCode('JPY').isValid).toBe(true);
    });

    it('should validate lowercase currency code', () => {
      const result = validateCurrencyCode('eur');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty currency code', () => {
      const result = validateCurrencyCode('');
      expect(result.isValid).toBe(false);
    });

    it('should reject null currency code', () => {
      const result = validateCurrencyCode(null);
      expect(result.isValid).toBe(false);
    });

    it('should reject 2-letter code', () => {
      const result = validateCurrencyCode('EU');
      expect(result.isValid).toBe(false);
    });

    it('should reject 4-letter code', () => {
      const result = validateCurrencyCode('EURO');
      expect(result.isValid).toBe(false);
    });

    it('should reject numeric codes', () => {
      const result = validateCurrencyCode('123');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateVatNumber', () => {
    it('should validate French VAT number', () => {
      const result = validateVatNumber('FR12345678901');
      expect(result.isValid).toBe(true);
    });

    it('should validate German VAT number', () => {
      const result = validateVatNumber('DE123456789');
      expect(result.isValid).toBe(true);
    });

    it('should validate UK VAT number', () => {
      const result = validateVatNumber('GB123456789');
      expect(result.isValid).toBe(true);
    });

    it('should validate lowercase VAT number', () => {
      const result = validateVatNumber('fr12345678901');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty VAT number', () => {
      const result = validateVatNumber('');
      expect(result.isValid).toBe(false);
    });

    it('should reject null VAT number', () => {
      const result = validateVatNumber(null);
      expect(result.isValid).toBe(false);
    });

    it('should reject VAT without country code', () => {
      const result = validateVatNumber('12345678901');
      expect(result.isValid).toBe(false);
    });

    it('should reject VAT with numeric country code', () => {
      const result = validateVatNumber('12345678901');
      expect(result.isValid).toBe(false);
    });

    it('should reject VAT that is too short', () => {
      const result = validateVatNumber('FR1');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amount', () => {
      const result = validateAmount(100);
      expect(result.isValid).toBe(true);
    });

    it('should validate zero amount', () => {
      const result = validateAmount(0);
      expect(result.isValid).toBe(true);
    });

    it('should validate negative amount', () => {
      const result = validateAmount(-100);
      expect(result.isValid).toBe(true);
    });

    it('should validate decimal amount', () => {
      const result = validateAmount(123.45);
      expect(result.isValid).toBe(true);
    });

    it('should reject null amount', () => {
      const result = validateAmount(null);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('required');
    });

    it('should reject undefined amount', () => {
      const result = validateAmount(undefined);
      expect(result.isValid).toBe(false);
    });

    it('should reject NaN', () => {
      const result = validateAmount(NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('number');
    });

    it('should reject Infinity', () => {
      const result = validateAmount(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('finite');
    });

    it('should reject -Infinity', () => {
      const result = validateAmount(-Infinity);
      expect(result.isValid).toBe(false);
    });

    it('should validate amount with min constraint', () => {
      expect(validateAmount(10, 5).isValid).toBe(true);
      expect(validateAmount(5, 5).isValid).toBe(true);
      expect(validateAmount(4, 5).isValid).toBe(false);
    });

    it('should validate amount with max constraint', () => {
      expect(validateAmount(10, undefined, 20).isValid).toBe(true);
      expect(validateAmount(20, undefined, 20).isValid).toBe(true);
      expect(validateAmount(21, undefined, 20).isValid).toBe(false);
    });

    it('should validate amount with min and max constraints', () => {
      expect(validateAmount(10, 5, 20).isValid).toBe(true);
      expect(validateAmount(4, 5, 20).isValid).toBe(false);
      expect(validateAmount(21, 5, 20).isValid).toBe(false);
    });

    it('should accept amount with valid decimal places', () => {
      const result = validateAmount(123.45);
      expect(result.isValid).toBe(true);
    });

    it('should handle very large amounts', () => {
      const result = validateAmount(999999999.99);
      expect(result.isValid).toBe(true);
    });

    it('should handle very small amounts', () => {
      const result = validateAmount(0.01);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateDate', () => {
    it('should validate valid date', () => {
      const result = validateDate(new Date('2023-11-15'));
      expect(result.isValid).toBe(true);
    });

    it('should validate current date', () => {
      const result = validateDate(new Date());
      expect(result.isValid).toBe(true);
    });

    it('should reject null date', () => {
      const result = validateDate(null);
      expect(result.isValid).toBe(false);
    });

    it('should reject undefined date', () => {
      const result = validateDate(undefined);
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid date', () => {
      const result = validateDate(new Date('invalid'));
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid date');
    });

    it('should validate date with min constraint', () => {
      const minDate = new Date('2023-01-01');
      const date = new Date('2023-06-01');

      expect(validateDate(date, minDate).isValid).toBe(true);
      expect(validateDate(minDate, minDate).isValid).toBe(true);
      expect(validateDate(new Date('2022-12-31'), minDate).isValid).toBe(false);
    });

    it('should validate date with max constraint', () => {
      const maxDate = new Date('2023-12-31');
      const date = new Date('2023-06-01');

      expect(validateDate(date, undefined, maxDate).isValid).toBe(true);
      expect(validateDate(maxDate, undefined, maxDate).isValid).toBe(true);
      expect(validateDate(new Date('2024-01-01'), undefined, maxDate).isValid).toBe(false);
    });

    it('should validate date with min and max constraints', () => {
      const minDate = new Date('2023-01-01');
      const maxDate = new Date('2023-12-31');
      const date = new Date('2023-06-01');

      expect(validateDate(date, minDate, maxDate).isValid).toBe(true);
      expect(validateDate(new Date('2022-12-31'), minDate, maxDate).isValid).toBe(false);
      expect(validateDate(new Date('2024-01-01'), minDate, maxDate).isValid).toBe(false);
    });
  });

  describe('combineValidationResults', () => {
    it('should combine all valid results', () => {
      const result1 = { isValid: true, errors: [], warnings: [] };
      const result2 = { isValid: true, errors: [], warnings: [] };

      const combined = combineValidationResults(result1, result2);

      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });

    it('should combine with one invalid result', () => {
      const result1 = { isValid: true, errors: [], warnings: [] };
      const result2 = { isValid: false, errors: ['Error 1'], warnings: [] };

      const combined = combineValidationResults(result1, result2);

      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(1);
      expect(combined.errors[0]).toBe('Error 1');
    });

    it('should combine multiple errors', () => {
      const result1 = { isValid: false, errors: ['Error 1'], warnings: [] };
      const result2 = { isValid: false, errors: ['Error 2'], warnings: [] };

      const combined = combineValidationResults(result1, result2);

      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(2);
      expect(combined.errors).toContain('Error 1');
      expect(combined.errors).toContain('Error 2');
    });

    it('should combine warnings', () => {
      const result1 = { isValid: true, errors: [], warnings: ['Warning 1'] };
      const result2 = { isValid: true, errors: [], warnings: ['Warning 2'] };

      const combined = combineValidationResults(result1, result2);

      expect(combined.isValid).toBe(true);
      expect(combined.warnings).toHaveLength(2);
    });

    it('should combine errors and warnings', () => {
      const result1 = { isValid: false, errors: ['Error 1'], warnings: ['Warning 1'] };
      const result2 = { isValid: false, errors: ['Error 2'], warnings: ['Warning 2'] };

      const combined = combineValidationResults(result1, result2);

      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(2);
      expect(combined.warnings).toHaveLength(2);
    });

    it('should handle empty results', () => {
      const combined = combineValidationResults();

      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });

    it('should return frozen arrays', () => {
      const result1 = { isValid: false, errors: ['Error 1'], warnings: [] };
      const combined = combineValidationResults(result1);

      expect(Object.isFrozen(combined.errors)).toBe(true);
      expect(Object.isFrozen(combined.warnings)).toBe(true);
    });
  });

  describe('InputSanitizer Object', () => {
    it('should expose all sanitization methods', () => {
      expect(InputSanitizer.sanitizeString).toBeDefined();
      expect(InputSanitizer.escapeXml).toBeDefined();
      expect(InputSanitizer.unescapeXml).toBeDefined();
    });

    it('should expose all validation methods', () => {
      expect(InputSanitizer.validateEmail).toBeDefined();
      expect(InputSanitizer.validatePhone).toBeDefined();
      expect(InputSanitizer.validateInvoiceNumber).toBeDefined();
      expect(InputSanitizer.validateCountryCode).toBeDefined();
      expect(InputSanitizer.validateCurrencyCode).toBeDefined();
      expect(InputSanitizer.validateVatNumber).toBeDefined();
      expect(InputSanitizer.validateAmount).toBeDefined();
      expect(InputSanitizer.validateDate).toBeDefined();
    });

    it('should expose combineValidationResults', () => {
      expect(InputSanitizer.combineValidationResults).toBeDefined();
    });

    it('should work through object interface', () => {
      const result = InputSanitizer.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should escape XML efficiently', () => {
      const text = 'a & b < c > d " e \' f'.repeat(1000);
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        escapeXml(text);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // Allow more time under heavy test suite load
    });

    it('should validate many emails efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        validateEmail(`user${i}@example.com`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
