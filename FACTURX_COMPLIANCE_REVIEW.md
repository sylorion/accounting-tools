# Review de Compliance Factur-X - Accounting Tools

**Date:** 15 Novembre 2025
**Standard:** Factur-X 1.07.2 (EN16931)
**Référence:** https://fnfe-mpe.org/factur-x/

---

## 📊 Résumé Exécutif

### ✅ Points Forts

1. **Schémas XSD Complets**
   - Tous les profils Factur-X 1.07.2 présents (MINIMUM, BASIC, BASICWL, EN16931, EXTENDED)
   - Schémas Order-X pour les commandes
   - Schémas ZUGFeRD (compatibilité)

2. **Structure XML Conforme**
   - Namespaces corrects (rsm, ram, udt, qdt)
   - Structure CrossIndustryInvoice valide
   - GuidelineSpecifiedDocumentContextParameter présent

3. **Métadonnées PDF/A-3**
   - Fichiers XMP pour Factur-X et ZUGFeRD
   - Profils ICC pour conformité PDF/A-3b

### ⚠️ Points à Améliorer

1. **Validation XSD Manquante**
   - ❌ Pas de validation automatique contre les schémas XSD
   - ❌ Pas de tests de validation stricte

2. **Problème de Profile URN**
   - ⚠️ BusinessProcessSpecifiedDocumentContextParameter incorrect
   - Actuel: `urn:ferd:CrossIndustryDocument:invoice:1p0:basic`
   - Attendu pour EN16931: `urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931`

3. **Tests de Compliance**
   - ❌ Pas de tests d'intégration validant contre XSD
   - ❌ Pas de tests pour chaque profil (MINIMUM, BASIC, EN16931, EXTENDED)
   - ❌ Pas de tests de conformité PDF/A-3b

4. **Architecture**
   - ⚠️ Code core mélangé avec templates
   - ⚠️ Pas de séparation claire lib/application

---

## 🔍 Analyse Détaillée par Composant

### 1. Génération XML (FacturXInvoice.ts)

#### ✅ Conforme
```xml
<!-- Namespaces corrects -->
<rsm:CrossIndustryInvoice
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
```

#### ❌ Non Conforme

**Problème 1: GuidelineID**
```xml
<!-- Actuel -->
<ram:GuidelineSpecifiedDocumentContextParameter>
  <ram:ID>urn:cen.eu:en16931:2017#</ram:ID>
</ram:GuidelineSpecifiedDocumentContextParameter>
```

**Correct pour EN16931:**
```xml
<ram:GuidelineSpecifiedDocumentContextParameter>
  <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
</ram:GuidelineSpecifiedDocumentContextParameter>
```

**Problème 2: BusinessProcessSpecifiedDocumentContextParameter**
```xml
<!-- Actuel - INCORRECT -->
<ram:BusinessProcessSpecifiedDocumentContextParameter>
  <ram:ID>urn:ferd:CrossIndustryDocument:invoice:1p0:basic</ram:ID>
</ram:BusinessProcessSpecifiedDocumentContextParameter>
```

**Solution:** Ce champ devrait être ABSENT pour EN16931 ou contenir un process ID spécifique

#### ⚠️ À Améliorer

**Problème 3: Dates**
```xml
<!-- Format actuel: 102 (CCYYMMDD) -->
<udt:DateTimeString format="102">20251115</udt:DateTimeString>
```

✅ **Conforme** - Le format 102 est correct pour Factur-X

**Problème 4: TaxTotal**
```xml
<!-- Actuel -->
<ram:TaxTotal>
  <ram:TaxTotalAmount>1070.00</ram:TaxTotalAmount>
</ram:TaxTotal>
```

⚠️ **Optionnel** - Ce champ est optionnel dans EN16931 mais requis dans EXTENDED

---

### 2. Validation (validateGeneratedXml)

#### Validation Actuelle (Basique)
```typescript
private validateGeneratedXml(xml: string): boolean {
  // Vérification des namespaces
  // Vérification des éléments principaux
  // Vérification de l'URN du profil
}
```

#### ❌ Manquant
1. **Validation XSD** - Pas de validation contre le schéma
2. **Validation Schematron** - Pas de règles métier
3. **Validation des cardinalités** - Pas de vérification min/max occurrences

---

### 3. Profils Factur-X

#### URN Corrects par Profil

| Profil | GuidelineID URN |
|--------|----------------|
| MINIMUM | `urn:factur-x.eu:1p0:minimum` |
| BASIC WL | `urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basic` |
| BASIC | `urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basic` |
| EN16931 | `urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931` |
| EXTENDED | `urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:extended` |

#### Code Actuel
```typescript
private getGuidelineURN(): string {
  const urnMap = {
    [FacturxProfile.MINIMUM]: "urn:factur-x.eu:1p0:minimum",
    [FacturxProfile.BASICWL]: "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basicwl",
    [FacturxProfile.BASIC]: "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basic",
    [FacturxProfile.EN16931]: "urn:cen.eu:en16931:2017#",
    [FacturxProfile.EXTENDED]: "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:extended"
  };
  return urnMap[this.profile];
}
```

⚠️ **ERREUR**: EN16931 URN est incomplet !

---

## 📋 Plan d'Action pour la Compliance

### 1. Corrections Urgentes

#### 1.1 Corriger les URN
```typescript
[FacturxProfile.EN16931]: "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931"
```

#### 1.2 Supprimer BusinessProcessSpecifiedDocumentContextParameter
Pour EN16931, ce champ ne devrait pas être présent sauf si un process métier spécifique est défini.

### 2. Validation XSD

#### 2.1 Intégrer libxmljs2 ou fast-xml-parser
```bash
npm install libxmljs2 @xmldom/xmldom
```

#### 2.2 Créer XsdValidator
```typescript
export class XsdValidator {
  validate(xml: string, profile: FacturxProfile): ValidationResult {
    // Charger le XSD approprié
    // Valider le XML
    // Retourner les erreurs
  }
}
```

### 3. Tests de Compliance

#### 3.1 Tests par Profil
```typescript
describe('Factur-X Compliance', () => {
  describe('MINIMUM Profile', () => {
    it('should generate valid MINIMUM XML');
    it('should validate against MINIMUM XSD');
  });

  describe('EN16931 Profile', () => {
    it('should generate valid EN16931 XML');
    it('should validate against EN16931 XSD');
    it('should have correct GuidelineID URN');
  });
});
```

#### 3.2 Tests d'Intégration
```typescript
describe('Factur-X Integration', () => {
  it('should create valid PDF/A-3b with embedded XML');
  it('should validate XML against XSD');
  it('should include correct XMP metadata');
  it('should use correct ICC profiles');
});
```

---

## 🏗️ Architecture Recommandée

### Structure Proposée

```
accounting-tools/
├── lib/
│   ├── factur-x-ts/              # Core library
│   │   ├── src/
│   │   │   ├── core/             # Business logic
│   │   │   ├── validation/       # XSD/Schematron validators
│   │   │   ├── profiles/         # Profile-specific logic
│   │   │   └── types/            # TypeScript types
│   │   ├── compliance/           # XSD, XMP, ICC files
│   │   └── tests/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── compliance/       # XSD validation tests
│   │
│   └── smp-factur-x-ts/          # Templates library
│       ├── src/
│       │   ├── templates/        # PDF templates
│       │   ├── renderers/        # PDF renderers
│       │   └── themes/           # Visual themes
│       └── tests/
│
├── examples/                      # Usage examples
├── cli/                          # CLI tool
└── package.json
```

### Avantages
1. **Séparation claire** - Core vs Presentation
2. **Réutilisabilité** - factur-x-ts peut être utilisé seul
3. **Testabilité** - Tests unitaires par package
4. **Maintenabilité** - Modifications isolées

---

## ✅ Checklist de Compliance

### XML Generation
- [ ] Corriger GuidelineID URN pour EN16931
- [ ] Supprimer BusinessProcessSpecifiedDocumentContextParameter incorrect
- [ ] Ajouter validation XSD automatique
- [ ] Implémenter validation Schematron
- [ ] Tester tous les profils (MINIMUM, BASIC, BASICWL, EN16931, EXTENDED)

### PDF/A-3
- [ ] Vérifier conformité PDF/A-3b
- [ ] Valider métadonnées XMP
- [ ] Vérifier profil ICC
- [ ] Tester embeddement XML

### Tests
- [ ] Tests unitaires pour chaque profil
- [ ] Tests d'intégration XSD
- [ ] Tests de compliance PDF/A-3
- [ ] Tests end-to-end CLI

### Documentation
- [ ] Guide de conformité Factur-X
- [ ] Exemples par profil
- [ ] Documentation API
- [ ] Guide de migration

---

## 📚 Références

1. **Spécification Factur-X 1.07.2**
   - https://fnfe-mpe.org/factur-x/

2. **EN 16931** (Norme européenne)
   - https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Obtaining+a+copy+of+the+European+standard+on+eInvoicing

3. **PDF/A-3**
   - https://www.pdfa.org/resource/pdfa-3/

4. **Schematron Rules**
   - https://github.com/ConnectingEurope/eInvoicing-EN16931

---

## 🎯 Prochaines Étapes

1. **Phase 1: Corrections Critiques** (Priorité: HAUTE)
   - Corriger les URN
   - Ajouter validation XSD basique

2. **Phase 2: Restructuration** (Priorité: MOYENNE)
   - Créer factur-x-ts
   - Créer smp-factur-x-ts
   - Migrer le code

3. **Phase 3: Tests de Compliance** (Priorité: HAUTE)
   - Tests XSD pour tous les profils
   - Tests d'intégration PDF/A-3

4. **Phase 4: Documentation** (Priorité: MOYENNE)
   - Guide utilisateur
   - Exemples
   - API documentation

---

**Conclusion:** Le code actuel a une excellente base mais nécessite des corrections pour être strictement conforme au standard Factur-X 1.07.2. La restructuration en deux bibliothèques distinctes améliorera la maintenabilité et la réutilisabilité.
