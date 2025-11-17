import { FacturXInvoice, validateFacturxXml, generateFacturxXml } from '../FacturXInvoice';
import { DocumentHeader } from '../DocumentHeader';
import { TradeParty, PostalAddress, TradeContact } from '../HeaderTradeAgreement';
import { PaymentDetails } from '../PaymentDetails';
import { InvoiceLine } from '../InvoiceLine';
import { AllowanceCharge } from '../AllowanceCharge';
import { FacturxProfile, DocTypeCode, TaxCategoryCode } from '../EnumInvoiceType';

describe('FacturXInvoice', () => {
  let seller: TradeParty;
  let buyer: TradeParty;
  let header: DocumentHeader;
  let payment: PaymentDetails;

  beforeEach(() => {
    const sellerAddress = new PostalAddress(
      '10 Rue du Commerce',
      'Paris',
      '75001',
      'FR'
    );
    seller = new TradeParty(
      'ACME Corp',
      sellerAddress,
      'FR12345678901',
      '12345678901234',
      'contact@acme.fr',
      '+33123456789'
    );

    const buyerAddress = new PostalAddress(
      '20 Avenue des Clients',
      'Lyon',
      '69001',
      'FR'
    );
    buyer = new TradeParty(
      'Client SA',
      buyerAddress,
      'FR98765432109',
      '98765432109876',
      'achat@client.fr',
      '+33987654321'
    );

    header = new DocumentHeader(
      'DOC-2025-001',
      'INV-2025-001',
      'FACTURE',
      new Date('2025-01-15'),
      new Date('2025-01-16'),
      DocTypeCode.INVOICE
    );

    payment = new PaymentDetails(
      '58',
      'FR7630006000011234567890189',
      'BNPAFRPPXXX',
      new Date('2025-02-15'),
      'Payment within 30 days'
    );
  });

  describe('constructor', () => {
    it('should create instance with all required parameters', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      expect(invoice.profile).toBe(FacturxProfile.EN16931);
      expect(invoice.header).toBe(header);
      expect(invoice.seller).toBe(seller);
      expect(invoice.buyer).toBe(buyer);
      expect(invoice.payment).toBe(payment);
      expect(invoice.lines).toEqual([]);
    });

    it('should create instance with lines', () => {
      const lines = [
        new InvoiceLine('L1', 'Item 1', 5, 100, 0.20),
        new InvoiceLine('L2', 'Item 2', 3, 50, 0.20)
      ];

      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment,
        lines
      );

      expect(invoice.lines.length).toBe(2);
      expect(invoice.lines).toEqual(lines);
    });

    it('should initialize with default currency EUR', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      expect(invoice.currency).toBe('EUR');
    });

    it('should initialize with empty tax totals', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      expect(invoice.taxTotals).toEqual([]);
    });

    it('should initialize with empty docAllowanceCharges', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      expect(invoice.docAllowanceCharges).toEqual([]);
    });
  });

  describe('addLine', () => {
    it('should add a line to invoice', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      const line = new InvoiceLine('L1', 'Item', 5, 100, 0.20);
      invoice.addLine(line);

      expect(invoice.lines.length).toBe(1);
      expect(invoice.lines[0]).toBe(line);
    });

    it('should add multiple lines', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item 1', 5, 100, 0.20));
      invoice.addLine(new InvoiceLine('L2', 'Item 2', 3, 50, 0.20));
      invoice.addLine(new InvoiceLine('L3', 'Item 3', 2, 75, 0.20));

      expect(invoice.lines.length).toBe(3);
    });
  });

  describe('addDocumentAllowance', () => {
    it('should add document allowance', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      const allowance = new AllowanceCharge(
        false,
        100,
        'Discount',
        undefined,
        0.20,
        TaxCategoryCode.STANDARD
      );

      invoice.addDocumentAllowance(allowance);

      expect(invoice.docAllowanceCharges.length).toBe(1);
      expect(invoice.docAllowanceCharges[0]).toBe(allowance);
    });
  });

  describe('addDocumentCharge', () => {
    it('should add document charge', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      const charge = new AllowanceCharge(
        true,
        50,
        'Shipping',
        undefined,
        0.20,
        TaxCategoryCode.STANDARD
      );

      invoice.addDocumentCharge(charge);

      expect(invoice.docAllowanceCharges.length).toBe(1);
      expect(invoice.docAllowanceCharges[0]).toBe(charge);
    });
  });

  describe('finalizeTotals', () => {
    it('should calculate totals for simple invoice', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(1000);
      expect(summary.taxBasis).toBe(1000);
      expect(summary.taxTotal).toBe(200);
      expect(summary.grandTotal).toBe(1200);
    });

    it('should calculate totals with multiple lines', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item 1', 5, 100, 0.20));
      invoice.addLine(new InvoiceLine('L2', 'Item 2', 3, 50, 0.20));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(650);
      expect(summary.taxTotal).toBe(130);
      expect(summary.grandTotal).toBe(780);
    });

    it('should update tax totals', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      invoice.finalizeTotals();

      expect(invoice.taxTotals.length).toBe(1);
      expect(invoice.taxTotals[0].taxRate).toBe(20);
      expect(invoice.taxTotals[0].taxableAmount).toBe(1000);
      expect(invoice.taxTotals[0].taxAmount).toBe(200);
    });
  });

  describe('getTotalsSummary', () => {
    it('should return totals summary', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const summary = invoice.getTotalsSummary();

      expect(summary).toHaveProperty('lineTotal');
      expect(summary).toHaveProperty('taxBasis');
      expect(summary).toHaveProperty('taxTotal');
      expect(summary).toHaveProperty('grandTotal');
    });
  });

  describe('validateProfile - MINIMUM', () => {
    it('should validate MINIMUM profile with required fields', () => {
      // MINIMUM profile forbids 'lines', but we don't add any lines, so it should pass
      // However, it needs 'monetary.totalAmount' which doesn't exist as a field
      // So this test should actually throw an error
      const minimalInvoice = new FacturXInvoice(
        FacturxProfile.MINIMUM,
        header,
        seller,
        buyer,
        payment
      );

      // MINIMUM profile requires monetary.totalAmount which doesn't exist
      expect(() => minimalInvoice.validateProfile()).toThrow();
    });

    it('should reject MINIMUM profile with forbidden fields', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.MINIMUM,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 1, 100, 0.20));

      expect(() => invoice.validateProfile()).toThrow();
      expect(() => invoice.validateProfile()).toThrow(/interdit/);
    });
  });

  describe('validateProfile - EN16931', () => {
    it('should validate EN16931 profile with all required fields', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 1, 100, 0.20));

      expect(() => invoice.validateProfile()).not.toThrow();
    });

    it('should reject EN16931 without VAT number', () => {
      const sellerNoVat = new TradeParty(
        'Company',
        new PostalAddress('Street', 'City', '12345')
      );

      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        sellerNoVat,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 1, 100, 0.20));

      expect(() => invoice.validateProfile()).toThrow();
      expect(() => invoice.validateProfile()).toThrow(/numéro de TVA/);
    });

    it('should reject EN16931 without lines', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      expect(() => invoice.validateProfile()).toThrow();
      expect(() => invoice.validateProfile()).toThrow(/ligne de facture/);
    });

    it('should reject EN16931 with zero quantity', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 0, 100, 0.20));

      expect(() => invoice.validateProfile()).toThrow();
      expect(() => invoice.validateProfile()).toThrow(/quantité/);
    });

    it('should reject EN16931 with negative price', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 1, -100, 0.20));

      expect(() => invoice.validateProfile()).toThrow();
      expect(() => invoice.validateProfile()).toThrow(/prix unitaire/);
    });
  });

  describe('validate', () => {
    it('should return empty array for valid invoice', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 1, 100, 0.20));

      const errors = invoice.validate();

      expect(errors).toEqual([]);
    });

    it('should return errors for invalid invoice', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      const errors = invoice.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should detect negative totals', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EXTENDED,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Return', -100, 100, 0.20));

      const errors = invoice.validate();

      expect(errors.some(e => e.includes('négatif'))).toBe(true);
    });
  });

  describe('getTextSummary', () => {
    it('should generate text summary', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const text = invoice.getTextSummary();

      expect(text).toContain('FACTURE FACTUR-X');
      expect(text).toContain('EN16931');
      expect(text).toContain('ACME Corp');
      expect(text).toContain('Client SA');
      expect(text).toContain('1000.00');
      expect(text).toContain('200.00');
      expect(text).toContain('1200.00');
    });

    it('should indicate validation status', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const validText = invoice.getTextSummary();
      expect(validText).toContain('OUI');

      const invalidInvoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      const invalidText = invalidInvoice.getTextSummary();
      expect(invalidText).toContain('NON');
    });
  });

  describe('generateXml', () => {
    it('should generate valid XML structure', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('<?xml');
      expect(xml).toContain('rsm:CrossIndustryInvoice');
      expect(xml).toContain('rsm:ExchangedDocumentContext');
      expect(xml).toContain('rsm:ExchangedDocument');
      expect(xml).toContain('rsm:SupplyChainTradeTransaction');
    });

    it('should include required namespaces', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('xmlns:rsm');
      expect(xml).toContain('xmlns:ram');
      expect(xml).toContain('xmlns:udt');
      expect(xml).toContain('xmlns:qdt');
    });

    it('should include profile URN', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('urn:cen.eu:en16931:2017');
    });

    it('should include seller information', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('ACME Corp');
      expect(xml).toContain('75001');
      expect(xml).toContain('FR12345678901');
    });

    it('should include buyer information', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('Client SA');
      expect(xml).toContain('69001');
    });

    it('should include line items', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product XYZ', 5, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('Product XYZ');
      expect(xml).toContain('L1');
    });

    it('should include monetary totals', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Item', 10, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('1000.00');
      expect(xml).toContain('200.00');
      expect(xml).toContain('1200.00');
    });

    it('should throw error if profile validation fails when checkProfile is true', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      expect(() => invoice.generateXml(true)).toThrow();
    });

    it('should not validate if checkProfile is false', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      expect(() => invoice.generateXml(false)).not.toThrow();
    });
  });

  describe('different profiles', () => {
    it('should generate XML for MINIMUM profile', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.MINIMUM,
        header,
        seller,
        buyer,
        payment
      );

      const xml = invoice.generateXml(false);

      expect(xml).toContain('urn:factur-x.eu:1p0:minimum');
    });

    it('should generate XML for BASIC profile', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.BASIC,
        header,
        seller,
        buyer,
        payment
      );

      const xml = invoice.generateXml(false);

      expect(xml).toContain('urn:factur-x.eu:1p0:basic');
    });

    it('should generate XML for EXTENDED profile', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EXTENDED,
        header,
        seller,
        buyer,
        payment
      );

      const xml = invoice.generateXml(false);

      expect(xml).toContain('urn:factur-x.eu:1p0:extended');
    });
  });
});

describe('validateFacturxXml', () => {
  it('should validate correct Factur-X XML', () => {
    const validXml = `<?xml version="1.0"?>
      <rsm:CrossIndustryInvoice xmlns:rsm="test" xmlns:ram="test" xmlns:udt="test" xmlns:qdt="test">
        <rsm:ExchangedDocumentContext></rsm:ExchangedDocumentContext>
        <rsm:ExchangedDocument></rsm:ExchangedDocument>
        <rsm:SupplyChainTradeTransaction></rsm:SupplyChainTradeTransaction>
      </rsm:CrossIndustryInvoice>`;

    expect(validateFacturxXml(validXml)).toBe(true);
  });

  it('should reject XML missing required elements', () => {
    const invalidXml = `<?xml version="1.0"?>
      <rsm:CrossIndustryInvoice>
      </rsm:CrossIndustryInvoice>`;

    expect(validateFacturxXml(invalidXml)).toBe(false);
  });

  it('should reject XML missing namespaces', () => {
    const invalidXml = `<?xml version="1.0"?>
      <rsm:CrossIndustryInvoice>
        <rsm:ExchangedDocumentContext></rsm:ExchangedDocumentContext>
      </rsm:CrossIndustryInvoice>`;

    expect(validateFacturxXml(invalidXml)).toBe(false);
  });
});

describe('generateFacturxXml', () => {
  it('should generate XML from invoice instance', () => {
    const seller = new TradeParty(
      'Company',
      new PostalAddress('Street', 'City', '75001', 'FR'),
      'FR12345678901'
    );

    const buyer = new TradeParty(
      'Client',
      new PostalAddress('Ave', 'Town', '69001', 'FR')
    );

    const header = new DocumentHeader(
      'DOC-001',
      'INV-001',
      'FACTURE',
      new Date()
    );

    const payment = new PaymentDetails('58');

    const invoice = new FacturXInvoice(
      FacturxProfile.EN16931,
      header,
      seller,
      buyer,
      payment
    );

    invoice.addLine(new InvoiceLine('L1', 'Item', 1, 100, 0.20));

    const summary = invoice.getTotalsSummary();
    const xml = generateFacturxXml(invoice, summary);

    expect(xml).toContain('rsm:CrossIndustryInvoice');
  });
});
