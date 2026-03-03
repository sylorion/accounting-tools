# Factur-X/Order-X Validation Pipeline - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Compléter la pipeline de validation Factur-X pour passer 100% des contrôles Schematron EN16931 + BR-FR, en s'appuyant sur les XSD existants dans src/compliance/.

**Architecture:** Corrections en 2 phases : Phase 1 corrige les 10 erreurs Schematron bloquantes (URN, XML manquant, notes FR). Phase 2 ajoute la validation Schematron locale et la vraie validation XSD. Le code existant dans ValidationPipeline.ts, ProfileValidator.ts et XsdValidator.ts sert de fondation.

**Tech Stack:** TypeScript, xmlbuilder2, fast-xml-parser, @xmldom/xmldom, Jest, XSD schemas (src/compliance/xsd/)

---

## PHASE 1 : Corrections des 10 erreurs Schematron (prioritaire)

### Task 1: Corriger les URN de guideline

**Files:**
- Modify: `lib/factur-x-ts/src/core/constants.ts:25-43`
- Test: `lib/factur-x-ts/tests/unit/constants.test.ts`

**Step 1: Mettre à jour les tests pour les URN correctes**

```typescript
// Dans constants.test.ts, ajouter/modifier les tests :
it('should have correct guideline URN for MINIMUM', () => {
  expect(GUIDELINE_URNS.get(FacturxProfile.MINIMUM))
    .toBe('urn:factur-x.eu:1p0:minimum');
});
it('should have correct guideline URN for BASICWL', () => {
  expect(GUIDELINE_URNS.get(FacturxProfile.BASICWL))
    .toBe('urn:factur-x.eu:1p0:basicwl');
});
it('should have correct guideline URN for BASIC', () => {
  expect(GUIDELINE_URNS.get(FacturxProfile.BASIC))
    .toBe('urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic');
});
it('should have correct guideline URN for EN16931', () => {
  expect(GUIDELINE_URNS.get(FacturxProfile.EN16931))
    .toBe('urn:cen.eu:en16931:2017');
});
it('should have correct guideline URN for EXTENDED', () => {
  expect(GUIDELINE_URNS.get(FacturxProfile.EXTENDED))
    .toBe('urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended');
});
```

**Step 2: Vérifier que les tests échouent**

Run: `cd lib/factur-x-ts && npx jest tests/unit/constants.test.ts -v`
Expected: FAIL sur BASICWL, BASIC, EN16931, EXTENDED

**Step 3: Corriger les URN dans constants.ts**

```typescript
export const GUIDELINE_URNS = new Map<FacturxProfile, string>([
  [FacturxProfile.MINIMUM, 'urn:factur-x.eu:1p0:minimum'],
  [FacturxProfile.BASICWL, 'urn:factur-x.eu:1p0:basicwl'],
  [FacturxProfile.BASIC, 'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic'],
  [FacturxProfile.EN16931, 'urn:cen.eu:en16931:2017'],
  [FacturxProfile.EXTENDED, 'urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended'],
]);
```

**Step 4: Vérifier que les tests passent**

Run: `cd lib/factur-x-ts && npx jest tests/unit/constants.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/factur-x-ts/src/core/constants.ts lib/factur-x-ts/tests/unit/constants.test.ts
git commit -m "fix: correct guideline URNs for all Factur-X profiles per EN16931 spec"
```

---

### Task 2: Ajouter les types manquants (NoteWithCode, electronic address, SIREN scheme)

**Files:**
- Modify: `lib/factur-x-ts/src/types/index.ts`
- Test: `lib/factur-x-ts/tests/unit/entities.test.ts`

**Step 1: Ajouter NoteWithCode et les champs manquants dans types**

```typescript
// Ajouter après l'interface PostalAddress :

/**
 * Note with optional subject code (BT-21/BT-22)
 * Required for FR compliance (BR-FR-05)
 */
export interface NoteWithCode {
  /** Note content (BT-22) */
  readonly content: string;
  /** Subject code (BT-21): PMT, PMD, AAB, etc. */
  readonly subjectCode?: string;
}

// Modifier TradeParty - ajouter :
export interface TradeParty {
  // ... champs existants ...
  /** Electronic address for routing (BT-34 seller / BT-49 buyer) */
  readonly electronicAddress?: string;
  /** Electronic address scheme (e.g. 'EM' for email) */
  readonly electronicAddressScheme?: string;
  /** Legal registration identifier scheme (e.g. '0002' for SIREN) */
  readonly legalIdScheme?: string;
}

// Modifier DocumentHeader.notes :
export interface DocumentHeader {
  // ... champs existants ...
  /** Notes (string[] for backward compat, or NoteWithCode[]) */
  readonly notes?: (string | NoteWithCode)[];
}
```

**Step 2: Commit**

```bash
git add lib/factur-x-ts/src/types/index.ts
git commit -m "feat: add NoteWithCode, electronic address, and legal ID scheme types"
```

---

### Task 3: Mettre à jour entities.ts (builders)

**Files:**
- Modify: `lib/factur-x-ts/src/core/entities.ts`
- Test: `lib/factur-x-ts/tests/unit/entities.test.ts`

**Step 1: Ajouter les champs aux builders**

TradePartyBuilder : ajouter `electronicAddress()`, `electronicAddressScheme()`, `legalIdScheme()`
DocumentHeaderBuilder : ajouter `addNoteWithCode(content, subjectCode)`

**Step 2: Tests**

```typescript
it('should build TradeParty with electronic address', () => {
  const party = TradePartyImpl.builder()
    .name('Test')
    .address(addr)
    .electronicAddress('test@example.com')
    .electronicAddressScheme('EM')
    .legalId('123456789')
    .legalIdScheme('0002')
    .build();
  expect(party.electronicAddress).toBe('test@example.com');
  expect(party.legalIdScheme).toBe('0002');
});
```

**Step 3: Commit**

```bash
git add lib/factur-x-ts/src/core/entities.ts lib/factur-x-ts/tests/unit/entities.test.ts
git commit -m "feat: add electronic address and legal ID scheme to entity builders"
```

---

### Task 4: Corriger TaxCalculator pour exposer allowanceTotal/chargeTotal

**Files:**
- Modify: `lib/factur-x-ts/src/core/TaxCalculator.ts:105-163`
- Test: `lib/factur-x-ts/tests/unit/tax-calculator.test.ts`

**Step 1: Test**

```typescript
it('should expose allowanceTotal and chargeTotal separately', () => {
  const lines = [new InvoiceLine('1', 'Test', 10, 100, 0.20)];
  const docAC = [
    AllowanceCharge.allowance(10, 'Discount'),
    AllowanceCharge.charge(5, 'Shipping'),
  ];
  const summary = calculator.computeSummary(lines, docAC);
  expect(summary.allowanceTotal).toBe(10);
  expect(summary.chargeTotal).toBe(5);
  expect(summary.taxBasis).toBe(1000 - 10 + 5); // 995
});
```

**Step 2: Implémenter**

Dans `computeSummary()`, après la boucle doc-level :
```typescript
let allowanceTotal = 0;
let chargeTotal = 0;
for (const dac of docAllowancesCharges) {
  if (dac.chargeIndicator) {
    chargeTotal += dac.actualAmount;
  } else {
    allowanceTotal += dac.actualAmount;
  }
}
// Dans le return :
return { lineTotal, taxBasis, taxTotal, grandTotal, allowanceTotal, chargeTotal, taxSummaries };
```

**Step 3: Commit**

```bash
git add lib/factur-x-ts/src/core/TaxCalculator.ts lib/factur-x-ts/tests/unit/tax-calculator.test.ts
git commit -m "feat: expose allowanceTotal and chargeTotal in MonetarySummary"
```

---

### Task 5: Corriger FacturXInvoice.ts - Génération XML complète

**Files:**
- Modify: `lib/factur-x-ts/src/core/FacturXInvoice.ts` (6 corrections)
- Test: `lib/factur-x-ts/tests/unit/facturx-invoice.test.ts`

**Correction 5a: Notes avec SubjectCode (BR-FR-05)**

```typescript
// buildDocumentHeader() - remplacer le bloc notes :
if (this.header.notes && this.header.notes.length > 0) {
  for (const note of this.header.notes) {
    const noteNode = doc.ele('ram:IncludedNote');
    if (typeof note === 'string') {
      noteNode.ele('ram:Content').txt(note);
    } else {
      noteNode.ele('ram:Content').txt(note.content);
      if (note.subjectCode) {
        noteNode.ele('ram:SubjectCode').txt(note.subjectCode);
      }
    }
  }
}
```

**Correction 5b: SpecifiedLegalOrganization + URIUniversalCommunication (BT-30, BT-34, BT-49)**

```typescript
// buildHeaderTradeAgreement() - après seller.ele('ram:Name') :
if (this.seller.legalId) {
  const legalOrg = seller.ele('ram:SpecifiedLegalOrganization');
  legalOrg.ele('ram:ID', { schemeID: this.seller.legalIdScheme || '0002' })
    .txt(this.seller.legalId);
}
// ... après seller address et avant tax registration :
if (this.seller.electronicAddress) {
  const uriComm = seller.ele('ram:URIUniversalCommunication');
  uriComm.ele('ram:URIID', { schemeID: this.seller.electronicAddressScheme || 'EM' })
    .txt(this.seller.electronicAddress);
}

// Même chose pour buyer :
if (this.buyer.legalId) { /* ... */ }
if (this.buyer.electronicAddress) { /* ... */ }
```

**Correction 5c: AllowanceTotalAmount, ChargeTotalAmount, currencyID (BR-CO-13, BR-S-08)**

```typescript
// buildHeaderTradeSettlement() - section MonetarySummation :
monetary.ele('ram:LineTotalAmount').txt(formatAmount(summary.lineTotal));
// NOUVEAU: émettre les allowances/charges totaux
monetary.ele('ram:ChargeTotalAmount').txt(formatAmount(summary.chargeTotal ?? 0));
monetary.ele('ram:AllowanceTotalAmount').txt(formatAmount(summary.allowanceTotal ?? 0));
monetary.ele('ram:TaxBasisTotalAmount').txt(formatAmount(summary.taxBasis));
// NOUVEAU: currencyID sur TaxTotalAmount
monetary.ele('ram:TaxTotalAmount', { currencyID: this.currency })
  .txt(formatAmount(summary.taxTotal));
monetary.ele('ram:GrandTotalAmount').txt(formatAmount(summary.grandTotal));
monetary.ele('ram:DuePayableAmount').txt(formatAmount(summary.dueAmount ?? summary.grandTotal));
```

**Correction 5d: Émettre SpecifiedTradeAllowanceCharge au niveau document**

```typescript
// buildHeaderTradeSettlement() - entre payment means et tax breakdown :
// Document-level allowances/charges
for (const ac of this.docAllowancesCharges) {
  const acNode = settlement.ele('ram:SpecifiedTradeAllowanceCharge');
  acNode.ele('ram:ChargeIndicator').ele('udt:Indicator').txt(ac.chargeIndicator ? 'true' : 'false');
  acNode.ele('ram:ActualAmount').txt(formatAmount(ac.actualAmount));
  if (ac.reason) {
    acNode.ele('ram:Reason').txt(ac.reason);
  }
  if (ac.reasonCode) {
    acNode.ele('ram:ReasonCode').txt(ac.reasonCode);
  }
  const acTax = acNode.ele('ram:CategoryTradeTax');
  acTax.ele('ram:TypeCode').txt('VAT');
  acTax.ele('ram:CategoryCode').txt(ac.taxCategoryCode ?? 'S');
  acTax.ele('ram:RateApplicablePercent').txt(formatAmount((ac.taxRate ?? 0.20) * 100));
}
```

**Step: Tests pour toutes les corrections**

```typescript
describe('FR compliance', () => {
  it('should emit notes with SubjectCode', () => {
    // créer facture avec notes FR
    const xml = invoice.generateXml();
    expect(xml).toContain('<ram:SubjectCode>PMT</ram:SubjectCode>');
    expect(xml).toContain('<ram:SubjectCode>PMD</ram:SubjectCode>');
    expect(xml).toContain('<ram:SubjectCode>AAB</ram:SubjectCode>');
  });

  it('should emit seller SIREN (BT-30)', () => {
    const xml = invoice.generateXml();
    expect(xml).toContain('schemeID="0002"');
    expect(xml).toContain('123456789');
  });

  it('should emit electronic addresses (BT-34, BT-49)', () => {
    const xml = invoice.generateXml();
    expect(xml).toContain('URIUniversalCommunication');
    expect(xml).toContain('schemeID="EM"');
  });

  it('should emit AllowanceTotalAmount and ChargeTotalAmount', () => {
    const xml = invoice.generateXml();
    expect(xml).toContain('AllowanceTotalAmount');
    expect(xml).toContain('ChargeTotalAmount');
  });

  it('should emit currencyID on TaxTotalAmount', () => {
    const xml = invoice.generateXml();
    expect(xml).toContain('currencyID="EUR"');
  });
});
```

**Step: Commit**

```bash
git add lib/factur-x-ts/src/core/FacturXInvoice.ts lib/factur-x-ts/tests/unit/facturx-invoice.test.ts
git commit -m "fix: complete XML generation for Schematron compliance (BR-CO-13, BR-S-08, BR-FR-05/10/12/13)"
```

---

## PHASE 2 : Pipeline de validation complète

### Task 6: Validation XSD réelle avec les schémas existants

**Files:**
- Create: `lib/factur-x-ts/src/validation/RealXsdValidator.ts`
- Modify: `lib/smp-factur-x-ts/src/validation/ValidationPipeline.ts`
- Test: `lib/factur-x-ts/tests/unit/real-xsd-validator.test.ts`

**Description:**
Utiliser les XSD existants dans `src/compliance/xsd/facturx-{profile}/` avec `node-libxml` ou `libxmljs` pour faire une vraie validation XSD (pas juste la vérification structurelle actuelle de XsdValidator.ts).

**Approche:**
1. Charger le bon XSD selon le profil détecté dans le XML
2. Valider le XML généré contre le XSD complet
3. Retourner les erreurs avec les lignes/colonnes
4. Intégrer dans ValidationPipeline comme étape entre ProfileValidator et les contrôles PDF

**Map profil → XSD:**
```typescript
const XSD_PATHS = new Map([
  ['MINIMUM', 'src/compliance/xsd/facturx-minimum/Factur-X_1.07.2_MINIMUM.xsd'],
  ['BASICWL', 'src/compliance/xsd/facturx-basicwl/Factur-X_1.07.2_BASICWL.xsd'],
  ['BASIC', 'src/compliance/xsd/facturx-basic/Factur-X_1.07.2_BASIC.xsd'],
  ['EN16931', 'src/compliance/xsd/facturx-en16931/Factur-X_1.07.2_EN16931.xsd'],
  ['EXTENDED', 'src/compliance/xsd/facturx-extended/Factur-X_1.07.2_EXTENDED.xsd'],
]);
```

---

### Task 7: Validation Schematron locale (règles métier EN16931)

**Files:**
- Create: `src/compliance/schematron/EN16931-CII-validation.sch` (télécharger depuis CEN TC 434)
- Create: `src/compliance/schematron/FACTUR-X-FR-rules.sch` (règles BR-FR)
- Create: `lib/factur-x-ts/src/validation/SchematronValidator.ts`
- Test: `lib/factur-x-ts/tests/unit/schematron-validator.test.ts`

**Description:**
Implémenter un validateur Schematron qui exécute les ~200 règles métier EN16931 localement, sans dépendre d'un outil en ligne. Options :
1. Compiler les .sch en XSLT puis exécuter avec `xslt-processor`
2. Utiliser `node-schematron` si disponible
3. Parser les assertions Schematron et les évaluer via XPath

**Règles critiques à implémenter en priorité :**
- BR-01 à BR-16 : Champs obligatoires
- BR-CO-10 à BR-CO-17 : Cohérence des montants
- BR-S-01 à BR-S-10 : Catégorie TVA Standard
- BR-FR-05, BR-FR-10, BR-FR-12, BR-FR-13 : Règles françaises

---

### Task 8: Validation des code lists

**Files:**
- Create: `src/compliance/codelists/` (JSON extraits des XSD code lists)
- Create: `lib/factur-x-ts/src/validation/CodeListValidator.ts`
- Test: `lib/factur-x-ts/tests/unit/codelist-validator.test.ts`

**Description:**
Valider que les codes utilisés (currency, country, tax category, unit, document type) sont dans les listes officielles.

**Code lists à valider :**
- ISO 4217 : Currency codes
- ISO 3166-1 : Country codes
- UNTDID 1001 : Document type codes
- UNTDID 5305 : Tax category codes
- UN/ECE Rec 20/21 : Unit codes
- UNTDID 4461 : Payment means codes

---

### Task 9: Corriger les stubs dans ValidationPipeline

**Files:**
- Modify: `lib/smp-factur-x-ts/src/validation/ValidationPipeline.ts:396-509`
- Test: `lib/smp-factur-x-ts/src/__tests__/validation/integration.test.ts`

**Description:**
Remplacer les stubs (hasEmbeddedFile hardcodé à true, hasXmpMetadata qui vérifie juste le titre) par de vraies vérifications :
- Parser le PDF avec pdf-lib pour extraire les fichiers embarqués
- Vérifier que `factur-x.xml` est présent avec le bon MIME type
- Vérifier les metadata XMP (fx:ConformanceLevel, fx:Version, fx:DocumentFileName)
- Vérifier AFRelationship = "Data"

---

### Task 10: Ajouter la validation post-génération automatique

**Files:**
- Modify: `lib/smp-factur-x-ts/src/core/TemplateRenderer.ts`
- Create: `lib/factur-x-ts/src/validation/PostGenerationValidator.ts`
- Test: `lib/factur-x-ts/tests/unit/post-generation-validator.test.ts`

**Description:**
Après chaque génération de PDF, exécuter automatiquement :
1. Validation XSD du XML généré
2. Validation des règles métier Schematron prioritaires
3. Vérification des montants (BR-CO-13, BR-S-08)
4. Vérification des champs FR obligatoires si seller.countryCode === 'FR'
5. Retourner un rapport structuré avec score de conformité

---

### Task 11: Tests d'intégration avec les samples officiels Factur-X

**Files:**
- Create: `src/compliance/samples/` (exemples XML officiels du package Factur-X)
- Create: `lib/factur-x-ts/tests/integration/official-samples.test.ts`
- Test: Validation round-trip

**Description:**
Télécharger les exemples XML officiels du package Factur-X 1.07.2 et :
1. Les valider avec notre pipeline
2. Générer des factures similaires et valider le XML produit
3. Comparer structure et conformité

---

### Task 12: Support Order-X (fondations)

**Files:**
- Create: `lib/factur-x-ts/src/core/OrderXDocument.ts`
- Create: `lib/factur-x-ts/src/validation/OrderXProfileValidator.ts`
- Leverage: `src/compliance/xsd/orderx-{basic,comfort,extended}/`
- Test: `lib/factur-x-ts/tests/unit/orderx.test.ts`

**Description:**
Ajouter le support de base pour Order-X en utilisant les XSD déjà présents dans src/compliance/xsd/orderx-*/. Même architecture que FacturXInvoice mais avec :
- Root element : `rsm:SCRDMCCBDACIOMessageStructure`
- Namespace CIO au lieu de CII
- 3 profils : BASIC, COMFORT, EXTENDED
- 3 types de message : ORDER, ORDER_RESPONSE, ORDER_CHANGE
- Fichier embarqué : `order-x.xml`

---

## Ordre d'exécution recommandé

```
Phase 1 (parallélisable) :
  Task 1 ──┐
  Task 2 ──┤── en parallèle (fichiers indépendants)
  Task 3 ──┤
  Task 4 ──┘
  Task 5 ────── après Tasks 1-4 (dépend des types et TaxCalculator)

Phase 2 (séquentiel) :
  Task 6 ── Validation XSD réelle
  Task 7 ── Schematron local
  Task 8 ── Code lists
  Task 9 ── Fix stubs ValidationPipeline
  Task 10 ── Validation post-génération auto
  Task 11 ── Tests samples officiels
  Task 12 ── Order-X (optionnel)
```

## Critères de succès

- [ ] Les 10 erreurs Schematron identifiées sont corrigées
- [ ] Le XML généré passe la validation sur portail-facturx.com
- [ ] Validation XSD locale fonctionne pour les 5 profils
- [ ] Au minimum 50 règles métier EN16931 validées localement
- [ ] Tous les tests existants continuent de passer
- [ ] Couverture de tests ≥ 80%
- [ ] Aucun breaking change sur l'API existante
