import { DocTypeCode } from "./EnumInvoiceType";

/** En-tête de la facture */
export class DocumentHeader {
  constructor(
    public id: string, // identifiant interne du doc Ex. "Doc2025-0001"
    public invoiceNumber: string,
    public name: string,    // libellé ex. "FACTURE"
    public invoiceDate: Date,
    public issueDate: Date = new Date(),
    public typeCode: DocTypeCode = DocTypeCode.INVOICE, // 380=Invoice, 381=CreditNote
    public notes: string[] = []
  ) {}

  addNote(note: string) {
    this.notes.push(note);
  }

}
