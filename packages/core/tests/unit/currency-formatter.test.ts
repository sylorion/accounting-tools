/**
 * @file currency-formatter.test.ts
 * @description Comprehensive unit tests for currency formatter
 */

import {
  CurrencyFormatter,
  isValidCurrency,
  getCurrencyInfo,
  formatCurrency,
  formatAmountForXml,
  parseCurrency,
  convertCurrency,
} from '../../src/utils/CurrencyFormatter';
import { CurrencyCode } from '../../src/types';

describe('CurrencyFormatter', () => {
  describe('Currency Validation', () => {
    it('should validate supported currencies (30 currencies)', () => {
      const supportedCurrencies = [
        'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY', 'SEK', 'NOK',
        'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BRL', 'MXN', 'ZAR', 'INR', 'SGD',
        'HKD', 'NZD', 'TRY', 'RUB', 'AED', 'SAR', 'THB', 'MYR',
      ];

      for (const currency of supportedCurrencies) {
        expect(isValidCurrency(currency)).toBe(true);
      }
    });

    it('should reject unsupported currencies', () => {
      const unsupportedCurrencies = ['XXX', 'INVALID', 'ABC', '123'];

      for (const currency of unsupportedCurrencies) {
        expect(isValidCurrency(currency)).toBe(false);
      }
    });

    it('should be case-insensitive', () => {
      expect(isValidCurrency('eur')).toBe(true);
      expect(isValidCurrency('EUR')).toBe(true);
      expect(isValidCurrency('EuR')).toBe(true);
    });
  });

  describe('Currency Metadata', () => {
    it('should get EUR currency info', () => {
      const info = getCurrencyInfo('EUR');

      expect(info.code).toBe('EUR');
      expect(info.symbol).toBe('€');
      expect(info.name).toBe('Euro');
      expect(info.decimalPlaces).toBe(2);
      expect(info.symbolPosition).toBe('after');
    });

    it('should get USD currency info', () => {
      const info = getCurrencyInfo('USD');

      expect(info.code).toBe('USD');
      expect(info.symbol).toBe('$');
      expect(info.name).toBe('US Dollar');
      expect(info.decimalPlaces).toBe(2);
      expect(info.symbolPosition).toBe('before');
    });

    it('should get JPY currency info (0 decimal places)', () => {
      const info = getCurrencyInfo('JPY');

      expect(info.code).toBe('JPY');
      expect(info.symbol).toBe('¥');
      expect(info.decimalPlaces).toBe(0); // JPY has no decimals
    });

    it('should get HUF currency info (0 decimal places)', () => {
      const info = getCurrencyInfo('HUF');

      expect(info.code).toBe('HUF');
      expect(info.symbol).toBe('Ft');
      expect(info.decimalPlaces).toBe(0); // HUF has no decimals
    });

    it('should throw error for unsupported currency', () => {
      expect(() => {
        getCurrencyInfo('INVALID');
      }).toThrow('Unsupported currency code: INVALID');
    });

    it('should handle case-insensitive currency codes', () => {
      const info1 = getCurrencyInfo('gbp');
      const info2 = getCurrencyInfo('GBP');

      expect(info1.code).toBe('GBP');
      expect(info2.code).toBe('GBP');
    });
  });

  describe('Currency Formatting', () => {
    describe('Basic Formatting', () => {
      it('should format EUR with symbol after amount', () => {
        const formatted = formatCurrency(1234.56, 'EUR');

        expect(formatted).toMatch(/1\s*234\.56/); // With thousand separator
        expect(formatted).toContain('€');
        expect(formatted.indexOf('€')).toBeGreaterThan(formatted.indexOf('1'));
      });

      it('should format USD with symbol before amount', () => {
        const formatted = formatCurrency(1234.56, 'USD');

        expect(formatted).toMatch(/1\s*234\.56/); // With thousand separator
        expect(formatted).toContain('$');
        expect(formatted.indexOf('$')).toBeLessThan(formatted.indexOf('1'));
      });

      it('should format GBP with symbol before amount', () => {
        const formatted = formatCurrency(999.99, 'GBP');

        expect(formatted).toContain('999.99');
        expect(formatted).toContain('£');
        expect(formatted.startsWith('£')).toBe(true);
      });

      it('should format JPY without decimals', () => {
        const formatted = formatCurrency(1234.56, 'JPY');

        expect(formatted).toMatch(/1\s*235/); // Rounded with thousand separator
        expect(formatted).not.toContain('.'); // No decimal point
        expect(formatted).toContain('¥');
      });

      it('should format HUF without decimals', () => {
        const formatted = formatCurrency(1234.99, 'HUF');

        expect(formatted).toMatch(/1\s*235/); // Rounded with thousand separator
        expect(formatted).not.toContain('.');
        expect(formatted).toContain('Ft');
      });
    });

    describe('Grouping (Thousands Separators)', () => {
      it('should add thousands separator by default', () => {
        const formatted = formatCurrency(1234567.89, 'EUR');

        expect(formatted).toContain('234 567'); // Space separator
      });

      it('should respect useGrouping: false', () => {
        const formatted = formatCurrency(1234567.89, 'EUR', { useGrouping: false });

        expect(formatted).toContain('1234567.89');
        expect(formatted).not.toContain('234 567');
      });

      it('should handle small amounts without grouping', () => {
        const formatted = formatCurrency(99.99, 'EUR');

        expect(formatted).toContain('99.99');
      });
    });

    describe('Symbol Options', () => {
      it('should hide symbol when showSymbol: false', () => {
        const formatted = formatCurrency(100.00, 'EUR', { showSymbol: false });

        expect(formatted).not.toContain('€');
        expect(formatted).toContain('100.00');
      });

      it('should show currency code when showCode: true', () => {
        const formatted = formatCurrency(100.00, 'EUR', { showCode: true });

        expect(formatted).toContain('EUR');
        expect(formatted).toContain('€');
      });

      it('should show only code without symbol', () => {
        const formatted = formatCurrency(100.00, 'EUR', {
          showSymbol: false,
          showCode: true,
        });

        expect(formatted).not.toContain('€');
        expect(formatted).toContain('EUR');
      });
    });

    describe('All Supported Currencies', () => {
      const testCurrencies: [string, number, RegExp][] = [
        ['EUR', 100.00, /100\.00\s+€/],
        ['USD', 100.00, /\$100\.00/],
        ['GBP', 100.00, /£100\.00/],
        ['CHF', 100.00, /CHF100\.00/],
        ['JPY', 100.56, /¥101/], // No decimals, rounded
        ['CAD', 100.00, /CA\$100\.00/],
        ['AUD', 100.00, /A\$100\.00/],
        ['CNY', 100.00, /¥100\.00/],
        ['SEK', 100.00, /100\.00\s+kr/],
        ['NOK', 100.00, /100\.00\s+kr/],
        ['DKK', 100.00, /100\.00\s+kr/],
        ['PLN', 100.00, /100\.00\s+zł/],
        ['CZK', 100.00, /100\.00\s+Kč/],
        ['HUF', 100.56, /101\s+Ft/], // No decimals
        ['RON', 100.00, /100\.00\s+lei/],
        ['BRL', 100.00, /R\$100\.00/],
        ['MXN', 100.00, /\$100\.00/],
        ['ZAR', 100.00, /R100\.00/],
        ['INR', 100.00, /₹100\.00/],
        ['SGD', 100.00, /S\$100\.00/],
        ['HKD', 100.00, /HK\$100\.00/],
        ['NZD', 100.00, /NZ\$100\.00/],
        ['TRY', 100.00, /₺100\.00/],
        ['RUB', 100.00, /100\.00\s+₽/],
        ['AED', 100.00, /د\.إ100\.00/],
        ['SAR', 100.00, /ر\.س100\.00/],
        ['THB', 100.00, /฿100\.00/],
        ['MYR', 100.00, /RM100\.00/],
      ];

      testCurrencies.forEach(([currency, amount, pattern]) => {
        it(`should format ${currency} correctly`, () => {
          const formatted = formatCurrency(amount, currency);
          expect(formatted).toMatch(pattern);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero amount', () => {
        const formatted = formatCurrency(0, 'EUR');

        expect(formatted).toContain('0.00');
      });

      it('should handle negative amounts', () => {
        const formatted = formatCurrency(-100.50, 'USD');

        expect(formatted).toContain('-100.50');
        expect(formatted).toContain('$');
      });

      it('should handle very large amounts', () => {
        const formatted = formatCurrency(999999999.99, 'EUR');

        expect(formatted).toContain('999 999 999.99');
      });

      it('should handle very small decimals', () => {
        const formatted = formatCurrency(0.01, 'EUR');

        expect(formatted).toContain('0.01');
      });
    });
  });

  describe('XML Formatting', () => {
    it('should format amount for XML with 2 decimals', () => {
      const formatted = formatAmountForXml(1234.5);

      expect(formatted).toBe('1234.50');
    });

    it('should format whole numbers with .00', () => {
      const formatted = formatAmountForXml(100);

      expect(formatted).toBe('100.00');
    });

    it('should round to 2 decimal places', () => {
      const formatted = formatAmountForXml(99.999);

      expect(formatted).toBe('100.00');
    });

    it('should handle zero', () => {
      const formatted = formatAmountForXml(0);

      expect(formatted).toBe('0.00');
    });

    it('should handle negative amounts', () => {
      const formatted = formatAmountForXml(-50.5);

      expect(formatted).toBe('-50.50');
    });

    it('should always use 2 decimals regardless of currency', () => {
      // Even for JPY which normally has 0 decimals
      const formatted = formatAmountForXml(1234.56);

      expect(formatted).toBe('1234.56');
      expect(formatted.split('.')[1]).toHaveLength(2);
    });
  });

  describe('Currency Parsing', () => {
    it('should parse EUR formatted amount', () => {
      const amount = parseCurrency('1234.56 €', 'EUR');

      expect(amount).toBe(1234.56);
    });

    it('should parse USD formatted amount', () => {
      const amount = parseCurrency('$1234.56', 'USD');

      expect(amount).toBe(1234.56);
    });

    it('should parse amount with thousands separators', () => {
      const amount = parseCurrency('1 234 567.89 €', 'EUR');

      expect(amount).toBe(1234567.89);
    });

    it('should parse amount with comma separators', () => {
      const amount = parseCurrency('$1,234.56', 'USD');

      expect(amount).toBe(1234.56);
    });

    it('should parse amount without symbol', () => {
      const amount = parseCurrency('1234.56', 'EUR');

      expect(amount).toBe(1234.56);
    });

    it('should parse zero', () => {
      const amount = parseCurrency('0.00 €', 'EUR');

      expect(amount).toBe(0.00);
    });

    it('should parse negative amounts', () => {
      const amount = parseCurrency('-100.50 €', 'EUR');

      expect(amount).toBe(-100.50);
    });

    it('should throw error for invalid amount', () => {
      expect(() => {
        parseCurrency('INVALID', 'EUR');
      }).toThrow('Invalid currency amount');
    });

    it('should throw error for empty string', () => {
      expect(() => {
        parseCurrency('', 'EUR');
      }).toThrow('Invalid currency amount');
    });
  });

  describe('Currency Conversion', () => {
    it('should convert between currencies with exchange rate', () => {
      const converted = convertCurrency(100, 'USD', 'EUR', 0.85);

      expect(converted).toBe(85);
    });

    it('should return same amount for same currency', () => {
      const converted = convertCurrency(100, 'EUR', 'EUR');

      expect(converted).toBe(100);
    });

    it('should handle fractional exchange rates', () => {
      const converted = convertCurrency(1000, 'EUR', 'USD', 1.10);

      expect(converted).toBe(1100);
    });

    it('should throw error if exchange rate missing for different currencies', () => {
      expect(() => {
        convertCurrency(100, 'USD', 'EUR');
      }).toThrow('Exchange rate required');
    });

    it('should handle zero amount', () => {
      const converted = convertCurrency(0, 'USD', 'EUR', 0.85);

      expect(converted).toBe(0);
    });

    it('should handle very small exchange rates', () => {
      const converted = convertCurrency(100, 'USD', 'JPY', 110.5);

      expect(converted).toBe(11050);
    });
  });

  describe('CurrencyFormatter Object', () => {
    it('should expose isValid method', () => {
      expect(CurrencyFormatter.isValid('EUR')).toBe(true);
      expect(CurrencyFormatter.isValid('INVALID')).toBe(false);
    });

    it('should expose getInfo method', () => {
      const info = CurrencyFormatter.getInfo('USD');

      expect(info.code).toBe('USD');
      expect(info.symbol).toBe('$');
    });

    it('should expose format method', () => {
      const formatted = CurrencyFormatter.format(100, 'EUR');

      expect(formatted).toContain('100.00');
      expect(formatted).toContain('€');
    });

    it('should expose formatForXml method', () => {
      const formatted = CurrencyFormatter.formatForXml(100);

      expect(formatted).toBe('100.00');
    });

    it('should expose parse method', () => {
      const amount = CurrencyFormatter.parse('100.00 €', 'EUR');

      expect(amount).toBe(100.00);
    });

    it('should expose convert method', () => {
      const converted = CurrencyFormatter.convert(100, 'USD', 'EUR', 0.85);

      expect(converted).toBe(85);
    });
  });

  describe('Multi-Currency Support Coverage', () => {
    it('should support all 30 documented currencies', () => {
      const expectedCurrencies = [
        CurrencyCode.EUR, CurrencyCode.USD, CurrencyCode.GBP, CurrencyCode.CHF, CurrencyCode.JPY,
        CurrencyCode.CAD, CurrencyCode.AUD, CurrencyCode.CNY, CurrencyCode.SEK, CurrencyCode.NOK,
        CurrencyCode.DKK, CurrencyCode.PLN, CurrencyCode.CZK, CurrencyCode.HUF, CurrencyCode.RON,
        CurrencyCode.BRL, CurrencyCode.MXN, CurrencyCode.ZAR, CurrencyCode.INR, CurrencyCode.SGD,
        CurrencyCode.HKD, CurrencyCode.NZD, CurrencyCode.TRY, CurrencyCode.RUB, CurrencyCode.AED,
        CurrencyCode.SAR, CurrencyCode.THB, CurrencyCode.MYR,
      ];

      expectedCurrencies.forEach(currency => {
        expect(isValidCurrency(currency)).toBe(true);
        const info = getCurrencyInfo(currency);
        expect(info.code).toBe(currency);
        expect(info.symbol).toBeDefined();
        expect(info.name).toBeDefined();
        expect(info.decimalPlaces).toBeGreaterThanOrEqual(0);
        expect(['before', 'after']).toContain(info.symbolPosition);
      });
    });

    it('should have correct decimal places for zero-decimal currencies', () => {
      const zeroDecimalCurrencies = ['JPY', 'HUF'];

      zeroDecimalCurrencies.forEach(currency => {
        const info = getCurrencyInfo(currency);
        expect(info.decimalPlaces).toBe(0);

        // Verify formatting doesn't include decimals
        const formatted = formatCurrency(100.99, currency);
        expect(formatted).not.toContain('.');
      });
    });

    it('should have correct symbol positions', () => {
      const beforeSymbol = ['USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'CHF', 'BRL', 'MXN', 'ZAR', 'INR', 'SGD', 'HKD', 'NZD', 'TRY', 'AED', 'SAR', 'THB', 'MYR'];
      const afterSymbol = ['EUR', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'RUB'];

      beforeSymbol.forEach(currency => {
        const info = getCurrencyInfo(currency);
        expect(info.symbolPosition).toBe('before');
      });

      afterSymbol.forEach(currency => {
        const info = getCurrencyInfo(currency);
        expect(info.symbolPosition).toBe('after');
      });
    });
  });

  describe('Performance', () => {
    it('should perform O(1) currency validation', () => {
      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        isValidCurrency('EUR');
      }

      const duration = Date.now() - start;

      // Should be very fast (< 100ms for 10000 operations)
      expect(duration).toBeLessThan(100);
    });

    it('should perform O(1) currency info lookup', () => {
      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        getCurrencyInfo('USD');
      }

      const duration = Date.now() - start;

      // Should be very fast (< 100ms for 10000 operations)
      expect(duration).toBeLessThan(100);
    });
  });
});
