// src/__tests__/FacturXInvoice.test.ts

import { FacturXInvoice } from '../core/FacturXInvoice';
import { DocumentHeader } from '../core/DocumentHeader';
import { PostalAddress, TradeParty } from '../core/HeaderTradeAgreement';
import { PaymentDetails } from '../core/PaymentDetails';
import { InvoiceLine } from '../core/InvoiceLine';
import { AllowanceCharge } from '../core/AllowanceCharge';
import { FacturxProfile, DocTypeCode, TaxCategoryCode } from '../core/EnumInvoiceType';

describe('FacturXInvoice', () => {
  // Helper function to create test data
  const createTestInvoice = (profile: FacturxProfile = FacturxProfile.EN16931) => {
    const sellerAddress = new PostalAddress('123 Seller St', 'Paris', '75001', 'FR');
    const seller = new TradeParty('Seller Company', sellerAddress, 'FR12345678901');

    const buyerAddress = new PostalAddress('456 Buyer Ave', 'Lyon', '69001', 'FR');
    const buyer = new TradeParty('Buyer Company', buyerAddress, 'FR98765432100');

    const header = new DocumentHeader(
      'INV-001',
      'FA-2025-001',
      'FACTURE',
      new Date('2025-01-15'),
      new Date('2025-01-15')
    );

    const payment = new PaymentDetails(
      '58',
      'FR7630004000031234567890143',
      'BNPAFRPPXXX',
      new Date('2025-02-15')
    );

    return new FacturXInvoice(profile, header, seller, buyer, payment);
  };

  describe('Constructor', () => {
    it('should create invoice with all parameters', () => {
      const invoice = createTestInvoice();

      expect(invoice).toBeDefined();
      expect(invoice.profile).toBe(FacturxProfile.EN16931);
      expect(invoice.header.invoiceNumber).toBe('FA-2025-001');
      expect(invoice.seller.name).toBe('Seller Company');
      expect(invoice.buyer.name).toBe('Buyer Company');
      expect(invoice.payment.payeeIBAN).toBe('FR7630004000031234567890143');
    });

    it('should initialize empty lines array', () => {
      const invoice = createTestInvoice();
      expect(invoice.lines).toEqual([]);
      expect(invoice.lines).toHaveLength(0);
    });

    it('should initialize empty docAllowanceCharges array', () => {
      const invoice = createTestInvoice();
      expect(invoice.docAllowanceCharges).toEqual([]);
      expect(invoice.docAllowanceCharges).toHaveLength(0);
    });

    it('should set EUR as default currency', () => {
      const invoice = createTestInvoice();
      expect(invoice.currency).toBe('EUR');
    });

    it('should create invoice with different profiles', () => {
      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.BASIC,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED
      ];

      profiles.forEach(profile => {
        const invoice = createTestInvoice(profile);
        expect(invoice.profile).toBe(profile);
      });
    });
  });

  describe('Adding lines', () => {
    it('should add a single line', () => {
      const invoice = createTestInvoice();
      const line = new InvoiceLine('1', 'Product A', 1, 100, 0.20);

      invoice.lines.push(line);

      expect(invoice.lines).toHaveLength(1);
      expect(invoice.lines[0]).toBe(line);
    });

    it('should add multiple lines', () => {
      const invoice = createTestInvoice();

      invoice.lines.push(new InvoiceLine('1', 'Product A', 2, 50, 0.20));
      invoice.lines.push(new InvoiceLine('2', 'Product B', 1, 100, 0.20));
      invoice.lines.push(new InvoiceLine('3', 'Product C', 3, 30, 0.10));

      expect(invoice.lines).toHaveLength(3);
      expect(invoice.lines[0].id).toBe('1');
      expect(invoice.lines[1].id).toBe('2');
      expect(invoice.lines[2].id).toBe('3');
    });
  });

  describe('Adding document allowances and charges', () => {
    it('should add document level allowance', () => {
      const invoice = createTestInvoice();
      const allowance = new AllowanceCharge(false, 50, 'Discount', 'DISC', 0.20);

      invoice.docAllowanceCharges.push(allowance);

      expect(invoice.docAllowanceCharges).toHaveLength(1);
      expect(invoice.docAllowanceCharges[0]).toBe(allowance);
    });

    it('should add document level charge', () => {
      const invoice = createTestInvoice();
      const charge = new AllowanceCharge(true, 25, 'Shipping', 'SHIP', 0.20);

      invoice.docAllowanceCharges.push(charge);

      expect(invoice.docAllowanceCharges).toHaveLength(1);
      expect(invoice.docAllowanceCharges[0].chargeIndicator).toBe(true);
    });

    it('should add both allowances and charges', () => {
      const invoice = createTestInvoice();

      invoice.docAllowanceCharges.push(new AllowanceCharge(false, 50, 'Discount', 'DISC', 0.20));
      invoice.docAllowanceCharges.push(new AllowanceCharge(true, 25, 'Shipping', 'SHIP', 0.20));

      expect(invoice.docAllowanceCharges).toHaveLength(2);
    });
  });

  describe('finalizeTotals method', () => {
    it('should calculate totals for simple invoice', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(100);
      expect(summary.taxTotal).toBe(20);
      expect(summary.grandTotal).toBe(120);
    });

    it('should calculate totals with multiple lines', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 2, 50, 0.20));
      invoice.lines.push(new InvoiceLine('2', 'Product B', 1, 100, 0.20));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(200);
      expect(summary.taxTotal).toBe(40);
      expect(summary.grandTotal).toBe(240);
    });

    it('should calculate totals with document allowance', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));
      invoice.docAllowanceCharges.push(new AllowanceCharge(false, 10, 'Discount', 'DISC', 0.20));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(90);
      expect(summary.taxTotal).toBe(18);
      expect(summary.grandTotal).toBe(108);
    });

    it('should calculate totals with document charge', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));
      invoice.docAllowanceCharges.push(new AllowanceCharge(true, 20, 'Shipping', 'SHIP', 0.20));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(100);
      expect(summary.taxBasis).toBe(120);
      expect(summary.taxTotal).toBe(24);
      expect(summary.grandTotal).toBe(144);
    });

    it('should calculate totals with multiple VAT rates', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));
      invoice.lines.push(new InvoiceLine('2', 'Product B', 1, 100, 0.10));
      invoice.lines.push(new InvoiceLine('3', 'Product C', 1, 100, 0.055));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(300);
      expect(summary.taxTotal).toBeCloseTo(35.5, 2);
      expect(summary.grandTotal).toBeCloseTo(335.5, 2);
      expect(summary.taxSummaries).toHaveLength(3);
    });

    it('should return empty summary for invoice without lines', () => {
      const invoice = createTestInvoice();
      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(0);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
    });
  });

  describe('generateXml method', () => {
    it('should generate XML for simple invoice', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
      expect(xml.length).toBeGreaterThan(0);
    });

    it('should include invoice number in XML', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('INV-001'); // header.id is used in XML
    });

    it('should include seller name in XML', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('Seller Company');
    });

    it('should include buyer name in XML', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('Buyer Company');
    });

    it('should include CrossIndustryInvoice root element', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml();

      expect(xml).toContain('CrossIndustryInvoice');
    });

    it('should generate pretty printed XML when flag is true', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));

      const xml = invoice.generateXml(true);

      // Pretty printed XML should have newlines
      expect(xml).toContain('\n');
    });

    it('should generate compact XML when flag is false', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product A', 1, 100, 0.20));

      const xmlCompact = invoice.generateXml(false);
      const xmlPretty = invoice.generateXml(true);

      // Both should generate valid XML
      expect(xmlCompact).toBeDefined();
      expect(xmlPretty).toBeDefined();
      expect(xmlCompact.length).toBeGreaterThan(0);
      expect(xmlPretty.length).toBeGreaterThan(0);
      expect(xmlCompact).toContain('CrossIndustryInvoice');
      expect(xmlPretty).toContain('CrossIndustryInvoice');
    });
  });

  describe('Currency', () => {
    it('should use EUR by default', () => {
      const invoice = createTestInvoice();
      expect(invoice.currency).toBe('EUR');
    });

    it('should allow changing currency', () => {
      const invoice = createTestInvoice();
      invoice.currency = 'USD';
      expect(invoice.currency).toBe('USD');
    });

    it('should handle different currencies', () => {
      const currencies = ['EUR', 'USD', 'GBP', 'CHF', 'JPY'];
      currencies.forEach(currency => {
        const invoice = createTestInvoice();
        invoice.currency = currency;
        expect(invoice.currency).toBe(currency);
      });
    });
  });

  describe('Document type', () => {
    it('should use INVOICE (380) by default', () => {
      const invoice = createTestInvoice();
      expect(invoice.header.typeCode).toBe(DocTypeCode.INVOICE);
    });

    it('should handle credit note type', () => {
      const sellerAddress = new PostalAddress('123 St', 'Paris', '75001', 'FR');
      const seller = new TradeParty('Seller', sellerAddress);
      const buyerAddress = new PostalAddress('456 Ave', 'Lyon', '69001', 'FR');
      const buyer = new TradeParty('Buyer', buyerAddress);
      const header = new DocumentHeader(
        'CN-001', 'AVOIR-001', 'AVOIR', new Date(), new Date(), DocTypeCode.CREDIT_NOTE
      );
      const payment = new PaymentDetails('58', 'FR123', 'BIC', new Date());

      const creditNote = new FacturXInvoice(FacturxProfile.EN16931, header, seller, buyer, payment);

      expect(creditNote.header.typeCode).toBe(DocTypeCode.CREDIT_NOTE);
      expect(creditNote.header.typeCode).toBe('381');
    });

    it('should handle pro forma type', () => {
      const sellerAddress = new PostalAddress('123 St', 'Paris', '75001', 'FR');
      const seller = new TradeParty('Seller', sellerAddress);
      const buyerAddress = new PostalAddress('456 Ave', 'Lyon', '69001', 'FR');
      const buyer = new TradeParty('Buyer', buyerAddress);
      const header = new DocumentHeader(
        'DEV-001', 'DEVIS-001', 'DEVIS', new Date(), new Date(), DocTypeCode.PRO_FORMAT
      );
      const payment = new PaymentDetails('58', 'FR123', 'BIC');

      const quote = new FacturXInvoice(FacturxProfile.EN16931, header, seller, buyer, payment);

      expect(quote.header.typeCode).toBe(DocTypeCode.PRO_FORMAT);
      expect(quote.header.typeCode).toBe('384');
    });
  });

  describe('Real-world scenarios', () => {
    it('should create complete B2B invoice', () => {
      const sellerAddress = new PostalAddress('123 Rue du Commerce', 'Paris', '75010', 'FR', 'Bât A');
      const seller = new TradeParty('Mon Entreprise SAS', sellerAddress, 'FR12345678901');

      const buyerAddress = new PostalAddress('45 Avenue Client', 'Lyon', '69002', 'FR', 'Étage 3');
      const buyer = new TradeParty('Client XYZ SARL', buyerAddress, 'FR98765432100');

      const header = new DocumentHeader(
        'INT-2025-001',
        'FA-2025-001',
        'FACTURE',
        new Date('2025-04-10'),
        new Date('2025-04-10')
      );

      const payment = new PaymentDetails(
        '58',
        'FR7630004000031234567890143',
        'BNPAFRPPXXX',
        new Date('2025-05-10'),
        'Paiement sous 30 jours fin de mois'
      );

      const invoice = new FacturXInvoice(FacturxProfile.EN16931, header, seller, buyer, payment);

      // Add lines
      invoice.lines.push(new InvoiceLine('1', 'Prestation de conseil stratégique', 5, 800, 0.20, TaxCategoryCode.STANDARD, 'DAY'));
      invoice.lines.push(new InvoiceLine('2', 'Formation équipe', 3, 450, 0.20, TaxCategoryCode.STANDARD, 'HUR'));
      invoice.lines.push(new InvoiceLine('3', 'Licence logicielle annuelle', 10, 120, 0.20, TaxCategoryCode.STANDARD, 'C62'));

      // Add discount
      invoice.docAllowanceCharges.push(new AllowanceCharge(false, 250, 'Remise commerciale 5%', 'DISC5', 0.20));

      const summary = invoice.finalizeTotals();

      expect(summary.lineTotal).toBe(6550); // 5*800 + 3*450 + 10*120 = 4000 + 1350 + 1200
      expect(summary.taxBasis).toBe(6300); // 6550 - 250
      expect(summary.taxTotal).toBe(1260); // 6300 * 0.20
      expect(summary.grandTotal).toBe(7560); // 6300 + 1260
    });

    it('should create quote (pro forma)', () => {
      const sellerAddress = new PostalAddress('123 Street', 'Paris', '75001', 'FR');
      const seller = new TradeParty('My Company', sellerAddress, 'FR12345678901');

      const buyerAddress = new PostalAddress('456 Avenue', 'Lyon', '69001', 'FR');
      const buyer = new TradeParty('Prospect', buyerAddress);

      const header = new DocumentHeader(
        'DEV-2025-042',
        'DEVIS-2025-042',
        'DEVIS',
        new Date('2025-04-10'),
        new Date('2025-04-10'),
        DocTypeCode.PRO_FORMAT
      );
      header.addNote('Devis valable 30 jours');
      header.addNote('Acompte de 30% à la commande');

      const payment = new PaymentDetails('58', 'FR123', 'BIC', undefined, 'Acompte 30% - Solde 30j');

      const quote = new FacturXInvoice(FacturxProfile.EN16931, header, seller, buyer, payment);

      quote.lines.push(new InvoiceLine('1', 'Développement application web', 40, 650, 0.20, TaxCategoryCode.STANDARD, 'DAY'));
      quote.lines.push(new InvoiceLine('2', 'Design UI/UX', 10, 550, 0.20, TaxCategoryCode.STANDARD, 'DAY'));

      quote.docAllowanceCharges.push(new AllowanceCharge(false, 1500, 'Remise lancement', 'PROMO', 0.20));

      const summary = quote.finalizeTotals();

      expect(header.typeCode).toBe('384');
      expect(header.notes).toHaveLength(2);
      expect(summary.grandTotal).toBeGreaterThan(0);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle invoice with no lines', () => {
      const invoice = createTestInvoice();
      const summary = invoice.finalizeTotals();
      expect(summary.grandTotal).toBe(0);
    });

    it('should handle very large invoice', () => {
      const invoice = createTestInvoice();

      // Add 100 lines
      for (let i = 1; i <= 100; i++) {
        invoice.lines.push(new InvoiceLine(i.toString(), `Product ${i}`, 1, 10, 0.20));
      }

      const summary = invoice.finalizeTotals();
      expect(summary.lineTotal).toBe(1000);
      expect(invoice.lines).toHaveLength(100);
    });

    it('should handle invoice with many allowances and charges', () => {
      const invoice = createTestInvoice();
      invoice.lines.push(new InvoiceLine('1', 'Product', 1, 1000, 0.20));

      // Add 10 allowances
      for (let i = 1; i <= 10; i++) {
        invoice.docAllowanceCharges.push(new AllowanceCharge(false, 10, `Discount ${i}`, `DISC${i}`, 0.20));
      }

      // Add 10 charges
      for (let i = 1; i <= 10; i++) {
        invoice.docAllowanceCharges.push(new AllowanceCharge(true, 5, `Charge ${i}`, `CHG${i}`, 0.20));
      }

      expect(invoice.docAllowanceCharges).toHaveLength(20);
      const summary = invoice.finalizeTotals();
      expect(summary.grandTotal).toBeGreaterThan(0);
    });
  });

  describe('Profile-specific behavior', () => {
    it('should create MINIMUM profile invoice', () => {
      const invoice = createTestInvoice(FacturxProfile.MINIMUM);
      expect(invoice.profile).toBe(FacturxProfile.MINIMUM);
    });

    it('should create BASIC profile invoice', () => {
      const invoice = createTestInvoice(FacturxProfile.BASIC);
      expect(invoice.profile).toBe(FacturxProfile.BASIC);
    });

    it('should create EN16931 profile invoice', () => {
      const invoice = createTestInvoice(FacturxProfile.EN16931);
      expect(invoice.profile).toBe(FacturxProfile.EN16931);
    });

    it('should create EXTENDED profile invoice', () => {
      const invoice = createTestInvoice(FacturxProfile.EXTENDED);
      expect(invoice.profile).toBe(FacturxProfile.EXTENDED);
    });
  });
});
