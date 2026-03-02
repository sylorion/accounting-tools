/**
 * Comprehensive Test Script for All Examples
 *
 * This script:
 * 1. Generates PDFs from all examples
 * 2. Runs internal validation on each PDF
 * 3. Attempts external validation if tools are available
 * 4. Generates a comprehensive validation report
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { FacturXInvoice, FacturxProfile } from '@facturx/core';
import {
  generateModernPDF,
  generateFancyPDF,
  generateBrandPDF,
  generateCorporatePDF,
  generateMinimalPDF,
  ValidationPipeline,
  checkExternalValidators,
  ExternalValidator,
  ValidationPipelineResult,
  ExternalValidationResult,
} from './src/index';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

interface TestCase {
  name: string;
  description: string;
  template: string;
  profile: FacturxProfile;
  generator: (invoice: FacturXInvoice) => Promise<any>;
}

const TEST_CASES: TestCase[] = [
  {
    name: '01-simple-modern',
    description: 'Simple invoice with Modern template',
    template: 'Modern',
    profile: FacturxProfile.BASICWL,
    generator: async (invoice) => generateModernPDF(invoice, { language: 'fr' }),
  },
  {
    name: '02-fancy-creative',
    description: 'Creative invoice with Fancy template',
    template: 'Fancy',
    profile: FacturxProfile.EN16931,
    generator: async (invoice) => generateFancyPDF(invoice, { language: 'fr', showTaxBreakdown: true }),
  },
  {
    name: '03-corporate-professional',
    description: 'Corporate invoice with Corporate template',
    template: 'Corporate',
    profile: FacturxProfile.EN16931,
    generator: async (invoice) => generateCorporatePDF(invoice, { language: 'en', showPaymentTerms: true }),
  },
  {
    name: '04-minimal-clean',
    description: 'Minimal invoice with Minimal template',
    template: 'Minimal',
    profile: FacturxProfile.BASICWL,
    generator: async (invoice) => generateMinimalPDF(invoice, { language: 'fr' }),
  },
  {
    name: '05-complex-invoice',
    description: 'Complex invoice with multiple items',
    template: 'Modern',
    profile: FacturxProfile.EN16931,
    generator: async (invoice) => generateModernPDF(invoice, {
      language: 'fr',
      showTaxBreakdown: true,
      showPaymentTerms: true,
    }),
  },
];

// ============================================================================
// SAMPLE INVOICES
// ============================================================================

function createSimpleInvoice(profile: FacturxProfile): FacturXInvoice {
  return new FacturXInvoice(
    {
      invoiceNumber: `TEST-${Date.now()}-SIMPLE`,
      invoiceDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      seller: {
        name: 'Test Company SARL',
        address: {
          line1: '123 Test Street',
          postalCode: '75001',
          city: 'Paris',
          country: 'FR',
        },
        vatId: 'FR12345678901',
        email: 'contact@testcompany.fr',
      },
      buyer: {
        name: 'Client Test SAS',
        address: {
          line1: '456 Client Avenue',
          postalCode: '69001',
          city: 'Lyon',
          country: 'FR',
        },
        vatId: 'FR98765432109',
        email: 'client@test.fr',
      },
      items: [
        {
          name: 'Consulting Service',
          quantity: 10,
          unitPrice: 100,
          vatRate: 20,
          description: 'Professional consulting services',
        },
      ],
      paymentTerms: 'Payment within 30 days',
      currency: 'EUR',
    },
    profile
  );
}

function createComplexInvoice(profile: FacturxProfile): FacturXInvoice {
  return new FacturXInvoice(
    {
      invoiceNumber: `TEST-${Date.now()}-COMPLEX`,
      invoiceDate: new Date('2024-01-31'),
      dueDate: new Date('2024-03-01'),
      seller: {
        name: 'TechCorp Solutions SARL',
        address: {
          line1: '123 Innovation Boulevard',
          line2: 'Building A, Floor 5',
          postalCode: '75008',
          city: 'Paris',
          country: 'FR',
        },
        vatId: 'FR12345678901',
        email: 'billing@techcorp.fr',
        phone: '+33 1 42 00 00 00',
      },
      buyer: {
        name: 'Client Enterprises SAS',
        address: {
          line1: '456 Commerce Street',
          postalCode: '69002',
          city: 'Lyon',
          country: 'FR',
        },
        vatId: 'FR98765432109',
        email: 'ap@client-ent.fr',
        phone: '+33 4 78 00 00 00',
      },
      items: [
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
      ],
      paymentTerms: 'Payment due within 30 days. Late payments subject to 5% penalty.',
      notes: 'Thank you for your business!',
      currency: 'EUR',
    },
    profile
  );
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

interface TestResult {
  testCase: string;
  template: string;
  profile: string;
  pdfGenerated: boolean;
  pdfSize: number;
  pdfPath: string;
  internalValidation: {
    success: boolean;
    isValid: boolean;
    stepsCompleted: number;
    stepsPassed: number;
    overallScore: number;
    complianceLevel: string;
    totalErrors: number;
    totalWarnings: number;
    recommendations: string[];
    error?: string;
  };
  externalValidation?: {
    success: boolean;
    veraPDFAvailable: boolean;
    mustangAvailable: boolean;
    pdfA3Compliant?: boolean;
    facturXCompliant?: boolean;
    totalErrors: number;
    totalWarnings: number;
    error?: string;
  };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE FACTUR-X VALIDATION TEST SUITE                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Create output directory
  const outputDir = path.join(__dirname, 'test-results');
  const pdfsDir = path.join(outputDir, 'pdfs');
  const reportsDir = path.join(outputDir, 'reports');

  await fs.mkdir(pdfsDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });

  console.log(`Output directory: ${outputDir}`);
  console.log('');

  // Check external validators availability
  console.log('Checking external validation tools...');
  console.log('-'.repeat(80));

  const externalTools = await checkExternalValidators();
  console.log(`veraPDF:        ${externalTools.veraPDF ? '✓ Available' : '✗ Not available'}`);
  console.log(`Mustangproject: ${externalTools.mustangproject ? '✓ Available' : '✗ Not available'}`);
  console.log('');

  if (!externalTools.veraPDF && !externalTools.mustangproject) {
    console.log('⚠ WARNING: No external validation tools found.');
    console.log('  Internal validation will be performed only.');
    console.log('  To install external tools, see: VALIDATION_TOOLS.md');
    console.log('');
  }

  // Initialize validators
  const internalPipeline = new ValidationPipeline({
    enableProfileValidation: true,
    enableXsdValidation: true,
    enablePdfA3Validation: true,
    enableXmlAttachmentCheck: true,
  });

  const externalValidator = new ExternalValidator({
    saveReports: true,
    reportsDir,
  });

  const results: TestResult[] = [];

  // Run tests
  console.log('Running validation tests...');
  console.log('='.repeat(80));
  console.log('');

  for (const testCase of TEST_CASES) {
    console.log(`Test: ${testCase.name}`);
    console.log(`  Description: ${testCase.description}`);
    console.log(`  Template: ${testCase.template}`);
    console.log(`  Profile: ${testCase.profile}`);

    const result: TestResult = {
      testCase: testCase.name,
      template: testCase.template,
      profile: testCase.profile,
      pdfGenerated: false,
      pdfSize: 0,
      pdfPath: '',
      internalValidation: {
        success: false,
        isValid: false,
        stepsCompleted: 0,
        stepsPassed: 0,
        overallScore: 0,
        complianceLevel: 'FAILED',
        totalErrors: 0,
        totalWarnings: 0,
        recommendations: [],
      },
    };

    try {
      // Step 1: Generate PDF
      console.log('  [1/3] Generating PDF...');
      const invoice = testCase.name.includes('complex')
        ? createComplexInvoice(testCase.profile)
        : createSimpleInvoice(testCase.profile);

      const pdfResult = await testCase.generator(invoice);
      const pdfPath = path.join(pdfsDir, `${testCase.name}.pdf`);
      await fs.writeFile(pdfPath, pdfResult.pdf);

      result.pdfGenerated = true;
      result.pdfSize = pdfResult.pdf.length;
      result.pdfPath = pdfPath;

      console.log(`      ✓ PDF generated (${pdfResult.pdf.length} bytes)`);

      // Step 2: Internal validation
      console.log('  [2/3] Running internal validation...');
      try {
        const xmlContent = invoice.generateXml(true);
        const validationResult = await internalPipeline.validateAfterGeneration(
          invoice,
          pdfResult.pdf,
          xmlContent
        );

        result.internalValidation = {
          success: true,
          isValid: validationResult.isValid,
          stepsCompleted: validationResult.summary.stepsCompleted,
          stepsPassed: validationResult.summary.stepsPassed,
          overallScore: validationResult.summary.overallScore,
          complianceLevel: validationResult.summary.complianceLevel,
          totalErrors: validationResult.summary.totalErrors,
          totalWarnings: validationResult.summary.totalWarnings,
          recommendations: validationResult.recommendations.slice(),
        };

        console.log(`      ✓ Validation: ${validationResult.isValid ? 'VALID' : 'INVALID'}`);
        console.log(`      - Score: ${validationResult.summary.overallScore}%`);
        console.log(`      - Compliance: ${validationResult.summary.complianceLevel}`);
        console.log(`      - Errors: ${validationResult.summary.totalErrors}`);
        console.log(`      - Warnings: ${validationResult.summary.totalWarnings}`);
      } catch (error: any) {
        result.internalValidation.success = false;
        result.internalValidation.error = error.message;
        console.log(`      ✗ Internal validation failed: ${error.message}`);
      }

      // Step 3: External validation
      if (externalTools.veraPDF || externalTools.mustangproject) {
        console.log('  [3/3] Running external validation...');
        try {
          const externalResult = await externalValidator.validate(pdfPath);

          result.externalValidation = {
            success: true,
            veraPDFAvailable: externalTools.veraPDF,
            mustangAvailable: externalTools.mustangproject,
            pdfA3Compliant: externalResult.summary.pdfA3Compliant,
            facturXCompliant: externalResult.summary.facturXCompliant,
            totalErrors: externalResult.summary.totalErrors,
            totalWarnings: externalResult.summary.totalWarnings,
          };

          console.log(`      ✓ External validation completed`);
          console.log(`      - PDF/A-3: ${externalResult.summary.pdfA3Compliant ? 'COMPLIANT' : 'NOT COMPLIANT'}`);
          console.log(`      - Factur-X: ${externalResult.summary.facturXCompliant ? 'COMPLIANT' : 'NOT COMPLIANT'}`);
          console.log(`      - Errors: ${externalResult.summary.totalErrors}`);
          console.log(`      - Warnings: ${externalResult.summary.totalWarnings}`);
        } catch (error: any) {
          result.externalValidation = {
            success: false,
            veraPDFAvailable: externalTools.veraPDF,
            mustangAvailable: externalTools.mustangproject,
            totalErrors: 0,
            totalWarnings: 0,
            error: error.message,
          };
          console.log(`      ⚠ External validation skipped: ${error.message}`);
        }
      } else {
        console.log('  [3/3] External validation skipped (tools not available)');
      }

    } catch (error: any) {
      console.log(`  ✗ Test failed: ${error.message}`);
      result.internalValidation.error = error.message;
    }

    results.push(result);
    console.log('');
  }

  // Generate report
  console.log('='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  // Generate markdown table
  const reportLines: string[] = [];
  reportLines.push('# Factur-X Validation Test Results');
  reportLines.push('');
  reportLines.push(`**Test Date:** ${new Date().toISOString()}`);
  reportLines.push(`**External Tools:** veraPDF: ${externalTools.veraPDF ? '✓' : '✗'}, Mustangproject: ${externalTools.mustangproject ? '✓' : '✗'}`);
  reportLines.push('');
  reportLines.push('## Summary Table');
  reportLines.push('');
  reportLines.push('| Test Case | Template | Profile | PDF | Internal Valid | Score | Errors | Warnings | External Valid |');
  reportLines.push('|-----------|----------|---------|-----|----------------|-------|--------|----------|----------------|');

  for (const result of results) {
    const pdfStatus = result.pdfGenerated ? '✓' : '✗';
    const internalStatus = result.internalValidation.success
      ? (result.internalValidation.isValid ? '✓' : '⚠')
      : '✗';
    const externalStatus = result.externalValidation
      ? (result.externalValidation.success ? '✓' : '⚠')
      : 'N/A';

    reportLines.push(
      `| ${result.testCase} | ${result.template} | ${result.profile} | ${pdfStatus} | ` +
      `${internalStatus} | ${result.internalValidation.overallScore}% | ` +
      `${result.internalValidation.totalErrors} | ${result.internalValidation.totalWarnings} | ` +
      `${externalStatus} |`
    );
  }

  reportLines.push('');
  reportLines.push('## Detailed Results');
  reportLines.push('');

  for (const result of results) {
    reportLines.push(`### ${result.testCase}`);
    reportLines.push('');
    reportLines.push(`**Template:** ${result.template}`);
    reportLines.push(`**Profile:** ${result.profile}`);
    reportLines.push(`**PDF Generated:** ${result.pdfGenerated ? 'Yes' : 'No'}`);
    if (result.pdfGenerated) {
      reportLines.push(`**PDF Size:** ${result.pdfSize} bytes`);
      reportLines.push(`**PDF Path:** \`${result.pdfPath}\``);
    }
    reportLines.push('');

    reportLines.push('#### Internal Validation');
    reportLines.push('');
    if (result.internalValidation.success) {
      reportLines.push(`- **Valid:** ${result.internalValidation.isValid ? 'Yes ✓' : 'No ✗'}`);
      reportLines.push(`- **Score:** ${result.internalValidation.overallScore}%`);
      reportLines.push(`- **Compliance Level:** ${result.internalValidation.complianceLevel}`);
      reportLines.push(`- **Steps:** ${result.internalValidation.stepsPassed}/${result.internalValidation.stepsCompleted}`);
      reportLines.push(`- **Errors:** ${result.internalValidation.totalErrors}`);
      reportLines.push(`- **Warnings:** ${result.internalValidation.totalWarnings}`);

      if (result.internalValidation.recommendations.length > 0) {
        reportLines.push('');
        reportLines.push('**Recommendations:**');
        result.internalValidation.recommendations.forEach(rec => {
          reportLines.push(`- ${rec}`);
        });
      }
    } else {
      reportLines.push(`- **Error:** ${result.internalValidation.error}`);
    }
    reportLines.push('');

    if (result.externalValidation) {
      reportLines.push('#### External Validation');
      reportLines.push('');
      if (result.externalValidation.success) {
        reportLines.push(`- **PDF/A-3 Compliant:** ${result.externalValidation.pdfA3Compliant ? 'Yes ✓' : 'No ✗'}`);
        reportLines.push(`- **Factur-X Compliant:** ${result.externalValidation.facturXCompliant ? 'Yes ✓' : 'No ✗'}`);
        reportLines.push(`- **Errors:** ${result.externalValidation.totalErrors}`);
        reportLines.push(`- **Warnings:** ${result.externalValidation.totalWarnings}`);
      } else {
        reportLines.push(`- **Status:** Skipped or failed`);
        if (result.externalValidation.error) {
          reportLines.push(`- **Error:** ${result.externalValidation.error}`);
        }
      }
      reportLines.push('');
    }

    reportLines.push('---');
    reportLines.push('');
  }

  // Statistics
  const totalTests = results.length;
  const pdfGenerated = results.filter(r => r.pdfGenerated).length;
  const internalValid = results.filter(r => r.internalValidation.isValid).length;
  const avgScore = results.reduce((sum, r) => sum + r.internalValidation.overallScore, 0) / totalTests;

  reportLines.push('## Statistics');
  reportLines.push('');
  reportLines.push(`- **Total Tests:** ${totalTests}`);
  reportLines.push(`- **PDFs Generated:** ${pdfGenerated}/${totalTests} (${Math.round(pdfGenerated/totalTests*100)}%)`);
  reportLines.push(`- **Internal Validation Pass:** ${internalValid}/${totalTests} (${Math.round(internalValid/totalTests*100)}%)`);
  reportLines.push(`- **Average Score:** ${avgScore.toFixed(1)}%`);
  reportLines.push('');

  // Save report
  const reportPath = path.join(outputDir, 'VALIDATION_REPORT.md');
  await fs.writeFile(reportPath, reportLines.join('\n'));

  // Save JSON
  const jsonPath = path.join(outputDir, 'validation-results.json');
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));

  console.log(`✓ Report saved: ${reportPath}`);
  console.log(`✓ JSON results: ${jsonPath}`);
  console.log('');

  // Print summary
  console.log('OVERALL STATISTICS:');
  console.log(`  Total Tests:     ${totalTests}`);
  console.log(`  PDFs Generated:  ${pdfGenerated}/${totalTests} (${Math.round(pdfGenerated/totalTests*100)}%)`);
  console.log(`  Valid (Internal): ${internalValid}/${totalTests} (${Math.round(internalValid/totalTests*100)}%)`);
  console.log(`  Average Score:   ${avgScore.toFixed(1)}%`);
  console.log('');

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUITE COMPLETE                                                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
