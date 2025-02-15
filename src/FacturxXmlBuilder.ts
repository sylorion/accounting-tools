// src/FacturxXmlBuilder.ts
import { create } from 'xmlbuilder2';
import { InvoiceData, BaseInvoiceItem } from './models/InvoiceData';
import { FacturxProfiles } from './core/FacturxProfiles';

export class FacturxXmlBuilder<T extends BaseInvoiceItem> {
  constructor(
    private invoice: InvoiceData<T>,
    private profile: FacturxProfiles
  ) {}

  /** Construit l'objet XML en fonction du profil, puis renvoie le buffer. */
  public buildXml(): Buffer {
    // 1. On créé un doc XML racine, ex. CrossIndustryInvoice
    // L'arborescence standard Factur-X / ZUGFeRD 2.1 (simplifiée ici).
    // Cf. spécifications officielles ZUGFeRD/Factur-X pour la structure détaillée.
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('rsm:CrossIndustryInvoice', {
        'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
        // ...
      });

    // 2. On insère le profil
    // Selon le standard, la balise ExchangedDocumentContext / BusinessProcessSpecifiedDocumentContextParameter
    // Pour l'exemple, on ne fait qu'ajouter un commentaire, mais en réalité il faut respecter la structure normative
    root.com(`Factur-X Profile: ${this.profile}`);

    // 3. Invoice number & date
    const header = root.ele('rsm:ExchangedDocument');
    header.ele('rsm:ID').txt(this.invoice.invoiceNumber);
    header.ele('rsm:IssueDateTime').txt(this.invoice.invoiceDate.toISOString());

    // 4. Seller & Buyer
    const tradeParties = root.ele('rsm:SupplyChainTradeTransaction');
    const sellerNode = tradeParties.ele('ram:SellerTradeParty');
    sellerNode.ele('ram:Name').txt(this.invoice.seller.name);
    if (this.invoice.seller.vatNumber) {
      sellerNode.ele('ram:SpecifiedTaxRegistration').ele('ram:ID').txt(this.invoice.seller.vatNumber);
    }

    const buyerNode = tradeParties.ele('ram:BuyerTradeParty');
    buyerNode.ele('ram:Name').txt(this.invoice.buyer.name);
    if (this.invoice.buyer.vatNumber) {
      buyerNode.ele('ram:SpecifiedTaxRegistration').ele('ram:ID').txt(this.invoice.buyer.vatNumber);
    }

    // 5. Items
    for (const item of this.invoice.items) {
      const lineNode = tradeParties.ele('ram:IncludedSupplyChainTradeLineItem');
      lineNode.ele('ram:SpecifiedTradeProduct').ele('ram:Name').txt(item.description);
      lineNode.ele('ram:Quantity').txt(item.quantity.toString());
      lineNode.ele('ram:GrossPriceProductTradePrice')
        .ele('ram:ChargeAmount').txt(item.unitPrice.toFixed(2));
      lineNode.ele('ram:ApplicableTradeTax')
        .ele('ram:RateApplicablePercent').txt((item.vatRate * 100).toFixed(2));
    }

    // 6. Convertir en Buffer
    const xmlStr = root.end({ prettyPrint: true });
    return Buffer.from(xmlStr, 'utf-8');
  }
}
