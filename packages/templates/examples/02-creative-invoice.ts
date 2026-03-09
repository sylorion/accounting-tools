/**
 * Example 2: Creative invoice with Fancy template
 *
 * This example demonstrates how to create a visually appealing invoice
 * using the Fancy template (pink and blue gradient design).
 * Perfect for creative agencies and design studios.
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
import { generateFancyPDF } from '../src';

async function main() {
  // 1. Create seller (Creative Agency)
  const sellerAddress = new PostalAddress(
    '42 Creative Boulevard',
    'Paris',
    '75015',
    'FR',
    'Building C'
  );

  const seller = new TradeParty(
    'Creative Studio Paris',
    sellerAddress,
    'FR11223344556'
  );

  // 2. Create buyer
  const buyerAddress = new PostalAddress(
    '789 Fashion Street',
    'Nice',
    '06000',
    'FR',
    'Floor 3'
  );

  const buyer = new TradeParty(
    'Fashion Brand Ltd',
    buyerAddress,
    'FR99887766554'
  );

  // 3. Create document header
  const header = new DocumentHeader(
    'CREATIVE-2025-042',
    'CREATIVE-2025-042',
    'Creative Services Invoice',
    new Date(2025, 0, 20),
    new Date(2025, 0, 20)
  );

  // 4. Create payment details
  const payment = new PaymentDetails(
    58,
    'FR7612345678901234567890189',
    'CRLYFRPP',
    new Date(2025, 1, 19),
    'Net 30 - Payment due upon receipt'
  );

  // 5. Create invoice
  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    seller,
    buyer,
    payment
  );

  // 6. Add creative services
  invoice.addLine(
    new InvoiceLine(
      '1',
      'Brand Identity Design - Complete package with logo variations',
      1,
      1500.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '2',
      'Website Design - Homepage + 5 internal pages',
      1,
      2800.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '3',
      'Social Media Graphics Pack - 20 custom designs',
      1,
      450.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '4',
      'Photography Session - Half day studio shoot',
      1,
      600.00,
      0.20
    )
  );

  invoice.addLine(
    new InvoiceLine(
      '5',
      'Image Retouching - 30 professional photos',
      1,
      350.00,
      0.20
    )
  );

  // 7. Add early payment discount
  invoice.addDocAllowanceCharge(
    new AllowanceCharge(
      false, // allowance (discount)
      280.00,
      'Early payment discount - 5%',
      'EARLY_PAY',
      0.20
    )
  );

  // 8. Generate PDF with Fancy template
  const result = await generateFancyPDF(invoice, {
    language: 'en',
    showTaxBreakdown: true,
    showPaymentTerms: true,
    customFooter: 'Creative Studio Paris - Where Ideas Come to Life',
  });

  // 9. Save PDF
  const outputPath = 'examples/output/02-creative-invoice-fancy.pdf';
  fs.mkdirSync('examples/output', { recursive: true });
  fs.writeFileSync(outputPath, result.pdf);

  console.log(`✓ Creative invoice generated!`);
  console.log(`  Template: Fancy (Pink & Blue)`);
  console.log(`  Pages: ${result.pageCount}`);
  console.log(`  Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
  console.log(`  Output: ${outputPath}`);
}

main().catch(console.error);
