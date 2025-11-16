# Factur-X Examples / Exemples Factur-X

Comprehensive examples demonstrating how to use the `@facturx/core` library to generate compliant Factur-X invoices.

**Exemples complets démontrant l'utilisation de la librairie `@facturx/core` pour générer des factures Factur-X conformes.**

---

## 📚 Table of Contents / Table des Matières

| # | Example | Profile | Description |
|---|---------|---------|-------------|
| 01 | [Simple Invoice](#01-simple-invoice) | MINIMUM | Basic invoice, no VAT |
| 02 | [Invoice with VAT](#02-invoice-with-vat) | BASIC | Standard invoice with 20% VAT |
| 03 | [Multi-Line Invoice](#03-multi-line-invoice) | BASIC | Multiple products, mixed VAT rates |
| 04 | [Invoice with Discount](#04-invoice-with-discount) | EN16931 | Document-level discounts |
| 05 | [Multi-Currency Invoice](#05-multi-currency-invoice) | EN16931 | International invoice in USD |
| 06 | [Quote / Devis](#06-quote-devis) | EN16931 | Pro forma invoice (quotation) |
| 07 | [Credit Note / Avoir](#07-credit-note-avoir) | EN16931 | Product returns, refunds |
| 08 | [Complex B2B Invoice](#08-complex-b2b-invoice) | EXTENDED | All features, enterprise-grade |

---

## 🚀 Quick Start / Démarrage Rapide

### Prerequisites / Prérequis

```bash
# Install dependencies
cd lib/factur-x-ts
npm install

# Build the library
npm run build
```

### Run Examples / Exécuter les Exemples

```bash
# Run a specific example
npx ts-node examples/01-simple-invoice.ts

# Or compile and run
tsc examples/01-simple-invoice.ts --target ES2020 --module commonjs --esModuleInterop
node examples/01-simple-invoice.js
```

### Output / Sortie

All examples generate XML files in `examples/output/`:
- `01-simple-invoice.xml`
- `02-invoice-with-vat.xml`
- `03-multi-line-invoice.xml`
- etc.

---

## 📖 Examples Documentation / Documentation des Exemples

### 01. Simple Invoice

**File:** `01-simple-invoice.ts`
**Profile:** MINIMUM
**Complexity:** ⭐☆☆☆☆

**What it demonstrates:**
- Creating the simplest possible Factur-X invoice
- Basic seller/buyer information
- Single product line
- No VAT (0%)
- Payment terms

**Use cases:**
- Educational purposes
- Simple invoices for non-taxable services
- Freelance work invoices

**Key code:**

```typescript
const invoice = new FacturXInvoice(
  FacturxProfile.MINIMUM,
  header,
  seller,
  buyer,
  payment,
  [line1],
  [],
  CurrencyCode.EUR
);
```

---

### 02. Invoice with VAT

**File:** `02-invoice-with-vat.ts`
**Profile:** BASIC
**Complexity:** ⭐⭐☆☆☆

**What it demonstrates:**
- Standard invoice with VAT calculation
- 20% French standard VAT rate
- Complete seller/buyer details
- Payment terms (30 days)

**Use cases:**
- Standard B2B invoices
- Service invoices with VAT
- Professional consulting invoices

**Key features:**
- Automatic VAT calculation
- Tax basis and grand total
- Payment reference tracking

---

### 03. Multi-Line Invoice

**File:** `03-multi-line-invoice.ts`
**Profile:** BASIC
**Complexity:** ⭐⭐⭐☆☆

**What it demonstrates:**
- Multiple product lines (5 items)
- Mixed products and services
- Different VAT rates (20%, 5.5%)
- Tax breakdown by rate

**Use cases:**
- Retail invoices
- E-commerce orders
- Restaurant bills
- Mixed product/service sales

**Key features:**
- Multiple VAT rates in single invoice
- Automatic tax calculation per rate
- Detailed line item descriptions

---

### 04. Invoice with Discount

**File:** `04-invoice-with-discount.ts`
**Profile:** EN16931
**Complexity:** ⭐⭐⭐☆☆

**What it demonstrates:**
- Document-level allowances (discounts)
- Document-level charges (shipping fees)
- Loyalty discount (10%)
- EN16931 compliance

**Use cases:**
- B2B invoices with volume discounts
- Promotional offers
- Seasonal sales
- VIP customer discounts

**Key features:**
- Allowances and charges
- Automatic total recalculation
- Discount tracking and reporting

**Key code:**

```typescript
const discount = AllowanceCharge.allowance(
  subtotalHT * 0.10,
  'Remise fidélité client VIP - 10%'
);

const invoice = new FacturXInvoice(
  FacturxProfile.EN16931,
  header,
  seller,
  buyer,
  payment,
  lines,
  [discount],  // Document-level allowances
  CurrencyCode.EUR
);
```

---

### 05. Multi-Currency Invoice

**File:** `05-multi-currency-invoice.ts`
**Profile:** EN16931
**Complexity:** ⭐⭐⭐⭐☆

**What it demonstrates:**
- International invoicing in USD
- Cross-border transactions (FR → US)
- VAT exemption for exports
- Exchange rate informational notes

**Use cases:**
- International sales
- Export invoices
- SaaS subscriptions for foreign clients
- Multi-currency accounting

**Supported currencies:**
EUR, USD, GBP, CHF, JPY, CAD, AUD, CNY, INR, and 20+ more

**Key features:**
- Tax category: EXPORT (0% VAT)
- International payment terms
- Currency conversion notes

---

### 06. Quote / Devis

**File:** `06-quote-devis.ts`
**Profile:** EN16931
**Complexity:** ⭐⭐⭐⭐☆

**What it demonstrates:**
- Quotation document (pro forma invoice)
- Document type: PRO_FORMA
- Validity period (30 days)
- Optional items and packages
- Payment schedule (deposit + balance)

**Use cases:**
- Sales quotes
- Construction estimates
- Service proposals
- Commercial offers

**Key features:**
- Validity date tracking
- Package/bundle pricing
- Optional items
- Detailed terms and conditions

**Key code:**

```typescript
const header = DocumentHeaderImpl.builder()
  .id('DEVIS-2025-006')
  .invoiceNumber('DEVIS-2025-006')
  .name('DEVIS')
  .typeCode(DocTypeCode.PRO_FORMA)  // Quotation
  .dueDate(validityDate)
  .build();
```

---

### 07. Credit Note / Avoir

**File:** `07-credit-note-avoir.ts`
**Profile:** EN16931
**Complexity:** ⭐⭐⭐⭐☆

**What it demonstrates:**
- Credit note for product returns
- Document type: CREDIT_NOTE
- Reference to original invoice
- Partial refund calculation
- Balance after credit note

**Use cases:**
- Product returns
- Invoice corrections
- Refunds
- Order cancellations

**Important notes:**
- Credit note amounts are POSITIVE (not negative)
- Always reference the original invoice
- Shows remaining balance calculation

**Key code:**

```typescript
const header = DocumentHeaderImpl.builder()
  .id('AVOIR-2025-007')
  .typeCode(DocTypeCode.CREDIT_NOTE)
  .purchaseOrderReference('FACT-2025-789')  // Original invoice
  .build();
```

---

### 08. Complex B2B Invoice

**File:** `08-complex-b2b-invoice.ts`
**Profile:** EXTENDED
**Complexity:** ⭐⭐⭐⭐⭐

**What it demonstrates:**
- Most complete Factur-X profile
- Multiple product lines (8 items)
- Line-level allowances
- Document-level allowances and charges
- Multiple VAT rates (20%, 5.5%)
- Billing periods
- Contract references
- Early payment discounts

**Use cases:**
- Enterprise B2B invoicing
- Complex contracts
- Subscription billing
- Professional services
- Managed services

**Key features:**
- Billing period tracking
- Contract references
- SLA tracking
- Multiple adjustment levels
- Detailed payment options
- Category breakdowns

**Categories included:**
- Consulting services (hourly + extra hours)
- Cloud infrastructure (AWS)
- Premium support (24/7)
- Training (on-site)
- Security audits
- Documentation

---

## 🔍 Factur-X Profiles Comparison / Comparaison des Profils

| Profile | Complexity | Use Case | Required Fields |
|---------|------------|----------|-----------------|
| **MINIMUM** | ⭐☆☆☆☆ | Simple invoices | Very few (10+) |
| **BASICWL** | ⭐⭐☆☆☆ | Basic B2B without lines | Moderate (30+) |
| **BASIC** | ⭐⭐☆☆☆ | Standard invoices | Moderate (40+) |
| **EN16931** | ⭐⭐⭐⭐☆ | European standard | Many (80+) |
| **EXTENDED** | ⭐⭐⭐⭐⭐ | Complete feature set | Most (120+) |

### Profile Selection Guide

Choose your profile based on:

1. **MINIMUM**: Quick invoices, no line details needed
2. **BASIC**: Standard business invoices with line items
3. **EN16931**: EU compliance required, B2B/B2G invoicing
4. **EXTENDED**: Complex contracts, enterprise requirements

---

## 📊 Document Types / Types de Documents

| Code | Type | Example File | Description |
|------|------|--------------|-------------|
| 380 | Commercial Invoice | 01-08 | Standard invoice |
| 381 | Credit Note | 07 | Refund/return |
| 384 | Pro Forma | 06 | Quote/estimate |
| 386 | Prepayment | - | Advance payment |
| 383 | Debit Note | - | Additional charges |

---

## 💰 Tax Categories / Catégories de TVA

| Code | Category | Rate (FR) | Example |
|------|----------|-----------|---------|
| S | Standard | 20% | Most goods/services |
| Z | Zero | 0% | Some exports |
| E | Exempt | 0% | Medical, education |
| G | Export | 0% | Outside EU |
| AA | Reduced | 5.5% | Books, food |

---

## 🌍 Supported Currencies / Devises Supportées

EUR, USD, GBP, CHF, JPY, CAD, AUD, CNY, INR, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN, HRK, RSD, TRY, RUB, UAH, BRL, MXN, ARS, ZAR, AED, SAR, KRW

**Total: 30+ currencies**

---

## 🛠️ Development / Développement

### Running Tests / Exécuter les Tests

```bash
# Run all examples
npm run examples

# Test specific example
npx ts-node examples/01-simple-invoice.ts
npx ts-node examples/02-invoice-with-vat.ts
# ... etc
```

### Validating XML / Valider le XML

```bash
# Install XSD validator
npm install -g xsd-validator

# Validate generated XML
xsd-validator -s Factur-X.xsd -i output/01-simple-invoice.xml
```

---

## 📝 Best Practices / Bonnes Pratiques

### 1. Profile Selection

- Start with **MINIMUM** for learning
- Use **BASIC** for most business needs
- Choose **EN16931** for EU compliance
- Select **EXTENDED** only when needed

### 2. Error Handling

```typescript
try {
  const invoice = new FacturXInvoice(...);
  const xml = invoice.generateXml(true); // Validate
} catch (error) {
  console.error('Invalid invoice:', error.message);
}
```

### 3. Date Handling

```typescript
// Always use Date objects
const invoiceDate = new Date('2025-11-16');
const dueDate = new Date(invoiceDate);
dueDate.setDate(dueDate.getDate() + 30); // +30 days
```

### 4. Amounts Precision

```typescript
// Library handles rounding automatically
const price = 100.126; // Will be rounded to 100.13
const vatRate = 0.20;  // Use decimals, not percentages
```

### 5. Required Fields

Each profile has mandatory fields. Use builders to ensure completeness:

```typescript
const seller = TradePartyImpl.builder()
  .name('Company')      // Required
  .address(address)     // Required
  .vatId('FR123...')    // Required for EN16931+
  .build();
```

---

## 🔗 Additional Resources / Ressources Supplémentaires

- [Factur-X Official Website](https://factur-x.eu/)
- [EN 16931 Standard](https://standards.cen.eu/)
- [German ZUGFeRD](https://www.ferd-net.de/)
- [French FNFE-MPE](https://fnfe-mpe.org/)

---

## 📄 License

MIT License - See LICENSE file

---

## 🤝 Contributing / Contribuer

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add your example with documentation
4. Submit a pull request

---

## ❓ Support

For questions or issues:
- GitHub Issues: [facturx/facturx-ts/issues](https://github.com/facturx/facturx-ts/issues)
- Email: support@facturx.eu

---

**Last updated:** November 16, 2025
**Library version:** 1.0.0
**Factur-X version:** 1.07.2
**EN 16931 version:** 2017
