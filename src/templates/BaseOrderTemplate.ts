// src/templates/BaseOrderTemplate.ts
import { BaseOrderItem } from '../models/BaseOrderItem';
import { OrderData } from '../models/OrderData';

export abstract class BaseOrderTemplate<T extends BaseOrderItem> {
  abstract render(orderData: OrderData<T>): Promise<Uint8Array>;


  public validate(orderData: OrderData<T>): boolean {
    // Validation basique
    if (!orderData.orderNumber) {
      console.error('orderNumber is required');
      return false;
    }
    if (!orderData.orderDate) {
      console.error('orderDate is required');
      return false;
    }
    if (!orderData.seller) {
      console.error('seller is required');
      return false;
    }
    if (!orderData.buyer) {
      console.error('buyer is required');
      return false;
    }
    if (!orderData.items || orderData.items.length === 0) {
      console.error('items is required');
      return false;
    }
    if (!orderData.currency) {
      console.error('currency is required');
      return false;
    }

    return true;
  }
}
