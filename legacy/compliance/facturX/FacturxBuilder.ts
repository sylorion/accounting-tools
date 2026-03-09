
// ==================================================
// File: services/accounting/src/compliance/facturX/FacturXBuilder.ts
// (Builds minimal Factur-X XML structure. Real implementation would be more extensive.)
// ==================================================
import { create } from 'xmlbuilder2';
import { Invoice } from '../../models/Invoice';

export function buildFacturxXml(invoice: Invoice): Uint8Array {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rsm:CrossIndustryInvoice', {
      'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100'
    })
      .ele('rsm:ExchangedDocument')
        .ele('rsm:ID').txt(invoice.number).up()
        .ele('rsm:TypeCode').txt('380').up()
      .up()
      .ele('rsm:SupplyChainTradeTransaction')
        // Real Factur-X includes item lines, parties, etc. Omitted for brevity.
      .up()
    .up();

  const xmlString = root.end({ prettyPrint: true });
  return Buffer.from(xmlString, 'utf-8');
}
