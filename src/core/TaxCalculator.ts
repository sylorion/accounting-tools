import Big from 'big.js';
import { AllowanceCharge } from './AllowanceCharge';
import { InvoiceLine } from './InvoiceLine';

export interface TaxSummary {
  /** ex. 20 => 20% */
  rate: number;
  /** ex. "S" (standard), "AA" (reduced), "Z", "E", etc. */
  category: string;
  /** Base HT soumise à cette taxe */
  taxable: Big;
  /** Montant de taxe */
  taxAmount: Big;
}

export interface MonetarySummary {
  /** total HT brut des lignes (avant remises globales ou charges globales) */
  lineTotal: Big;
  /** base imposable finale après prise en compte des allowances/charges (doc-level + line-level) */
  taxBasis: Big;
  /** somme de toutes les taxes */
  taxTotal: Big;
  /** TTC final (taxBasis + taxTotal) */
  grandTotal: Big;
  /** détail par taux/catégorie */
  taxSummaries: TaxSummary[];
}
 
/**
 * Le TaxCalculator final, capable de :
 *  - Calculer un total HT, TVA, TTC,
 *  - Gérer l'arrondi par ligne ou global,
 *  - Gérer multiple taux, multiple catégories,
 *  - Incorporer allowances/charges au niveau ligne et doc-level.
 */
export class TaxCalculator {
  /**
   * Si roundMode='line' => on calcule la TVA (et on arrondit) à chaque ligne
   * avant de sommer. 
   * roundMode='global' => on somme la base imposable, puis on calcule la TVA.
   */
  constructor(private roundMode: 'line' | 'global' = 'line') {}

  /**
   * @param lines : liste des lignes (qty, unitPrice, vatRate, lineAllowancesCharges...)
   * @param docAllowancesCharges : liste des remises/frais globaux (doc-level).
   */
  computeSummary(
    lines: InvoiceLine[],
    docAllowancesCharges: AllowanceCharge[] = []
  ): MonetarySummary {

    // 1) lineTotal (somme HT brute des lignes sans doc-level)
    let lineTotal = new Big(0);

    // On indexe la TVA par (rate, category) => { taxable, tax? }
    const vatMap = new Map<string, { taxable: Big, tax?: Big }>();

    // Traitement des LIGNES
    for (const line of lines) {
      const qty = new Big(line.quantity);
      const up = new Big(line.unitPrice);
      const lineHT = qty.mul(up);
      lineTotal = lineTotal.add(lineHT);

      const lineRate = line.vatRate ?? 0;
      const lineCat  = line.taxCategoryCode ?? "S"; // par défaut "S"

      if (this.roundMode === 'line') {
        // calcul TVA de la ligne
        const tva = lineHT.mul(lineRate).round(2);
        updateVatMap(vatMap, lineRate, lineCat, lineHT, tva);
      } else {
        // on ajoute juste la base, on calculera la TVA plus tard
        updateVatMap(vatMap, lineRate, lineCat, lineHT);
      }

      // Gérer lineAllowancesCharges
      const lineAllowances = line.allowances.concat(line.charges || []);
      if (lineAllowances && lineAllowances.length > 0) {
        for (const lac of lineAllowances) {
          const lacAmount = new Big(lac.actualAmount);
          // sign : + si charge, - si remise
          const sign = lac.chargeIndicator ? +1 : -1;
          const partialBase = lacAmount.mul(sign);

          // par défaut, on applique la TVA du lac ou (lineRate + lineCat)
          const lacRate = (lac.taxRate !== undefined) ? lac.taxRate : lineRate;
          const lacCat  = (lac.taxCategoryCode) ? lac.taxCategoryCode : lineCat;

          if (this.roundMode === 'line') {
            const partialTax = partialBase.mul(lacRate).round(2);
            updateVatMap(vatMap, lacRate, lacCat, partialBase, partialTax);
          } else {
            updateVatMap(vatMap, lacRate, lacCat, partialBase);
          }

          // Cela modifie la base lineTotal
          lineTotal = lineTotal.add(partialBase);
        }
      }
      
    }

    // 2) doc-level allowances/charges
    let docBase = new Big(0);
    for (const dac of docAllowancesCharges) {
      const dacAmt = new Big(dac.actualAmount);
      const sign   = dac.chargeIndicator ? +1 : -1;
      const partialBase = dacAmt.mul(sign);

      docBase = docBase.add(partialBase);

      const rate = dac.taxRate ?? 0;
      const cat  = dac.taxCategoryCode ?? "S";

      if (this.roundMode === 'line') {
        const partialTax = partialBase.mul(rate).round(2);
        updateVatMap(vatMap, rate, cat, partialBase, partialTax);
      } else {
        updateVatMap(vatMap, rate, cat, partialBase);
      }
    }

    // => base imposable
    const taxBasis = lineTotal.add(docBase);

    // 3) Si roundMode='global', on calcule la TVA maintenant
    if (this.roundMode === 'global') {
      for (const [key, val] of vatMap.entries()) {
        if (val.tax === undefined) {
          // on récupère (rate, category) 
          const [rStr, cStr] = decodeKey(key); 
          const rate = Number(rStr);
          const tva = val.taxable.mul(rate).round(2);
          val.tax = tva;
        }
      }
    }

    // 4) totalTax => somme de val.tax
    let totalTax = new Big(0);
    const results: TaxSummary[] = [];
    for (const [key, val] of vatMap.entries()) {
      const [rStr, cStr] = decodeKey(key);
      if (!val.tax) {
        val.tax = new Big(0);
      }
      totalTax = totalTax.add(val.tax);
      results.push({
        rate: Number(rStr)*100,
        category: cStr,
        taxable: val.taxable,
        taxAmount: val.tax
      });
    }

    // => grandTotal
    const grandTotal = taxBasis.add(totalTax);

    // => on renvoie
    return {
      lineTotal,
      taxBasis,
      taxTotal: totalTax,
      grandTotal,
      taxSummaries: results
    };
  }
}

//----------------------------------------
// FONCTIONS UTILITAIRES
//----------------------------------------
function encodeKey(rate: number, cat: string): string {
  // ex. 0.20 + "S" => "0.20|S"
  return `${rate}|${cat}`;
}
function decodeKey(key: string): [string, string] {
  const [r, c] = key.split('|');
  return [r, c];
}

/** 
 * Met à jour vatMap[ (rate, cat) ] 
 * @param taxable base imposable
 * @param tax si défini => on stocke la TVA calculée, 
 * sinon on la calculera plus tard (roundMode='global').
 */
function updateVatMap(
  vatMap: Map<string, { taxable: Big; tax?: Big }>,
  rate: number,
  category: string,
  taxable: Big,
  tax?: Big
) {
  const key = encodeKey(rate, category);
  const existing = vatMap.get(key) || { taxable: new Big(0), tax: undefined };
  existing.taxable = existing.taxable.add(taxable);
  if (tax !== undefined) {
    existing.tax = (existing.tax || new Big(0)).add(tax);
  }
  vatMap.set(key, existing);
}
