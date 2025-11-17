import { AllowanceCharge } from '../AllowanceCharge';
import { TaxCategoryCode } from '../EnumInvoiceType';

describe('AllowanceCharge', () => {
  describe('constructor', () => {
    it('should create a charge with all parameters', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const charge = new AllowanceCharge(
        true,
        50.00,
        'Shipping fee',
        '95',
        0.20,
        TaxCategoryCode.STANDARD,
        startDate,
        endDate,
        10,
        500
      );

      expect(charge.chargeIndicator).toBe(true);
      expect(charge.actualAmount).toBe(50.00);
      expect(charge.reason).toBe('Shipping fee');
      expect(charge.reasonCode).toBe('95');
      expect(charge.taxRate).toBe(0.20);
      expect(charge.taxCategoryCode).toBe(TaxCategoryCode.STANDARD);
      expect(charge.startDate).toBe(startDate);
      expect(charge.endDate).toBe(endDate);
      expect(charge.percentage).toBe(10);
      expect(charge.basisAmount).toBe(500);
    });

    it('should create an allowance (discount) with minimal parameters', () => {
      const allowance = new AllowanceCharge(false, 25.00);

      expect(allowance.chargeIndicator).toBe(false);
      expect(allowance.actualAmount).toBe(25.00);
      expect(allowance.reason).toBeUndefined();
      expect(allowance.reasonCode).toBeUndefined();
      expect(allowance.taxRate).toBeUndefined();
      expect(allowance.taxCategoryCode).toBeUndefined();
      expect(allowance.startDate).toBeUndefined();
      expect(allowance.endDate).toBeUndefined();
      expect(allowance.percentage).toBeUndefined();
      expect(allowance.basisAmount).toBeUndefined();
    });

    it('should create a charge (surcharge) correctly', () => {
      const charge = new AllowanceCharge(true, 15.50, 'Service fee');

      expect(charge.chargeIndicator).toBe(true);
      expect(charge.actualAmount).toBe(15.50);
      expect(charge.reason).toBe('Service fee');
    });

    it('should create an allowance (discount) correctly', () => {
      const allowance = new AllowanceCharge(false, 100.00, 'Volume discount');

      expect(allowance.chargeIndicator).toBe(false);
      expect(allowance.actualAmount).toBe(100.00);
      expect(allowance.reason).toBe('Volume discount');
    });
  });

  describe('tax handling', () => {
    it('should handle standard tax category', () => {
      const charge = new AllowanceCharge(
        true,
        50,
        'Fee',
        undefined,
        0.20,
        TaxCategoryCode.STANDARD
      );

      expect(charge.taxRate).toBe(0.20);
      expect(charge.taxCategoryCode).toBe(TaxCategoryCode.STANDARD);
    });

    it('should handle reduced tax category', () => {
      const charge = new AllowanceCharge(
        true,
        50,
        'Fee',
        undefined,
        0.055,
        TaxCategoryCode.REDUCED
      );

      expect(charge.taxRate).toBe(0.055);
      expect(charge.taxCategoryCode).toBe(TaxCategoryCode.REDUCED);
    });

    it('should handle zero tax category', () => {
      const charge = new AllowanceCharge(
        true,
        50,
        'Fee',
        undefined,
        0,
        TaxCategoryCode.ZERO
      );

      expect(charge.taxRate).toBe(0);
      expect(charge.taxCategoryCode).toBe(TaxCategoryCode.ZERO);
    });

    it('should handle exempt tax category', () => {
      const charge = new AllowanceCharge(
        false,
        25,
        'Discount',
        undefined,
        0,
        TaxCategoryCode.EXEMPT
      );

      expect(charge.taxRate).toBe(0);
      expect(charge.taxCategoryCode).toBe(TaxCategoryCode.EXEMPT);
    });

    it('should handle reverse charge', () => {
      const charge = new AllowanceCharge(
        true,
        100,
        'Service',
        undefined,
        0,
        TaxCategoryCode.REVERSE_CHARGE
      );

      expect(charge.taxCategoryCode).toBe(TaxCategoryCode.REVERSE_CHARGE);
    });
  });

  describe('percentage-based charges', () => {
    it('should handle percentage with basis amount', () => {
      const charge = new AllowanceCharge(
        true,
        50,
        'Percentage fee',
        undefined,
        0.20,
        TaxCategoryCode.STANDARD,
        undefined,
        undefined,
        10,
        500
      );

      expect(charge.percentage).toBe(10);
      expect(charge.basisAmount).toBe(500);
      expect(charge.actualAmount).toBe(50);
    });

    it('should handle different percentage values', () => {
      const percentages = [5, 10, 15, 20, 25, 50, 100];

      percentages.forEach(pct => {
        const charge = new AllowanceCharge(
          false,
          100,
          'Discount',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          pct
        );

        expect(charge.percentage).toBe(pct);
      });
    });
  });

  describe('date range handling', () => {
    it('should handle valid date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const charge = new AllowanceCharge(
        false,
        100,
        'Seasonal discount',
        undefined,
        undefined,
        undefined,
        startDate,
        endDate
      );

      expect(charge.startDate).toBe(startDate);
      expect(charge.endDate).toBe(endDate);
      expect(charge.startDate!.getTime()).toBeLessThan(charge.endDate!.getTime());
    });

    it('should handle only start date', () => {
      const startDate = new Date('2025-01-01');

      const charge = new AllowanceCharge(
        false,
        50,
        'Discount',
        undefined,
        undefined,
        undefined,
        startDate
      );

      expect(charge.startDate).toBe(startDate);
      expect(charge.endDate).toBeUndefined();
    });

    it('should handle only end date', () => {
      const endDate = new Date('2025-12-31');

      const charge = new AllowanceCharge(
        false,
        50,
        'Discount',
        undefined,
        undefined,
        undefined,
        undefined,
        endDate
      );

      expect(charge.startDate).toBeUndefined();
      expect(charge.endDate).toBe(endDate);
    });

    it('should handle same start and end date', () => {
      const sameDate = new Date('2025-06-15');

      const charge = new AllowanceCharge(
        true,
        25,
        'One-day charge',
        undefined,
        undefined,
        undefined,
        sameDate,
        sameDate
      );

      expect(charge.startDate).toBe(sameDate);
      expect(charge.endDate).toBe(sameDate);
    });
  });

  describe('reason codes', () => {
    it('should handle standard reason codes', () => {
      const codes = ['41', '42', '60', '95', '100'];

      codes.forEach(code => {
        const charge = new AllowanceCharge(
          true,
          50,
          'Charge',
          code
        );

        expect(charge.reasonCode).toBe(code);
      });
    });

    it('should handle reason without reason code', () => {
      const charge = new AllowanceCharge(
        false,
        100,
        'Custom discount reason'
      );

      expect(charge.reason).toBe('Custom discount reason');
      expect(charge.reasonCode).toBeUndefined();
    });

    it('should handle reason code without reason text', () => {
      const charge = new AllowanceCharge(
        true,
        75,
        undefined,
        '95'
      );

      expect(charge.reasonCode).toBe('95');
      expect(charge.reason).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero amount', () => {
      const charge = new AllowanceCharge(true, 0);

      expect(charge.actualAmount).toBe(0);
    });

    it('should handle negative amount', () => {
      const charge = new AllowanceCharge(false, -50);

      expect(charge.actualAmount).toBe(-50);
    });

    it('should handle very large amounts', () => {
      const charge = new AllowanceCharge(true, 999999999.99);

      expect(charge.actualAmount).toBe(999999999.99);
    });

    it('should handle decimal precision', () => {
      const charge = new AllowanceCharge(false, 12.345);

      expect(charge.actualAmount).toBe(12.345);
    });

    it('should handle empty strings for reason', () => {
      const charge = new AllowanceCharge(true, 50, '', '');

      expect(charge.reason).toBe('');
      expect(charge.reasonCode).toBe('');
    });

    it('should handle special characters in reason', () => {
      const reason = 'Discount: 10% off for €500+ orders (valid until 31/12)';
      const charge = new AllowanceCharge(false, 50, reason);

      expect(charge.reason).toBe(reason);
    });
  });

  describe('typical use cases', () => {
    it('should create a commercial discount', () => {
      const discount = new AllowanceCharge(
        false,
        150.00,
        'Commercial discount',
        '100',
        0.20,
        TaxCategoryCode.STANDARD
      );

      expect(discount.chargeIndicator).toBe(false);
      expect(discount.actualAmount).toBe(150.00);
    });

    it('should create a shipping charge', () => {
      const shipping = new AllowanceCharge(
        true,
        25.00,
        'Shipping costs',
        '95',
        0.20,
        TaxCategoryCode.STANDARD
      );

      expect(shipping.chargeIndicator).toBe(true);
      expect(shipping.actualAmount).toBe(25.00);
    });

    it('should create an early payment discount', () => {
      const endDate = new Date('2025-02-15');
      const discount = new AllowanceCharge(
        false,
        50.00,
        'Early payment discount',
        '95',
        0.20,
        TaxCategoryCode.STANDARD,
        undefined,
        endDate,
        2,
        2500
      );

      expect(discount.chargeIndicator).toBe(false);
      expect(discount.percentage).toBe(2);
      expect(discount.endDate).toBe(endDate);
    });
  });
});
