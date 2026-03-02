/**
 * Example 6: Complete Factur-X validation pipeline
 *
 * This example demonstrates the comprehensive validation pipeline
 * that runs automatically when generating Factur-X PDFs.
 *
 * Validation Steps:
 * 1. Profile validation (before PDF generation)
 * 2. XSD validation (XML schema compliance)
 * 3. PDF/A-3 compliance check
 * 4. XML attachment verification
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
import {
  ValidationPipeline,
  validateBeforeGeneration,
  validateAfterGeneration,
  validateQuick,
} from '../src/validation/ValidationPipeline';

/**
 * Create a sample invoice
 */
function createSampleInvoice(): FacturXInvoice {
  // Seller
  const sellerAddress = new PostalAddress(
    '123 Business Street',
    'Paris',
    '75001',
    'FR'
  );
  const seller = new TradeParty('Tech Solutions SARL', sellerAddress, 'FR12345678901');

  // Buyer
  const buyerAddress = new PostalAddress(
    '456 Client Avenue',
    'Lyon',
    '69001',
    'FR'
  );
  const buyer = new TradeParty('Client Corp', buyerAddress, 'FR98765432100');

  // Header
  const header = new DocumentHeader(
    'VAL-2025-001',
    'VAL-2025-001',
    'Validation Test Invoice',
    new Date(2025, 0, 15),
    new Date(2025, 0, 15)
  );

  // Payment
  const payment = new PaymentDetails(
    58,
    'FR7630004000031234567890143',
    'BNPAFRPPXXX',
    new Date(2025, 1, 15),
    'Payment due within 30 days'
  );

  // Invoice
  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931, // Using EN16931 for full validation
    header,
    seller,
    buyer,
    payment
  );

  // Add lines
  invoice.addLine(new InvoiceLine('1', 'Consulting Services', 40, 120.00, 0.20));
  invoice.addLine(new InvoiceLine('2', 'Development Work', 80, 95.00, 0.20));
  invoice.addLine(new InvoiceLine('3', 'Project Management', 20, 150.00, 0.20));

  return invoice;
}

/**
 * Print validation report
 */
function printValidationReport(result: any): void {
  console.log('\n' + '='.repeat(70));
  console.log('FACTUR-X VALIDATION REPORT');
  console.log('='.repeat(70));

  // Summary
  console.log('\nOVERALL SUMMARY:');
  console.log(`  Status: ${result.isValid ? '✓ VALID' : '✗ INVALID'}`);
  console.log(`  Compliance: ${result.summary.complianceLevel}`);
  console.log(`  Score: ${result.summary.overallScore}/100`);
  console.log(`  Errors: ${result.summary.totalErrors}`);
  console.log(`  Warnings: ${result.summary.totalWarnings}`);
  console.log(`  Steps: ${result.summary.stepsPassed}/${result.summary.stepsCompleted} passed`);

  // Profile validation
  console.log('\n' + '-'.repeat(70));
  console.log('1. PROFILE VALIDATION (EN16931):');
  if (result.steps.profile) {
    const step = result.steps.profile;
    console.log(`  Status: ${step.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`  Duration: ${step.duration}ms`);
    console.log(`  Rules checked: ${step.result.checkedRules}`);

    if (step.result.errors.length > 0) {
      console.log(`  Errors:`);
      step.result.errors.forEach((err: any) => {
        console.log(`    - ${err.field}: ${err.message}`);
      });
    }

    if (step.result.warnings.length > 0) {
      console.log(`  Warnings:`);
      step.result.warnings.forEach((warn: string) => {
        console.log(`    - ${warn}`);
      });
    }
  }

  // XSD validation
  console.log('\n' + '-'.repeat(70));
  console.log('2. XSD VALIDATION:');
  if (result.steps.xsd) {
    const step = result.steps.xsd;
    console.log(`  Status: ${step.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`  Duration: ${step.duration}ms`);
    console.log(`  Profile: ${step.result.profile}`);
    console.log(`  Cached: ${step.result.cached ? 'Yes' : 'No'}`);

    if (step.result.errors.length > 0) {
      console.log(`  Errors:`);
      step.result.errors.slice(0, 5).forEach((err: any) => {
        console.log(`    - Line ${err.line}: ${err.message}`);
      });
      if (step.result.errors.length > 5) {
        console.log(`    ... and ${step.result.errors.length - 5} more`);
      }
    }
  }

  // PDF/A-3 validation
  console.log('\n' + '-'.repeat(70));
  console.log('3. PDF/A-3 COMPLIANCE:');
  if (result.steps.pdfA3) {
    const step = result.steps.pdfA3;
    console.log(`  Status: ${step.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`  Duration: ${step.duration}ms`);
    console.log(`  Checks:`);
    console.log(`    - Metadata: ${step.result.checks.hasMetadata ? '✓' : '✗'}`);
    console.log(`    - XMP Metadata: ${step.result.checks.hasXmpMetadata ? '✓' : '✗'}`);
    console.log(`    - Embedded File: ${step.result.checks.hasEmbeddedFile ? '✓' : '✗'}`);
    console.log(`    - PDF Version: ${step.result.checks.pdfVersion}`);
    if (step.result.checks.conformanceLevel) {
      console.log(`    - Conformance: ${step.result.checks.conformanceLevel}`);
    }

    if (step.result.errors.length > 0) {
      console.log(`  Errors:`);
      step.result.errors.forEach((err: any) => {
        console.log(`    - [${err.code}] ${err.message}`);
      });
    }
  }

  // XML attachment
  console.log('\n' + '-'.repeat(70));
  console.log('4. XML ATTACHMENT:');
  if (result.steps.xmlAttachment) {
    const step = result.steps.xmlAttachment;
    console.log(`  Status: ${step.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`  Duration: ${step.duration}ms`);
    console.log(`  Attached: ${step.result.isAttached ? '✓ Yes' : '✗ No'}`);
    if (step.result.filename) {
      console.log(`  Filename: ${step.result.filename}`);
      console.log(`  MIME Type: ${step.result.mimeType}`);
      console.log(`  Size: ${step.result.size} bytes`);
    }
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log('RECOMMENDATIONS:');
    result.recommendations.forEach((rec: string) => {
      console.log(`  • ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Main example function
 */
async function main() {
  console.log('Factur-X Validation Pipeline Example\n');

  const invoice = createSampleInvoice();

  // =========================================================================
  // Example 1: Quick validation (before generation)
  // =========================================================================
  console.log('1. Quick Validation (profile check only):');
  const isQuickValid = await validateQuick(invoice);
  console.log(`   Result: ${isQuickValid ? '✓ Valid' : '✗ Invalid'}\n`);

  // =========================================================================
  // Example 2: Full pre-generation validation
  // =========================================================================
  console.log('2. Full Pre-Generation Validation:');
  const preValidation = await validateBeforeGeneration(invoice);
  printValidationReport(preValidation);

  // =========================================================================
  // Example 3: Generate PDF with automatic validation
  // =========================================================================
  console.log('3. Generating PDF with automatic validation...\n');

  const result = await generateModernPDF(invoice, {
    language: 'fr',
    showTaxBreakdown: true,
    showPaymentTerms: true,
    // Validation is ENABLED by default
    validateBeforeGeneration: true,
    validateAfterGeneration: true,
    strictValidation: false, // Set to true to throw on validation errors
  });

  console.log(`✓ PDF generated successfully!`);
  console.log(`  Pages: ${result.pageCount}`);
  console.log(`  Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
  console.log(`  Template: ${result.templateType}`);

  // Print validation results (included in result)
  if (result.validation) {
    printValidationReport(result.validation);
  }

  // =========================================================================
  // Example 4: Manual post-generation validation
  // =========================================================================
  console.log('4. Manual Post-Generation Validation:');
  const xmlContent = invoice.generateXml(true);
  const postValidation = await validateAfterGeneration(invoice, result.pdf, xmlContent);
  printValidationReport(postValidation);

  // =========================================================================
  // Example 5: Using ValidationPipeline directly (advanced)
  // =========================================================================
  console.log('5. Using ValidationPipeline directly (advanced):');
  const pipeline = new ValidationPipeline({
    enableProfileValidation: true,
    enableXsdValidation: true,
    enablePdfA3Validation: true,
    enableXmlAttachmentCheck: true,
    strictMode: false,
  });

  const customValidation = await pipeline.validateAfterGeneration(
    invoice,
    result.pdf,
    xmlContent
  );
  console.log(`   Compliance: ${customValidation.summary.complianceLevel}`);
  console.log(`   Score: ${customValidation.summary.overallScore}/100\n`);

  // =========================================================================
  // Example 6: Strict mode (throws on validation errors)
  // =========================================================================
  console.log('6. Strict Mode Example:');
  try {
    // This will throw if validation fails
    await generateModernPDF(invoice, {
      language: 'fr',
      strictValidation: true, // STRICT MODE ON
    });
    console.log('   ✓ Strict validation passed!\n');
  } catch (error) {
    console.log(`   ✗ Strict validation failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }

  // =========================================================================
  // Save output
  // =========================================================================
  const outputPath = 'examples/output/06-validated-invoice.pdf';
  fs.mkdirSync('examples/output', { recursive: true });
  fs.writeFileSync(outputPath, result.pdf);

  console.log(`✓ Validated PDF saved to: ${outputPath}`);

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('VALIDATION PIPELINE SUMMARY');
  console.log('='.repeat(70));
  console.log('\nAutomatic Validation Features:');
  console.log('  • Profile validation (MINIMUM, BASIC, EN16931, EXTENDED)');
  console.log('  • XSD schema validation with caching');
  console.log('  • PDF/A-3 compliance check');
  console.log('  • XML attachment verification');
  console.log('  • Comprehensive error reporting');
  console.log('  • Performance-optimized with caching');
  console.log('\nValidation Modes:');
  console.log('  • Quick validation (profile only)');
  console.log('  • Pre-generation validation');
  console.log('  • Post-generation validation (full)');
  console.log('  • Automatic (enabled by default)');
  console.log('  • Strict mode (throws on errors)');
  console.log('\nUsage:');
  console.log('  // Automatic (default)');
  console.log('  await generateModernPDF(invoice, { language: "fr" });');
  console.log('');
  console.log('  // Strict mode');
  console.log('  await generateModernPDF(invoice, { strictValidation: true });');
  console.log('');
  console.log('  // Disable validation');
  console.log('  await generateModernPDF(invoice, {');
  console.log('    validateBeforeGeneration: false,');
  console.log('    validateAfterGeneration: false');
  console.log('  });');
  console.log('\n' + '='.repeat(70) + '\n');
}

main().catch(console.error);
