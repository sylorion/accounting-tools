// src/models/BaseOrderItem.ts
export interface BaseOrderItem {
  description: string;
  quantity: number;
  unitPrice: number; // net ou HT, selon conventions
  // ex. code article, code douanier ?
  // ex. dateLivraisonPrevue?: Date;
}
