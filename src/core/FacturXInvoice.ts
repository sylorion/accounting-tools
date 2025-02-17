import { ComplianceType, TaxCategoryCode } from './EnumInvoiceType';
/**********************************************************************************************
 * FacturXInvoice.ts
 * 
 * Gère une facture Factur-X (profil EXTENDED ou autres).
 * Inclut :
 *  - Les structures de ligne (InvoiceLine)
 *  - Les remises/charges (FacturXAllowanceCharge), au niveau document et/ou ligne
 *  - La prise en compte des taxes (TaxCategoryCode), 
 *  - La génération d'un XML conforme Factur-X via xmlbuilder2
 *  - Un calcul de total via un TaxCalculator (arrondi, multi-taux, etc.)
 * 
 * Conçu pour être conforme au profil EXTENDED : 
 *  - On peut y ajouter toutes les informations additionnelles (périodes, codes, etc.).
 **********************************************************************************************/

import { create } from 'xmlbuilder2';
import { TaxCalculator, MonetarySummary} from './TaxCalculator';  // => À adapter selon votre arborescence
import { DocumentHeader } from './DocumentHeader';
import { TradeParty } from './HeaderTradeAgreement';
import { AllowanceCharge } from './AllowanceCharge';
import { FacturxProfile } from './EnumInvoiceType';
import { PROFILE_POLICIES } from './ConstanteInvoiceData';
import { PaymentDetails } from './PaymentDetails';
import { InvoiceLine } from './InvoiceLine'; 
import { AdditionalDocument } from './AdditionalDocument';
//------------------------------------
//  CLASSE PRINCIPALE FacturXInvoice
//------------------------------------

// Classe Totaux de taxes par catégorie
class TaxTotal {
  constructor(
    public taxCategory: TaxCategoryCode,
    public taxRate: number,
    public taxableAmount: number,
    public taxAmount: number
  ) {}
}

export class FacturXInvoice {
  public notes?: string;
  public disclaimers?: string[];
  public paymentTerms?: string;
  
  /** Documents référencés / pièces jointes */
  public additionalDocs: AdditionalDocument[] = [];
  /** Liste de remises ou frais globales (doc-level) */
  public docAllowanceCharges: AllowanceCharge[] = [];

  /** La devise de facturation (ex. EUR) */
  public currency: string = "EUR";

  /**
   * Le TaxCalculator fait l'arrondi et la répartition 
   * (ex. 'line' => arrondi par ligne, 'global' => arrondi global).
   */
  private calculator = new TaxCalculator('line');
  public taxTotals: TaxTotal[] = [];

  // Optionals for Extended profile:
  /** Destinataire de livraison (profil Extended) */
  public deliveryParty?: TradeParty;   // destinataire livraison (optionnel)

  public payeeParty?: TradeParty;      // bénéficiaire paiement si distinct
  public buyerOrderReference?: string; // référence commande client
  
  constructor(
    public profile: FacturxProfile,
    public header: DocumentHeader,
    public seller: TradeParty,
    public buyer: TradeParty,
    public payment: PaymentDetails,
    /** Lignes de facture */
    public lines: InvoiceLine[] = []
  ) {}

  //-------------------------------------
  // Contrôle du profil
  //-------------------------------------
  public validateProfile() {
    const policy = PROFILE_POLICIES[this.profile];

    // 1) Champs interdits
    for (const f of policy.forbiddenFields) {
      if (this.hasField(f)) {
        throw new Error(`[FacturX] Le profil ${this.profile} interdit le champ '${f}', mais il est renseigné.`);
      }
    }

    // 2) Champs obligatoires
    for (const f of policy.mandatoryFields) {
      if (!this.hasField(f)) {
        throw new Error(`[FacturX] Le profil ${this.profile} exige le champ '${f}', qui est manquant.`);
      }
    }

    // 3) Exigences EN16931 => la Seller doit avoir un VAT ID
    if (this.profile === FacturxProfile.EN16931) {
      const hasVAT = !!(this.seller?.vatNumber);
      if (!hasVAT) {
        throw new Error(`[FacturX] Profil EN16931: le vendeur doit avoir un vatNumber.`);
      }
    }
  }

  /**
   * Calcule les totaux (HT, TVA, TTC), en incluant 
   *  - docAllowanceCharges (globales)
   *  - lineAllowanceCharges (par-ligne)
   */
  public finalizeTotals(): MonetarySummary {
    // 1) Convertir lines + lineAllowanceCharges => un format calculable
    const linesData = this.lines

    // 2) doc-level allowances & charges
    const docAllChgs = this.docAllowanceCharges; // array of FacturXAllowanceCharge

    // 3) Appel au TaxCalculator
    const summary = this.calculator.computeSummary(linesData, docAllChgs);
    return summary;
  }

  /**
   * Génère l'XML Factur-X complet
   * @param checkProfile si true, on vérifie la conformité profil avant
   */
  public generateXml(checkProfile: boolean = true): string {
    if (checkProfile) {
      this.validateProfile();
    }
    const summary = this.finalizeTotals();
    const xml = generateFacturxXml(this, summary);
    return xml;
  }

  private hasField(f: string): boolean {
    const parts = f.split('.');
    let current: any = this;
    for (const p of parts) {
      current = current[p];
      if (current == null) return false;
    }
    return true;
  }

}

//-------------------------------------
//  Fonctions auxiliaires
//-------------------------------------
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
function getGuidelineURN(profile: FacturxProfile): string {
  const base = "urn:factur-x.eu:1p0:";
  let suffix = profile.toLowerCase();
  if (profile === FacturxProfile.EN16931) suffix = "en16931"; 
  return `urn:cen.eu:en16931:2017#compliant#${base}${suffix}`;
}

//-------------------------------------
//  GÉNÉRATION XML
//-------------------------------------
export function generateFacturxXml(invoice: FacturXInvoice, summary: MonetarySummary): string {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rsm:CrossIndustryInvoice', {
      'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
      'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
      'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100'
    });

  // (1) ExchangedDocumentContext
  const contextNode = root.ele('rsm:ExchangedDocumentContext');
  const paramNode = contextNode.ele('ram:GuidelineSpecifiedDocumentContextParameter');
  paramNode.ele('ram:ID').txt(getGuidelineURN(invoice.profile));

  // (2) ExchangedDocument (header)
  const docNode = root.ele('rsm:ExchangedDocument');
  docNode.ele('ram:ID').txt(invoice.header.id);
  docNode.ele('ram:TypeCode').txt(invoice.header.typeCode.toString());
  docNode.ele('ram:IssueDateTime')
    .ele('udt:DateTimeString', { format: '102' })
    .txt(formatDate(invoice.header.issueDate))
  .up();
  if (invoice.header.name) {
    docNode.ele('ram:Name').txt(invoice.header.name);
  }
  for (const note of invoice.header.notes) {
    docNode.ele('ram:IncludedNote')
      .ele('ram:Content').txt(note).up()
    .up();
  }

  // (3) SupplyChainTradeTransaction
  const tradeNode = root.ele('rsm:SupplyChainTradeTransaction');

  // 3.1. HeaderTradeAgreement -> Seller/Buyer
  const agreementNode = tradeNode.ele('ram:ApplicableHeaderTradeAgreement');
  {
    // Seller
    const sellerNode = agreementNode.ele('ram:SellerTradeParty');
    sellerNode.ele('ram:Name').txt(invoice.seller.name);
    const sAddr = sellerNode.ele('ram:PostalTradeAddress');
    sAddr.ele('ram:PostcodeCode').txt(invoice.seller.postalAddress.postalCode);
    sAddr.ele('ram:LineOne').txt(invoice.seller.postalAddress.line1);
    if (invoice.seller.postalAddress.line2) {
      sAddr.ele('ram:LineTwo').txt(invoice.seller.postalAddress.line2);
    }
    sAddr.ele('ram:CityName').txt(invoice.seller.postalAddress.city);
    sAddr.ele('ram:CountryID').txt(invoice.seller.postalAddress.countryCode);
    if (invoice.seller.vatNumber) {
      const taxReg = sellerNode.ele('ram:SpecifiedTaxRegistration');
      taxReg.ele('ram:ID', { schemeID: 'VAT' }).txt(invoice.seller.vatNumber);
    }

    // Si invoice.seller est un TradeParty et possède des contacts
    if ('contacts' in invoice.seller && invoice.seller.contacts.length > 0) {
      for (const contact of invoice.seller.contacts) {
        const contactNode = sellerNode.ele('ram:DefinedTradeContact');
        if (contact.contactName) {
          contactNode.ele('ram:PersonName').txt(contact.contactName);
        }
        if (contact.contactPhoneNumber) {
          const phoneNode = contactNode.ele('ram:TelephoneUniversalCommunication');
          phoneNode.ele('ram:CompleteNumber').txt(contact.contactPhoneNumber);
        }
        if (contact.contactEmail) {
          const emailNode = contactNode.ele('ram:EmailURIUniversalCommunication');
          emailNode.ele('ram:URIID').txt(contact.contactEmail);
        }
      }
    }

    // Buyer
    const buyerNode = agreementNode.ele('ram:BuyerTradeParty');
    buyerNode.ele('ram:Name').txt(invoice.buyer.name);
    const bAddr = buyerNode.ele('ram:PostalTradeAddress');
    bAddr.ele('ram:PostcodeCode').txt(invoice.buyer.postalAddress.postalCode);
    bAddr.ele('ram:LineOne').txt(invoice.buyer.postalAddress.line1);
    if (invoice.buyer.postalAddress.line2) {
      bAddr.ele('ram:LineTwo').txt(invoice.buyer.postalAddress.line2);
    }
    bAddr.ele('ram:CityName').txt(invoice.buyer.postalAddress.city);
    bAddr.ele('ram:CountryID').txt(invoice.buyer.postalAddress.countryCode);
    if (invoice.buyer.vatNumber) {
      const buyerTaxReg = buyerNode.ele('ram:SpecifiedTaxRegistration');
      buyerTaxReg.ele('ram:ID', { schemeID: 'VAT' }).txt(invoice.buyer.vatNumber);
    }

    // Si invoice.buyer est un TradeParty et possède des contacts
    if ('contacts' in invoice.buyer && invoice.buyer.contacts.length > 0) {
      for (const contact of invoice.buyer.contacts) {
        const bcNode = buyerNode.ele('ram:DefinedTradeContact');
        
        if (contact.contactName) {
          bcNode.ele('ram:PersonName').txt(contact.contactName);
        }
        if (contact.contactPhoneNumber) {
          const phoneNode = bcNode.ele('ram:TelephoneUniversalCommunication');
          phoneNode.ele('ram:CompleteNumber').txt(contact.contactPhoneNumber);
        }
        if (contact.contactEmail) {
          const emailNode = bcNode.ele('ram:EmailURIUniversalCommunication');
          emailNode.ele('ram:URIID').txt(contact.contactEmail);
        }
      }
    }
  }

  // 3.2. HeaderTradeDelivery
  const deliveryNode = tradeNode.ele('ram:ApplicableHeaderTradeDelivery');
  if (invoice.deliveryParty) {
    const shipTo = deliveryNode.ele('ram:ShipToTradeParty');
    shipTo.ele('ram:Name').txt(invoice.deliveryParty.name);
    // ... etc. on pourrait remplir l’adresse
  }

  // 3.3. HeaderTradeSettlement
  const settlementNode = tradeNode.ele('ram:ApplicableHeaderTradeSettlement');
  settlementNode.ele('ram:InvoiceCurrencyCode').txt(invoice.currency);

  // => Insérer doc-level allowances/charges 
  for (const ac of invoice.docAllowanceCharges) {
    addAllowanceChargeNode(settlementNode, ac, /* docLevel */ true);
  }

  // TOTaux taxes
  // On suppose que 'summary' contient la ventilation par taux (TaxSummary)
  for (const ts of summary.taxSummaries) {
    const taxTotalNode = settlementNode.ele('ram:TaxTotal');
    taxTotalNode.ele('ram:TaxBasisTotalAmount').txt(ts.taxable.toFixed(2));
    taxTotalNode.ele('ram:TaxTotalAmount').txt(ts.taxAmount.toFixed(2));
    const catNode = taxTotalNode.ele('ram:TaxCategory');
    catNode.ele('ram:CategoryCode').txt(ts.category);
    catNode.ele('ram:RateApplicablePercent').txt(ts.rate.toFixed(2));
  }

  // => monetary summation
  const monSummation = settlementNode.ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation');
  monSummation.ele('ram:LineTotalAmount').txt(summary.lineTotal.toFixed(2));
  monSummation.ele('ram:TaxBasisTotalAmount').txt(summary.taxBasis.toFixed(2));
  monSummation.ele('ram:TaxTotalAmount').txt(summary.taxTotal.toFixed(2));
  monSummation.ele('ram:GrandTotalAmount').txt(summary.grandTotal.toFixed(2));

  // => PaymentMeans 
  const payMeans = settlementNode.ele('ram:PaymentMeans');
  payMeans.ele('ram:TypeCode').txt(invoice.payment.paymentMeansCode);
  if (invoice.payment.payeeIBAN) {
    const payeeAcc = payMeans.ele('ram:PayeeAccount');
    payeeAcc.ele('ram:IBANID').txt(invoice.payment.payeeIBAN);
    if (invoice.payment.payeeBIC) {
      payeeAcc.ele('ram:ProprietaryID').txt(invoice.payment.payeeBIC);
    }
  }
  if (invoice.payment.dueDate || invoice.payment.paymentTermsText) {
    const pTerms = settlementNode.ele('ram:PaymentTerms');
    if (invoice.payment.dueDate) {
      pTerms.ele('ram:DueDateDateTime')
        .ele('udt:DateTimeString', { format: '102' })
        .txt(formatDate(invoice.payment.dueDate))
      .up();
    }
    if (invoice.payment.paymentTermsText) {
      pTerms.ele('ram:DirectDebitMandateID').txt(invoice.payment.paymentTermsText);
    }
  }

  // (4) Lignes
  for (const line of invoice.lines) {
    const lineItemNode = tradeNode.ele('ram:IncludedSupplyChainTradeLineItem');

    const docLine = lineItemNode.ele('ram:AssociatedDocumentLineDocument');
    docLine.ele('ram:LineID').txt(line.id);

    const prodNode = lineItemNode.ele('ram:SpecifiedTradeProduct');
    prodNode.ele('ram:Name').txt(line.description);

    // => line trade agreement 
    const lineAgreement = lineItemNode.ele('ram:SpecifiedLineTradeAgreement');
    // => line-level Charge
    for (const lc of line.charges) {
      addAllowanceChargeNode(lineAgreement, lc, /* docLevel */ false);
    }
    // => line-level Allowance
    for (const la of line.allowances) {
      addAllowanceChargeNode(lineAgreement, la, /* docLevel */ false);
    }
    
    // => prix 
    const priceNode = lineAgreement.ele('ram:GrossPriceProductTradePrice');
    priceNode.ele('ram:ChargeAmount').txt(line.unitPrice.toFixed(2));
    priceNode.ele('ram:BasisQuantity', { unitCode: line.unitCode }).txt(line.quantity.toString());

    // => line delivery
    const lineDelivery = lineItemNode.ele('ram:SpecifiedLineTradeDelivery');
    lineDelivery.ele('ram:BilledQuantity', { unitCode: line.unitCode }).txt(line.quantity.toString());

    // => line settlement
    const lineSettlement = lineItemNode.ele('ram:SpecifiedLineTradeSettlement');
    const taxNode = lineSettlement.ele('ram:ApplicableTaxApplicableTradeTax');
    taxNode.ele('ram:RateApplicablePercent').txt((line.vatRate * 100).toFixed(2));
    // par défaut "S" (standard), à adapter 
    taxNode.ele('ram:CategoryCode').txt('S');

    const lineSum = lineSettlement.ele('ram:SpecifiedTradeSettlementLineMonetarySummation');
    lineSum.ele('ram:LineTotalAmount').txt(line.lineTotal.toFixed(2));
  }

  const xmlString = root.end({ prettyPrint: false });
  return xmlString;
}

/**
 * Ajoute un bloc `ram:SpecifiedTradeAllowanceCharge` 
 * dans l'élément parent (headerTradeSettlement ou lineTradeAgreement).
 * 
 * @param parentNode node parent (ex. settlementNode ou lineAgreement)
 * @param ac l'objet FacturXAllowanceCharge
 * @param docLevel bool => si c'est doc-level, on utilise <ram:ChargeIndicator> autrement
 */
function addAllowanceChargeNode(
  parentNode: any,
  ac: AllowanceCharge,
  docLevel: boolean
) {
  const acNode = parentNode.ele('ram:SpecifiedTradeAllowanceCharge');
  acNode.ele('ram:ChargeIndicator')
    .ele('udt:Indicator').txt(ac.chargeIndicator ? "true" : "false").up()
  .up();

  // Montant
  acNode.ele('ram:ActualAmount').txt(ac.actualAmount.toFixed(2));

  // Raison
  if (ac.reason) {
    acNode.ele('ram:Reason').txt(ac.reason);
  }
  if (ac.reasonCode) {
    acNode.ele('ram:ReasonCode').txt(ac.reasonCode);
  }

  // Taux de taxe 
  if (ac.taxRate !== undefined) {
    // ex. 0.20 => 20
    acNode.ele('ram:CategoryTradeTax').ele('ram:RateApplicablePercent').txt((ac.taxRate * 100).toFixed(2)).up();
    // => Catégorie
    acNode.ele('ram:CategoryTradeTax').ele('ram:CategoryCode').txt(ac.taxCategoryCode || "S").up();
  }

  // Période
  if (ac.startDate || ac.endDate) {
    const periodNode = acNode.ele('ram:EffectiveSpecifiedPeriod');
    if (ac.startDate) {
      periodNode.ele('ram:StartDateTime')
        .ele('udt:DateTimeString', { format: "102" })
        .txt(formatDate(ac.startDate))
      .up();
    }
    if (ac.endDate) {
      periodNode.ele('ram:EndDateTime')
        .ele('udt:DateTimeString', { format: "102" })
        .txt(formatDate(ac.endDate))
      .up();
    }
  }
}
