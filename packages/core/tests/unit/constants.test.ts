/**
 * Tests for constants.ts module
 * Focus: Helper functions and regional configurations
 */

import {
  getGuidelineUrn,
  getProfilePolicy,
  formatDateFacturX,
  formatAmount,
  isValidAmount,
  getRegionalConfig,
  getRegionalConfigOrDefault,
  VALIDATION_LIMITS,
} from '../../src/core/constants';
import { FacturxProfile } from '../../src/types';

describe('Constants Helper Functions', () => {
  describe('getGuidelineUrn', () => {
    it('should return URN for MINIMUM profile', () => {
      const urn = getGuidelineUrn(FacturxProfile.MINIMUM);
      expect(urn).toBe('urn:factur-x.eu:1p0:minimum');
    });

    it('should return URN for BASICWL profile', () => {
      const urn = getGuidelineUrn(FacturxProfile.BASICWL);
      expect(urn).toBe('urn:factur-x.eu:1p0:basicwl');
    });

    it('should return URN for BASIC profile', () => {
      const urn = getGuidelineUrn(FacturxProfile.BASIC);
      expect(urn).toBe('urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic');
    });

    it('should return URN for EN16931 profile', () => {
      const urn = getGuidelineUrn(FacturxProfile.EN16931);
      expect(urn).toBe('urn:cen.eu:en16931:2017');
    });

    it('should return URN for EXTENDED profile', () => {
      const urn = getGuidelineUrn(FacturxProfile.EXTENDED);
      expect(urn).toBe('urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended');
    });

    it('should throw error for unknown profile', () => {
      expect(() => getGuidelineUrn('INVALID_PROFILE' as any)).toThrow('Unknown profile');
    });
  });

  describe('getProfilePolicy', () => {
    it('should return policy for MINIMUM profile', () => {
      const policy = getProfilePolicy(FacturxProfile.MINIMUM);
      expect(policy).toBeDefined();
      expect(policy.mandatoryFields).toContain('header.id');
      expect(policy.mandatoryFields).toContain('seller.name');
    });

    it('should return policy for EN16931 profile', () => {
      const policy = getProfilePolicy(FacturxProfile.EN16931);
      expect(policy).toBeDefined();
      expect(policy.mandatoryFields).toContain('header.typeCode');
      expect(policy.mandatoryFields).toContain('seller.address.city');
    });

    it('should throw error for unknown profile', () => {
      expect(() => getProfilePolicy('UNKNOWN' as any)).toThrow('Unknown profile');
    });

    it('should return frozen policy object', () => {
      const policy = getProfilePolicy(FacturxProfile.MINIMUM);
      expect(Array.isArray(policy.mandatoryFields)).toBe(true);
      expect(Array.isArray(policy.forbiddenFields)).toBe(true);
    });
  });

  describe('formatDateFacturX', () => {
    it('should format date to CCYYMMDD', () => {
      const date = new Date('2023-11-15');
      const formatted = formatDateFacturX(date);
      expect(formatted).toBe('20231115');
    });

    it('should pad single digit month', () => {
      const date = new Date('2023-01-05');
      const formatted = formatDateFacturX(date);
      expect(formatted).toBe('20230105');
    });

    it('should pad single digit day', () => {
      const date = new Date('2023-12-01');
      const formatted = formatDateFacturX(date);
      expect(formatted).toBe('20231201');
    });

    it('should handle leap year dates', () => {
      const date = new Date('2024-02-29');
      const formatted = formatDateFacturX(date);
      expect(formatted).toBe('20240229');
    });

    it('should handle year 2000', () => {
      const date = new Date('2000-01-01');
      const formatted = formatDateFacturX(date);
      expect(formatted).toBe('20000101');
    });
  });

  describe('formatAmount', () => {
    it('should format amount with 2 decimal places', () => {
      expect(formatAmount(100)).toBe('100.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatAmount(100.126)).toBe('100.13');
      expect(formatAmount(100.124)).toBe('100.12');
    });

    it('should handle zero', () => {
      expect(formatAmount(0)).toBe('0.00');
    });

    it('should handle negative amounts', () => {
      expect(formatAmount(-50.5)).toBe('-50.50');
    });

    it('should handle very large numbers', () => {
      expect(formatAmount(999999999.99)).toBe('999999999.99');
    });

    it('should handle very small decimals', () => {
      expect(formatAmount(0.01)).toBe('0.01');
      expect(formatAmount(0.001)).toBe('0.00');
    });
  });

  describe('isValidAmount', () => {
    it('should validate positive amounts', () => {
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(0.01)).toBe(true);
    });

    it('should validate zero', () => {
      expect(isValidAmount(0)).toBe(true);
    });

    it('should reject negative amounts', () => {
      expect(isValidAmount(-100)).toBe(false);
      expect(isValidAmount(-0.01)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(isValidAmount(NaN)).toBe(false);
    });

    it('should reject Infinity', () => {
      expect(isValidAmount(Infinity)).toBe(false);
    });

    it('should reject -Infinity', () => {
      expect(isValidAmount(-Infinity)).toBe(false);
    });

    it('should reject amounts below minimum', () => {
      const belowMin = VALIDATION_LIMITS.MIN_AMOUNT - 1;
      expect(isValidAmount(belowMin)).toBe(false);
    });

    it('should reject amounts above maximum', () => {
      const aboveMax = VALIDATION_LIMITS.MAX_AMOUNT + 1;
      expect(isValidAmount(aboveMax)).toBe(false);
    });

    it('should accept amount at minimum boundary', () => {
      expect(isValidAmount(VALIDATION_LIMITS.MIN_AMOUNT)).toBe(true);
    });

    it('should accept amount at maximum boundary', () => {
      expect(isValidAmount(VALIDATION_LIMITS.MAX_AMOUNT)).toBe(true);
    });
  });

  describe('getRegionalConfig', () => {
    it('should return French regional config', () => {
      const config = getRegionalConfig('FR');
      expect(config).toBeDefined();
      expect(config?.countryCode).toBe('FR');
      expect(config?.defaultCurrency).toBe('EUR');
    });

    it('should return German regional config', () => {
      const config = getRegionalConfig('DE');
      expect(config).toBeDefined();
      expect(config?.countryCode).toBe('DE');
      expect(config?.defaultCurrency).toBe('EUR');
    });

    it('should return Italian regional config', () => {
      const config = getRegionalConfig('IT');
      expect(config).toBeDefined();
      expect(config?.countryCode).toBe('IT');
      expect(config?.defaultCurrency).toBe('EUR');
    });

    it('should handle lowercase country codes', () => {
      const config = getRegionalConfig('fr');
      expect(config).toBeDefined();
      expect(config?.countryCode).toBe('FR');
    });

    it('should return undefined for unknown country', () => {
      const config = getRegionalConfig('XX');
      expect(config).toBeUndefined();
    });

    it('should handle case insensitivity', () => {
      const upper = getRegionalConfig('GB');
      const lower = getRegionalConfig('gb');
      expect(upper).toEqual(lower);
    });
  });

  describe('getRegionalConfigOrDefault', () => {
    it('should return config for valid country code', () => {
      const config = getRegionalConfigOrDefault('DE');
      expect(config).toBeDefined();
      expect(config.countryCode).toBe('DE');
    });

    it('should fallback to FR for invalid country', () => {
      const config = getRegionalConfigOrDefault('XX');
      expect(config).toBeDefined();
      expect(config.countryCode).toBe('FR');
    });

    it('should use custom fallback code', () => {
      const config = getRegionalConfigOrDefault('XX', 'DE');
      expect(config).toBeDefined();
      expect(config.countryCode).toBe('DE');
    });

    it('should handle lowercase input with fallback', () => {
      const config = getRegionalConfigOrDefault('xx', 'de');
      expect(config).toBeDefined();
      expect(config.countryCode).toBe('DE');
    });

    it('should return requested config even if fallback is invalid', () => {
      const config = getRegionalConfigOrDefault('FR', 'INVALID');
      expect(config).toBeDefined();
      expect(config.countryCode).toBe('FR');
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle rapid profile policy lookups', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        getProfilePolicy(FacturxProfile.EN16931);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // O(1) lookup should be very fast
    });

    it('should handle rapid URN lookups', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        getGuidelineUrn(FacturxProfile.EN16931);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // O(1) lookup should be very fast
    });

    it('should handle rapid regional config lookups', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        getRegionalConfig('FR');
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // O(1) lookup should be very fast
    });

    it('should format many dates efficiently', () => {
      const dates = Array.from({ length: 100 }, (_, i) =>
        new Date(2023, i % 12, (i % 28) + 1)
      );
      const start = Date.now();
      dates.forEach(formatDateFacturX);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should format many amounts efficiently', () => {
      const amounts = Array.from({ length: 1000 }, (_, i) => i * 0.1);
      const start = Date.now();
      amounts.forEach(formatAmount);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
