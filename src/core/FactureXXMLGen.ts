// facturx-invoice.ts
import { create } from 'xmlbuilder2';


export enum FacturxProfile { 
  BASIC = "BASIC", 
  EN16931 = "EN16931", 
  EXTENDED = "EXTENDED" 
}

export enum DocTypeCode { 
  INVOICE = "380", 
  CREDIT_NOTE = "381" 

} 


 /**
Pour Factur-X / ZUGFeRD, on utilise une liste restreinte de codes (souvent référencée depuis UNTDID 5305 ou la recommandation EN 16931). Les codes fréquemment rencontrés sont :

Code	Signification
S	Standard Rate (taux normal de TVA)
AA	Reduced Rate (taux réduit)
Z	Zero rated (taux zéro, facturé à 0%)
E	Exempt (exonération de TVA)
AE	Reverse charge (autoliquidation, le client est le redevable)
O	Services hors scope (non taxable, ex. hors UE)
G	Exportation (soumis à un taux 0 “exonération export”)
(“G” et “O” sont parfois interchangeables selon le contexte ; EN 16931 mentionne G pour export, O pour hors-champ de TVA.)


 * 
 */
export enum TaxCategoryCode {
  STANDARD = "S",       // Taux normal
  REDUCED = "AA",       // Taux réduit
  ZERO = "Z",           // Taux zéro
  EXEMPT = "E",         // Exonéré
  REVERSE_CHARGE = "AE",// Autoliquidation
  OUT_OF_SCOPE = "O",   // Hors champ
  EXPORT = "G"          // Export
}
  /**
 * schemeID	Signification
0002	SIRET (France)
0004	INSEE (France) – plus rare, concerne NNE unique
0007	EAN (European Article Number)
0088	GLN (Global Location Number, GS1)
0106	DUNS (D-U-N-S Number, Dun & Bradstreet)
0142	ATU (numéro TVA Autriche) – parfois utilisé
0177	OIN (Organisational ID Number) – usage variable
9906	USt-IdNr (numéro TVA allemand)
9907	Autres identifiants pays DE (Steuernummer)
  * 
  */
 
export enum LegalOrganizationScheme {
  SIRET_0002 = "0002",
  INSEE_0004 = "0004",
  EAN_0007 = "0007",
  GLN_0088 = "0088",
  DUNS_0106 = "0106",
  OIN_0177 = "0177",
  USTID_9906 = "9906",
  STEUERNR_9907 = "9907"
}

/**
 * Adresse postale de base
 */
export class PostalAddress {
  constructor(
    public line1: string,
    public city: string,
    public postalCode: string,
    public countryCode: string = "FR",
    public line2?: string
  ) {}
}

/**
 * Partie (vendeur, acheteur) : nom + adresse
 */
export class TradeParty {
  constructor(
    public name: string,
    public postalAddress: PostalAddress,
    public vatNumber?: string
  ) {}
}

/**
 * Informations de paiement simplifiées (code de moyen, IBAN, etc.)
 */
export class PaymentDetails {
  constructor(
    public paymentMeansCode: string, // ex. "58" pour virement SEPA
    public payeeIban?: string,
    public payeeBic?: string,
    public dueDate?: Date,
    public paymentTermsText?: string
  ) {}
}

/**
 * Ligne de facture (HT)
 */
export class InvoiceLine {
  constructor(
    public id: string,
    public description: string,
    public quantity: number,
    public unitPrice: number,
    public vatRate: number, // ex. 0.20 = 20%
    public unitCode: string = "C62"
  ) {}

  get lineTotal(): number {
    return this.quantity * this.unitPrice;
  }
}

/**
 * En-tête de la facture
 */
export class InvoiceHeader {
  constructor(
    public invoiceNumber: string,
    public invoiceDate: Date,
    public typeCode: string = "380", // 380 = Invoice, 381 = CreditNote
    public notes: string[] = []
  ) {}
}


export interface ProfileConstraints {
  mandatoryFields: string[];
  forbiddenFields: string[];
}

export const PROFILE_POLICIES: Record<FacturxProfile, ProfileConstraints> = {
  BASIC: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer"
    ],
    forbiddenFields: [
      // On refuse la "deliveryParty" par ex.
      "deliveryParty",
      "additionalDocs"
    ]
  },
  EN16931: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer",
      // On veut s'assurer de l'existence d'un code TVA => on fera un check custom plus loin
    ],
    forbiddenFields: []
  },
  EXTENDED: {
    mandatoryFields: [
      "header.invoiceNumber",
      "header.invoiceDate",
      "seller",
      "buyer"
    ],
    forbiddenFields: []
  }
};


/**
 * Classe principale FacturXInvoice
 */
export class FacturXInvoice {
  public deliveryParty?: TradeParty;
  public additionalDocs?: any[] = [];

  constructor(
    public profile: FacturxProfile,
    public header: InvoiceHeader,
    public seller: TradeParty,
    public buyer: TradeParty,
    public payment: PaymentDetails,
    public lines: InvoiceLine[] = []
  ) {}

  public validateProfile() {
    const policy = PROFILE_POLICIES[this.profile];

    // 1. Champs interdits
    for (const f of policy.forbiddenFields) {
      if (this.hasField(f)) {
        throw new Error(`[FacturX] Le profil ${this.profile} interdit le champ '${f}', or il est renseigné.`);
      }
    }

    // 2. Champs obligatoires
    for (const f of policy.mandatoryFields) {
      if (!this.hasField(f)) {
        throw new Error(`[FacturX] Le profil ${this.profile} exige le champ '${f}', qui est manquant.`);
      }
    }

    // 3. Vérifications supplémentaires (ex: EN16931 => le vendeur doit avoir un ID TVA)
    if (this.profile === FacturxProfile.EN16931) {
      const hasVAT = !!(this.seller?.vatNumber);
      if (!hasVAT) {
        throw new Error(`[FacturX] Profil EN16931: le vendeur doit avoir un vatNumber.`);
      }
    }
  }

  /** 
   * Exemple d'une méthode de génération
   */
  public generateXmlWithProfileCheck(): string {
    this.validateProfile();
    return generateFacturxXml(this); // On réutilise la génération du point 1
  }

  private hasField(f: string): boolean {
    // path type: "header.invoiceNumber"
    const parts = f.split('.');
    let current: any = this;
    for (const p of parts) {
      current = current[p];
      if (current == null) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Formatage date en AAAAMMJJ (format 102)
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Génére l'URN de profil Factur-X (BASIC, EN16931, EXTENDED)
 * Ex. "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:extended"
 */
function getGuidelineURN(profile: FacturxProfile): string {
  const base = "urn:factur-x.eu:1p0:";
  let suffix = profile.toLowerCase();
  if (profile === FacturxProfile.EN16931) suffix = "en16931"; 
  return `urn:cen.eu:en16931:2017#compliant#${base}${suffix}`;
}

/**
 * Construction XML via xmlbuilder2 (fini la concaténation fragile).
 */
export function generateFacturxXml(invoice: FacturXInvoice): string {
  // On crée la racine
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rsm:CrossIndustryInvoice', {
      // Namespaces requis
      'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
      'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
      'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100'
    });

  // 1. ExchangedDocumentContext
  const contextNode = root.ele('rsm:ExchangedDocumentContext');
  const paramNode = contextNode.ele('ram:GuidelineSpecifiedDocumentContextParameter');
  paramNode.ele('ram:ID').txt(getGuidelineURN(invoice.profile));

  // 2. ExchangedDocument (header)
  const docNode = root.ele('rsm:ExchangedDocument');
  docNode.ele('ram:ID').txt(invoice.header.invoiceNumber);
  docNode.ele('ram:TypeCode').txt(invoice.header.typeCode);
  docNode
    .ele('ram:IssueDateTime')
      .ele('udt:DateTimeString', { format: "102" })
      .txt(formatDate(invoice.header.invoiceDate))
    .up(); // ferme <udt:DateTimeString>
  // notes
  for (const note of invoice.header.notes) {
    docNode.ele('ram:IncludedNote').ele('ram:Content').txt(note);
  }

  // 3. SupplyChainTradeTransaction
  const tradeNode = root.ele('rsm:SupplyChainTradeTransaction');

  // 3.1. ApplicableHeaderTradeAgreement
  const agreementNode = tradeNode.ele('ram:ApplicableHeaderTradeAgreement');
  // Seller
  const sellerNode = agreementNode.ele('ram:SellerTradeParty');
  sellerNode.ele('ram:Name').txt(invoice.seller.name);
  const sellerAddr = sellerNode.ele('ram:PostalTradeAddress');
  sellerAddr.ele('ram:PostcodeCode').txt(invoice.seller.postalAddress.postalCode);
  sellerAddr.ele('ram:LineOne').txt(invoice.seller.postalAddress.line1);
  if (invoice.seller.postalAddress.line2) {
    sellerAddr.ele('ram:LineTwo').txt(invoice.seller.postalAddress.line2);
  }
  sellerAddr.ele('ram:CityName').txt(invoice.seller.postalAddress.city);
  sellerAddr.ele('ram:CountryID').txt(invoice.seller.postalAddress.countryCode);
  if (invoice.seller.vatNumber) {
    const taxReg = sellerNode.ele('ram:SpecifiedTaxRegistration');
    taxReg.ele('ram:ID', { schemeID: 'VAT' }).txt(invoice.seller.vatNumber);
  }

  // Buyer
  const buyerNode = agreementNode.ele('ram:BuyerTradeParty');
  buyerNode.ele('ram:Name').txt(invoice.buyer.name);
  const buyerAddr = buyerNode.ele('ram:PostalTradeAddress');
  buyerAddr.ele('ram:PostcodeCode').txt(invoice.buyer.postalAddress.postalCode);
  buyerAddr.ele('ram:LineOne').txt(invoice.buyer.postalAddress.line1);
  if (invoice.buyer.postalAddress.line2) {
    buyerAddr.ele('ram:LineTwo').txt(invoice.buyer.postalAddress.line2);
  }
  buyerAddr.ele('ram:CityName').txt(invoice.buyer.postalAddress.city);
  buyerAddr.ele('ram:CountryID').txt(invoice.buyer.postalAddress.countryCode);
  if (invoice.buyer.vatNumber) {
    const taxReg = buyerNode.ele('ram:SpecifiedTaxRegistration');
    taxReg.ele('ram:ID', { schemeID: 'VAT' }).txt(invoice.buyer.vatNumber);
  }

  // 3.2. ApplicableHeaderTradeDelivery
  const deliveryNode = tradeNode.ele('ram:ApplicableHeaderTradeDelivery');
  // (Ex: si on veut préciser date/lieu de livraison => pas implémenté dans ce sample)

  // 3.3. ApplicableHeaderTradeSettlement (paiement, etc.)
  const settlementNode = tradeNode.ele('ram:ApplicableHeaderTradeSettlement');
  // PaymentMeans
  const payMeans = settlementNode.ele('ram:PaymentMeans');
  payMeans.ele('ram:TypeCode').txt(invoice.payment.paymentMeansCode);
  if (invoice.payment.payeeIban) {
    const payeeAcc = payMeans.ele('ram:PayeeAccount');
    payeeAcc.ele('ram:IBANID').txt(invoice.payment.payeeIban);
    if (invoice.payment.payeeBic) {
      payeeAcc.ele('ram:ProprietaryID').txt(invoice.payment.payeeBic);
    }
  }
  if (invoice.payment.dueDate || invoice.payment.paymentTermsText) {
    const paymentTerms = settlementNode.ele('ram:PaymentTerms');
    if (invoice.payment.dueDate) {
      paymentTerms
        .ele('ram:DueDateDateTime')
          .ele('udt:DateTimeString', { format: "102" })
          .txt(formatDate(invoice.payment.dueDate))
        .up();
    }
    if (invoice.payment.paymentTermsText) {
      paymentTerms.ele('ram:DirectDebitMandateID').txt(invoice.payment.paymentTermsText);
    }
  }

  // TODO: Remises/Charges/Totaux => ex. <ram:TaxTotal>, <ram:SpecifiedTradeSettlementHeaderMonetarySummation>

  // 4. Lignes de facture
  for (const line of invoice.lines) {
    const lineItemNode = tradeNode.ele('ram:IncludedSupplyChainTradeLineItem');
    // AssociatedDocumentLineDocument
    const docLine = lineItemNode.ele('ram:AssociatedDocumentLineDocument');
    docLine.ele('ram:LineID').txt(line.id);

    // SpecifiedTradeProduct
    const productNode = lineItemNode.ele('ram:SpecifiedTradeProduct');
    productNode.ele('ram:Name').txt(line.description);

    // SpecifiedLineTradeAgreement
    const lineAgreement = lineItemNode.ele('ram:SpecifiedLineTradeAgreement');
    const priceNode = lineAgreement.ele('ram:GrossPriceProductTradePrice');
    priceNode.ele('ram:ChargeAmount').txt(line.unitPrice.toFixed(2));
    priceNode.ele('ram:BasisQuantity', { unitCode: line.unitCode }).txt(line.quantity.toString());

    // SpecifiedLineTradeDelivery
    const lineDelivery = lineItemNode.ele('ram:SpecifiedLineTradeDelivery');
    lineDelivery.ele('ram:BilledQuantity', { unitCode: line.unitCode }).txt(line.quantity.toString());

    // SpecifiedLineTradeSettlement
    const lineSettlement = lineItemNode.ele('ram:SpecifiedLineTradeSettlement');
    const taxNode = lineSettlement.ele('ram:ApplicableTaxApplicableTradeTax');
    taxNode.ele('ram:RateApplicablePercent').txt((line.vatRate * 100).toString());
    // category code "S" (standard) par défaut => adapt if needed
    taxNode.ele('ram:CategoryCode').txt('S');

    const lineSum = lineSettlement.ele('ram:SpecifiedTradeSettlementLineMonetarySummation');
    lineSum.ele('ram:LineTotalAmount').txt(line.lineTotal.toFixed(2));
  }

  // 5. Convertir l'arbre XML en string
  const xmlString = root.end({ prettyPrint: false });
  return xmlString;
}
