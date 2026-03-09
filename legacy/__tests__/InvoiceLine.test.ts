// src/__tests__/InvoiceLine.test.ts

import { InvoiceLine } from '../core/InvoiceLine';
import { AllowanceCharge } from '../core/AllowanceCharge';
import { TaxCategoryCode } from '../core/EnumInvoiceType';

describe('InvoiceLine', () => {
  describe('Constructor', () => {
    it('should create line with required parameters', () => {
      const line = new InvoiceLine(
        '1',
        'Product A',
        2,
        50,
        0.20
      );

      expect(line.id).toBe('1');
      expect(line.description).toBe('Product A');
      expect(line.quantity).toBe(2);
      expect(line.unitPrice).toBe(50);
      expect(line.vatRate).toBe(0.20);
    });

    it('should use default values for optional parameters', () => {
      const line = new InvoiceLine('1', 'Product A', 2, 50, 0.20);

      expect(line.taxCategoryCode).toBe('S'); // Default
      expect(line.unitCode).toBe('C62'); // Default
      expect(line.allowances).toEqual([]);
      expect(line.charges).toEqual([]);
    });

    it('should accept all parameters', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const line = new InvoiceLine(
        '1',
        'Consulting services',
        40,
        650,
        0.20,
        TaxCategoryCode.STANDARD,
        'DAY',
        startDate,
        endDate,
        35
      );

      expect(line.id).toBe('1');
      expect(line.description).toBe('Consulting services');
      expect(line.quantity).toBe(40);
      expect(line.unitPrice).toBe(650);
      expect(line.vatRate).toBe(0.20);
      expect(line.taxCategoryCode).toBe(TaxCategoryCode.STANDARD);
      expect(line.unitCode).toBe('DAY');
      expect(line.billingPeriodStart).toBe(startDate);
      expect(line.billingPeriodEnd).toBe(endDate);
      expect(line.deliveredQuantity).toBe(35);
    });
  });

  describe('lineTotal getter', () => {
    it('should calculate line total correctly', () => {
      const line = new InvoiceLine('1', 'Product', 3, 100, 0.20);
      expect(line.lineTotal).toBe(300); // 3 * 100
    });

    it('should handle fractional quantities', () => {
      const line = new InvoiceLine('1', 'Product', 2.5, 10, 0.20);
      expect(line.lineTotal).toBe(25); // 2.5 * 10
    });

    it('should handle fractional prices', () => {
      const line = new InvoiceLine('1', 'Product', 3, 12.50, 0.20);
      expect(line.lineTotal).toBe(37.50); // 3 * 12.50
    });

    it('should handle quantity of 1', () => {
      const line = new InvoiceLine('1', 'Product', 1, 100, 0.20);
      expect(line.lineTotal).toBe(100);
    });

    it('should handle zero quantity', () => {
      const line = new InvoiceLine('1', 'Product', 0, 100, 0.20);
      expect(line.lineTotal).toBe(0);
    });

    it('should handle large quantities', () => {
      const line = new InvoiceLine('1', 'Product', 1000, 5, 0.20);
      expect(line.lineTotal).toBe(5000);
    });
  });

  describe('lineTotalWithoutTax getter', () => {
    it('should return same as lineTotal', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      expect(line.lineTotalWithoutTax).toBe(line.lineTotal);
      expect(line.lineTotalWithoutTax).toBe(100);
    });
  });

  describe('addAllowance method', () => {
    it('should add allowance with amount only', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10);

      expect(line.allowances).toHaveLength(1);
      expect(line.allowances[0].actualAmount).toBe(10);
      expect(line.allowances[0].chargeIndicator).toBe(false);
    });

    it('should add allowance with reason', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10, 'Volume discount');

      expect(line.allowances).toHaveLength(1);
      expect(line.allowances[0].reason).toBe('Volume discount');
    });

    it('should add multiple allowances', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(5, 'Discount 1');
      line.addAllowance(10, 'Discount 2');
      line.addAllowance(15, 'Discount 3');

      expect(line.allowances).toHaveLength(3);
      expect(line.allowances[0].actualAmount).toBe(5);
      expect(line.allowances[1].actualAmount).toBe(10);
      expect(line.allowances[2].actualAmount).toBe(15);
    });
  });

  describe('addCharge method', () => {
    it('should add charge with amount only', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addCharge(5);

      expect(line.charges).toHaveLength(1);
      expect(line.charges[0].actualAmount).toBe(5);
      expect(line.charges[0].chargeIndicator).toBe(true);
    });

    it('should add charge with reason', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addCharge(5, 'Special handling');

      expect(line.charges).toHaveLength(1);
      expect(line.charges[0].reason).toBe('Special handling');
    });

    it('should add multiple charges', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addCharge(3, 'Charge 1');
      line.addCharge(7, 'Charge 2');

      expect(line.charges).toHaveLength(2);
      expect(line.charges[0].actualAmount).toBe(3);
      expect(line.charges[1].actualAmount).toBe(7);
    });
  });

  describe('Allowances and charges combined', () => {
    it('should handle both allowances and charges', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10, 'Discount');
      line.addCharge(5, 'Handling fee');

      expect(line.allowances).toHaveLength(1);
      expect(line.charges).toHaveLength(1);
      expect(line.allowances[0].chargeIndicator).toBe(false);
      expect(line.charges[0].chargeIndicator).toBe(true);
    });

    it('should keep allowances and charges separate', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10);
      line.addAllowance(5);
      line.addCharge(3);
      line.addCharge(7);

      expect(line.allowances).toHaveLength(2);
      expect(line.charges).toHaveLength(2);
    });
  });

  describe('Unit codes', () => {
    it('should use C62 (piece/unit) by default', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      expect(line.unitCode).toBe('C62');
    });

    it('should accept DAY unit code', () => {
      const line = new InvoiceLine('1', 'Consulting', 5, 800, 0.20, 'S', 'DAY');
      expect(line.unitCode).toBe('DAY');
    });

    it('should accept HUR (hour) unit code', () => {
      const line = new InvoiceLine('1', 'Training', 8, 120, 0.20, 'S', 'HUR');
      expect(line.unitCode).toBe('HUR');
    });

    it('should accept various ISO unit codes', () => {
      const codes = ['C62', 'DAY', 'HUR', 'MON', 'ANN', 'KGM', 'MTR', 'LTR'];
      codes.forEach(code => {
        const line = new InvoiceLine('1', 'Item', 1, 100, 0.20, 'S', code);
        expect(line.unitCode).toBe(code);
      });
    });
  });

  describe('Tax categories', () => {
    it('should default to "S" (standard)', () => {
      const line = new InvoiceLine('1', 'Product', 1, 100, 0.20);
      expect(line.taxCategoryCode).toBe('S');
    });

    it('should accept different tax categories', () => {
      const standard = new InvoiceLine('1', 'Product', 1, 100, 0.20, TaxCategoryCode.STANDARD);
      const reduced = new InvoiceLine('2', 'Product', 1, 100, 0.10, TaxCategoryCode.REDUCED);
      const zero = new InvoiceLine('3', 'Product', 1, 100, 0, TaxCategoryCode.ZERO);
      const exempt = new InvoiceLine('4', 'Product', 1, 100, 0, TaxCategoryCode.EXEMPT);

      expect(standard.taxCategoryCode).toBe(TaxCategoryCode.STANDARD);
      expect(reduced.taxCategoryCode).toBe(TaxCategoryCode.REDUCED);
      expect(zero.taxCategoryCode).toBe(TaxCategoryCode.ZERO);
      expect(exempt.taxCategoryCode).toBe(TaxCategoryCode.EXEMPT);
    });
  });

  describe('VAT rates', () => {
    it('should handle 20% VAT', () => {
      const line = new InvoiceLine('1', 'Product', 1, 100, 0.20);
      expect(line.vatRate).toBe(0.20);
    });

    it('should handle 10% VAT', () => {
      const line = new InvoiceLine('1', 'Product', 1, 100, 0.10);
      expect(line.vatRate).toBe(0.10);
    });

    it('should handle 5.5% VAT', () => {
      const line = new InvoiceLine('1', 'Product', 1, 100, 0.055);
      expect(line.vatRate).toBe(0.055);
    });

    it('should handle 0% VAT', () => {
      const line = new InvoiceLine('1', 'Product', 1, 100, 0);
      expect(line.vatRate).toBe(0);
    });
  });

  describe('Billing period', () => {
    it('should handle billing period dates', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');

      const line = new InvoiceLine(
        '1', 'Monthly subscription', 1, 100, 0.20, 'S', 'MON', start, end
      );

      expect(line.billingPeriodStart).toBe(start);
      expect(line.billingPeriodEnd).toBe(end);
    });

    it('should allow undefined billing period', () => {
      const line = new InvoiceLine('1', 'Product', 1, 100, 0.20);
      expect(line.billingPeriodStart).toBeUndefined();
      expect(line.billingPeriodEnd).toBeUndefined();
    });
  });

  describe('Delivered quantity', () => {
    it('should handle delivered quantity', () => {
      const line = new InvoiceLine(
        '1', 'Product', 100, 10, 0.20, 'S', 'C62', undefined, undefined, 85
      );

      expect(line.deliveredQuantity).toBe(85);
      expect(line.quantity).toBe(100); // Ordered quantity
    });

    it('should allow undefined delivered quantity', () => {
      const line = new InvoiceLine('1', 'Product', 10, 100, 0.20);
      expect(line.deliveredQuantity).toBeUndefined();
    });

    it('should handle partial delivery', () => {
      const line = new InvoiceLine(
        '1', 'Product', 100, 10, 0.20, 'S', 'C62', undefined, undefined, 50
      );

      expect(line.deliveredQuantity).toBe(50);
      expect(line.deliveredQuantity).toBeLessThan(line.quantity);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty description', () => {
      const line = new InvoiceLine('1', '', 1, 100, 0.20);
      expect(line.description).toBe('');
    });

    it('should handle special characters in description', () => {
      const desc = 'Product <>&"àéè™';
      const line = new InvoiceLine('1', desc, 1, 100, 0.20);
      expect(line.description).toBe(desc);
    });

    it('should handle very long description', () => {
      const longDesc = 'A'.repeat(1000);
      const line = new InvoiceLine('1', longDesc, 1, 100, 0.20);
      expect(line.description).toBe(longDesc);
      expect(line.description.length).toBe(1000);
    });

    it('should handle zero price', () => {
      const line = new InvoiceLine('1', 'Free product', 1, 0, 0.20);
      expect(line.unitPrice).toBe(0);
      expect(line.lineTotal).toBe(0);
    });

    it('should handle very small amounts', () => {
      const line = new InvoiceLine('1', 'Product', 0.001, 0.01, 0.20);
      expect(line.lineTotal).toBeCloseTo(0.00001, 5);
    });

    it('should handle very large amounts', () => {
      const line = new InvoiceLine('1', 'Product', 1000000, 1000, 0.20);
      expect(line.lineTotal).toBe(1000000000);
    });
  });

  describe('Real-world scenarios', () => {
    it('should create consulting service line', () => {
      const line = new InvoiceLine(
        '1',
        'Strategic consulting - 40 days',
        40,
        650,
        0.20,
        TaxCategoryCode.STANDARD,
        'DAY'
      );

      expect(line.description).toContain('consulting');
      expect(line.unitCode).toBe('DAY');
      expect(line.lineTotal).toBe(26000); // 40 * 650
    });

    it('should create product line with discount', () => {
      const line = new InvoiceLine('1', 'Laptop Dell XPS 15', 10, 1500, 0.20);
      line.addAllowance(150, 'Volume discount 10%');

      expect(line.lineTotal).toBe(15000);
      expect(line.allowances).toHaveLength(1);
      expect(line.allowances[0].actualAmount).toBe(150);
    });

    it('should create book line with reduced VAT', () => {
      const line = new InvoiceLine(
        '1',
        'Technical documentation - Professional book',
        5,
        45,
        0.055,
        TaxCategoryCode.REDUCED
      );

      expect(line.vatRate).toBe(0.055); // 5.5% reduced rate for books
      expect(line.taxCategoryCode).toBe(TaxCategoryCode.REDUCED);
      expect(line.lineTotal).toBe(225);
    });

    it('should create monthly subscription with billing period', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');

      const line = new InvoiceLine(
        '1',
        'Software subscription - January 2025',
        1,
        99.99,
        0.20,
        TaxCategoryCode.STANDARD,
        'MON',
        start,
        end
      );

      expect(line.billingPeriodStart).toBe(start);
      expect(line.billingPeriodEnd).toBe(end);
      expect(line.unitCode).toBe('MON');
    });

    it('should create line with partial delivery', () => {
      const line = new InvoiceLine(
        '1',
        'Office chairs',
        100,
        150,
        0.20,
        TaxCategoryCode.STANDARD,
        'C62',
        undefined,
        undefined,
        75 // Delivered only 75 out of 100
      );

      expect(line.quantity).toBe(100);
      expect(line.deliveredQuantity).toBe(75);
      expect(line.lineTotal).toBe(15000); // Still bill for full quantity
    });
  });

  describe('Property modification', () => {
    it('should allow modifying properties', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);

      line.quantity = 3;
      line.unitPrice = 60;
      line.description = 'Updated product';

      expect(line.quantity).toBe(3);
      expect(line.unitPrice).toBe(60);
      expect(line.description).toBe('Updated product');
      expect(line.lineTotal).toBe(180); // 3 * 60
    });

    it('should recalculate lineTotal when quantity changes', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      expect(line.lineTotal).toBe(100);

      line.quantity = 5;
      expect(line.lineTotal).toBe(250);
    });

    it('should recalculate lineTotal when price changes', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      expect(line.lineTotal).toBe(100);

      line.unitPrice = 75;
      expect(line.lineTotal).toBe(150);
    });
  });

  describe('addAllowanceCharge method', () => {
    it('should add charge when isCharge is true', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowanceCharge(10, true, 'Processing fee');

      expect(line.charges).toHaveLength(1);
      expect(line.allowances).toHaveLength(0);
      expect(line.charges[0].actualAmount).toBe(10);
      expect(line.charges[0].chargeIndicator).toBe(true);
      expect(line.charges[0].reason).toBe('Processing fee');
    });

    it('should add allowance when isCharge is false', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowanceCharge(15, false, 'Volume discount');

      expect(line.allowances).toHaveLength(1);
      expect(line.charges).toHaveLength(0);
      expect(line.allowances[0].actualAmount).toBe(15);
      expect(line.allowances[0].chargeIndicator).toBe(false);
      expect(line.allowances[0].reason).toBe('Volume discount');
    });

    it('should add allowance without reason', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowanceCharge(20, false);

      expect(line.allowances).toHaveLength(1);
      expect(line.allowances[0].actualAmount).toBe(20);
    });

    it('should add charge without reason', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowanceCharge(5, true);

      expect(line.charges).toHaveLength(1);
      expect(line.charges[0].actualAmount).toBe(5);
    });

    it('should add multiple allowances and charges via addAllowanceCharge', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowanceCharge(10, false, 'Discount 1');
      line.addAllowanceCharge(5, true, 'Charge 1');
      line.addAllowanceCharge(15, false, 'Discount 2');
      line.addAllowanceCharge(3, true, 'Charge 2');

      expect(line.allowances).toHaveLength(2);
      expect(line.charges).toHaveLength(2);
    });
  });

  describe('getAllAllowancesCharges method', () => {
    it('should return empty array when no allowances or charges', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      const all = line.getAllAllowancesCharges();

      expect(all).toEqual([]);
      expect(all).toHaveLength(0);
    });

    it('should return all allowances when only allowances exist', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10, 'Discount 1');
      line.addAllowance(5, 'Discount 2');

      const all = line.getAllAllowancesCharges();

      expect(all).toHaveLength(2);
      expect(all[0].actualAmount).toBe(10);
      expect(all[1].actualAmount).toBe(5);
      expect(all.every(a => a.chargeIndicator === false)).toBe(true);
    });

    it('should return all charges when only charges exist', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addCharge(7, 'Charge 1');
      line.addCharge(3, 'Charge 2');

      const all = line.getAllAllowancesCharges();

      expect(all).toHaveLength(2);
      expect(all[0].actualAmount).toBe(7);
      expect(all[1].actualAmount).toBe(3);
      expect(all.every(c => c.chargeIndicator === true)).toBe(true);
    });

    it('should return all allowances and charges combined', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10, 'Allowance 1');
      line.addAllowance(5, 'Allowance 2');
      line.addCharge(7, 'Charge 1');
      line.addCharge(3, 'Charge 2');

      const all = line.getAllAllowancesCharges();

      expect(all).toHaveLength(4);

      // First 2 should be allowances
      expect(all[0].chargeIndicator).toBe(false);
      expect(all[1].chargeIndicator).toBe(false);

      // Last 2 should be charges
      expect(all[2].chargeIndicator).toBe(true);
      expect(all[3].chargeIndicator).toBe(true);
    });

    it('should not modify original arrays', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10);
      line.addCharge(5);

      const all = line.getAllAllowancesCharges();
      all.push(new AllowanceCharge(true, 999)); // Modify returned array

      // Original arrays should be unchanged
      expect(line.allowances).toHaveLength(1);
      expect(line.charges).toHaveLength(1);
    });
  });

  describe('clearAllowancesCharges method', () => {
    it('should clear all allowances and charges', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10, 'Discount');
      line.addAllowance(5, 'Another discount');
      line.addCharge(7, 'Fee');
      line.addCharge(3, 'Surcharge');

      expect(line.allowances).toHaveLength(2);
      expect(line.charges).toHaveLength(2);

      line.clearAllowancesCharges();

      expect(line.allowances).toHaveLength(0);
      expect(line.charges).toHaveLength(0);
      expect(line.allowances).toEqual([]);
      expect(line.charges).toEqual([]);
    });

    it('should work when already empty', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);

      expect(line.allowances).toHaveLength(0);
      expect(line.charges).toHaveLength(0);

      line.clearAllowancesCharges();

      expect(line.allowances).toHaveLength(0);
      expect(line.charges).toHaveLength(0);
    });

    it('should allow adding new allowances/charges after clearing', () => {
      const line = new InvoiceLine('1', 'Product', 2, 50, 0.20);
      line.addAllowance(10);
      line.addCharge(5);

      line.clearAllowancesCharges();

      line.addAllowance(20);
      line.addCharge(15);

      expect(line.allowances).toHaveLength(1);
      expect(line.charges).toHaveLength(1);
      expect(line.allowances[0].actualAmount).toBe(20);
      expect(line.charges[0].actualAmount).toBe(15);
    });
  });
});
