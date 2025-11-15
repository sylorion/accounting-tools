// src/__tests__/TaxCalculator.test.ts

import { TaxCalculator, MonetarySummary, TaxSummary } from '../core/TaxCalculator';
import { InvoiceLine } from '../core/InvoiceLine';
import { AllowanceCharge } from '../core/AllowanceCharge';
import { TaxCategoryCode } from '../core/EnumInvoiceType';

describe('TaxCalculator', () => {
  describe('Constructor', () => {
    it('should create instance with default roundMode "line"', () => {
      const calculator = new TaxCalculator();
      expect(calculator).toBeDefined();
    });

    it('should create instance with roundMode "global"', () => {
      const calculator = new TaxCalculator('global');
      expect(calculator).toBeDefined();
    });
  });

  describe('computeSummary - Basic calculations', () => {
    it('should calculate simple invoice with one line', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(100);
      expect(summary.taxTotal).toBe(20);
      expect(summary.grandTotal).toBe(120);
      expect(summary.taxSummaries).toHaveLength(1);
      expect(summary.taxSummaries[0].rate).toBe(20); // 0.20 * 100 = 20%
      expect(summary.taxSummaries[0].taxable).toBe(100);
      expect(summary.taxSummaries[0].taxAmount).toBe(20);
    });

    it('should calculate invoice with multiple lines same VAT', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 2, 50, 0.20),
        new InvoiceLine('2', 'Product B', 1, 100, 0.20)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.lineTotal).toBe(200); // 2*50 + 1*100
      expect(summary.taxBasis).toBe(200);
      expect(summary.taxTotal).toBe(40); // 200 * 0.20
      expect(summary.grandTotal).toBe(240);
    });

    it('should calculate invoice with multiple VAT rates', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20), // 20%
        new InvoiceLine('2', 'Product B', 1, 100, 0.10), // 10%
        new InvoiceLine('3', 'Product C', 1, 100, 0.055) // 5.5%
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.lineTotal).toBe(300);
      expect(summary.taxBasis).toBe(300);
      expect(summary.taxTotal).toBeCloseTo(35.5, 2); // 20 + 10 + 5.5
      expect(summary.grandTotal).toBeCloseTo(335.5, 2);
      expect(summary.taxSummaries).toHaveLength(3);
    });

    it('should handle zero VAT rate', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0) // 0% VAT
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(100);
    });

    it('should handle empty lines array', () => {
      const calculator = new TaxCalculator('line');
      const summary = calculator.computeSummary([]);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxBasis).toBe(0);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
      expect(summary.taxSummaries).toHaveLength(0);
    });
  });

  describe('computeSummary - Document level allowances/charges', () => {
    it('should apply document level discount (allowance)', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20)
      ];
      const docAllowances = [
        new AllowanceCharge(false, 10, 'Discount', 'DISC', 0.20) // -10 EUR discount
      ];

      const summary = calculator.computeSummary(lines, docAllowances);

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(90); // 100 - 10
      expect(summary.taxTotal).toBe(18); // 90 * 0.20
      expect(summary.grandTotal).toBe(108);
    });

    it('should apply document level charge', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20)
      ];
      const docCharges = [
        new AllowanceCharge(true, 20, 'Shipping', 'SHIP', 0.20) // +20 EUR charge
      ];

      const summary = calculator.computeSummary(lines, docCharges);

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(120); // 100 + 20
      expect(summary.taxTotal).toBe(24); // 120 * 0.20
      expect(summary.grandTotal).toBe(144);
    });

    it('should apply multiple document level allowances and charges', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20)
      ];
      const docAC = [
        new AllowanceCharge(false, 10, 'Discount', 'DISC', 0.20), // -10
        new AllowanceCharge(true, 5, 'Processing fee', 'PROC', 0.20)  // +5
      ];

      const summary = calculator.computeSummary(lines, docAC);

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(95); // 100 - 10 + 5
      expect(summary.taxTotal).toBe(19); // 95 * 0.20
      expect(summary.grandTotal).toBe(114);
    });

    it('should handle allowance with different VAT rate', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20)
      ];
      const docAllowances = [
        new AllowanceCharge(false, 10, 'Discount', 'DISC', 0.10) // 10% VAT on discount
      ];

      const summary = calculator.computeSummary(lines, docAllowances);

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(90); // 100 - 10
      expect(summary.taxTotal).toBe(19); // (100*0.20) + (-10*0.10) = 20 - 1 = 19
      expect(summary.grandTotal).toBe(109);
    });
  });

  describe('computeSummary - Round modes', () => {
    it('should calculate same result for both modes with simple case', () => {
      const linesData = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20),
        new InvoiceLine('2', 'Product B', 1, 50, 0.20)
      ];

      const calcLine = new TaxCalculator('line');
      const summaryLine = calcLine.computeSummary(linesData);

      const calcGlobal = new TaxCalculator('global');
      const summaryGlobal = calcGlobal.computeSummary(linesData);

      expect(summaryLine.lineTotal).toBe(summaryGlobal.lineTotal);
      expect(summaryLine.taxBasis).toBe(summaryGlobal.taxBasis);
      expect(summaryLine.taxTotal).toBe(summaryGlobal.taxTotal);
      expect(summaryLine.grandTotal).toBe(summaryGlobal.grandTotal);
    });

    it('roundMode "line" should round per line', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.taxTotal).toBe(20);
    });

    it('roundMode "global" should round globally', () => {
      const calculator = new TaxCalculator('global');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.taxTotal).toBe(20);
    });
  });

  describe('computeSummary - Tax categories', () => {
    it('should group by tax category', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20, TaxCategoryCode.STANDARD),
        new InvoiceLine('2', 'Product B', 1, 100, 0.20, TaxCategoryCode.REDUCED)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.taxSummaries).toHaveLength(2);
      expect(summary.taxSummaries[0].category).toBeTruthy();
      expect(summary.taxSummaries[1].category).toBeTruthy();
    });

    it('should default to category "S" if not specified', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20) // No category specified
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.taxSummaries).toHaveLength(1);
      expect(summary.taxSummaries[0].category).toBe('S');
    });
  });

  describe('computeSummary - Complex scenarios', () => {
    it('should handle complex invoice with multiple rates and doc-level allowances', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Consulting', 5, 800, 0.20),      // 4000 HT
        new InvoiceLine('2', 'Training', 3, 450, 0.20),        // 1350 HT
        new InvoiceLine('3', 'Books', 5, 45, 0.055)            // 225 HT
      ];
      const docAC = [
        new AllowanceCharge(false, 250, 'Discount 5%', 'DISC', 0.20), // -250
        new AllowanceCharge(true, 50, 'Admin fee', 'ADM', 0.20)       // +50
      ];

      const summary = calculator.computeSummary(lines, docAC);

      expect(summary.lineTotal).toBe(5575); // 4000 + 1350 + 225
      expect(summary.taxBasis).toBe(5375); // 5575 - 250 + 50
      // TVA: (4000+1350)*0.20 = 1070, 225*0.055 = 12.375, -250*0.20 = -50, +50*0.20 = 10
      // Total: 1070 + 12.375 - 50 + 10 = 1042.375
      expect(summary.taxTotal).toBeCloseTo(1042.375, 2);
      expect(summary.grandTotal).toBeCloseTo(6417.375, 2);
    });

    it('should handle invoice with all features combined', () => {
      const calculator = new TaxCalculator('line');

      // Lines with different VAT rates
      const lines = [
        new InvoiceLine('1', 'Service A', 10, 100, 0.20),
        new InvoiceLine('2', 'Service B', 5, 50, 0.10),
        new InvoiceLine('3', 'Product C', 2, 200, 0.055)
      ];

      // Doc-level allowances and charges
      const docAC = [
        new AllowanceCharge(false, 100, 'Volume discount', 'DISC', 0.20),
        new AllowanceCharge(true, 30, 'Handling fee', 'HAND', 0.20)
      ];

      const summary = calculator.computeSummary(lines, docAC);

      // Verify structure
      expect(summary).toHaveProperty('lineTotal');
      expect(summary).toHaveProperty('taxBasis');
      expect(summary).toHaveProperty('taxTotal');
      expect(summary).toHaveProperty('grandTotal');
      expect(summary).toHaveProperty('taxSummaries');
      expect(Array.isArray(summary.taxSummaries)).toBe(true);
      expect(summary.taxSummaries.length).toBeGreaterThan(0);

      // Verify totals are positive
      expect(summary.lineTotal).toBeGreaterThan(0);
      expect(summary.taxBasis).toBeGreaterThan(0);
      expect(summary.taxTotal).toBeGreaterThan(0);
      expect(summary.grandTotal).toBeGreaterThan(0);

      // Verify consistency
      expect(summary.grandTotal).toBeGreaterThan(summary.taxBasis);
      expect(summary.grandTotal).toBeCloseTo(summary.taxBasis + summary.taxTotal, 2);
    });
  });

  describe('computeSummary - Edge cases', () => {
    it('should handle very small amounts', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Tiny product', 1, 0.01, 0.20)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.lineTotal).toBe(0.01);
      expect(summary.taxTotal).toBeCloseTo(0.002, 3);
    });

    it('should handle very large amounts', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Expensive item', 1, 1000000, 0.20)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.lineTotal).toBe(1000000);
      expect(summary.taxTotal).toBe(200000);
      expect(summary.grandTotal).toBe(1200000);
    });

    it('should handle many lines', () => {
      const calculator = new TaxCalculator('line');
      const lines = [];
      for (let i = 1; i <= 100; i++) {
        lines.push(new InvoiceLine(i.toString(), `Product ${i}`, 1, 10, 0.20));
      }

      const summary = calculator.computeSummary(lines);

      expect(summary.lineTotal).toBe(1000); // 100 * 10
      expect(summary.taxTotal).toBe(200);
      expect(summary.grandTotal).toBe(1200);
    });

    it('should handle fractional quantities', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product', 2.5, 10, 0.20)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.lineTotal).toBe(25); // 2.5 * 10
      expect(summary.taxTotal).toBe(5);
      expect(summary.grandTotal).toBe(30);
    });
  });

  describe('TaxSummary structure', () => {
    it('should return correct TaxSummary structure', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20, TaxCategoryCode.STANDARD)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.taxSummaries[0]).toHaveProperty('rate');
      expect(summary.taxSummaries[0]).toHaveProperty('category');
      expect(summary.taxSummaries[0]).toHaveProperty('taxable');
      expect(summary.taxSummaries[0]).toHaveProperty('taxAmount');

      expect(typeof summary.taxSummaries[0].rate).toBe('number');
      expect(typeof summary.taxSummaries[0].category).toBe('string');
      expect(typeof summary.taxSummaries[0].taxable).toBe('number');
      expect(typeof summary.taxSummaries[0].taxAmount).toBe('number');
    });

    it('should return rate as percentage (0.20 → 20)', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('1', 'Product A', 1, 100, 0.20)
      ];

      const summary = calculator.computeSummary(lines);

      expect(summary.taxSummaries[0].rate).toBe(20); // Not 0.20
    });
  });
});
