# Analyse des fonctionnalités pour intégration Backend

## Résumé
Ce projet `accounting-tools` est une **bibliothèque TypeScript** pour la génération de factures, pas un backend complet. Il n'y a pas de backend NestJS ou Fastify existant dans ce projet. Cette analyse documente les fonctionnalités disponibles pour les intégrer dans un futur backend.

## Fonctionnalités disponibles dans la bibliothèque

### 1. Génération de factures Factur-X
**Localisation**: `src/core/FacturXInvoice.ts`, `src/FacturxEngine.ts`

**Fonctionnalités**:
- Support des profils Factur-X: MINIMUM, BASIC, BASICWL, EN16931, EXTENDED
- Génération XML conforme aux normes européennes (EN 16931)
- Support du standard français (X-Factur)
- Format CII (Cross Industry Invoice) UN/CEFACT
- Validation des données selon le profil sélectionné
- Calcul automatique des totaux avec arrondis corrects

**API principale**:
```typescript
const invoice = new FacturXInvoice(FacturxProfile.EN16931, header, seller, buyer, payment);
invoice.lines.push(new InvoiceLine(...));
const xml = invoice.generateXml();
```

### 2. Génération de commandes Order-X
**Localisation**: `src/OrderxEngine.ts`, `src/models/OrderData.ts`

**Fonctionnalités**:
- Support du standard Order-X (commandes électroniques)
- Profils: BASIC, COMFORT, EXTENDED
- Génération XML conforme
- Gestion des articles de commande

### 3. Gestion des taxes et calculs
**Localisation**: `src/core/TaxCalculator.ts`

**Fonctionnalités**:
- Calcul automatique de la TVA
- Support des taux multiples
- Gestion des exemptions
- Arrondis conformes aux normes comptables
- Ventilation par catégorie de taxe

### 4. Génération PDF avancée
**Localisation**: `src/templates/InvoiceTemplateFancy.ts`, `src/generators/`

**Fonctionnalités**:
- Templates modernes et professionnels
- Support multi-page
- QR codes intégrés
- Logos et branding
- Export PDF/A-3 (conformité archivage)
- Templates personnalisables:
  - `InvoiceTemplateFancy` (template avancé avec QR codes)
  - `Modern2024InvoiceTemplate`
  - `ModernHTMLInvoiceTemplate`

### 5. Signature électronique
**Localisation**: `src/signature/Signer.ts`

**Fonctionnalités**:
- Signature PDF avec certificats P12
- Conformité eIDAS
- Horodatage
- Validation des signatures

### 6. Conformité et validation
**Localisation**: `src/compliance/`, `src/validate-xml.ts`

**Fonctionnalités**:
- Validation XSD pour Factur-X et UBL
- Vérification de conformité
- Support des schémas européens
- Validation XML en temps réel

### 7. Gestion des données
**Localisation**: `src/models/`, `src/core/`

**Classes principales**:
- `FacturXInvoice`: Facture complète
- `DocumentHeader`: En-têtes de document
- `TradeParty`: Informations vendeur/acheteur
- `InvoiceLine`: Lignes de facture
- `PaymentDetails`: Informations de paiement
- `AllowanceCharge`: Remises et frais

## Recommandations pour intégration Backend

### Architecture suggérée (Fastify)

```typescript
// Structure recommandée pour un backend Fastify
src/
├── routes/
│   ├── invoices.ts       // CRUD factures
│   ├── orders.ts         // CRUD commandes
│   ├── templates.ts      // Gestion templates
│   └── compliance.ts     // Validation/conformité
├── services/
│   ├── InvoiceService.ts // Logique métier factures
│   ├── OrderService.ts   // Logique métier commandes
│   ├── PDFService.ts     // Génération PDF
│   └── ValidationService.ts // Validation documents
├── models/
│   └── (réutiliser les modèles existants)
└── lib/
    └── accounting-tools/ // Cette bibliothèque
```

### Endpoints API recommandés

#### Factures
- `POST /api/invoices` - Créer une facture
- `GET /api/invoices/:id` - Récupérer une facture
- `PUT /api/invoices/:id` - Modifier une facture
- `DELETE /api/invoices/:id` - Supprimer une facture
- `POST /api/invoices/:id/pdf` - Générer PDF
- `POST /api/invoices/:id/xml` - Générer XML
- `POST /api/invoices/:id/sign` - Signer électroniquement

#### Commandes
- `POST /api/orders` - Créer une commande
- `GET /api/orders/:id` - Récupérer une commande
- `PUT /api/orders/:id` - Modifier une commande
- `DELETE /api/orders/:id` - Supprimer une commande
- `POST /api/orders/:id/pdf` - Générer PDF

#### Validation
- `POST /api/validate/facturx` - Valider XML Factur-X
- `POST /api/validate/ubl` - Valider UBL
- `POST /api/compliance/check` - Vérifier conformité

#### Templates
- `GET /api/templates` - Lister les templates
- `POST /api/templates` - Créer un template
- `PUT /api/templates/:id` - Modifier un template

### Exemple d'intégration service

```typescript
// services/InvoiceService.ts
import { FacturXInvoice, FacturxProfile } from '../lib/accounting-tools';
import { InvoiceTemplateFancy } from '../lib/accounting-tools/templates';

export class InvoiceService {
  async generateFacturX(data: InvoiceData): Promise<Buffer> {
    const invoice = new FacturXInvoice(
      FacturxProfile.EN16931,
      data.header,
      data.seller,
      data.buyer,
      data.payment
    );
    
    // Ajouter les lignes
    data.lines.forEach(line => invoice.lines.push(line));
    
    // Générer PDF avec template moderne
    const template = new InvoiceTemplateFancy();
    return await template.render(invoice);
  }
  
  async validateFacturX(xml: string): Promise<boolean> {
    // Utiliser les fonctions de validation existantes
    return await this.validateXML(xml);
  }
}
```

## Conclusion

La bibliothèque `accounting-tools` fournit une base solide pour un backend de facturation avec:
- ✅ Génération Factur-X/Order-X complète
- ✅ Templates PDF modernes
- ✅ Signature électronique
- ✅ Validation et conformité
- ✅ Calculs fiscaux avancés

**Il n'y a pas de backend NestJS existant à migrer**, mais cette bibliothèque peut être facilement intégrée dans un nouveau backend Fastify pour créer une solution complète de facturation électronique.
