/**
 * Validation Test Script
 *
 * This script tests the validation pipeline on generated PDFs
 */

import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  FacturXInvoice,
  FacturxProfile,
  DocumentHeader,
  TradeParty,
  PostalAddress,
  PaymentDetails,
  InvoiceLine as IInvoiceLine,
} from './lib/factur-x-ts/src';

import {
  generateModernPDF,
  generateFancyPDF,
  generateBrandPDF,
  generateCorporatePDF,
  generateMinimalPDF,
  ValidationPipeline,
  checkExternalValidators,
  ExternalValidator,
} from './lib/smp-factur-x-ts/src';

interface TestResult {
  name: string;
  template: string;
  profile: string;
  pdfGenerated: boolean;
  pdfSize: number;
  validationResult?: any;
  externalResult?: any;
  errors: string[];
}

async function createSimpleInvoice(profile: FacturxProfile): Promise<FacturXInvoice> {
  // Create addresses
  const sellerAddress = new PostalAddress(
    '123 Business Street',
    'Paris',
    '75001',
    'FR'
  );

  const buyerAddress = new PostalAddress(
    '456 Client Avenue',
    'Lyon',
    '69001',
    'FR'
  );

  // Create parties
  const seller = new TradeParty(
    'Test Company SARL',
    sellerAddress,
    'FR12345678901'
  );

  const buyer = new TradeParty(
    'Client Test SAS',
    buyerAddress,
    'FR98765432109'
  );

  // Create header
  const header = new DocumentHeader(
    `TEST-${Date.now()}`,
    new Date('2024-01-15'),
    new Date('2024-02-15'),
    'EUR'
  );

  // Create payment details
  const payment = new PaymentDetails();

  // Create invoice lines
  const lines: IInvoiceLine[] = [
    {
      id: '1',
      name: 'Consulting Service',
      quantity: 10,
      unit: 'HOURS',
      unitPrice: 100,
      netAmount: 1000,
      taxAmount: 200,
      totalAmount: 1200,
      vatRate: 20,
      vatCategory: 'S',
      description: 'Professional consulting services',
    },
    {
      id: '2',
      name: 'Software License',
      quantity: 1,
      unit: 'MONTHLY',
      unitPrice: 500,
      netAmount: 500,
      taxAmount: 100,
      totalAmount: 600,
      vatRate: 20,
      vatCategory: 'S',
      description: 'Annual software license',
    },
  ];

  // Create invoice
  const invoice = new FacturXInvoice(
    profile,
    header,
    seller,
    buyer,
    payment,
    lines
  );

  return invoice;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   FACTUR-X VALIDATION TEST SUITE                                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  const outputDir = path.join(__dirname, 'test-results');
  const pdfsDir = path.join(outputDir, 'pdfs');
  const reportsDir = path.join(outputDir, 'reports');

  await fs.mkdir(pdfsDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });

  console.log(`Output directory: ${outputDir}`);
  console.log('');

  // Check external tools
  console.log('Checking external validation tools...');
  const externalTools = await checkExternalValidators();
  console.log(`  veraPDF:        ${externalTools.veraPDF ? '✓ Available' : '✗ Not available'}`);
  console.log(`  Mustangproject: ${externalTools.mustangproject ? '✓ Available' : '✗ Not available'}`);
  console.log('');

  // Initialize validators
  const internalPipeline = new ValidationPipeline({
    enableProfileValidation: true,
    enableXsdValidation: true,
    enablePdfA3Validation: true,
    enableXmlAttachmentCheck: true,
  });

  const externalValidator = externalTools.veraPDF || externalTools.mustangproject
    ? new ExternalValidator({ saveReports: true, reportsDir })
    : null;

  const results: TestResult[] = [];

  // Test cases
  const testCases = [
    { name: 'modern-basic', template: 'Modern', profile: FacturxProfile.BASICWL, generator: generateModernPDF },
    { name: 'fancy-en16931', template: 'Fancy', profile: FacturxProfile.EN16931, generator: generateFancyPDF },
    { name: 'brand-en16931', template: 'Brand', profile: FacturxProfile.EN16931, generator: generateBrandPDF },
    { name: 'corporate-basic', template: 'Corporate', profile: FacturxProfile.BASICWL, generator: generateCorporatePDF },
    { name: 'minimal-basic', template: 'Minimal', profile: FacturxProfile.BASICWL, generator: generateMinimalPDF },
  ];

  console.log('Running validation tests...');
  console.log('='.repeat(80));
  console.log('');

  for (const testCase of testCases) {
    const result: TestResult = {
      name: testCase.name,
      template: testCase.template,
      profile: testCase.profile,
      pdfGenerated: false,
      pdfSize: 0,
      errors: [],
    };

    console.log(`Test: ${testCase.name}`);
    console.log(`  Template: ${testCase.template}, Profile: ${testCase.profile}`);

    try {
      // Generate PDF
      console.log('  [1/3] Generating PDF...');
      const invoice = await createSimpleInvoice(testCase.profile);
      const pdfResult = await testCase.generator(invoice, { language: 'fr' });

      const pdfPath = path.join(pdfsDir, `${testCase.name}.pdf`);
      await fs.writeFile(pdfPath, pdfResult.pdf);

      result.pdfGenerated = true;
      result.pdfSize = pdfResult.pdf.length;
      console.log(`      ✓ PDF generated (${pdfResult.pdf.length} bytes)`);

      // Internal validation
      console.log('  [2/3] Internal validation...');
      try {
        const xmlContent = invoice.generateXml(true);
        const validationResult = await internalPipeline.validateAfterGeneration(
          invoice,
          pdfResult.pdf,
          xmlContent
        );

        result.validationResult = {
          isValid: validationResult.isValid,
          score: validationResult.summary.overallScore,
          compliance: validationResult.summary.complianceLevel,
          errors: validationResult.summary.totalErrors,
          warnings: validationResult.summary.totalWarnings,
        };

        console.log(`      ✓ Valid: ${validationResult.isValid}, Score: ${validationResult.summary.overallScore}%`);
        console.log(`      - Compliance: ${validationResult.summary.complianceLevel}`);
        console.log(`      - Errors: ${validationResult.summary.totalErrors}, Warnings: ${validationResult.summary.totalWarnings}`);
      } catch (error: any) {
        result.errors.push(`Internal validation failed: ${error.message}`);
        console.log(`      ✗ Internal validation error: ${error.message}`);
      }

      // External validation
      if (externalValidator) {
        console.log('  [3/3] External validation...');
        try {
          const externalResult = await externalValidator.validate(pdfPath);
          result.externalResult = {
            pdfA3: externalResult.summary.pdfA3Compliant,
            facturX: externalResult.summary.facturXCompliant,
            errors: externalResult.summary.totalErrors,
            warnings: externalResult.summary.totalWarnings,
          };
          console.log(`      ✓ PDF/A-3: ${externalResult.summary.pdfA3Compliant}, Factur-X: ${externalResult.summary.facturXCompliant}`);
        } catch (error: any) {
          result.errors.push(`External validation failed: ${error.message}`);
          console.log(`      ⚠ External validation: ${error.message}`);
        }
      } else {
        console.log('  [3/3] External validation skipped (tools not available)');
      }

    } catch (error: any) {
      result.errors.push(`Test failed: ${error.message}`);
      console.log(`  ✗ Error: ${error.message}`);
    }

    results.push(result);
    console.log('');
  }

  // Generate report
  console.log('='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  const reportLines: string[] = [];
  reportLines.push('# Factur-X Validation Test Results');
  reportLines.push('');
  reportLines.push(`**Test Date:** ${new Date().toISOString()}`);
  reportLines.push(`**External Tools:** veraPDF: ${externalTools.veraPDF ? '✓' : '✗'}, Mustangproject: ${externalTools.mustangproject ? '✓' : '✗'}`);
  reportLines.push('');
  reportLines.push('## Summary Table');
  reportLines.push('');
  reportLines.push('| Test | Template | Profile | PDF | Valid | Score | Errors | Warnings | External |');
  reportLines.push('|------|----------|---------|-----|-------|-------|--------|----------|----------|');

  for (const result of results) {
    const pdfStatus = result.pdfGenerated ? '✓' : '✗';
    const validStatus = result.validationResult?.isValid ? '✓' : (result.validationResult ? '⚠' : '✗');
    const score = result.validationResult?.score || 0;
    const errors = result.validationResult?.errors || 0;
    const warnings = result.validationResult?.warnings || 0;
    const external = result.externalResult ? (result.externalResult.pdfA3 && result.externalResult.facturX ? '✓' : '⚠') : 'N/A';

    reportLines.push(
      `| ${result.name} | ${result.template} | ${result.profile} | ${pdfStatus} | ${validStatus} | ${score}% | ${errors} | ${warnings} | ${external} |`
    );
  }

  reportLines.push('');
  reportLines.push('## Detailed Results');
  reportLines.push('');

  for (const result of results) {
    reportLines.push(`### ${result.name}`);
    reportLines.push('');
    reportLines.push(`- **Template:** ${result.template}`);
    reportLines.push(`- **Profile:** ${result.profile}`);
    reportLines.push(`- **PDF Generated:** ${result.pdfGenerated ? 'Yes' : 'No'} (${result.pdfSize} bytes)`);

    if (result.validationResult) {
      reportLines.push(`- **Internal Validation:**`);
      reportLines.push(`  - Valid: ${result.validationResult.isValid ? 'Yes ✓' : 'No ✗'}`);
      reportLines.push(`  - Score: ${result.validationResult.score}%`);
      reportLines.push(`  - Compliance: ${result.validationResult.compliance}`);
      reportLines.push(`  - Errors: ${result.validationResult.errors}`);
      reportLines.push(`  - Warnings: ${result.validationResult.warnings}`);
    }

    if (result.externalResult) {
      reportLines.push(`- **External Validation:**`);
      reportLines.push(`  - PDF/A-3: ${result.externalResult.pdfA3 ? 'Yes ✓' : 'No ✗'}`);
      reportLines.push(`  - Factur-X: ${result.externalResult.facturX ? 'Yes ✓' : 'No ✗'}`);
      reportLines.push(`  - Errors: ${result.externalResult.errors}`);
      reportLines.push(`  - Warnings: ${result.externalResult.warnings}`);
    }

    if (result.errors.length > 0) {
      reportLines.push(`- **Errors:**`);
      result.errors.forEach(err => reportLines.push(`  - ${err}`));
    }

    reportLines.push('');
  }

  // Statistics
  const totalTests = results.length;
  const pdfGenerated = results.filter(r => r.pdfGenerated).length;
  const internalValid = results.filter(r => r.validationResult?.isValid).length;
  const avgScore = results.reduce((sum, r) => sum + (r.validationResult?.score || 0), 0) / totalTests;

  reportLines.push('## Statistics');
  reportLines.push('');
  reportLines.push(`- **Total Tests:** ${totalTests}`);
  reportLines.push(`- **PDFs Generated:** ${pdfGenerated}/${totalTests}`);
  reportLines.push(`- **Internal Validation Pass:** ${internalValid}/${totalTests}`);
  reportLines.push(`- **Average Score:** ${avgScore.toFixed(1)}%`);

  const reportPath = path.join(outputDir, 'VALIDATION_REPORT.md');
  await fs.writeFile(reportPath, reportLines.join('\n'));

  const jsonPath = path.join(outputDir, 'validation-results.json');
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));

  console.log(`✓ Report saved: ${reportPath}`);
  console.log(`✓ JSON results: ${jsonPath}`);
  console.log('');

  console.log('STATISTICS:');
  console.log(`  Total Tests:       ${totalTests}`);
  console.log(`  PDFs Generated:    ${pdfGenerated}/${totalTests}`);
  console.log(`  Validation Pass:   ${internalValid}/${totalTests}`);
  console.log(`  Average Score:     ${avgScore.toFixed(1)}%`);
  console.log('');

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   TESTS COMPLETE - See VALIDATION_REPORT.md for details                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
