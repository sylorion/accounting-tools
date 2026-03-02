/**
 * Tests for External Validators (veraPDF and Mustangproject)
 */

import {
  checkExternalValidators,
  findVeraPDF,
  findMustangproject,
  VeraPDFValidator,
  MustangprojectValidator,
  ExternalValidator,
} from '../../validation/ExternalValidators';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('External Validators', () => {
  describe('Tool Detection', () => {
    test('checkExternalValidators should return availability status', async () => {
      const status = await checkExternalValidators();

      expect(status).toHaveProperty('veraPDF');
      expect(status).toHaveProperty('mustangproject');
      expect(typeof status.veraPDF).toBe('boolean');
      expect(typeof status.mustangproject).toBe('boolean');
    });

    test('findVeraPDF should return path or null', async () => {
      const result = await findVeraPDF();
      expect(result === null || typeof result === 'string').toBe(true);
    });

    test('findMustangproject should return path or null', async () => {
      const result = await findMustangproject();
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('VeraPDFValidator', () => {
    let validator: VeraPDFValidator;

    beforeEach(() => {
      validator = new VeraPDFValidator();
    });

    test('should create instance with default config', () => {
      expect(validator).toBeInstanceOf(VeraPDFValidator);
    });

    test('isAvailable should return boolean', async () => {
      const available = await validator.isAvailable();
      expect(typeof available).toBe('boolean');
    });

    test('should accept custom config', () => {
      const customValidator = new VeraPDFValidator({
        veraPDFPath: '/custom/path/verapdf',
        timeout: 30000,
        saveReports: true,
        reportsDir: '/tmp/reports',
      });

      expect(customValidator).toBeInstanceOf(VeraPDFValidator);
    });
  });

  describe('MustangprojectValidator', () => {
    let validator: MustangprojectValidator;

    beforeEach(() => {
      validator = new MustangprojectValidator();
    });

    test('should create instance with default config', () => {
      expect(validator).toBeInstanceOf(MustangprojectValidator);
    });

    test('isAvailable should return boolean', async () => {
      const available = await validator.isAvailable();
      expect(typeof available).toBe('boolean');
    });

    test('should accept custom config', () => {
      const customValidator = new MustangprojectValidator({
        mustangprojectPath: '/custom/path/Mustang-CLI.jar',
        timeout: 30000,
      });

      expect(customValidator).toBeInstanceOf(MustangprojectValidator);
    });
  });

  describe('ExternalValidator', () => {
    let validator: ExternalValidator;

    beforeEach(() => {
      validator = new ExternalValidator();
    });

    test('should create instance', () => {
      expect(validator).toBeInstanceOf(ExternalValidator);
    });

    test('getAvailableValidators should return availability status', async () => {
      const available = await validator.getAvailableValidators();

      expect(available).toHaveProperty('veraPDF');
      expect(available).toHaveProperty('mustangproject');
      expect(typeof available.veraPDF).toBe('boolean');
      expect(typeof available.mustangproject).toBe('boolean');
    });

    test('should handle custom config', () => {
      const customValidator = new ExternalValidator({
        veraPDFPath: '/custom/verapdf',
        mustangprojectPath: '/custom/mustang.jar',
        timeout: 45000,
        saveReports: true,
        reportsDir: '/tmp/custom-reports',
      });

      expect(customValidator).toBeInstanceOf(ExternalValidator);
    });
  });

  describe('Integration Tests', () => {
    // These tests require actual tools to be installed
    // They will be skipped if tools are not available

    let testPdfPath: string;
    let validator: ExternalValidator;

    beforeAll(async () => {
      validator = new ExternalValidator();

      // Create a simple test PDF (not a real Factur-X PDF)
      // In a real test, you'd use a proper Factur-X sample
      testPdfPath = join(tmpdir(), `test-pdf-${Date.now()}.pdf`);
      const minimalPdf = Buffer.from(
        '%PDF-1.4\n' +
        '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
        '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
        '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n' +
        'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n' +
        '0000000052 00000 n\n0000000101 00000 n\n' +
        'trailer<</Size 4/Root 1 0 R>>\nstartxref\n169\n%%EOF'
      );
      await writeFile(testPdfPath, minimalPdf);
    });

    afterAll(async () => {
      // Clean up test PDF
      try {
        await unlink(testPdfPath);
      } catch {
        // Ignore
      }
    });

    test('validate should handle missing tools gracefully', async () => {
      const result = await validator.validate(testPdfPath);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('isFullyValid');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalErrors');
      expect(result.summary).toHaveProperty('totalWarnings');
      expect(result.summary).toHaveProperty('pdfA3Compliant');
      expect(result.summary).toHaveProperty('facturXCompliant');
      expect(result.summary).toHaveProperty('recommendations');
      expect(Array.isArray(result.summary.recommendations)).toBe(true);
    });

    test('extractXML should return null if tool not available', async () => {
      const available = await validator.getAvailableValidators();

      if (!available.mustangproject) {
        const xml = await validator.extractXML(testPdfPath);
        expect(xml).toBeNull();
      }
    });
  });

  describe('Error Handling', () => {
    test('VeraPDFValidator should handle invalid PDF path', async () => {
      const validator = new VeraPDFValidator();
      const available = await validator.isAvailable();

      if (available) {
        await expect(
          validator.validate('/nonexistent/file.pdf')
        ).rejects.toThrow();
      }
    });

    test('MustangprojectValidator should handle invalid PDF path', async () => {
      const validator = new MustangprojectValidator();
      const available = await validator.isAvailable();

      if (available) {
        await expect(
          validator.validate('/nonexistent/file.pdf')
        ).rejects.toThrow();
      }
    });

    test('MustangprojectValidator.extractXML should handle invalid path', async () => {
      const validator = new MustangprojectValidator();
      const available = await validator.isAvailable();

      if (available) {
        await expect(
          validator.extractXML('/nonexistent/file.pdf')
        ).rejects.toThrow();
      }
    });
  });
});
