/**
 * Example 7: Complete Validation with External Tools
 *
 * This example demonstrates how to use the integrated external validation
 * tools (veraPDF and Mustangproject) to validate Factur-X PDFs.
 *
 * Features demonstrated:
 * - Checking availability of external tools
 * - Using external validators separately
 * - Integrated validation pipeline with external tools
 * - Extracting XML from Factur-X PDF
 * - Comprehensive validation reports
 */

import {
  FacturXInvoice,
  FacturxProfile,
  FacturXAddress,
  FacturXParty,
  FacturXLineItem,
} from '@facturx/core';
import {
  generateModernPDF,
  checkExternalValidators,
  ExternalValidator,
  ValidationPipeline,
  VeraPDFValidator,
  MustangprojectValidator,
} from '../src';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// SAMPLE INVOICE DATA
// ============================================================================

const sellerAddress: FacturXAddress = {
  line1: '123 Innovation Boulevard',
  line2: 'Building A, Floor 5',
  postalCode: '75008',
  city: 'Paris',
  country: 'FR',
};

const seller: FacturXParty = {
  name: 'TechCorp Solutions SARL',
  address: sellerAddress,
  vatId: 'FR12345678901',
  email: 'billing@techcorp.fr',
  phone: '+33 1 42 00 00 00',
};

const buyerAddress: FacturXAddress = {
  line1: '456 Commerce Street',
  postalCode: '69002',
  city: 'Lyon',
  country: 'FR',
};

const buyer: FacturXParty = {
  name: 'Client Enterprises SAS',
  address: buyerAddress,
  vatId: 'FR98765432109',
  email: 'ap@client-ent.fr',
  phone: '+33 4 78 00 00 00',
};

const items: FacturXLineItem[] = [
  {
    name: 'Cloud Infrastructure Services',
    quantity: 720,
    unitPrice: 0.5,
    unit: 'HOURS',
    vatRate: 20,
    description: 'Managed cloud infrastructure - January 2024',
  },
  {
    name: 'Premium Support Package',
    quantity: 1,
    unitPrice: 2500,
    unit: 'MONTHLY',
    vatRate: 20,
    description: '24/7 technical support and monitoring',
  },
  {
    name: 'API Integration Development',
    quantity: 40,
    unitPrice: 125,
    unit: 'HOURS',
    vatRate: 20,
    description: 'Custom API integration and development',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format validation results for display
 */
function formatValidationReport(result: any): string {
  const lines: string[] = [];
  lines.push('\n' + '='.repeat(80));
  lines.push('VALIDATION REPORT');
  lines.push('='.repeat(80));
  lines.push('');

  lines.push(`Validated At: ${result.timestamp?.toISOString() || result.validatedAt?.toISOString() || 'N/A'}`);
  lines.push(`Profile: ${result.profile || 'N/A'}`);
  lines.push(`Overall Valid: ${result.isValid || result.isFullyValid ? '✓ YES' : '✗ NO'}`);
  lines.push('');

  if (result.summary) {
    lines.push('-'.repeat(80));
    lines.push('SUMMARY');
    lines.push('-'.repeat(80));
    lines.push(`Total Errors: ${result.summary.totalErrors}`);
    lines.push(`Total Warnings: ${result.summary.totalWarnings}`);

    if (result.summary.complianceLevel) {
      lines.push(`Compliance Level: ${result.summary.complianceLevel}`);
      lines.push(`Overall Score: ${result.summary.overallScore}%`);
    }

    if (result.summary.pdfA3Compliant !== undefined) {
      lines.push(`PDF/A-3 Compliant: ${result.summary.pdfA3Compliant ? '✓ YES' : '✗ NO'}`);
    }

    if (result.summary.facturXCompliant !== undefined) {
      lines.push(`Factur-X Compliant: ${result.summary.facturXCompliant ? '✓ YES' : '✗ NO'}`);
    }
    lines.push('');
  }

  if (result.steps) {
    lines.push('-'.repeat(80));
    lines.push('VALIDATION STEPS');
    lines.push('-'.repeat(80));

    Object.entries(result.steps).forEach(([key, step]: [string, any]) => {
      const status = step.passed ? '✓ PASS' : '✗ FAIL';
      const duration = step.duration ? `${step.duration}ms` : 'N/A';
      lines.push(`[${status}] ${step.name} (${duration})`);
    });
    lines.push('');
  }

  if (result.veraPDF) {
    lines.push('-'.repeat(80));
    lines.push('VERAPDF RESULTS');
    lines.push('-'.repeat(80));
    lines.push(`Valid: ${result.veraPDF.isValid ? '✓ YES' : '✗ NO'}`);
    lines.push(`Compliant: ${result.veraPDF.isCompliant ? '✓ YES' : '✗ NO'}`);
    lines.push(`Profile: ${result.veraPDF.profile}`);
    lines.push(`Errors: ${result.veraPDF.errors.length}`);
    lines.push(`Warnings: ${result.veraPDF.warnings.length}`);

    if (result.veraPDF.metadata) {
      lines.push(`\nMetadata:`);
      lines.push(`  PDF Version: ${result.veraPDF.metadata.pdfVersion}`);
      lines.push(`  File Size: ${result.veraPDF.metadata.fileSize} bytes`);
      lines.push(`  Pages: ${result.veraPDF.metadata.pageCount}`);
      lines.push(`  Has Attachments: ${result.veraPDF.metadata.hasAttachments ? 'Yes' : 'No'}`);
    }

    if (result.veraPDF.errors.length > 0) {
      lines.push(`\nErrors:`);
      result.veraPDF.errors.slice(0, 5).forEach((error: any) => {
        lines.push(`  - ${error.specification} ${error.clause}: ${error.message}`);
      });
      if (result.veraPDF.errors.length > 5) {
        lines.push(`  ... and ${result.veraPDF.errors.length - 5} more`);
      }
    }
    lines.push('');
  }

  if (result.mustangproject) {
    lines.push('-'.repeat(80));
    lines.push('MUSTANGPROJECT RESULTS');
    lines.push('-'.repeat(80));
    lines.push(`Valid: ${result.mustangproject.isValid ? '✓ YES' : '✗ NO'}`);
    lines.push(`Profile: ${result.mustangproject.profile}`);
    lines.push(`Errors: ${result.mustangproject.errors.length}`);
    lines.push(`Warnings: ${result.mustangproject.warnings.length}`);
    lines.push(`XML Extracted: ${result.mustangproject.xmlExtracted ? 'Yes' : 'No'}`);

    if (result.mustangproject.errors.length > 0) {
      lines.push(`\nErrors:`);
      result.mustangproject.errors.slice(0, 5).forEach((error: any) => {
        lines.push(`  - [${error.severity}] ${error.code}: ${error.message}`);
      });
      if (result.mustangproject.errors.length > 5) {
        lines.push(`  ... and ${result.mustangproject.errors.length - 5} more`);
      }
    }
    lines.push('');
  }

  if (result.recommendations && result.recommendations.length > 0) {
    lines.push('-'.repeat(80));
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(80));
    result.recommendations.forEach((rec: string) => {
      lines.push(`• ${rec}`);
    });
    lines.push('');
  }

  lines.push('='.repeat(80));
  return lines.join('\n');
}

// ============================================================================
// MAIN EXAMPLES
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   Example 7: Complete Validation with External Tools                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Create output directory
  const outputDir = path.join(__dirname, 'output');
  await fs.mkdir(outputDir, { recursive: true });

  // ============================================================================
  // Step 1: Check Tool Availability
  // ============================================================================

  console.log('Step 1: Checking availability of external validation tools...');
  console.log('-'.repeat(80));

  const toolsStatus = await checkExternalValidators();

  console.log(`veraPDF:        ${toolsStatus.veraPDF ? '✓ Available' : '✗ Not found'}`);
  if (toolsStatus.veraPDFPath) {
    console.log(`  Path: ${toolsStatus.veraPDFPath}`);
  }

  console.log(`Mustangproject: ${toolsStatus.mustangproject ? '✓ Available' : '✗ Not found'}`);
  if (toolsStatus.mustangprojectPath) {
    console.log(`  Path: ${toolsStatus.mustangprojectPath}`);
  }

  console.log('');

  if (!toolsStatus.veraPDF && !toolsStatus.mustangproject) {
    console.log('⚠ WARNING: No external validation tools found.');
    console.log('');
    console.log('To install external tools:');
    console.log('  1. veraPDF: https://verapdf.org/');
    console.log('  2. Mustangproject: https://www.mustangproject.org/');
    console.log('');
    console.log('You can also run: bash scripts/validate-external.sh');
    console.log('');
  }

  // ============================================================================
  // Step 2: Create Sample Invoice
  // ============================================================================

  console.log('Step 2: Creating sample Factur-X invoice...');
  console.log('-'.repeat(80));

  const invoice = new FacturXInvoice(
    {
      invoiceNumber: 'INV-2024-EXT-001',
      invoiceDate: new Date('2024-01-31'),
      dueDate: new Date('2024-03-01'),
      seller,
      buyer,
      items,
      paymentTerms: 'Payment due within 30 days. Late payments subject to 5% penalty.',
      notes: 'Thank you for your business!',
      currency: 'EUR',
    },
    FacturxProfile.EN16931
  );

  console.log(`✓ Invoice created: ${invoice.invoiceNumber}`);
  console.log(`  Profile: ${invoice.profile}`);
  console.log(`  Total Amount: ${invoice.getTotalAmount()} ${invoice.currency}`);
  console.log('');

  // ============================================================================
  // Step 3: Generate PDF
  // ============================================================================

  console.log('Step 3: Generating Factur-X PDF...');
  console.log('-'.repeat(80));

  const result = await generateModernPDF(invoice, {
    language: 'fr',
    showTaxBreakdown: true,
    showPaymentTerms: true,
  });

  const pdfPath = path.join(outputDir, '07-external-validation.pdf');
  await fs.writeFile(pdfPath, result.pdf);

  console.log(`✓ PDF generated: ${pdfPath}`);
  console.log(`  Pages: ${result.pageCount}`);
  console.log(`  Size: ${result.pdf.length} bytes`);
  console.log('');

  // ============================================================================
  // Step 4: Internal Validation Pipeline
  // ============================================================================

  console.log('Step 4: Running internal validation pipeline...');
  console.log('-'.repeat(80));

  const internalPipeline = new ValidationPipeline();
  const xmlContent = invoice.generateXml(true);
  const internalResult = await internalPipeline.validateAfterGeneration(
    invoice,
    result.pdf,
    xmlContent
  );

  console.log(formatValidationReport(internalResult));

  // ============================================================================
  // Step 5: External Validation - veraPDF Only
  // ============================================================================

  if (toolsStatus.veraPDF) {
    console.log('Step 5a: Running veraPDF validation...');
    console.log('-'.repeat(80));

    const veraPDFValidator = new VeraPDFValidator({
      saveReports: true,
      reportsDir: path.join(outputDir, 'reports'),
    });

    const veraPDFResult = await veraPDFValidator.validate(pdfPath);

    console.log(`✓ veraPDF validation completed`);
    console.log(`  Valid: ${veraPDFResult.isValid ? '✓' : '✗'}`);
    console.log(`  Compliant: ${veraPDFResult.isCompliant ? '✓' : '✗'}`);
    console.log(`  Profile: ${veraPDFResult.profile}`);
    console.log(`  Errors: ${veraPDFResult.errors.length}`);
    console.log(`  Warnings: ${veraPDFResult.warnings.length}`);
    console.log('');
  }

  // ============================================================================
  // Step 6: External Validation - Mustangproject Only
  // ============================================================================

  if (toolsStatus.mustangproject) {
    console.log('Step 5b: Running Mustangproject validation...');
    console.log('-'.repeat(80));

    const mustangValidator = new MustangprojectValidator({
      saveReports: true,
      reportsDir: path.join(outputDir, 'reports'),
    });

    const mustangResult = await mustangValidator.validate(pdfPath);

    console.log(`✓ Mustangproject validation completed`);
    console.log(`  Valid: ${mustangResult.isValid ? '✓' : '✗'}`);
    console.log(`  Profile: ${mustangResult.profile}`);
    console.log(`  Errors: ${mustangResult.errors.length}`);
    console.log(`  Warnings: ${mustangResult.warnings.length}`);
    console.log('');

    // Extract XML
    console.log('Step 5c: Extracting XML from PDF...');
    console.log('-'.repeat(80));

    const extractedXml = await mustangValidator.extractXML(pdfPath);
    const xmlPath = path.join(outputDir, '07-extracted.xml');
    await fs.writeFile(xmlPath, extractedXml);

    console.log(`✓ XML extracted: ${xmlPath}`);
    console.log(`  Size: ${extractedXml.length} bytes`);
    console.log('');
  }

  // ============================================================================
  // Step 7: Combined External Validation
  // ============================================================================

  console.log('Step 6: Running combined external validation...');
  console.log('-'.repeat(80));

  const externalValidator = new ExternalValidator({
    saveReports: true,
    reportsDir: path.join(outputDir, 'reports'),
  });

  const externalResult = await externalValidator.validate(pdfPath);

  console.log(formatValidationReport(externalResult));

  // ============================================================================
  // Step 8: Complete Integrated Validation
  // ============================================================================

  console.log('Step 7: Running complete integrated validation pipeline...');
  console.log('-'.repeat(80));

  const completePipeline = new ValidationPipeline({
    enableProfileValidation: true,
    enableXsdValidation: true,
    enablePdfA3Validation: true,
    enableXmlAttachmentCheck: true,
    enableExternalValidation: true,
    externalValidatorConfig: {
      saveReports: true,
      reportsDir: path.join(outputDir, 'reports'),
    },
  });

  const completeResult = await completePipeline.validateAfterGeneration(
    invoice,
    result.pdf,
    xmlContent
  );

  console.log(formatValidationReport(completeResult));

  // Save complete report
  const reportPath = path.join(outputDir, '07-validation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(completeResult, null, 2));
  console.log(`✓ Complete validation report saved: ${reportPath}`);
  console.log('');

  // ============================================================================
  // Summary
  // ============================================================================

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   VALIDATION COMPLETE                                                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Files generated:');
  console.log(`  • PDF: ${pdfPath}`);
  console.log(`  • Validation Report: ${reportPath}`);

  if (toolsStatus.mustangproject) {
    console.log(`  • Extracted XML: ${path.join(outputDir, '07-extracted.xml')}`);
  }

  if (toolsStatus.veraPDF || toolsStatus.mustangproject) {
    console.log(`  • Tool Reports: ${path.join(outputDir, 'reports')}`);
  }

  console.log('');
  console.log('Summary:');
  console.log(`  Internal Validation: ${internalResult.isValid ? '✓ PASS' : '✗ FAIL'}`);

  if (toolsStatus.veraPDF || toolsStatus.mustangproject) {
    console.log(`  External Validation: ${externalResult.isFullyValid ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Complete Validation: ${completeResult.isValid ? '✓ PASS' : '✗ FAIL'}`);
  }

  console.log('');
}

// Run the example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
