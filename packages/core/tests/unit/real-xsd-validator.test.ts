/**
 * @file real-xsd-validator.test.ts
 * @description Comprehensive unit tests for the RealXsdValidator that performs
 * actual XSD validation against official Factur-X 1.07.2 schemas.
 *
 * These tests validate real XML against real XSD schemas (NOT mocked).
 * They require the XSD files to be present at src/compliance/xsd/facturx-{profile}/
 * and at least one validation engine (node-libxml, libxmljs, or xmllint CLI).
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  RealXsdValidator,
  resetEngineDetection,
} from '../../src/validation/RealXsdValidator';
import { FacturxProfile } from '../../src/types';
import { FacturXInvoice } from '../../src/core/FacturXInvoice';
import {
  DocTypeCode,
  PaymentMeansCode,
  TaxCategoryCode,
  UnitCode,
  CurrencyCode,
} from '../../src/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const COMPLIANCE_PATH = path.join(REPO_ROOT, 'src', 'compliance');

// ============================================================================
// HELPERS - Create valid XML for each profile
// ============================================================================

/**
 * Create a fully valid Factur-X MINIMUM XML that passes XSD validation.
 * MINIMUM profile requires:
 * - ExchangedDocumentContext with GuidelineSpecifiedDocumentContextParameter
 * - ExchangedDocument with ID, TypeCode, IssueDateTime
 * - SupplyChainTradeTransaction with:
 *   - ApplicableHeaderTradeAgreement (SellerTradeParty, BuyerTradeParty with Name)
 *   - ApplicableHeaderTradeDelivery (empty element allowed in MINIMUM)
 *   - ApplicableHeaderTradeSettlement (InvoiceCurrencyCode, MonetarySummation)
 */
function createMinimumXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-MIN-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20240115</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Seller Company SA</ram:Name>
        <ram:PostalTradeAddress>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">FR12345678901</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Buyer Company Ltd</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>1200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/**
 * Create a fully valid Factur-X BASICWL XML that passes XSD validation.
 * BASICWL requires ApplicableTradeTax (mandatory, no line items).
 */
function createBasicWlXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basicwl</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-BWL-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20240115</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Seller Company SA</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>75001</ram:PostcodeCode>
          <ram:LineOne>123 Main Street</ram:LineOne>
          <ram:CityName>Paris</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">FR12345678901</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Buyer Company Ltd</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>10115</ram:PostcodeCode>
          <ram:CityName>Berlin</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>200.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>1000.00</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>1200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/**
 * Create a fully valid Factur-X BASIC XML.
 * BASIC requires line items, ApplicableTradeTax, etc.
 */
function createBasicXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-BAS-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20240115</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Consulting Services</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>500.00</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">2</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Seller Company SA</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>75001</ram:PostcodeCode>
          <ram:LineOne>123 Main Street</ram:LineOne>
          <ram:CityName>Paris</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">FR12345678901</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Buyer Company Ltd</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>10115</ram:PostcodeCode>
          <ram:CityName>Berlin</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>200.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>1000.00</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>1200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/**
 * Create a fully valid EN16931 XML using the FacturXInvoice class.
 * This is the primary integration test: generate XML from our library,
 * then validate it against the real XSD.
 */
function createEn16931XmlFromInvoice(): string {
  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,
    {
      id: 'INV-EN16931-001',
      invoiceNumber: 'INV-EN16931-001',
      name: 'Test Invoice',
      invoiceDate: new Date(2024, 0, 15),
      typeCode: DocTypeCode.INVOICE,
    },
    {
      name: 'Seller Company SA',
      address: {
        street: '123 Rue de la Paix',
        postalCode: '75001',
        city: 'Paris',
        countryCode: 'FR',
      },
      vatId: 'FR12345678901',
      electronicAddress: 'seller@example.com',
      electronicAddressScheme: 'EM',
    },
    {
      name: 'Buyer GmbH',
      address: {
        street: '456 Berliner Strasse',
        postalCode: '10115',
        city: 'Berlin',
        countryCode: 'DE',
      },
      vatId: 'DE123456789',
      electronicAddress: 'buyer@example.com',
      electronicAddressScheme: 'EM',
    },
    {
      meansCode: PaymentMeansCode.CREDIT_TRANSFER,
      iban: 'FR7630006000011234567890189',
      bic: 'BNPAFRPP',
      dueDate: new Date(2024, 1, 15),
    },
    [
      {
        id: '1',
        description: 'Consulting Services',
        quantity: 10,
        unitPrice: 100.0,
        lineTotal: 1000.0,
        vatRate: 0.20,
        taxCategoryCode: TaxCategoryCode.STANDARD,
        unitCode: UnitCode.HOUR,
        allowances: [],
        charges: [],
      },
    ],
    [],
    CurrencyCode.EUR
  );

  return invoice.generateXml(false);
}

// Create a raw EN16931 XML string (hand-crafted to match the schema exactly).
function createEn16931Xml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-EN-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20240115</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Consulting Services</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>500.00</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">2</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Seller Company SA</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>75001</ram:PostcodeCode>
          <ram:LineOne>123 Main Street</ram:LineOne>
          <ram:CityName>Paris</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">seller@example.com</ram:URIID>
        </ram:URIUniversalCommunication>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">FR12345678901</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Buyer GmbH</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>10115</ram:PostcodeCode>
          <ram:CityName>Berlin</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">buyer@example.com</ram:URIID>
        </ram:URIUniversalCommunication>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>FR7630006000011234567890189</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>200.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>1000.00</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">20240215</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>1200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// Create a valid EXTENDED XML.
function createExtendedXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-EXT-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20240115</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Advanced Consulting</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>500.00</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">2</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Seller Company SA</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>75001</ram:PostcodeCode>
          <ram:LineOne>123 Main Street</ram:LineOne>
          <ram:CityName>Paris</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">FR12345678901</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Buyer GmbH</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>10115</ram:PostcodeCode>
          <ram:CityName>Berlin</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>FR7630006000011234567890189</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>200.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>1000.00</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>1200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('RealXsdValidator', () => {
  let validator: RealXsdValidator;

  beforeAll(() => {
    // Reset engine detection so we get a fresh detection
    resetEngineDetection();
    validator = new RealXsdValidator(COMPLIANCE_PATH);
  });

  // ==========================================================================
  // Constructor and Setup
  // ==========================================================================

  describe('Constructor and Setup', () => {
    it('should create a validator with explicit compliance base path', () => {
      const v = new RealXsdValidator(COMPLIANCE_PATH);
      expect(v).toBeDefined();
      expect(v.getEngine()).toBeDefined();
    });

    it('should create a validator with default path resolution', () => {
      const v = new RealXsdValidator();
      expect(v).toBeDefined();
    });

    it('should detect a working validation engine', () => {
      const engine = validator.getEngine();
      expect(['node-libxml', 'libxmljs', 'xmllint-cli', 'none']).toContain(engine);

      // At least one engine should be available in the project
      if (engine === 'none') {
        console.warn(
          'WARNING: No XSD validation engine available. ' +
          'Tests will verify error handling but not actual XSD validation.'
        );
      } else {
        console.log(`Using XSD validation engine: ${engine}`);
      }
    });

    it('should correctly map all profile schema paths', () => {
      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.BASIC,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED,
      ];

      for (const profile of profiles) {
        const schemaPath = validator.getSchemaPath(profile);
        expect(schemaPath).toBeDefined();
        expect(schemaPath).toContain('.xsd');
      }
    });

    it('should verify XSD files exist on disk for all profiles', () => {
      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.BASIC,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED,
      ];

      for (const profile of profiles) {
        const exists = validator.schemaExists(profile);
        expect(exists).toBe(true);
      }
    });

    it('should list 4 XSD files per profile (main + 3 supporting)', () => {
      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.BASIC,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED,
      ];

      for (const profile of profiles) {
        const files = validator.getSchemaFiles(profile);
        expect(files.length).toBe(4);
        for (const f of files) {
          expect(f.endsWith('.xsd')).toBe(true);
        }
      }
    });
  });

  // ==========================================================================
  // Schema file verification
  // ==========================================================================

  describe('Schema File Integrity', () => {
    it('should have XSD files that contain valid XML', () => {
      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.BASIC,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED,
      ];

      for (const profile of profiles) {
        const files = validator.getSchemaFiles(profile);
        for (const f of files) {
          const content = fs.readFileSync(f, 'utf-8');
          expect(content).toContain('xs:schema');
          expect(content).toContain('<?xml version');
        }
      }
    });

    it('should have main XSD importing all 3 supporting schemas', () => {
      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.BASIC,
        FacturxProfile.EN16931,
        FacturxProfile.EXTENDED,
      ];

      for (const profile of profiles) {
        const schemaPath = validator.getSchemaPath(profile);
        const content = fs.readFileSync(schemaPath, 'utf-8');

        expect(content).toContain('QualifiedDataType');
        expect(content).toContain('ReusableAggregateBusinessInformationEntity');
        expect(content).toContain('UnqualifiedDataType');
      }
    });
  });

  // ==========================================================================
  // Valid XML Validation - All 5 Profiles
  // ==========================================================================

  describe('Valid XML Validation - All 5 Profiles', () => {
    it('should validate a valid MINIMUM XML against MINIMUM XSD', () => {
      const xml = createMinimumXml();
      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result.profile).toBe(FacturxProfile.MINIMUM);
      expect(result.schemaPath).toContain('MINIMUM');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.engine).toBeDefined();

      if (validator.getEngine() !== 'none') {
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should validate a valid BASICWL XML against BASICWL XSD', () => {
      const xml = createBasicWlXml();
      const result = validator.validate(xml, FacturxProfile.BASICWL);

      expect(result.profile).toBe(FacturxProfile.BASICWL);
      expect(result.schemaPath).toContain('BASICWL');

      if (validator.getEngine() !== 'none') {
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should validate a valid BASIC XML against BASIC XSD', () => {
      const xml = createBasicXml();
      const result = validator.validate(xml, FacturxProfile.BASIC);

      expect(result.profile).toBe(FacturxProfile.BASIC);
      expect(result.schemaPath).toContain('BASIC');

      if (validator.getEngine() !== 'none') {
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should validate a valid EN16931 XML against EN16931 XSD', () => {
      const xml = createEn16931Xml();
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.profile).toBe(FacturxProfile.EN16931);
      expect(result.schemaPath).toContain('EN16931');

      if (validator.getEngine() !== 'none') {
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should validate a valid EXTENDED XML against EXTENDED XSD', () => {
      const xml = createExtendedXml();
      const result = validator.validate(xml, FacturxProfile.EXTENDED);

      expect(result.profile).toBe(FacturxProfile.EXTENDED);
      expect(result.schemaPath).toContain('EXTENDED');

      if (validator.getEngine() !== 'none') {
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  // ==========================================================================
  // FacturXInvoice Integration - Generate then Validate
  // ==========================================================================

  describe('FacturXInvoice Integration', () => {
    it('should validate XML generated by FacturXInvoice against EN16931 XSD', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const xml = createEn16931XmlFromInvoice();

      expect(xml).toBeDefined();
      expect(xml.length).toBeGreaterThan(100);
      expect(xml).toContain('CrossIndustryInvoice');
      expect(xml).toContain('INV-EN16931-001');

      const result = validator.validate(xml, FacturxProfile.EN16931);

      if (!result.isValid) {
        console.log('FacturXInvoice generated XML failed XSD validation:');
        for (const err of result.errors) {
          console.log(`  Line ${err.line || '?'}: ${err.message}`);
        }
      }

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Invalid XML Detection
  // ==========================================================================

  describe('Invalid XML Detection', () => {
    it('should reject non-well-formed XML', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const malformedXml = '<root><unclosed>';
      const result = validator.validate(malformedXml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty XML', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const result = validator.validate('', FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing required ExchangedDocument element', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      // XML with CrossIndustryInvoice root but missing ExchangedDocument
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Test</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>100.00</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>100.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>Seller</ram:Name></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>Buyer</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>20.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>100.00</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>100.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">20.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>120.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>120.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validate(invalidXml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const allMessages = result.errors.map(e => e.message).join(' ');
      expect(allMessages.toLowerCase()).toMatch(/exchang|expected|missing|sequence/i);
    });

    it('should detect elements in wrong order', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      // Swap ExchangedDocument and ExchangedDocumentContext
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20240115</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>Test</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>100.00</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>20.00</ram:RateApplicablePercent></ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>100.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>Seller</ram:Name></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>Buyer</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax><ram:CalculatedAmount>20.00</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode><ram:BasisAmount>100.00</ram:BasisAmount><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>20.00</ram:RateApplicablePercent></ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>100.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">20.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>120.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>120.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validate(invalidXml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect wrong root element', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:WrongRootElement
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">
  <rsm:ExchangedDocument/>
</rsm:WrongRootElement>`;

      const result = validator.validate(invalidXml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing mandatory ApplicableTradeTax in BASICWL', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const validXml = createBasicWlXml();
      const invalidXml = validXml.replace(
        /<ram:ApplicableTradeTax>[\s\S]*?<\/ram:ApplicableTradeTax>/,
        ''
      );

      const result = validator.validate(invalidXml, FacturxProfile.BASICWL);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing line items in BASIC profile', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const validXml = createBasicXml();
      const invalidXml = validXml.replace(
        /<ram:IncludedSupplyChainTradeLineItem>[\s\S]*?<\/ram:IncludedSupplyChainTradeLineItem>/,
        ''
      );

      const result = validator.validate(invalidXml, FacturxProfile.BASIC);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide line numbers in error messages when available', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction/>
</rsm:CrossIndustryInvoice>`;

      const result = validator.validate(invalidXml, FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const errorsWithLines = result.errors.filter(e => e.line !== undefined && e.line > 0);
      if (validator.getEngine() === 'node-libxml' || validator.getEngine() === 'xmllint-cli') {
        expect(errorsWithLines.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Cross-Profile Validation (mismatched profile vs schema)
  // ==========================================================================

  describe('Cross-Profile Validation', () => {
    it('should reject MINIMUM XML validated against BASIC schema (missing line items)', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const minimumXml = createMinimumXml();
      const result = validator.validate(minimumXml, FacturxProfile.BASIC);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject MINIMUM XML validated against EN16931 schema', () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const minimumXml = createMinimumXml();
      const result = validator.validate(minimumXml, FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Async Validation
  // ==========================================================================

  describe('Async Validation', () => {
    it('should validate asynchronously and return same result', async () => {
      const xml = createEn16931Xml();

      const syncResult = validator.validate(xml, FacturxProfile.EN16931);
      const asyncResult = await validator.validateAsync(xml, FacturxProfile.EN16931);

      expect(asyncResult.isValid).toBe(syncResult.isValid);
      expect(asyncResult.errors.length).toBe(syncResult.errors.length);
      expect(asyncResult.profile).toBe(syncResult.profile);
      expect(asyncResult.engine).toBe(syncResult.engine);
    });

    it('should reject invalid XML asynchronously', async () => {
      if (validator.getEngine() === 'none') {
        console.warn('Skipping: no XSD engine available');
        return;
      }

      const result = await validator.validateAsync('<invalid>', FacturxProfile.EN16931);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Batch Validation
  // ==========================================================================

  describe('Batch Validation', () => {
    it('should validate multiple documents in batch', () => {
      const documents = [
        { xml: createMinimumXml(), profile: FacturxProfile.MINIMUM },
        { xml: createEn16931Xml(), profile: FacturxProfile.EN16931 },
        { xml: createExtendedXml(), profile: FacturxProfile.EXTENDED },
      ];

      const results = validator.validateBatch(documents);

      expect(results).toHaveLength(3);
      for (const result of results) {
        expect(result.profile).toBeDefined();
        expect(result.schemaPath).toBeDefined();
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ==========================================================================
  // Caching
  // ==========================================================================

  describe('Caching', () => {
    it('should cache validation results', () => {
      const cacheValidator = new RealXsdValidator(COMPLIANCE_PATH, { enableCache: true });
      const xml = createMinimumXml();

      const result1 = cacheValidator.validate(xml, FacturxProfile.MINIMUM);
      expect(cacheValidator.getCacheStats().size).toBe(1);

      const result2 = cacheValidator.validate(xml, FacturxProfile.MINIMUM);
      expect(result2.isValid).toBe(result1.isValid);
      expect(cacheValidator.getCacheStats().size).toBe(1);
    });

    it('should have separate cache entries for different profiles', () => {
      const cacheValidator = new RealXsdValidator(COMPLIANCE_PATH, { enableCache: true });
      const xml = createEn16931Xml();

      cacheValidator.validate(xml, FacturxProfile.EN16931);
      cacheValidator.validate(xml, FacturxProfile.EXTENDED);

      expect(cacheValidator.getCacheStats().size).toBe(2);
    });

    it('should clear cache', () => {
      const cacheValidator = new RealXsdValidator(COMPLIANCE_PATH, { enableCache: true });
      cacheValidator.validate(createMinimumXml(), FacturxProfile.MINIMUM);
      expect(cacheValidator.getCacheStats().size).toBe(1);

      cacheValidator.clearCache();
      expect(cacheValidator.getCacheStats().size).toBe(0);
    });

    it('should not cache when caching is disabled', () => {
      const noCacheValidator = new RealXsdValidator(COMPLIANCE_PATH, { enableCache: false });
      noCacheValidator.validate(createMinimumXml(), FacturxProfile.MINIMUM);
      expect(noCacheValidator.getCacheStats().size).toBe(0);
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('Performance', () => {
    it('should complete validation within reasonable time', () => {
      const xml = createEn16931Xml();
      const result = validator.validate(xml, FacturxProfile.EN16931);

      expect(result.durationMs).toBeLessThan(5000);
    });

    it('should be faster on cached results', () => {
      const cacheValidator = new RealXsdValidator(COMPLIANCE_PATH, { enableCache: true });
      const xml = createEn16931Xml();

      // First validation (uncached)
      cacheValidator.validate(xml, FacturxProfile.EN16931);

      // Second validation (cached)
      const startCached = Date.now();
      const result2 = cacheValidator.validate(xml, FacturxProfile.EN16931);
      const cachedDuration = Date.now() - startCached;

      expect(cachedDuration).toBeLessThan(50);
      expect(result2).toBeDefined();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle missing schema directory gracefully', () => {
      const badValidator = new RealXsdValidator('/nonexistent/path');
      const result = badValidator.validate(createMinimumXml(), FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('not found');
    });

    it('should report schema file not found with correct path', () => {
      const badValidator = new RealXsdValidator('/tmp/empty');
      const result = badValidator.validate(createMinimumXml(), FacturxProfile.MINIMUM);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('XSD schema file not found');
    });

    it('should return the engine name in all results', () => {
      const result = validator.validate(createMinimumXml(), FacturxProfile.MINIMUM);
      expect(result.engine).toBeDefined();
      expect(['node-libxml', 'libxmljs', 'xmllint-cli', 'none']).toContain(result.engine);
    });
  });

  // ==========================================================================
  // Result Structure
  // ==========================================================================

  describe('Result Structure', () => {
    it('should return all required fields in the result', () => {
      const xml = createMinimumXml();
      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('profile');
      expect(result).toHaveProperty('schemaPath');
      expect(result).toHaveProperty('durationMs');
      expect(result).toHaveProperty('engine');

      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.profile).toBe('string');
      expect(typeof result.schemaPath).toBe('string');
      expect(typeof result.durationMs).toBe('number');
      expect(typeof result.engine).toBe('string');
    });

    it('should freeze errors array to prevent mutation', () => {
      const xml = createMinimumXml();
      const result = validator.validate(xml, FacturxProfile.MINIMUM);

      expect(Object.isFrozen(result.errors)).toBe(true);
    });
  });
});
