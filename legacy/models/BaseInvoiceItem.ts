// src/models/BaseInvoiceItem.ts

/**
 * Type minimal pour un item de facture ou commande.
 * Les utilisateurs peuvent étendre ce type pour rajouter des champs métier.
 */
export interface BaseInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // HT
  vatRate: number;   // ex. 0.20 pour 20%
  // ...
}
