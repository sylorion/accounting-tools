import {
  isValidCurrency,
  getCurrencyInfo,
  formatCurrency,
  formatAmountForXml,
  parseCurrency,
  convertCurrency,
  CurrencyFormatter,
} from '../../utils/CurrencyFormatter';

describe('CurrencyFormatter', () => {
  describe('isValidCurrency', () => {
    it('should validate all supported currencies', () => {
      const supportedCurrencies = [
        'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY',
        'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BRL',
        'MXN', 'ZAR', 'INR', 'SGD', 'HKD', 'NZD', 'TRY', 'RUB',
        'AED', 'SAR', 'THB', 'MYR'
      ];

      supportedCurrencies.forEach(code => {
        expect(isValidCurrency(code)).toBe(true);
      });
    });

    it('should handle lowercase currency codes', () => {
      expect(isValidCurrency('eur')).toBe(true);
      expect(isValidCurrency('usd')).toBe(true);
      expect(isValidCurrency('gbp')).toBe(true);
    });

    it('should reject unsupported currencies', () => {
      expect(isValidCurrency('XXX')).toBe(false);
      expect(isValidCurrency('INVALID')).toBe(false);
      expect(isValidCurrency('ABC')).toBe(false);
    });

    it('should reject empty or invalid strings', () => {
      expect(isValidCurrency('')).toBe(false);
      expect(isValidCurrency('   ')).toBe(false);
    });
  });

  describe('getCurrencyInfo', () => {
    it('should return correct info for EUR', () => {
      const info = getCurrencyInfo('EUR');
      expect(info.code).toBe('EUR');
      expect(info.symbol).toBe('€');
      expect(info.name).toBe('Euro');
      expect(info.decimalPlaces).toBe(2);
      expect(info.symbolPosition).toBe('after');
    });

    it('should return correct info for USD', () => {
      const info = getCurrencyInfo('USD');
      expect(info.code).toBe('USD');
      expect(info.symbol).toBe('$');
      expect(info.name).toBe('US Dollar');
      expect(info.decimalPlaces).toBe(2);
      expect(info.symbolPosition).toBe('before');
    });

    it('should return correct info for JPY (0 decimals)', () => {
      const info = getCurrencyInfo('JPY');
      expect(info.code).toBe('JPY');
      expect(info.symbol).toBe('¥');
      expect(info.decimalPlaces).toBe(0);
      expect(info.symbolPosition).toBe('before');
    });

    it('should return correct info for HUF (0 decimals)', () => {
      const info = getCurrencyInfo('HUF');
      expect(info.code).toBe('HUF');
      expect(info.symbol).toBe('Ft');
      expect(info.decimalPlaces).toBe(0);
      expect(info.symbolPosition).toBe('after');
    });

    it('should handle lowercase currency codes', () => {
      const info = getCurrencyInfo('gbp');
      expect(info.code).toBe('GBP');
      expect(info.symbol).toBe('£');
    });

    it('should throw for unsupported currency', () => {
      expect(() => getCurrencyInfo('XXX')).toThrow('Unsupported currency code: XXX');
      expect(() => getCurrencyInfo('INVALID')).toThrow('Unsupported currency code: INVALID');
    });
  });

  describe('formatCurrency', () => {
    describe('basic formatting', () => {
      it('should format EUR with symbol after', () => {
        expect(formatCurrency(1234.56, 'EUR')).toBe('1 234.56 €');
      });

      it('should format USD with symbol before', () => {
        expect(formatCurrency(1234.56, 'USD')).toBe('$1 234.56');
      });

      it('should format GBP with symbol before', () => {
        expect(formatCurrency(999.99, 'GBP')).toBe('£999.99');
      });

      it('should format JPY with no decimals', () => {
        expect(formatCurrency(1234.56, 'JPY')).toBe('¥1 235');
      });

      it('should format HUF with no decimals', () => {
        expect(formatCurrency(1234.99, 'HUF')).toBe('1 235 Ft');
      });
    });

    describe('options.showSymbol', () => {
      it('should hide symbol when showSymbol is false', () => {
        expect(formatCurrency(1234.56, 'EUR', { showSymbol: false })).toBe('1 234.56');
        expect(formatCurrency(1234.56, 'USD', { showSymbol: false })).toBe('1 234.56');
      });

      it('should show symbol by default', () => {
        expect(formatCurrency(100, 'EUR')).toContain('€');
        expect(formatCurrency(100, 'USD')).toContain('$');
      });
    });

    describe('options.showCode', () => {
      it('should show currency code when requested', () => {
        expect(formatCurrency(1234.56, 'EUR', { showCode: true })).toBe('1 234.56 € EUR');
        expect(formatCurrency(1234.56, 'USD', { showCode: true })).toBe('$1 234.56 USD');
      });

      it('should not show code by default', () => {
        expect(formatCurrency(100, 'EUR')).not.toContain('EUR');
        expect(formatCurrency(100, 'USD')).not.toContain('USD');
      });

      it('should show both symbol and code', () => {
        const result = formatCurrency(100, 'GBP', { showSymbol: true, showCode: true });
        expect(result).toContain('£');
        expect(result).toContain('GBP');
      });
    });

    describe('options.useGrouping', () => {
      it('should use thousands separator by default', () => {
        expect(formatCurrency(1234567.89, 'EUR')).toBe('1 234 567.89 €');
        expect(formatCurrency(1000, 'USD')).toBe('$1 000.00');
      });

      it('should not use separator when useGrouping is false', () => {
        expect(formatCurrency(1234567.89, 'EUR', { useGrouping: false })).toBe('1234567.89 €');
        expect(formatCurrency(1000, 'USD', { useGrouping: false })).toBe('$1000.00');
      });
    });

    describe('edge cases', () => {
      it('should handle zero', () => {
        expect(formatCurrency(0, 'EUR')).toBe('0.00 €');
        expect(formatCurrency(0, 'JPY')).toBe('¥0');
      });

      it('should handle negative amounts', () => {
        expect(formatCurrency(-100.50, 'USD')).toBe('$-100.50');
        expect(formatCurrency(-999, 'EUR')).toBe('-999.00 €');
      });

      it('should handle very large numbers', () => {
        expect(formatCurrency(9999999.99, 'EUR')).toBe('9 999 999.99 €');
      });

      it('should handle very small decimals', () => {
        expect(formatCurrency(0.01, 'EUR')).toBe('0.01 €');
        expect(formatCurrency(0.99, 'USD')).toBe('$0.99');
      });

      it('should round properly for JPY', () => {
        expect(formatCurrency(123.4, 'JPY')).toBe('¥123');
        expect(formatCurrency(123.5, 'JPY')).toBe('¥124');
        expect(formatCurrency(123.9, 'JPY')).toBe('¥124');
      });
    });

    describe('all currency symbols', () => {
      it('should format Swedish Krona', () => {
        expect(formatCurrency(100, 'SEK')).toBe('100.00 kr');
      });

      it('should format Norwegian Krone', () => {
        expect(formatCurrency(100, 'NOK')).toBe('100.00 kr');
      });

      it('should format Indian Rupee', () => {
        expect(formatCurrency(100, 'INR')).toBe('₹100.00');
      });

      it('should format Turkish Lira', () => {
        expect(formatCurrency(100, 'TRY')).toBe('₺100.00');
      });

      it('should format Russian Ruble', () => {
        expect(formatCurrency(100, 'RUB')).toBe('100.00 ₽');
      });
    });
  });

  describe('formatAmountForXml', () => {
    it('should always format with 2 decimals', () => {
      expect(formatAmountForXml(100)).toBe('100.00');
      expect(formatAmountForXml(0)).toBe('0.00');
      expect(formatAmountForXml(1234.5)).toBe('1234.50');
    });

    it('should handle negative amounts', () => {
      expect(formatAmountForXml(-50.5)).toBe('-50.50');
      expect(formatAmountForXml(-100)).toBe('-100.00');
    });

    it('should round to 2 decimals', () => {
      expect(formatAmountForXml(123.456)).toBe('123.46');
      expect(formatAmountForXml(123.454)).toBe('123.45');
    });

    it('should not include thousands separators', () => {
      expect(formatAmountForXml(1234567.89)).toBe('1234567.89');
    });

    it('should handle very small decimals', () => {
      expect(formatAmountForXml(0.01)).toBe('0.01');
      expect(formatAmountForXml(0.001)).toBe('0.00');
    });

    it('should handle very large numbers', () => {
      expect(formatAmountForXml(999999999.99)).toBe('999999999.99');
    });
  });

  describe('parseCurrency', () => {
    it('should parse EUR formatted amounts', () => {
      expect(parseCurrency('1234.56 €', 'EUR')).toBe(1234.56);
      expect(parseCurrency('100.00 €', 'EUR')).toBe(100);
    });

    it('should parse USD formatted amounts', () => {
      expect(parseCurrency('$1234.56', 'USD')).toBe(1234.56);
      expect(parseCurrency('$100.00', 'USD')).toBe(100);
    });

    it('should handle amounts with thousands separators', () => {
      expect(parseCurrency('1 234 567.89 €', 'EUR')).toBe(1234567.89);
      expect(parseCurrency('$1,234,567.89', 'USD')).toBe(1234567.89);
    });

    it('should handle amounts without symbols', () => {
      expect(parseCurrency('1234.56', 'EUR')).toBe(1234.56);
      expect(parseCurrency('100', 'USD')).toBe(100);
    });

    it('should handle amounts with currency code', () => {
      expect(parseCurrency('1234.56 € EUR', 'EUR')).toBe(1234.56);
      expect(parseCurrency('$1234.56 USD', 'USD')).toBe(1234.56);
    });

    it('should handle negative amounts', () => {
      expect(parseCurrency('-100.50 €', 'EUR')).toBe(-100.50);
      expect(parseCurrency('$-50.00', 'USD')).toBe(-50);
    });

    it('should handle JPY without decimals', () => {
      expect(parseCurrency('¥1235', 'JPY')).toBe(1235);
      expect(parseCurrency('1235', 'JPY')).toBe(1235);
    });

    it('should throw for invalid formatted strings', () => {
      expect(() => parseCurrency('invalid', 'EUR')).toThrow('Invalid currency amount: invalid');
      expect(() => parseCurrency('abc €', 'EUR')).toThrow('Invalid currency amount: abc €');
      expect(() => parseCurrency('', 'EUR')).toThrow('Invalid currency amount:');
    });

    it('should handle extra whitespace', () => {
      expect(parseCurrency('  1234.56  €  ', 'EUR')).toBe(1234.56);
      expect(parseCurrency('  $  100.00  ', 'USD')).toBe(100);
    });
  });

  describe('convertCurrency', () => {
    it('should return same amount for same currency', () => {
      expect(convertCurrency(100, 'EUR', 'EUR')).toBe(100);
      expect(convertCurrency(1234.56, 'USD', 'USD')).toBe(1234.56);
    });

    it('should convert with provided exchange rate', () => {
      expect(convertCurrency(100, 'EUR', 'USD', 1.1)).toBeCloseTo(110, 5);
      expect(convertCurrency(200, 'USD', 'EUR', 0.9)).toBeCloseTo(180, 5);
    });

    it('should handle fractional exchange rates', () => {
      expect(convertCurrency(100, 'EUR', 'GBP', 0.85)).toBe(85);
      expect(convertCurrency(50, 'USD', 'JPY', 110.5)).toBe(5525);
    });

    it('should throw when exchange rate is not provided', () => {
      expect(() => convertCurrency(100, 'EUR', 'USD')).toThrow(
        'Exchange rate required for currency conversion'
      );
      expect(() => convertCurrency(100, 'USD', 'GBP')).toThrow(
        'Exchange rate required for currency conversion'
      );
    });

    it('should handle zero amount', () => {
      expect(convertCurrency(0, 'EUR', 'USD', 1.1)).toBe(0);
    });

    it('should handle negative amounts', () => {
      expect(convertCurrency(-100, 'EUR', 'USD', 1.1)).toBeCloseTo(-110, 5);
    });

    it('should handle very small exchange rates', () => {
      expect(convertCurrency(1000, 'USD', 'JPY', 0.01)).toBe(10);
    });

    it('should handle very large exchange rates', () => {
      expect(convertCurrency(10, 'EUR', 'JPY', 130)).toBe(1300);
    });
  });

  describe('CurrencyFormatter object', () => {
    it('should export all methods', () => {
      expect(CurrencyFormatter.isValid).toBe(isValidCurrency);
      expect(CurrencyFormatter.getInfo).toBe(getCurrencyInfo);
      expect(CurrencyFormatter.format).toBe(formatCurrency);
      expect(CurrencyFormatter.formatForXml).toBe(formatAmountForXml);
      expect(CurrencyFormatter.parse).toBe(parseCurrency);
      expect(CurrencyFormatter.convert).toBe(convertCurrency);
    });

    it('should work with object methods', () => {
      expect(CurrencyFormatter.isValid('EUR')).toBe(true);
      expect(CurrencyFormatter.format(100, 'USD')).toBe('$100.00');
      expect(CurrencyFormatter.formatForXml(123.456)).toBe('123.46');
    });
  });
});
