# RAPPORT D'ANALYSE COMPARATIVE src/ vs lib/

## Date: 2025-11-15
## Objectif: Migration complète avec amélioration

---

## 1. FONCTIONNALITÉS IDENTIFIÉES DANS src/

### ✅ CORE BUSINESS LOGIC (src/core/)

#### Multi-devises Support
```typescript
// src/models/Invoice.ts:77
currency: string;  // ✅ EUR, USD, GBP, etc.

// src/core/FacturXInvoice.ts:101
public currency: string = "EUR";  // Default mais configurable
```
**Status**: ❌ MANQUANT dans lib/ (hardcodé EUR uniquement)

#### Multi-langues Support
```typescript
// src/models/Invoice.ts:18-26
const MESSAGES: { [key: string]: { [key: string]: string } } = {
  en: { missingSeller: "Seller information is required" },
  fr: { missingSeller: "Informations vendeur manquantes" }
};

// src/models/Invoice.ts:99
language?: string;  // "en", "fr" pour contenu
```
**Status**: ⚠️ PARTIEL dans lib/ (FR, EN, DE dans templates mais pas extensible)

#### Multi-régions/Compliance
```typescript
// src/models/Invoice.ts:39-43
export enum ComplianceType {
  FR_FACTUR_X = "FR_FACTUR_X",
  GENERIC_UBL = "GENERIC_UBL",
  OTHER_REGION = "OTHER_REGION"
}
```
**Status**: ❌ MANQUANT dans lib/ (seulement Factur-X)

#### Validation XSD avec libxmljs
```typescript
// src/models/Invoice.ts:115-130
function validateXmlString(xml: string, profile: FacturxProfile): void {
  const xsdPath = SCHEMA_PATH[profile];
  const xsdSchemaContent = fs.readFileSync(path.join(__dirname, xsdPath), 'utf-8');
  const xsdDoc = libxmljs.parseXml(xsdSchemaContent);
  const xmlDoc = libxmljs.parseXml(xml);
  const isValid = xmlDoc.validate(xsdDoc);
  // ...
}
```
**Status**: ⚠️ PLACEHOLDER dans lib/ (XsdValidator sans vraie validation)

---

### ✅ TEMPLATES PDF (src/generators/templates/)

**Templates Identifiés:**
1. ✅ `Modern2024InvoiceTemplate` - Template moderne actif
2. ✅ `ModernHTMLInvoiceTemplate` - Template HTML actif
3. ⚠️ `ModernLogoInvoiceTemplate` - Commenté
4. ⚠️ `ModernDesignedInvoiceTemplate` - Commenté
5. ⚠️ `DefaultInvoiceTemplate` - Commenté
6. ⚠️ `ModernInvoiceRender` - Commenté

**Status**: ❌ lib/ a seulement 1 template (ModernTemplate)

**Fonctionnalités Templates:**
- Générique avec type `<TLine extends InvoiceLineCore>`
- Support logo
- Multi-pages automatique
- Thèmes configurables

---

### ✅ GÉNÉRATION PDF (src/generators/InvoicePDF.ts)

**Fonctionnalités:**
- ✅ Signature PDF cryptographique
- ✅ Vérification signature
- ✅ Métadonnées PDF configurables
- ✅ Extraction XML embarqué
- ✅ Sauvegarde avec options

**Status**: ❌ MANQUANT dans lib/ (pas de signature)

---

### ✅ MODELS (src/models/)

**Structures de données:**
- `Invoice<TLine>` - Générique sur type de ligne
- `InvoiceData<TLine>` - Data transfer object
- `InvoiceLineCore` - Interface ligne de base
- `BuyerInfo`, `SellerInfo` - Informations parties
- `BaseInvoiceItem` - Item de base

**Status**: ⚠️ PARTIEL dans lib/ (moins flexible, pas générique)

---

### ✅ COMPLIANCE (src/compliance/)

**Builders:**
- `FacturxBuilder` - Construction XML Factur-X
- `UblBuilder` - Construction XML UBL (Universal Business Language)

**XSD Schemas:**
- Factur-X 1.07.2 pour tous profils
- EN 16931 schemas

**Status**: ⚠️ PARTIEL dans lib/ (seulement Factur-X, pas UBL)

---

### ✅ SIGNATURE (src/signature/Signer.ts)

**Fonctionnalités:**
- Signature cryptographique PDF
- Vérification signature
- Support clés privées/publiques

**Status**: ❌ MANQUANT dans lib/

---

### ✅ CLI (src/cli.ts)

**Commandes:**
- `invoice` - Génération facture
- `quote` - Génération devis (pro forma)
- `order` - Génération Order-X
- `validate` - Validation XML

**Status**: ✅ EXISTE mais utilise src/, pas lib/

---

## 2. ÉTAT ACTUEL lib/

### ✅ Ce qui existe dans lib/

#### lib/factur-x-ts (@facturx/core)
- ✅ Architecture optimisée (LRU cache, lazy eval)
- ✅ TaxCalculator O(n+m)
- ✅ Entités immutables avec builders
- ✅ ProfileValidator
- ✅ XsdValidator (structure mais pas vraie validation)
- ✅ Types complets TypeScript
- ❌ MAIS: currency hardcodé EUR
- ❌ MAIS: pas de support UBL
- ❌ MAIS: pas extensible multi-régions

#### lib/smp-factur-x-ts (@facturx/templates)
- ✅ ModernTemplate basique
- ✅ Support multi-langues (FR, EN, DE) mais fixe
- ✅ Thèmes configurables
- ❌ MAIS: seulement 1 template vs 6 dans src/
- ❌ MAIS: pas de signature PDF
- ❌ MAIS: pas d'extraction XML

---

## 3. GAPS À COMBLER (Priorités)

### 🔴 CRITIQUE (Fonctionnalités manquantes essentielles)

1. **Multi-devises configurable**
   - Ajouter `currency: string` dans FacturXInvoice
   - Support ISO 4217 codes (EUR, USD, GBP, CHF, etc.)
   - Validation codes devises
   - Formatage montants selon devise

2. **Multi-régions/Compliance**
   - Ajouter `ComplianceType` enum
   - Support UBL (pas seulement Factur-X)
   - Règles régionales configurables
   - Validation contextuelle par région

3. **Validation XSD réelle**
   - Intégrer libxmljs2 ou alternative
   - Charger schemas XSD
   - Validation vraie (pas placeholder)

4. **Signature PDF**
   - Migrer Signer.ts
   - Support signature/vérification
   - Intégrer dans templates

5. **Templates manquants**
   - Migrer Modern2024InvoiceTemplate
   - Migrer ModernHTMLInvoiceTemplate
   - Rendre templates extensibles

### 🟡 IMPORTANT (Améliorations)

6. **Généricité types**
   - Support `<TLine extends InvoiceLine>`
   - Permettre types custom ligne
   - Data transfer objects

7. **Extraction XML**
   - Migrer extractEmbeddedXml()
   - Utilitaires manipulation PDF

8. **I18n extensible**
   - Système messages multi-langues
   - Support ajout langues custom
   - Formatage régional (dates, nombres)

### 🟢 NICE-TO-HAVE (Bonus)

9. **Order-X support**
   - Support commandes (pas seulement factures)
   - OrderxEngine

10. **Métadonnées PDF avancées**
    - Options métadonnées complètes
    - PDF/A-3 strict compliance

---

## 4. PLAN D'ACTION

### Phase 1: Support Multi-devises/Régions ⭐
- [ ] Ajouter `currency` configurable dans lib/factur-x-ts
- [ ] Ajouter `ComplianceType` enum
- [ ] Ajouter validation codes ISO 4217
- [ ] Formatter montants selon devise
- [ ] Tests multi-devises

### Phase 2: Multi-langues Extensible
- [ ] Système i18n avec plugins
- [ ] Support ajout langues custom
- [ ] Messages d'erreur localisés
- [ ] Formatage dates/nombres régional

### Phase 3: Validation XSD Réelle
- [ ] Intégrer libxmljs2
- [ ] Charger schemas depuis compliance/
- [ ] Validation vraie XSD
- [ ] Tests validation

### Phase 4: Templates Complets
- [ ] Migrer tous templates actifs de src/
- [ ] Signature PDF
- [ ] Extraction XML
- [ ] Templates génériques `<TLine>`

### Phase 5: CLI Moderne
- [ ] Nouvelle CLI utilisant lib/
- [ ] Commandes: invoice, quote, order, validate
- [ ] Configuration fichiers
- [ ] Parité complète avec src/cli.ts

### Phase 6: Tests & Documentation
- [ ] Tests unitaires complets
- [ ] Tests d'intégration
- [ ] Tests de régression (vs src/)
- [ ] Documentation complète
- [ ] Guide migration

---

## 5. ESTIMATION

| Phase | Effort | Priorité |
|-------|--------|----------|
| Phase 1 | 1-2h | CRITIQUE |
| Phase 2 | 1h | CRITIQUE |
| Phase 3 | 2h | IMPORTANTE |
| Phase 4 | 2-3h | IMPORTANTE |
| Phase 5 | 1h | IMPORTANTE |
| Phase 6 | 1-2h | IMPORTANTE |
| **TOTAL** | **8-11h** | - |

---

## 6. RISQUES & MITIGATIONS

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Régression fonctionnelle | HAUT | Tests de parité systématiques |
| Incompatibilité types | MOYEN | Migration progressive avec coexistence |
| Performances | FAIBLE | Benchmarks comparatifs |
| Breaking changes | MOYEN | Versioning sémantique strict |

---

## 7. RECOMMANDATION

✅ **PROCÉDER** avec migration complète en suivant les 6 phases.

**Justification:**
- lib/ a déjà architecture optimisée (60% fait)
- src/ a fonctionnalités complètes (90% des besoins)
- Combinaison = solution production-ready mondiale
- Effort raisonnable (8-11h) pour gain important

**Bénéfices:**
- ✅ Support mondial (devises, régions, langues)
- ✅ Optimisations algorithmiques conservées
- ✅ Parité fonctionnelle complète
- ✅ Architecture modulaire et extensible
- ✅ Production-ready pour tous pays

---

**Prêt à commencer Phase 1?**
