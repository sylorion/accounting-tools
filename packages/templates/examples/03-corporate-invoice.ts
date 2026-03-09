/**
 * Example 3: Professional corporate invoice with Brand template
 *
 * This example demonstrates how to create a professional corporate invoice
 * using the Brand template (navy and orange colors).
 * Ideal for established businesses and corporate services.
 */

import fs from 'fs';
import {
  FacturXInvoice,
  FacturxProfile,
  DocumentHeader,
  TradeParty,
  PostalAddress,
  PaymentDetails,
  InvoiceLine,
  AllowanceCharge,
} from '@facturx/core';
import { generateBrandPDF } from '../src';

async function main() {
  // 1. Create seller (Consulting Firm)
  const sellerAddress = new PostalAddress(
    '100 Corporate Plaza',
    'Paris',
    '75008',
    'FR',
    'Suite 500'
  );

  const seller = new TradeParty(
    'Global Consulting Partners',
    sellerAddress,
    'FR55443322110'
  );

  // 2. Create buyer (Large Corporation)
  const buyerAddress = new PostalAddress(
    '250 Enterprise Avenue',
    'Marseille',
    '13001',
    'FR',
    'Tower A'
  );

  const buyer = new TradeParty(
    'MegaCorp Industries SA',
    buyerAddress,
    'FR00998877665'
  );

  // 3. Create document header
  const header = new DocumentHeader(
    'GCP-2025-Q1-0157',
    'GCP-2025-Q1-0157',
    'Quarterly Consulting Services',
    new Date(2025, 0, 31),
    new Date(2025, 0, 31)
  );

  // 4. Create payment details
  const payment = new PaymentDetails(
    58,
    'FR7620041010050500013M02606',
    'BNPAFRPPXXX',
    new Date(2025, 2, 15), // Due: March 15, 2025
    'Payment terms: Net 45 days from invoice date'
  );

  // 5. Create invoice
  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    seller,
    buyer,
    payment
  );

  // 6. Add consulting services
  invoice.addLine(
    new InvoiceLine(
      '1',
      'Strategic Planning Workshop - 2 days on-site',
      2,
      3500.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '2',
      'Management Consulting - Senior consultant hours',
      120,
      180.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '3',
      'Business Process Analysis - Detailed report',
      1,
      5000.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '4',
      'Implementation Support - Monthly retainer',
      3,
      2500.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '5',
      'Training Sessions - Team workshops (5 sessions)',
      5,
      800.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '6',
      'Follow-up Consultation - Video conferencing',
      10,
      150.00,
      0.20
    )
  );

  // 7. Add volume discount
  invoice.addDocAllowanceCharge(
    new AllowanceCharge(
      false,
      2000.00,
      'Volume discount - Quarterly package',
      'VOL_DISCOUNT',
      0.20
    )
  );

  // 8. Add travel expenses
  invoice.addDocAllowanceCharge(
    new AllowanceCharge(
      true, // charge
      850.00,
      'Travel and accommodation expenses',
      'TRAVEL',
      0.20
    )
  );

  // 9. Generate PDF with Brand template
  const result = await generateBrandPDF(invoice, {
    language: 'fr',
    showTaxBreakdown: true,
    showPaymentTerms: true,
    customFooter: 'Global Consulting Partners - Excellence in Business Strategy',
  });

  // 10. Save PDF
  const outputPath = 'examples/output/03-corporate-invoice-brand.pdf';
  fs.mkdirSync('examples/output', { recursive: true });
  fs.writeFileSync(outputPath, result.pdf);

  console.log(`✓ Corporate invoice generated!`);
  console.log(`  Template: Brand (Navy & Orange)`);
  console.log(`  Pages: ${result.pageCount}`);
  console.log(`  Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
  console.log(`  Output: ${outputPath}`);
}

main().catch(console.error);
