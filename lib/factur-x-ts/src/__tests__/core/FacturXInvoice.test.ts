import { FacturXInvoice } from '../../core/FacturXInvoice';
import {
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLine,
  AllowanceCharge,
} from '../../core/entities';
import { FacturxProfile, DocTypeCode, PaymentMeansCode } from '../../types';

describe('FacturXInvoice', () => {
  let seller: TradePartyImpl;
  let buyer: TradePartyImpl;
  let header: DocumentHeaderImpl;
  let payment: PaymentDetailsImpl;

  beforeEach(() => {
    const sellerAddr = new PostalAddressImpl('Paris', '75001', 'FR', '123 Rue de Rivoli');
    seller = new TradePartyImpl(
      'ACME Corp',
      sellerAddr,
      undefined,
      'FR12345678901'
    );

    const buyerAddr = new PostalAddressImpl('London', 'SW1A 1AA', 'GB', '10 Downing Street');
    buyer = new TradePartyImpl(
      'Client Ltd',
      buyerAddr,
      undefined,
      'GB123456789'
    );

    header = new DocumentHeaderImpl(
      'INV-001',
      'INV-2025-001',
      'INVOICE',
      new Date('2025-01-15'),
      DocTypeCode.INVOICE
    );

    payment = new PaymentDetailsImpl(
      PaymentMeansCode.SEPA_CREDIT_TRANSFER,
      'FR1234567890123456789012345',
      'BNPAFRPP'
    );
  });

  describe('constructor', () => {
    it('should create invoice with required fields', () => {
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
      expect(invoice.docAllowancesCharges).toEqual([]);
    });

    it('should create invoice with all optional fields', () => {
      const lines = [new InvoiceLine('L1', 'Product A', 1, 100, 0.20)];
      const docAC = [AllowanceCharge.allowance(10)];

      const invoice = new FacturXInvoice(
        FacturxProfile.EXTENDED,
        header,
        seller,
        buyer,
        payment,
        lines,
        docAC,
        'USD'
      );

      expect(invoice.lines).toBe(lines);
      expect(invoice.docAllowancesCharges).toBe(docAC);
      expect(invoice.currency).toBe('USD');
    });
  });

  describe('addLine', () => {
    it('should add line to invoice', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
      invoice.addLine(line);

      expect(invoice.lines).toContain(line);
      expect(invoice.lines.length).toBe(1);
    });

    it('should invalidate caches when adding line', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      // First call to create cache
      const totals1 = invoice.finalizeTotals();
      const xml1 = invoice.generateXml(false);

      // Add line
      const line = new InvoiceLine('L1', 'Product A', 1, 100, 0.20);
      invoice.addLine(line);

      // Totals should be recalculated
      const totals2 = invoice.finalizeTotals();
      expect(totals2.lineTotal).not.toBe(totals1.lineTotal);

      // XML should be regenerated
      const xml2 = invoice.generateXml(false);
      expect(xml2).not.toBe(xml1);
    });
  });

  describe('addDocAllowanceCharge', () => {
    it('should add document allowance/charge', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      const allowance = AllowanceCharge.allowance(50);
      invoice.addDocAllowanceCharge(allowance);

      expect(invoice.docAllowancesCharges).toContain(allowance);
    });

    it('should invalidate caches when adding allowance/charge', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const totals1 = invoice.finalizeTotals();
      invoice.addDocAllowanceCharge(AllowanceCharge.allowance(10));
      const totals2 = invoice.finalizeTotals();

      expect(totals2.taxBasis).not.toBe(totals1.taxBasis);
    });
  });

  describe('finalizeTotals', () => {
    it('should compute totals', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 2, 100, 0.20));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(200);
      expect(summary.taxTotal).toBe(40);
      expect(summary.grandTotal).toBe(240);
    });

    it('should cache totals', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const summary1 = invoice.finalizeTotals();
      const summary2 = invoice.finalizeTotals();

      // Should return same cached object
      expect(summary1).toBe(summary2);
    });
  });

  describe('totals getter', () => {
    it('should return finalized totals', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      expect(invoice.totals.lineTotal).toBe(100);
      expect(invoice.totals.taxTotal).toBe(20);
    });
  });

  describe('validateProfile', () => {
    describe('MINIMUM profile', () => {
      it('should forbid lines', () => {
        const invoice = new FacturXInvoice(
          FacturxProfile.MINIMUM,
          header,
          seller,
          buyer,
          payment
        );

        invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

        expect(() => invoice.validateProfile()).toThrow(
          `[Factur-X] Profile ${FacturxProfile.MINIMUM} forbids field 'lines'`
        );
      });

      it('should forbid payment.iban', () => {
        const invoice = new FacturXInvoice(
          FacturxProfile.MINIMUM,
          header,
          seller,
          buyer,
          payment // has IBAN
        );

        expect(() => invoice.validateProfile()).toThrow(
          `[Factur-X] Profile ${FacturxProfile.MINIMUM} forbids field 'payment.iban'`
        );
      });

      it('should pass with minimal data', () => {
        const minPayment = new PaymentDetailsImpl(PaymentMeansCode.CASH);
        const invoice = new FacturXInvoice(
          FacturxProfile.MINIMUM,
          header,
          seller,
          buyer,
          minPayment
        );

        expect(() => invoice.validateProfile()).not.toThrow();
      });
    });

    describe('BASICWL profile', () => {
      it('should forbid lines', () => {
        const invoice = new FacturXInvoice(
          FacturxProfile.BASICWL,
          header,
          seller,
          buyer,
          payment
        );

        invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

        expect(() => invoice.validateProfile()).toThrow(
          `[Factur-X] Profile ${FacturxProfile.BASICWL} forbids field 'lines'`
        );
      });

      it('should pass without lines', () => {
        const invoice = new FacturXInvoice(
          FacturxProfile.BASICWL,
          header,
          seller,
          buyer,
          payment
        );

        expect(() => invoice.validateProfile()).not.toThrow();
      });
    });

    describe('BASIC profile', () => {
      it('should require lines', () => {
        const invoice = new FacturXInvoice(
          FacturxProfile.BASIC,
          header,
          seller,
          buyer,
          payment
        );

        expect(() => invoice.validateProfile()).toThrow(
          `[Factur-X] Profile ${FacturxProfile.BASIC} requires field 'lines'`
        );
      });

      it('should pass with lines', () => {
        const invoice = new FacturXInvoice(
          FacturxProfile.BASIC,
          header,
          seller,
          buyer,
          payment
        );

        invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

        expect(() => invoice.validateProfile()).not.toThrow();
      });
    });

    describe('EN16931 profile', () => {
      it('should require payment.meansCode', () => {
        // EN16931 requires payment.meansCode field
        const invoice = new FacturXInvoice(
          FacturxProfile.EN16931,
          header,
          seller,
          buyer,
          payment
        );

        invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

        // This should pass - all required fields are present
        expect(() => invoice.validateProfile()).not.toThrow();
      });

      it('should pass with complete address', () => {
        const invoice = new FacturXInvoice(
          FacturxProfile.EN16931,
          header,
          seller,
          buyer,
          payment
        );

        invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

        expect(() => invoice.validateProfile()).not.toThrow();
      });
    });
  });

  describe('generateXml', () => {
    it('should generate valid XML', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('rsm:CrossIndustryInvoice');
      expect(xml).toContain('INV-001'); // Header ID
      expect(xml).toContain('ACME Corp');
      expect(xml).toContain('Client Ltd');
    });

    it('should validate profile by default', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.BASIC,
        header,
        seller,
        buyer,
        payment
      );

      // No lines added - should fail validation
      expect(() => invoice.generateXml()).toThrow(
        `[Factur-X] Profile ${FacturxProfile.BASIC} requires field 'lines'`
      );
    });

    it('should skip validation when checkProfile is false', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.BASIC,
        header,
        seller,
        buyer,
        payment
      );

      // Should not throw even without lines
      const xml = invoice.generateXml(false);
      expect(xml).toContain('rsm:CrossIndustryInvoice');
    });

    it('should cache XML', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml1 = invoice.generateXml();
      const xml2 = invoice.generateXml();

      expect(xml1).toBe(xml2);
    });

    it('should include guideline URN', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931');
    });

    it('should include document header', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:ID>INV-001</ram:ID>');
      expect(xml).toContain('<ram:TypeCode>380</ram:TypeCode>');
      expect(xml).toContain('<ram:Name>INVOICE</ram:Name>');
      expect(xml).toContain('20250115'); // Date format
    });

    it('should include notes if present', () => {
      const headerWithNotes = new DocumentHeaderImpl(
        'INV-001',
        'INV-2025-001',
        'INVOICE',
        new Date('2025-01-15'),
        DocTypeCode.INVOICE,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        ['Note 1', 'Note 2']
      );

      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        headerWithNotes,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('Note 1');
      expect(xml).toContain('Note 2');
      expect(xml).toContain('ram:IncludedNote');
    });

    it('should include seller details', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('ACME Corp');
      expect(xml).toContain('75001');
      expect(xml).toContain('123 Rue de Rivoli');
      expect(xml).toContain('Paris');
      expect(xml).toContain('FR12345678901');
    });

    it('should include buyer details', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('Client Ltd');
      expect(xml).toContain('SW1A 1AA');
      expect(xml).toContain('10 Downing Street');
      expect(xml).toContain('London');
      expect(xml).toContain('GB123456789');
    });

    it('should include currency code', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment,
        [],
        [],
        'USD'
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:InvoiceCurrencyCode>USD</ram:InvoiceCurrencyCode>');
    });

    it('should include tax breakdown', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:ApplicableTradeTax>');
      expect(xml).toContain('<ram:CalculatedAmount>20.00</ram:CalculatedAmount>');
      expect(xml).toContain('<ram:TypeCode>VAT</ram:TypeCode>');
      expect(xml).toContain('<ram:BasisAmount>100.00</ram:BasisAmount>');
      expect(xml).toContain('<ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>');
    });

    it('should include monetary summation', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 2, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:LineTotalAmount>200.00</ram:LineTotalAmount>');
      expect(xml).toContain('<ram:TaxBasisTotalAmount>200.00</ram:TaxBasisTotalAmount>');
      expect(xml).toContain('<ram:TaxTotalAmount>40.00</ram:TaxTotalAmount>');
      expect(xml).toContain('<ram:GrandTotalAmount>240.00</ram:GrandTotalAmount>');
      expect(xml).toContain('<ram:DuePayableAmount>240.00</ram:DuePayableAmount>');
    });

    it('should include payment means with IBAN and BIC', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:TypeCode>58</ram:TypeCode>'); // SEPA_CREDIT_TRANSFER
      expect(xml).toContain('<ram:IBANID>FR1234567890123456789012345</ram:IBANID>');
      expect(xml).toContain('<ram:BICID>BNPAFRPP</ram:BICID>');
    });

    it('should include payment means without IBAN', () => {
      const cashPayment = new PaymentDetailsImpl(PaymentMeansCode.CASH);
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        cashPayment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:TypeCode>10</ram:TypeCode>'); // CASH
      expect(xml).not.toContain('IBANID');
    });

    it('should include payment terms with due date', () => {
      const paymentWithDueDate = new PaymentDetailsImpl(
        PaymentMeansCode.SEPA_CREDIT_TRANSFER,
        'FR12345',
        'BNPAFRPP',
        undefined,
        new Date('2025-02-15'),
        'Net 30 days'
      );

      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        paymentWithDueDate
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:SpecifiedTradePaymentTerms>');
      expect(xml).toContain('20250215'); // Due date
      expect(xml).toContain('<ram:Description>Net 30 days</ram:Description>');
    });

    it('should include line items for EN16931 profile', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 2, 100, 0.20, 'S', 'C62'));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:IncludedSupplyChainTradeLineItem>');
      expect(xml).toContain('<ram:LineID>L1</ram:LineID>');
      expect(xml).toContain('<ram:Name>Product A</ram:Name>');
      expect(xml).toContain('<ram:ChargeAmount>100.00</ram:ChargeAmount>');
      expect(xml).toContain('<ram:BilledQuantity unitCode="C62">2</ram:BilledQuantity>');
      expect(xml).toContain('<ram:LineTotalAmount>200.00</ram:LineTotalAmount>');
    });

    it('should NOT include line items for MINIMUM profile', () => {
      const minPayment = new PaymentDetailsImpl(PaymentMeansCode.CASH);
      const invoice = new FacturXInvoice(
        FacturxProfile.MINIMUM,
        header,
        seller,
        buyer,
        minPayment
      );

      const xml = invoice.generateXml();
      expect(xml).not.toContain('<ram:IncludedSupplyChainTradeLineItem>');
    });

    it('should NOT include line items for BASICWL profile', () => {
      const invoice = new FacturXInvoice(
        FacturxProfile.BASICWL,
        header,
        seller,
        buyer,
        payment
      );

      const xml = invoice.generateXml();
      expect(xml).not.toContain('<ram:IncludedSupplyChainTradeLineItem>');
    });

    it('should handle seller without VAT ID', () => {
      const sellerNoVat = new TradePartyImpl(
        'ACME Corp',
        new PostalAddressImpl('Paris', '75001', 'FR')
      );

      const invoice = new FacturXInvoice(
        FacturxProfile.BASIC, // Use BASIC profile which doesn't require VAT
        header,
        sellerNoVat,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('ACME Corp');
      // Should not contain SpecifiedTaxRegistration section for seller
      const sellerSection = xml.substring(xml.indexOf('SellerTradeParty'), xml.indexOf('BuyerTradeParty'));
      expect(sellerSection).not.toContain('SpecifiedTaxRegistration');
    });

    it('should handle buyer without VAT ID', () => {
      const buyerNoVat = new TradePartyImpl(
        'Client Ltd',
        new PostalAddressImpl('London', 'SW1A 1AA', 'GB')
      );

      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        seller,
        buyerNoVat,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('Client Ltd');
      expect(xml).not.toContain('GB123456789');
    });

    it('should handle address with additional street', () => {
      const addrWithExtra = new PostalAddressImpl(
        'Paris',
        '75001',
        'FR',
        'Street 1',
        'Street 2'
      );
      const sellerWithExtra = new TradePartyImpl('ACME', addrWithExtra);

      const invoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        header,
        sellerWithExtra,
        buyer,
        payment
      );

      invoice.addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();
      expect(xml).toContain('<ram:LineOne>Street 1</ram:LineOne>');
      expect(xml).toContain('<ram:LineTwo>Street 2</ram:LineTwo>');
    });
  });

  describe('builder', () => {
    it('should create invoice with builder', () => {
      const invoice = FacturXInvoice.builder(FacturxProfile.EN16931)
        .header(header)
        .seller(seller)
        .buyer(buyer)
        .payment(payment)
        .addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20))
        .build();

      expect(invoice.profile).toBe(FacturxProfile.EN16931);
      expect(invoice.header).toBe(header);
      expect(invoice.lines.length).toBe(1);
    });

    it('should add multiple lines', () => {
      const invoice = FacturXInvoice.builder(FacturxProfile.EN16931)
        .header(header)
        .seller(seller)
        .buyer(buyer)
        .payment(payment)
        .addLine(new InvoiceLine('L1', 'Product A', 1, 100, 0.20))
        .addLine(new InvoiceLine('L2', 'Product B', 2, 50, 0.20))
        .build();

      expect(invoice.lines.length).toBe(2);
    });

    it('should add document allowances/charges', () => {
      const invoice = FacturXInvoice.builder(FacturxProfile.EN16931)
        .header(header)
        .seller(seller)
        .buyer(buyer)
        .payment(payment)
        .addDocAllowanceCharge(AllowanceCharge.allowance(50))
        .build();

      expect(invoice.docAllowancesCharges.length).toBe(1);
    });

    it('should throw if header is missing', () => {
      expect(() =>
        FacturXInvoice.builder(FacturxProfile.EN16931)
          .seller(seller)
          .buyer(buyer)
          .payment(payment)
          .build()
      ).toThrow('Header, seller, buyer, and payment are required');
    });

    it('should throw if seller is missing', () => {
      expect(() =>
        FacturXInvoice.builder(FacturxProfile.EN16931)
          .header(header)
          .buyer(buyer)
          .payment(payment)
          .build()
      ).toThrow('Header, seller, buyer, and payment are required');
    });

    it('should throw if buyer is missing', () => {
      expect(() =>
        FacturXInvoice.builder(FacturxProfile.EN16931)
          .header(header)
          .seller(seller)
          .payment(payment)
          .build()
      ).toThrow('Header, seller, buyer, and payment are required');
    });

    it('should throw if payment is missing', () => {
      expect(() =>
        FacturXInvoice.builder(FacturxProfile.EN16931)
          .header(header)
          .seller(seller)
          .buyer(buyer)
          .build()
      ).toThrow('Header, seller, buyer, and payment are required');
    });

    it('should support method chaining', () => {
      const builder = FacturXInvoice.builder(FacturxProfile.EN16931);
      const result = builder.header(header);
      expect(result).toBe(builder);
    });
  });
});
