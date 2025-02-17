// src/core/InvoiceLine.ts
import { AllowanceCharge } from "./AllowanceCharge";

/**
 * `InvoiceLine` is the interface for invoice line items
 * that ensures we can calculate net totals and optionally VAT.
 */
export interface InvoiceLineData {
  /**
   * The number of units or hours, etc. 
   * e.g., 2, 5, 12, 0.5
   */
  quantity: number;

  /**
   * Price per unit or service unit.
   * e.g., 100.00 (euros)
   */
  unitPrice: number;

  /**
   * Optional discount as a percentage of line cost.
   * e.g., 10 means 10% discount
   */
  discountRate?: number;

  /**
   * Optional direct discount or rebate in currency (e.g. 5.00).
   * This is subtracted from the line total after percentage discount.
   */
  rebate?: number;

  /**
   * Optional VAT or tax rate (as a percentage).
   * e.g., 20 means 20% VAT
   */
  taxRate?: number;

  description: string;
  unitCode: string;    // e.g., "C62" for unit (ISO code)
  taxCategoryCode: string; // e.g., "S" = standard VAT, "Z" = zero VAT, etc.
  lineTotalWithoutTax: number;
  /**
   * Allowances/charges APPLIQUÉES À LA LIGNE,
   * ex. remise de 10%, surcoût de 2.50, etc.
   */
  lineAllowancesCharges?: AllowanceCharge[];
}


/** Ligne de facture (HT). 
 *  On autorise des "lineAllowanceCharges" pour gérer par-ligne. 
 */
export class InvoiceLine implements InvoiceLineData {
  public allowances: AllowanceCharge[] = [];
  public charges: AllowanceCharge[] = [];
  
  constructor(
    public id: string,
    public description: string,
    public quantity: number,
    public unitPrice: number,
    public vatRate: number, // ex. 0.20 = 20%
    public taxCategoryCode: string = "S", // par défaut "S"
    public unitCode: string = "C62"
    
  ) {}
  /** Montant HT brut (avant remises-ligne, si on en gère) */
  get lineTotal(): number {
    return this.quantity * this.unitPrice;
  }

  get lineTotalWithoutTax(): number {
    return this.lineTotal;
  }

  addAllowance(amount: number, reasonText?: string) {
    this.allowances.push(new AllowanceCharge(false, amount, reasonText));
  }
  addCharge(amount: number, reasonText?: string) {
    this.charges.push(new AllowanceCharge(true, amount, reasonText));
  }

  addAllowanceCharge(amount: number, isCharge: boolean, reasonText?: string) {
    if (isCharge) {
      this.addCharge(amount, reasonText);
    } else {
      this.addAllowance(amount, reasonText);
    }
  }
  
  getAllAllowancesCharges(): AllowanceCharge[] {
    return [...this.allowances, ...this.charges];
  }

  clearAllowancesCharges() {
    this.allowances = [];
    this.charges = [];
  }
  
}

