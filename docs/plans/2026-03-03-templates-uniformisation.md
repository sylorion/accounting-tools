# Templates Uniformisation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Uniformiser les 5 templates PDF (Modern, Brand, Corporate, Minimal, Fancy) avec : logo configurable (left/above), SIREN/SIRET, text wrapping, QR code paiement en bas, et QR code d'informations facture sur les pages de continuation (page 2+).

**Architecture:** Ajout de méthodes partagées dans `TemplateRenderer` (base class) : `renderQRCode()`, `buildInvoiceQRData()`, `drawContinuationPageHeaders()`. Chaque template non-Fancy est ensuite mis à jour pour logo, SIREN/SIRET, wrapping et QR paiement. La continuation header (pages 2+) est gérée automatiquement par la base après rendu.

**Tech Stack:** TypeScript, pdf-lib, qrcode, @facturx/core, @facturx/templates

---

## Constantes et layout de référence

**Continuation header (pages 2+), hauteur = 70px :**
```
┌──────────────────────────────────────┬──────────┬──────┐
│ [Nom client]                         │          │  F   │
│ Émis le: 03/03/2026                  │  [QR]    │  A   │
│ Total dû: 12 345,67 €                │  60×60   │  -   │
│ Échéance: 02/04/2026                 │          │  0   │
│                                      │          │  0   │
│                                      │          │  1   │
└──────────────────────────────────────┴──────────┴──────┘
 ← summaryWidth (55%) →              ← qrSize → ← 25px→
```

**QR code paiement (bas de page, section paiement) :**
- Taille : 80×80px
- Données : `paymentLink` ou fallback `https://pay.services.ceo/invoices/{id}`
- Label : "Scannez pour payer"

**QR code header (page 2+) :**
- Taille : 60×60px
- Données : JSON compact via `buildInvoiceQRData()`

---

## Task 1: Préparer TemplateRenderer — imports et constantes

**Files:**
- Modify: `packages/templates/src/core/TemplateRenderer.ts`

**Step 1: Ajouter les imports manquants en haut du fichier**

Remplacer la ligne d'import pdf-lib :
```typescript
import { PDFDocument, PDFPage, PDFFont, PDFImage, rgb, degrees } from 'pdf-lib';
```

Ajouter l'import QRCode après les imports pdf-lib :
```typescript
import QRCode from 'qrcode';
```

**Step 2: Ajouter la constante de hauteur continuation juste après `PAGE_FOOTER_HEIGHT`**

```typescript
/** Height reserved at top of continuation pages (page 2+) for the recap header */
protected static readonly CONTINUATION_HEADER_HEIGHT = 70;
```

**Step 3: Mettre à jour `addPage()` pour réserver l'espace sur les pages de continuation**

Remplacer la méthode `addPage()` existante :
```typescript
protected addPage(): void {
  const { pageFormat, margins } = this.context.options;
  const size = this.getPageSize(pageFormat);
  const isContinuation = this.allPages.length > 0;

  this.currentPage = this.pdfDoc.addPage(size);
  this.allPages.push(this.currentPage);

  const startY = isContinuation
    ? size[1] - margins.top - TemplateRenderer.CONTINUATION_HEADER_HEIGHT
    : size[1] - margins.top;

  this.renderContext = {
    width: size[0],
    height: size[1],
    margins,
    currentY: startY,
    pageNumber: this.pdfDoc.getPageCount(),
  };
}
```

**Step 4: Vérifier que le build passe**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```
Attendu : aucune erreur TypeScript.

---

## Task 2: Ajouter `buildInvoiceQRData()` dans TemplateRenderer

**Files:**
- Modify: `packages/templates/src/core/TemplateRenderer.ts`

**Step 1: Ajouter la méthode après `getGeneratedDateText()`**

```typescript
/**
 * Build JSON payload for the invoice header QR code (continuation pages).
 * Contains all key invoice data: id, url, seller, buyer, amounts.
 */
protected buildInvoiceQRData(): string {
  const { invoice, summary, options } = this.context;
  const id = invoice.header.id;
  const baseUrl = options.paymentLink ||
    `https://pay.services.ceo/invoices/${id}`;

  const payload: Record<string, unknown> = {
    id,
    url: baseUrl,
    ref: invoice.header.invoiceNumber || id,
    date: invoice.header.invoiceDate.toISOString().split('T')[0],
    total: Math.round(summary.grandTotal * 100) / 100,
    currency: 'EUR',
    dueDate: this.getDueDate().toISOString().split('T')[0],
    seller: {
      name: invoice.seller.name,
      ...(invoice.seller.vatId && { vat: invoice.seller.vatId }),
      ...(options.sellerSiret && { siret: options.sellerSiret }),
      ...(options.sellerSiren && !options.sellerSiret && { siren: options.sellerSiren }),
      ...(invoice.seller.email && { email: invoice.seller.email }),
      ...(invoice.seller.phone && { phone: invoice.seller.phone }),
      ...(invoice.seller.address && {
        address: [
          invoice.seller.address.street,
          `${invoice.seller.address.postalCode} ${invoice.seller.address.city}`,
          invoice.seller.address.countryCode,
        ].filter(Boolean).join(', '),
      }),
    },
    buyer: {
      name: invoice.buyer.name,
      ...(invoice.buyer.vatId && { vat: invoice.buyer.vatId }),
      ...(invoice.buyer.email && { email: invoice.buyer.email }),
      ...(invoice.buyer.phone && { phone: invoice.buyer.phone }),
    },
  };

  return JSON.stringify(payload);
}
```

**Step 2: Build**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 3: Ajouter `renderQRCode()` dans TemplateRenderer

**Files:**
- Modify: `packages/templates/src/core/TemplateRenderer.ts`

**Step 1: Ajouter la méthode protégée après `buildInvoiceQRData()`**

```typescript
/**
 * Render a QR code on the current page.
 * @param x - Left X position
 * @param y - Bottom Y position (pdf-lib coordinate system)
 * @param data - String to encode in the QR code
 * @param size - Width/height in points (default 80)
 * @param label - Optional label text below the QR code
 * @param color - QR color hex (default '#1e293b')
 */
protected async renderQRCode(
  x: number,
  y: number,
  data: string,
  size: number = 80,
  label?: string,
  color: string = '#1e293b',
): Promise<void> {
  try {
    const qrPngBuffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: 200,
      margin: 1,
      color: { dark: color.replace('#', ''), light: 'ffffff' },
      errorCorrectionLevel: 'M',
    });
    const qrImage = await this.pdfDoc.embedPng(qrPngBuffer);
    this.currentPage.drawImage(qrImage, { x, y, width: size, height: size });
  } catch {
    // Fallback: placeholder box
    this.currentPage.drawRectangle({
      x, y, width: size, height: size,
      borderColor: this.parseColor('#e2e8f0'),
      borderWidth: 1,
    });
    this.currentPage.drawText('QR', {
      x: x + size / 2 - 8,
      y: y + size / 2 - 5,
      size: 12,
      font: this.getFont('Helvetica-Bold'),
      color: this.parseColor('#94a3b8'),
    });
  }
  if (label) {
    this.currentPage.drawText(label, {
      x,
      y: y - 12,
      size: 7,
      font: this.getFont('Helvetica'),
      color: this.parseColor('#64748b'),
    });
  }
}
```

**Step 2: Build**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 4: Ajouter `drawContinuationPageHeaders()` dans TemplateRenderer

**Files:**
- Modify: `packages/templates/src/core/TemplateRenderer.ts`

**Step 1: Ajouter la méthode après `drawAllPageFooters()`**

```typescript
/**
 * Draw continuation headers on pages 2+ (after content is fully rendered).
 * Layout: [Client summary left] [QR center-right] [Invoice# vertical far-right]
 */
protected async drawContinuationPageHeaders(): Promise<void> {
  if (this.allPages.length <= 1) return; // Only if multi-page

  const qrData = this.buildInvoiceQRData();
  const { margins } = this.context.options;
  const { invoice, summary } = this.context;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const headerH = TemplateRenderer.CONTINUATION_HEADER_HEIGHT;
  const contentWidth = pageWidth - margins.left - margins.right;
  const qrSize = 60;
  const summaryWidth = contentWidth * 0.55;
  const font = this.getFont('Helvetica');
  const fontBold = this.getFont('Helvetica-Bold');

  // Pre-generate QR image once, reuse across pages
  let qrImage: import('pdf-lib').PDFImage | undefined;
  try {
    const qrPngBuffer = await QRCode.toBuffer(qrData, {
      type: 'png', width: 200, margin: 1,
      color: { dark: '1e293b', light: 'ffffff' },
      errorCorrectionLevel: 'M',
    });
    qrImage = await this.pdfDoc.embedPng(qrPngBuffer);
  } catch { /* will use fallback */ }

  for (let i = 1; i < this.allPages.length; i++) {
    const page = this.allPages[i];
    const topY = pageHeight - margins.top;
    const bandTop = topY;
    const bandBottom = topY - headerH;

    // Background band
    page.drawRectangle({
      x: margins.left, y: bandBottom,
      width: contentWidth, height: headerH,
      color: this.parseColor('#f8fafc'),
    });
    // Bottom separator
    page.drawLine({
      start: { x: margins.left, y: bandBottom },
      end: { x: pageWidth - margins.right, y: bandBottom },
      color: this.parseColor('#cbd5e1'),
      thickness: 0.5,
    });

    // ── LEFT: Client summary ──
    const sx = margins.left + 10;
    page.drawText(invoice.buyer.name, {
      x: sx, y: bandTop - 18,
      size: 10, font: fontBold, color: this.parseColor('#1e293b'),
    });
    page.drawText(
      `${this.strings.issueDate}: ${this.formatInvoiceDateFull()}`,
      { x: sx, y: bandTop - 32, size: 8, font, color: this.parseColor('#64748b') }
    );
    page.drawText(
      `${this.strings.grandTotal}: ${formatAmount(summary.grandTotal)} \u20AC`,
      { x: sx, y: bandTop - 46, size: 9, font: fontBold, color: this.parseColor('#1e293b') }
    );
    page.drawText(
      `${this.strings.dueDate}: ${this.formatDateFull(this.getDueDate())}`,
      { x: sx, y: bandTop - 60, size: 8, font, color: this.parseColor('#64748b') }
    );

    // ── CENTER-RIGHT: QR code ──
    const qrX = margins.left + summaryWidth + 10;
    const qrY = bandBottom + 5;
    if (qrImage) {
      page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    } else {
      page.drawRectangle({
        x: qrX, y: qrY, width: qrSize, height: qrSize,
        borderColor: this.parseColor('#e2e8f0'), borderWidth: 1,
      });
    }

    // ── FAR RIGHT: Invoice number vertical (bottom-to-top) ──
    const invoiceRef = invoice.header.id;
    const vertX = qrX + qrSize + 18;
    const vertBaseY = bandBottom + 8;
    page.drawText(invoiceRef, {
      x: vertX,
      y: vertBaseY,
      size: 8,
      font: fontBold,
      color: this.parseColor('#94a3b8'),
      rotate: degrees(90),
    });
  }
}
```

**Step 2: Mettre à jour `generate()` pour appeler `drawContinuationPageHeaders()` après `drawAllPageFooters()`**

Dans la méthode `generate()`, après `this.drawAllPageFooters()` :
```typescript
// Draw footer on ALL pages with correct total page count
this.drawAllPageFooters();

// Draw continuation recap headers on pages 2+
await this.drawContinuationPageHeaders();
```

**Step 3: Build**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 5: Mise à jour `renderHeader()` et `renderParties()` dans TemplateRenderer (base)

Ces méthodes sont utilisées par **ModernTemplate** directement.

**Files:**
- Modify: `packages/templates/src/core/TemplateRenderer.ts`

**Step 1: Rendre `renderHeader()` async et ajouter support logo**

Remplacer la signature et le début de `renderHeader()` :
```typescript
protected async renderHeader(): Promise<RenderedElement> {
  const { margins } = this.context.options;
  const { theme } = this.context;
  const { width } = this.renderContext;
  const invoice = this.context.invoice;
  const logoLayout = this.context.options.logoLayout || 'none';

  // Logo 'above': render above header band, push currentY down
  let logoConsumedH = 0;
  if (logoLayout === 'above') {
    const contentWidth = width - margins.left - margins.right;
    logoConsumedH = await this.renderLogo(
      margins.left, this.renderContext.currentY, contentWidth, 55
    );
    this.renderContext.currentY -= logoConsumedH;
  }

  const startY = this.renderContext.currentY;
  const headerHeight = 95;
  // ... reste du code existant inchangé ...
  // Seulement ajouter le logo 'left' dans la zone vendeur :
  let textOffsetX = 0;
  if (logoLayout === 'left') {
    const logoH = await this.renderLogo(
      margins.left + 10, startY - 5, 70, 70
    );
    if (logoH > 0) textOffsetX = 80;
  }
  // Décaler les textes seller de textOffsetX si logoLayout === 'left'
  // (appliquer margins.left + 10 + textOffsetX pour le titre)
```

Note: Adapter le code existant pour utiliser `textOffsetX` sur les textes du vendeur.

**Step 2: Mettre à jour `renderParties()` pour ajouter SIREN/SIRET**

Après le bloc `if (invoice.seller.vatId)` dans `renderParties()` :
```typescript
// SIREN/SIRET
const { sellerSiret, sellerSiren } = this.context.options;
if (sellerSiret) {
  this.drawText(`SIRET: ${sellerSiret}`, margins.left, startY - 93, { size: 8, color: '#64748b' });
} else if (sellerSiren) {
  this.drawText(`SIREN: ${sellerSiren}`, margins.left, startY - 93, { size: 8, color: '#64748b' });
}
```

**Step 3: Build**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 6: ModernTemplate — QR paiement

**Files:**
- Modify: `packages/templates/src/templates/ModernTemplate.ts`

**Step 1: Rendre `renderContent()` async**
```typescript
protected async renderContent(): Promise<void> {
```

**Step 2: Rendre `renderPaymentAndTotals()` async et ajouter QR**

Changer la signature :
```typescript
private async renderPaymentAndTotals(): Promise<void> {
```

Après le bloc `if (this.context.options.showPaymentTerms)` (après termsDescription), ajouter le QR :
```typescript
// QR code paiement
const paymentLink = this.context.options.paymentLink ||
  `https://pay.services.ceo/invoices/${this.context.invoice.header.id}`;
const qrSize = 80;
const qrX = margins.left + 5;
const minY = margins.bottom + TemplateRenderer.PAGE_FOOTER_HEIGHT + 5;
const qrY = Math.max(py - qrSize, minY);
await this.renderQRCode(qrX, qrY, paymentLink, qrSize, 'Scannez pour payer', '#2563eb');
py = qrY - 15;
```

**Step 3: Appeler `renderPaymentAndTotals()` avec await dans `renderContent()`**
```typescript
await this.renderPaymentAndTotals();
```

**Step 4: Build**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 7: BrandTemplate — logo + SIREN/SIRET + wrapping + QR paiement

**Files:**
- Modify: `packages/templates/src/templates/BrandTemplate.ts`

**Step 1: Rendre `renderContent()` et les méthodes concernées async**
```typescript
protected async renderContent(): Promise<void> {
  await this.renderBrandHeader();
  // ...
  await this.renderPaymentAndTotals();
  // ...
}
private async renderBrandHeader(): Promise<void> { ... }
private async renderPaymentAndTotals(): Promise<void> { ... }
```

**Step 2: Ajouter logo dans `renderBrandHeader()`**

Au début de `renderBrandHeader()`, avant le background :
```typescript
const logoLayout = this.context.options.logoLayout || 'none';
let logoConsumedH = 0;
if (logoLayout === 'above') {
  const contentWidth = width - margins.left - margins.right;
  logoConsumedH = await this.renderLogo(margins.left, startY, contentWidth, 55);
  this.renderContext.currentY -= logoConsumedH;
  // recalculate startY
  // startY = this.renderContext.currentY; <-- re-read after logo
}
let textOffsetX = 0;
if (logoLayout === 'left') {
  const logoH = await this.renderLogo(margins.left + 10, startY - 5, 70, 80);
  if (logoH > 0) textOffsetX = 80;
}
// Décaler le nom vendeur de textOffsetX
```

**Step 3: Ajouter SIREN/SIRET dans `renderBrandParties()`**

Après `if (invoice.seller.vatId)` :
```typescript
const { sellerSiret, sellerSiren } = this.context.options;
if (sellerSiret) {
  this.drawText(`SIRET: ${sellerSiret}`, margins.left + 10, startY - totalH + 10,
    { size: 8, color: '#4d4d4d' });
} else if (sellerSiren) {
  this.drawText(`SIREN: ${sellerSiren}`, margins.left + 10, startY - totalH + 10,
    { size: 8, color: '#4d4d4d' });
}
```
Note: décaler le VAT si SIRET/SIREN sont présents (vatId à -10, SIRET à +2 par exemple).

**Step 4: Ajouter text wrapping dans `renderBrandLineItems()`**

Remplacer le bloc `const rowHeight = 20;` et les appels `drawText` description :
```typescript
const descFontSize = 9;
const descMaxWidth = colWidths.description - 16;
const lineSpacing = 12;
const minRowHeight = 20;

const descLines = this.wrapText(line.description, descMaxWidth, descFontSize);
const textHeight = descLines.length * lineSpacing;
const rowHeight = Math.max(minRowHeight, textHeight + 8);

// Draw wrapped description
let descY = y - 14;
for (const descLine of descLines) {
  this.drawText(descLine, margins.left + 8, descY, { size: descFontSize });
  descY -= lineSpacing;
}
// Other columns vertically centered
const colY = y - (rowHeight / 2) - 4;
// Remplacer y - 13 par colY pour les autres colonnes
```

**Step 5: Ajouter QR paiement dans `renderPaymentAndTotals()`**

Après `if (invoice.payment.termsDescription)` :
```typescript
const paymentLink = this.context.options.paymentLink ||
  `https://pay.services.ceo/invoices/${this.context.invoice.header.id}`;
const qrSize = 80;
const qrX = margins.left + 10;
const minY = margins.bottom + TemplateRenderer.PAGE_FOOTER_HEIGHT + 5;
const qrY = Math.max(py - qrSize, minY);
await this.renderQRCode(qrX, qrY, paymentLink, qrSize, 'Scannez pour payer', '#0d2f5e');
```

**Step 6: Build**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 8: CorporateTemplate — logo + SIREN/SIRET + wrapping + QR paiement

**Files:**
- Modify: `packages/templates/src/templates/CorporateTemplate.ts`

Même pattern que BrandTemplate (Task 7) adapté aux couleurs corporate (`#293a73`, `#b8a643`).

**Step 1: Async `renderContent()`, `renderCorporateHeader()`, `renderPaymentAndTotals()`**

**Step 2: Logo dans `renderCorporateHeader()`**
- `above`: logo au-dessus du fond bleu clair
- `left`: logo à gauche du nom vendeur (décaler `margins.left + 20` → `margins.left + 20 + textOffsetX`)

**Step 3: SIREN/SIRET dans `renderCorporateParties()`**

Après `if (invoice.seller.vatId)` → N° TVA à y-80, SIRET/SIREN à y-92.

**Step 4: Text wrapping dans `renderCorporateLineItems()`**

Même pattern que Task 7, Step 4. `minRowHeight = 22`.

**Step 5: QR paiement dans `renderPaymentAndTotals()`**

Couleur QR : `#293a73`.

**Step 6: Build**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 9: MinimalTemplate — logo + SIREN/SIRET + wrapping + QR paiement

**Files:**
- Modify: `packages/templates/src/templates/MinimalTemplate.ts`

Même pattern. Couleurs : `#000000` / `#333333` / `#808080`.

**Step 1: Async `renderContent()`, `renderMinimalHeader()`, `renderPaymentAndTotals()`**

**Step 2: Logo dans `renderMinimalHeader()`**
- `above`: logo avant la ligne noire en haut (avant `this.drawLine(...)`)
- `left`: logo à gauche du titre FACTURE/AVOIR/DEVIS

**Step 3: SIREN/SIRET dans `renderMinimalParties()`**

Après `if (invoice.seller.vatId)` → déjà décalé avec y -= 14, ajouter :
```typescript
const { sellerSiret, sellerSiren } = this.context.options;
if (sellerSiret) {
  y -= 12;
  this.drawText(`SIRET: ${sellerSiret}`, margins.left, y, { size: 8, color: '#808080' });
} else if (sellerSiren) {
  y -= 12;
  this.drawText(`SIREN: ${sellerSiren}`, margins.left, y, { size: 8, color: '#808080' });
}
```

**Step 4: Text wrapping dans `renderMinimalLineItems()`**

Même pattern, `minRowHeight = 20`, lignes séparées par `this.drawLine(...)`.

**Step 5: QR paiement dans `renderPaymentAndTotals()`**

Couleur QR : `#000000`. Après `if (invoice.payment.termsDescription)`.

**Step 6: Build**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 10: FancyTemplate — ne pas dupliquer la continuation header

FancyTemplate a déjà : logo, SIREN/SIRET, wrapping, QR paiement.
La continuation header est gérée par la base (Task 4).

**Vérification uniquement — aucune modification nécessaire :**
```bash
cd packages/templates && npm run build 2>&1 | tail -5
```

---

## Task 11: Build final et régénération des 22 PDFs

**Files:**
- Modify: `generate-all.ts` (déjà à jour — SIREN/SIRET dans COMMON_OPTIONS)

**Step 1: Build complet de la lib**
```bash
cd /Users/smpceo/Documents/smp/accounting-tools
cd packages/templates && npm run build 2>&1
```
Attendu : aucune erreur TypeScript.

**Step 2: Régénérer les 22 PDFs**
```bash
cd /Users/smpceo/Documents/smp/accounting-tools
npm run generate:all 2>&1
```
Attendu : 22 fichiers générés sans erreur, résumé final affiché.

**Step 3: Vérifier les fichiers clés**
```bash
ls -la output/*.pdf | awk '{print $5, $9}' | sort -n
```
Attendu : tous les PDFs ont une taille > 0, les multi-pages (extended-multi-*) ont une taille plus grande.

**Step 4: Commit**
```bash
git add packages/templates/src/ generate-all.ts docs/plans/
git commit -m "feat: uniformise all templates with logo, SIREN/SIRET, text wrapping, dual QR codes

- TemplateRenderer: renderQRCode(), buildInvoiceQRData(), drawContinuationPageHeaders()
- addPage() reserves CONTINUATION_HEADER_HEIGHT on pages 2+
- Continuation header (pages 2+): client summary left, QR center, invoice# vertical right
- Modern/Brand/Corporate/Minimal: logo (above/left), SIREN/SIRET, text wrapping, payment QR
- Payment QR: paymentLink option or fallback https://pay.services.ceo/invoices/{id}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
