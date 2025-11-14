// src/__tests__/InputSanitizer.test.ts

import { InputSanitizer } from '../utils/InputSanitizer';

describe('InputSanitizer', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace by default', () => {
      const result = InputSanitizer.sanitizeString('  hello  ');
      expect(result).toBe('hello');
    });

    it('should escape XML special characters', () => {
      const result = InputSanitizer.sanitizeString('Hello <script>alert("XSS")</script>');
      expect(result).toBe('Hello &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should limit string length', () => {
      const result = InputSanitizer.sanitizeString('Hello World', { maxLength: 5 });
      expect(result).toBe('Hello');
    });

    it('should handle null and undefined', () => {
      expect(InputSanitizer.sanitizeString(null)).toBe('');
      expect(InputSanitizer.sanitizeString(undefined)).toBe('');
    });

    it('should remove control characters', () => {
      const result = InputSanitizer.sanitizeString('Hello\x00\x01World');
      expect(result).toBe('HelloWorld');
    });
  });

  describe('escapeXml', () => {
    it('should escape ampersand', () => {
      expect(InputSanitizer.escapeXml('A & B')).toBe('A &amp; B');
    });

    it('should escape angle brackets', () => {
      expect(InputSanitizer.escapeXml('<tag>')).toBe('&lt;tag&gt;');
    });

    it('should escape quotes', () => {
      expect(InputSanitizer.escapeXml('"double" and \'single\'')).toBe('&quot;double&quot; and &apos;single&apos;');
    });

    it('should escape all special characters together', () => {
      expect(InputSanitizer.escapeXml('<tag attr="value" other=\'val\'>&</tag>'))
        .toBe('&lt;tag attr=&quot;value&quot; other=&apos;val&apos;&gt;&amp;&lt;/tag&gt;');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = InputSanitizer.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid email format', () => {
      const result = InputSanitizer.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject empty email', () => {
      const result = InputSanitizer.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = InputSanitizer.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email too long (max 254 characters)');
    });
  });

  describe('validatePhone', () => {
    it('should validate international phone number', () => {
      const result = InputSanitizer.validatePhone('+33123456789');
      expect(result.isValid).toBe(true);
    });

    it('should validate French phone number', () => {
      const result = InputSanitizer.validatePhone('01 23 45 67 89');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const result = InputSanitizer.validatePhone('abc');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateInvoiceNumber', () => {
    it('should validate alphanumeric invoice number', () => {
      const result = InputSanitizer.validateInvoiceNumber('FA-2025-001');
      expect(result.isValid).toBe(true);
    });

    it('should validate uppercase invoice number', () => {
      const result = InputSanitizer.validateInvoiceNumber('INVOICE_2025_001');
      expect(result.isValid).toBe(true);
    });

    it('should reject special characters', () => {
      const result = InputSanitizer.validateInvoiceNumber('FA@2025!001');
      expect(result.isValid).toBe(false);
    });

    it('should reject empty invoice number', () => {
      const result = InputSanitizer.validateInvoiceNumber('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCountryCode', () => {
    it('should validate FR country code', () => {
      const result = InputSanitizer.validateCountryCode('FR');
      expect(result.isValid).toBe(true);
    });

    it('should validate lowercase country code', () => {
      const result = InputSanitizer.validateCountryCode('de');
      expect(result.isValid).toBe(true);
    });

    it('should reject 3-letter code', () => {
      const result = InputSanitizer.validateCountryCode('FRA');
      expect(result.isValid).toBe(false);
    });

    it('should reject numeric code', () => {
      const result = InputSanitizer.validateCountryCode('12');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCurrencyCode', () => {
    it('should validate EUR currency code', () => {
      const result = InputSanitizer.validateCurrencyCode('EUR');
      expect(result.isValid).toBe(true);
    });

    it('should validate lowercase currency code', () => {
      const result = InputSanitizer.validateCurrencyCode('usd');
      expect(result.isValid).toBe(true);
    });

    it('should reject 2-letter code', () => {
      const result = InputSanitizer.validateCurrencyCode('EU');
      expect(result.isValid).toBe(false);
    });

    it('should reject numeric code', () => {
      const result = InputSanitizer.validateCurrencyCode('123');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateVatNumber', () => {
    it('should validate French VAT number', () => {
      const result = InputSanitizer.validateVatNumber('FR12345678901');
      expect(result.isValid).toBe(true);
    });

    it('should validate German VAT number', () => {
      const result = InputSanitizer.validateVatNumber('DE123456789');
      expect(result.isValid).toBe(true);
    });

    it('should allow empty VAT number', () => {
      const result = InputSanitizer.validateVatNumber('');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = InputSanitizer.validateVatNumber('123ABC');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amount', () => {
      const result = InputSanitizer.validateAmount(100.50);
      expect(result.isValid).toBe(true);
    });

    it('should validate zero amount', () => {
      const result = InputSanitizer.validateAmount(0);
      expect(result.isValid).toBe(true);
    });

    it('should reject NaN', () => {
      const result = InputSanitizer.validateAmount(NaN);
      expect(result.isValid).toBe(false);
    });

    it('should reject Infinity', () => {
      const result = InputSanitizer.validateAmount(Infinity);
      expect(result.isValid).toBe(false);
    });

    it('should enforce minimum', () => {
      const result = InputSanitizer.validateAmount(5, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be at least 10');
    });

    it('should enforce maximum', () => {
      const result = InputSanitizer.validateAmount(100, 0, 50);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be at most 50');
    });

    it('should warn about excessive decimals', () => {
      const result = InputSanitizer.validateAmount(10.12345);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Amount has more than 2 decimal places, will be rounded');
    });
  });

  describe('validateQuantity', () => {
    it('should validate positive quantity', () => {
      const result = InputSanitizer.validateQuantity(5);
      expect(result.isValid).toBe(true);
    });

    it('should reject zero quantity', () => {
      const result = InputSanitizer.validateQuantity(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity must be greater than 0');
    });

    it('should reject negative quantity', () => {
      const result = InputSanitizer.validateQuantity(-5);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateVatRate', () => {
    it('should validate 20% VAT rate', () => {
      const result = InputSanitizer.validateVatRate(0.20);
      expect(result.isValid).toBe(true);
    });

    it('should validate 0% VAT rate', () => {
      const result = InputSanitizer.validateVatRate(0);
      expect(result.isValid).toBe(true);
    });

    it('should reject rate > 1', () => {
      const result = InputSanitizer.validateVatRate(1.5);
      expect(result.isValid).toBe(false);
    });

    it('should reject negative rate', () => {
      const result = InputSanitizer.validateVatRate(-0.1);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate valid date', () => {
      const result = InputSanitizer.validateDate(new Date('2025-01-01'));
      expect(result.isValid).toBe(true);
    });

    it('should reject null date', () => {
      const result = InputSanitizer.validateDate(null);
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid date', () => {
      const result = InputSanitizer.validateDate(new Date('invalid'));
      expect(result.isValid).toBe(false);
    });

    it('should enforce minimum date', () => {
      const minDate = new Date('2025-01-01');
      const testDate = new Date('2024-12-31');
      const result = InputSanitizer.validateDate(testDate, minDate);
      expect(result.isValid).toBe(false);
    });

    it('should enforce maximum date', () => {
      const maxDate = new Date('2025-12-31');
      const testDate = new Date('2026-01-01');
      const result = InputSanitizer.validateDate(testDate, undefined, maxDate);
      expect(result.isValid).toBe(false);
    });
  });

  describe('combineValidationResults', () => {
    it('should combine multiple valid results', () => {
      const result1 = { isValid: true, errors: [], warnings: [] };
      const result2 = { isValid: true, errors: [], warnings: [] };
      const combined = InputSanitizer.combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });

    it('should combine valid and invalid results', () => {
      const result1 = { isValid: true, errors: [], warnings: [] };
      const result2 = { isValid: false, errors: ['Error 1'], warnings: [] };
      const combined = InputSanitizer.combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toContain('Error 1');
    });

    it('should accumulate all errors and warnings', () => {
      const result1 = { isValid: false, errors: ['Error 1'], warnings: ['Warning 1'] };
      const result2 = { isValid: false, errors: ['Error 2'], warnings: ['Warning 2'] };
      const combined = InputSanitizer.combineValidationResults(result1, result2);
      expect(combined.errors).toHaveLength(2);
      expect(combined.warnings).toHaveLength(2);
    });
  });
});
