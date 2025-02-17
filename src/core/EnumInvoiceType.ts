// src/core/EnumInvoiceType.ts


//------------------------------------
//  ENUMS et CODES
//------------------------------------

/** 
 * Profil Factur-X : BASIC ou EXTENDED
 * Cf. UNTDID 1001 ou EN16931. 
 */
export enum FacturxProfile {
  BASIC = "BASIC",
  EN16931 = "EN16931",
  EXTENDED = "EXTENDED"
}

      
/** 
 * Code de type de document (Factur-X)
 * Cf. UNTDID 1001 ou EN16931. 
 */

export enum DocTypeCode {
  INVOICE = "380",
  CREDIT_NOTE = "381",
  DEBIT_NOTE = "382",
  CORRECTION = "383",
  PRO_FORMAT = "384", // Estimate, Quote or Pro Forma Invoice
  ADVANCE_PAYMENT = "385",
  FINAL_INVOICE = "386",
  CREDIT_MEMO = "387",
  ADJUSTMENT_INVOICE = "388",
}


/**
 * Identifiants légaux possibles (SchemeID).
 * Ex. "0002" = SIRET France, "0088" = GLN (Europe), etc.
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
 * Catégories de taxe communes Factur-X
 * Cf. UNTDID 5305 ou EN16931. 
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
 * Types of e-invoicing compliance
 */
export enum ComplianceType {
  FR_FACTUR_X = "FR_FACTUR_X",
  GENERIC_UBL = "GENERIC_UBL",
  OTHER_REGION = "OTHER_REGION"
}
