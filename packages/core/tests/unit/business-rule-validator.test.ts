/**
 * @file business-rule-validator.test.ts
 * @description Comprehensive unit tests for BusinessRuleValidator
 *
 * Covers all business rule categories:
 * - BR-01 to BR-16: Core presence rules
 * - BR-CO-10 to BR-CO-26: Calculation coherence rules
 * - BR-DEC-01 to BR-DEC-17: Decimal precision rules
 * - BR-S-01 to BR-S-08: VAT standard rate rules
 * - BR-FR-05 to BR-FR-13: French rules
 */

import {
  BusinessRuleValidator,
  getDefaultBusinessRuleValidator,
  validateBusinessRules,
} from '../../src/validation/BusinessRuleValidator';
import { FacturXInvoice } from '../../src/core/FacturXInvoice';
import {
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
  CurrencyCode,
  TaxCategoryCode,
  UnitCode,
} from '../../src/types';
import type {
  DocumentHeader,
  TradeParty,
  PaymentDetails,
  InvoiceLine,
  AllowanceCharge,
} from '../../src/types';

// ============================================================================
// TEST HELPERS - Invoice Factories
// ============================================================================

function createValidHeader(overrides?: Partial<DocumentHeader>): DocumentHeader {
  return {
    id: 'INV-2024-001',
    invoiceNumber: 'INV-2024-001',
    name: 'Invoice',
    invoiceDate: new Date('2024-01-15'),
    typeCode: DocTypeCode.INVOICE,
    ...overrides,
  } as DocumentHeader;
}

function createValidSeller(overrides?: Partial<TradeParty>): TradeParty {
  return {
    name: 'Seller Corp SAS',
    address: {
      street: '10 Rue de la Paix',
      city: 'Paris',
      postalCode: '75002',
      countryCode: 'FR',
    },
    vatId: 'FR12345678901',
    legalId: '123456789',
    legalIdScheme: '0002',
    electronicAddress: 'seller@example.com',
    electronicAddressScheme: 'EM',
    ...overrides,
  } as TradeParty;
}

function createValidBuyer(overrides?: Partial<TradeParty>): TradeParty {
  return {
    name: 'Buyer Ltd',
    address: {
      street: '20 Avenue des Champs',
      city: 'Lyon',
      postalCode: '69001',
      countryCode: 'FR',
    },
    vatId: 'FR98765432101',
    electronicAddress: 'buyer@example.com',
    electronicAddressScheme: 'EM',
    ...overrides,
  } as TradeParty;
}

function createValidPayment(overrides?: Partial<PaymentDetails>): PaymentDetails {
  return {
    meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
    iban: 'FR7630001007941234567890185',
    bic: 'BNPAFRPP',
    dueDate: new Date('2024-02-15'),
    termsDescription: 'Net 30 days',
    ...overrides,
  } as PaymentDetails;
}

function createValidLine(overrides?: Partial<InvoiceLine>): InvoiceLine {
  return {
    id: '1',
    description: 'Consulting Services',
    quantity: 10,
    unitPrice: 100,
    lineTotal: 1000,
    vatRate: 0.20,
    taxCategoryCode: TaxCategoryCode.STANDARD,
    unitCode: UnitCode.HOUR,
    allowances: [],
    charges: [],
    ...overrides,
  } as InvoiceLine;
}

/**
 * Creates a fully valid EN16931 invoice suitable for all rules
 */
function createFullyValidInvoice(profile: FacturxProfile = FacturxProfile.EN16931): FacturXInvoice {
  const line1 = createValidLine({ id: '1', quantity: 10, unitPrice: 100, lineTotal: 1000 });
  const line2 = createValidLine({
    id: '2',
    description: 'Support Package',
    quantity: 5,
    unitPrice: 50,
    lineTotal: 250,
  });

  return new FacturXInvoice(
    profile,
    createValidHeader(),
    createValidSeller(),
    createValidBuyer(),
    createValidPayment(),
    [line1, line2],
    [],
    CurrencyCode.EUR,
  );
}

/**
 * Creates a MINIMUM profile invoice (no lines required)
 */
function createMinimumInvoice(): FacturXInvoice {
  return new FacturXInvoice(
    FacturxProfile.MINIMUM,
    createValidHeader(),
    createValidSeller(),
    createValidBuyer(),
    createValidPayment(),
    [],
    [],
    CurrencyCode.EUR,
  );
}

/**
 * Creates a French-compliant invoice with all BR-FR fields
 */
function createFrenchInvoice(): FacturXInvoice {
  const header = createValidHeader({
    notes: [
      { content: 'Payment by bank transfer within 30 days', subjectCode: 'PMT' },
      { content: 'SEPA Credit Transfer', subjectCode: 'PMD' },
      { content: 'Contract ABC-123', subjectCode: 'AAB' },
    ],
  });

  return new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    createValidSeller({
      legalId: '123456789',
      legalIdScheme: '0002',
      electronicAddress: 'seller@example.com',
      electronicAddressScheme: 'EM',
    }),
    createValidBuyer({
      electronicAddress: 'buyer@example.com',
      electronicAddressScheme: 'EM',
    }),
    createValidPayment(),
    [createValidLine()],
    [],
    CurrencyCode.EUR,
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe('BusinessRuleValidator', () => {
  // --------------------------------------------------------------------------
  // Constructor & Configuration
  // --------------------------------------------------------------------------
  describe('Constructor & Configuration', () => {
    it('should create validator with default options', () => {
      const validator = new BusinessRuleValidator();
      expect(validator).toBeDefined();
      expect(validator.getTotalRuleCount()).toBeGreaterThan(40);
    });

    it('should expose all rule IDs', () => {
      const validator = new BusinessRuleValidator();
      const ids = validator.getAllRuleIds();
      expect(ids).toContain('BR-01');
      expect(ids).toContain('BR-16');
      expect(ids).toContain('BR-CO-13');
      expect(ids).toContain('BR-DEC-01');
      expect(ids).toContain('BR-S-01');
      expect(ids).toContain('BR-FR-05');
    });

    it('should filter out French rules when not enabled', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: false });
      const rules = validator.getRulesForProfile(FacturxProfile.EN16931);
      const frenchRules = rules.filter((r) => r.category === 'french');
      expect(frenchRules).toHaveLength(0);
    });

    it('should include French rules when enabled', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const rules = validator.getRulesForProfile(FacturxProfile.EN16931);
      const frenchRules = rules.filter((r) => r.category === 'french');
      expect(frenchRules.length).toBeGreaterThan(0);
    });

    it('should apply profile override from options', () => {
      const validator = new BusinessRuleValidator({ profile: FacturxProfile.MINIMUM });
      const invoice = createFullyValidInvoice(FacturxProfile.EN16931);
      const result = validator.validate(invoice);
      // Profile in result should reflect the override
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
    });

    it('should filter rules by profile level', () => {
      const validator = new BusinessRuleValidator();
      const minRules = validator.getRulesForProfile(FacturxProfile.MINIMUM);
      const en16931Rules = validator.getRulesForProfile(FacturxProfile.EN16931);
      // EN16931 should have more rules (includes BASIC+ rules)
      expect(en16931Rules.length).toBeGreaterThan(minRules.length);
    });
  });

  // --------------------------------------------------------------------------
  // BR-01 to BR-16: Core Presence Rules
  // --------------------------------------------------------------------------
  describe('Core Presence Rules (BR-01 to BR-16)', () => {
    it('BR-01: should pass when profile has valid guideline URN', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-01', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-02: should pass when invoice number is present', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-02', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-02: should fail when invoice number is empty', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader({ id: '', invoiceNumber: '' } as any),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-02', invoice);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('BR-03: should pass when issue date is valid', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-03', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-03: should fail when issue date is invalid', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader({ invoiceDate: new Date('invalid') } as any),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-03', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-04: should pass when type code is present', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-04', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-05: should pass when currency code is valid', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-05', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-05: should fail when currency code is too short', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
        [],
        'EU' as any, // Invalid: only 2 chars
      );
      const result = validator.validateRule('BR-05', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-06: should pass when seller name is present', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-06', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-06: should fail when seller name is empty', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ name: '' }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-06', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-07: should pass when buyer name is present', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-07', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-07: should fail when buyer name is empty', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer({ name: '   ' }),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-07', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-08: should pass when seller address is present', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-08', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-09: should pass when seller country code is valid 2-letter code', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-09', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-10: should pass when buyer address is present', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-10', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-11: should pass when buyer country code is valid', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-11', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-12: should pass when lineTotal is present in totals', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-12', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-13: should pass when taxBasis is present in totals', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-13', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-14: should pass when grandTotal is present in totals', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-14', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-15: should pass when dueAmount or grandTotal is present', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-15', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-16: should pass when invoice has at least one line (BASIC+)', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-16', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-16: should fail when invoice has no lines (BASIC+)', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.BASIC,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [],
      );
      const result = validator.validateRule('BR-16', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-16: should not apply to MINIMUM profile', () => {
      const validator = new BusinessRuleValidator();
      const rules = validator.getRulesForProfile(FacturxProfile.MINIMUM);
      const br16 = rules.find((r) => r.id === 'BR-16');
      expect(br16).toBeUndefined();
    });

    it('BR-16: should not apply to BASICWL profile', () => {
      const validator = new BusinessRuleValidator();
      const rules = validator.getRulesForProfile(FacturxProfile.BASICWL);
      const br16 = rules.find((r) => r.id === 'BR-16');
      expect(br16).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // BR-CO-10 to BR-CO-26: Calculation Coherence Rules
  // --------------------------------------------------------------------------
  describe('Calculation Coherence Rules (BR-CO)', () => {
    it('BR-CO-10: should pass when sum of line net amounts matches lineTotal', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-10', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-10: should fail when line totals do not match lineTotal', () => {
      const validator = new BusinessRuleValidator();
      // Create lines whose lineTotals differ from the computed lineTotal
      const line = createValidLine({ quantity: 10, unitPrice: 100, lineTotal: 999 });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [line],
      );
      // Force totals computation which will compute lineTotal=1000 (10*100)
      // but the line reports lineTotal=999
      // Note: The TaxCalculator uses qty*price, not line.lineTotal for summation
      // So we need to test differently - use the validator on the computed totals
      const result = validator.validateRule('BR-CO-10', invoice);
      // The rule checks sum of line.lineTotal vs totals.lineTotal
      // line.lineTotal=999 vs computed totals.lineTotal=1000 => fail
      expect(result.passed).toBe(false);
    });

    it('BR-CO-11: should pass when document allowances match allowanceTotal', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-11', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-11: should pass when no allowances exist', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-11', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-12: should pass when document charges match chargeTotal', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-12', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-13: should pass when taxBasis = lineTotal - allowanceTotal + chargeTotal', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-13', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-13: should pass with document-level allowances and charges', () => {
      const validator = new BusinessRuleValidator();
      const allowance: AllowanceCharge = {
        chargeIndicator: false,
        actualAmount: 50,
        reason: 'Discount',
        taxRate: 0.20,
        taxCategoryCode: 'S',
      };
      const charge: AllowanceCharge = {
        chargeIndicator: true,
        actualAmount: 25,
        reason: 'Shipping',
        taxRate: 0.20,
        taxCategoryCode: 'S',
      };
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
        [allowance, charge],
        CurrencyCode.EUR,
      );
      const result = validator.validateRule('BR-CO-13', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-14: should pass when taxTotal matches sum of category tax amounts', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-14', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-15: should pass when grandTotal = taxBasis + taxTotal', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-15', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-16: should pass when dueAmount = grandTotal - paidAmount', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-16', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-17: should pass when category tax = taxable * rate / 100 within tolerance', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-17', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-25: should pass when due amount > 0 and payment due date exists', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-25', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-25: should pass when due amount > 0 and payment terms exist', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment({ dueDate: undefined, termsDescription: 'Net 30 days' } as any),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-CO-25', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-25: should fail when due amount > 0 and no payment date/terms', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment({ dueDate: undefined, termsDescription: undefined } as any),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-CO-25', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-CO-26: should pass when seller has vatId', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-CO-26', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-26: should pass when seller has legalId but no vatId', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ vatId: undefined, legalId: '123456789' }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-CO-26', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-26: should pass when seller has globalId but no vatId or legalId', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ vatId: undefined, legalId: undefined, globalId: '1234567890123' }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-CO-26', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-CO-26: should fail when seller has no identifier at all', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ vatId: undefined, legalId: undefined, globalId: undefined }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-CO-26', invoice);
      expect(result.passed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // BR-DEC-01 to BR-DEC-17: Decimal Precision Rules
  // --------------------------------------------------------------------------
  describe('Decimal Precision Rules (BR-DEC)', () => {
    it('BR-DEC-01 to BR-DEC-10: should all pass for valid invoice with 2 decimal amounts', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      for (let i = 1; i <= 10; i++) {
        const id = `BR-DEC-${i.toString().padStart(2, '0')}`;
        const result = validator.validateRule(id, invoice);
        expect(result.passed).toBe(true);
      }
    });

    it('BR-DEC-11: should pass when line net amounts have max 2 decimals', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-DEC-11', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-DEC-11: should fail when line net amount has 3 decimals', () => {
      const validator = new BusinessRuleValidator();
      const line = createValidLine({ lineTotal: 100.123 });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [line],
      );
      const result = validator.validateRule('BR-DEC-11', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-DEC-14: should pass when document allowance amounts have max 2 decimals', () => {
      const validator = new BusinessRuleValidator();
      const allowance: AllowanceCharge = {
        chargeIndicator: false,
        actualAmount: 10.50,
        taxRate: 0.20,
        taxCategoryCode: 'S',
      };
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
        [allowance],
      );
      const result = validator.validateRule('BR-DEC-14', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-DEC-14: should fail when document allowance amount has 3 decimals', () => {
      const validator = new BusinessRuleValidator();
      const allowance: AllowanceCharge = {
        chargeIndicator: false,
        actualAmount: 10.505,
        taxRate: 0.20,
        taxCategoryCode: 'S',
      };
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
        [allowance],
      );
      const result = validator.validateRule('BR-DEC-14', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-DEC-15: should fail when document charge amount has 3 decimals', () => {
      const validator = new BusinessRuleValidator();
      const charge: AllowanceCharge = {
        chargeIndicator: true,
        actualAmount: 5.999,
        taxRate: 0.20,
        taxCategoryCode: 'S',
      };
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
        [charge],
      );
      const result = validator.validateRule('BR-DEC-15', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-DEC-16: should pass when unit prices have max 2 decimals', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-DEC-16', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-DEC-16: should fail when unit price has 3 decimals', () => {
      const validator = new BusinessRuleValidator();
      const line = createValidLine({ unitPrice: 99.999 });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [line],
      );
      const result = validator.validateRule('BR-DEC-16', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-DEC-17: should warn when quantity has more than 2 decimals', () => {
      const validator = new BusinessRuleValidator();
      const line = createValidLine({ quantity: 1.555 });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [line],
      );
      const result = validator.validateRule('BR-DEC-17', invoice);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('warning');
    });
  });

  // --------------------------------------------------------------------------
  // BR-S-01, BR-S-05, BR-S-08: VAT Standard Rate Rules
  // --------------------------------------------------------------------------
  describe('VAT Standard Rate Rules (BR-S)', () => {
    it('BR-S-01: should pass when S-category has positive taxable amount', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-S-01', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-S-05: should pass when S-category has positive rate', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-S-05', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-S-08: should pass when taxable amount matches line summation for S rate', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-S-08', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-S-08: should pass with no tax summaries', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createMinimumInvoice();
      const result = validator.validateRule('BR-S-08', invoice);
      expect(result.passed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // BR-FR-05, BR-FR-10, BR-FR-12, BR-FR-13: French Rules
  // --------------------------------------------------------------------------
  describe('French Rules (BR-FR)', () => {
    it('BR-FR-05: should pass when all required note subject codes are present', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = createFrenchInvoice();
      const result = validator.validateRule('BR-FR-05', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-FR-05: should fail when PMT note is missing', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const header = createValidHeader({
        notes: [
          { content: 'SEPA', subjectCode: 'PMD' },
          { content: 'Contract', subjectCode: 'AAB' },
          // Missing PMT
        ],
      });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-05', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-FR-05: should fail when notes are plain strings without subject codes', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const header = createValidHeader({
        notes: ['Some note', 'Another note'],
      });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-05', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-FR-05: should fail when notes array is empty', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const header = createValidHeader({ notes: [] });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-05', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-FR-10: should pass when seller SIREN is 9 digits with scheme 0002', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ legalId: '123456789', legalIdScheme: '0002' }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-10', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-FR-10: should fail when SIREN is not 9 digits', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ legalId: '12345678', legalIdScheme: '0002' }), // 8 digits
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-10', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-FR-10: should fail when SIREN contains non-digits', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ legalId: '12345678A', legalIdScheme: '0002' }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-10', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-FR-10: should fail when seller has no legalId', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ legalId: undefined }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-10', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-FR-12: should pass when buyer electronic address is present', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer({ electronicAddress: 'buyer@example.com' }),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-12', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-FR-12: should fail when buyer electronic address is missing', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer({ electronicAddress: undefined }),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-12', invoice);
      expect(result.passed).toBe(false);
    });

    it('BR-FR-13: should pass when seller electronic address is present', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ electronicAddress: 'seller@example.com' }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-13', invoice);
      expect(result.passed).toBe(true);
    });

    it('BR-FR-13: should fail when seller electronic address is missing', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ electronicAddress: undefined }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-FR-13', invoice);
      expect(result.passed).toBe(false);
    });

    it('French rules should not be included when enableFrenchRules is false', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: false });
      const invoice = createFullyValidInvoice();
      const result = validator.validate(invoice);
      const frenchResults = result.results.filter((r) => r.ruleId.startsWith('BR-FR'));
      expect(frenchResults).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Full Validation Integration
  // --------------------------------------------------------------------------
  describe('Full Validation (validate method)', () => {
    it('should return valid result for a fully compliant EN16931 invoice', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validate(invoice);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBe(100);
      expect(result.profile).toBe(FacturxProfile.EN16931);
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should return valid result for MINIMUM profile invoice', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createMinimumInvoice();
      const result = validator.validate(invoice);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
    });

    it('should return errors array with failed error-severity rules', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader({ id: '' } as any),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validate(invoice);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.ruleId === 'BR-02')).toBe(true);
    });

    it('should return warnings array with failed warning-severity rules', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment({ dueDate: undefined, termsDescription: undefined } as any),
        [createValidLine()],
      );
      const result = validator.validate(invoice);

      const co25Warning = result.warnings.find((w) => w.ruleId === 'BR-CO-25');
      expect(co25Warning).toBeDefined();
      expect(co25Warning?.severity).toBe('warning');
    });

    it('should calculate correct compliance score', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validate(invoice);

      // All rules pass = 100%
      expect(result.score).toBe(100);
    });

    it('should calculate partial compliance score when some rules fail', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader({ id: '' } as any),
        createValidSeller({ name: '' }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validate(invoice);

      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should freeze result arrays', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validate(invoice);

      expect(Object.isFrozen(result.results)).toBe(true);
      expect(Object.isFrozen(result.errors)).toBe(true);
      expect(Object.isFrozen(result.warnings)).toBe(true);
    });

    it('should include profile in result', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice(FacturxProfile.EXTENDED);
      const result = validator.validate(invoice);

      expect(result.profile).toBe(FacturxProfile.EXTENDED);
    });

    it('should run fewer rules for MINIMUM than EN16931', () => {
      const validator = new BusinessRuleValidator();
      const minInvoice = createMinimumInvoice();
      const en16931Invoice = createFullyValidInvoice();

      const minResult = validator.validate(minInvoice);
      const en16931Result = validator.validate(en16931Invoice);

      expect(minResult.results.length).toBeLessThan(en16931Result.results.length);
    });

    it('should validate French invoice with all rules when enableFrenchRules is true', () => {
      const validator = new BusinessRuleValidator({ enableFrenchRules: true });
      const invoice = createFrenchInvoice();
      const result = validator.validate(invoice);

      const frenchResults = result.results.filter((r) => r.ruleId.startsWith('BR-FR'));
      expect(frenchResults.length).toBe(4);
      expect(frenchResults.every((r) => r.passed)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // validateRule method
  // --------------------------------------------------------------------------
  describe('validateRule method', () => {
    it('should return correct result for a specific rule', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();
      const result = validator.validateRule('BR-02', invoice);

      expect(result.ruleId).toBe('BR-02');
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('error');
      expect(result.message).toBeTruthy();
    });

    it('should throw for unknown rule ID', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();

      expect(() => validator.validateRule('BR-UNKNOWN', invoice)).toThrow('Unknown business rule');
    });

    it('should return failure message when rule fails', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader({ id: '' } as any),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-02', invoice);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('FAILED');
    });
  });

  // --------------------------------------------------------------------------
  // Singleton & Convenience Functions
  // --------------------------------------------------------------------------
  describe('Singleton & Convenience Functions', () => {
    it('getDefaultBusinessRuleValidator should return same instance', () => {
      const v1 = getDefaultBusinessRuleValidator();
      const v2 = getDefaultBusinessRuleValidator();
      expect(v1).toBe(v2);
    });

    it('validateBusinessRules convenience function should work', () => {
      const invoice = createFullyValidInvoice();
      const result = validateBusinessRules(invoice);

      expect(result.isValid).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle invoice with zero-value lines gracefully', () => {
      const validator = new BusinessRuleValidator();
      const line = createValidLine({ quantity: 0, unitPrice: 0, lineTotal: 0 });
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [line],
      );
      // Should not throw
      const result = validator.validate(invoice);
      expect(result).toBeDefined();
    });

    it('should handle invoice with many lines', () => {
      const validator = new BusinessRuleValidator();
      const lines: InvoiceLine[] = [];
      for (let i = 1; i <= 100; i++) {
        lines.push(createValidLine({
          id: String(i),
          description: `Line ${i}`,
          quantity: 1,
          unitPrice: 10,
          lineTotal: 10,
        }));
      }
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        lines,
      );
      const result = validator.validate(invoice);
      expect(result).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should handle whitespace-only seller name as empty', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller({ name: '   ' }),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
      );
      const result = validator.validateRule('BR-06', invoice);
      expect(result.passed).toBe(false);
    });

    it('should handle missing docAllowancesCharges gracefully', () => {
      const validator = new BusinessRuleValidator();
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        [createValidLine()],
        undefined as any,
      );
      // BR-DEC-14, BR-DEC-15, BR-CO-11, BR-CO-12 should not crash
      const result = validator.validate(invoice);
      expect(result).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Performance
  // --------------------------------------------------------------------------
  describe('Performance', () => {
    it('should validate 100 invoices in under 2 seconds', () => {
      const validator = new BusinessRuleValidator();
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        const invoice = createFullyValidInvoice();
        validator.validate(invoice);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    it('should validate a single invoice in under 50ms', () => {
      const validator = new BusinessRuleValidator();
      const invoice = createFullyValidInvoice();

      const start = Date.now();
      validator.validate(invoice);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should validate invoice with 500 lines in under 500ms', () => {
      const validator = new BusinessRuleValidator();
      const lines: InvoiceLine[] = [];
      for (let i = 1; i <= 500; i++) {
        lines.push(createValidLine({
          id: String(i),
          quantity: 1,
          unitPrice: 10,
          lineTotal: 10,
        }));
      }
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        createValidHeader(),
        createValidSeller(),
        createValidBuyer(),
        createValidPayment(),
        lines,
      );

      const start = Date.now();
      validator.validate(invoice);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });
});
