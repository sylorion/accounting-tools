
// ==================================================
// File: services/accounting/src/compliance/ubl/UblBuilder.ts
// (Builds minimal UBL XML structure.)
// ==================================================
import { create } from 'xmlbuilder2';
import { Invoice } from '../../models/Invoice';

export function buildUblXml(invoice: Invoice): Uint8Array {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Invoice', {
      'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'
    })
      .ele('cbc:ID').txt(invoice.number).up()
      .ele('cbc:IssueDate').txt(invoice.issueDate.toISOString().split('T')[0]).up()
      // etc.
    .up();

  const xmlString = root.end({ prettyPrint: true });
  return Buffer.from(xmlString, 'utf-8');
}