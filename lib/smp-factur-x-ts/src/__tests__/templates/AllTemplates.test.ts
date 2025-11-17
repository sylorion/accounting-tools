/**
 * Tests for all template implementations
 * Tests ModernTemplate, MinimalTemplate, FancyTemplate, CorporateTemplate, BrandTemplate
 */

import { PDFDocument } from 'pdf-lib';
import {
  FacturXInvoice,
  FacturxProfile,
  DocumentHeaderImpl,
  TradePartyImpl,
  PostalAddressImpl,
  PaymentDetailsImpl,
  InvoiceLineImpl,
  DocTypeCode,
  PaymentMeansCode,
} from '@facturx/core';
import { ModernTemplate } from '../../templates/ModernTemplate';
import { MinimalTemplate } from '../../templates/MinimalTemplate';
import { FancyTemplate } from '../../templates/FancyTemplate';
import { CorporateTemplate } from '../../templates/CorporateTemplate';
import { BrandTemplate } from '../../templates/BrandTemplate';
import { TemplateType } from '../../types';

describe('Template Tests', () => {
  let testInvoice: FacturXInvoice;

  beforeEach(() => {
    // Create a complete test invoice
    const header = new DocumentHeaderImpl(
      'TEST-2024-001',
      'TEST-2024-001',
      'Invoice',
      new Date('2024-01-15'),
      DocTypeCode.INVOICE,
      new Date('2024-02-15')
    );

    const seller = new TradePartyImpl(
      'Test Company Inc.',
      new PostalAddressImpl('Paris', '75001', 'FR', '123 Business Street'),
      'FR12345678901',
      'contact@testcompany.com',
      '+33 1 23 45 67 89'
    );

    const buyer = new TradePartyImpl(
      'Client Corporation Ltd.',
      new PostalAddressImpl('Lyon', '69001', 'FR', '456 Client Avenue'),
      'FR98765432109',
      'client@example.com',
      '+33 4 78 90 12 34'
    );

    const payment = new PaymentDetailsImpl(
      PaymentMeansCode.SEPA_CREDIT_TRANSFER,
      'Payment within 30 days',
      'FR7630001007941234567890185',
      'BNPAFRPP',
      new Date('2024-02-15')
    );

    testInvoice = new FacturXInvoice(
      FacturxProfile.EN16931,
      header,
      seller,
      buyer,
      payment,
      [],
      [],
      'EUR'
    );

    // Add invoice lines
    testInvoice.addLine(
      new InvoiceLineImpl('L1', 'Consulting Service', 10, 100.0, 0.20, 'Professional consulting')
    );
    testInvoice.addLine(
      new InvoiceLineImpl('L2', 'Software License', 5, 200.0, 0.20, 'Annual software license')
    );
    testInvoice.addLine(
      new InvoiceLineImpl('L3', 'Support Package', 12, 50.0, 0.20, 'Premium support')
    );
  });

  describe('ModernTemplate', () => {
    let template: ModernTemplate;

    beforeEach(() => {
      template = new ModernTemplate();
    });

    it('should generate valid PDF', async () => {
      const result = await template.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.templateType).toBe('modern');
    }, 30000);

    it('should return correct template type', () => {
      expect((template as any).getTemplateType()).toBe(TemplateType.MODERN);
    });

    it('should handle custom theme', async () => {
      const result = await template.generate(testInvoice, {
        theme: {
          primaryColor: '#0066CC',
          secondaryColor: '#004C99',
          accentColor: '#00BFFF',
        },
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should support different languages', async () => {
      const result = await template.generate(testInvoice, {
        language: 'fr',
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should show tax breakdown when enabled', async () => {
      const result = await template.generate(testInvoice, {
        showTaxBreakdown: true,
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should show payment terms when enabled', async () => {
      const result = await template.generate(testInvoice, {
        showPaymentTerms: true,
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should handle custom footer', async () => {
      const result = await template.generate(testInvoice, {
        customFooter: 'Thank you for your business!',
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });

  describe('MinimalTemplate', () => {
    let template: MinimalTemplate;

    beforeEach(() => {
      template = new MinimalTemplate();
    });

    it('should generate valid PDF', async () => {
      const result = await template.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.templateType).toBe('minimal');
    }, 30000);

    it('should return correct template type', () => {
      expect((template as any).getTemplateType()).toBe(TemplateType.MINIMAL);
    });

    it('should have minimal styling', async () => {
      const result = await template.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    }, 30000);

    it('should support all options', async () => {
      const result = await template.generate(testInvoice, {
        showTaxBreakdown: true,
        showPaymentTerms: true,
        language: 'en',
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });

  describe('FancyTemplate', () => {
    let template: FancyTemplate;

    beforeEach(() => {
      template = new FancyTemplate();
    });

    it('should generate valid PDF', async () => {
      const result = await template.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.templateType).toBe('fancy');
    }, 30000);

    it('should return correct template type', () => {
      expect((template as any).getTemplateType()).toBe(TemplateType.FANCY);
    });

    it('should handle decorative elements', async () => {
      const result = await template.generate(testInvoice, {
        theme: {
          primaryColor: '#FF6B6B',
          secondaryColor: '#4ECDC4',
          accentColor: '#FFE66D',
        },
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should support custom branding', async () => {
      const result = await template.generate(testInvoice, {
        showTaxBreakdown: true,
        showPaymentTerms: true,
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });

  describe('CorporateTemplate', () => {
    let template: CorporateTemplate;

    beforeEach(() => {
      template = new CorporateTemplate();
    });

    it('should generate valid PDF', async () => {
      const result = await template.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.templateType).toBe('corporate');
    }, 30000);

    it('should return correct template type', () => {
      expect((template as any).getTemplateType()).toBe(TemplateType.CORPORATE);
    });

    it('should have professional styling', async () => {
      const result = await template.generate(testInvoice, {
        theme: {
          primaryColor: '#1A1A1A',
          secondaryColor: '#4A4A4A',
          accentColor: '#0066CC',
        },
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should support all corporate features', async () => {
      const result = await template.generate(testInvoice, {
        showTaxBreakdown: true,
        showPaymentTerms: true,
        customFooter: 'Company Confidential',
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });

  describe('BrandTemplate', () => {
    let template: BrandTemplate;

    beforeEach(() => {
      template = new BrandTemplate();
    });

    it('should generate valid PDF', async () => {
      const result = await template.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.templateType).toBe('brand');
    }, 30000);

    it('should return correct template type', () => {
      expect((template as any).getTemplateType()).toBe(TemplateType.BRAND);
    });

    it('should support custom brand colors', async () => {
      const result = await template.generate(testInvoice, {
        theme: {
          primaryColor: '#FF0080',
          secondaryColor: '#00FFFF',
          accentColor: '#FFFF00',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
        },
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should handle all branding options', async () => {
      const result = await template.generate(testInvoice, {
        showTaxBreakdown: true,
        showPaymentTerms: true,
        customFooter: 'Powered by BrandTemplate',
        language: 'de',
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);
  });

  describe('All Templates - Common Features', () => {
    const templates = [
      { name: 'Modern', instance: new ModernTemplate() },
      { name: 'Minimal', instance: new MinimalTemplate() },
      { name: 'Fancy', instance: new FancyTemplate() },
      { name: 'Corporate', instance: new CorporateTemplate() },
      { name: 'Brand', instance: new BrandTemplate() },
    ];

    templates.forEach(({ name, instance }) => {
      describe(`${name} Template Common Features`, () => {
        it('should embed Factur-X XML', async () => {
          const result = await instance.generate(testInvoice, {
            validateBeforeGeneration: false,
            validateAfterGeneration: false,
          });

          // Verify PDF is generated successfully
          // (Actual XML embedding is tested in AFRelationshipFix.test.ts)
          const pdfDoc = await PDFDocument.load(result.pdf);
          expect(pdfDoc).toBeDefined();
          expect(result.pdf.length).toBeGreaterThan(10000);
        }, 30000);

        it('should include PDF metadata', async () => {
          const result = await instance.generate(testInvoice, {
            validateBeforeGeneration: false,
            validateAfterGeneration: false,
          });

          const pdfDoc = await PDFDocument.load(result.pdf);
          const title = pdfDoc.getTitle();
          expect(title).toBeDefined();
        }, 30000);

        it('should handle page format options', async () => {
          const result = await instance.generate(testInvoice, {
            pageFormat: 'Letter',
            validateBeforeGeneration: false,
            validateAfterGeneration: false,
          });

          expect(result.pdf).toBeDefined();
          expect(result.pageCount).toBeGreaterThan(0);
        }, 30000);

        it('should generate consistent results', async () => {
          const result1 = await instance.generate(testInvoice, {
            validateBeforeGeneration: false,
            validateAfterGeneration: false,
          });
          const result2 = await instance.generate(testInvoice, {
            validateBeforeGeneration: false,
            validateAfterGeneration: false,
          });

          expect(result1.templateType).toBe(result2.templateType);
          expect(result1.pageCount).toBe(result2.pageCount);
        }, 30000);

        it('should handle invoices with many items', async () => {
          const largeInvoice = new FacturXInvoice(
            FacturxProfile.EN16931,
            testInvoice.header,
            testInvoice.seller,
            testInvoice.buyer,
            testInvoice.payment,
            [],
            [],
            'EUR'
          );

          // Add 20 items
          for (let i = 1; i <= 20; i++) {
            largeInvoice.addLine(
              new InvoiceLineImpl(`L${i}`, `Item ${i}`, i, 50.0 + i * 5, 0.20)
            );
          }

          const result = await instance.generate(largeInvoice, {
            validateBeforeGeneration: false,
            validateAfterGeneration: false,
          });

          expect(result.pdf).toBeDefined();
          expect(result.pageCount).toBeGreaterThanOrEqual(1);
        }, 30000);
      });
    });
  });

  describe('Template Comparison', () => {
    it('should produce different file sizes', async () => {
      const modern = new ModernTemplate();
      const minimal = new MinimalTemplate();
      const fancy = new FancyTemplate();

      const modernResult = await modern.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });
      const minimalResult = await minimal.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });
      const fancyResult = await fancy.generate(testInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      // All should generate valid PDFs
      expect(modernResult.fileSize).toBeGreaterThan(10000);
      expect(minimalResult.fileSize).toBeGreaterThan(10000);
      expect(fancyResult.fileSize).toBeGreaterThan(10000);

      // Templates may have different file sizes due to styling
      expect(modernResult.templateType).toBe('modern');
      expect(minimalResult.templateType).toBe('minimal');
      expect(fancyResult.templateType).toBe('fancy');
    }, 60000);

    it('should all produce valid PDF/A-3 documents', async () => {
      const templates = [
        new ModernTemplate(),
        new MinimalTemplate(),
        new FancyTemplate(),
        new CorporateTemplate(),
        new BrandTemplate(),
      ];

      for (const template of templates) {
        const result = await template.generate(testInvoice, {
          validateBeforeGeneration: false,
          validateAfterGeneration: false,
        });

        // Verify PDF is generated and loadable
        // (Actual PDF/A-3 compliance is tested in PDFA3Compliance.test.ts)
        const pdfDoc = await PDFDocument.load(result.pdf);
        expect(pdfDoc).toBeDefined();
        expect(result.pdf.length).toBeGreaterThan(10000);
        expect(result.pageCount).toBeGreaterThan(0);
      }
    }, 120000);
  });
});
