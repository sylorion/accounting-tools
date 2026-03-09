// src/models/OrderData.ts
import { SellerInfo } from './SellerInfo';
import { BuyerInfo } from './BuyerInfo';
import { BaseOrderItem } from './BaseOrderItem';

export interface OrderData<T extends BaseOrderItem = BaseOrderItem> {
  orderNumber: string;  // N° de commande
  orderDate: Date;
  seller: SellerInfo;
  buyer: BuyerInfo;
  items: T[];
  currency: string;

  // Champs spécifiques commande :
  requestedDeliveryDate?: Date;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    postalCode?: string;
    countryCode?: string;
  };

  disclaimers?: string[];
  notes?: string[];
}
