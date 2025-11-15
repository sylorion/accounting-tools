/**
 * @file profile-validator.test.ts
 * @description Comprehensive unit tests for ProfileValidator (~40 tests)
 */

import {
  ProfileValidator,
  getDefaultProfileValidator,
  validateProfile,
} from '../../src/validation/ProfileValidator';
import { FacturxProfile, DocTypeCode, PaymentMeansCode } from '../../src/types';

describe('ProfileValidator', () => {
  describe('Constructor', () => {
    it('should create validator with all profile rules', () => {
      const validator = new ProfileValidator();
      expect(validator).toBeDefined();
      expect(validator.getAvailableProfiles()).toHaveLength(5);
    });

    it('should have rules for all 5 profiles', () => {
      const validator = new ProfileValidator();
      const profiles = validator.getAvailableProfiles();

      expect(profiles).toContain(FacturxProfile.MINIMUM);
      expect(profiles).toContain(FacturxProfile.BASICWL);
      expect(profiles).toContain(FacturxProfile.BASIC);
      expect(profiles).toContain(FacturxProfile.EN16931);
      expect(profiles).toContain(FacturxProfile.EXTENDED);
    });

    it('should have different rule counts per profile', () => {
      const validator = new ProfileValidator();

      expect(validator.getRuleCount(FacturxProfile.MINIMUM)).toBe(5);
      expect(validator.getRuleCount(FacturxProfile.BASICWL)).toBe(8); // MINIMUM + 3
      expect(validator.getRuleCount(FacturxProfile.BASIC)).toBe(5);
      expect(validator.getRuleCount(FacturxProfile.EN16931)).toBe(17);
      expect(validator.getRuleCount(FacturxProfile.EXTENDED)).toBe(18); // EN16931 + 1
    });
  });

  describe('MINIMUM Profile Validation', () => {
    it('should validate complete MINIMUM invoice', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      // Debug: log errors if validation fails
      if (!result.isValid) {
        console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
      }

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
      expect(result.checkedRules).toBe(5);
    });

    it('should fail if invoice number is missing', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();
      delete invoice.header.id;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'invoice_number')).toBe(true);
    });

    it('should fail if invoice date is missing', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();
      delete invoice.header.invoiceDate;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'invoice_date')).toBe(true);
    });

    it('should fail if seller name is missing', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();
      delete invoice.seller.name;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'seller_name')).toBe(true);
    });

    it('should fail if buyer name is missing', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();
      delete invoice.buyer.name;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'buyer_name')).toBe(true);
    });

    it('should fail if seller name is empty string', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();
      invoice.seller.name = '';

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'seller_name')).toBe(true);
    });
  });

  describe('BASICWL Profile Validation', () => {
    it('should validate complete BASICWL invoice', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicWLInvoice();

      const result = validator.validate(invoice, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.checkedRules).toBe(8);
    });

    it('should fail if payment means is missing', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicWLInvoice();
      delete invoice.payment.meansCode;

      const result = validator.validate(invoice, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'payment_means')).toBe(true);
    });

    it('should fail if lines are present', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicWLInvoice();
      invoice.lines = [{ id: '1', quantity: 1, unitPrice: 100, vatRate: 0.20 }];

      const result = validator.validate(invoice, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'no_lines')).toBe(true);
      expect(result.errors.some(e => e.message.includes('does not support line items'))).toBe(true);
    });

    it('should pass if lines array is empty', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicWLInvoice();
      invoice.lines = [];

      const result = validator.validate(invoice, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(true);
    });

    it('should pass if lines property is missing', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicWLInvoice();
      delete invoice.lines;

      const result = validator.validate(invoice, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(true);
    });
  });

  describe('BASIC Profile Validation', () => {
    it('should validate complete BASIC invoice', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicInvoice();

      const result = validator.validate(invoice, FacturxProfile.BASIC);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.checkedRules).toBe(5);
    });

    it('should fail if lines are missing', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicInvoice();
      delete invoice.lines;

      const result = validator.validate(invoice, FacturxProfile.BASIC);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'lines_required')).toBe(true);
      expect(result.errors.some(e => e.message.includes('at least one line item'))).toBe(true);
    });

    it('should fail if lines array is empty', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicInvoice();
      invoice.lines = [];

      const result = validator.validate(invoice, FacturxProfile.BASIC);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'lines_required')).toBe(true);
    });

    it('should pass with multiple lines', () => {
      const validator = new ProfileValidator();
      const invoice = createBasicInvoice();
      invoice.lines.push({ id: '2', quantity: 5, unitPrice: 50, vatRate: 0.20 });

      const result = validator.validate(invoice, FacturxProfile.BASIC);

      expect(result.isValid).toBe(true);
    });
  });

  describe('EN16931 Profile Validation', () => {
    it('should validate complete EN16931 invoice', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.checkedRules).toBe(17);
    });

    it('should fail if invoice type code is missing (BT-3)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      delete invoice.header.typeCode;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'invoice_type')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BT-3'))).toBe(true);
    });

    it('should fail if seller address is missing (BG-5)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      delete invoice.seller.address;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'seller_address')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BG-5'))).toBe(true);
    });

    it('should fail if seller country code is missing (BT-40)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      delete invoice.seller.address.countryCode;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'seller_country')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BT-40'))).toBe(true);
    });

    it('should fail if buyer address is missing (BG-8)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      delete invoice.buyer.address;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'buyer_address')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BG-8'))).toBe(true);
    });

    it('should fail if buyer country code is missing (BT-55)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      delete invoice.buyer.address.countryCode;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'buyer_country')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BT-55'))).toBe(true);
    });

    it('should fail if line ID is missing (BT-126)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      invoice.lines[0].id = '';

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'line_id')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BT-126'))).toBe(true);
    });

    it('should fail if line quantity is zero or negative (BT-129)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      invoice.lines[0].quantity = 0;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'line_quantity')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BT-129'))).toBe(true);
    });

    it('should fail if line price is negative (BT-146)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      invoice.lines[0].unitPrice = -10;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'line_price')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BT-146'))).toBe(true);
    });

    it('should fail if VAT rate is missing (BT-119)', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      delete invoice.lines[0].vatRate;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'vat_rate')).toBe(true);
      expect(result.errors.some(e => e.message.includes('BT-119'))).toBe(true);
    });

    it('should validate multiple lines correctly', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      invoice.lines.push({
        id: '2',
        quantity: 5,
        unitPrice: 50,
        vatRate: 0.10,
      });

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(true);
    });

    it('should fail if any line in array is invalid', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      invoice.lines.push({
        id: '2',
        quantity: -1, // Invalid
        unitPrice: 50,
        vatRate: 0.10,
      });

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'line_quantity')).toBe(true);
    });
  });

  describe('EXTENDED Profile Validation', () => {
    it('should validate complete EXTENDED invoice', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice(); // EXTENDED extends EN16931

      const result = validator.validate(invoice, FacturxProfile.EXTENDED);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.checkedRules).toBe(18); // EN16931 + 1
    });

    it('should inherit all EN16931 rules', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();
      delete invoice.header.typeCode;

      const result = validator.validate(invoice, FacturxProfile.EXTENDED);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'invoice_type')).toBe(true);
    });
  });

  describe('Policy Validation', () => {
    it('should check mandatory fields from policy', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();

      // Policy validation is integrated in validate()
      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(true);
    });

    it('should report missing mandatory fields', () => {
      const validator = new ProfileValidator();
      const invoice = { header: {}, seller: {}, buyer: {}, payment: {} };

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation rule exceptions', () => {
      const validator = new ProfileValidator();
      const invoice = null; // Will cause exceptions in checks

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include rule name in error', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();
      delete invoice.header.id;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      const error = result.errors.find(e => e.field === 'invoice_number');
      expect(error).toBeDefined();
      expect(error?.rule).toBe('invoice_number');
    });

    it('should include message in error', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();
      delete invoice.seller.name;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      const error = result.errors.find(e => e.field === 'seller_name');
      expect(error).toBeDefined();
      expect(error?.message).toContain('Seller name is required');
    });

    it('should set severity to error for errors', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();
      delete invoice.buyer.name;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      const error = result.errors.find(e => e.field === 'buyer_name');
      expect(error?.severity).toBe('error');
    });
  });

  describe('Result Structure', () => {
    it('should freeze errors array', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(Object.isFrozen(result.errors)).toBe(true);
    });

    it('should freeze warnings array', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(Object.isFrozen(result.warnings)).toBe(true);
    });

    it('should include profile in result', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.profile).toBe(FacturxProfile.EN16931);
    });

    it('should include checked rules count', () => {
      const validator = new ProfileValidator();
      const invoice = createMinimalInvoice();

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.checkedRules).toBe(5);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getDefaultProfileValidator', () => {
      const validator1 = getDefaultProfileValidator();
      const validator2 = getDefaultProfileValidator();

      expect(validator1).toBe(validator2);
    });

    it('should work with validateProfile convenience function', () => {
      const invoice = createMinimalInvoice();

      const result = validateProfile(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(true);
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
    });
  });

  describe('Helper Methods', () => {
    it('should return available profiles', () => {
      const validator = new ProfileValidator();
      const profiles = validator.getAvailableProfiles();

      expect(profiles).toHaveLength(5);
      expect(profiles).toEqual(expect.arrayContaining([
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.BASIC,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED,
      ]));
    });

    it('should return rule count for each profile', () => {
      const validator = new ProfileValidator();

      expect(validator.getRuleCount(FacturxProfile.MINIMUM)).toBeGreaterThan(0);
      expect(validator.getRuleCount(FacturxProfile.EN16931)).toBeGreaterThan(
        validator.getRuleCount(FacturxProfile.MINIMUM)
      );
    });
  });

  describe('Performance', () => {
    it('should validate 100 invoices quickly', () => {
      const validator = new ProfileValidator();
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        const invoice = createMinimalInvoice();
        validator.validate(invoice, FacturxProfile.MINIMUM);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should validate complex EN16931 invoice quickly', () => {
      const validator = new ProfileValidator();
      const invoice = createEN16931Invoice();

      // Add 100 lines
      for (let i = 2; i <= 100; i++) {
        invoice.lines.push({
          id: `${i}`,
          quantity: 10,
          unitPrice: 100,
          vatRate: 0.20,
        });
      }

      const start = Date.now();
      const result = validator.validate(invoice, FacturxProfile.EN16931);
      const duration = Date.now() - start;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMinimalInvoice(): any {
  return {
    header: {
      id: 'INV-001',
      invoiceNumber: 'INV-001',
      invoiceDate: new Date('2023-11-15'),
      typeCode: DocTypeCode.INVOICE,
    },
    seller: {
      name: 'Test Seller Inc.',
    },
    buyer: {
      name: 'Test Buyer Ltd.',
    },
    payment: {},
    totals: {
      grandTotal: 1000,
    },
    currency: 'EUR',
  };
}

function createBasicWLInvoice(): any {
  return {
    header: {
      id: 'INV-001',
      invoiceNumber: 'INV-001',
      invoiceDate: new Date('2023-11-15'),
    },
    seller: {
      name: 'Test Seller Inc.',
    },
    buyer: {
      name: 'Test Buyer Ltd.',
    },
    payment: {
      meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
    },
    currency: 'EUR',
  };
}

function createBasicInvoice(): any {
  return {
    header: {
      id: 'INV-001',
      invoiceNumber: 'INV-001',
      invoiceDate: new Date('2023-11-15'),
    },
    seller: {
      name: 'Test Seller Inc.',
    },
    buyer: {
      name: 'Test Buyer Ltd.',
    },
    payment: {},
    lines: [
      {
        id: '1',
        quantity: 10,
        unitPrice: 100,
        vatRate: 0.20,
      },
    ],
    currency: 'EUR',
  };
}

function createEN16931Invoice(): any {
  return {
    header: {
      id: 'INV-001',
      invoiceNumber: 'INV-001',
      invoiceDate: new Date('2023-11-15'),
      typeCode: DocTypeCode.INVOICE,
    },
    seller: {
      name: 'Test Seller Inc.',
      address: {
        city: 'Paris',
        postalCode: '75001',
        countryCode: 'FR',
      },
    },
    buyer: {
      name: 'Test Buyer Ltd.',
      address: {
        city: 'Lyon',
        postalCode: '69001',
        countryCode: 'FR',
      },
    },
    payment: {
      meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
    },
    lines: [
      {
        id: '1',
        quantity: 10,
        unitPrice: 100,
        vatRate: 0.20,
      },
    ],
    currency: 'EUR',
  };
}
