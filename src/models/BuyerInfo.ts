// src/models/BuyerInfo.ts

export interface BuyerInfo {
  name: string;      // Client ou raison sociale
  street: string;
  city: string;
  postalCode?: string;
  countryCode?: string;
  vatNumber?: string;
  businessNumber?: string;
  // etc.
}
