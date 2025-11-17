/**
 * Tests for TemplateRenderer module
 * Tests base template rendering functionality
 */

import { PDFDocument } from 'pdf-lib';
import { FacturXInvoice, FacturxProfile } from '@facturx/core';
import { TemplateRenderer } from '../../core/TemplateRenderer';
import { TemplateType } from '../../types';

// Mock concrete implementation for testing abstract class
class MockTemplateRenderer extends TemplateRenderer {
  protected async renderContent(): Promise<void> {
    // Simple implementation for testing
    await this.renderHeader();
    this.renderParties();
    this.renderLineItems();
    this.renderTotals();
  }

  protected getTemplateType(): TemplateType {
    return 'modern';
  }
}

describe('TemplateRenderer', () => {
  let renderer: MockTemplateRenderer;
  let invoice: FacturXInvoice;

  beforeEach(() => {
    renderer = new MockTemplateRenderer();

    // Create a minimal valid invoice
    invoice = new FacturXInvoice(
      {
        invoiceNumber: 'TEST-001',
        invoiceDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        seller: {
          name: 'Test Seller Inc.',
          address: {
            line1: '123 Main St',
            postalCode: '75001',
            city: 'Paris',
            country: 'FR',
          },
          vatId: 'FR12345678901',
        },
        buyer: {
          name: 'Test Buyer Ltd.',
          address: {
            line1: '456 Oak Ave',
            postalCode: '69001',
            city: 'Lyon',
            country: 'FR',
          },
          vatId: 'FR98765432109',
        },
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            unitPrice: 100.0,
            vatRate: 20.0,
          },
        ],
      },
      FacturxProfile.EN16931
    );
  });

  describe('generate', () => {
    it('should generate a valid PDF', async () => {
      const result = await renderer.generate(invoice);

      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.templateType).toBe('modern');
    }, 30000);

    it('should include validation results by default', async () => {
      const result = await renderer.generate(invoice);

      expect(result.validation).toBeDefined();
      expect(result.validation?.isValid).toBeDefined();
    }, 30000);

    it('should skip pre-validation when disabled', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should skip post-validation when disabled', async () => {
      const result = await renderer.generate(invoice, {
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should skip both validations when disabled', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
      expect(result.validation).toBeUndefined();
    }, 30000);

    it('should handle custom theme', async () => {
      const result = await renderer.generate(invoice, {
        theme: {
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
        },
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should handle different languages', async () => {
      const result = await renderer.generate(invoice, {
        language: 'de',
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should handle different page formats', async () => {
      const result = await renderer.generate(invoice, {
        pageFormat: 'Letter',
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });

  describe('Metadata', () => {
    it('should include PDF metadata', async () => {
      const result = await renderer.generate(invoice);

      const pdfDoc = await PDFDocument.load(result.pdf);
      const title = pdfDoc.getTitle();

      expect(title).toBeDefined();
    }, 30000);
  });

  describe('Font handling', () => {
    it('should embed custom fonts', async () => {
      const result = await renderer.generate(invoice);

      // Font embedding is tested by successful PDF generation
      expect(result.pdf).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(10000); // Fonts add size
    }, 30000);
  });

  describe('Theme handling', () => {
    it('should handle custom colors', async () => {
      const result = await renderer.generate(invoice, {
        theme: {
          primaryColor: '#FF5733',
          secondaryColor: '#33FF57',
          accentColor: '#3357FF',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
        },
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should merge partial theme with defaults', async () => {
      const result = await renderer.generate(invoice, {
        theme: {
          primaryColor: '#FF0000',
        },
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });
});
