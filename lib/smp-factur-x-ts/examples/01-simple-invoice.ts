/**
 * Example 1: Simple invoice with Modern template
 *
 * This example demonstrates how to create a simple invoice
 * using the Modern template (default, clean design).
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
import { generateModernPDF } from '../src';

async function main() {
  // 1. Create seller
  const sellerAddress = new PostalAddress(
    '123 Business Street',
    'Paris',
    '75001',
    'FR'
  );

  const seller = new TradeParty(
    'Tech Solutions SARL',
    sellerAddress,
    'FR12345678901' // VAT number
  );

  // 2. Create buyer
  const buyerAddress = new PostalAddress(
    '456 Client Avenue',
    'Lyon',
    '69001',
    'FR'
  );

  const buyer = new TradeParty(
    'Client Corp',
    buyerAddress,
    'FR98765432100'
  );

  // 3. Create document header
  const header = new DocumentHeader(
    'INV-2025-001',
    'INV-2025-001',
    'Invoice',
    new Date(2025, 0, 15), // January 15, 2025
    new Date(2025, 0, 15)
  );

  // 4. Create payment details
  const payment = new PaymentDetails(
    58, // SEPA credit transfer
    'FR7630004000031234567890143', // IBAN
    'BNPAFRPPXXX', // BIC
    new Date(2025, 1, 15), // Due date: February 15, 2025
    'Payment due within 30 days'
  );

  // 5. Create invoice
  const invoice = new FacturXInvoice(
    FacturxProfile.BASIC,
    header,
    seller,
    buyer,
    payment
  );

  // 6. Add invoice lines
  invoice.addLine(
    new InvoiceLine(
      '1',
      'Web Development Services - 10 hours',
      10,
      80.00,
      0.20 // 20% VAT
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '2',
      'Hosting Services - Monthly subscription',
      1,
      49.99,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '3',
      'Domain Registration - .com',
      1,
      12.00,
      0.20
    )
  );

  // 7. Generate PDF with Modern template
  const result = await generateModernPDF(invoice, {
    language: 'fr',
    showTaxBreakdown: true,
    showPaymentTerms: true,
  });

  // 8. Save PDF
  const outputPath = 'examples/output/01-simple-invoice-modern.pdf';
  fs.mkdirSync('examples/output', { recursive: true });
  fs.writeFileSync(outputPath, result.pdf);

  console.log(`✓ PDF generated successfully!`);
  console.log(`  Template: Modern`);
  console.log(`  Pages: ${result.pageCount}`);
  console.log(`  Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
  console.log(`  Output: ${outputPath}`);
}

main().catch(console.error);
