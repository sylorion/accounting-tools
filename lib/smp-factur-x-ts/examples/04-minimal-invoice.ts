/**
 * Example 4: Clean minimalist invoice with Minimal template
 *
 * This example demonstrates how to create a clean, modern invoice
 * using the Minimal template (monochrome design).
 * Perfect for startups, freelancers, and modern businesses.
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
} from '@facturx/core';
import { generateMinimalPDF } from '../src';

async function main() {
  // 1. Create seller (Freelance Developer)
  const sellerAddress = new PostalAddress(
    '15 Startup Street',
    'Toulouse',
    '31000',
    'FR'
  );

  const seller = new TradeParty(
    'Jean Dupont - Freelance Developer',
    sellerAddress,
    'FR66778899001'
  );

  // 2. Create buyer (Startup)
  const buyerAddress = new PostalAddress(
    '88 Innovation Road',
    'Bordeaux',
    '33000',
    'FR'
  );

  const buyer = new TradeParty(
    'TechStart SAS',
    buyerAddress,
    'FR22334455667'
  );

  // 3. Create document header
  const header = new DocumentHeader(
    'DEV-2025-001',
    'DEV-2025-001',
    'Development Services',
    new Date(2025, 0, 25),
    new Date(2025, 0, 25)
  );

  // 4. Create payment details
  const payment = new PaymentDetails(
    58,
    'FR7611223344556677889900123',
    'SOGEFRPP',
    new Date(2025, 1, 10),
    'Due on receipt'
  );

  // 5. Create invoice
  const invoice = new FacturXInvoice(
    FacturxProfile.BASIC,
    header,
    seller,
    buyer,
    payment
  );

  // 6. Add development services
  invoice.addLine(
    new InvoiceLine(
      '1',
      'Frontend Development - React components',
      40,
      75.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '2',
      'Backend API Development - Node.js',
      32,
      85.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '3',
      'Database Design & Implementation',
      16,
      90.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '4',
      'Code Review & Optimization',
      8,
      80.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '5',
      'Testing & Quality Assurance',
      12,
      70.00,
      0.20
    )
  );

  // 7. Generate PDF with Minimal template
  const result = await generateMinimalPDF(invoice, {
    language: 'en',
    showTaxBreakdown: true,
    showPaymentTerms: true,
    customFooter: 'Thank you for your business',
  });

  // 8. Save PDF
  const outputPath = 'examples/output/04-minimal-invoice-minimal.pdf';
  fs.mkdirSync('examples/output', { recursive: true });
  fs.writeFileSync(outputPath, result.pdf);

  console.log(`✓ Minimal invoice generated!`);
  console.log(`  Template: Minimal (Monochrome)`);
  console.log(`  Pages: ${result.pageCount}`);
  console.log(`  Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
  console.log(`  Output: ${outputPath}`);
}

main().catch(console.error);
