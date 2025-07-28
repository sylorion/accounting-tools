# InvoiceTemplateFancy - Gestion Multi-Pages

## Améliorations Implementées

### ✅ Gestion Multi-Pages
- **Pagination automatique** : Le système crée automatiquement de nouvelles pages quand l'espace est insuffisant
- **Headers cohérents** : Chaque page a un header avec le numéro de modèle et la date/numéro de facture
- **Entêtes de tableau** : Les en-têtes du tableau des items sont automatiquement répétées sur chaque nouvelle page
- **Gestion intelligente de l'espace** : Vérifie l'espace disponible avant d'ajouter du contenu

### ✅ Structure de Pages
1. **Première page** :
   - Header compact avec modèle/date
   - Logo et informations vendeur
   - Titre "FACTURE" avec détails
   - Sections "Facturé à" et "Livré à"
   - Début du tableau des items

2. **Pages suivantes** :
   - Header compact identique
   - Continuation du tableau avec en-têtes
   - Items paginés automatiquement

3. **Dernière page** :
   - Fin du tableau des items
   - QR Code et résumé financier (Sous-total, TVA, Total)
   - Conditions de paiement et de vente
   - Pied de page avec informations légales

### ✅ Fonctionnalités Techniques

#### Gestion des Pages
```typescript
- pages: Array de {page: PDFPage, currentY: number}
- currentPageIndex: Index de la page courante
- createNewPage(): Crée une nouvelle page
- updateCurrentPageY(): Met à jour la position Y
- needsNewPage(): Vérifie si une nouvelle page est nécessaire
```

#### Méthodes Principales
- `drawFirstPageContent()`: Contenu spécifique à la première page
- `drawItemsTableMultiPage()`: Tableau des items avec pagination
- `drawSummaryOnLastPage()`: Synthèse sur la dernière page
- `addFootersToAllPages()`: Pieds de page sur toutes les pages
- `addPageNumbers()`: Numérotation des pages

#### Adaptations de Structure
- Migration de `FacturXInvoice` vers `InvoiceData<T>`
- Adaptation aux structures `SellerInfo` et `BuyerInfo`
- Support des `BaseInvoiceItem[]` au lieu de `InvoiceLine[]`

### ✅ Éléments Visuels

#### Headers de Page
- Numéro de modèle (m.inv-2025-1)
- Date formatée et numéro de facture
- QR Code placeholder

#### Tableau des Items
- En-têtes : #, Description, Qty, Unit, Unit Price, VAT (%), Total (€)
- Alternance de couleurs de lignes
- Alignement approprié (centré, gauche, droite)
- Gestion des descriptions longues (troncature)

#### Synthèse Financière
- QR Code de 40mm x 40mm
- Sous-total HT, TVA, Total TTC
- Encadré avec bordure colorée
- Format monétaire avec €

#### Conditions et Pied de Page
- Conditions de paiement et de vente
- Informations légales centrées
- Numérotation "Page X sur Y"

### ✅ Test et Validation
- Script de test avec 50 items pour vérifier la pagination
- Génération réussie d'un PDF de 123KB
- Validation des données via `BaseInvoiceTemplate.validate()`

## Usage

```typescript
import { InvoiceTemplateFancy } from './src/templates/InvoiceTemplateFancy';
import { InvoiceData } from './src/models/InvoiceData';

const template = new InvoiceTemplateFancy();
const pdfBytes = await template.render(invoiceData);
fs.writeFileSync('invoice.pdf', pdfBytes);
```

## Architecture

La classe `InvoiceTemplateFancy<T>` hérite de `BaseInvoiceTemplate<T>` et implémente :
- `render(invoiceData: InvoiceData<T>): Promise<Uint8Array>`
- Compatibilité avec le système de templates existant
- Gestion complète des pages multiples avec headers/footers cohérents
