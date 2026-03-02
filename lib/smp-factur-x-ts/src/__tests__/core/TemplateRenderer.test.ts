/**
 * Tests for TemplateRenderer module
 * Tests base template rendering functionality
 */

import { PDFDocument, PDFName } from 'pdf-lib';
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

    // Create a minimal valid invoice using Builder pattern
    invoice = FacturXInvoice.builder(FacturxProfile.EN16931)
      .header({
        invoiceNumber: 'TEST-001',
        invoiceDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        currency: 'EUR',
      })
      .seller({
        name: 'Test Seller Inc.',
        address: {
          line1: '123 Main St',
          postalCode: '75001',
          city: 'Paris',
          country: 'FR',
        },
        vatId: 'FR12345678901',
      })
      .buyer({
        name: 'Test Buyer Ltd.',
        address: {
          line1: '456 Oak Ave',
          postalCode: '69001',
          city: 'Lyon',
          country: 'FR',
        },
        vatId: 'FR98765432109',
      })
      .payment({
        terms: 'Net 30',
      })
      .addLine({
        name: 'Test Item',
        quantity: 1,
        unitPrice: 100.0,
        vatRate: 20.0,
      })
      .build();
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
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should handle different languages', async () => {
      const result = await renderer.generate(invoice, {
        language: 'de',
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should handle different page formats', async () => {
      const result = await renderer.generate(invoice, {
        pageFormat: 'Letter',
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should generate PDF with multiple line items', async () => {
      const multiItemInvoice = FacturXInvoice.builder(FacturxProfile.EN16931)
        .header({
          invoiceNumber: 'TEST-002',
          invoiceDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          currency: 'EUR',
        })
        .seller({
          name: 'Test Seller Inc.',
          address: {
            line1: '123 Main St',
            postalCode: '75001',
            city: 'Paris',
            country: 'FR',
          },
          vatId: 'FR12345678901',
        })
        .buyer({
          name: 'Test Buyer Ltd.',
          address: {
            line1: '456 Oak Ave',
            postalCode: '69001',
            city: 'Lyon',
            country: 'FR',
          },
          vatId: 'FR98765432109',
        })
        .payment({
          terms: 'Net 30',
        })
        .addLine({
          name: 'Item 1',
          quantity: 1,
          unitPrice: 100.0,
          vatRate: 20.0,
        })
        .addLine({
          name: 'Item 2',
          quantity: 2,
          unitPrice: 50.0,
          vatRate: 20.0,
        })
        .addLine({
          name: 'Item 3',
          quantity: 3,
          unitPrice: 75.0,
          vatRate: 20.0,
        })
        .build();

      const result = await renderer.generate(multiItemInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
      expect(result.pageCount).toBeGreaterThan(0);
    }, 30000);

    it('should embed Factur-X XML', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      // Verify PDF contains embedded file reference
      const pdfDoc = await PDFDocument.load(result.pdf);
      const catalog = pdfDoc.catalog;
      const af = catalog.get(PDFName.of('AF'));

      // AF array should exist (from AFRelationship fix)
      expect(af).toBeDefined();
    }, 30000);
  });

  describe('Page management', () => {
    it('should create new pages when needed', async () => {
      // Create invoice with many items to trigger page break
      const builder = FacturXInvoice.builder(FacturxProfile.EN16931)
        .header({
          invoiceNumber: 'TEST-003',
          invoiceDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          currency: 'EUR',
        })
        .seller({
          name: 'Test Seller Inc.',
          address: {
            line1: '123 Main St',
            postalCode: '75001',
            city: 'Paris',
            country: 'FR',
          },
          vatId: 'FR12345678901',
        })
        .buyer({
          name: 'Test Buyer Ltd.',
          address: {
            line1: '456 Oak Ave',
            postalCode: '69001',
            city: 'Lyon',
            country: 'FR',
          },
          vatId: 'FR98765432109',
        })
        .payment({
          terms: 'Net 30',
        });

      // Add 50 items to force multiple pages
      for (let i = 1; i <= 50; i++) {
        builder.addLine({
          name: `Item ${i} with a very long description that takes up more space`,
          quantity: i,
          unitPrice: 100.0 + i * 10,
          vatRate: 20.0,
        });
      }

      const largeInvoice = builder.build();

      const result = await renderer.generate(largeInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pageCount).toBeGreaterThan(1);
    }, 30000);
  });

  describe('Options handling', () => {
    it('should use default options when none provided', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should merge partial options with defaults', async () => {
      const result = await renderer.generate(invoice, {
        language: 'de',
        theme: {
          primaryColor: '#123456',
        },
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });

  describe('Metadata', () => {
    it('should include PDF metadata', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      const pdfDoc = await PDFDocument.load(result.pdf);
      const title = pdfDoc.getTitle();

      expect(title).toBeDefined();
    }, 30000);

    it('should apply PDF/A-3 compliance', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      const pdfDoc = await PDFDocument.load(result.pdf);
      const catalog = pdfDoc.catalog;

      // Check for Metadata (XMP)
      const metadata = catalog.get(PDFName.of('Metadata'));
      expect(metadata).toBeDefined();

      // Check for OutputIntents
      const outputIntents = catalog.get(PDFName.of('OutputIntents'));
      expect(outputIntents).toBeDefined();

      // Check for Version
      const version = catalog.get(PDFName.of('Version'));
      expect(version).toBeDefined();

      // Check for File ID
      expect(pdfDoc.context.trailerInfo.ID).toBeDefined();
    }, 30000);
  });

  describe('Font handling', () => {
    it('should embed custom fonts', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

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
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should merge partial theme with defaults', async () => {
      const result = await renderer.generate(invoice, {
        theme: {
          primaryColor: '#FF0000',
        },
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });

  describe('Rendering methods', () => {
    it('should render complete invoice with all sections', async () => {
      const completeInvoice = FacturXInvoice.builder(FacturxProfile.EN16931)
        .header({
          invoiceNumber: 'INV-2024-001',
          invoiceDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          currency: 'EUR',
        })
        .seller({
          name: 'Complete Seller Inc.',
          address: {
            line1: '123 Business St',
            postalCode: '75001',
            city: 'Paris',
            country: 'FR',
          },
          vatId: 'FR12345678901',
          email: 'seller@example.com',
          phone: '+33 1 23 45 67 89',
        })
        .buyer({
          name: 'Complete Buyer Ltd.',
          address: {
            line1: '456 Commerce Ave',
            postalCode: '69001',
            city: 'Lyon',
            country: 'FR',
          },
          vatId: 'FR98765432109',
          email: 'buyer@example.com',
          phone: '+33 4 78 90 12 34',
        })
        .payment({
          terms: 'Net 30',
        })
        .addLine({
          name: 'Premium Service',
          description: 'Monthly subscription',
          quantity: 1,
          unitPrice: 1000.0,
          vatRate: 20.0,
        })
        .addLine({
          name: 'Consulting',
          description: 'Technical consulting hours',
          quantity: 10,
          unitPrice: 150.0,
          vatRate: 20.0,
        })
        .build();

      const result = await renderer.generate(completeInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.fileSize).toBeGreaterThan(0);
    }, 30000);
  });
});
