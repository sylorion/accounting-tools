// src/__tests__/AllowanceCharge.test.ts

import { AllowanceCharge } from '../core/AllowanceCharge';
import { TaxCategoryCode } from '../core/EnumInvoiceType';

describe('AllowanceCharge', () => {
  describe('Constructor', () => {
    it('should create allowance (discount) with minimal parameters', () => {
      const allowance = new AllowanceCharge(
        false, // allowance
        10,    // amount
        'Volume discount'
      );

      expect(allowance.chargeIndicator).toBe(false);
      expect(allowance.actualAmount).toBe(10);
      expect(allowance.reason).toBe('Volume discount');
    });

    it('should create charge with minimal parameters', () => {
      const charge = new AllowanceCharge(
        true,  // charge
        25,    // amount
        'Shipping fee'
      );

      expect(charge.chargeIndicator).toBe(true);
      expect(charge.actualAmount).toBe(25);
      expect(charge.reason).toBe('Shipping fee');
    });

    it('should create allowance with all parameters', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const allowance = new AllowanceCharge(
        false,
        100,
        'Special promotion',
        'PROMO',
        0.20,
        TaxCategoryCode.STANDARD,
        startDate,
        endDate,
        0.10,
        1000
      );

      expect(allowance.chargeIndicator).toBe(false);
      expect(allowance.actualAmount).toBe(100);
      expect(allowance.reason).toBe('Special promotion');
      expect(allowance.reasonCode).toBe('PROMO');
      expect(allowance.taxRate).toBe(0.20);
      expect(allowance.taxCategoryCode).toBe(TaxCategoryCode.STANDARD);
      expect(allowance.startDate).toBe(startDate);
      expect(allowance.endDate).toBe(endDate);
      expect(allowance.percentage).toBe(0.10);
      expect(allowance.basisAmount).toBe(1000);
    });
  });

  describe('Allowances (discounts)', () => {
    it('should identify as allowance when chargeIndicator is false', () => {
      const allowance = new AllowanceCharge(false, 50, 'Discount');
      expect(allowance.chargeIndicator).toBe(false);
    });

    it('should handle percentage-based allowance', () => {
      const allowance = new AllowanceCharge(
        false,
        100,      // actual amount
        'Discount 10%',
        'DISC10',
        0.20,
        undefined,
        undefined,
        undefined,
        0.10,     // 10% percentage
        1000      // basis amount
      );

      expect(allowance.percentage).toBe(0.10);
      expect(allowance.basisAmount).toBe(1000);
      expect(allowance.actualAmount).toBe(100); // Should be 10% of 1000
    });

    it('should handle fixed amount allowance', () => {
      const allowance = new AllowanceCharge(
        false,
        50,
        'Fixed discount'
      );

      expect(allowance.actualAmount).toBe(50);
      expect(allowance.percentage).toBeUndefined();
      expect(allowance.basisAmount).toBeUndefined();
    });
  });

  describe('Charges (fees)', () => {
    it('should identify as charge when chargeIndicator is true', () => {
      const charge = new AllowanceCharge(true, 30, 'Processing fee');
      expect(charge.chargeIndicator).toBe(true);
    });

    it('should handle shipping charge', () => {
      const charge = new AllowanceCharge(
        true,
        25,
        'Shipping costs',
        'SHIP',
        0.20,
        TaxCategoryCode.STANDARD
      );

      expect(charge.chargeIndicator).toBe(true);
      expect(charge.actualAmount).toBe(25);
      expect(charge.reason).toBe('Shipping costs');
      expect(charge.reasonCode).toBe('SHIP');
      expect(charge.taxRate).toBe(0.20);
    });

    it('should handle handling charge', () => {
      const charge = new AllowanceCharge(
        true,
        15,
        'Handling fee',
        'HAND',
        0.20
      );

      expect(charge.actualAmount).toBe(15);
      expect(charge.reasonCode).toBe('HAND');
    });
  });

  describe('Tax handling', () => {
    it('should store VAT rate', () => {
      const item = new AllowanceCharge(
        false,
        100,
        'Discount',
        'DISC',
        0.20 // 20% VAT
      );

      expect(item.taxRate).toBe(0.20);
    });

    it('should handle different VAT rates', () => {
      const item1 = new AllowanceCharge(false, 100, 'Discount', 'DISC', 0.20);
      const item2 = new AllowanceCharge(false, 100, 'Discount', 'DISC', 0.10);
      const item3 = new AllowanceCharge(false, 100, 'Discount', 'DISC', 0.055);

      expect(item1.taxRate).toBe(0.20);
      expect(item2.taxRate).toBe(0.10);
      expect(item3.taxRate).toBe(0.055);
    });

    it('should handle zero VAT rate', () => {
      const item = new AllowanceCharge(
        false,
        100,
        'Discount',
        'DISC',
        0
      );

      expect(item.taxRate).toBe(0);
    });

    it('should handle tax categories', () => {
      const standard = new AllowanceCharge(
        false, 100, 'Discount', 'DISC', 0.20, TaxCategoryCode.STANDARD
      );
      const reduced = new AllowanceCharge(
        false, 100, 'Discount', 'DISC', 0.10, TaxCategoryCode.REDUCED
      );
      const exempt = new AllowanceCharge(
        false, 100, 'Discount', 'DISC', 0, TaxCategoryCode.EXEMPT
      );

      expect(standard.taxCategoryCode).toBe(TaxCategoryCode.STANDARD);
      expect(reduced.taxCategoryCode).toBe(TaxCategoryCode.REDUCED);
      expect(exempt.taxCategoryCode).toBe(TaxCategoryCode.EXEMPT);
    });

    it('should allow undefined VAT rate', () => {
      const item = new AllowanceCharge(false, 100, 'Discount');
      expect(item.taxRate).toBeUndefined();
    });
  });

  describe('Validity period', () => {
    it('should handle start and end dates', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const item = new AllowanceCharge(
        false,
        100,
        'Seasonal discount',
        'SEASON',
        0.20,
        undefined,
        startDate,
        endDate
      );

      expect(item.startDate).toBe(startDate);
      expect(item.endDate).toBe(endDate);
    });

    it('should allow undefined dates', () => {
      const item = new AllowanceCharge(false, 100, 'Discount');
      expect(item.startDate).toBeUndefined();
      expect(item.endDate).toBeUndefined();
    });

    it('should handle same start and end date', () => {
      const date = new Date('2025-01-15');
      const item = new AllowanceCharge(
        false, 100, 'One day offer', 'ONEDAY', 0.20, undefined, date, date
      );

      expect(item.startDate).toBe(date);
      expect(item.endDate).toBe(date);
    });
  });

  describe('Reason codes', () => {
    it('should handle common discount codes', () => {
      const codes = [
        { code: 'DISC', reason: 'Standard discount' },
        { code: 'PROMO', reason: 'Promotional discount' },
        { code: 'VOL', reason: 'Volume discount' },
        { code: 'EARLY', reason: 'Early payment discount' }
      ];

      codes.forEach(({ code, reason }) => {
        const item = new AllowanceCharge(false, 100, reason, code);
        expect(item.reasonCode).toBe(code);
        expect(item.reason).toBe(reason);
      });
    });

    it('should handle common charge codes', () => {
      const codes = [
        { code: 'SHIP', reason: 'Shipping' },
        { code: 'HAND', reason: 'Handling' },
        { code: 'ADM', reason: 'Administrative fee' },
        { code: 'PACK', reason: 'Packaging' }
      ];

      codes.forEach(({ code, reason }) => {
        const item = new AllowanceCharge(true, 25, reason, code);
        expect(item.reasonCode).toBe(code);
        expect(item.reason).toBe(reason);
      });
    });

    it('should allow undefined reason code', () => {
      const item = new AllowanceCharge(false, 100, 'Discount');
      expect(item.reasonCode).toBeUndefined();
    });
  });

  describe('Percentage calculations', () => {
    it('should store percentage and basis amount', () => {
      const item = new AllowanceCharge(
        false,
        100,
        'Discount 10%',
        'DISC',
        0.20,
        undefined,
        undefined,
        undefined,
        0.10,
        1000
      );

      expect(item.percentage).toBe(0.10);
      expect(item.basisAmount).toBe(1000);
    });

    it('should handle different percentage values', () => {
      const item5 = new AllowanceCharge(false, 50, 'Discount 5%', 'DISC', 0.20, undefined, undefined, undefined, 0.05, 1000);
      const item10 = new AllowanceCharge(false, 100, 'Discount 10%', 'DISC', 0.20, undefined, undefined, undefined, 0.10, 1000);
      const item20 = new AllowanceCharge(false, 200, 'Discount 20%', 'DISC', 0.20, undefined, undefined, undefined, 0.20, 1000);

      expect(item5.percentage).toBe(0.05);
      expect(item10.percentage).toBe(0.10);
      expect(item20.percentage).toBe(0.20);
    });
  });

  describe('Property modification', () => {
    it('should allow modifying properties', () => {
      const item = new AllowanceCharge(false, 100, 'Discount');

      item.actualAmount = 150;
      item.reason = 'Updated discount';
      item.taxRate = 0.10;

      expect(item.actualAmount).toBe(150);
      expect(item.reason).toBe('Updated discount');
      expect(item.taxRate).toBe(0.10);
    });

    it('should allow toggling between allowance and charge', () => {
      const item = new AllowanceCharge(false, 100, 'Discount');
      expect(item.chargeIndicator).toBe(false);

      item.chargeIndicator = true;
      expect(item.chargeIndicator).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero amount', () => {
      const item = new AllowanceCharge(false, 0, 'No discount');
      expect(item.actualAmount).toBe(0);
    });

    it('should handle very large amounts', () => {
      const item = new AllowanceCharge(false, 1000000, 'Huge discount');
      expect(item.actualAmount).toBe(1000000);
    });

    it('should handle fractional amounts', () => {
      const item = new AllowanceCharge(false, 12.57, 'Exact discount');
      expect(item.actualAmount).toBe(12.57);
    });

    it('should handle empty reason', () => {
      const item = new AllowanceCharge(false, 100, '');
      expect(item.reason).toBe('');
    });

    it('should handle special characters in reason', () => {
      const item = new AllowanceCharge(false, 100, 'Discount <>&"àéè');
      expect(item.reason).toBe('Discount <>&"àéè');
    });
  });

  describe('Real-world scenarios', () => {
    it('should create volume discount (10% on 5000 EUR)', () => {
      const discount = new AllowanceCharge(
        false,
        500,
        'Volume discount - 10% on orders above 5000 EUR',
        'VOL10',
        0.20,
        TaxCategoryCode.STANDARD,
        undefined,
        undefined,
        0.10,
        5000
      );

      expect(discount.chargeIndicator).toBe(false);
      expect(discount.actualAmount).toBe(500);
      expect(discount.percentage).toBe(0.10);
      expect(discount.basisAmount).toBe(5000);
    });

    it('should create early payment discount (2%)', () => {
      const discount = new AllowanceCharge(
        false,
        40,
        'Early payment discount - 2% if paid within 10 days',
        'EARLY2',
        0.20,
        TaxCategoryCode.STANDARD,
        undefined,
        undefined,
        0.02,
        2000
      );

      expect(discount.reasonCode).toBe('EARLY2');
      expect(discount.percentage).toBe(0.02);
    });

    it('should create shipping charge with VAT', () => {
      const charge = new AllowanceCharge(
        true,
        35.50,
        'Express shipping',
        'SHIP_EXPRESS',
        0.20,
        TaxCategoryCode.STANDARD
      );

      expect(charge.chargeIndicator).toBe(true);
      expect(charge.actualAmount).toBe(35.50);
      expect(charge.taxRate).toBe(0.20);
    });

    it('should create administrative fee', () => {
      const charge = new AllowanceCharge(
        true,
        15,
        'Administrative processing fee',
        'ADM',
        0.20
      );

      expect(charge.chargeIndicator).toBe(true);
      expect(charge.actualAmount).toBe(15);
    });
  });
});
