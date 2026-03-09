/**
 * @file entities.test.ts
 * @description Comprehensive unit tests for entity classes and builders (~50 tests)
 */

import {
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  AllowanceCharge,
  InvoiceLine,
} from '../../src/core/entities';
import { DocTypeCode, PaymentMeansCode } from '../../src/types';

describe('PostalAddressImpl', () => {
  describe('Constructor', () => {
    it('should create address with required fields', () => {
      const address = new PostalAddressImpl('Paris', '75001', 'FR');

      expect(address.city).toBe('Paris');
      expect(address.postalCode).toBe('75001');
      expect(address.countryCode).toBe('FR');
    });

    it('should create address with all fields', () => {
      const address = new PostalAddressImpl(
        'Paris',
        '75001',
        'FR',
        '123 Rue de la Paix',
        'Building A',
        'Floor 3',
        'Ile-de-France'
      );

      expect(address.street).toBe('123 Rue de la Paix');
      expect(address.additionalStreet).toBe('Building A');
      expect(address.additionalStreet2).toBe('Floor 3');
      expect(address.subdivision).toBe('Ile-de-France');
    });

    it('should throw error if city is missing', () => {
      expect(() => new PostalAddressImpl('', '75001', 'FR')).toThrow(
        'City, postal code, and country code are required'
      );
    });

    it('should throw error if postal code is missing', () => {
      expect(() => new PostalAddressImpl('Paris', '', 'FR')).toThrow(
        'City, postal code, and country code are required'
      );
    });

    it('should throw error if country code is missing', () => {
      expect(() => new PostalAddressImpl('Paris', '75001', '')).toThrow(
        'City, postal code, and country code are required'
      );
    });

    it('should be frozen (immutable)', () => {
      const address = new PostalAddressImpl('Paris', '75001', 'FR');

      expect(Object.isFrozen(address)).toBe(true);
    });
  });

  describe('Builder', () => {
    it('should build address with required fields', () => {
      const address = PostalAddressImpl.builder()
        .city('Lyon')
        .postalCode('69001')
        .countryCode('FR')
        .build();

      expect(address.city).toBe('Lyon');
      expect(address.postalCode).toBe('69001');
      expect(address.countryCode).toBe('FR');
    });

    it('should build address with all fields', () => {
      const address = PostalAddressImpl.builder()
        .city('Lyon')
        .postalCode('69001')
        .countryCode('FR')
        .street('45 Avenue Client')
        .additionalStreet('Suite 200')
        .additionalStreet2('Office 5')
        .subdivision('Auvergne-Rhône-Alpes')
        .build();

      expect(address.street).toBe('45 Avenue Client');
      expect(address.additionalStreet).toBe('Suite 200');
      expect(address.additionalStreet2).toBe('Office 5');
      expect(address.subdivision).toBe('Auvergne-Rhône-Alpes');
    });

    it('should throw error if city not set', () => {
      const builder = PostalAddressImpl.builder()
        .postalCode('69001')
        .countryCode('FR');

      expect(() => builder.build()).toThrow(
        'City, postal code, and country code are required'
      );
    });

    it('should support method chaining', () => {
      const address = PostalAddressImpl.builder()
        .city('Paris')
        .postalCode('75001')
        .countryCode('FR')
        .street('123 Rue')
        .build();

      expect(address).toBeDefined();
    });
  });
});

describe('TradePartyImpl', () => {
  describe('Constructor', () => {
    it('should create party with required fields', () => {
      const address = new PostalAddressImpl('Paris', '75001', 'FR');
      const party = new TradePartyImpl('ACME Corp', address);

      expect(party.name).toBe('ACME Corp');
      expect(party.address).toBe(address);
    });

    it('should create party with all fields', () => {
      const address = new PostalAddressImpl('Paris', '75001', 'FR');
      const party = new TradePartyImpl(
        'ACME Corporation',
        address,
        'ACME',
        'FR12345678901',
        'TAX123',
        'LEGAL456',
        '0002',
        'contact@acme.com',
        '+33123456789',
        'GLOBAL789',
        'contact@acme.com',
        'EM'
      );

      expect(party.tradingName).toBe('ACME');
      expect(party.vatId).toBe('FR12345678901');
      expect(party.taxId).toBe('TAX123');
      expect(party.legalId).toBe('LEGAL456');
      expect(party.legalIdScheme).toBe('0002');
      expect(party.email).toBe('contact@acme.com');
      expect(party.phone).toBe('+33123456789');
      expect(party.globalId).toBe('GLOBAL789');
      expect(party.electronicAddress).toBe('contact@acme.com');
      expect(party.electronicAddressScheme).toBe('EM');
    });

    it('should throw error if name is missing', () => {
      const address = new PostalAddressImpl('Paris', '75001', 'FR');
      expect(() => new TradePartyImpl('', address)).toThrow(
        'Name and address are required'
      );
    });

    it('should be frozen (immutable)', () => {
      const address = new PostalAddressImpl('Paris', '75001', 'FR');
      const party = new TradePartyImpl('ACME Corp', address);

      expect(Object.isFrozen(party)).toBe(true);
    });
  });

  describe('Builder', () => {
    it('should build party with required fields', () => {
      const address = PostalAddressImpl.builder()
        .city('Paris')
        .postalCode('75001')
        .countryCode('FR')
        .build();

      const party = TradePartyImpl.builder()
        .name('Test Company')
        .address(address)
        .build();

      expect(party.name).toBe('Test Company');
      expect(party.address).toBe(address);
    });

    it('should build party with all optional fields', () => {
      const address = PostalAddressImpl.builder()
        .city('Paris')
        .postalCode('75001')
        .countryCode('FR')
        .build();

      const party = TradePartyImpl.builder()
        .name('ACME Corporation')
        .address(address)
        .tradingName('ACME')
        .vatId('FR12345678901')
        .taxId('TAX123')
        .legalId('LEGAL456')
        .email('contact@acme.com')
        .phone('+33123456789')
        .globalId('GLOBAL789')
        .build();

      expect(party.tradingName).toBe('ACME');
      expect(party.vatId).toBe('FR12345678901');
      expect(party.email).toBe('contact@acme.com');
    });

    it('should throw error if name not set', () => {
      const address = PostalAddressImpl.builder()
        .city('Paris')
        .postalCode('75001')
        .countryCode('FR')
        .build();

      const builder = TradePartyImpl.builder().address(address);

      expect(() => builder.build()).toThrow('Name and address are required');
    });

    it('should throw error if address not set', () => {
      const builder = TradePartyImpl.builder().name('ACME Corp');

      expect(() => builder.build()).toThrow('Name and address are required');
    });
  });
});

describe('PaymentDetailsImpl', () => {
  describe('Constructor', () => {
    it('should create payment with required fields', () => {
      const payment = new PaymentDetailsImpl(PaymentMeansCode.SEPA_CREDIT_TRANSFER);

      expect(payment.meansCode).toBe(PaymentMeansCode.SEPA_CREDIT_TRANSFER);
    });

    it('should create payment with all fields', () => {
      const dueDate = new Date('2024-12-31');
      const payment = new PaymentDetailsImpl(
        PaymentMeansCode.SEPA_CREDIT_TRANSFER,
        'FR7630004000031234567890143',
        'BNPAFRPPXXX',
        'REF-12345',
        dueDate,
        'Net 30 days'
      );

      expect(payment.iban).toBe('FR7630004000031234567890143');
      expect(payment.bic).toBe('BNPAFRPPXXX');
      expect(payment.reference).toBe('REF-12345');
      expect(payment.dueDate).toBe(dueDate);
      expect(payment.termsDescription).toBe('Net 30 days');
    });

    it('should be frozen (immutable)', () => {
      const payment = new PaymentDetailsImpl(PaymentMeansCode.SEPA_CREDIT_TRANSFER);

      expect(Object.isFrozen(payment)).toBe(true);
    });
  });

  describe('Builder', () => {
    it('should build payment with required fields', () => {
      const payment = PaymentDetailsImpl.builder()
        .meansCode(PaymentMeansCode.BANK_CARD)
        .build();

      expect(payment.meansCode).toBe(PaymentMeansCode.BANK_CARD);
    });

    it('should build payment with all fields', () => {
      const dueDate = new Date('2024-12-31');

      const payment = PaymentDetailsImpl.builder()
        .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
        .iban('FR7630004000031234567890143')
        .bic('BNPAFRPPXXX')
        .reference('REF-12345')
        .dueDate(dueDate)
        .termsDescription('Net 30 days')
        .build();

      expect(payment.iban).toBe('FR7630004000031234567890143');
      expect(payment.bic).toBe('BNPAFRPPXXX');
      expect(payment.reference).toBe('REF-12345');
      expect(payment.dueDate).toBe(dueDate);
      expect(payment.termsDescription).toBe('Net 30 days');
    });

    it('should throw error if means code not set', () => {
      const builder = PaymentDetailsImpl.builder();

      expect(() => builder.build()).toThrow('Payment means code is required');
    });

    it('should support method chaining', () => {
      const payment = PaymentDetailsImpl.builder()
        .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
        .iban('FR7630004000031234567890143')
        .bic('BNPAFRPPXXX')
        .build();

      expect(payment).toBeDefined();
    });
  });
});

describe('DocumentHeaderImpl', () => {
  describe('Constructor', () => {
    it('should create header with required fields', () => {
      const date = new Date('2023-11-15');
      const header = new DocumentHeaderImpl(
        'INV-001',
        'INV-001',
        'INVOICE',
        date,
        DocTypeCode.INVOICE
      );

      expect(header.id).toBe('INV-001');
      expect(header.invoiceNumber).toBe('INV-001');
      expect(header.name).toBe('INVOICE');
      expect(header.invoiceDate).toBe(date);
      expect(header.typeCode).toBe(DocTypeCode.INVOICE);
    });

    it('should create header with all fields', () => {
      const invoiceDate = new Date('2023-11-15');
      const dueDate = new Date('2023-12-15');
      const periodStart = new Date('2023-11-01');
      const periodEnd = new Date('2023-11-30');
      const notes = ['Note 1', 'Note 2'];

      const header = new DocumentHeaderImpl(
        'INV-001',
        'INV-001',
        'INVOICE',
        invoiceDate,
        DocTypeCode.INVOICE,
        dueDate,
        periodStart,
        periodEnd,
        'PO-123',
        'SO-456',
        'CONTRACT-789',
        notes
      );

      expect(header.dueDate).toBe(dueDate);
      expect(header.billingPeriodStart).toBe(periodStart);
      expect(header.billingPeriodEnd).toBe(periodEnd);
      expect(header.purchaseOrderReference).toBe('PO-123');
      expect(header.salesOrderReference).toBe('SO-456');
      expect(header.contractReference).toBe('CONTRACT-789');
      expect(header.notes).toEqual(notes);
    });

    it('should throw error if id is missing', () => {
      expect(() => new DocumentHeaderImpl(
        '',
        'INV-001',
        'INVOICE',
        new Date(),
        DocTypeCode.INVOICE
      )).toThrow('ID, invoice number, and date are required');
    });

    it('should throw error if invoice number is missing', () => {
      expect(() => new DocumentHeaderImpl(
        'INV-001',
        '',
        'INVOICE',
        new Date(),
        DocTypeCode.INVOICE
      )).toThrow('ID, invoice number, and date are required');
    });

    it('should be frozen (immutable)', () => {
      const header = new DocumentHeaderImpl(
        'INV-001',
        'INV-001',
        'INVOICE',
        new Date(),
        DocTypeCode.INVOICE
      );

      expect(Object.isFrozen(header)).toBe(true);
    });

    it('should freeze notes array', () => {
      const notes = ['Note 1', 'Note 2'];
      const header = new DocumentHeaderImpl(
        'INV-001',
        'INV-001',
        'INVOICE',
        new Date(),
        DocTypeCode.INVOICE,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        notes
      );

      expect(Object.isFrozen(header.notes)).toBe(true);
    });
  });

  describe('Builder', () => {
    it('should build header with required fields', () => {
      const date = new Date('2023-11-15');

      const header = DocumentHeaderImpl.builder()
        .id('INV-001')
        .invoiceNumber('INV-001')
        .invoiceDate(date)
        .build();

      expect(header.id).toBe('INV-001');
      expect(header.invoiceNumber).toBe('INV-001');
      expect(header.invoiceDate).toBe(date);
    });

    it('should have default name and typeCode', () => {
      const header = DocumentHeaderImpl.builder()
        .id('INV-001')
        .invoiceNumber('INV-001')
        .invoiceDate(new Date())
        .build();

      expect(header.name).toBe('INVOICE');
      expect(header.typeCode).toBe(DocTypeCode.INVOICE);
    });

    it('should allow custom name and typeCode', () => {
      const header = DocumentHeaderImpl.builder()
        .id('CN-001')
        .invoiceNumber('CN-001')
        .invoiceDate(new Date())
        .name('CREDIT NOTE')
        .typeCode(DocTypeCode.CREDIT_NOTE)
        .build();

      expect(header.name).toBe('CREDIT NOTE');
      expect(header.typeCode).toBe(DocTypeCode.CREDIT_NOTE);
    });

    it('should support billing period', () => {
      const start = new Date('2023-11-01');
      const end = new Date('2023-11-30');

      const header = DocumentHeaderImpl.builder()
        .id('INV-001')
        .invoiceNumber('INV-001')
        .invoiceDate(new Date())
        .billingPeriod(start, end)
        .build();

      expect(header.billingPeriodStart).toBe(start);
      expect(header.billingPeriodEnd).toBe(end);
    });

    it('should support addNote', () => {
      const header = DocumentHeaderImpl.builder()
        .id('INV-001')
        .invoiceNumber('INV-001')
        .invoiceDate(new Date())
        .addNote('First note')
        .addNote('Second note')
        .build();

      expect(header.notes).toEqual(['First note', 'Second note']);
    });

    it('should support all reference fields', () => {
      const header = DocumentHeaderImpl.builder()
        .id('INV-001')
        .invoiceNumber('INV-001')
        .invoiceDate(new Date())
        .purchaseOrderReference('PO-123')
        .salesOrderReference('SO-456')
        .contractReference('CONTRACT-789')
        .build();

      expect(header.purchaseOrderReference).toBe('PO-123');
      expect(header.salesOrderReference).toBe('SO-456');
      expect(header.contractReference).toBe('CONTRACT-789');
    });

    it('should throw error if id not set', () => {
      const builder = DocumentHeaderImpl.builder()
        .invoiceNumber('INV-001')
        .invoiceDate(new Date());

      expect(() => builder.build()).toThrow('ID, invoice number, and date are required');
    });
  });
});

describe('AllowanceCharge', () => {
  describe('Constructor', () => {
    it('should create allowance', () => {
      const allowance = new AllowanceCharge(false, 100);

      expect(allowance.chargeIndicator).toBe(false);
      expect(allowance.actualAmount).toBe(100);
    });

    it('should create charge', () => {
      const charge = new AllowanceCharge(true, 50);

      expect(charge.chargeIndicator).toBe(true);
      expect(charge.actualAmount).toBe(50);
    });

    it('should create with all fields', () => {
      const item = new AllowanceCharge(
        false,
        100,
        'Volume discount',
        'VD',
        0.20,
        'S',
        1000,
        10
      );

      expect(item.reason).toBe('Volume discount');
      expect(item.reasonCode).toBe('VD');
      expect(item.taxRate).toBe(0.20);
      expect(item.taxCategoryCode).toBe('S');
      expect(item.baseAmount).toBe(1000);
      expect(item.percentage).toBe(10);
    });

    it('should throw error if amount is negative', () => {
      expect(() => new AllowanceCharge(false, -10)).toThrow(
        'Amount must be non-negative'
      );
    });

    it('should be frozen (immutable)', () => {
      const allowance = new AllowanceCharge(false, 100);

      expect(Object.isFrozen(allowance)).toBe(true);
    });
  });

  describe('Static Factories', () => {
    it('should create allowance with static method', () => {
      const allowance = AllowanceCharge.allowance(100, 'Discount');

      expect(allowance.chargeIndicator).toBe(false);
      expect(allowance.actualAmount).toBe(100);
      expect(allowance.reason).toBe('Discount');
    });

    it('should create charge with static method', () => {
      const charge = AllowanceCharge.charge(50, 'Shipping', 'SH');

      expect(charge.chargeIndicator).toBe(true);
      expect(charge.actualAmount).toBe(50);
      expect(charge.reason).toBe('Shipping');
      expect(charge.reasonCode).toBe('SH');
    });
  });
});

describe('InvoiceLine', () => {
  describe('Constructor', () => {
    it('should create line with required fields', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);

      expect(line.id).toBe('1');
      expect(line.description).toBe('Product A');
      expect(line.quantity).toBe(10);
      expect(line.unitPrice).toBe(100);
      expect(line.vatRate).toBe(0.20);
    });

    it('should create line with default values', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);

      expect(line.taxCategoryCode).toBe('S');
      expect(line.unitCode).toBe('C62');
    });

    it('should create line with all fields', () => {
      const start = new Date('2023-11-01');
      const end = new Date('2023-11-30');

      const line = new InvoiceLine(
        '1',
        'Product A',
        10,
        100,
        0.20,
        'S',
        'C62',
        start,
        end,
        10,
        'PROD-001',
        '1234567890123'
      );

      expect(line.billingPeriodStart).toBe(start);
      expect(line.billingPeriodEnd).toBe(end);
      expect(line.deliveredQuantity).toBe(10);
      expect(line.productId).toBe('PROD-001');
      expect(line.ean).toBe('1234567890123');
    });

    it('should throw error if id is missing', () => {
      expect(() => new InvoiceLine('', 'Product A', 10, 100, 0.20)).toThrow(
        'ID and description are required'
      );
    });

    it('should throw error if description is missing', () => {
      expect(() => new InvoiceLine('1', '', 10, 100, 0.20)).toThrow(
        'ID and description are required'
      );
    });

    it('should throw error if quantity is negative', () => {
      expect(() => new InvoiceLine('1', 'Product A', -10, 100, 0.20)).toThrow(
        'Quantity and price must be non-negative'
      );
    });

    it('should throw error if price is negative', () => {
      expect(() => new InvoiceLine('1', 'Product A', 10, -100, 0.20)).toThrow(
        'Quantity and price must be non-negative'
      );
    });

    it('should initialize empty allowances and charges arrays', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);

      expect(line.allowances).toEqual([]);
      expect(line.charges).toEqual([]);
    });
  });

  describe('Line Total', () => {
    it('should calculate line total', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);

      expect(line.lineTotal).toBe(1000);
    });

    it('should recalculate when quantity changes', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.quantity = 20;

      expect(line.lineTotal).toBe(2000);
    });

    it('should recalculate when price changes', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.unitPrice = 200;

      expect(line.lineTotal).toBe(2000);
    });
  });

  describe('Allowances and Charges', () => {
    it('should add allowance', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.addAllowance(50, 'Discount');

      expect(line.allowances).toHaveLength(1);
      expect(line.allowances[0].actualAmount).toBe(50);
      expect(line.allowances[0].chargeIndicator).toBe(false);
    });

    it('should add charge', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.addCharge(25, 'Handling');

      expect(line.charges).toHaveLength(1);
      expect(line.charges[0].actualAmount).toBe(25);
      expect(line.charges[0].chargeIndicator).toBe(true);
    });

    it('should add multiple allowances and charges', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.addAllowance(50);
      line.addAllowance(30);
      line.addCharge(25);

      expect(line.allowances).toHaveLength(2);
      expect(line.charges).toHaveLength(1);
    });

    it('should add allowance or charge based on flag', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.addAllowanceCharge(50, false, 'Discount');
      line.addAllowanceCharge(25, true, 'Fee');

      expect(line.allowances).toHaveLength(1);
      expect(line.charges).toHaveLength(1);
    });

    it('should get all allowances and charges', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.addAllowance(50);
      line.addCharge(25);

      const all = line.getAllAllowancesCharges();

      expect(all).toHaveLength(2);
      expect(all[0].chargeIndicator).toBe(false);
      expect(all[1].chargeIndicator).toBe(true);
    });

    it('should clear all allowances and charges', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.addAllowance(50);
      line.addCharge(25);
      line.clearAllowancesCharges();

      expect(line.allowances).toHaveLength(0);
      expect(line.charges).toHaveLength(0);
    });
  });

  describe('Builder', () => {
    it('should build line with required fields', () => {
      const line = InvoiceLine.builder()
        .id('1')
        .description('Product A')
        .build();

      expect(line.id).toBe('1');
      expect(line.description).toBe('Product A');
    });

    it('should use default values', () => {
      const line = InvoiceLine.builder()
        .id('1')
        .description('Product A')
        .build();

      expect(line.quantity).toBe(1);
      expect(line.unitPrice).toBe(0);
      expect(line.vatRate).toBe(0.20);
      expect(line.taxCategoryCode).toBe('S');
      expect(line.unitCode).toBe('C62');
    });

    it('should build line with all fields', () => {
      const start = new Date('2023-11-01');
      const end = new Date('2023-11-30');

      const line = InvoiceLine.builder()
        .id('1')
        .description('Product A')
        .quantity(10)
        .unitPrice(100)
        .vatRate(0.20)
        .taxCategoryCode('S')
        .unitCode('C62')
        .billingPeriod(start, end)
        .deliveredQuantity(10)
        .productId('PROD-001')
        .ean('1234567890123')
        .build();

      expect(line.quantity).toBe(10);
      expect(line.unitPrice).toBe(100);
      expect(line.billingPeriodStart).toBe(start);
      expect(line.productId).toBe('PROD-001');
    });

    it('should support method chaining', () => {
      const line = InvoiceLine.builder()
        .id('1')
        .description('Product A')
        .quantity(10)
        .unitPrice(100)
        .vatRate(0.20)
        .build();

      expect(line).toBeDefined();
    });

    it('should throw error if id not set', () => {
      const builder = InvoiceLine.builder().description('Product A');

      expect(() => builder.build()).toThrow('ID and description are required');
    });

    it('should throw error if description not set', () => {
      const builder = InvoiceLine.builder().id('1');

      expect(() => builder.build()).toThrow('ID and description are required');
    });
  });

  describe('Mutability', () => {
    it('should allow quantity mutation', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.quantity = 20;

      expect(line.quantity).toBe(20);
    });

    it('should allow price mutation', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.unitPrice = 200;

      expect(line.unitPrice).toBe(200);
    });

    it('should allow allowances array mutation', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.allowances.push(AllowanceCharge.allowance(50));

      expect(line.allowances).toHaveLength(1);
    });

    it('should allow charges array mutation', () => {
      const line = new InvoiceLine('1', 'Product A', 10, 100, 0.20);
      line.charges.push(AllowanceCharge.charge(25));

      expect(line.charges).toHaveLength(1);
    });
  });
});

describe('Performance', () => {
  it('should create 1000 postal addresses quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 1000; i++) {
      PostalAddressImpl.builder()
        .city('Paris')
        .postalCode('75001')
        .countryCode('FR')
        .build();
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });

  it('should create 1000 invoice lines with allowances quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 1000; i++) {
      const line = new InvoiceLine(`${i}`, 'Product', 10, 100, 0.20);
      line.addAllowance(10);
      line.addCharge(5);
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });
});
