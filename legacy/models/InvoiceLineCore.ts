/**
 * `InvoiceLineCore` is the minimal, "fixed" sub-type
 * that ensures we can calculate net totals and optionally VAT.
 */
export interface InvoiceLineCore {
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
}