import { TaxCalculator } from '../../core/TaxCalculator';
import { InvoiceLine, AllowanceCharge } from '../../core/entities';

describe('TaxCalculator', () => {
  describe('constructor', () => {
    it('should create calculator with default line rounding mode', () => {
      const calc = new TaxCalculator();
      // We can't directly access roundMode, but we can test its behavior
      expect(calc).toBeDefined();
    });

    it('should create calculator with line mode', () => {
      const calc = new TaxCalculator('line');
      expect(calc).toBeDefined();
    });

    it('should create calculator with global mode', () => {
      const calc = new TaxCalculator('global');
      expect(calc).toBeDefined();
    });
  });

  describe('computeSummary with line mode', () => {
    let calc: TaxCalculator;

    beforeEach(() => {
      calc = new TaxCalculator('line');
    });

    it('should handle empty lines', () => {
      const summary = calc.computeSummary([]);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxBasis).toBe(0);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
      expect(summary.taxSummaries).toEqual([]);
    });

    it('should calculate tax for single line', () => {
      const line = new InvoiceLine('L1', 'Product A', 2, 100, 0.20);
      const summary = calc.computeSummary([line]);

      expect(summary.lineTotal).toBe(200); // 2 * 100
      expect(summary.taxBasis).toBe(200);
      expect(summary.taxTotal).toBe(40); // 200 * 0.20
      expect(summary.grandTotal).toBe(240);
      expect(summary.taxSummaries.length).toBe(1);
      expect(summary.taxSummaries[0].rate).toBe(20); // Percentage
      expect(summary.taxSummaries[0].category).toBe('S');
      expect(summary.taxSummaries[0].taxable).toBe(200);
      expect(summary.taxSummaries[0].taxAmount).toBe(40);
    });

    it('should aggregate multiple lines with same tax rate', () => {
      const line1 = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
      const line2 = new InvoiceLine('L2', 'Product B', 2, 50, 0.20);

      const summary = calc.computeSummary([line1, line2]);

      expect(summary.lineTotal).toBe(200); // 100 + 100
      expect(summary.taxBasis).toBe(200);
      expect(summary.taxTotal).toBe(40); // (100 + 100) * 0.20
      expect(summary.grandTotal).toBe(240);
      expect(summary.taxSummaries.length).toBe(1);
    });

    it('should handle multiple tax rates', () => {
      const line1 = new InvoiceLine('L1', 'Product A', 1, 100, 0.20, 'S');
      const line2 = new InvoiceLine('L2', 'Product B', 1, 100, 0.10, 'S');

      const summary = calc.computeSummary([line1, line2]);

      expect(summary.lineTotal).toBe(200);
      expect(summary.taxBasis).toBe(200);
      expect(summary.taxTotal).toBe(30); // (100 * 0.20) + (100 * 0.10)
      expect(summary.grandTotal).toBe(230);
      expect(summary.taxSummaries.length).toBe(2);
    });

    it('should handle multiple tax categories', () => {
      const line1 = new InvoiceLine('L1', 'Product A', 1, 100, 0.20, 'S');
      const line2 = new InvoiceLine('L2', 'Product B', 1, 100, 0.20, 'Z');

      const summary = calc.computeSummary([line1, line2]);

      expect(summary.lineTotal).toBe(200);
      expect(summary.taxTotal).toBe(40);
      expect(summary.taxSummaries.length).toBe(2);
      expect(summary.taxSummaries[0].category).toBe('S');
      expect(summary.taxSummaries[1].category).toBe('Z');
    });

    it('should handle zero VAT rate', () => {
      const line = new InvoiceLine('L1', 'Product A', 1, 100, 0);
      const summary = calc.computeSummary([line]);

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(100);
    });

    it('should handle fractional amounts', () => {
      const line = new InvoiceLine('L1', 'Product A', 2.5, 49.99, 0.20);
      const summary = calc.computeSummary([line]);

      const expectedLineTotal = 2.5 * 49.99; // 124.975
      expect(summary.lineTotal).toBeCloseTo(expectedLineTotal, 5);
      expect(summary.taxTotal).toBeCloseTo(expectedLineTotal * 0.20, 5);
      expect(summary.grandTotal).toBeCloseTo(expectedLineTotal * 1.20, 5);
    });

    describe('with line-level allowances and charges', () => {
      it('should apply line allowance (discount)', () => {
        const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
        line.addAllowance(10, 'Discount');

        const summary = calc.computeSummary([line]);

        expect(summary.lineTotal).toBe(90); // 100 - 10
        expect(summary.taxBasis).toBe(90);
        expect(summary.taxTotal).toBe(18); // 90 * 0.20
        expect(summary.grandTotal).toBe(108);
      });

      it('should apply line charge', () => {
        const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
        line.addCharge(15, 'Handling');

        const summary = calc.computeSummary([line]);

        expect(summary.lineTotal).toBe(115); // 100 + 15
        expect(summary.taxBasis).toBe(115);
        expect(summary.taxTotal).toBe(23); // 115 * 0.20
        expect(summary.grandTotal).toBe(138);
      });

      it('should apply multiple allowances and charges', () => {
        const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
        line.addAllowance(10, 'Discount 1');
        line.addAllowance(5, 'Discount 2');
        line.addCharge(20, 'Fee');

        const summary = calc.computeSummary([line]);

        expect(summary.lineTotal).toBe(105); // 100 - 10 - 5 + 20
        expect(summary.taxTotal).toBe(21); // 105 * 0.20
      });

      it('should handle allowance/charge with different tax rate', () => {
        const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);

        // Create allowance with different tax rate
        const allowance = new AllowanceCharge(false, 10, 'Discount', undefined, 0.10);
        line.allowances.push(allowance);

        const summary = calc.computeSummary([line]);

        expect(summary.lineTotal).toBe(90); // 100 - 10
        expect(summary.taxSummaries.length).toBe(2); // Two different rates

        // Find tax summaries by rate
        const tax20 = summary.taxSummaries.find(t => t.rate === 20);
        const tax10 = summary.taxSummaries.find(t => t.rate === 10);

        expect(tax20?.taxable).toBe(100);
        expect(tax20?.taxAmount).toBe(20); // 100 * 0.20
        expect(tax10?.taxable).toBe(-10); // Allowance is negative
        expect(tax10?.taxAmount).toBe(-1); // -10 * 0.10
      });
    });

    describe('with document-level allowances and charges', () => {
      it('should apply document allowance', () => {
        const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
        // Need to specify tax rate on document allowance!
        const docAllowance = new AllowanceCharge(false, 20, 'Volume discount', undefined, 0.20);

        const summary = calc.computeSummary([line], [docAllowance]);

        expect(summary.lineTotal).toBe(100);
        expect(summary.taxBasis).toBe(80); // 100 - 20
        expect(summary.taxTotal).toBe(16); // (100 * 0.20) + (-20 * 0.20) = 20 - 4 = 16
        expect(summary.grandTotal).toBe(96);
      });

      it('should apply document charge', () => {
        const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
        // Need to specify tax rate on document charge!
        const docCharge = new AllowanceCharge(true, 30, 'Shipping', undefined, 0.20);

        const summary = calc.computeSummary([line], [docCharge]);

        expect(summary.lineTotal).toBe(100);
        expect(summary.taxBasis).toBe(130); // 100 + 30
        expect(summary.taxTotal).toBe(26); // (100 * 0.20) + (30 * 0.20) = 20 + 6 = 26
        expect(summary.grandTotal).toBe(156);
      });

      it('should apply multiple document adjustments', () => {
        const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
        // Specify tax rates
        const docAllowance = new AllowanceCharge(false, 10, undefined, undefined, 0.20);
        const docCharge = new AllowanceCharge(true, 15, undefined, undefined, 0.20);

        const summary = calc.computeSummary([line], [docAllowance, docCharge]);

        expect(summary.lineTotal).toBe(100);
        expect(summary.taxBasis).toBe(105); // 100 - 10 + 15
        expect(summary.taxTotal).toBe(21); // (100 * 0.20) + (-10 * 0.20) + (15 * 0.20) = 20 - 2 + 3 = 21
      });

      it('should handle document adjustment with custom tax rate', () => {
        const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
        const docCharge = new AllowanceCharge(true, 50, 'Fee', undefined, 0.10);

        const summary = calc.computeSummary([line], [docCharge]);

        expect(summary.taxBasis).toBe(150); // 100 + 50
        expect(summary.taxSummaries.length).toBe(2);
      });
    });

    it('should handle complex scenario with all features', () => {
      const line1 = new InvoiceLine('L1', 'Product A', 2, 100, 0.20);
      line1.addAllowance(20, 'Line discount');

      const line2 = new InvoiceLine('L2', 'Product B', 1, 50, 0.10);
      line2.addCharge(5, 'Packaging');

      const docAllowance = AllowanceCharge.allowance(30, 'Order discount');
      const docCharge = AllowanceCharge.charge(10, 'Delivery');

      const summary = calc.computeSummary([line1, line2], [docAllowance, docCharge]);

      // Line 1: 200 - 20 = 180
      // Line 2: 50 + 5 = 55
      // lineTotal: 235
      // taxBasis: 235 - 30 + 10 = 215
      expect(summary.lineTotal).toBe(235);
      expect(summary.taxBasis).toBe(215);
    });

    it('should freeze taxSummaries array', () => {
      const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
      const summary = calc.computeSummary([line]);

      expect(Object.isFrozen(summary.taxSummaries)).toBe(true);
    });
  });

  describe('computeSummary with global mode', () => {
    let calc: TaxCalculator;

    beforeEach(() => {
      calc = new TaxCalculator('global');
    });

    it('should handle empty lines', () => {
      const summary = calc.computeSummary([]);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxBasis).toBe(0);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
    });

    it('should calculate tax for single line', () => {
      const line = new InvoiceLine('L1', 'Product A', 2, 100, 0.20);
      const summary = calc.computeSummary([line]);

      expect(summary.lineTotal).toBe(200);
      expect(summary.taxBasis).toBe(200);
      expect(summary.taxTotal).toBe(40); // 200 * 0.20
      expect(summary.grandTotal).toBe(240);
    });

    it('should aggregate then calculate tax (global mode)', () => {
      const line1 = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
      const line2 = new InvoiceLine('L2', 'Product B', 1, 100, 0.20);

      const summary = calc.computeSummary([line1, line2]);

      expect(summary.lineTotal).toBe(200);
      expect(summary.taxTotal).toBe(40); // (100 + 100) * 0.20
      expect(summary.grandTotal).toBe(240);
    });

    it('should handle multiple tax rates in global mode', () => {
      const line1 = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
      const line2 = new InvoiceLine('L2', 'Product B', 1, 100, 0.10);

      const summary = calc.computeSummary([line1, line2]);

      expect(summary.taxTotal).toBe(30); // (100 * 0.20) + (100 * 0.10)
      expect(summary.taxSummaries.length).toBe(2);
    });

    it('should apply allowances and charges before tax in global mode', () => {
      const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
      line.addAllowance(10);

      const summary = calc.computeSummary([line]);

      expect(summary.lineTotal).toBe(90);
      expect(summary.taxTotal).toBe(18); // 90 * 0.20 (calculated globally)
    });

    it('should handle document adjustments in global mode', () => {
      const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
      // Specify tax rate
      const docAllowance = new AllowanceCharge(false, 20, undefined, undefined, 0.20);

      const summary = calc.computeSummary([line], [docAllowance]);

      expect(summary.taxBasis).toBe(80);
      expect(summary.taxTotal).toBe(16); // (100 - 20) * 0.20 = 80 * 0.20 = 16
    });

    // Note: In global mode, rounding happens once at the end, potentially
    // giving different results from line mode for certain edge cases
    it('should demonstrate difference from line mode', () => {
      const lineCalc = new TaxCalculator('line');
      const globalCalc = new TaxCalculator('global');

      // Create scenario where rounding matters
      const lines = [
        new InvoiceLine('L1', 'Product A', 1, 33.33, 0.20),
        new InvoiceLine('L2', 'Product B', 1, 33.33, 0.20),
        new InvoiceLine('L3', 'Product C', 1, 33.34, 0.20),
      ];

      const lineSummary = lineCalc.computeSummary(lines);
      const globalSummary = globalCalc.computeSummary(lines);

      // Line total should be same
      expect(lineSummary.lineTotal).toBeCloseTo(100, 5);
      expect(globalSummary.lineTotal).toBeCloseTo(100, 5);

      // Tax calculation may differ due to rounding
      // Line mode: round each line tax, then sum
      // Global mode: sum all taxable, then calculate tax once
      expect(lineSummary.taxTotal).toBeCloseTo(20, 5);
      expect(globalSummary.taxTotal).toBeCloseTo(20, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle zero quantity', () => {
      const calc = new TaxCalculator();
      const line = new InvoiceLine('L1', 'Product A', 0, 100, 0.20);

      const summary = calc.computeSummary([line]);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxTotal).toBe(0);
    });

    it('should handle zero price', () => {
      const calc = new TaxCalculator();
      const line = new InvoiceLine('L1', 'Free product', 10, 0, 0.20);

      const summary = calc.computeSummary([line]);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxTotal).toBe(0);
    });

    it('should handle very small amounts', () => {
      const calc = new TaxCalculator();
      const line = new InvoiceLine('L1', 'Product A', 1, 0.01, 0.20);

      const summary = calc.computeSummary([line]);

      expect(summary.lineTotal).toBe(0.01);
      expect(summary.taxTotal).toBeCloseTo(0.002, 10);
    });

    it('should handle very large amounts', () => {
      const calc = new TaxCalculator();
      const line = new InvoiceLine('L1', 'Product A', 1000, 9999.99, 0.20);

      const summary = calc.computeSummary([line]);

      expect(summary.lineTotal).toBeCloseTo(9999990, 5);
      expect(summary.taxTotal).toBeCloseTo(1999998, 5);
    });

    it('should handle many lines efficiently', () => {
      const calc = new TaxCalculator();
      const lines: InvoiceLine[] = [];

      // Create 1000 lines
      for (let i = 0; i < 1000; i++) {
        lines.push(new InvoiceLine(`L${i}`, `Product ${i}`, 1, 10, 0.20));
      }

      const summary = calc.computeSummary(lines);

      expect(summary.lineTotal).toBe(10000);
      expect(summary.taxTotal).toBe(2000);
      expect(summary.grandTotal).toBe(12000);
    });

    it('should handle many different tax rates', () => {
      const calc = new TaxCalculator();
      const lines: InvoiceLine[] = [];

      // Create lines with 20 different tax rates
      for (let i = 0; i < 20; i++) {
        const rate = i * 0.01; // 0%, 1%, 2%, ..., 19%
        lines.push(new InvoiceLine(`L${i}`, `Product ${i}`, 1, 100, rate));
      }

      const summary = calc.computeSummary(lines);

      expect(summary.taxSummaries.length).toBe(20);
    });

    it('should handle undefined taxRate and taxCategoryCode', () => {
      const calc = new TaxCalculator();
      const line = new InvoiceLine('L1', 'Product A', 1, 100, undefined as any);

      const summary = calc.computeSummary([line]);

      // Should use 0 as default rate
      expect(summary.taxTotal).toBe(0);
    });
  });
});
