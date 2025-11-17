import {
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  AllowanceCharge,
  InvoiceLine,
} from '../../core/entities';
import { DocTypeCode, PaymentMeansCode } from '../../types';

describe('entities', () => {
  describe('PostalAddressImpl', () => {
    describe('constructor', () => {
      it('should create a valid postal address', () => {
        const address = new PostalAddressImpl('Paris', '75001', 'FR');
        expect(address.city).toBe('Paris');
        expect(address.postalCode).toBe('75001');
        expect(address.countryCode).toBe('FR');
        expect(address.street).toBeUndefined();
      });

      it('should create address with all optional fields', () => {
        const address = new PostalAddressImpl(
          'Paris',
          '75001',
          'FR',
          '123 Rue de Rivoli',
          'Apt 5',
          'Building A',
          'Île-de-France'
        );
        expect(address.street).toBe('123 Rue de Rivoli');
        expect(address.additionalStreet).toBe('Apt 5');
        expect(address.additionalStreet2).toBe('Building A');
        expect(address.subdivision).toBe('Île-de-France');
      });

      it('should throw if city is missing', () => {
        expect(() => new PostalAddressImpl('', '75001', 'FR')).toThrow(
          'City, postal code, and country code are required'
        );
      });

      it('should throw if postal code is missing', () => {
        expect(() => new PostalAddressImpl('Paris', '', 'FR')).toThrow(
          'City, postal code, and country code are required'
        );
      });

      it('should throw if country code is missing', () => {
        expect(() => new PostalAddressImpl('Paris', '75001', '')).toThrow(
          'City, postal code, and country code are required'
        );
      });

      it('should be immutable', () => {
        const address = new PostalAddressImpl('Paris', '75001', 'FR');
        expect(Object.isFrozen(address)).toBe(true);
      });
    });

    describe('builder', () => {
      it('should build address with required fields', () => {
        const address = PostalAddressImpl.builder()
          .city('Berlin')
          .postalCode('10115')
          .countryCode('DE')
          .build();

        expect(address.city).toBe('Berlin');
        expect(address.postalCode).toBe('10115');
        expect(address.countryCode).toBe('DE');
      });

      it('should build address with all fields', () => {
        const address = PostalAddressImpl.builder()
          .city('London')
          .postalCode('SW1A 1AA')
          .countryCode('GB')
          .street('10 Downing Street')
          .additionalStreet('Westminster')
          .additionalStreet2('Greater London')
          .subdivision('England')
          .build();

        expect(address.street).toBe('10 Downing Street');
        expect(address.subdivision).toBe('England');
      });

      it('should throw if required fields are missing', () => {
        expect(() =>
          PostalAddressImpl.builder().city('Paris').postalCode('75001').build()
        ).toThrow('City, postal code, and country code are required');
      });

      it('should support method chaining', () => {
        const builder = PostalAddressImpl.builder();
        const result = builder.city('Paris');
        expect(result).toBe(builder);
      });
    });
  });

  describe('TradePartyImpl', () => {
    let mockAddress: PostalAddressImpl;

    beforeEach(() => {
      mockAddress = new PostalAddressImpl('Paris', '75001', 'FR');
    });

    describe('constructor', () => {
      it('should create valid trade party', () => {
        const party = new TradePartyImpl('ACME Corp', mockAddress);
        expect(party.name).toBe('ACME Corp');
        expect(party.address).toBe(mockAddress);
      });

      it('should create party with all optional fields', () => {
        const party = new TradePartyImpl(
          'ACME Corp',
          mockAddress,
          'ACME Trading',
          'FR12345678901',
          'TAX123',
          'LEGAL456',
          'contact@acme.com',
          '+33123456789',
          'GLOBAL789'
        );

        expect(party.tradingName).toBe('ACME Trading');
        expect(party.vatId).toBe('FR12345678901');
        expect(party.taxId).toBe('TAX123');
        expect(party.legalId).toBe('LEGAL456');
        expect(party.email).toBe('contact@acme.com');
        expect(party.phone).toBe('+33123456789');
        expect(party.globalId).toBe('GLOBAL789');
      });

      it('should throw if name is missing', () => {
        expect(() => new TradePartyImpl('', mockAddress)).toThrow(
          'Name and address are required'
        );
      });

      it('should throw if address is missing', () => {
        expect(() => new TradePartyImpl('ACME Corp', null as any)).toThrow(
          'Name and address are required'
        );
      });

      it('should be immutable', () => {
        const party = new TradePartyImpl('ACME Corp', mockAddress);
        expect(Object.isFrozen(party)).toBe(true);
      });
    });

    describe('builder', () => {
      it('should build party with required fields', () => {
        const party = TradePartyImpl.builder()
          .name('TechCorp')
          .address(mockAddress)
          .build();

        expect(party.name).toBe('TechCorp');
        expect(party.address).toBe(mockAddress);
      });

      it('should build party with all fields', () => {
        const party = TradePartyImpl.builder()
          .name('TechCorp')
          .address(mockAddress)
          .tradingName('Tech Trading')
          .vatId('DE123456789')
          .taxId('TAX001')
          .legalId('LEG001')
          .email('info@tech.com')
          .phone('+49123456')
          .globalId('GLB001')
          .build();

        expect(party.tradingName).toBe('Tech Trading');
        expect(party.email).toBe('info@tech.com');
      });

      it('should throw if name is missing', () => {
        expect(() => TradePartyImpl.builder().address(mockAddress).build()).toThrow(
          'Name and address are required'
        );
      });

      it('should throw if address is missing', () => {
        expect(() => TradePartyImpl.builder().name('ACME').build()).toThrow(
          'Name and address are required'
        );
      });

      it('should support method chaining', () => {
        const builder = TradePartyImpl.builder();
        const result = builder.name('Test');
        expect(result).toBe(builder);
      });
    });
  });

  describe('PaymentDetailsImpl', () => {
    describe('constructor', () => {
      it('should create payment details with required field', () => {
        const payment = new PaymentDetailsImpl(PaymentMeansCode.SEPA_CREDIT_TRANSFER);
        expect(payment.meansCode).toBe(PaymentMeansCode.SEPA_CREDIT_TRANSFER);
        expect(payment.iban).toBeUndefined();
      });

      it('should create payment details with all fields', () => {
        const dueDate = new Date('2025-12-31');
        const payment = new PaymentDetailsImpl(
          PaymentMeansCode.SEPA_CREDIT_TRANSFER,
          'FR1234567890123456789012345',
          'BNPAFRPP',
          'REF123',
          dueDate,
          'Net 30 days'
        );

        expect(payment.iban).toBe('FR1234567890123456789012345');
        expect(payment.bic).toBe('BNPAFRPP');
        expect(payment.reference).toBe('REF123');
        expect(payment.dueDate).toBe(dueDate);
        expect(payment.termsDescription).toBe('Net 30 days');
      });

      it('should be immutable', () => {
        const payment = new PaymentDetailsImpl(PaymentMeansCode.SEPA_CREDIT_TRANSFER);
        expect(Object.isFrozen(payment)).toBe(true);
      });
    });

    describe('builder', () => {
      it('should build payment with required field', () => {
        const payment = PaymentDetailsImpl.builder()
          .meansCode(PaymentMeansCode.BANK_CARD)
          .build();

        expect(payment.meansCode).toBe(PaymentMeansCode.BANK_CARD);
      });

      it('should build payment with all fields', () => {
        const dueDate = new Date('2025-11-30');
        const payment = PaymentDetailsImpl.builder()
          .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
          .iban('DE12345678901234567890')
          .bic('DEUTDEFF')
          .reference('INV-2025-001')
          .dueDate(dueDate)
          .termsDescription('Payment within 14 days')
          .build();

        expect(payment.iban).toBe('DE12345678901234567890');
        expect(payment.bic).toBe('DEUTDEFF');
        expect(payment.reference).toBe('INV-2025-001');
        expect(payment.dueDate).toBe(dueDate);
        expect(payment.termsDescription).toBe('Payment within 14 days');
      });

      it('should throw if means code is missing', () => {
        expect(() => PaymentDetailsImpl.builder().iban('FR123').build()).toThrow(
          'Payment means code is required'
        );
      });

      it('should support method chaining', () => {
        const builder = PaymentDetailsImpl.builder();
        const result = builder.meansCode(PaymentMeansCode.CASH);
        expect(result).toBe(builder);
      });
    });
  });

  describe('DocumentHeaderImpl', () => {
    describe('constructor', () => {
      it('should create header with required fields', () => {
        const date = new Date('2025-01-15');
        const header = new DocumentHeaderImpl(
          'HDR-001',
          'INV-2025-001',
          'INVOICE',
          date,
          DocTypeCode.INVOICE
        );

        expect(header.id).toBe('HDR-001');
        expect(header.invoiceNumber).toBe('INV-2025-001');
        expect(header.name).toBe('INVOICE');
        expect(header.invoiceDate).toBe(date);
        expect(header.typeCode).toBe(DocTypeCode.INVOICE);
      });

      it('should create header with all fields', () => {
        const invoiceDate = new Date('2025-01-15');
        const dueDate = new Date('2025-02-15');
        const periodStart = new Date('2025-01-01');
        const periodEnd = new Date('2025-01-31');

        const header = new DocumentHeaderImpl(
          'HDR-002',
          'INV-2025-002',
          'INVOICE',
          invoiceDate,
          DocTypeCode.INVOICE,
          dueDate,
          periodStart,
          periodEnd,
          'PO-123',
          'SO-456',
          'CONTRACT-789',
          ['Note 1', 'Note 2']
        );

        expect(header.dueDate).toBe(dueDate);
        expect(header.billingPeriodStart).toBe(periodStart);
        expect(header.billingPeriodEnd).toBe(periodEnd);
        expect(header.purchaseOrderReference).toBe('PO-123');
        expect(header.salesOrderReference).toBe('SO-456');
        expect(header.contractReference).toBe('CONTRACT-789');
        expect(header.notes).toEqual(['Note 1', 'Note 2']);
      });

      it('should throw if id is missing', () => {
        expect(
          () =>
            new DocumentHeaderImpl(
              '',
              'INV-001',
              'INVOICE',
              new Date(),
              DocTypeCode.INVOICE
            )
        ).toThrow('ID, invoice number, and date are required');
      });

      it('should throw if invoice number is missing', () => {
        expect(
          () =>
            new DocumentHeaderImpl(
              'HDR-001',
              '',
              'INVOICE',
              new Date(),
              DocTypeCode.INVOICE
            )
        ).toThrow('ID, invoice number, and date are required');
      });

      it('should throw if invoice date is missing', () => {
        expect(
          () =>
            new DocumentHeaderImpl(
              'HDR-001',
              'INV-001',
              'INVOICE',
              null as any,
              DocTypeCode.INVOICE
            )
        ).toThrow('ID, invoice number, and date are required');
      });

      it('should freeze notes array', () => {
        const header = new DocumentHeaderImpl(
          'HDR-001',
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
          ['Note 1']
        );
        expect(Object.isFrozen(header.notes)).toBe(true);
      });

      it('should be immutable', () => {
        const header = new DocumentHeaderImpl(
          'HDR-001',
          'INV-001',
          'INVOICE',
          new Date(),
          DocTypeCode.INVOICE
        );
        expect(Object.isFrozen(header)).toBe(true);
      });
    });

    describe('builder', () => {
      it('should build header with required fields', () => {
        const date = new Date('2025-01-20');
        const header = DocumentHeaderImpl.builder()
          .id('HDR-100')
          .invoiceNumber('INV-100')
          .invoiceDate(date)
          .build();

        expect(header.id).toBe('HDR-100');
        expect(header.invoiceNumber).toBe('INV-100');
        expect(header.invoiceDate).toBe(date);
        expect(header.name).toBe('INVOICE'); // Default
        expect(header.typeCode).toBe(DocTypeCode.INVOICE); // Default
      });

      it('should build header with all fields', () => {
        const invoiceDate = new Date('2025-01-20');
        const dueDate = new Date('2025-02-20');
        const periodStart = new Date('2025-01-01');
        const periodEnd = new Date('2025-01-31');

        const header = DocumentHeaderImpl.builder()
          .id('HDR-200')
          .invoiceNumber('INV-200')
          .name('CREDIT NOTE')
          .invoiceDate(invoiceDate)
          .typeCode(DocTypeCode.CREDIT_NOTE)
          .dueDate(dueDate)
          .billingPeriod(periodStart, periodEnd)
          .purchaseOrderReference('PO-999')
          .salesOrderReference('SO-888')
          .contractReference('CTR-777')
          .addNote('First note')
          .addNote('Second note')
          .build();

        expect(header.name).toBe('CREDIT NOTE');
        expect(header.typeCode).toBe(DocTypeCode.CREDIT_NOTE);
        expect(header.dueDate).toBe(dueDate);
        expect(header.billingPeriodStart).toBe(periodStart);
        expect(header.billingPeriodEnd).toBe(periodEnd);
        expect(header.purchaseOrderReference).toBe('PO-999');
        expect(header.notes).toEqual(['First note', 'Second note']);
      });

      it('should throw if id is missing', () => {
        expect(() =>
          DocumentHeaderImpl.builder()
            .invoiceNumber('INV-001')
            .invoiceDate(new Date())
            .build()
        ).toThrow('ID, invoice number, and date are required');
      });

      it('should throw if invoice number is missing', () => {
        expect(() =>
          DocumentHeaderImpl.builder().id('HDR-001').invoiceDate(new Date()).build()
        ).toThrow('ID, invoice number, and date are required');
      });

      it('should throw if invoice date is missing', () => {
        expect(() =>
          DocumentHeaderImpl.builder().id('HDR-001').invoiceNumber('INV-001').build()
        ).toThrow('ID, invoice number, and date are required');
      });

      it('should support method chaining', () => {
        const builder = DocumentHeaderImpl.builder();
        const result = builder.id('TEST');
        expect(result).toBe(builder);
      });

      it('should create a copy of notes array', () => {
        const builder = DocumentHeaderImpl.builder()
          .id('HDR-001')
          .invoiceNumber('INV-001')
          .invoiceDate(new Date())
          .addNote('Note 1');

        const header = builder.build();
        builder.addNote('Note 2'); // Add after build

        // Header should only have first note
        expect(header.notes).toEqual(['Note 1']);
      });
    });
  });

  describe('AllowanceCharge', () => {
    describe('constructor', () => {
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

      it('should create with all optional fields', () => {
        const item = new AllowanceCharge(
          true,
          75,
          'Shipping fee',
          'SHP',
          0.20,
          'S',
          1000,
          7.5
        );

        expect(item.reason).toBe('Shipping fee');
        expect(item.reasonCode).toBe('SHP');
        expect(item.taxRate).toBe(0.20);
        expect(item.taxCategoryCode).toBe('S');
        expect(item.baseAmount).toBe(1000);
        expect(item.percentage).toBe(7.5);
      });

      it('should throw for negative amount', () => {
        expect(() => new AllowanceCharge(true, -10)).toThrow(
          'Amount must be non-negative'
        );
      });

      it('should allow zero amount', () => {
        const item = new AllowanceCharge(true, 0);
        expect(item.actualAmount).toBe(0);
      });

      it('should be immutable', () => {
        const item = new AllowanceCharge(true, 100);
        expect(Object.isFrozen(item)).toBe(true);
      });
    });

    describe('factory methods', () => {
      it('should create allowance with allowance()', () => {
        const allowance = AllowanceCharge.allowance(100);
        expect(allowance.chargeIndicator).toBe(false);
        expect(allowance.actualAmount).toBe(100);
      });

      it('should create allowance with reason', () => {
        const allowance = AllowanceCharge.allowance(100, 'Discount', 'DISC');
        expect(allowance.reason).toBe('Discount');
        expect(allowance.reasonCode).toBe('DISC');
      });

      it('should create charge with charge()', () => {
        const charge = AllowanceCharge.charge(50);
        expect(charge.chargeIndicator).toBe(true);
        expect(charge.actualAmount).toBe(50);
      });

      it('should create charge with reason', () => {
        const charge = AllowanceCharge.charge(50, 'Handling', 'HAND');
        expect(charge.reason).toBe('Handling');
        expect(charge.reasonCode).toBe('HAND');
      });
    });
  });

  describe('InvoiceLine', () => {
    describe('constructor', () => {
      it('should create line with required fields', () => {
        const line = new InvoiceLine('LINE-001', 'Product A', 2, 100, 0.20);
        expect(line.id).toBe('LINE-001');
        expect(line.description).toBe('Product A');
        expect(line.quantity).toBe(2);
        expect(line.unitPrice).toBe(100);
        expect(line.vatRate).toBe(0.20);
      });

      it('should create line with default tax category and unit code', () => {
        const line = new InvoiceLine('LINE-001', 'Product A', 1, 50, 0.20);
        expect(line.taxCategoryCode).toBe('S');
        expect(line.unitCode).toBe('C62');
      });

      it('should create line with all fields', () => {
        const periodStart = new Date('2025-01-01');
        const periodEnd = new Date('2025-01-31');

        const line = new InvoiceLine(
          'LINE-002',
          'Product B',
          5,
          200,
          0.20,
          'Z',
          'H87',
          periodStart,
          periodEnd,
          5,
          'PROD-123',
          '1234567890123'
        );

        expect(line.taxCategoryCode).toBe('Z');
        expect(line.unitCode).toBe('H87');
        expect(line.billingPeriodStart).toBe(periodStart);
        expect(line.billingPeriodEnd).toBe(periodEnd);
        expect(line.deliveredQuantity).toBe(5);
        expect(line.productId).toBe('PROD-123');
        expect(line.ean).toBe('1234567890123');
      });

      it('should throw if id is missing', () => {
        expect(() => new InvoiceLine('', 'Product', 1, 100, 0.20)).toThrow(
          'ID and description are required'
        );
      });

      it('should throw if description is missing', () => {
        expect(() => new InvoiceLine('LINE-001', '', 1, 100, 0.20)).toThrow(
          'ID and description are required'
        );
      });

      it('should throw for negative quantity', () => {
        expect(() => new InvoiceLine('LINE-001', 'Product', -1, 100, 0.20)).toThrow(
          'Quantity and price must be non-negative'
        );
      });

      it('should throw for negative price', () => {
        expect(() => new InvoiceLine('LINE-001', 'Product', 1, -100, 0.20)).toThrow(
          'Quantity and price must be non-negative'
        );
      });

      it('should allow zero quantity and price', () => {
        const line = new InvoiceLine('LINE-001', 'Free product', 0, 0, 0.20);
        expect(line.quantity).toBe(0);
        expect(line.unitPrice).toBe(0);
      });

      it('should initialize empty allowances and charges arrays', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        expect(line.allowances).toEqual([]);
        expect(line.charges).toEqual([]);
      });
    });

    describe('lineTotal', () => {
      it('should calculate line total', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 3, 100, 0.20);
        expect(line.lineTotal).toBe(300);
      });

      it('should recalculate when quantity changes', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 2, 50, 0.20);
        expect(line.lineTotal).toBe(100);

        line.quantity = 5;
        expect(line.lineTotal).toBe(250);
      });

      it('should recalculate when price changes', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 2, 50, 0.20);
        expect(line.lineTotal).toBe(100);

        line.unitPrice = 75;
        expect(line.lineTotal).toBe(150);
      });

      it('should handle zero quantity', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 0, 100, 0.20);
        expect(line.lineTotal).toBe(0);
      });

      it('should handle fractional quantities and prices', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 2.5, 49.99, 0.20);
        expect(line.lineTotal).toBeCloseTo(124.975, 5);
      });
    });

    describe('addAllowance', () => {
      it('should add allowance to line', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addAllowance(10, 'Discount');

        expect(line.allowances.length).toBe(1);
        expect(line.allowances[0].chargeIndicator).toBe(false);
        expect(line.allowances[0].actualAmount).toBe(10);
        expect(line.allowances[0].reason).toBe('Discount');
      });

      it('should add multiple allowances', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addAllowance(10, 'Discount 1');
        line.addAllowance(5, 'Discount 2');

        expect(line.allowances.length).toBe(2);
        expect(line.allowances[0].actualAmount).toBe(10);
        expect(line.allowances[1].actualAmount).toBe(5);
      });
    });

    describe('addCharge', () => {
      it('should add charge to line', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addCharge(15, 'Handling');

        expect(line.charges.length).toBe(1);
        expect(line.charges[0].chargeIndicator).toBe(true);
        expect(line.charges[0].actualAmount).toBe(15);
        expect(line.charges[0].reason).toBe('Handling');
      });

      it('should add multiple charges', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addCharge(10, 'Fee 1');
        line.addCharge(5, 'Fee 2');

        expect(line.charges.length).toBe(2);
        expect(line.charges[0].actualAmount).toBe(10);
        expect(line.charges[1].actualAmount).toBe(5);
      });
    });

    describe('addAllowanceCharge', () => {
      it('should add allowance when isCharge is false', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addAllowanceCharge(20, false, 'Discount');

        expect(line.allowances.length).toBe(1);
        expect(line.charges.length).toBe(0);
        expect(line.allowances[0].actualAmount).toBe(20);
      });

      it('should add charge when isCharge is true', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addAllowanceCharge(30, true, 'Fee');

        expect(line.charges.length).toBe(1);
        expect(line.allowances.length).toBe(0);
        expect(line.charges[0].actualAmount).toBe(30);
      });
    });

    describe('getAllAllowancesCharges', () => {
      it('should return empty array when no items', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        expect(line.getAllAllowancesCharges()).toEqual([]);
      });

      it('should return all allowances and charges', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addAllowance(10);
        line.addAllowance(5);
        line.addCharge(15);
        line.addCharge(20);

        const all = line.getAllAllowancesCharges();
        expect(all.length).toBe(4);
        expect(all[0].actualAmount).toBe(10);
        expect(all[1].actualAmount).toBe(5);
        expect(all[2].actualAmount).toBe(15);
        expect(all[3].actualAmount).toBe(20);
      });

      it('should return only allowances when no charges', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addAllowance(10);
        line.addAllowance(5);

        const all = line.getAllAllowancesCharges();
        expect(all.length).toBe(2);
      });

      it('should return only charges when no allowances', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addCharge(15);

        const all = line.getAllAllowancesCharges();
        expect(all.length).toBe(1);
      });
    });

    describe('clearAllowancesCharges', () => {
      it('should clear all allowances and charges', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.addAllowance(10);
        line.addCharge(15);

        expect(line.allowances.length).toBe(1);
        expect(line.charges.length).toBe(1);

        line.clearAllowancesCharges();

        expect(line.allowances.length).toBe(0);
        expect(line.charges.length).toBe(0);
      });

      it('should work when already empty', () => {
        const line = new InvoiceLine('LINE-001', 'Product', 1, 100, 0.20);
        line.clearAllowancesCharges();

        expect(line.allowances.length).toBe(0);
        expect(line.charges.length).toBe(0);
      });
    });

    describe('builder', () => {
      it('should build line with required fields', () => {
        const line = InvoiceLine.builder()
          .id('LINE-100')
          .description('Test Product')
          .build();

        expect(line.id).toBe('LINE-100');
        expect(line.description).toBe('Test Product');
        expect(line.quantity).toBe(1); // Default
        expect(line.unitPrice).toBe(0); // Default
        expect(line.vatRate).toBe(0.20); // Default
      });

      it('should build line with all fields', () => {
        const periodStart = new Date('2025-02-01');
        const periodEnd = new Date('2025-02-28');

        const line = InvoiceLine.builder()
          .id('LINE-200')
          .description('Premium Product')
          .quantity(10)
          .unitPrice(250)
          .vatRate(0.19)
          .taxCategoryCode('AA')
          .unitCode('KGM')
          .billingPeriod(periodStart, periodEnd)
          .deliveredQuantity(9)
          .productId('PROD-789')
          .ean('9876543210123')
          .build();

        expect(line.quantity).toBe(10);
        expect(line.unitPrice).toBe(250);
        expect(line.vatRate).toBe(0.19);
        expect(line.taxCategoryCode).toBe('AA');
        expect(line.unitCode).toBe('KGM');
        expect(line.billingPeriodStart).toBe(periodStart);
        expect(line.billingPeriodEnd).toBe(periodEnd);
        expect(line.deliveredQuantity).toBe(9);
        expect(line.productId).toBe('PROD-789');
        expect(line.ean).toBe('9876543210123');
      });

      it('should throw if id is missing', () => {
        expect(() => InvoiceLine.builder().description('Product').build()).toThrow(
          'ID and description are required'
        );
      });

      it('should throw if description is missing', () => {
        expect(() => InvoiceLine.builder().id('LINE-001').build()).toThrow(
          'ID and description are required'
        );
      });

      it('should support method chaining', () => {
        const builder = InvoiceLine.builder();
        const result = builder.id('TEST');
        expect(result).toBe(builder);
      });
    });
  });
});
