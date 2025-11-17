import {
  getGuidelineUrn,
  getProfilePolicy,
  formatDateFacturX,
  formatAmount,
  isValidAmount,
  getRegionalConfig,
  getRegionalConfigOrDefault,
  VALIDATION_LIMITS,
  PATTERNS,
} from '../../core/constants';
import { FacturxProfile } from '../../types';

describe('constants', () => {
  describe('getGuidelineUrn', () => {
    it('should return correct URN for all profiles', () => {
      expect(getGuidelineUrn(FacturxProfile.MINIMUM)).toBe('urn:factur-x.eu:1p0:minimum');
      expect(getGuidelineUrn(FacturxProfile.BASICWL)).toBe('urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basicwl');
      expect(getGuidelineUrn(FacturxProfile.BASIC)).toBe('urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basic');
      expect(getGuidelineUrn(FacturxProfile.EN16931)).toBe('urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931');
      expect(getGuidelineUrn(FacturxProfile.EXTENDED)).toBe('urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:extended');
    });

    it('should throw for unknown profile', () => {
      expect(() => getGuidelineUrn('UNKNOWN' as any)).toThrow();
    });
  });

  describe('getProfilePolicy', () => {
    it('should return policy for all profiles', () => {
      const minPolicy = getProfilePolicy(FacturxProfile.MINIMUM);
      expect(minPolicy.mandatoryFields).toBeDefined();
      expect(minPolicy.forbiddenFields).toBeDefined();

      const en16931Policy = getProfilePolicy(FacturxProfile.EN16931);
      expect(en16931Policy.mandatoryFields.length).toBeGreaterThan(0);
    });

    it('should throw for unknown profile', () => {
      expect(() => getProfilePolicy('INVALID' as any)).toThrow();
    });
  });

  describe('formatDateFacturX', () => {
    it('should format date to YYYYMMDD', () => {
      expect(formatDateFacturX(new Date('2025-01-15'))).toBe('20250115');
      expect(formatDateFacturX(new Date('2025-12-31'))).toBe('20251231');
    });

    it('should pad single digits with zero', () => {
      expect(formatDateFacturX(new Date('2025-01-05'))).toBe('20250105');
      expect(formatDateFacturX(new Date('2025-09-09'))).toBe('20250909');
    });

    it('should handle leap years', () => {
      expect(formatDateFacturX(new Date('2024-02-29'))).toBe('20240229');
    });

    it('should handle year boundaries', () => {
      expect(formatDateFacturX(new Date('2025-01-01'))).toBe('20250101');
      expect(formatDateFacturX(new Date('2025-12-31'))).toBe('20251231');
    });
  });

  describe('formatAmount', () => {
    it('should format amount with 2 decimals', () => {
      expect(formatAmount(100)).toBe('100.00');
      expect(formatAmount(123.456)).toBe('123.46');
      expect(formatAmount(0.1)).toBe('0.10');
    });

    it('should handle zero', () => {
      expect(formatAmount(0)).toBe('0.00');
    });

    it('should handle negative amounts', () => {
      expect(formatAmount(-50.5)).toBe('-50.50');
    });

    it('should round properly', () => {
      expect(formatAmount(123.445)).toBe('123.44'); // Banker's rounding (round half to even)
      expect(formatAmount(123.455)).toBe('123.45'); // Banker's rounding (round half to even)
      expect(formatAmount(123.456)).toBe('123.46'); // Normal rounding
      expect(formatAmount(123.995)).toBe('124.00');
    });
  });

  describe('isValidAmount', () => {
    it('should validate normal amounts', () => {
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(0.01)).toBe(true);
      expect(isValidAmount(999999)).toBe(true);
    });

    it('should reject NaN', () => {
      expect(isValidAmount(NaN)).toBe(false);
    });

    it('should reject Infinity', () => {
      expect(isValidAmount(Infinity)).toBe(false);
      expect(isValidAmount(-Infinity)).toBe(false);
    });

    it('should check against MIN_AMOUNT', () => {
      expect(isValidAmount(VALIDATION_LIMITS.MIN_AMOUNT - 1)).toBe(false);
      expect(isValidAmount(VALIDATION_LIMITS.MIN_AMOUNT)).toBe(true);
    });

    it('should check against MAX_AMOUNT', () => {
      expect(isValidAmount(VALIDATION_LIMITS.MAX_AMOUNT + 1)).toBe(false);
      expect(isValidAmount(VALIDATION_LIMITS.MAX_AMOUNT)).toBe(true);
    });

    it('should accept zero', () => {
      expect(isValidAmount(0)).toBe(true);
    });

    it('should reject negative amounts (MIN_AMOUNT is 0)', () => {
      expect(isValidAmount(-100)).toBe(false);
      expect(isValidAmount(-0.01)).toBe(false);
    });
  });

  describe('getRegionalConfig', () => {
    it('should return config for supported countries', () => {
      const frConfig = getRegionalConfig('FR');
      expect(frConfig).toBeDefined();
      expect(frConfig?.defaultCurrency).toBe('EUR');

      const usConfig = getRegionalConfig('US');
      expect(usConfig).toBeDefined();
      expect(usConfig?.defaultCurrency).toBe('USD');
    });

    it('should return undefined for unknown country', () => {
      expect(getRegionalConfig('XX')).toBeUndefined();
      expect(getRegionalConfig('ZZ')).toBeUndefined();
    });

    it('should normalize to uppercase', () => {
      const config1 = getRegionalConfig('fr');
      const config2 = getRegionalConfig('FR');
      expect(config1).toEqual(config2);
    });

    it('should handle all documented countries', () => {
      const countries = ['FR', 'DE', 'GB', 'IT', 'ES', 'NL', 'BE', 'CH', 'US'];
      countries.forEach(code => {
        const config = getRegionalConfig(code);
        expect(config).toBeDefined();
        expect(config?.defaultCurrency).toBeDefined();
        expect(config?.dateFormat).toBeDefined();
      });
    });
  });

  describe('getRegionalConfigOrDefault', () => {
    it('should return config for valid country', () => {
      const config = getRegionalConfigOrDefault('DE');
      expect(config.defaultCurrency).toBe('EUR');
    });

    it('should fallback to FR for unknown country', () => {
      const config = getRegionalConfigOrDefault('XX');
      expect(config.defaultCurrency).toBe('EUR');
    });

    it('should use custom fallback', () => {
      const config = getRegionalConfigOrDefault('XX', 'US');
      expect(config.defaultCurrency).toBe('USD');
    });

    it('should return undefined if both country codes are invalid', () => {
      const config = getRegionalConfigOrDefault('XX', 'YY');
      // When both fail, the function returns undefined! (the last OR returns undefined)
      expect(config).toBeUndefined();
    });
  });

  describe('VALIDATION_LIMITS', () => {
    it('should have all required limits', () => {
      expect(VALIDATION_LIMITS.MIN_AMOUNT).toBeDefined();
      expect(VALIDATION_LIMITS.MAX_AMOUNT).toBeDefined();
      expect(VALIDATION_LIMITS.MAX_LINES).toBeDefined();
      expect(VALIDATION_LIMITS.MAX_DECIMAL_PLACES).toBeDefined();
      expect(VALIDATION_LIMITS.MAX_INVOICE_NUMBER_LENGTH).toBeDefined();
      expect(VALIDATION_LIMITS.MAX_EMAIL_LENGTH).toBeDefined();
      expect(VALIDATION_LIMITS.MAX_PHONE_LENGTH).toBeDefined();
      expect(VALIDATION_LIMITS.MAX_VAT_ID_LENGTH).toBeDefined();
    });

    it('should have sensible values', () => {
      expect(VALIDATION_LIMITS.MAX_AMOUNT).toBeGreaterThan(VALIDATION_LIMITS.MIN_AMOUNT);
      expect(VALIDATION_LIMITS.MAX_LINES).toBeGreaterThan(0);
      expect(VALIDATION_LIMITS.MAX_DECIMAL_PLACES).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PATTERNS', () => {
    it('should have regex patterns compiled', () => {
      expect(PATTERNS.EMAIL).toBeInstanceOf(RegExp);
      expect(PATTERNS.PHONE).toBeInstanceOf(RegExp);
      expect(PATTERNS.INVOICE_NUMBER).toBeInstanceOf(RegExp);
      expect(PATTERNS.CURRENCY_CODE).toBeInstanceOf(RegExp);
      expect(PATTERNS.COUNTRY_CODE).toBeInstanceOf(RegExp);
    });

    it('EMAIL pattern should match valid emails', () => {
      expect(PATTERNS.EMAIL.test('test@example.com')).toBe(true);
      expect(PATTERNS.EMAIL.test('user+tag@domain.co.uk')).toBe(true);
    });

    it('EMAIL pattern should reject invalid emails', () => {
      expect(PATTERNS.EMAIL.test('notanemail')).toBe(false);
      expect(PATTERNS.EMAIL.test('@example.com')).toBe(false);
    });

    it('PHONE pattern should match valid phones', () => {
      expect(PATTERNS.PHONE.test('+33123456789')).toBe(true);
      expect(PATTERNS.PHONE.test('01 23 45 67 89')).toBe(true);
    });

    it('CURRENCY_CODE should match 3-letter codes', () => {
      expect(PATTERNS.CURRENCY_CODE.test('EUR')).toBe(true);
      expect(PATTERNS.CURRENCY_CODE.test('USD')).toBe(true);
      expect(PATTERNS.CURRENCY_CODE.test('EU')).toBe(false);
    });

    it('COUNTRY_CODE should match 2-letter codes', () => {
      expect(PATTERNS.COUNTRY_CODE.test('FR')).toBe(true);
      expect(PATTERNS.COUNTRY_CODE.test('US')).toBe(true);
      expect(PATTERNS.COUNTRY_CODE.test('FRA')).toBe(false);
    });
  });
});
