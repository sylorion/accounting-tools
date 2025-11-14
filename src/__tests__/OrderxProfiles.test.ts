// src/__tests__/OrderxProfiles.test.ts

import {
  OrderxProfiles,
  getOrderxProfileConfig,
  supportsFeature,
  OrderTypeCode,
  OrderPriority,
  OrderStatus
} from '../core/OrderxProfiles';

describe('OrderxProfiles', () => {
  describe('OrderxProfiles enum', () => {
    it('should have BASIC profile', () => {
      expect(OrderxProfiles.BASIC).toBe('BASIC');
    });

    it('should have COMFORT profile', () => {
      expect(OrderxProfiles.COMFORT).toBe('COMFORT');
    });

    it('should have EXTENDED profile', () => {
      expect(OrderxProfiles.EXTENDED).toBe('EXTENDED');
    });
  });

  describe('getOrderxProfileConfig', () => {
    it('should return BASIC profile config', () => {
      const config = getOrderxProfileConfig(OrderxProfiles.BASIC);
      expect(config.profile).toBe(OrderxProfiles.BASIC);
      expect(config.urn).toBe('urn:order-x.eu:1p0:basic#');
      expect(config.supportsLineAllowances).toBe(false);
      expect(config.supportsDocAllowances).toBe(false);
    });

    it('should return COMFORT profile config', () => {
      const config = getOrderxProfileConfig(OrderxProfiles.COMFORT);
      expect(config.profile).toBe(OrderxProfiles.COMFORT);
      expect(config.urn).toBe('urn:order-x.eu:1p0:comfort#');
      expect(config.supportsLineAllowances).toBe(false);
      expect(config.supportsDocAllowances).toBe(true);
      expect(config.supportsDeliveryDetails).toBe(true);
    });

    it('should return EXTENDED profile config', () => {
      const config = getOrderxProfileConfig(OrderxProfiles.EXTENDED);
      expect(config.profile).toBe(OrderxProfiles.EXTENDED);
      expect(config.urn).toBe('urn:order-x.eu:1p0:extended#');
      expect(config.supportsLineAllowances).toBe(true);
      expect(config.supportsDocAllowances).toBe(true);
      expect(config.supportsAdditionalDocuments).toBe(true);
    });
  });

  describe('supportsFeature', () => {
    it('should return false for line allowances in BASIC', () => {
      expect(supportsFeature(OrderxProfiles.BASIC, 'supportsLineAllowances')).toBe(false);
    });

    it('should return true for doc allowances in COMFORT', () => {
      expect(supportsFeature(OrderxProfiles.COMFORT, 'supportsDocAllowances')).toBe(true);
    });

    it('should return true for additional documents in EXTENDED', () => {
      expect(supportsFeature(OrderxProfiles.EXTENDED, 'supportsAdditionalDocuments')).toBe(true);
    });

    it('should return false for additional documents in BASIC', () => {
      expect(supportsFeature(OrderxProfiles.BASIC, 'supportsAdditionalDocuments')).toBe(false);
    });
  });

  describe('Profile constraints', () => {
    it('BASIC should have required fields', () => {
      const config = getOrderxProfileConfig(OrderxProfiles.BASIC);
      expect(config.requiredFields).toContain('orderNumber');
      expect(config.requiredFields).toContain('orderDate');
      expect(config.requiredFields).toContain('seller');
      expect(config.requiredFields).toContain('buyer');
      expect(config.requiredFields).toContain('currency');
      expect(config.requiredFields).toContain('items');
    });

    it('BASIC should have forbidden fields', () => {
      const config = getOrderxProfileConfig(OrderxProfiles.BASIC);
      expect(config.forbiddenFields).toContain('lineAllowances');
      expect(config.forbiddenFields).toContain('docAllowances');
      expect(config.forbiddenFields).toContain('additionalDocuments');
    });

    it('EXTENDED should have no forbidden fields', () => {
      const config = getOrderxProfileConfig(OrderxProfiles.EXTENDED);
      expect(config.forbiddenFields).toHaveLength(0);
    });
  });

  describe('OrderTypeCode enum', () => {
    it('should have standard order code', () => {
      expect(OrderTypeCode.ORDER).toBe('220');
    });

    it('should have express order code', () => {
      expect(OrderTypeCode.EXPRESS_ORDER).toBe('221');
    });

    it('should have quotation code', () => {
      expect(OrderTypeCode.QUOTATION).toBe('310');
    });
  });

  describe('OrderPriority enum', () => {
    it('should have priority levels', () => {
      expect(OrderPriority.URGENT).toBe('1');
      expect(OrderPriority.HIGH).toBe('2');
      expect(OrderPriority.NORMAL).toBe('3');
      expect(OrderPriority.LOW).toBe('5');
    });
  });

  describe('OrderStatus enum', () => {
    it('should have all status values', () => {
      expect(OrderStatus.DRAFT).toBe('1');
      expect(OrderStatus.SUBMITTED).toBe('2');
      expect(OrderStatus.ACCEPTED).toBe('3');
      expect(OrderStatus.REJECTED).toBe('4');
      expect(OrderStatus.IN_PROGRESS).toBe('5');
      expect(OrderStatus.COMPLETED).toBe('6');
      expect(OrderStatus.CANCELLED).toBe('7');
    });
  });
});
