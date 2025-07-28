"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderxXmlBuilder = void 0;
// src/OrderxXmlBuilder.ts
var xmlbuilder2_1 = require("xmlbuilder2");
var OrderxXmlBuilder = /** @class */ (function () {
    function OrderxXmlBuilder(order, profile) {
        this.order = order;
        this.profile = profile;
    }
    OrderxXmlBuilder.prototype.buildXml = function () {
        // 1. Création de la racine "CrossIndustryOrder" (ZUGFeRD/Order-X)
        var root = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
            .ele('rsm:CrossIndustryOrder', {
            'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryOrder:100',
            // ...
        });
        // 2. Contexte / profil
        root.com("Order-X Profile: ".concat(this.profile));
        // 3. ExchangedDocument
        var docNode = root.ele('rsm:ExchangedDocument');
        docNode.ele('rsm:ID').txt(this.order.orderNumber);
        docNode.ele('rsm:IssueDateTime').txt(this.order.orderDate.toISOString());
        // 4. Seller / Buyer
        var tradeParties = root.ele('rsm:SupplyChainTradeTransaction');
        var sellerNode = tradeParties.ele('ram:SellerTradeParty');
        sellerNode.ele('ram:Name').txt(this.order.seller.name);
        var buyerNode = tradeParties.ele('ram:BuyerTradeParty');
        buyerNode.ele('ram:Name').txt(this.order.buyer.name);
        // 5. Items
        for (var _i = 0, _a = this.order.items; _i < _a.length; _i++) {
            var item = _a[_i];
            var lineItemNode = tradeParties.ele('ram:IncludedSupplyChainTradeLineItem');
            lineItemNode.ele('ram:SpecifiedTradeProduct').ele('ram:Name').txt(item.description);
            lineItemNode.ele('ram:Quantity').txt(item.quantity.toString());
            lineItemNode.ele('ram:GrossPriceProductTradePrice')
                .ele('ram:ChargeAmount').txt(item.unitPrice.toFixed(2));
        }
        // 6. Conversion en Buffer
        var xmlStr = root.end({ prettyPrint: true });
        return Buffer.from(xmlStr, 'utf-8');
    };
    return OrderxXmlBuilder;
}());
exports.OrderxXmlBuilder = OrderxXmlBuilder;
