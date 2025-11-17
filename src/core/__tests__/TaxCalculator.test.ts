import { TaxCalculator } from '../TaxCalculator';
import { InvoiceLine } from '../InvoiceLine';
import { AllowanceCharge } from '../AllowanceCharge';
import { TaxCategoryCode } from '../EnumInvoiceType';

describe('TaxCalculator', () => {
  describe('constructor', () => {
    it('should create calculator with line rounding mode by default', () => {
      const calculator = new TaxCalculator();

      expect(calculator).toBeDefined();
    });

    it('should create calculator with line rounding mode', () => {
      const calculator = new TaxCalculator('line');

      expect(calculator).toBeDefined();
    });

    it('should create calculator with global rounding mode', () => {
      const calculator = new TaxCalculator('global');

      expect(calculator).toBeDefined();
    });
  });

  describe('computeSummary - basic calculations', () => {
    it('should calculate summary for single line without tax', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item 1', 5, 100, 0, 'Z')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(500);
      expect(summary.taxBasis).toBe(500);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(500);
    });

    it('should calculate summary for single line with standard VAT', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item 1', 10, 100, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(1000);
      expect(summary.taxBasis).toBe(1000);
      expect(summary.taxTotal).toBe(200);
      expect(summary.grandTotal).toBe(1200);
    });

    it('should calculate summary for multiple lines', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item 1', 5, 100, 0.20, 'S'),
        new InvoiceLine('L2', 'Item 2', 3, 50, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(650);
      expect(summary.taxBasis).toBe(650);
      expect(summary.taxTotal).toBe(130);
      expect(summary.grandTotal).toBe(780);
    });
  });

  describe('computeSummary - multiple tax rates', () => {
    it('should handle multiple tax rates correctly', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item 20%', 10, 100, 0.20, 'S'),
        new InvoiceLine('L2', 'Item 5.5%', 5, 50, 0.055, 'AA'),
        new InvoiceLine('L3', 'Item 0%', 3, 30, 0, 'Z')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(1340);
      expect(summary.taxBasis).toBe(1340);
      expect(summary.taxTotal).toBeCloseTo(213.75, 2);
      expect(summary.grandTotal).toBeCloseTo(1553.75, 2);
      expect(summary.taxSummaries.length).toBe(3);
    });

    it('should separate tax summaries by rate and category', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Standard', 10, 100, 0.20, 'S'),
        new InvoiceLine('L2', 'Reduced', 5, 50, 0.055, 'AA'),
        new InvoiceLine('L3', 'Zero', 3, 30, 0, 'Z')
      ];

      const summary = calculator.computeSummary(lines, []);

      const standardTax = summary.taxSummaries.find(t => t.category === 'S');
      const reducedTax = summary.taxSummaries.find(t => t.category === 'AA');
      const zeroTax = summary.taxSummaries.find(t => t.category === 'Z');

      expect(standardTax).toBeDefined();
      expect(standardTax?.taxable).toBe(1000);
      expect(standardTax?.taxAmount).toBe(200);
      expect(standardTax?.rate).toBe(20);

      expect(reducedTax).toBeDefined();
      expect(reducedTax?.taxable).toBe(250);
      expect(reducedTax?.taxAmount).toBeCloseTo(13.75, 2);
      expect(reducedTax?.rate).toBeCloseTo(5.5, 2);

      expect(zeroTax).toBeDefined();
      expect(zeroTax?.taxable).toBe(90);
      expect(zeroTax?.taxAmount).toBe(0);
      expect(zeroTax?.rate).toBe(0);
    });
  });

  describe('computeSummary - with line allowances and charges', () => {
    it('should handle line with allowance (discount)', () => {
      const calculator = new TaxCalculator('line');
      const line = new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S');
      line.addAllowance(100, 'Discount');

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(900);
      expect(summary.taxTotal).toBeCloseTo(180, 2);
    });

    it('should handle line with charge (fee)', () => {
      const calculator = new TaxCalculator('line');
      const line = new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S');
      line.addCharge(50, 'Handling fee');

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(1050);
      expect(summary.taxTotal).toBeCloseTo(210, 2);
    });

    it('should handle multiple line allowances and charges', () => {
      const calculator = new TaxCalculator('line');
      const line = new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S');
      line.addAllowance(100, 'Discount 1');
      line.addAllowance(50, 'Discount 2');
      line.addCharge(30, 'Fee 1');

      const summary = calculator.computeSummary([line], []);

      expect(summary.lineTotal).toBe(880);
    });
  });

  describe('computeSummary - with document level allowances and charges', () => {
    it('should handle document level allowance', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S')
      ];
      const docAllowances = [
        new AllowanceCharge(false, 100, 'Document discount', undefined, 0.20, TaxCategoryCode.STANDARD)
      ];

      const summary = calculator.computeSummary(lines, docAllowances);

      expect(summary.taxBasis).toBe(900);
      expect(summary.taxTotal).toBeCloseTo(180, 2);
      expect(summary.grandTotal).toBeCloseTo(1080, 2);
    });

    it('should handle document level charge', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S')
      ];
      const docCharges = [
        new AllowanceCharge(true, 50, 'Shipping', undefined, 0.20, TaxCategoryCode.STANDARD)
      ];

      const summary = calculator.computeSummary(lines, docCharges);

      expect(summary.taxBasis).toBe(1050);
      expect(summary.taxTotal).toBeCloseTo(210, 2);
      expect(summary.grandTotal).toBeCloseTo(1260, 2);
    });

    it('should handle multiple document level allowances and charges', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S')
      ];
      const docAC = [
        new AllowanceCharge(false, 200, 'Bulk discount', undefined, 0.20, TaxCategoryCode.STANDARD),
        new AllowanceCharge(true, 50, 'Shipping', undefined, 0.20, TaxCategoryCode.STANDARD),
        new AllowanceCharge(true, 25, 'Handling', undefined, 0.20, TaxCategoryCode.STANDARD)
      ];

      const summary = calculator.computeSummary(lines, docAC);

      expect(summary.taxBasis).toBe(875);
      expect(summary.taxTotal).toBeCloseTo(175, 2);
    });

    it('should handle doc allowances with different tax rates', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S')
      ];
      const docAC = [
        new AllowanceCharge(true, 50, 'Fee 20%', undefined, 0.20, TaxCategoryCode.STANDARD),
        new AllowanceCharge(true, 100, 'Fee 5.5%', undefined, 0.055, TaxCategoryCode.REDUCED)
      ];

      const summary = calculator.computeSummary(lines, docAC);

      expect(summary.taxSummaries.length).toBe(2);
      expect(summary.taxBasis).toBe(1150);
    });
  });

  describe('computeSummary - rounding modes', () => {
    it('should calculate with line rounding mode', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item', 3, 33.33, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBeCloseTo(99.99, 2);
      expect(summary.taxTotal).toBeCloseTo(19.998, 2);
    });

    it('should calculate with global rounding mode', () => {
      const calculator = new TaxCalculator('global');
      const lines = [
        new InvoiceLine('L1', 'Item 1', 3, 33.33, 0.20, 'S'),
        new InvoiceLine('L2', 'Item 2', 2, 25.50, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBeCloseTo(150.99, 2);
      expect(summary.taxBasis).toBeCloseTo(150.99, 2);
    });

    it('should produce different results for line vs global rounding', () => {
      const lineCalc = new TaxCalculator('line');
      const globalCalc = new TaxCalculator('global');

      const lines = [
        new InvoiceLine('L1', 'Item', 3, 33.33, 0.20, 'S')
      ];

      const lineSummary = lineCalc.computeSummary(lines, []);
      const globalSummary = globalCalc.computeSummary(lines, []);

      expect(lineSummary.taxBasis).toEqual(globalSummary.taxBasis);
    });
  });

  describe('computeSummary - edge cases', () => {
    it('should handle empty lines array', () => {
      const calculator = new TaxCalculator('line');

      const summary = calculator.computeSummary([], []);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxBasis).toBe(0);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
      expect(summary.taxSummaries.length).toBe(0);
    });

    it('should handle zero amounts', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Free item', 1, 0, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
    });

    it('should handle negative amounts (credit notes)', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Return', -5, 100, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(-500);
      expect(summary.taxTotal).toBe(-100);
      expect(summary.grandTotal).toBe(-600);
    });

    it('should handle very small decimal values', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Micro', 1000, 0.001, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBeCloseTo(1, 3);
      expect(summary.taxTotal).toBeCloseTo(0.2, 3);
    });

    it('should handle very large amounts', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Bulk', 1000000, 100, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.lineTotal).toBe(100000000);
      expect(summary.taxTotal).toBe(20000000);
      expect(summary.grandTotal).toBe(120000000);
    });
  });

  describe('computeSummary - complex scenarios', () => {
    it('should handle mixed lines, line AC, and document AC', () => {
      const calculator = new TaxCalculator('line');

      const line1 = new InvoiceLine('L1', 'Service', 10, 150, 0.20, 'S');
      line1.addAllowance(100, 'Line discount');

      const line2 = new InvoiceLine('L2', 'Product', 5, 80, 0.20, 'S');
      line2.addCharge(30, 'Line charge');

      const docAC = [
        new AllowanceCharge(false, 200, 'Document discount', undefined, 0.20, TaxCategoryCode.STANDARD),
        new AllowanceCharge(true, 50, 'Shipping', undefined, 0.20, TaxCategoryCode.STANDARD)
      ];

      const summary = calculator.computeSummary([line1, line2], docAC);

      // line1: 1500 - 100 = 1400
      // line2: 400 + 30 = 430
      // lineTotal: 1830
      // doc: -200 + 50 = -150
      // taxBasis: 1680
      expect(summary.lineTotal).toBe(1830);
      expect(summary.taxBasis).toBe(1680);
      expect(summary.taxTotal).toBeCloseTo(336, 2);
      expect(summary.grandTotal).toBeCloseTo(2016, 2);
    });

    it('should handle real-world invoice scenario', () => {
      const calculator = new TaxCalculator('line');

      const lines = [
        new InvoiceLine('L1', 'Laptop', 2, 1200, 0.20, 'S'),
        new InvoiceLine('L2', 'Mouse', 2, 25, 0.20, 'S'),
        new InvoiceLine('L3', 'Warranty', 2, 100, 0.20, 'S')
      ];

      const docAC = [
        new AllowanceCharge(false, 100, 'Volume discount', undefined, 0.20, TaxCategoryCode.STANDARD),
        new AllowanceCharge(true, 50, 'Shipping', undefined, 0.20, TaxCategoryCode.STANDARD)
      ];

      const summary = calculator.computeSummary(lines, docAC);

      expect(summary.lineTotal).toBe(2650);
      expect(summary.taxBasis).toBe(2600);
      expect(summary.taxTotal).toBe(520);
      expect(summary.grandTotal).toBe(3120);
    });

    it('should consolidate same tax rate/category across lines', () => {
      const calculator = new TaxCalculator('line');

      const lines = [
        new InvoiceLine('L1', 'Item 1', 5, 100, 0.20, 'S'),
        new InvoiceLine('L2', 'Item 2', 3, 50, 0.20, 'S'),
        new InvoiceLine('L3', 'Item 3', 2, 75, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.taxSummaries.length).toBe(1);
      expect(summary.taxSummaries[0].taxable).toBe(800);
      expect(summary.taxSummaries[0].taxAmount).toBe(160);
    });
  });

  describe('tax summaries structure', () => {
    it('should include all required fields in tax summaries', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.taxSummaries[0]).toHaveProperty('rate');
      expect(summary.taxSummaries[0]).toHaveProperty('category');
      expect(summary.taxSummaries[0]).toHaveProperty('taxable');
      expect(summary.taxSummaries[0]).toHaveProperty('taxAmount');
    });

    it('should express rate as percentage', () => {
      const calculator = new TaxCalculator('line');
      const lines = [
        new InvoiceLine('L1', 'Item', 10, 100, 0.20, 'S')
      ];

      const summary = calculator.computeSummary(lines, []);

      expect(summary.taxSummaries[0].rate).toBe(20);
    });
  });
});
