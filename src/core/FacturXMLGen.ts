// Enumérations utiles pour certains codes
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
FRVAT	Identifiant TVA au format FRxx… (rarement sous cette forme)

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
enum Profile { BASIC = "BASIC", EN16931 = "EN16931", EXTENDED = "EXTENDED" }
enum DocTypeCode { INVOICE = "380", CREDIT_NOTE = "381" }  // 380 = Invoice, 381 = Credit note
enum TaxCategoryCode { STANDARD = "S", VAT_EXEMPT = "E", ZERO = "Z", REVERSE_CHARGE = "AE" /* etc. */ }

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

// Classe Adresse postale
class PostalAddress {
  constructor(
    public line1: string,
    public postalCode: string,
    public city: string,
    public countryCode: string = "FR",  // FR par défaut, modifiable
    public line2?: string
  ) {}
}

// Classe Partie (acheteur/vendeur ou autre)
class TradeParty {
  public postalAddress: PostalAddress;
  public taxRegistrations: { scheme: string, id: string }[] = [];

  constructor(
    public name: string,
    postalAddress: PostalAddress,
    public legalOrganizationId?: string,       // ex: SIRET ou ID Légale
    public legalOrganizationScheme?: string,   // ex: "0002" pour SIRET, "0088" pour GLN, "VAT" pour TVA...
    public contactName?: string,
    public contactEmail?: string,
    public contactPhone?: string
  ) {
    this.postalAddress = postalAddress;
  }

  addTaxRegistration(scheme: string, id: string) {
    this.taxRegistrations.push({ scheme, id });
  }
}

// Classe Contexte du document (profil, etc.)
class DocumentContext {
  public guidelineId: string;
  constructor(profile: Profile) {
    // Définit l'URN du contexte en fonction du profil
    const facturxURN = "urn:factur-x.eu:1p0:";
    let profileURN = profile.toLowerCase();
    if(profile === Profile.EN16931) profileURN = "en16931"; // en16931 alias comfort
    this.guidelineId = `urn:cen.eu:en16931:2017#compliant#${facturxURN}${profileURN}`;
  }
}

// Classe En-tête de la facture (document échangé)
class DocumentHeader {
  public issueDate: Date;
  public typeCode: DocTypeCode;
  public notes: string[] = [];

  constructor(
    public id: string,              // numéro de facture
    issueDate?: Date,
    typeCode: DocTypeCode = DocTypeCode.INVOICE,
    public name?: string            // intitulé du document (ex: "FACTURE")
  ) {
    this.issueDate = issueDate || new Date();
    this.typeCode = typeCode;
  }

  addNote(note: string) {
    this.notes.push(note);
  }
}

// Classe pour les conditions de paiement / paiement
class PaymentDetails {
  public paymentTermsText?: string;
  constructor(
    public paymentMeansCode: string,      // code du moyen de paiement (e.g., "58" virement SEPA)
    public payeeIBAN?: string,
    public payeeBIC?: string,
    public dueDate?: Date                // date échéance paiement
  ) {}

  setPaymentTerms(text: string) {
    this.paymentTermsText = text;
  }
}

// Classe Ligne de facture
class InvoiceLine {
  public lineTotal: number;
  public allowances: AllowanceCharge[] = [];
  public charges: AllowanceCharge[] = [];

  constructor(
    public id: string | number,
    public productName: string,
    public quantity: number,
    public unitPrice: number,
    public taxRate: number,
    public taxCategory: TaxCategoryCode = TaxCategoryCode.STANDARD,
    public unitCode: string = "C62",   // "C62" = unit (piece) by default
    public description?: string
  ) {
    // Calcule le total HT de la ligne (quantité * prix unitaire)
    this.lineTotal = this.quantity * this.unitPrice;
  }

  addAllowance(amount: number, reasonText?: string) {
    this.allowances.push(new AllowanceCharge(false, amount, reasonText));
  }
  addCharge(amount: number, reasonText?: string) {
    this.charges.push(new AllowanceCharge(true, amount, reasonText));
  }
}

// Classe Remise/Charge
class AllowanceCharge {
  // chargeIndicator = true => c'est une charge (frais en plus), false => une remise (réduction)
  constructor(
    public chargeIndicator: boolean,
    public amount: number,
    public reasonText?: string,
    public taxRate?: number        // taux de TVA spécifique si différent de la ligne/document
  ) {}
}

// Classe Totaux de taxes par catégorie
class TaxTotal {
  constructor(
    public taxCategory: TaxCategoryCode,
    public taxRate: number,
    public taxableAmount: number,
    public taxAmount: number
  ) {}
}

// Classe Totaux généraux (monetary summation)
class MonetaryTotal {
  constructor(
    public lineTotalAmount: number,
    public taxBasisAmount: number,    // total HT après remises/charges
    public taxTotalAmount: number,
    public grandTotalAmount: number   // total TTC à payer (montant dû)
  ) {}
}

// Classe Document additionnel (références supplémentaires, pièces jointes)
class AdditionalDocument {
  constructor(
    public documentTypeCode: string,   // ex: "130" (order), "916" (supporting document)
    public id?: string,                // identifiant du document (e.g., numéro de commande)
    public name?: string,              // nom du document
    public attachmentPath?: string     // chemin ou référence de la pièce jointe si applicable
  ) {}
}

// Classe principale FacturXInvoice
class FacturXInvoice {
  public context: DocumentContext;
  public header: DocumentHeader;
  public seller: TradeParty;
  public buyer: TradeParty;
  public lineItems: InvoiceLine[] = [];
  public paymentDetails: PaymentDetails;
  public allowances: AllowanceCharge[] = [];
  public charges: AllowanceCharge[] = [];
  public taxTotals: TaxTotal[] = [];
  public additionalDocs: AdditionalDocument[] = [];

  // Optionals for Extended profile:
  public deliveryParty?: TradeParty;   // destinataire livraison (optionnel)
  public payeeParty?: TradeParty;      // bénéficiaire paiement si distinct
  public buyerOrderReference?: string; // référence commande client

  constructor(
    public profile: Profile,
    header: DocumentHeader,
    seller: TradeParty,
    buyer: TradeParty,
    payment: PaymentDetails
  ) {
    this.context = new DocumentContext(profile);
    this.header = header;
    this.seller = seller;
    this.buyer = buyer;
    this.paymentDetails = payment;
  }

  addLineItem(line: InvoiceLine) {
    this.lineItems.push(line);
  }
  addAllowance(amount: number, reasonText?: string) {
    this.allowances.push(new AllowanceCharge(false, amount, reasonText));
  }
  addCharge(amount: number, reasonText?: string) {
    this.charges.push(new AllowanceCharge(true, amount, reasonText));
  }
  addAdditionalDocument(doc: AdditionalDocument) {
    this.additionalDocs.push(doc);
  }

  // Calcule les totaux de taxes et montants, et génère les objets TaxTotal et MonetaryTotal
  finalizeTotals(): MonetaryTotal {
    // Calcul du total des lignes
    const lineTotalSum = this.lineItems.reduce((sum, line) => sum + line.lineTotal, 0);

    // Appliquer remises/charges globales
    const totalAllowances = this.allowances.reduce((sum, alc) => sum + alc.amount, 0);
    const totalCharges = this.charges.reduce((sum, c) => sum + c.amount, 0);
    const taxBasisTotal = lineTotalSum - totalAllowances + totalCharges;

    // Calcul des taxes par taux
    const taxMap: { [rate: number]: { taxable: number, tax: number } } = {};
    // Inclure taxes des lignes
    for (const line of this.lineItems) {
      const rate = line.taxRate;
      const taxableAmount = line.lineTotal;
      const taxAmount = +(taxableAmount * rate / 100).toFixed(2);  // arrondi 2 décimales
      if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
      taxMap[rate].taxable += taxableAmount;
      taxMap[rate].tax += taxAmount;
    }
    // Inclure taxes sur charges globales (s'il y a lieu et qu'on décide d'appliquer TVA idem taux standard)
    for (const charge of this.charges) {
      const rate = charge.taxRate ?? this.getStandardTaxRate();
      const taxableAmount = charge.amount;
      const taxAmount = +(taxableAmount * rate / 100).toFixed(2);
      if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
      taxMap[rate].taxable += taxableAmount;
      taxMap[rate].tax += taxAmount;
    }
    // Retrait des remises globales n'affecte pas directement la TVA sauf si spécifique, déjà déduit du taxBasis

    // Créer les objets TaxTotal
    this.taxTotals = [];
    for (const rate in taxMap) {
      const taxInfo = taxMap[rate];
      const category = (rate === "0") ? TaxCategoryCode.ZERO : TaxCategoryCode.STANDARD;
      this.taxTotals.push(new TaxTotal(category, Number(rate), +taxInfo.taxable.toFixed(2), +taxInfo.tax.toFixed(2)));
    }

    // Calcul du total TVA global
    const totalTaxAmount = this.taxTotals.reduce((sum, t) => sum + t.taxAmount, 0);

    // Montant total TTC (Grand Total)
    const grandTotal = taxBasisTotal + totalTaxAmount;
    // Stocker le MonetaryTotal (peut aussi être retourné)
    const totals = new MonetaryTotal(lineTotalSum, taxBasisTotal, +totalTaxAmount.toFixed(2), +grandTotal.toFixed(2));
    return totals;
  }

  // Méthode utilitaire pour obtenir un taux standard (par ex le premier taux non zéro)
  private getStandardTaxRate(): number {
    const nonZeroLine = this.lineItems.find(l => l.taxRate > 0);
    return nonZeroLine ? nonZeroLine.taxRate : 0;
  }

  // Génération XML conforme Factur-X
  toXML(): string {
    // Cette fonction parcourrait les propriétés et construirait une chaîne XML.
    // Pour la brièveté, on montre une structure simplifiée.
    // En production, on utiliserait une lib XML builder ou des templates.
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" ...>\n`;
    xml += `  <rsm:ExchangedDocumentContext>\n`;
    xml += `    <ram:GuidelineSpecifiedDocumentContextParameter>\n`;
    xml += `      <ram:ID>${this.context.guidelineId}</ram:ID>\n`;
    xml += `    </ram:GuidelineSpecifiedDocumentContextParameter>\n`;
    xml += `  </rsm:ExchangedDocumentContext>\n`;
    xml += `  <rsm:ExchangedDocument>\n`;
    xml += `    <ram:ID>${this.header.id}</ram:ID>\n`;
    xml += `    <ram:TypeCode>${this.header.typeCode}</ram:TypeCode>\n`;
    xml += `    <ram:IssueDateTime><udt:DateTimeString format="102">${formatDate(this.header.issueDate)}</udt:DateTimeString></ram:IssueDateTime>\n`;
    if (this.header.name) {
      xml += `    <ram:Name>${this.header.name}</ram:Name>\n`;
    }
    for (const note of this.header.notes) {
      xml += `    <ram:IncludedNote><ram:Content>${note}</ram:Content></ram:IncludedNote>\n`;
    }
    xml += `  </rsm:ExchangedDocument>\n`;
    xml += `  <rsm:SupplyChainTradeTransaction>\n`;
    xml += `    <ram:ApplicableHeaderTradeAgreement>\n`;
    xml += `      <ram:SellerTradeParty>\n`;
    xml += `        <ram:Name>${this.seller.name}</ram:Name>\n`;
    xml += `        <ram:PostalTradeAddress>\n`;
    xml += `          <ram:PostcodeCode>${this.seller.postalAddress.postalCode}</ram:PostcodeCode>\n`;
    xml += `          <ram:LineOne>${this.seller.postalAddress.line1}</ram:LineOne>\n`;
    if (this.seller.postalAddress.line2) {
      xml += `          <ram:LineTwo>${this.seller.postalAddress.line2}</ram:LineTwo>\n`;
    }
    xml += `          <ram:CityName>${this.seller.postalAddress.city}</ram:CityName>\n`;
    xml += `          <ram:CountryID>${this.seller.postalAddress.countryCode}</ram:CountryID>\n`;
    xml += `        </ram:PostalTradeAddress>\n`;
    if (this.seller.legalOrganizationId) {
      xml += `        <ram:SpecifiedLegalOrganization>\n`;
      xml += `          <ram:ID schemeID="${this.seller.legalOrganizationScheme||''}">${this.seller.legalOrganizationId}</ram:ID>\n`;
      xml += `        </ram:SpecifiedLegalOrganization>\n`;
    }
    for (const tax of this.seller.taxRegistrations) {
      xml += `        <ram:SpecifiedTaxRegistration>\n`;
      xml += `          <ram:ID schemeID="${tax.scheme}">${tax.id}</ram:ID>\n`;
      xml += `        </ram:SpecifiedTaxRegistration>\n`;
    }
    xml += `      </ram:SellerTradeParty>\n`;
    xml += `      <ram:BuyerTradeParty>\n`;
    xml += `        <ram:Name>${this.buyer.name}</ram:Name>\n`;
    // ... (similaire à SellerTradeParty pour l'adresse et IDs)
    xml += `      </ram:BuyerTradeParty>\n`;
    if (this.buyerOrderReference) {
      xml += `      <ram:BuyerOrderReferencedDocument>\n`;
      xml += `        <ram:ID>${this.buyerOrderReference}</ram:ID>\n`;
      xml += `      </ram:BuyerOrderReferencedDocument>\n`;
    }
    xml += `    </ram:ApplicableHeaderTradeAgreement>\n`;
    xml += `    <ram:ApplicableHeaderTradeDelivery>\n`;
    if (this.deliveryParty) {
      xml += `      <ram:ShipToTradeParty>\n`;
      xml += `        <ram:Name>${this.deliveryParty.name}</ram:Name>\n`;
      // ... (adresse livraison)
      xml += `      </ram:ShipToTradeParty>\n`;
    }
    xml += `      <!-- Delivery date can be added here if available -->\n`;
    xml += `    </ram:ApplicableHeaderTradeDelivery>\n`;
    xml += `    <ram:ApplicableHeaderTradeSettlement>\n`;
    xml += `      <ram:PaymentMeans>\n`;
    xml += `        <ram:TypeCode>${this.paymentDetails.paymentMeansCode}</ram:TypeCode>\n`;
    if (this.paymentDetails.payeeIBAN) {
      xml += `        <ram:PayeeAccount>\n`;
      xml += `          <ram:IBANID>${this.paymentDetails.payeeIBAN}</ram:IBANID>\n`;
      if (this.paymentDetails.payeeBIC) {
        xml += `          <ram:ProprietaryID>${this.paymentDetails.payeeBIC}</ram:ProprietaryID>\n`;
      }
      xml += `        </ram:PayeeAccount>\n`;
    }
    xml += `      </ram:PaymentMeans>\n`;
    if (this.paymentDetails.dueDate || this.paymentDetails.paymentTermsText) {
      xml += `      <ram:PaymentTerms>\n`;
      if (this.paymentDetails.dueDate) {
        xml += `        <ram:DueDateDateTime><udt:DateTimeString format="102">${formatDate(this.paymentDetails.dueDate)}</udt:DateTimeString></ram:DueDateDateTime>\n`;
      }
      if (this.paymentDetails.paymentTermsText) {
        xml += `        <ram:DirectDebitMandateID>${this.paymentDetails.paymentTermsText}</ram:DirectDebitMandateID>\n`; // using a field to carry text
      }
      xml += `      </ram:PaymentTerms>\n`;
    }
    // Allowances/charges globales
    for(const alc of this.allowances.concat(this.charges)) {
      xml += `      <ram:SpecifiedTradeAllowanceCharge>\n`;
      xml += `        <ram:ChargeIndicator><udt:Indicator>${alc.chargeIndicator}</udt:Indicator></ram:ChargeIndicator>\n`;
      xml += `        <ram:ActualAmount>${alc.amount.toFixed(2)}</ram:ActualAmount>\n`;
      if(alc.reasonText) {
        xml += `        <ram:Reason>${alc.reasonText}</ram:Reason>\n`;
      }
      xml += `      </ram:SpecifiedTradeAllowanceCharge>\n`;
    }
    // Totaux de taxes
    this.finalizeTotals();
    for(const taxTotal of this.taxTotals) {
      xml += `      <ram:TaxTotal>\n`;
      xml += `        <ram:TaxBasisTotalAmount>${taxTotal.taxableAmount.toFixed(2)}</ram:TaxBasisTotalAmount>\n`;
      xml += `        <ram:TaxTotalAmount>${taxTotal.taxAmount.toFixed(2)}</ram:TaxTotalAmount>\n`;
      xml += `        <ram:TaxCategory>\n`;
      xml += `          <ram:CategoryCode>${taxTotal.taxCategory}</ram:CategoryCode>\n`;
      xml += `          <ram:RateApplicablePercent>${taxTotal.taxRate}</ram:RateApplicablePercent>\n`;
      xml += `        </ram:TaxCategory>\n`;
      xml += `      </ram:TaxTotal>\n`;
    }
    // Totaux monétaires
    const totals = this.finalizeTotals();
    xml += `      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>\n`;
    xml += `        <ram:LineTotalAmount>${totals.lineTotalAmount.toFixed(2)}</ram:LineTotalAmount>\n`;
    xml += `        <ram:TaxBasisTotalAmount>${totals.taxBasisAmount.toFixed(2)}</ram:TaxBasisTotalAmount>\n`;
    xml += `        <ram:TaxTotalAmount>${totals.taxTotalAmount.toFixed(2)}</ram:TaxTotalAmount>\n`;
    xml += `        <ram:GrandTotalAmount>${totals.grandTotalAmount.toFixed(2)}</ram:GrandTotalAmount>\n`;
    xml += `      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>\n`;
    xml += `    </ram:ApplicableHeaderTradeSettlement>\n`;
    // Lignes de facture
    for(const line of this.lineItems) {
      xml += `    <ram:IncludedSupplyChainTradeLineItem>\n`;
      xml += `      <ram:AssociatedDocumentLineDocument><ram:LineID>${line.id}</ram:LineID></ram:AssociatedDocumentLineDocument>\n`;
      xml += `      <ram:SpecifiedTradeProduct>\n`;
      xml += `        <ram:Name>${line.productName}</ram:Name>\n`;
      if(line.description) {
        xml += `        <ram:Description>${line.description}</ram:Description>\n`;
      }
      xml += `      </ram:SpecifiedTradeProduct>\n`;
      xml += `      <ram:SpecifiedLineTradeAgreement>\n`;
      xml += `        <ram:GrossPriceProductTradePrice>\n`;
      xml += `          <ram:ChargeAmount>${line.unitPrice.toFixed(2)}</ram:ChargeAmount>\n`;
      xml += `          <ram:BasisQuantity unitCode="${line.unitCode}">${line.quantity}</ram:BasisQuantity>\n`;
      xml += `        </ram:GrossPriceProductTradePrice>\n`;
      xml += `      </ram:SpecifiedLineTradeAgreement>\n`;
      xml += `      <ram:SpecifiedLineTradeDelivery>\n`;
      xml += `        <ram:BilledQuantity unitCode="${line.unitCode}">${line.quantity}</ram:BilledQuantity>\n`;
      xml += `      </ram:SpecifiedLineTradeDelivery>\n`;
      xml += `      <ram:SpecifiedLineTradeSettlement>\n`;
      xml += `        <ram:ApplicableTaxApplicableTradeTax>\n`;
      xml += `          <ram:CategoryCode>${line.taxCategory}</ram:CategoryCode>\n`;
      xml += `          <ram:RateApplicablePercent>${line.taxRate}</ram:RateApplicablePercent>\n`;
      xml += `        </ram:ApplicableTaxApplicableTradeTax>\n`;
      xml += `        <ram:SpecifiedTradeSettlementLineMonetarySummation>\n`;
      xml += `          <ram:LineTotalAmount>${line.lineTotal.toFixed(2)}</ram:LineTotalAmount>\n`;
      xml += `        </ram:SpecifiedTradeSettlementLineMonetarySummation>\n`;
      xml += `      </ram:SpecifiedLineTradeSettlement>\n`;
      xml += `    </ram:IncludedSupplyChainTradeLineItem>\n`;
    }
    xml += `  </rsm:SupplyChainTradeTransaction>\n`;
    xml += `</rsm:CrossIndustryInvoice>`;
    return xml;
  }
}

// Petite fonction utilitaire pour formater la date en "yyyyMMdd" (format 102)
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
