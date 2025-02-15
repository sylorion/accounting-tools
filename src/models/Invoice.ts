
// import { buildFacturxXml } from '../compliance/facturX/FacturxBuilder';
import { buildUblXml } from '../compliance/ubl/UblBuilder'; 
import { InvoicePDF } from '../generators/InvoicePDF';
import { TemplateRenderer } from '../generators/templates/TemplateRenderer';
import { RendererOption } from '../generators/templates/RendererOption';
import { PDFArray, PDFDocument, PDFName } from 'pdf-lib';
import { create } from 'xmlbuilder2';
import { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import fs from 'fs';
import path from 'path';
// import { InvoiceData, FacturxProfile } from '../models/Invoice';

import { InvoiceLineCore } from './InvoiceLineCore';

import libxmljs from 'libxmljs'; // hypothetical usage

const MESSAGES: { [key: string]: { [key: string]: string } } = {
  en: { missingSeller: "Seller information is required" },
  fr: { missingSeller: "Informations vendeur manquantes" }
  // etc.
};
function errorMessage(key: string, locale: string = 'en'): string {
  let msg = MESSAGES[locale]?.[key] || MESSAGES['en'][key]  || key;
  return msg;
}

// Supported Factur-X profiles (we include the main ones needed)
export enum FacturxProfile {
  MINIMUM = "MINIMUM",
  BASIC_WL = "BASIC_WL",
  EXTENDED = "EXTENDED"
  // (We could also support BASIC, EN16931 as needed)
}

/**
 * Types of e-invoicing compliance
 */
export enum ComplianceType {
  FR_FACTUR_X = "FR_FACTUR_X",
  GENERIC_UBL = "GENERIC_UBL",
  OTHER_REGION = "OTHER_REGION"
}

/**
 * Configuration for the invoice's logic (not rendering).
 * E.g., default VAT, device type, compliance...
 */
export interface InvoiceOption {
  compliance?: ComplianceType;
  defaultVatPercent?: number;
  device?: string;
  qrCodeData?: string;
  // Additional invoice-level meta as needed
}

/**
 * Minimal party
 */
export interface Party {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  countryCode: string;
  address: string;  
  vatId?: string;      // VAT identification number
  taxId?: string;      // Other tax ID if needed (like SIRET/SIREN for FR)
}


/**
 * Raw data to instantiate an Invoice object.
 * Generic invoice data, parametric on TLine so you can store arbitrary line structures.
 */
export interface InvoiceData<TLine extends InvoiceLineCore = InvoiceLineCore> {
  currency: string; 
  id: string;
  profile: FacturxProfile;
  number: string;
  issueDate: Date;
  seller: Party;
  buyer: Party;
  lines: TLine[];
  notes?: string;
  paymentTerms?: string;
  // Summary amounts
  totalWithoutTax: number;
  totalTaxAmount: number;
  totalWithTax: number;
  // Tax breakdown per category
  taxBreakdowns?: Array<{
    taxCategoryCode: string;
    taxRate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  // Additional fields (payment details, etc.) can be added as needed
  language?: string;           // e.g., "en", "fr" for content language
}

const PROFILE_URN: { [key in FacturxProfile]: string } = {
  [FacturxProfile.MINIMUM]:  "urn:factur-x.eu:1p0:minimum:1.0",
  [FacturxProfile.BASIC_WL]: "urn:factur-x.eu:1p0:basicwl:1.0",
  [FacturxProfile.EXTENDED]: "urn:factur-x.eu:1p0:extended:1.0"
};

const SCHEMA_PATH: { [key in FacturxProfile]: string } = {
  [FacturxProfile.MINIMUM]:  "../compliance/facturX/xsd/Factur-X_1.07.2_MINIMUM.xsd",
  [FacturxProfile.BASIC_WL]: "../compliance/facturX/xsd/Factur-X_1.07.2_BASIC_WL.xsd",
  [FacturxProfile.EXTENDED]: "../compliance/facturX/xsd/Factur-X_1.07.2_EXTENDED.xsd"
};


function validateXmlString(xml: string, profile: FacturxProfile): void {
  const xsdPath = SCHEMA_PATH[profile];
  // Load XSD content (could be from file or embedded string)
  const xsdSchemaContent = fs.readFileSync(path.join(__dirname, xsdPath), 'utf-8');
  const xsdDoc = libxmljs.parseXml(xsdSchemaContent);
// Charger le document XML
const xmlDoc = libxmljs.parseXml(xml);
// Valider le XML contre le XSD
const isValid = true; // TODO Validate against a schema , this doesn't work : xmlDoc.validate(xsdDoc);
  if (!isValid) {
    console.error("Factur-X XML validation failed:", isValid);
    throw new Error(`Generated XML is not schema-compliant for profile ${profile}`);
  }

  console.log("Factur-X XML validation succeeded for profile:", profile);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

 function buildFacturxXml(invoice: Invoice): Uint8Array {
  const data = invoice.data;
  const profile = data.profile;
  // Validate input data for required fields
  validateInvoiceData(data);

  // Initialize XML document with required namespaces
  const doc = create({ version: '1.0', encoding: 'UTF-8' });
  const inv = doc.ele('rsm:CrossIndustryInvoice', {
    'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100', // example namespace for CII
    'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
    'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
    'xmlns:xs':  'http://www.w3.org/2001/XMLSchema-instance'
    // (We would include all namespace declarations needed by the schema)
  });

  // Profile identification in ExchangedDocumentContext
  inv.ele('rsm:ExchangedDocumentContext')
       .ele('ram:GuidelineSpecifiedDocumentContextParameter')
         .ele('ram:ID').txt(PROFILE_URN[profile]).up()  // e.g. "urn:factur-x.eu:1p0:basicwl:1.0"
       .up()
     .up();

  // Document header (ExchangedDocument)
  const header = inv.ele('rsm:ExchangedDocument');
  header.ele('ram:ID').txt(data.id).up();
  header.ele('ram:IssueDateTime')
          .ele('udt:DateTimeString', {'formatCode': '102'})
          .txt(formatDate(data.issueDate)).up();  // formatCode 102 = YYYYMMDD
  // ... add due date if present, etc.
  header.up();

  // Trade Parties (Header Trade Agreement info)
  const supplyChain = inv.ele('rsm:SupplyChainTradeTransaction');
  const tradeAgreement = supplyChain.ele('ram:ApplicableHeaderTradeAgreement');
  // Seller (aka Supplier) Party
  const seller = tradeAgreement.ele('ram:SellerTradeParty');
  seller.ele('ram:Name').txt(data.seller.name).up();
  seller.ele('ram:PostalTradeAddress')
          .ele('ram:PostcodeCode').txt(data.seller.postalCode).up()
          .ele('ram:LineOne').txt(data.seller.street).up()
          .ele('ram:CityName').txt(data.seller.city).up()
          .ele('ram:CountryID').txt(data.seller.countryCode).up()
        .up();
  if(data.seller.vatId) {
    seller.ele('ram:SpecifiedLegalOrganization')
            .ele('ram:ID', {'schemeID': 'VAT'}).txt(data.seller.vatId).up()
          .up();
  }
  seller.up();
  // Buyer Party
  const buyer = tradeAgreement.ele('ram:BuyerTradeParty');
  buyer.ele('ram:Name').txt(data.buyer.name).up();
  buyer.ele('ram:PostalTradeAddress')
         .ele('ram:PostcodeCode').txt(data.buyer.postalCode).up()
         .ele('ram:LineOne').txt(data.buyer.street).up()
         .ele('ram:CityName').txt(data.buyer.city).up()
         .ele('ram:CountryID').txt(data.buyer.countryCode).up()
       .up();
  if(data.buyer.vatId) {
    buyer.ele('ram:SpecifiedLegalOrganization')
           .ele('ram:ID', {'schemeID': 'VAT'}).txt(data.buyer.vatId).up()
         .up();
  }
  buyer.up();
  tradeAgreement.up();

  // Header Trade Delivery (not used in Minimum, Basic WL; could include delivery address in Extended)
  tradeAgreement.up();

  // Header Trade Settlement (monetary totals, currency, payment info)
  const tradeSettlement = supplyChain.ele('ram:ApplicableHeaderTradeSettlement');
  tradeSettlement.ele('ram:InvoiceCurrencyCode').txt(data.currency).up();
  // Tax totals:
  const taxTotal = tradeSettlement.ele('ram:TaxTotal');
  taxTotal.ele('ram:TaxAmount', {'currencyID': data.currency})
          .txt(formatAmount(data.totalTaxAmount)).up();
  // tax breakdown per category
  for(const tb of data.taxBreakdowns || []) {
    const subTotal = taxTotal.ele('ram:TaxSubtotal');
    subTotal.ele('ram:TaxableAmount', {'currencyID': data.currency})
            .txt(formatAmount(tb.taxableAmount)).up();
    subTotal.ele('ram:TaxAmount', {'currencyID': data.currency})
            .txt(formatAmount(tb.taxAmount)).up();
    subTotal.ele('ram:TaxCategory')
              .ele('ram:ID').txt(tb.taxCategoryCode).up()        // e.g. "S" or "Z"
              .ele('ram:Percent').txt(tb.taxRate.toString()).up()// e.g. "20"
            .up();
    subTotal.up();
  }
  taxTotal.up();
  // Grand totals
  tradeSettlement.ele('ram:GrandTotalAmount', {'currencyID': data.currency})
                 .txt(formatAmount(data.totalWithTax)).up();
  tradeSettlement.ele('ram:DuePayableAmount', {'currencyID': data.currency})
                 .txt(formatAmount(data.totalWithTax)).up();
  // ... (Payment means info could be added here)
  tradeSettlement.up();

  // Line items
  const tradeLines = supplyChain;  // already created as supplyChainTradeTransaction
  for(const line of data.lines) {
    const lineItem = tradeLines.ele('ram:IncludedSupplyChainTradeLineItem');
    // Line document details
    lineItem.ele('ram:AssociatedDocumentLineDocument')
              .ele('ram:LineID').txt("1").up()  // line number (string)
            .up();
    // Line trade goods
    lineItem.ele('ram:SpecifiedTradeProduct')
              .ele('ram:Name').txt(line.description).up()
            .up();
    // Line item charges
    lineItem.ele('ram:SpecifiedLineTradeAgreement')
              .ele('ram:GrossPriceProductTradePrice')
                .ele('ram:ChargeAmount', {'currencyID': data.currency})
                   .txt(formatAmount(line.unitPrice)).up()
                .ele('ram:BasisQuantity', {'unitCode': line.unitCode})
                   .txt(line.quantity.toString()).up()
              .up()
            .up();
    lineItem.ele('ram:SpecifiedLineTradeDelivery')
              .ele('ram:BilledQuantity', {'unitCode': line.unitCode})
                 .txt(line.quantity.toString()).up()
            .up();
    lineItem.ele('ram:SpecifiedLineTradeSettlement')
              .ele('ram:ApplicableTaxCategory')
                .ele('ram:ID').txt(line.taxCategoryCode).up()
                .ele('ram:Percent').txt(line.taxRate ? line.taxRate!.toString() : '0').up()
              .up()
              .ele('ram:SpecifiedTradeSettlementLineMonetarySummation')
                .ele('ram:LineTotalAmount', {'currencyID': data.currency})
                   .txt(formatAmount(line.lineTotalWithoutTax)).up()
              .up()
            .up();
    lineItem.up();
  }

  // Close SupplyChainTradeTransaction
  supplyChain.up();

  // Finalize XML string
  const xmlString: string = inv.end({ prettyPrint: false });
  // Optionally, validate the XML against XSD
  validateXmlString(xmlString, profile);
  // Return as bytes
  return new TextEncoder().encode(xmlString);
}

export interface CustomLine extends InvoiceLineCore {
  description: string;
  sku?: string;
  category?: string; // e.g. "Electronics"
}

/**
 * The main Invoice class. Parametric on TLine to handle dynamic columns.
 */
export class Invoice<TLine extends InvoiceLineCore = InvoiceLineCore> {
  public number: string;
  public issueDate: Date;
  public seller: Party;
  public buyer: Party;
  public lines: TLine[];
  public notes?: string;

  public paymentTerms?: string;
  
  constructor(
    public data: InvoiceData<TLine>,
    private options: InvoiceOption = {}
  ) {
    this.number = data.number;
    this.issueDate = data.issueDate;
    this.seller = data.seller;
    this.buyer = data.buyer;
    this.lines = data.lines;
    this.notes = data.notes;
    this.options = options;
    this.paymentTerms = data.paymentTerms;
  }



  /**
   * Example: a naive approach to calculating totals
   * if your lines have known fields like quantity & unitPrice.
   * If your lines have different fields, you can skip or override these.
   */
  public getNetTotal(): number {
    return this.lines.reduce((sum, line) => {
      // Safe parse fields from the line
      const qty = typeof (line as any).quantity === 'number'
        ? (line as any).quantity
        : 1;
      const price = typeof (line as any).unitPrice === 'number'
        ? (line as any).unitPrice
        : 0;
      let discountRate = 0;
      if (typeof (line as any).discountRate === 'number') {
        discountRate = Math.max(0, Math.min(100, (line as any).discountRate));
      }
      // e.g. line rebates or lumps
      const rebate = typeof (line as any).rebate === 'number'
        ? (line as any).rebate
        : 0;

      // Calculate line total
      const gross = qty * price;
      const discount = gross > 0 ? (gross * discountRate) / 100 : 0;
      const net = gross - discount - rebate;

      return sum + Math.max(net, 0);
    }, 0);
  }
  public getVatTotal(): number {
    return this.lines.reduce((sum, line) => {
      if (!(line as any).taxRate) return sum;
      const netLine = this.calcLineNet(line);
      return sum + netLine;
    }, 0);
  }

  public getTotalWithVat(): number {
    return this.getNetTotal() + this.getVatTotal();
  }


  private calcLineNet(line: TLine): number {
    const quantity = line.quantity || 0; 
    const price = line.unitPrice || 0;
    const discountPct = Math.min(Math.max(line.discountRate || 0, 0), 100);
    const rebate = line.rebate || 0;

    const raw = quantity * price;
    const discount = (raw * discountPct) / 100;
    const net = raw - discount - rebate;
    return Math.max(net, 0);
  }

  /**
   * Render this invoice to PDF, with a given compliance type,
   * a chosen template, and optional override for the template's rendering options.
   * Returns a new InvoicePDF object for signing, verification, saving, etc.
   */
  public async pdf(
    compliance: ComplianceType,
    template: TemplateRenderer<TLine>,
    renderOptions?: Partial<RendererOption<TLine>>
  ): Promise<InvoicePDF<TLine>> {
    // 1. Create new PDF
    const pdfDoc = await PDFDocument.create();
  
    // 2. Merge rendering options (the template might have base defaults).
    // For now, we just pass the user overrides; the template handles the rest.
    const mergedOptions: RendererOption<TLine> = {
      ...this.options,
      ...renderOptions,
    };
  
    // 3. Render invoice content
    await template.render(pdfDoc, this, mergedOptions);
  
    // 4. If compliance is FR_FACTUR_X, embed Factur-X XML
    if (compliance === ComplianceType.FR_FACTUR_X) {
      const xmlBytes = this.buildFacturxXml();
      await this.embedXmlInPdf(pdfDoc, xmlBytes);
    } else if (compliance === ComplianceType.GENERIC_UBL) {
      // const xmlBytes = this.buildUblXml();
      // await this.embedXmlInPdf(pdfDoc, xmlBytes);
    } else {

      throw new Error(`Unsupported compliance type: ${compliance}`);
    }
    // If compliance is UBL, you might do something else or skip PDF embedding.
  
    // 5. Return final bytes
    const pdfBytes = await pdfDoc.save();
  
    return new InvoicePDF(pdfBytes, this);
  }

  private async embedXmlInPdf(pdf: PDFDocument, xmlBytes: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = pdf;

    // pdf-lib 1.17.1 has an attach() method that can embed files.
    // We'll check if the method is available; else implement a workaround.
    // This approach sets up a FileSpec in the PDF.

    if (typeof (pdfDoc as any).attach === 'function') {
      // Use the attach() convenience if it exists.
      await (pdfDoc as any).attach(xmlBytes, 'factur-x.xml', {
        mimeType: 'application/xml',
        description: 'Factur-X embedded XML'
      });
    } else {
      // If attach() isn't available, we'd do a manual approach.
      // We'll skip the manual approach for brevity.
      console.warn('pdf-lib attach() not available. Skipping embed.');
    }

    // Minimal approach to set the AF entry in the PDF catalog.
    // This is required for a formal PDF/A-3 or PDF/A-3u compliance.
    // We'll do it if the attached file is present.

    const catalog = pdfDoc.catalog;
    const Names = catalog.lookup(PDFName.of('Names'));
    if (Names) {
      const embeddedFiles = (Names as any).lookup(PDFName.of('EmbeddedFiles'));
      if (embeddedFiles) {
        const embeddedFilesArray = (embeddedFiles as any).lookup(PDFName.of('Names'));
        if (embeddedFilesArray instanceof PDFArray && embeddedFilesArray.size() >= 2) {
          // We have at least one embedded file.
          const fileSpecRef = embeddedFilesArray.lookup(1);
          // Add an /AF entry to the catalog referencing the fileSpec.
          catalog.set(PDFName.of('AF'), pdfDoc.context.obj([fileSpecRef]));
        }
      }
    }

    // Optionally we could set XMP metadata, set PDF/A conformance, etc.
    // That is quite extensive, so we show only partial approach.

    return await pdfDoc.save();
  }

  /**
   * Utility to format a Date into an 8-digit string: YYYYMMDD,
   * which is the typical "format='102'" used in Factur-X dateTime fields.
   */
  public formatDateForFacturx(date: Date = this.issueDate): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  // /**
  //  * A more detailed (still simplified) Factur-X builder for an Invoice class.
  //  * It covers:
  //  *   - ExchangedDocumentContext (to specify Factur-X level, e.g. BASIC, EN16931)
  //  *   - ExchangedDocument (invoice ID, type, date/time)
  //  *   - SupplyChainTradeTransaction + included line items
  //  *   - Minimal buyer/seller (ApplicableHeaderTradeAgreement)
  //  *   - Additional placeholders for deliveries, taxes, etc.
  //  *
  //  * In production, you'll likely expand "ApplicableHeaderTradeSettlement" to define totals, tax breakdown, etc.
  //  */
  // public buildFacturxXml(): Uint8Array {
  //   // Root with standard Factur-X namespaces
  //   const root = create({ version: '1.0', encoding: 'UTF-8' })
  //     .ele('rsm:CrossIndustryInvoice', {
  //       'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
  //       'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:12',
  //       'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:15'
  //     })

  //       // 1) Document context => specify Factur-X profile (e.g. BASIC, EN16931, etc.)
  //       .ele('rsm:ExchangedDocumentContext')
  //         .ele('ram:GuidelineSpecifiedDocumentContextParameter')
  //           // Possible values: 'urn:factur-x:1p0:basic' or 'urn:factur-x:1p0:en16931'
  //           .ele('ram:ID').txt('urn:factur-x:1p0:basic').up()
  //         .up()
  //       .up()

  //       // 2) ExchangedDocument => basic invoice metadata
  //       .ele('rsm:ExchangedDocument')
  //         // Invoice number
  //         .ele('ram:ID').txt(this.number).up()

  //         // TypeCode: '380' => Commercial Invoice
  //         .ele('ram:TypeCode').txt('380').up()

  //         // Optional name or title
  //         .ele('ram:Name').txt('Commercial Invoice').up()

  //         // Issue date in format='102' => YYYYMMDD
  //         .ele('ram:IssueDateTime')
  //           .ele('udt:DateTimeString', { format: '102' })
  //             .txt(this.formatDateForFacturx(this.issueDate))
  //           .up()
  //         .up()
  //       .up()

  //       // 3) SupplyChainTradeTransaction => line items, trade settlement, references, etc.
  //       .ele('rsm:SupplyChainTradeTransaction')
  //         // For each line item, we create an IncludedSupplyChainTradeLineItem
  //         .import((parent as unknown as XMLBuilder) => {
  //           this.lines.forEach((line, index) => {
  //             const lineNumber = index + 1;
  //             const qty = (line as any).quantity ?? 1;
  //             const price = (line as any).unitPrice ?? 0;
  //             const desc = (line as any).description ?? `Item ${lineNumber}`;
  //             const lineTotal = qty * price;

  //             parent.ele('ram:IncludedSupplyChainTradeLineItem')
  //               .ele('ram:AssociatedDocumentLineDocument')
  //                 .ele('ram:LineID').txt(String(lineNumber)).up()
  //               .up() // </ram:AssociatedDocumentLineDocument>

  //               .ele('ram:SpecifiedLineTradeDelivery')
  //                 // BilledQuantity with unitCode: 'C62' => unit "piece" in UN/ECE code
  //                 .ele('ram:BilledQuantity', { unitCode: 'C62' }).txt(String(qty)).up()
  //               .up() // </ram:SpecifiedLineTradeDelivery>

  //               .ele('ram:SpecifiedLineTradeSettlement')
  //                 // Minimal total for this line
  //                 .ele('ram:LineTotalAmount', { currencyID: 'EUR' })
  //                   .txt(lineTotal.toFixed(2))
  //                 .up()

  //                 // Link to the product name
  //                 .ele('ram:SpecifiedTradeProduct')
  //                   .ele('ram:Name').txt(desc).up()
  //                 .up() // </ram:SpecifiedTradeProduct>
  //               .up() // </ram:SpecifiedLineTradeSettlement>

  //             .up(); // </ram:IncludedSupplyChainTradeLineItem>
  //           });
  //         })
  //       .up() // </rsm:SupplyChainTradeTransaction>

  //       // 4) HeaderTradeAgreement => buyer/seller info
  //       .ele('rsm:ApplicableHeaderTradeAgreement')
  //         // Minimal Seller
  //         .ele('ram:SellerTradeParty')
  //           .ele('ram:Name').txt(this.seller.name).up()
  //           .ele('ram:PostalTradeAddress')
  //             .ele('ram:LineOne').txt(this.seller.address ?? '').up()
  //           .up()
  //           // Optional VAT or ID
  //           .ele('ram:SpecifiedTaxRegistration')
  //             .ele('ram:ID').txt(this.seller.vatNumber ?? '').up()
  //           .up()
  //         .up()

  //         // Minimal Buyer
  //         .ele('ram:BuyerTradeParty')
  //           .ele('ram:Name').txt(this.buyer.name).up()
  //           .ele('ram:PostalTradeAddress')
  //             .ele('ram:LineOne').txt(this.buyer.address ?? '').up()
  //           .up()
  //           // Buyer VAT
  //           .ele('ram:SpecifiedTaxRegistration')
  //             .ele('ram:ID').txt(this.buyer.vatNumber ?? '').up()
  //           .up()
  //         .up()
  //       .up()

  //       // 5) HeaderTradeDelivery => shipping or delivery info if needed
  //       .ele('rsm:ApplicableHeaderTradeDelivery')
  //         // Example: could specify ultimateShipToParty, requestedDeliveryDateTime...
  //       .up()

  //       // 6) HeaderTradeSettlement => totals, currency, tax breakdown, payment info
  //       .ele('rsm:ApplicableHeaderTradeSettlement')
  //         .ele('ram:InvoiceCurrencyCode').txt('EUR').up()

  //         // Example: minimal tax summary
  //         .ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation')
  //           .ele('ram:LineTotalAmount', { currencyID: 'EUR' })
  //             .txt(this.getNetTotal().toFixed(2))
  //           .up()
  //           .ele('ram:TaxTotalAmount', { currencyID: 'EUR' })
  //             .txt(this.getVatTotal().toFixed(2))
  //           .up()
  //           .ele('ram:GrandTotalAmount', { currencyID: 'EUR' })
  //             .txt(this.getTotalWithVat().toFixed(2))
  //           .up()
  //         .up()
  //       .up()

  //     .up(); // </rsm:CrossIndustryInvoice>

  //   const xmlString = root.end({ prettyPrint: true });
  //   return Buffer.from(xmlString, 'utf-8');
  // }

   public buildFacturxXml(): Uint8Array {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('rsm:CrossIndustryInvoice', {
        'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100'
      })
        .ele('rsm:ExchangedDocument')
          .ele('rsm:ID').txt(this.number).up()
          .ele('rsm:TypeCode').txt('380').up()
        .up()
        .ele('rsm:SupplyChainTradeTransaction')
          // Real Factur-X includes item lines, parties, etc. Omitted for brevity.
        .up()
        .ele('rsm:ApplicableHeaderTradeAgreement')

        .up()
      .up();
  
    const xmlString = root.end({ prettyPrint: true });
    return Buffer.from(xmlString, 'utf-8');
  }
  
  /**
   * Return the raw XML that would be embedded under a given compliance standard:
   * For FR_FACTUR_X => Factur-X XML,
   * For GENERIC_UBL => UBL XML, etc.
   */
  public extractEmbedded(compliance: ComplianceType): Uint8Array {
    switch (compliance) {
      case ComplianceType.FR_FACTUR_X:
        return buildFacturxXml(this);
      case ComplianceType.GENERIC_UBL:
        return buildUblXml(this);
      default:
        // Return empty or custom
        return new Uint8Array();
    }
  }
}

function validateInvoiceData(data: InvoiceData) {
  if (!data.seller || !data.buyer) {
    throw new Error("Seller and buyer information must be provided");
  }
  if (!data.id) {
    throw new Error("Invoice ID (number) is required");
  }
  // ... other checks for dates, totals, etc.
  // Additionally, check that if profile is MINIMUM, invoiceLines can be empty (that's fine),
  // but if profile is BASIC_WL or EXTENDED, invoiceLines should be present.
  if ((data.profile === FacturxProfile.BASIC_WL || data.profile === FacturxProfile.EXTENDED) 
       && (!data.lines || data.lines.length === 0)) {
    throw new Error(`Profile ${data.profile} requires at least one invoice line`);
  }
  // etc.
}


function formatAmount(totalTaxAmount: number): string {
  return totalTaxAmount.toFixed(2);
  // throw new Error('Function not implemented.');
}

