// src/OrderxXmlBuilder.ts
import { create } from 'xmlbuilder2';
import { OrderData } from './models/OrderData';
import { BaseOrderItem } from './models/BaseOrderItem';
import { OrderxProfiles } from './core/OrderxProfiles';

export class OrderxXmlBuilder<T extends BaseOrderItem> {
  constructor(
    private order: OrderData<T>,
    private profile: OrderxProfiles
  ) {}

  public buildXml(): Buffer {
    // 1. Création de la racine "CrossIndustryOrder" (ZUGFeRD/Order-X)
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('rsm:CrossIndustryOrder', {
        'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryOrder:100',
        // ...
      });

    // 2. Contexte / profil
    root.com(`Order-X Profile: ${this.profile}`);

    // 3. ExchangedDocument
    const docNode = root.ele('rsm:ExchangedDocument');
    docNode.ele('rsm:ID').txt(this.order.orderNumber);
    docNode.ele('rsm:IssueDateTime').txt(this.order.orderDate.toISOString());

    // 4. Seller / Buyer
    const tradeParties = root.ele('rsm:SupplyChainTradeTransaction');
    const sellerNode = tradeParties.ele('ram:SellerTradeParty');
    sellerNode.ele('ram:Name').txt(this.order.seller.name);

    const buyerNode = tradeParties.ele('ram:BuyerTradeParty');
    buyerNode.ele('ram:Name').txt(this.order.buyer.name);

    // 5. Items
    for (const item of this.order.items) {
      const lineItemNode = tradeParties.ele('ram:IncludedSupplyChainTradeLineItem');
      lineItemNode.ele('ram:SpecifiedTradeProduct').ele('ram:Name').txt(item.description);
      lineItemNode.ele('ram:Quantity').txt(item.quantity.toString());
      lineItemNode.ele('ram:GrossPriceProductTradePrice')
        .ele('ram:ChargeAmount').txt(item.unitPrice.toFixed(2));
    }

    // 6. Conversion en Buffer
    const xmlStr = root.end({ prettyPrint: true });
    return Buffer.from(xmlStr, 'utf-8');
  }
}
