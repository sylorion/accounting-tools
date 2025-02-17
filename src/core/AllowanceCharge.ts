import { TaxCategoryCode } from "./EnumInvoiceType";

/**
 * Informations de remise ou de charge (au niveau document ou ligne),
 * conformes à la structure "ram:SpecifiedTradeAllowanceCharge" en Factur-X.
 */
export class AllowanceCharge {
  /** 
   * true => charge (frais / surcoût), 
   * false => remise/rabais 
   */
  constructor(
    public chargeIndicator: boolean,
    /** Montant fixe si applicable, ex. 10.00 => 10 EUR */
    public actualAmount: number,
    /** Raison textuelle */
    public reason?: string,
    /** Code motif (ex. liste UN/CEFACT 7161 ou 5189) */
    public reasonCode?: string,
    /**
     * Taux de taxe applicable à cette charge/remise, ex. 0.20 => 20%.
     * (Peut être 0 pour exonération.)
     */
    public taxRate?: number,
    /** Catégorie de taxe (S, Z, E...) */
    public taxCategoryCode?: TaxCategoryCode,

    /** 
     * (Optionnel) Période de validité, 
     * ex. remise appliquée du 01/04/2025 au 30/04/2025 
     */
    public startDate?: Date,
    public endDate?: Date,

    /** 
     * (Optionnel) Mode de calcul, ex. pourcent => 0.10 => 10%. 
     * Si set, on peut calculer actualAmount en fonction du "basis" 
     */
    public percentage?: number
  ) {
  } 
}
