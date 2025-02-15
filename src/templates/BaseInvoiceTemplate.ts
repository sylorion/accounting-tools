// src/templates/BaseTemplate.ts
import { InvoiceData } from '../models/InvoiceData';
import { BaseInvoiceItem } from '../models/BaseInvoiceItem';

export abstract class BaseInvoiceTemplate<T extends BaseInvoiceItem> {
  // Méthode centrale : rend le PDF (ou un Buffer/Uint8Array).
  // On laisse la liberté d'utiliser pdf-lib ou pdfkit.
  abstract render(invoiceData: InvoiceData<T>): Promise<Uint8Array>;


  public validate(invoiceData: InvoiceData<T>): boolean {
    // Validation basique
    if (!invoiceData.invoiceNumber) {
      console.error('invoiceNumber is required');
      return false;
    }
    if (!invoiceData.invoiceDate) {
      console.error('invoiceDate is required');
      return false;
    }
    if (!invoiceData.seller) {
      console.error('seller is required');
      return false;
    }
    if (!invoiceData.buyer) {
      console.error('buyer is required');
      return false;
    }
    if (!invoiceData.items || invoiceData.items.length === 0) {
      console.error('items is required');
      return false;
    }
    if (!invoiceData.currency) {
      console.error('currency is required');
      return false;
    }

    return true;
  }
}
