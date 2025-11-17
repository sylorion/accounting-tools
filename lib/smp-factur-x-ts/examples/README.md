# Factur-X Templates - Examples

This directory contains comprehensive examples demonstrating how to use the Factur-X PDF templates library.

## Available Templates

The library provides **5 beautiful templates** to choose from:

### 1. Modern Template
- **Style**: Clean, professional design
- **Colors**: Blue color scheme
- **Best for**: General business use, professional services
- **Example**: `01-simple-invoice.ts`

### 2. Fancy Template
- **Style**: Colorful, eye-catching design
- **Colors**: Pink and blue gradient
- **Best for**: Creative agencies, design studios, marketing firms
- **Example**: `02-creative-invoice.ts`

### 3. Brand Template
- **Style**: Strong corporate identity
- **Colors**: Navy blue and orange
- **Best for**: Established businesses, corporate services
- **Example**: `03-corporate-invoice.ts`

### 4. Corporate Template
- **Style**: Professional and elegant
- **Colors**: Gray, blue, and gold accents
- **Best for**: Large corporations, consulting firms
- **Example**: `03-corporate-invoice.ts` (also demonstrates this template)

### 5. Minimal Template
- **Style**: Ultra-clean, typography-focused
- **Colors**: Monochrome (black, white, grays)
- **Best for**: Startups, freelancers, modern minimalist businesses
- **Example**: `04-minimal-invoice.ts`

## Examples

### Example 1: Simple Invoice (Modern Template)
```bash
npx ts-node examples/01-simple-invoice.ts
```

Creates a basic invoice with:
- Web development services
- Hosting subscription
- Domain registration

### Example 2: Creative Invoice (Fancy Template)
```bash
npx ts-node examples/02-creative-invoice.ts
```

Creates a creative services invoice with:
- Brand identity design
- Website design
- Social media graphics
- Photography and retouching
- Early payment discount

### Example 3: Corporate Invoice (Brand Template)
```bash
npx ts-node examples/03-corporate-invoice.ts
```

Creates a professional consulting invoice with:
- Strategic planning workshops
- Management consulting hours
- Business process analysis
- Training sessions
- Volume discounts and expenses

### Example 4: Minimal Invoice (Minimal Template)
```bash
npx ts-node examples/04-minimal-invoice.ts
```

Creates a clean freelance invoice with:
- Frontend development
- Backend API development
- Database design
- Code review and testing

### Example 5: All Templates Comparison
```bash
npx ts-node examples/05-all-templates.ts
```

Generates the **same invoice** using **all 5 templates** for easy comparison.

## Running the Examples

### Prerequisites

Make sure you're in the `lib/smp-factur-x-ts` directory and dependencies are installed:

```bash
cd lib/smp-factur-x-ts
npm install
```

### Build the library

```bash
npm run build
```

### Run an example

```bash
npx ts-node examples/01-simple-invoice.ts
```

Or run all examples:

```bash
npx ts-node examples/05-all-templates.ts
```

## Output

All generated PDFs will be saved in the `examples/output/` directory.

## Basic Usage

Here's a minimal example:

```typescript
import {
  FacturXInvoice,
  FacturxProfile,
  DocumentHeader,
  TradeParty,
  PostalAddress,
  PaymentDetails,
  InvoiceLine,
} from '@facturx/core';
import { generateModernPDF } from '@facturx/templates';

// Create invoice components (seller, buyer, header, payment)
const invoice = new FacturXInvoice(
  FacturxProfile.BASIC,
  header,
  seller,
  buyer,
  payment
);

// Add lines
invoice.addLine(new InvoiceLine('1', 'Service', 10, 100, 0.20));

// Generate PDF
const result = await generateModernPDF(invoice, {
  language: 'fr',
  showTaxBreakdown: true,
  showPaymentTerms: true,
});

// Save
fs.writeFileSync('invoice.pdf', result.pdf);
```

## Template Selection

There are two ways to select a template:

### Method 1: Dedicated functions (recommended)

```typescript
import {
  generateModernPDF,
  generateFancyPDF,
  generateBrandPDF,
  generateCorporatePDF,
  generateMinimalPDF,
} from '@facturx/templates';

// Use specific template
const result = await generateFancyPDF(invoice, options);
```

### Method 2: Generic function with type parameter

```typescript
import { generatePDF, TemplateType } from '@facturx/templates';

const result = await generatePDF(
  invoice,
  TemplateType.FANCY,
  options
);
```

## Template Options

All templates support these options:

```typescript
{
  // Language: 'fr', 'en', 'de'
  language: 'fr',

  // Page format: 'A4', 'Letter', 'Legal'
  pageFormat: 'A4',

  // Custom margins
  margins: { top: 50, right: 50, bottom: 50, left: 50 },

  // Show/hide sections
  showTaxBreakdown: true,
  showPaymentTerms: true,
  showLineNumbers: true,

  // Custom footer text
  customFooter: 'Your company tagline',

  // Logo and watermark (future)
  showLogo: false,
  showWatermark: false,
  watermarkText: 'DRAFT',
}
```

## Architecture

The templates library follows this architecture:

```
factur-x/core          (dependency)
    ↑
    |
factur-x/templates     (this library)
```

**Important**:
- `@facturx/core` does NOT depend on `@facturx/templates`
- `@facturx/templates` depends on `@facturx/core`
- Templates are purely for PDF rendering
- Core handles Factur-X XML generation and business logic

## Next Steps

- Explore the examples
- Try different templates
- Customize options
- Integrate into your application

For more information, see the main project README.
