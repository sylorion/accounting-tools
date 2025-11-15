/**
 * @file tax-calculator.test.ts
 * @description Comprehensive unit tests for TaxCalculator
 */

import { TaxCalculator } from '../../src/core/TaxCalculator';
import type { InvoiceLine, AllowanceCharge } from '../../src/types';

describe('TaxCalculator', () => {
  describe('Constructor', () => {
    it('should create calculator with default line mode', () => {
      const calculator = new TaxCalculator();

      const summary = calculator.computeSummary([], []);
      expect(summary).toBeDefined();
    });

    it('should create calculator with line mode', () => {
      const calculator = new TaxCalculator('line');

      const summary = calculator.computeSummary([], []);
      expect(summary).toBeDefined();
    });

    it('should create calculator with global mode', () => {
      const calculator = new TaxCalculator('global');

      const summary = calculator.computeSummary([], []);
      expect(summary).toBeDefined();
    });
  });

  describe('Empty Invoice', () => {
    it('should calculate zero totals for empty invoice', () => {
      const calculator = new TaxCalculator();

      const summary = calculator.computeSummary([], []);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxBasis).toBe(0);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
      expect(summary.taxSummaries).toHaveLength(0);
    });
  });

  describe('Single Line Calculations', () => {
    it('should calculate totals for single line with VAT', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 100, 50, 0.20); // qty=100, price=50, rate=20%

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(5000); // 100 * 50
      expect(summary.taxBasis).toBe(5000);
      expect(summary.taxTotal).toBe(1000); // 5000 * 0.20
      expect(summary.grandTotal).toBe(6000); // 5000 + 1000
      expect(summary.taxSummaries).toHaveLength(1);
      expect(summary.taxSummaries[0].rate).toBe(20); // Percentage
      expect(summary.taxSummaries[0].taxable).toBe(5000);
      expect(summary.taxSummaries[0].taxAmount).toBe(1000);
    });

    it('should calculate totals for single line without VAT', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0); // Zero VAT

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(1000);
      expect(summary.taxBasis).toBe(1000);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(1000);
    });

    it('should handle fractional quantities', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 2.5, 100, 0.20);

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(250); // 2.5 * 100
      expect(summary.taxTotal).toBe(50); // 250 * 0.20
    });

    it('should handle fractional prices', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 100, 9.99, 0.20);

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(999); // 100 * 9.99
      expect(summary.taxTotal).toBe(199.8); // 999 * 0.20
    });
  });

  describe('Multiple Lines Calculations', () => {
    it('should sum multiple lines with same VAT rate', () => {
      const calculator = new TaxCalculator();
      const lines = [
        createLine(1, 10, 100, 0.20),
        createLine(2, 5, 200, 0.20),
        createLine(3, 20, 50, 0.20),
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(3000); // 1000 + 1000 + 1000
      expect(summary.taxTotal).toBe(600); // 3000 * 0.20
      expect(summary.grandTotal).toBe(3600);
      expect(summary.taxSummaries).toHaveLength(1); // Only one rate
    });

    it('should handle multiple VAT rates', () => {
      const calculator = new TaxCalculator();
      const lines = [
        createLine(1, 10, 100, 0.20), // Standard rate
        createLine(2, 5, 100, 0.055), // Reduced rate
        createLine(3, 2, 100, 0), // Zero rate
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(1700); // 1000 + 500 + 200
      expect(summary.taxBasis).toBe(1700);
      expect(summary.taxTotal).toBeCloseTo(227.5); // 200 + 27.5 + 0
      expect(summary.grandTotal).toBeCloseTo(1927.5);
      expect(summary.taxSummaries).toHaveLength(3); // Three rates

      // Check each tax summary
      const standardRate = summary.taxSummaries.find(t => t.rate === 20);
      expect(standardRate?.taxable).toBe(1000);
      expect(standardRate?.taxAmount).toBe(200);

      const reducedRate = summary.taxSummaries.find(t => t.rate === 5.5);
      expect(reducedRate?.taxable).toBe(500);
      expect(reducedRate?.taxAmount).toBeCloseTo(27.5);

      const zeroRate = summary.taxSummaries.find(t => t.rate === 0);
      expect(zeroRate?.taxable).toBe(200);
      expect(zeroRate?.taxAmount).toBe(0);
    });

    it('should handle many lines efficiently', () => {
      const calculator = new TaxCalculator();
      const lines = Array.from({ length: 1000 }, (_, i) =>
        createLine(i + 1, 1, 10, 0.20)
      );

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(10000); // 1000 * 10
      expect(summary.taxTotal).toBe(2000); // 10000 * 0.20
      expect(summary.grandTotal).toBe(12000);
    });
  });

  describe('Line-Level Allowances and Charges', () => {
    it('should apply line-level allowance (discount)', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20);
      line.allowances.push(createAllowance(100, 0.20)); // 100 discount

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(900); // 1000 - 100
      expect(summary.taxTotal).toBe(180); // 900 * 0.20
      expect(summary.grandTotal).toBe(1080);
    });

    it('should apply line-level charge', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20);
      line.charges.push(createCharge(50, 0.20)); // 50 surcharge

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(1050); // 1000 + 50
      expect(summary.taxTotal).toBe(210); // 1050 * 0.20
      expect(summary.grandTotal).toBe(1260);
    });

    it('should apply multiple line-level adjustments', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20);
      line.allowances.push(createAllowance(50, 0.20), createAllowance(30, 0.20));
      line.charges.push(createCharge(20, 0.20));

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(940); // 1000 - 50 - 30 + 20
      expect(summary.taxTotal).toBe(188); // 940 * 0.20
    });

    it('should handle line-level adjustment with different VAT rate', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20);
      line.allowances.push(createAllowance(100, 0.055)); // Different rate

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(900); // 1000 - 100
      expect(summary.taxSummaries).toHaveLength(2); // Two rates

      const standardRate = summary.taxSummaries.find(t => t.rate === 20);
      expect(standardRate?.taxable).toBe(1000);
      expect(standardRate?.taxAmount).toBe(200);

      const reducedRate = summary.taxSummaries.find(t => t.rate === 5.5);
      expect(reducedRate?.taxable).toBe(-100); // Negative allowance
      expect(reducedRate?.taxAmount).toBeCloseTo(-5.5);
    });
  });

  describe('Document-Level Allowances and Charges', () => {
    it('should apply document-level allowance', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20); // 1000 HT
      const docAllowance = createAllowance(200, 0.20);

      const summary = calculator.computeSummary([line], [docAllowance]);

      expect(summary.lineTotal).toBe(1000);
      expect(summary.taxBasis).toBe(800); // 1000 - 200
      expect(summary.taxTotal).toBe(160); // 800 * 0.20
      expect(summary.grandTotal).toBe(960);
    });

    it('should apply document-level charge', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20); // 1000 HT
      const docCharge = createCharge(100, 0.20);

      const summary = calculator.computeSummary([line], [docCharge]);

      expect(summary.lineTotal).toBe(1000);
      expect(summary.taxBasis).toBe(1100); // 1000 + 100
      expect(summary.taxTotal).toBe(220); // 1100 * 0.20
      expect(summary.grandTotal).toBe(1320);
    });

    it('should apply multiple document-level adjustments', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20);
      const docAdjustments = [
        createAllowance(100, 0.20), // Discount
        createCharge(50, 0.20), // Shipping
      ];

      const summary = calculator.computeSummary([line], docAdjustments);

      expect(summary.lineTotal).toBe(1000);
      expect(summary.taxBasis).toBe(950); // 1000 - 100 + 50
      expect(summary.taxTotal).toBe(190); // 950 * 0.20
    });

    it('should combine line and document level adjustments', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20); // 1000 HT
      line.allowances.push(createAllowance(50, 0.20)); // Line discount
      const docAdjustments = [
        createAllowance(100, 0.20), // Doc discount
        createCharge(30, 0.20), // Doc charge
      ];

      const summary = calculator.computeSummary([line], docAdjustments);

      expect(summary.lineTotal).toBe(950); // 1000 - 50 (line)
      expect(summary.taxBasis).toBe(880); // 950 - 100 + 30 (doc)
      expect(summary.taxTotal).toBe(176); // 880 * 0.20
      expect(summary.grandTotal).toBe(1056);
    });
  });

  describe('Line Mode vs Global Mode', () => {
    it('should give same result for both modes with single rate', () => {
      const lines = [
        createLine(1, 10, 100, 0.20),
        createLine(2, 5, 50, 0.20),
      ];

      const lineMode = new TaxCalculator('line');
      const globalMode = new TaxCalculator('global');

      const lineSummary = lineMode.computeSummary(lines, []);
      const globalSummary = globalMode.computeSummary(lines, []);

      expect(lineSummary.taxTotal).toBe(globalSummary.taxTotal);
      expect(lineSummary.grandTotal).toBe(globalSummary.grandTotal);
    });

    it('should give same result for both modes with multiple rates', () => {
      const lines = [
        createLine(1, 10, 100, 0.20),
        createLine(2, 5, 100, 0.055),
      ];

      const lineMode = new TaxCalculator('line');
      const globalMode = new TaxCalculator('global');

      const lineSummary = lineMode.computeSummary(lines, []);
      const globalSummary = globalMode.computeSummary(lines, []);

      expect(lineSummary.taxTotal).toBeCloseTo(globalSummary.taxTotal);
      expect(lineSummary.grandTotal).toBeCloseTo(globalSummary.grandTotal);
    });
  });

  describe('Tax Categories', () => {
    it('should group by tax category', () => {
      const calculator = new TaxCalculator();
      const lines = [
        createLineWithCategory(1, 10, 100, 0.20, 'S'), // Standard
        createLineWithCategory(2, 5, 100, 0.20, 'S'), // Standard (same rate, same category)
        createLineWithCategory(3, 2, 100, 0.055, 'AA'), // Reduced
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.taxSummaries).toHaveLength(2);

      const standard = summary.taxSummaries.find(t => t.category === 'S');
      expect(standard?.rate).toBe(20);
      expect(standard?.taxable).toBe(1500); // Lines 1 + 2

      const reduced = summary.taxSummaries.find(t => t.category === 'AA');
      expect(reduced?.rate).toBe(5.5);
      expect(reduced?.taxable).toBe(200);
    });

    it('should differentiate same rate with different categories', () => {
      const calculator = new TaxCalculator();
      const lines = [
        createLineWithCategory(1, 10, 100, 0.20, 'S'),
        createLineWithCategory(2, 5, 100, 0.20, 'AE'), // Same rate, different category
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.taxSummaries).toHaveLength(2); // Two categories despite same rate

      const standard = summary.taxSummaries.find(t => t.category === 'S');
      expect(standard?.taxable).toBe(1000);

      const reverseCharge = summary.taxSummaries.find(t => t.category === 'AE');
      expect(reverseCharge?.taxable).toBe(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 0, 100, 0.20);

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxTotal).toBe(0);
    });

    it('should handle zero price', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 0, 0.20);

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxTotal).toBe(0);
    });

    it('should handle very large quantities', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 1000000, 100, 0.20);

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(100000000);
      expect(summary.taxTotal).toBe(20000000);
    });

    it('should handle very small prices', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 1000, 0.01, 0.20);

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(10);
      expect(summary.taxTotal).toBe(2);
    });

    it('should handle negative adjustment larger than line total', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 1, 100, 0.20); // 100 HT
      const docAllowance = createAllowance(200, 0.20); // Bigger than line

      const summary = calculator.computeSummary([line], [docAllowance]);

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(-100); // Negative (credit note scenario)
      expect(summary.taxTotal).toBe(-20);
      expect(summary.grandTotal).toBe(-120);
    });

    it('should handle empty tax rate (defaults to 0)', () => {
      const calculator = new TaxCalculator();
      const line: InvoiceLine = {
        id: '1',
        description: 'Test',
        quantity: 10,
        unitPrice: 100,
        lineTotal: 1000,
        vatRate: undefined as any, // Test undefined
        taxCategoryCode: 'S',
        unitCode: 'C62',
        allowances: [],
        charges: [],
      };

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(1000);
      expect(summary.taxTotal).toBe(0); // No VAT
    });

    it('should handle empty tax category (defaults to S)', () => {
      const calculator = new TaxCalculator();
      const line: InvoiceLine = {
        id: '1',
        description: 'Test',
        quantity: 10,
        unitPrice: 100,
        lineTotal: 1000,
        vatRate: 0.20,
        taxCategoryCode: undefined as any, // Test undefined
        unitCode: 'C62',
        allowances: [],
        charges: [],
      };

      const summary = calculator.computeSummary([line], []);

      expect(summary.taxSummaries[0].category).toBe('S'); // Default
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate invoice with mixed rates and adjustments', () => {
      const calculator = new TaxCalculator();
      const lines = [
        createLine(1, 10, 150, 0.20), // 1500 @ 20%
        createLine(2, 5, 80, 0.055), // 400 @ 5.5%
        createLine(3, 1, 500, 0), // 500 @ 0%
      ];

      lines[0].allowances.push(createAllowance(50, 0.20)); // Line discount

      const docAdjustments = [
        createAllowance(100, 0.20), // Volume discount
        createCharge(25, 0.20), // Handling fee
      ];

      const summary = calculator.computeSummary(lines, docAdjustments);

      // Line total: 1500 + 400 + 500 - 50 = 2350
      expect(summary.lineTotal).toBe(2350);

      // Tax basis: 2350 - 100 + 25 = 2275
      expect(summary.taxBasis).toBe(2275);

      // Tax: (1500 - 50 - 100 + 25) * 0.20 + 400 * 0.055 + 500 * 0 = 275 + 22 = 297
      expect(summary.taxTotal).toBeCloseTo(297);

      // Grand total: 2275 + 297 = 2572
      expect(summary.grandTotal).toBeCloseTo(2572);
    });

    it('should handle credit note (all negative)', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, -10, 100, 0.20); // Negative quantity

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(-1000);
      expect(summary.taxTotal).toBe(-200);
      expect(summary.grandTotal).toBe(-1200);
    });

    it('should calculate complex multi-rate invoice', () => {
      const calculator = new TaxCalculator();
      const lines = [
        createLine(1, 100, 10, 0.20), // Standard books
        createLine(2, 50, 20, 0.055), // Reduced food
        createLine(3, 10, 500, 0), // Exempt medical
        createLine(4, 5, 1000, 0.20), // Standard electronics
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(12000); // 1000 + 1000 + 5000 + 5000
      expect(summary.taxSummaries).toHaveLength(3);

      const totalTax = summary.taxSummaries.reduce((sum, t) => sum + t.taxAmount, 0);
      expect(totalTax).toBeCloseTo(summary.taxTotal);
    });
  });

  describe('Performance', () => {
    it('should handle 10,000 lines efficiently', () => {
      const calculator = new TaxCalculator();
      const lines = Array.from({ length: 10000 }, (_, i) =>
        createLine(i + 1, 1, 10, 0.20)
      );

      const start = Date.now();
      const summary = calculator.computeSummary(lines, []);
      const duration = Date.now() - start;

      expect(summary.lineTotal).toBe(100000);
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should handle many different tax rates efficiently', () => {
      const calculator = new TaxCalculator();
      const lines = Array.from({ length: 100 }, (_, i) =>
        createLine(i + 1, 1, 10, i * 0.01) // 100 different rates
      );

      const summary = calculator.computeSummary(lines, []);

      expect(summary.taxSummaries).toHaveLength(100); // 100 unique rates
      expect(summary.lineTotal).toBe(1000);
    });
  });

  describe('Frozen Results', () => {
    it('should return frozen tax summaries array', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20);

      const summary = calculator.computeSummary([line], []);

      expect(Object.isFrozen(summary.taxSummaries)).toBe(true);
    });

    it('should not allow modification of tax summaries', () => {
      const calculator = new TaxCalculator();
      const line = createLine(1, 10, 100, 0.20);

      const summary = calculator.computeSummary([line], []);

      expect(() => {
        (summary.taxSummaries as any).push({ rate: 10, category: 'X', taxable: 100, taxAmount: 10 });
      }).toThrow();
    });
  });
});

// ============================================================================
// TEST HELPERS
// ============================================================================

function createLine(
  id: number,
  quantity: number,
  unitPrice: number,
  vatRate: number,
  taxCategory: string = 'S'
): InvoiceLine {
  return {
    id: id.toString(),
    description: `Test Item ${id}`,
    quantity,
    unitPrice,
    lineTotal: quantity * unitPrice,
    vatRate,
    taxCategoryCode: taxCategory,
    unitCode: 'C62',
    allowances: [],
    charges: [],
  };
}

function createLineWithCategory(
  id: number,
  quantity: number,
  unitPrice: number,
  vatRate: number,
  category: string
): InvoiceLine {
  return createLine(id, quantity, unitPrice, vatRate, category);
}

function createAllowance(amount: number, taxRate: number): AllowanceCharge {
  return {
    chargeIndicator: false,
    actualAmount: amount,
    taxRate,
    taxCategoryCode: 'S',
    reason: 'Discount',
  };
}

function createCharge(amount: number, taxRate: number): AllowanceCharge {
  return {
    chargeIndicator: true,
    actualAmount: amount,
    taxRate,
    taxCategoryCode: 'S',
    reason: 'Surcharge',
  };
}
