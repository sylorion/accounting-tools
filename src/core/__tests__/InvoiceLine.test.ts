import { InvoiceLine } from '../InvoiceLine';
import { AllowanceCharge } from '../AllowanceCharge';
import { TaxCategoryCode } from '../EnumInvoiceType';

describe('InvoiceLine', () => {
  describe('constructor', () => {
    it('should create an invoice line with all parameters', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const line = new InvoiceLine(
        'LINE-001',
        'Professional consulting services',
        10,
        150.00,
        0.20,
        'S',
        'HUR',
        startDate,
        endDate,
        8
      );

      expect(line.id).toBe('LINE-001');
      expect(line.description).toBe('Professional consulting services');
      expect(line.quantity).toBe(10);
      expect(line.unitPrice).toBe(150.00);
      expect(line.vatRate).toBe(0.20);
      expect(line.taxCategoryCode).toBe('S');
      expect(line.unitCode).toBe('HUR');
      expect(line.billingPeriodStart).toBe(startDate);
      expect(line.billingPeriodEnd).toBe(endDate);
      expect(line.deliveredQuantity).toBe(8);
    });

    it('should create an invoice line with default values', () => {
      const line = new InvoiceLine(
        'LINE-002',
        'Product ABC',
        5,
        100.00,
        0.20
      );

      expect(line.id).toBe('LINE-002');
      expect(line.description).toBe('Product ABC');
      expect(line.quantity).toBe(5);
      expect(line.unitPrice).toBe(100.00);
      expect(line.vatRate).toBe(0.20);
      expect(line.taxCategoryCode).toBe('S');
      expect(line.unitCode).toBe('C62');
      expect(line.billingPeriodStart).toBeUndefined();
      expect(line.billingPeriodEnd).toBeUndefined();
      expect(line.deliveredQuantity).toBeUndefined();
    });

    it('should initialize with empty allowances and charges arrays', () => {
      const line = new InvoiceLine('LINE-003', 'Item', 1, 50, 0.20);

      expect(Array.isArray(line.allowances)).toBe(true);
      expect(Array.isArray(line.charges)).toBe(true);
      expect(line.allowances.length).toBe(0);
      expect(line.charges.length).toBe(0);
    });
  });

  describe('lineTotal getter', () => {
    it('should calculate correct line total', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      expect(line.lineTotal).toBe(500);
    });

    it('should handle decimal quantities', () => {
      const line = new InvoiceLine('LINE-002', 'Item', 2.5, 80, 0.20);

      expect(line.lineTotal).toBe(200);
    });

    it('should handle decimal unit prices', () => {
      const line = new InvoiceLine('LINE-003', 'Item', 3, 33.33, 0.20);

      expect(line.lineTotal).toBeCloseTo(99.99, 2);
    });

    it('should handle zero quantity', () => {
      const line = new InvoiceLine('LINE-004', 'Item', 0, 100, 0.20);

      expect(line.lineTotal).toBe(0);
    });

    it('should handle zero unit price', () => {
      const line = new InvoiceLine('LINE-005', 'Free item', 5, 0, 0.20);

      expect(line.lineTotal).toBe(0);
    });
  });

  describe('lineTotalWithoutTax getter', () => {
    it('should return the same value as lineTotal', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 10, 50, 0.20);

      expect(line.lineTotalWithoutTax).toBe(line.lineTotal);
      expect(line.lineTotalWithoutTax).toBe(500);
    });
  });

  describe('addAllowance', () => {
    it('should add an allowance to the line', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowance(50, 'Discount');

      expect(line.allowances.length).toBe(1);
      expect(line.allowances[0].chargeIndicator).toBe(false);
      expect(line.allowances[0].actualAmount).toBe(50);
      expect(line.allowances[0].reason).toBe('Discount');
    });

    it('should add multiple allowances', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 10, 100, 0.20);

      line.addAllowance(100, 'First discount');
      line.addAllowance(50, 'Second discount');
      line.addAllowance(25, 'Third discount');

      expect(line.allowances.length).toBe(3);
      expect(line.allowances[0].actualAmount).toBe(100);
      expect(line.allowances[1].actualAmount).toBe(50);
      expect(line.allowances[2].actualAmount).toBe(25);
    });

    it('should add allowance without reason text', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowance(30);

      expect(line.allowances.length).toBe(1);
      expect(line.allowances[0].reason).toBeUndefined();
    });
  });

  describe('addCharge', () => {
    it('should add a charge to the line', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addCharge(25, 'Extra fee');

      expect(line.charges.length).toBe(1);
      expect(line.charges[0].chargeIndicator).toBe(true);
      expect(line.charges[0].actualAmount).toBe(25);
      expect(line.charges[0].reason).toBe('Extra fee');
    });

    it('should add multiple charges', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addCharge(10, 'Handling fee');
      line.addCharge(15, 'Packaging fee');

      expect(line.charges.length).toBe(2);
      expect(line.charges[0].actualAmount).toBe(10);
      expect(line.charges[1].actualAmount).toBe(15);
    });

    it('should add charge without reason text', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addCharge(20);

      expect(line.charges.length).toBe(1);
      expect(line.charges[0].reason).toBeUndefined();
    });
  });

  describe('addAllowanceCharge', () => {
    it('should add a charge when isCharge is true', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowanceCharge(30, true, 'Service charge');

      expect(line.charges.length).toBe(1);
      expect(line.allowances.length).toBe(0);
      expect(line.charges[0].chargeIndicator).toBe(true);
      expect(line.charges[0].actualAmount).toBe(30);
    });

    it('should add an allowance when isCharge is false', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowanceCharge(40, false, 'Discount');

      expect(line.allowances.length).toBe(1);
      expect(line.charges.length).toBe(0);
      expect(line.allowances[0].chargeIndicator).toBe(false);
      expect(line.allowances[0].actualAmount).toBe(40);
    });

    it('should handle multiple mixed allowances and charges', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 10, 100, 0.20);

      line.addAllowanceCharge(50, false, 'Discount 1');
      line.addAllowanceCharge(20, true, 'Charge 1');
      line.addAllowanceCharge(30, false, 'Discount 2');
      line.addAllowanceCharge(15, true, 'Charge 2');

      expect(line.allowances.length).toBe(2);
      expect(line.charges.length).toBe(2);
    });
  });

  describe('getAllAllowancesCharges', () => {
    it('should return empty array when no allowances or charges', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      const all = line.getAllAllowancesCharges();

      expect(all.length).toBe(0);
    });

    it('should return all allowances and charges combined', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowance(50, 'Discount');
      line.addCharge(25, 'Fee');
      line.addAllowance(30, 'Another discount');

      const all = line.getAllAllowancesCharges();

      expect(all.length).toBe(3);
    });

    it('should preserve order (allowances first, then charges)', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowance(50, 'Discount 1');
      line.addAllowance(30, 'Discount 2');
      line.addCharge(20, 'Charge 1');
      line.addCharge(15, 'Charge 2');

      const all = line.getAllAllowancesCharges();

      expect(all[0].chargeIndicator).toBe(false);
      expect(all[1].chargeIndicator).toBe(false);
      expect(all[2].chargeIndicator).toBe(true);
      expect(all[3].chargeIndicator).toBe(true);
    });

    it('should return a new array not a reference', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowance(50);

      const all1 = line.getAllAllowancesCharges();
      const all2 = line.getAllAllowancesCharges();

      expect(all1).not.toBe(all2);
      expect(all1).toEqual(all2);
    });
  });

  describe('clearAllowancesCharges', () => {
    it('should clear all allowances and charges', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowance(50, 'Discount');
      line.addCharge(25, 'Fee');
      line.addAllowance(30, 'Another discount');

      line.clearAllowancesCharges();

      expect(line.allowances.length).toBe(0);
      expect(line.charges.length).toBe(0);
    });

    it('should work on already empty arrays', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.clearAllowancesCharges();

      expect(line.allowances.length).toBe(0);
      expect(line.charges.length).toBe(0);
    });

    it('should allow adding new items after clearing', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      line.addAllowance(50);
      line.addCharge(25);
      line.clearAllowancesCharges();

      line.addAllowance(100);

      expect(line.allowances.length).toBe(1);
      expect(line.allowances[0].actualAmount).toBe(100);
    });
  });

  describe('tax categories', () => {
    it('should handle standard tax category', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20, 'S');

      expect(line.taxCategoryCode).toBe('S');
    });

    it('should handle zero-rated items', () => {
      const line = new InvoiceLine('LINE-002', 'Book', 3, 15, 0, 'Z');

      expect(line.taxCategoryCode).toBe('Z');
      expect(line.vatRate).toBe(0);
    });

    it('should handle exempt items', () => {
      const line = new InvoiceLine('LINE-003', 'Medical service', 1, 200, 0, 'E');

      expect(line.taxCategoryCode).toBe('E');
      expect(line.vatRate).toBe(0);
    });
  });

  describe('unit codes', () => {
    it('should use default unit code C62', () => {
      const line = new InvoiceLine('LINE-001', 'Item', 5, 100, 0.20);

      expect(line.unitCode).toBe('C62');
    });

    it('should handle hours (HUR)', () => {
      const line = new InvoiceLine('LINE-002', 'Consulting', 8, 120, 0.20, 'S', 'HUR');

      expect(line.unitCode).toBe('HUR');
    });

    it('should handle kilograms (KGM)', () => {
      const line = new InvoiceLine('LINE-003', 'Material', 150, 5.50, 0.20, 'S', 'KGM');

      expect(line.unitCode).toBe('KGM');
    });

    it('should handle liters (LTR)', () => {
      const line = new InvoiceLine('LINE-004', 'Liquid', 100, 2.30, 0.20, 'S', 'LTR');

      expect(line.unitCode).toBe('LTR');
    });
  });

  describe('billing period', () => {
    it('should handle billing period correctly', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');

      const line = new InvoiceLine(
        'LINE-001',
        'Monthly subscription',
        1,
        99.99,
        0.20,
        'S',
        'C62',
        start,
        end
      );

      expect(line.billingPeriodStart).toBe(start);
      expect(line.billingPeriodEnd).toBe(end);
    });

    it('should work without billing period', () => {
      const line = new InvoiceLine('LINE-001', 'One-time item', 1, 50, 0.20);

      expect(line.billingPeriodStart).toBeUndefined();
      expect(line.billingPeriodEnd).toBeUndefined();
    });
  });

  describe('delivered quantity', () => {
    it('should track delivered quantity different from invoiced', () => {
      const line = new InvoiceLine(
        'LINE-001',
        'Product',
        10,
        50,
        0.20,
        'S',
        'C62',
        undefined,
        undefined,
        8
      );

      expect(line.quantity).toBe(10);
      expect(line.deliveredQuantity).toBe(8);
    });

    it('should work when delivered equals invoiced', () => {
      const line = new InvoiceLine(
        'LINE-001',
        'Product',
        5,
        100,
        0.20,
        'S',
        'C62',
        undefined,
        undefined,
        5
      );

      expect(line.quantity).toBe(5);
      expect(line.deliveredQuantity).toBe(5);
    });

    it('should work when no delivered quantity specified', () => {
      const line = new InvoiceLine('LINE-001', 'Product', 5, 100, 0.20);

      expect(line.deliveredQuantity).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very large quantities', () => {
      const line = new InvoiceLine('LINE-001', 'Bulk item', 1000000, 0.01, 0.20);

      expect(line.lineTotal).toBe(10000);
    });

    it('should handle very small unit prices', () => {
      const line = new InvoiceLine('LINE-001', 'Micro item', 10000, 0.001, 0.20);

      expect(line.lineTotal).toBe(10);
    });

    it('should handle negative quantities (returns)', () => {
      const line = new InvoiceLine('LINE-001', 'Returned item', -5, 100, 0.20);

      expect(line.lineTotal).toBe(-500);
    });

    it('should handle special characters in description', () => {
      const line = new InvoiceLine(
        'LINE-001',
        'Item & Service (10% off) - €50',
        1,
        50,
        0.20
      );

      expect(line.description).toContain('&');
      expect(line.description).toContain('€');
    });
  });

  describe('complete scenarios', () => {
    it('should represent a consulting service line', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');

      const line = new InvoiceLine(
        'SVC-001',
        'Senior consultant - January 2025',
        160,
        125.00,
        0.20,
        'S',
        'HUR',
        start,
        end
      );

      line.addAllowance(500, 'Volume discount');

      expect(line.lineTotal).toBe(20000);
      expect(line.allowances.length).toBe(1);
      expect(line.unitCode).toBe('HUR');
    });

    it('should represent a product line with shipping', () => {
      const line = new InvoiceLine(
        'PROD-123',
        'Laptop Computer XYZ',
        2,
        1200.00,
        0.20,
        'S',
        'C62'
      );

      line.addCharge(50, 'Shipping fee');
      line.addCharge(25, 'Handling fee');

      expect(line.lineTotal).toBe(2400);
      expect(line.charges.length).toBe(2);
    });
  });
});
