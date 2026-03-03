# Rapport d'Alignement Visuel - Factures PDF

**Date:** 3 mars 2026
**Statut:** TERMINE - Tous les templates valides

---

## RESUME

15 PDFs generes (5 templates x 3 types de documents), tous sur **1 page**.
3 XMLs Factur-X valides contre le schema XSD EN16931 officiel.
330 tests unitaires passent.

---

## BUGS CORRIGES

### BUG-01 [CRITIQUE] - Lignes du tableau invisibles
- **Cause:** Condition de saut de page `currentY > startY` toujours vraie, reinitialisant Y a chaque iteration
- **Fix:** Detection par numero de page (`pageNumber > pageBefore`)
- **Impact:** 5/5 templates corriges

### BUG-02 - Titre toujours "FACTURE"
- **Fix:** Utilisation de `invoice.header.name` (FACTURE/AVOIR/DEVIS) au lieu de `strings.invoice`
- **Impact:** 5/5 templates, TemplateRenderer base

### BUG-03 - Dates manquantes dans l'entete
- **Fix:** Ajout "Date d'emission" + "Date d'echeance" (dynamique, defaut +60j) dans tous les headers
- **Impact:** 5/5 templates

### BUG-04 - Footer absent sur certaines pages / pagination incorrecte
- **Fix:** Systeme de footer differe (`drawAllPageFooters`) dessine sur TOUTES les pages apres rendu complet
- **Fix:** Methode `drawSinglePageFooter` overridable par chaque template pour son theme
- **Impact:** Architecture TemplateRenderer + 5/5 templates

### BUG-05 - Layout vertical causant des factures de 2 pages
- **Fix:** Layout cote-a-cote (paiement gauche / totaux droite / TVA sous totaux)
- **Impact:** 5/5 templates, factures de 7-8 lignes tiennent sur 1 page

### BUG-06 - Placeholders "YOUR COMPANY" dans Brand/Corporate
- **Fix:** Utilisation dynamique de `invoice.seller.name`
- **Impact:** Brand, Corporate

### BUG-07 - Labels en anglais dans Minimal
- **Fix:** Utilisation de `this.strings.*` localises au lieu de textes hardcodes
- **Impact:** Minimal

### BUG-08 - XSD : ordre des elements XML incorrect
- **Fix 1:** `Name` supprime de `ExchangedDocument` (non autorise EN16931)
- **Fix 2:** `TaxTotal` supprime (redondant avec `MonetarySummation`)
- **Fix 3:** `SpecifiedTradePaymentMeans` renomme en `SpecifiedTradeSettlementPaymentMeans`
- **Fix 4:** BIC deplace comme enfant de `PaymentMeans` au lieu de `FinancialAccount`
- **Fix 5:** Lignes (`IncludedSupplyChainTradeLineItem`) avant headers dans `SupplyChainTradeTransaction`
- **Impact:** Core FacturXInvoice.ts, 3/3 XMLs valides

---

## ETAT FINAL PAR TEMPLATE

| Template | Design | Footer | Layout | Pages | Qualite |
|----------|--------|--------|--------|:-----:|:-------:|
| Modern | Bleu, professionnel | Bleu/gris + ligne bleue | Cote-a-cote | 1 | 9/10 |
| Fancy | Rose/bleu, creatif | Rose+bleu degrade | Cote-a-cote | 1 | 9/10 |
| Brand | Navy/orange, corporate | Navy + accent orange | Cote-a-cote | 1 | 9/10 |
| Corporate | Gris/bleu/gold, elegant | Gris + accent gold | Cote-a-cote | 1 | 9/10 |
| Minimal | Monochrome, epure | Ligne fine, discret | Cote-a-cote | 1 | 9/10 |

---

## VALIDATION

| Critere | Resultat |
|---------|:--------:|
| Tests unitaires (330) | PASS |
| XSD EN16931 facture.xml | VALIDE |
| XSD EN16931 avoir.xml | VALIDE |
| XSD EN16931 devis.xml | VALIDE |
| PDF/A-3 conformite | Embarque |
| Toutes lignes visibles | OK |
| Dates emission/echeance | OK |
| Titre dynamique | OK |
| Footer sur chaque page | OK |
| Pagination X sur Y | OK |
| Date generation en clair | OK |
| 1 page (7-8 lignes) | OK |

---

## FICHIERS GENERES

```
output/
  facture-modern.pdf    avoir-modern.pdf    devis-modern.pdf
  facture-fancy.pdf     avoir-fancy.pdf     devis-fancy.pdf
  facture-brand.pdf     avoir-brand.pdf     devis-brand.pdf
  facture-corporate.pdf avoir-corporate.pdf devis-corporate.pdf
  facture-minimal.pdf   avoir-minimal.pdf   devis-minimal.pdf
  facture.xml           avoir.xml           devis.xml
  _initial/             (versions avant correction pour comparaison)
```

## COMMANDE DE GENERATION

```bash
npm run generate:all
```
