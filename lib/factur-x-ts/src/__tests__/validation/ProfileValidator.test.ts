import {
  ProfileValidator,
  getDefaultProfileValidator,
  validateProfile,
} from '../../validation/ProfileValidator';
import { FacturxProfile, DocTypeCode, PaymentMeansCode } from '../../types';
import { PostalAddressImpl, InvoiceLine } from '../../core/entities';

describe('ProfileValidator', () => {
  let validator: ProfileValidator;

  beforeEach(() => {
    validator = new ProfileValidator();
  });

  describe('constructor', () => {
    it('should initialize with all profiles', () => {
      expect(validator).toBeDefined();
      const profiles = validator.getAvailableProfiles();
      expect(profiles).toContain(FacturxProfile.MINIMUM);
      expect(profiles).toContain(FacturxProfile.BASICWL);
      expect(profiles).toContain(FacturxProfile.BASIC);
      expect(profiles).toContain(FacturxProfile.EN16931);
      expect(profiles).toContain(FacturxProfile.EXTENDED);
    });
  });

  describe('validate - MINIMUM profile', () => {
    const createMinimalInvoice = () => ({
      header: {
        id: 'INV-001',
        invoiceDate: new Date('2025-01-15'),
        typeCode: DocTypeCode.INVOICE,
      },
      seller: {
        name: 'ACME Corp',
        address: new PostalAddressImpl('Paris', '75001', 'FR'),
      },
      buyer: {
        name: 'Client Ltd',
        address: new PostalAddressImpl('London', 'SW1A 1AA', 'GB'),
      },
      payment: {
        meansCode: PaymentMeansCode.CASH,
      },
      currency: 'EUR',
      totals: {
        grandTotal: 100,
      },
    });

    it('should pass with minimal valid data', () => {
      const invoice = createMinimalInvoice();
      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.profile).toBe(FacturxProfile.MINIMUM);
    });

    it('should fail if invoice number is missing', () => {
      const invoice = createMinimalInvoice();
      invoice.header.id = '';

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'invoice_number')).toBe(true);
    });

    it('should fail if invoice date is not a Date', () => {
      const invoice = createMinimalInvoice();
      invoice.header.invoiceDate = 'invalid' as any;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'invoice_date')).toBe(true);
    });

    it('should fail if seller name is missing', () => {
      const invoice = createMinimalInvoice();
      invoice.seller.name = '';

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'seller_name')).toBe(true);
    });

    it('should fail if buyer name is missing', () => {
      const invoice = createMinimalInvoice();
      invoice.buyer.name = '';

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'buyer_name')).toBe(true);
    });

    it('should check mandatory fields from policy', () => {
      const invoice = createMinimalInvoice();
      delete (invoice as any).totals;

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'mandatory_field' && e.field === 'totals.grandTotal')).toBe(true);
    });

    it('should reject forbidden fields', () => {
      const invoice: any = createMinimalInvoice();
      invoice.lines = [new InvoiceLine('L1', 'Product A', 1, 100, 0.20)];
      invoice.payment.iban = 'FR12345';

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'forbidden_field' && e.field === 'lines')).toBe(true);
    });
  });

  describe('validate - BASICWL profile', () => {
    const createBasicWLInvoice = () => ({
      header: {
        id: 'INV-001',
        invoiceDate: new Date('2025-01-15'),
        typeCode: DocTypeCode.INVOICE,
      },
      seller: {
        name: 'ACME Corp',
        address: new PostalAddressImpl('Paris', '75001', 'FR'),
      },
      buyer: {
        name: 'Client Ltd',
        address: new PostalAddressImpl('London', 'SW1A 1AA', 'GB'),
      },
      payment: {
        meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
      },
      totals: {
        grandTotal: 100,
        taxTotal: 20,
      },
    });

    it('should pass with valid BASICWL data', () => {
      const invoice = createBasicWLInvoice();
      const result = validator.validate(invoice, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should require payment means code', () => {
      const invoice: any = createBasicWLInvoice();
      delete invoice.payment.meansCode;

      const result = validator.validate(invoice, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'payment_means')).toBe(true);
    });

    it('should not allow line items', () => {
      const invoice: any = createBasicWLInvoice();
      invoice.lines = [{ id: 'L1', description: 'Product', quantity: 1 }];

      const result = validator.validate(invoice, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'no_lines')).toBe(true);
    });
  });

  describe('validate - BASIC profile', () => {
    const createBasicInvoice = () => ({
      header: {
        id: 'INV-001',
        invoiceDate: new Date('2025-01-15'),
        typeCode: DocTypeCode.INVOICE,
      },
      seller: {
        name: 'ACME Corp',
        address: new PostalAddressImpl('Paris', '75001', 'FR'),
      },
      buyer: {
        name: 'Client Ltd',
        address: new PostalAddressImpl('London', 'SW1A 1AA', 'GB'),
      },
      payment: {
        meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
      },
      lines: [
        {
          id: 'L1',
          description: 'Product A',
          quantity: 1,
          unitPrice: 100,
          vatRate: 0.20,
        },
      ],
      totals: {
        grandTotal: 120,
        taxTotal: 20,
      },
    });

    it('should pass with valid BASIC data', () => {
      const invoice = createBasicInvoice();
      const result = validator.validate(invoice, FacturxProfile.BASIC);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should require at least one line item', () => {
      const invoice = createBasicInvoice();
      invoice.lines = [];

      const result = validator.validate(invoice, FacturxProfile.BASIC);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'lines_required')).toBe(true);
    });
  });

  describe('validate - EN16931 profile', () => {
    const createEN16931Invoice = () => ({
      header: {
        id: 'INV-001',
        invoiceDate: new Date('2025-01-15'),
        typeCode: DocTypeCode.INVOICE,
      },
      seller: {
        name: 'ACME Corp',
        address: {
          city: 'Paris',
          postalCode: '75001',
          countryCode: 'FR',
        },
      },
      buyer: {
        name: 'Client Ltd',
        address: {
          city: 'London',
          postalCode: 'SW1A 1AA',
          countryCode: 'GB',
        },
      },
      payment: {
        meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
      },
      lines: [
        {
          id: 'L1',
          description: 'Product A',
          quantity: 1,
          unitPrice: 100,
          vatRate: 0.20,
        },
      ],
      totals: {
        lineTotal: 100,
        taxBasis: 100,
        taxTotal: 20,
        grandTotal: 120,
      },
    });

    it('should pass with valid EN16931 data', () => {
      const invoice = createEN16931Invoice();
      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should require invoice type code', () => {
      const invoice: any = createEN16931Invoice();
      delete invoice.header.typeCode;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'invoice_type')).toBe(true);
    });

    it('should require seller address', () => {
      const invoice: any = createEN16931Invoice();
      delete invoice.seller.address;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'seller_address')).toBe(true);
    });

    it('should require seller country code', () => {
      const invoice = createEN16931Invoice();
      invoice.seller.address.countryCode = '';

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'seller_country')).toBe(true);
    });

    it('should require buyer address', () => {
      const invoice: any = createEN16931Invoice();
      delete invoice.buyer.address;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'buyer_address')).toBe(true);
    });

    it('should require buyer country code', () => {
      const invoice = createEN16931Invoice();
      invoice.buyer.address.countryCode = 'X'; // Invalid length

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'buyer_country')).toBe(true);
    });

    it('should require line items', () => {
      const invoice = createEN16931Invoice();
      invoice.lines = [];

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'line_items')).toBe(true);
    });

    it('should require line ID for each line', () => {
      const invoice = createEN16931Invoice();
      invoice.lines[0].id = '';

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'line_id')).toBe(true);
    });

    it('should require line quantity > 0', () => {
      const invoice: any = createEN16931Invoice();
      invoice.lines[0].quantity = 0;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'line_quantity')).toBe(true);
    });

    it('should require non-negative line price', () => {
      const invoice: any = createEN16931Invoice();
      invoice.lines[0].unitPrice = -10;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'line_price')).toBe(true);
    });

    it('should require VAT rate for each line', () => {
      const invoice: any = createEN16931Invoice();
      delete invoice.lines[0].vatRate;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'vat_rate')).toBe(true);
    });

    it('should check policy mandatory fields', () => {
      const invoice: any = createEN16931Invoice();
      delete invoice.payment.meansCode;

      const result = validator.validate(invoice, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'payment_means' || e.field === 'payment.meansCode')).toBe(true);
    });
  });

  describe('validate - EXTENDED profile', () => {
    it('should pass with EN16931 valid data', () => {
      const invoice = {
        header: {
          id: 'INV-001',
          invoiceDate: new Date('2025-01-15'),
          typeCode: DocTypeCode.INVOICE,
        },
        seller: {
          name: 'ACME Corp',
          address: {
            city: 'Paris',
            postalCode: '75001',
            countryCode: 'FR',
          },
        },
        buyer: {
          name: 'Client Ltd',
          address: {
            city: 'London',
            postalCode: 'SW1A 1AA',
            countryCode: 'GB',
          },
        },
        payment: {
          meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
        },
        lines: [
          {
            id: 'L1',
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            vatRate: 0.20,
          },
        ],
        totals: {
          lineTotal: 100,
          taxBasis: 100,
          taxTotal: 20,
          grandTotal: 120,
        },
      };

      const result = validator.validate(invoice, FacturxProfile.EXTENDED);

      expect(result.isValid).toBe(true);
    });

    it('should allow extended fields', () => {
      const invoice: any = {
        header: {
          id: 'INV-001',
          invoiceDate: new Date('2025-01-15'),
          typeCode: DocTypeCode.INVOICE,
        },
        seller: {
          name: 'ACME Corp',
          address: {
            city: 'Paris',
            postalCode: '75001',
            countryCode: 'FR',
          },
        },
        buyer: {
          name: 'Client Ltd',
          address: {
            city: 'London',
            postalCode: 'SW1A 1AA',
            countryCode: 'GB',
          },
        },
        payment: {
          meansCode: PaymentMeansCode.SEPA_CREDIT_TRANSFER,
        },
        lines: [
          {
            id: 'L1',
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            vatRate: 0.20,
          },
        ],
        totals: {
          lineTotal: 100,
          taxBasis: 100,
          taxTotal: 20,
          grandTotal: 120,
        },
        customField: 'Some custom data',
      };

      const result = validator.validate(invoice, FacturxProfile.EXTENDED);

      expect(result.isValid).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle validation rule exceptions', () => {
      const invoice = null;
      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should freeze result arrays', () => {
      const invoice = {
        header: { id: 'INV-001', invoiceDate: new Date() },
        seller: { name: 'ACME' },
        buyer: { name: 'Client' },
        payment: { meansCode: PaymentMeansCode.CASH },
        totals: { grandTotal: 100 },
      };

      const result = validator.validate(invoice, FacturxProfile.MINIMUM);

      expect(Object.isFrozen(result.errors)).toBe(true);
      expect(Object.isFrozen(result.warnings)).toBe(true);
    });
  });

  describe('getAvailableProfiles', () => {
    it('should return all 5 profiles', () => {
      const profiles = validator.getAvailableProfiles();

      expect(profiles.length).toBe(5);
      expect(profiles).toContain(FacturxProfile.MINIMUM);
      expect(profiles).toContain(FacturxProfile.BASICWL);
      expect(profiles).toContain(FacturxProfile.BASIC);
      expect(profiles).toContain(FacturxProfile.EN16931);
      expect(profiles).toContain(FacturxProfile.EXTENDED);
    });
  });

  describe('getRuleCount', () => {
    it('should return correct rule count for MINIMUM', () => {
      const count = validator.getRuleCount(FacturxProfile.MINIMUM);
      expect(count).toBe(5); // 5 rules for MINIMUM
    });

    it('should return correct rule count for BASICWL', () => {
      const count = validator.getRuleCount(FacturxProfile.BASICWL);
      expect(count).toBe(8); // 5 from MINIMUM + 3 new
    });

    it('should return correct rule count for BASIC', () => {
      const count = validator.getRuleCount(FacturxProfile.BASIC);
      expect(count).toBe(5); // 5 new rules
    });

    it('should return correct rule count for EN16931', () => {
      const count = validator.getRuleCount(FacturxProfile.EN16931);
      expect(count).toBeGreaterThan(15); // Many rules
    });

    it('should return correct rule count for EXTENDED', () => {
      const count = validator.getRuleCount(FacturxProfile.EXTENDED);
      expect(count).toBeGreaterThan(15); // EN16931 + 1
    });
  });

  describe('getDefaultProfileValidator', () => {
    it('should return singleton instance', () => {
      const v1 = getDefaultProfileValidator();
      const v2 = getDefaultProfileValidator();

      expect(v1).toBe(v2);
    });

    it('should return a working validator', () => {
      const validator = getDefaultProfileValidator();
      expect(validator).toBeInstanceOf(ProfileValidator);
    });
  });

  describe('validateProfile convenience function', () => {
    it('should validate using default validator', () => {
      const invoice = {
        header: { id: 'INV-001', invoiceDate: new Date(), typeCode: DocTypeCode.INVOICE },
        seller: {
          name: 'ACME',
          address: new PostalAddressImpl('Paris', '75001', 'FR'),
        },
        buyer: {
          name: 'Client',
          address: new PostalAddressImpl('London', 'SW1A 1AA', 'GB'),
        },
        payment: { meansCode: PaymentMeansCode.CASH },
        currency: 'EUR',
        totals: { grandTotal: 100 },
      };

      const result = validateProfile(invoice, FacturxProfile.MINIMUM);

      if (!result.isValid) {
        console.log('Validation errors:', result.errors);
      }

      expect(result.isValid).toBe(true);
    });
  });
});
