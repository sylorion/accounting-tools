/**
 * Integration tests for complete validation pipeline with external tools
 */

import { FacturXInvoice, FacturxProfile } from '@facturx/core';
import { ModernTemplate } from '../../templates/ModernTemplate';
import {
  ValidationPipeline,
  ValidationPipelineResult,
} from '../../validation/ValidationPipeline';
import {
  ExternalValidator,
  checkExternalValidators,
} from '../../validation/ExternalValidators';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Validation Integration Tests', () => {
  let testInvoice: FacturXInvoice;
  let testPdfPath: string;
  let testPdfBytes: Buffer;

  beforeAll(async () => {
    // Create a complete test invoice
    testInvoice = new FacturXInvoice(
      {
        invoiceNumber: 'TEST-2024-001',
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
          {
            name: 'Software License',
            quantity: 5,
            unitPrice: 200,
            vatRate: 20,
            description: 'Annual software license',
          },
        ],
        paymentTerms: 'Payment within 30 days',
        currency: 'EUR',
      },
      FacturxProfile.EN16931
    );

    // Generate PDF
    const template = new ModernTemplate();
    const result = await template.generate(testInvoice);
    testPdfBytes = result.pdf;

    // Save to temp file for external validation
    testPdfPath = join(tmpdir(), `facturx-test-${Date.now()}.pdf`);
    await writeFile(testPdfPath, testPdfBytes);
  });

  afterAll(async () => {
    // Clean up
    try {
      await unlink(testPdfPath);
    } catch {
      // Ignore
    }
  });

  describe('Internal Validation Pipeline', () => {
    test('should validate invoice before generation', async () => {
      const pipeline = new ValidationPipeline();
      const result = await pipeline.validateBeforeGeneration(testInvoice);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('validatedAt');
      expect(result).toHaveProperty('profile');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');

      // Check steps
      expect(result.steps).toHaveProperty('profile');
      expect(result.steps).toHaveProperty('xsd');

      // Summary should have correct structure
      expect(result.summary).toHaveProperty('totalErrors');
      expect(result.summary).toHaveProperty('totalWarnings');
      expect(result.summary).toHaveProperty('stepsCompleted');
      expect(result.summary).toHaveProperty('stepsPassed');
      expect(result.summary).toHaveProperty('overallScore');
      expect(result.summary).toHaveProperty('complianceLevel');
    });

    test('should validate invoice after generation', async () => {
      const pipeline = new ValidationPipeline();
      const xmlContent = testInvoice.generateXml(true);
      const result = await pipeline.validateAfterGeneration(
        testInvoice,
        testPdfBytes,
        xmlContent
      );

      expect(result.isValid).toBeDefined();
      expect(result.steps).toHaveProperty('profile');
      expect(result.steps).toHaveProperty('xsd');
      expect(result.steps).toHaveProperty('pdfA3');
      expect(result.steps).toHaveProperty('xmlAttachment');
    });

    test('quick validation should be fast', async () => {
      const pipeline = new ValidationPipeline();
      const startTime = Date.now();
      const isValid = await pipeline.validateQuick(testInvoice);
      const duration = Date.now() - startTime;

      expect(typeof isValid).toBe('boolean');
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe('External Validation', () => {
    let externalValidator: ExternalValidator;
    let toolsAvailable: any;

    beforeAll(async () => {
      externalValidator = new ExternalValidator();
      toolsAvailable = await checkExternalValidators();
    });

    test('should detect available external tools', async () => {
      expect(toolsAvailable).toHaveProperty('veraPDF');
      expect(toolsAvailable).toHaveProperty('mustangproject');
    });

    test('should validate with external tools if available', async () => {
      const result = await externalValidator.validate(testPdfPath);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('isFullyValid');
      expect(result).toHaveProperty('summary');

      // Check summary structure
      expect(result.summary).toHaveProperty('totalErrors');
      expect(result.summary).toHaveProperty('totalWarnings');
      expect(result.summary).toHaveProperty('pdfA3Compliant');
      expect(result.summary).toHaveProperty('facturXCompliant');
      expect(result.summary).toHaveProperty('recommendations');

      // If veraPDF is available, check its results
      if (toolsAvailable.veraPDF && result.veraPDF) {
        expect(result.veraPDF).toHaveProperty('isValid');
        expect(result.veraPDF).toHaveProperty('isCompliant');
        expect(result.veraPDF).toHaveProperty('profile');
        expect(result.veraPDF).toHaveProperty('errors');
        expect(result.veraPDF).toHaveProperty('warnings');
        expect(result.veraPDF).toHaveProperty('metadata');
      }

      // If Mustangproject is available, check its results
      if (toolsAvailable.mustangproject && result.mustangproject) {
        expect(result.mustangproject).toHaveProperty('isValid');
        expect(result.mustangproject).toHaveProperty('profile');
        expect(result.mustangproject).toHaveProperty('errors');
        expect(result.mustangproject).toHaveProperty('warnings');
      }
    });

    test('should extract XML if Mustangproject available', async () => {
      if (!toolsAvailable.mustangproject) {
        console.log('Skipping: Mustangproject not available');
        return;
      }

      const xmlContent = await externalValidator.extractXML(testPdfPath);

      if (xmlContent) {
        expect(typeof xmlContent).toBe('string');
        expect(xmlContent).toContain('<?xml');
        expect(xmlContent.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Complete Validation Pipeline with External Tools', () => {
    test('should run complete validation including external tools', async () => {
      const pipeline = new ValidationPipeline({
        enableProfileValidation: true,
        enableXsdValidation: true,
        enablePdfA3Validation: true,
        enableXmlAttachmentCheck: true,
        enableExternalValidation: true,
      });

      const xmlContent = testInvoice.generateXml(true);
      const result = await pipeline.validateAfterGeneration(
        testInvoice,
        testPdfBytes,
        xmlContent
      );

      expect(result.isValid).toBeDefined();
      expect(result.steps).toHaveProperty('profile');
      expect(result.steps).toHaveProperty('xsd');
      expect(result.steps).toHaveProperty('pdfA3');
      expect(result.steps).toHaveProperty('xmlAttachment');

      // If external validation is enabled, check external step
      const toolsAvailable = await checkExternalValidators();
      if (toolsAvailable.veraPDF || toolsAvailable.mustangproject) {
        expect(result.steps).toHaveProperty('external');

        if (result.steps.external) {
          expect(result.steps.external).toHaveProperty('name');
          expect(result.steps.external).toHaveProperty('passed');
          expect(result.steps.external).toHaveProperty('duration');
          expect(result.steps.external).toHaveProperty('result');

          const externalResult = result.steps.external.result;
          expect(externalResult).toHaveProperty('isFullyValid');
          expect(externalResult).toHaveProperty('summary');
        }
      }
    });

    test('should provide comprehensive recommendations', async () => {
      const pipeline = new ValidationPipeline({
        enableExternalValidation: true,
      });

      const xmlContent = testInvoice.generateXml(true);
      const result = await pipeline.validateAfterGeneration(
        testInvoice,
        testPdfBytes,
        xmlContent
      );

      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('should measure performance of validation steps', async () => {
      const pipeline = new ValidationPipeline({
        enableExternalValidation: true,
      });

      const xmlContent = testInvoice.generateXml(true);
      const result = await pipeline.validateAfterGeneration(
        testInvoice,
        testPdfBytes,
        xmlContent
      );

      // Check that all steps have duration metrics
      Object.values(result.steps).forEach((step: any) => {
        expect(step).toHaveProperty('duration');
        expect(typeof step.duration).toBe('number');
        expect(step.duration).toBeGreaterThanOrEqual(0);
      });

      // External validation should be slower than internal checks
      if (result.steps.external) {
        expect(result.steps.external.duration).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle validation without external tools gracefully', async () => {
      const pipeline = new ValidationPipeline({
        enableExternalValidation: true,
        externalValidatorConfig: {
          veraPDFPath: '/nonexistent/verapdf',
          mustangprojectPath: '/nonexistent/mustang.jar',
        },
      });

      const xmlContent = testInvoice.generateXml(true);

      // Should not throw, but might not have external validation results
      const result = await pipeline.validateAfterGeneration(
        testInvoice,
        testPdfBytes,
        xmlContent
      );

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    test('should handle disabled validation steps', async () => {
      const pipeline = new ValidationPipeline({
        enableProfileValidation: false,
        enableXsdValidation: false,
        enablePdfA3Validation: true,
        enableXmlAttachmentCheck: true,
        enableExternalValidation: false,
      });

      const xmlContent = testInvoice.generateXml(true);
      const result = await pipeline.validateAfterGeneration(
        testInvoice,
        testPdfBytes,
        xmlContent
      );

      expect(result.steps).not.toHaveProperty('profile');
      expect(result.steps).not.toHaveProperty('xsd');
      expect(result.steps).toHaveProperty('pdfA3');
      expect(result.steps).toHaveProperty('xmlAttachment');
      expect(result.steps).not.toHaveProperty('external');
    });
  });

  describe('Real-world Scenarios', () => {
    test('should validate multiple profiles', async () => {
      const profiles = [
        FacturxProfile.MINIMUM,
        FacturxProfile.BASICWL,
        FacturxProfile.EN16931,
      ];

      for (const profile of profiles) {
        const invoice = new FacturXInvoice(
          {
            ...testInvoice.toJSON(),
            profile,
          },
          profile
        );

        const pipeline = new ValidationPipeline();
        const result = await pipeline.validateBeforeGeneration(invoice);

        expect(result).toBeDefined();
        expect(result.profile).toBe(profile);
      }
    });

    test('should detect invalid invoices', async () => {
      // Create an invoice with missing required fields
      const invalidInvoice = new FacturXInvoice(
        {
          invoiceNumber: '', // Invalid: empty
          invoiceDate: new Date(),
          seller: {
            name: 'Test',
            address: {
              line1: '',
              postalCode: '',
              city: '',
              country: 'FR',
            },
          },
          buyer: {
            name: 'Test',
            address: {
              line1: '',
              postalCode: '',
              city: '',
              country: 'FR',
            },
          },
          items: [], // Invalid: no items
          currency: 'EUR',
        },
        FacturxProfile.MINIMUM
      );

      const pipeline = new ValidationPipeline();
      const result = await pipeline.validateBeforeGeneration(invalidInvoice);

      // Should detect validation issues
      expect(result.summary.totalErrors).toBeGreaterThan(0);
      expect(result.summary.complianceLevel).not.toBe('FULL');
    });
  });
});
