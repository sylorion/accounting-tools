// src/models/SellerInfo.ts

export interface SellerInfo {
  name: string;      // Raison sociale
  street: string;
  city: string;
  postalCode?: string;
  countryCode: string;  // ex. "FR"
  vatNumber?: string;
  businessNumber?: string;
  // etc.
}
