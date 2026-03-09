// src/models/InvoiceData.ts
import { SellerInfo } from './SellerInfo';
import { BuyerInfo } from './BuyerInfo';
import { BaseInvoiceItem } from './BaseInvoiceItem';

export interface InvoiceData<T extends BaseInvoiceItem = BaseInvoiceItem> {
  invoiceNumber: string;
  invoiceDate: Date;
  seller: SellerInfo;
  buyer: BuyerInfo;
  items: T[];
  currency: string;  // ex. "EUR"

  // Options supplémentaires
  dueDate?: Date;
  paymentMethod?: string;
  disclaimers?: string[];         // ex. [ "Pas de reprise sur produit", ... ]
  notes?: string[];               // ex. [ "Merci de votre confiance", ... ]


  // ... tout autre champ pertinent
}
export { BaseInvoiceItem };

