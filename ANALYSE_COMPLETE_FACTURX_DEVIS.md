# 📊 ANALYSE COMPLÈTE : FACTUR-X ET DEVIS-X

## 🎯 Table des Matières

1. [Analyse des Dépendances](#1-analyse-des-dépendances)
2. [Comment Créer une Facture Factur-X Conforme](#2-comment-créer-une-facture-factur-x-conforme)
3. [Comment Créer un Devis Conforme](#3-comment-créer-un-devis-conforme)
4. [Architecture et Standards](#4-architecture-et-standards)
5. [Exemples Pratiques](#5-exemples-pratiques)

---

## 1. ANALYSE DES DÉPENDANCES

### 1.1 Arbre Complet des Dépendances de `example-loi.ts`

```
example-loi.ts (Point d'entrée - 200 lignes)
│
├── [NODE] fs (module natif)
│
├── [CORE] HeaderTradeAgreement.ts
│   ├── PostalAddress (classe)
│   ├── TradeContact (classe avec validation email/tel)
│   └── TradeParty (classe partie commerciale complète)
│
├── [CORE] DocumentHeader.ts
│   ├── DocumentHeader (classe en-tête document)
│   └── → EnumInvoiceType.ts (DocTypeCode)
│
├── [CORE] FacturXInvoice.ts ⭐ FICHIER CENTRAL (1198 lignes)
│   ├── → TaxCalculator.ts (calculs financiers précis)
│   │   ├── MonetarySummary (interface)
│   │   ├── TaxSummary (interface)
│   │   ├── → big.js [NPM] (calculs décimaux précis)
│   │   ├── → AllowanceCharge.ts
│   │   └── → InvoiceLine.ts
│   │
│   ├── → EnumInvoiceType.ts (tous les enums)
│   │   ├── FacturxProfile (MINIMUM, BASICWL, BASIC, EN16931, EXTENDED)
│   │   ├── DocTypeCode (380=Facture, 384=Devis, etc.)
│   │   ├── TaxCategoryCode (S, AA, Z, E, AE, O, G)
│   │   └── ComplianceType (FR_FACTUR_X, GENERIC_UBL)
│   │
│   ├── → ConstanteInvoiceData.ts (règles par profil)
│   ├── → PaymentDetails.ts (IBAN, BIC, échéance)
│   ├── → AdditionalDocument.ts (pièces jointes)
│   └── → xmlbuilder2 [NPM] (génération XML)
│
├── [CORE] InvoiceLine.ts
│   ├── InvoiceLine (classe ligne de facture)
│   ├── InvoiceLineData (interface)
│   └── → AllowanceCharge.ts
│
├── [CORE] AllowanceCharge.ts
│   ├── AllowanceCharge (remises/frais)
│   └── → TaxCategoryCode (EnumInvoiceType)
│
├── [GENERATORS] InvoicePDF.ts
│   ├── InvoicePDF (wrapper PDF)
│   ├── PDFOption (interface métadonnées)
│   ├── → pdf-lib [NPM] (PDFDocument, PDFName, PDFArray)
│   ├── → Invoice.ts (modèle générique)
│   │   ├── → UblBuilder.ts (compliance UBL)
│   │   ├── → TemplateRenderer.ts (interface rendu)
│   │   ├── → RendererOption.ts (70+ options)
│   │   ├── → InvoiceLineCore.ts (interface minimale)
│   │   └── → libxmljs [NPM] (validation XSD)
│   └── → Signer.ts (signature RSA-SHA256)
│       ├── → crypto [NODE]
│       └── → Buffer [NODE]
│
├── [TEMPLATES] InvoiceTemplateFancy.ts (1385 lignes)
│   ├── Template moderne rose/bleu
│   ├── Support multi-pages automatique
│   ├── QR code, logos, détail TVA
│   ├── → @pdf-lib/fontkit [NPM]
│   ├── → pdf-lib [NPM] (complet)
│   ├── → path, fs [NODE]
│   ├── → FacturXInvoice.ts
│   ├── → BaseInvoiceItem.ts
│   └── → img.ts (BUYER_LOGO_BASE64, SELLER_LOGO_BASE64)
│
├── [TEMPLATES] InvoiceTemplateBrand.ts
│   ├── Template navy/orange avec charte
│   ├── Tous champs EXTENDED
│   ├── Zone signature
│   ├── → pdf-lib [NPM]
│   ├── → FacturXInvoice.ts
│   ├── → BaseInvoiceItem.ts
│   └── → MonetarySummary (TaxCalculator)
│
└── [NPM] pdf-lib
    ├── PDFDocument (manipulation PDF)
    └── utf8Encode (encodage)
```

### 1.2 Dépendances NPM Externes

#### **Génération PDF (4 packages)**
1. **pdf-lib** v1.17.1 - Création et manipulation de PDF
2. **@pdf-lib/fontkit** v1.1.1 - Support polices personnalisées
3. **qrcode** v1.5.4 - Génération QR codes
4. **puppeteer** v24.2.1 - Automatisation navigateur

#### **Génération XML (1 package)**
5. **xmlbuilder2** v3.0.2 - Construction XML (Factur-X, UBL, Order-X)

#### **Calculs Précis (3 packages)**
6. **big.js** v6.2.2 - Calculs décimaux précis (recommandé)
7. **big** v0.5.2 - Alternative Big
8. **bigjs** v0.0.3 - Alternative Big

#### **Validation XML (4 packages)**
9. **libxmljs** v1.0.11 - Parsing/validation XML contre XSD
10. **node-libxml** v5.0.6 - Bindings libxml2
11. **node-xmllint** v1.0.0 - Validation XSD
12. **xmllint** v0.1.1 - Linter XML

#### **Signature Numérique (4 packages)**
13. **@signpdf/signpdf** v3.2.4 - Signature PDF
14. **@signpdf/signer-p12** v3.2.4 - Certificats P12
15. **@signpdf/placeholder-pdf-lib** v3.2.4 - Placeholders pdf-lib
16. **@signpdf/placeholder-plain** v3.2.4 - Placeholders simples
17. **node-forge** v1.3.1 - Cryptographie

#### **Utilitaires (3 packages)**
18. **lodash** v4.17.21 - Utilitaires JavaScript
19. **handlebars** v4.7.8 - Templates
20. **qrcode** v1.5.4 - QR codes

### 1.3 Modules Node.js Natifs

- **fs** - Système de fichiers
- **path** - Gestion des chemins
- **crypto** - Cryptographie
- **buffer** - Manipulation binaire

---

## 2. COMMENT CRÉER UNE FACTURE FACTUR-X CONFORME

### 2.1 Les 5 Profils Factur-X

Factur-X propose 5 profils selon le niveau de détail requis :

| Profil | Description | Cas d'usage |
|--------|-------------|-------------|
| **MINIMUM** | Informations minimales | PDF avec identification basique |
| **BASICWL** | Basic Without Lines | Facture simple sans détail des lignes |
| **BASIC** | Basique avec lignes | PME, factures simples |
| **EN16931** | Norme européenne | B2B standard, conforme directive UE |
| **EXTENDED** | Tous les champs | Grandes entreprises, ERP complexes |

### 2.2 Structure d'une Facture Factur-X

#### **Composants Obligatoires**

```typescript
// 1. En-tête du Document
DocumentHeader {
  id: string;              // Identifiant interne
  invoiceNumber: string;   // Numéro de facture
  name: string;           // Nom du document
  invoiceDate: Date;      // Date de facture
  issueDate: Date;        // Date d'émission
  typeCode?: DocTypeCode; // Type de document (380 = facture)
  notes?: string[];       // Notes additionnelles
}

// 2. Parties Commerciales
TradeParty {
  name: string;                    // Nom
  postalAddress: PostalAddress;    // Adresse
  vatNumber?: string;              // N° TVA intracommunautaire
  legalName?: string;              // Dénomination légale
  contacts?: TradeContact[];       // Contacts
}

PostalAddress {
  street: string;          // Rue
  city: string;           // Ville
  postalCode: string;     // Code postal
  countryCode: string;    // Code pays (ISO 3166-1 alpha-2)
  additionalStreet?: string; // Complément d'adresse
}

// 3. Détails de Paiement
PaymentDetails {
  paymentMeansCode: string;  // Code moyen de paiement
  iban?: string;            // IBAN
  bic?: string;             // BIC/SWIFT
  dueDate?: Date;           // Date d'échéance
  termsDescription?: string; // Conditions de paiement
}

// 4. Lignes de Facture
InvoiceLine {
  id: string;                      // Identifiant ligne
  description: string;             // Description produit/service
  quantity: number;                // Quantité
  unitPrice: number;               // Prix unitaire HT
  vatRate: number;                 // Taux de TVA (0.20 = 20%)
  taxCategoryCode?: TaxCategoryCode; // Catégorie TVA
  unitCode?: string;               // Unité (C62=pièce, HUR=heure)
  lineAllowances?: AllowanceCharge[]; // Remises ligne
}

// 5. Remises/Frais Document
AllowanceCharge {
  isCharge: boolean;          // true=Frais, false=Remise
  actualAmount: number;       // Montant HT
  reason: string;             // Raison
  reasonCode?: string;        // Code raison
  taxRate?: number;           // Taux TVA applicable
  taxCategoryCode?: TaxCategoryCode; // Catégorie TVA
}
```

### 2.3 Exemple Complet : Facture Conforme

```typescript
import fs from 'fs';
import { PDFDocument, utf8Encode } from 'pdf-lib';
import {
  PostalAddress,
  DocumentHeader,
  FacturXInvoice,
  FacturxProfile,
  PaymentDetails,
  InvoiceLine,
  AllowanceCharge,
  DocTypeCode
} from './';
import { InvoiceTemplateFancy } from './templates/InvoiceTemplateFancy';

async function creerFactureConformeFacturX() {
  // 1. DÉFINIR LE VENDEUR
  const sellerAddress = new PostalAddress(
    "123 Rue du Commerce",      // rue
    "Paris",                    // ville
    "75001",                    // code postal
    "FR",                       // code pays
    "Bâtiment A, 3e étage"      // complément
  );

  const seller = new TradeParty(
    "Ma Société SAS",
    sellerAddress,
    "FR12345678901"  // N° TVA intracommunautaire
  );

  // 2. DÉFINIR L'ACHETEUR
  const buyerAddress = new PostalAddress(
    "45 Avenue des Clients",
    "Lyon",
    "69001",
    "FR",
    "Bureau 201"
  );

  const buyer = new TradeParty(
    "Client XYZ SARL",
    buyerAddress,
    "FR98765432100"
  );

  // 3. EN-TÊTE DOCUMENT
  const header = new DocumentHeader(
    "INT-2025-001",           // ID interne
    "FA-2025-001",            // Numéro facture
    "FACTURE",                // Nom
    new Date(2025, 3, 10),    // Date facture (10 avril 2025)
    new Date(),               // Date émission
    DocTypeCode.INVOICE       // Type: Facture (380)
  );

  // 4. DÉTAILS PAIEMENT
  const payment = new PaymentDetails(
    "58",                              // Code 58 = SEPA Credit Transfer
    "FR7630004000031234567890143",    // IBAN
    "BNPAFRPPXXX",                    // BIC
    new Date(2025, 4, 10),            // Échéance: 10 mai 2025
    "Paiement sous 30 jours fin de mois"
  );

  // 5. CRÉER LA FACTURE (Profil EN16931 ou EXTENDED)
  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,  // Profil conforme directive européenne
    header,
    seller,
    buyer,
    payment
  );

  // 6. AJOUTER DES LIGNES
  // Ligne 1: Prestation de conseil (TVA 20%)
  invoice.lines.push(new InvoiceLine(
    "1",                           // ID ligne
    "Prestation de conseil stratégique - 5 jours", // Description
    5,                            // Quantité: 5 jours
    800.00,                       // Prix unitaire HT: 800€/jour
    0.20,                         // TVA 20%
    TaxCategoryCode.STANDARD,     // Catégorie: Taux normal
    "DAY"                         // Unité: jour
  ));

  // Ligne 2: Formation (TVA 20%)
  invoice.lines.push(new InvoiceLine(
    "2",
    "Formation équipe - Sessions de 2h",
    3,
    450.00,
    0.20,
    TaxCategoryCode.STANDARD,
    "HUR"  // HUR = heure
  ));

  // Ligne 3: Licence logicielle (TVA 20%)
  invoice.lines.push(new InvoiceLine(
    "3",
    "Licence logicielle annuelle - 10 utilisateurs",
    10,
    120.00,
    0.20,
    TaxCategoryCode.STANDARD,
    "C62"  // C62 = pièce/unité
  ));

  // Ligne 4: Livres (TVA 5.5% - taux réduit)
  invoice.lines.push(new InvoiceLine(
    "4",
    "Documentation technique - Livre professionnel",
    5,
    45.00,
    0.055,                        // TVA 5.5%
    TaxCategoryCode.REDUCED,      // Catégorie: Taux réduit
    "C62"
  ));

  // 7. REMISE GLOBALE
  // Remise de 5% sur le total HT
  invoice.docAllowanceCharges.push(
    new AllowanceCharge(
      false,          // false = remise
      250.00,         // Montant remise HT
      "Remise commerciale 5%",
      "DISC5",
      0.20            // TVA sur la remise
    )
  );

  // 8. FRAIS SUPPLÉMENTAIRES
  // Frais de dossier
  invoice.docAllowanceCharges.push(
    new AllowanceCharge(
      true,           // true = frais
      50.00,          // Montant frais HT
      "Frais de dossier",
      "ADM",
      0.20
    )
  );

  // 9. GÉNÉRATION XML FACTUR-X
  const xml = invoice.generateXml(true);  // true = pretty print
  fs.writeFileSync("facture-conforme.xml", xml);
  console.log("✅ XML Factur-X généré: facture-conforme.xml");

  // 10. GÉNÉRATION PDF AVEC TEMPLATE
  const template = new InvoiceTemplateFancy();
  const pdfBytes = await template.render(invoice);

  // 11. EMBEDDING XML DANS PDF (PDF/A-3)
  const pdfDoc = await PDFDocument.load(pdfBytes);

  await pdfDoc.attach(
    utf8Encode(xml),
    'factur-x.xml',
    {
      mimeType: 'application/xml',
      description: 'Factur-X EXTENDED XML Invoice',
      creationDate: new Date(),
      modificationDate: new Date()
    }
  );

  // 12. MÉTADONNÉES PDF
  pdfDoc.setTitle(`Facture ${header.invoiceNumber}`);
  pdfDoc.setSubject('Facture électronique Factur-X');
  pdfDoc.setAuthor(seller.name);
  pdfDoc.setKeywords(['facture', 'factur-x', 'b2b']);
  pdfDoc.setCreator('Accounting Tools');
  pdfDoc.setProducer('accounting-tools v1.0');

  // 13. SAUVEGARDE FINALE
  fs.writeFileSync("facture-conforme.pdf", await pdfDoc.save());
  console.log("✅ PDF Factur-X généré: facture-conforme.pdf");

  // 14. RÉCAPITULATIF
  const summary = invoice.calculateTotals();
  console.log("\n📊 RÉCAPITULATIF:");
  console.log(`   Total HT brut:      ${summary.lineTotal.toFixed(2)} €`);
  console.log(`   Base HT (après remises): ${summary.taxBasis.toFixed(2)} €`);
  console.log(`   Total TVA:          ${summary.taxTotal.toFixed(2)} €`);
  console.log(`   Total TTC:          ${summary.grandTotal.toFixed(2)} €`);

  // Détail par taux de TVA
  summary.taxSummaries.forEach(tax => {
    console.log(`   - TVA ${(tax.rate * 100).toFixed(2)}%: ${tax.amount.toFixed(2)} € (base: ${tax.basis.toFixed(2)} €)`);
  });
}

creerFactureConformeFacturX().catch(console.error);
```

### 2.4 Codes de Moyens de Paiement (Payment Means Code)

Les codes les plus utilisés en France :

| Code | Description |
|------|-------------|
| **30** | Virement bancaire classique |
| **42** | Paiement à un compte bancaire |
| **48** | Carte bancaire |
| **49** | Prélèvement automatique |
| **57** | Virement bancaire national |
| **58** | Virement SEPA (SEPA Credit Transfer) ⭐ Recommandé UE |
| **59** | Prélèvement SEPA (SEPA Direct Debit) |
| **97** | Compensation (clearing) |

### 2.5 Codes d'Unité (Unit Code - Recommendation 20 UN/CEFACT)

| Code | Description |
|------|-------------|
| **C62** | Pièce/Unité (par défaut) |
| **HUR** | Heure |
| **DAY** | Jour |
| **MON** | Mois |
| **ANN** | Année |
| **KGM** | Kilogramme |
| **MTR** | Mètre |
| **LTR** | Litre |
| **MTK** | Mètre carré |
| **MTQ** | Mètre cube |
| **TNE** | Tonne métrique |

### 2.6 Validation et Conformité

#### **Points de Contrôle Obligatoires**

✅ **Validation Profil**
- Profil EXTENDED : tous les champs autorisés
- Profil EN16931 : champs obligatoires directive européenne
- Profil BASIC : champs essentiels seulement

✅ **Validation XML**
- Structure conforme XSD Factur-X 1.07.2
- Espaces de noms corrects
- URN de profil valide

✅ **Validation Financière**
- Calculs avec précision décimale (big.js)
- Arrondis conformes (par ligne ou global)
- Totaux cohérents

✅ **Validation PDF/A-3**
- XML embarqué dans le PDF
- Métadonnées conformes
- Nom du fichier XML: `factur-x.xml`
- MIME type: `application/xml`

---

## 3. COMMENT CRÉER UN DEVIS CONFORME

### 3.1 Devis vs Facture : Différences

| Caractéristique | Facture | Devis |
|-----------------|---------|-------|
| **Type de document** | 380 (INVOICE) | 384 (PRO_FORMAT) |
| **Valeur légale** | Document comptable obligatoire | Proposition commerciale |
| **TVA** | Obligatoire | Indicative |
| **Numérotation** | Séquentielle obligatoire | Libre |
| **Conservation** | 10 ans obligatoire | Recommandée |
| **Standard** | Factur-X | Même structure Factur-X/Order-X |

### 3.2 Création d'un Devis avec Factur-X

**Le devis utilise la MÊME structure que Factur-X**, seul le type de document change !

```typescript
import fs from 'fs';
import { PDFDocument, utf8Encode } from 'pdf-lib';
import {
  PostalAddress,
  DocumentHeader,
  FacturXInvoice,  // Même classe !
  FacturxProfile,
  PaymentDetails,
  InvoiceLine,
  AllowanceCharge,
  DocTypeCode,     // 👈 C'est ici qu'on change
  TaxCategoryCode
} from './';
import { InvoiceTemplateFancy } from './templates/InvoiceTemplateFancy';

async function creerDevisConforme() {
  // 1. VENDEUR (émetteur du devis)
  const sellerAddress = new PostalAddress(
    "123 Rue du Commerce",
    "Paris",
    "75001",
    "FR"
  );

  const seller = new TradeParty(
    "Ma Société SAS",
    sellerAddress,
    "FR12345678901"
  );

  // 2. CLIENT PROSPECT
  const buyerAddress = new PostalAddress(
    "45 Avenue Prospect",
    "Lyon",
    "69001",
    "FR"
  );

  const buyer = new TradeParty(
    "Prospect ABC SARL",
    buyerAddress,
    "FR98765432100"
  );

  // 3. EN-TÊTE DEVIS
  const header = new DocumentHeader(
    "DEV-2025-042",                // ID interne
    "DEVIS-2025-042",              // Numéro devis
    "DEVIS / QUOTATION",           // Nom
    new Date(2025, 3, 10),         // Date devis
    new Date(),                    // Date émission
    DocTypeCode.PRO_FORMAT         // 👈 TYPE 384 = DEVIS/PRO FORMA
  );

  // Ajouter des notes spécifiques au devis
  header.notes = [
    "Devis valable 30 jours à compter de la date d'émission",
    "Conditions: Acompte de 30% à la commande, solde à 30 jours",
    "Délai de livraison: 2-3 semaines après réception de l'acompte",
    "Prix exprimés en euros HT, TVA en vigueur au jour de la facturation"
  ];

  // 4. CONDITIONS DE PAIEMENT (pour info)
  const payment = new PaymentDetails(
    "58",  // SEPA
    "FR7630004000031234567890143",
    "BNPAFRPPXXX",
    undefined,  // Pas d'échéance pour un devis
    "Acompte 30% à la commande - Solde à 30 jours"
  );

  // 5. CRÉER LE DEVIS (utilise FacturXInvoice)
  const devis = new FacturXInvoice(
    FacturxProfile.EN16931,  // ou EXTENDED
    header,
    seller,
    buyer,
    payment
  );

  // 6. LIGNES DU DEVIS

  // Ligne 1: Développement logiciel
  devis.lines.push(new InvoiceLine(
    "1",
    "Développement application web sur mesure - Module de gestion clients",
    40,        // 40 jours-homme
    650.00,    // 650€/jour
    0.20,
    TaxCategoryCode.STANDARD,
    "DAY"
  ));

  // Ligne 2: Design UI/UX
  devis.lines.push(new InvoiceLine(
    "2",
    "Conception UI/UX - Maquettes et prototypes interactifs",
    10,        // 10 jours
    550.00,
    0.20,
    TaxCategoryCode.STANDARD,
    "DAY"
  ));

  // Ligne 3: Formation
  devis.lines.push(new InvoiceLine(
    "3",
    "Formation utilisateurs - 2 sessions de 4h",
    8,         // 8 heures
    120.00,
    0.20,
    TaxCategoryCode.STANDARD,
    "HUR"
  ));

  // Ligne 4: Maintenance annuelle
  devis.lines.push(new InvoiceLine(
    "4",
    "Contrat maintenance et support - 1 an",
    1,
    2400.00,   // Forfait annuel
    0.20,
    TaxCategoryCode.STANDARD,
    "ANN"
  ));

  // 7. REMISE COMMERCIALE (optionnelle)
  devis.docAllowanceCharges.push(
    new AllowanceCharge(
      false,
      1500.00,  // Remise de 1500€
      "Remise lancement - Nouveau client",
      "PROMO",
      0.20
    )
  );

  // 8. GÉNÉRATION XML
  const xml = devis.generateXml(true);
  fs.writeFileSync("devis-conforme.xml", xml);
  console.log("✅ XML Devis généré: devis-conforme.xml");

  // 9. GÉNÉRATION PDF
  const template = new InvoiceTemplateFancy();
  const pdfBytes = await template.render(devis);

  // 10. EMBEDDING XML (même procédure)
  const pdfDoc = await PDFDocument.load(pdfBytes);

  await pdfDoc.attach(
    utf8Encode(xml),
    'factur-x.xml',  // Même nom de fichier
    {
      mimeType: 'application/xml',
      description: 'Factur-X Quotation (Pro Forma)',
      creationDate: new Date(),
      modificationDate: new Date()
    }
  );

  // 11. MÉTADONNÉES PDF SPÉCIFIQUES DEVIS
  pdfDoc.setTitle(`Devis ${header.invoiceNumber}`);
  pdfDoc.setSubject('Devis / Quotation - Document Pro Forma');
  pdfDoc.setAuthor(seller.name);
  pdfDoc.setKeywords(['devis', 'quotation', 'pro-forma', 'factur-x']);
  pdfDoc.setCreator('Accounting Tools - Devis Generator');

  // 12. SAUVEGARDE
  fs.writeFileSync("devis-conforme.pdf", await pdfDoc.save());
  console.log("✅ PDF Devis généré: devis-conforme.pdf");

  // 13. RÉCAPITULATIF
  const summary = devis.calculateTotals();
  console.log("\n📋 RÉCAPITULATIF DEVIS:");
  console.log(`   Total HT brut:      ${summary.lineTotal.toFixed(2)} €`);
  console.log(`   Remise:             -${1500.00} €`);
  console.log(`   Base HT:            ${summary.taxBasis.toFixed(2)} €`);
  console.log(`   TVA 20%:            ${summary.taxTotal.toFixed(2)} €`);
  console.log(`   Total TTC:          ${summary.grandTotal.toFixed(2)} €`);
  console.log(`\n   💰 Acompte 30%:     ${(summary.grandTotal * 0.30).toFixed(2)} €`);
  console.log(`   💰 Solde:           ${(summary.grandTotal * 0.70).toFixed(2)} €`);
}

creerDevisConforme().catch(console.error);
```

### 3.3 Alternative : Utiliser Order-X pour les Devis

Order-X est le standard pour les **commandes** (équivalent de Factur-X pour orders). Il peut aussi être utilisé pour les devis.

```typescript
// STRUCTURE ORDER-X (en développement dans ce projet)
import {
  OrderData,
  BaseOrderItem,
  OrderxProfiles,
  OrderTemplateSimple,
  OrderxEngine,
} from './';

async function creerDevisOrderX() {
  const order: OrderData<BaseOrderItem> = {
    orderNumber: 'DEVIS-2025-042',
    orderDate: new Date(),
    seller: {
      name: 'Ma Société SAS',
      street: '123 Rue du Commerce',
      city: '75001 Paris',
      countryCode: 'FR',
    },
    buyer: {
      name: 'Prospect ABC',
      street: '45 Avenue Prospect',
      city: '69001 Lyon',
      countryCode: 'FR',
    },
    currency: 'EUR',
    items: [
      {
        description: 'Développement application web sur mesure',
        quantity: 40,
        unitPrice: 650.00
      },
      {
        description: 'Design UI/UX',
        quantity: 10,
        unitPrice: 550.00
      },
    ],
    disclaimers: ['Devis valable 30 jours'],
    notes: ['Acompte 30% à la commande'],
  };

  const template = new OrderTemplateSimple<BaseOrderItem>();
  const engine = new OrderxEngine<BaseOrderItem>(template, OrderxProfiles.EXTENDED);

  const pdfBytes = await engine.generate(order);

  fs.writeFileSync('devis-orderx.pdf', pdfBytes);
  console.log('✅ Devis Order-X généré !');
}
```

**Note:** Le code Order-X est actuellement en développement dans ce projet (voir `src/example-order.ts`).

### 3.4 Comparaison Factur-X vs Order-X pour Devis

| Aspect | Factur-X (PRO_FORMAT) | Order-X |
|--------|----------------------|---------|
| **Standard** | EN 16931 (invoices) | UN/CEFACT CII (orders) |
| **Support actuel** | ✅ Complet | ⚠️ En développement |
| **Type document** | 384 (PRO_FORMAT) | Order document |
| **Cas d'usage** | Devis/Pro forma/Facture proforma | Commande/Bon de commande |
| **Interopérabilité** | Excellente (EU) | Bonne (internationale) |
| **Recommandation** | ✅ **Recommandé pour devis** | Pour commandes |

**👉 RECOMMANDATION : Utiliser Factur-X avec DocTypeCode.PRO_FORMAT pour les devis**

---

## 4. ARCHITECTURE ET STANDARDS

### 4.1 Architecture en Couches

```
┌─────────────────────────────────────────────────────────┐
│               COUCHE PRÉSENTATION                       │
│  example-loi.ts, example-order.ts                       │
│  (Points d'entrée utilisateur)                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│               COUCHE MÉTIER CORE                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ FacturXInvoice.ts ⭐ (Cerveau du système)        │  │
│  │ • Validation profils (5 profils)                 │  │
│  │ • Génération XML EN 16931                        │  │
│  │ • Calcul totaux via TaxCalculator                │  │
│  │ • Support remises/charges multi-niveaux          │  │
│  └───────────────────────────────────────────────────┘  │
│           │         │         │          │               │
│           ▼         ▼         ▼          ▼               │
│  ┌────────────┐ ┌──────┐ ┌────────┐ ┌──────────────┐  │
│  │TaxCalc     │ │Header│ │Parties │ │Lines/Allow   │  │
│  │(big.js)    │ │      │ │Seller  │ │Charges/Pay   │  │
│  └────────────┘ └──────┘ │Buyer   │ └──────────────┘  │
│                           └────────┘                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ EnumInvoiceType.ts (Standards & Codes)           │  │
│  │ • 5 Profils • Types docs • Codes TVA • Codes UE  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│          COUCHE GÉNÉRATION & RENDU                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ InvoicePDF.ts (Wrapper)                          │  │
│  │ • Métadonnées • Signature • Extraction XML       │  │
│  └──────────────────────────────────────────────────┘  │
│           │                                              │
│           ▼                                              │
│  ┌───────────────────┬──────────────────────┐          │
│  │ TEMPLATE FANCY    │ TEMPLATE BRAND       │          │
│  │ (Rose/Bleu)       │ (Navy/Orange)        │          │
│  │ Multi-pages, QR   │ Charte marque        │          │
│  └───────────────────┴──────────────────────┘          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ pdf-lib + fontkit (Manipulation PDF)             │  │
│  │ • Création pages • Polices • Images • XML embed  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│            COUCHE COMPLIANCE                            │
│  ┌─────────────────┐      ┌────────────────────────┐   │
│  │ Factur-X        │      │ UBL                    │   │
│  │ (xmlbuilder2)   │      │ (UblBuilder.ts)        │   │
│  │ • XML CII       │      │ • Universal Business   │   │
│  │ • EN 16931      │      │   Language (OASIS)     │   │
│  │ • XSD Validate  │      │                        │   │
│  └─────────────────┘      └────────────────────────┘   │
│  ┌─────────────────┐                                    │
│  │ Order-X         │                                    │
│  │ (xmlbuilder2)   │                                    │
│  │ • Commandes     │                                    │
│  │ • Devis         │                                    │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              COUCHE SÉCURITÉ                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Signer.ts (Signature numérique)                  │  │
│  │ • RSA-SHA256 • Certificats P12 • Vérification    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                SORTIE FINALE                            │
│  ┌─────────────────┐      ┌────────────────────────┐   │
│  │ XML Factur-X    │      │ PDF avec XML embarqué  │   │
│  │ (EN 16931)      │      │ (PDF/A-3)              │   │
│  └─────────────────┘      └────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Standards Supportés

#### **Factur-X / ZUGFeRD**
- **Version:** 1.07.2 (dernière version)
- **Norme européenne:** EN 16931
- **Pays:** France, Allemagne, Autriche
- **Standard XML:** UN/CEFACT Cross Industry Invoice (CII)
- **Format PDF:** PDF/A-3 (ISO 19005-3)
- **Fichier XML embarqué:** `factur-x.xml`

#### **Order-X**
- **Version:** 1.0+
- **Basé sur:** UN/CEFACT Cross Industry Order
- **Usage:** Commandes, bons de commande, devis
- **Format PDF:** PDF/A-3
- **Fichier XML embarqué:** `orderx.xml`

#### **UBL (Universal Business Language)**
- **Version:** 2.1
- **Organisation:** OASIS
- **Usage:** Standard international pour e-invoicing
- **Pays:** Italie, Scandinavie, Benelux
- **Format:** XML pur (pas de PDF)

### 4.3 Conformité PDF/A-3

Pour être conforme Factur-X, le PDF doit respecter :

✅ **PDF/A-3b** (minimum)
- Fichier XML embarqué comme "Associated File"
- Métadonnées XMP correctes
- Polices embarquées
- Pas de contenu externe (JavaScript, formulaires actifs)

✅ **Métadonnées XMP requises**
```xml
<rdf:Description rdf:about=""
    xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
  <fx:DocumentType>INVOICE</fx:DocumentType>
  <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
  <fx:Version>1.0</fx:Version>
  <fx:ConformanceLevel>EXTENDED</fx:ConformanceLevel>
</rdf:Description>
```

✅ **Fichier XML embarqué**
- Nom: `factur-x.xml` (exact, sensible à la casse)
- MIME type: `application/xml`
- Relation: `Alternative` ou `Data`
- Description: recommandée

---

## 5. EXEMPLES PRATIQUES

### 5.1 Exemple Minimal (Profil BASIC)

```typescript
import { FacturXInvoice, FacturxProfile, DocumentHeader } from './';

const header = new DocumentHeader(
  "FA-001",
  "FA-001",
  "Facture",
  new Date(),
  new Date()
);

const invoice = new FacturXInvoice(
  FacturxProfile.BASIC,
  header,
  seller,
  buyer,
  payment
);

invoice.lines.push(new InvoiceLine(
  "1",
  "Prestation de service",
  1,
  1000.00,
  0.20
));

const xml = invoice.generateXml(true);
fs.writeFileSync("facture-basic.xml", xml);
```

### 5.2 Exemple Complet (Profil EXTENDED)

Voir section [2.3 Exemple Complet](#23-exemple-complet--facture-conforme)

### 5.3 Exemple Devis (PRO_FORMAT)

Voir section [3.2 Création d'un Devis](#32-création-dun-devis-avec-factur-x)

### 5.4 Gestion des Erreurs et Validation

```typescript
try {
  // Création facture
  const invoice = new FacturXInvoice(
    FacturxProfile.EXTENDED,
    header,
    seller,
    buyer,
    payment
  );

  // Validation avant génération
  const validation = invoice.validate();

  if (!validation.isValid) {
    console.error("❌ Erreurs de validation:");
    validation.errors.forEach(err => {
      console.error(`   - ${err}`);
    });
    throw new Error("Validation failed");
  }

  // Génération XML
  const xml = invoice.generateXml(true);

  // Validation XML contre XSD
  const xsdValidation = validateFacturxXml(xml, FacturxProfile.EXTENDED);

  if (!xsdValidation.isValid) {
    console.error("❌ XML non conforme au schéma XSD:");
    xsdValidation.errors.forEach(err => {
      console.error(`   - ${err.message} (ligne ${err.line})`);
    });
    throw new Error("XSD validation failed");
  }

  console.log("✅ Validation réussie !");

} catch (error) {
  console.error("❌ Erreur:", error.message);
  process.exit(1);
}
```

### 5.5 Multi-Devises

```typescript
// Facture en USD avec conversion EUR
const invoice = new FacturXInvoice(
  FacturxProfile.EN16931,
  header,
  seller,
  buyer,
  payment
);

// Devise principale
invoice.currency = "USD";

// Devise de comptabilité (optionnelle)
invoice.taxCurrency = "EUR";

// Taux de change (optionnel pour profil EXTENDED)
invoice.exchangeRate = {
  sourceCurrency: "USD",
  targetCurrency: "EUR",
  rate: 0.92,
  date: new Date()
};
```

### 5.6 TVA Intracommunautaire (Autoliquidation)

```typescript
// Vente B2B intracommunautaire (France → Allemagne)
const invoice = new FacturXInvoice(
  FacturxProfile.EN16931,
  header,
  sellerFR,      // Vendeur français
  buyerDE,       // Acheteur allemand avec VAT DE
  payment
);

// Ligne avec autoliquidation (Reverse Charge)
invoice.lines.push(new InvoiceLine(
  "1",
  "Prestation de conseil",
  5,
  1000.00,
  0.00,  // TVA = 0% (autoliquidation)
  TaxCategoryCode.REVERSE_CHARGE,  // Code AE
  "DAY"
));

// Mention obligatoire
invoice.header.notes.push(
  "TVA due par le preneur (autoliquidation) - Article 283-2 du CGI"
);
```

### 5.7 Export Hors UE (Exonération)

```typescript
// Export vers USA
const invoice = new FacturXInvoice(
  FacturxProfile.EN16931,
  header,
  sellerFR,      // Vendeur français
  buyerUS,       // Acheteur américain
  payment
);

// Ligne exonérée de TVA (Export)
invoice.lines.push(new InvoiceLine(
  "1",
  "Matériel informatique",
  10,
  500.00,
  0.00,  // TVA = 0%
  TaxCategoryCode.EXPORT,  // Code G
  "C62"
));

// Mention obligatoire
invoice.header.notes.push(
  "Exonération de TVA - Article 262 I du CGI - Exportation hors UE"
);
```

---

## 6. CHECKLIST DE CONFORMITÉ

### 6.1 Checklist Factur-X

#### **Données Obligatoires**
- [ ] Numéro de facture unique et séquentiel
- [ ] Date de facture
- [ ] Nom et adresse complète du vendeur
- [ ] Nom et adresse complète de l'acheteur
- [ ] N° TVA intracommunautaire (si applicable)
- [ ] Au moins une ligne de facture
- [ ] Description de chaque ligne
- [ ] Quantité et prix unitaire
- [ ] Taux de TVA par ligne
- [ ] Total HT, TVA, TTC

#### **Structure XML**
- [ ] Fichier XML valide contre XSD Factur-X 1.07.2
- [ ] Espace de noms correct: `urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100`
- [ ] URN de profil correct (ex: `urn:factur-x.eu:1p0:extended#`)
- [ ] Type de document: 380 (facture) ou 384 (devis)
- [ ] Devise: code ISO 4217 (EUR, USD, etc.)

#### **PDF/A-3**
- [ ] PDF conforme PDF/A-3b minimum
- [ ] XML embarqué nommé exactement `factur-x.xml`
- [ ] MIME type XML: `application/xml`
- [ ] Métadonnées XMP Factur-X présentes
- [ ] Polices embarquées

#### **Calculs**
- [ ] Calculs avec précision décimale (big.js)
- [ ] Arrondis conformes (généralement 2 décimales)
- [ ] Totaux cohérents: lineTotal + allowances - charges = taxBasis
- [ ] TVA = taxBasis × vatRate
- [ ] TTC = HT + TVA

### 6.2 Checklist Devis

#### **Données Spécifiques Devis**
- [ ] Type de document: 384 (PRO_FORMAT)
- [ ] Numéro de devis unique
- [ ] Date d'émission
- [ ] **Durée de validité** mentionnée (ex: 30 jours)
- [ ] Conditions de paiement (acompte, solde)
- [ ] Délai de livraison/exécution
- [ ] Mention "TVA applicable au jour de facturation" si pertinent

#### **Mentions Légales Devis**
- [ ] "Devis valable X jours"
- [ ] Conditions d'annulation
- [ ] Conditions de modification
- [ ] Signature client requise (si applicable)

### 6.3 Checklist Technique

#### **Dépendances**
- [ ] pdf-lib installé (`npm install pdf-lib`)
- [ ] xmlbuilder2 installé (`npm install xmlbuilder2`)
- [ ] big.js installé (`npm install big.js`)
- [ ] @pdf-lib/fontkit si polices custom (`npm install @pdf-lib/fontkit`)

#### **Fichiers Requis**
- [ ] `src/core/FacturXInvoice.ts` présent
- [ ] `src/core/EnumInvoiceType.ts` présent
- [ ] `src/core/TaxCalculator.ts` présent
- [ ] Template PDF choisi (`InvoiceTemplateFancy` ou `InvoiceTemplateBrand`)

#### **Tests**
- [ ] Générer XML et vérifier structure
- [ ] Générer PDF et vérifier visuel
- [ ] Vérifier XML embarqué dans PDF (ouvrir avec Adobe Acrobat)
- [ ] Valider XML contre XSD officiel
- [ ] Tester avec validateur Factur-X en ligne

---

## 7. RESSOURCES ET RÉFÉRENCES

### 7.1 Documentation Officielle

- **Factur-X France:** https://fnfe-mpe.org/factur-x/
- **ZUGFeRD (Allemagne):** https://www.ferd-net.de/
- **EN 16931:** https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Compliance+with+EN16931
- **Order-X:** https://www.fnfe-mpe.org/order-x/

### 7.2 Validateurs en Ligne

- **Factur-X Validator (France):** https://factur-x.org/validator/
- **ZUGFeRD Validator (Allemagne):** https://www.ferd-net.de/validator/
- **PDF/A Validator:** https://www.pdf-online.com/osa/validate.aspx

### 7.3 Schémas XSD

Les schémas XSD officiels sont inclus dans ce projet :
```
xsd/
├── 4. Factur-X_1.07.2_EXTENDED/
│   ├── Factur-X_1.07.2_EXTENDED.xsd
│   └── Factur-X_1.07.2_EXTENDED.sch (Schematron)
└── 5. CII D22B XSD/
    └── CrossIndustryInvoice_100pD22B.xsd
```

### 7.4 Codes Standards

- **UNTDID Codes:** https://unece.org/trade/uncefact/unedocs
- **ISO 3166-1 (Pays):** https://www.iso.org/iso-3166-country-codes.html
- **ISO 4217 (Devises):** https://www.iso.org/iso-4217-currency-codes.html
- **UN/CEFACT Rec 20 (Unités):** https://unece.org/trade/cefact/UNLOCODE-Download

---

## 8. QUESTIONS FRÉQUENTES (FAQ)

### Q1: Quelle est la différence entre Factur-X et ZUGFeRD ?
**R:** Factur-X (France) et ZUGFeRD (Allemagne) sont identiques techniquement. Factur-X est le nom français du standard franco-allemand. Les deux termes sont interchangeables.

### Q2: Dois-je utiliser EXTENDED ou EN16931 ?
**R:**
- **EN16931** : Standard pour 95% des cas B2B en Europe
- **EXTENDED** : Nécessaire uniquement pour grands groupes avec ERP complexes ou besoins spécifiques

### Q3: Puis-je utiliser Factur-X pour des devis ?
**R:** Oui ! Utilisez le type de document `384` (PRO_FORMAT) au lieu de `380` (INVOICE). La structure reste identique.

### Q4: Comment tester la conformité de mes factures ?
**R:**
1. Vérifier la structure XML contre le XSD
2. Utiliser un validateur en ligne (fnfe-mpe.org)
3. Ouvrir le PDF avec Adobe Acrobat et vérifier la présence du XML
4. Tester l'import dans un logiciel comptable compatible Factur-X

### Q5: Factur-X est-il obligatoire en France ?
**R:**
- **Secteur public (B2G)** : Oui, depuis 2020 (via Chorus Pro)
- **Secteur privé (B2B)** : Sera obligatoire à partir de 2026 (loi de finances 2024)
- **B2C** : Non obligatoire

### Q6: Puis-je signer numériquement mes factures Factur-X ?
**R:** Oui, utilisez la classe `Signer` incluse dans ce projet. La signature ne doit pas casser la conformité PDF/A-3.

### Q7: Comment gérer les factures multi-pages ?
**R:** Les templates `InvoiceTemplateFancy` et `InvoiceTemplateBrand` gèrent automatiquement la pagination. Aucune action requise.

### Q8: Puis-je créer des avoirs (credit notes) ?
**R:** Oui, utilisez `DocTypeCode.CREDIT_NOTE` (381) au lieu de `DocTypeCode.INVOICE` (380).

### Q9: Comment gérer les paiements partiels ?
**R:** Profil EXTENDED supporte les informations de paiement partiel via `PaymentDetails`. Ajoutez plusieurs instances pour chaque paiement.

### Q10: Order-X est-il prêt en production ?
**R:** Non, le code Order-X est actuellement **en développement** dans ce projet. Pour les devis, utilisez Factur-X avec `DocTypeCode.PRO_FORMAT` (recommandé).

---

## 9. CHANGELOG ET VERSIONS

### Version 1.07.2 (Actuelle)
- ✅ Support des 5 profils Factur-X
- ✅ Génération XML conforme EN 16931
- ✅ Calculs précis avec big.js
- ✅ Templates PDF modernes (Fancy & Brand)
- ✅ Embedding XML dans PDF/A-3
- ✅ Signature numérique RSA
- ✅ Validation XSD
- ⚠️ Order-X en développement

### Roadmap Future
- 🔜 Finalisation Order-X
- 🔜 Support UBL complet
- 🔜 API REST pour génération
- 🔜 Tests unitaires complets
- 🔜 Documentation utilisateur externe
- 🔜 CLI pour génération en ligne de commande

---

## 10. SUPPORT ET CONTRIBUTION

### Support
Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les exemples dans `src/example-loi.ts` et `src/example-order.ts`
3. Consulter les tests (quand disponibles)
4. Ouvrir une issue sur GitHub

### Contribution
Les contributions sont les bienvenues ! Pour contribuer :
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changes (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 LICENCE

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## ✅ RÉSUMÉ EXÉCUTIF

### Pour Créer une Facture Factur-X Conforme :
1. Utiliser `FacturXInvoice` avec profil `EN16931` ou `EXTENDED`
2. Type de document : `DocTypeCode.INVOICE` (380)
3. Remplir toutes les données obligatoires (vendeur, acheteur, lignes, TVA)
4. Générer le XML avec `invoice.generateXml()`
5. Générer le PDF avec un template (`InvoiceTemplateFancy`)
6. Embarquer le XML dans le PDF avec `pdfDoc.attach()`
7. Sauvegarder le PDF/A-3

### Pour Créer un Devis Conforme :
1. **Même processus que la facture**
2. Type de document : `DocTypeCode.PRO_FORMAT` (384)
3. Ajouter mentions spécifiques au devis (validité, conditions)
4. Pas d'échéance de paiement obligatoire

### Dépendances de `example-loi.ts` :
- **21 fichiers TypeScript** internes
- **20 packages npm** externes
- **4 modules Node.js** natifs
- **Fichier central** : `FacturXInvoice.ts` (1198 lignes)

---

**Document généré le :** 2025-11-14
**Projet :** accounting-tools
**Auteur :** Analyse automatique via Claude Code
