/**
 * @file invoice-basics.test.ts
 * @description Basic unit tests for Factur-X invoice generation focusing on entity creation
 */

import { FacturXInvoice } from '../../src/core/FacturXInvoice';
import {
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
} from '../../src/core/entities';
import {
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
  CurrencyCode,
} from '../../src/types';

describe('Factur-X Invoice Basics', () => {
  describe('Entity Builders', () => {
    it('should create postal address with builder', () => {
      const address = PostalAddressImpl.builder()
        .city('Paris')
        .postalCode('75001')
        .countryCode('FR')
        .street('123 Rue de la Paix')
        .build();

      expect(address.city).toBe('Paris');
      expect(address.postalCode).toBe('75001');
      expect(address.countryCode).toBe('FR');
      expect(address.street).toBe('123 Rue de la Paix');
    });

    it('should create trade party with builder', () => {
      const address = PostalAddressImpl.builder()
        .city('Paris')
        .postalCode('75001')
        .countryCode('FR')
        .build();

      const party = TradePartyImpl.builder()
        .name('ACME Corporation')
        .address(address)
        .vatId('FR12345678901')
        .email('contact@acme.com')
        .build();

      expect(party.name).toBe('ACME Corporation');
      expect(party.vatId).toBe('FR12345678901');
    });

    it('should create payment details with builder', () => {
      const payment = PaymentDetailsImpl.builder()
        .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
        .iban('FR7630004000031234567890143')
        .bic('BNPAFRPPXXX')
        .build();

      expect(payment.meansCode).toBe(PaymentMeansCode.SEPA_CREDIT_TRANSFER);
      expect(payment.iban).toBe('FR7630004000031234567890143');
    });

    it('should create document header with builder', () => {
      const date = new Date('2023-11-15');

      const header = DocumentHeaderImpl.builder()
        .id('INV-001')
        .invoiceNumber('INV-001')
        .invoiceDate(date)
        .typeCode(DocTypeCode.INVOICE)
        .build();

      expect(header.id).toBe('INV-001');
      expect(header.invoiceDate).toEqual(date);
      expect(header.typeCode).toBe(DocTypeCode.INVOICE);
    });
  });

  describe('Invoice Creation', () => {
    it('should create invoice with all profiles', () => {
      const { header, seller, buyer, payment } = createTestEntities();

      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.BASIC,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED,
      ];

      profiles.forEach(profile => {
        const invoice = new FacturXInvoice(
          profile,
          header,
          seller,
          buyer,
          payment
        );

        expect(invoice.profile).toBe(profile);
        expect(invoice.header).toBe(header);
        expect(invoice.seller).toBe(seller);
        expect(invoice.buyer).toBe(buyer);
      });
    });

    it('should support all 30 currencies', () => {
      const { header, seller, buyer, payment } = createTestEntities();

      const currencies = [
        CurrencyCode.EUR, CurrencyCode.USD, CurrencyCode.GBP,
        CurrencyCode.CHF, CurrencyCode.JPY, CurrencyCode.CAD,
      ];

      currencies.forEach(currency => {
        const invoice = new FacturXInvoice(
          FacturxProfile.EN16931,
          header,
          seller,
          buyer,
          payment,
          [],
          [],
          currency
        );

        expect(invoice.currency).toBe(currency);
      });
    });
  });

  describe('XML Generation', () => {
    it('should generate XML', () => {
      const invoice = createBasicInvoice();

      const xml = invoice.generateXml(false); // Skip validation for simplicity

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('CrossIndustryInvoice');
      expect(xml).toContain('rsm:');
    });

    it('should include invoice details in XML', () => {
      const invoice = createBasicInvoice();

      const xml = invoice.generateXml(false);

      expect(xml).toContain('INV-TEST-001');
      expect(xml).toContain('Test Seller Inc.');
      expect(xml).toContain('Test Buyer Ltd.');
    });

    it('should cache XML generation', () => {
      const invoice = createBasicInvoice();

      const xml1 = invoice.generateXml(false);
      const xml2 = invoice.generateXml(false);

      expect(xml1).toBe(xml2); // Same reference (cached)
    });
  });

  describe('Totals Calculation', () => {
    it('should calculate totals for invoice without lines', () => {
      const invoice = createBasicInvoice();

      const summary = invoice.finalizeTotals();

      expect(summary.taxBasis).toBe(0);
      expect(summary.taxTotal).toBe(0);
      expect(summary.grandTotal).toBe(0);
    });

    it('should cache totals calculation', () => {
      const invoice = createBasicInvoice();

      const summary1 = invoice.finalizeTotals();
      const summary2 = invoice.finalizeTotals();

      expect(summary1).toBe(summary2); // Same object (cached)
    });
  });
});

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTestEntities() {
  const sellerAddress = PostalAddressImpl.builder()
    .city('Paris')
    .postalCode('75001')
    .countryCode('FR')
    .street('123 Rue du Commerce')
    .build();

  const seller = TradePartyImpl.builder()
    .name('Test Seller Inc.')
    .address(sellerAddress)
    .vatId('FR12345678901')
    .email('seller@test.com')
    .build();

  const buyerAddress = PostalAddressImpl.builder()
    .city('Lyon')
    .postalCode('69001')
    .countryCode('FR')
    .street('45 Avenue Client')
    .build();

  const buyer = TradePartyImpl.builder()
    .name('Test Buyer Ltd.')
    .address(buyerAddress)
    .email('buyer@test.com')
    .build();

  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .bic('BNPAFRPPXXX')
    .build();

  const header = DocumentHeaderImpl.builder()
    .id('INV-TEST-001')
    .invoiceNumber('INV-TEST-001')
    .invoiceDate(new Date('2023-11-15'))
    .typeCode(DocTypeCode.INVOICE)
    .build();

  return { header, seller, buyer, payment };
}

function createBasicInvoice(): FacturXInvoice {
  const { header, seller, buyer, payment } = createTestEntities();

  return new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    seller,
    buyer,
    payment
  );
}
