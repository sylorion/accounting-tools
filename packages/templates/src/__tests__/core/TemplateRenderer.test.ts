/**
 * Tests for TemplateRenderer module
 * Tests base template rendering functionality
 */

import {
  FacturXInvoice,
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
} from '@facturx/core';
import { TemplateRenderer } from '../../core/TemplateRenderer';
import { TemplateType } from '../../types';

// Mock concrete implementation for testing abstract class
class MockTemplateRenderer extends TemplateRenderer {
  protected async renderContent(): Promise<void> {
    await this.renderHeader();
    this.renderParties();
    this.renderLineItems();
    this.renderTotals();
  }

  protected getTemplateType(): TemplateType {
    return TemplateType.MODERN;
  }
}

function createTestInvoice(): FacturXInvoice {
  return new FacturXInvoice(
    FacturxProfile.EN16931,
    {
      id: 'TEST-001',
      invoiceNumber: 'TEST-001',
      name: 'Test Invoice',
      invoiceDate: new Date('2024-01-15'),
      typeCode: DocTypeCode.INVOICE,
    },
    {
      name: 'Test Seller Inc.',
      address: {
        street: '123 Main St',
        postalCode: '75001',
        city: 'Paris',
        countryCode: 'FR',
      },
      vatId: 'FR12345678901',
    },
    {
      name: 'Test Buyer Ltd.',
      address: {
        street: '456 Oak Ave',
        postalCode: '69001',
        city: 'Lyon',
        countryCode: 'FR',
      },
      vatId: 'FR98765432109',
    },
    {
      meansCode: PaymentMeansCode.CREDIT_TRANSFER,
      termsDescription: 'Net 30',
      dueDate: new Date('2024-02-15'),
    },
    [
      {
        id: '1',
        description: 'Test Item',
        quantity: 1,
        unitPrice: 100.0,
        vatRate: 0.20,
        taxCategoryCode: 'S',
        unitCode: 'C62',
        lineTotal: 100,
        allowances: [],
        charges: [],
      },
    ],
  );
}

describe('TemplateRenderer', () => {
  let renderer: MockTemplateRenderer;
  let invoice: FacturXInvoice;

  beforeEach(() => {
    renderer = new MockTemplateRenderer();
    invoice = createTestInvoice();
  });

  describe('generate', () => {
    it('should generate a valid PDF', async () => {
      const result = await renderer.generate(invoice);

      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.templateType).toBe(TemplateType.MODERN);
    }, 30000);

    it('should skip pre-validation when disabled', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should skip both validations when disabled', async () => {
      const result = await renderer.generate(invoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
    }, 30000);

    it('should generate PDF with multiple line items', async () => {
      const multiItemInvoice = new FacturXInvoice(
        FacturxProfile.EN16931,
        {
          id: 'TEST-002',
          invoiceNumber: 'TEST-002',
          name: 'Multi-Item Invoice',
          invoiceDate: new Date('2024-01-15'),
          typeCode: DocTypeCode.INVOICE,
        },
        {
          name: 'Seller SARL',
          address: { street: '10 Rue Test', postalCode: '75001', city: 'Paris', countryCode: 'FR' },
          vatId: 'FR12345678901',
        },
        {
          name: 'Buyer SAS',
          address: { street: '20 Rue Client', postalCode: '69001', city: 'Lyon', countryCode: 'FR' },
          vatId: 'FR98765432109',
        },
        {
          meansCode: PaymentMeansCode.CREDIT_TRANSFER,
          dueDate: new Date('2024-02-15'),
        },
        [
          { id: '1', description: 'Item 1', quantity: 2, unitPrice: 50, vatRate: 0.20, taxCategoryCode: 'S', unitCode: 'C62', lineTotal: 100, allowances: [], charges: [] },
          { id: '2', description: 'Item 2', quantity: 3, unitPrice: 75, vatRate: 0.20, taxCategoryCode: 'S', unitCode: 'C62', lineTotal: 225, allowances: [], charges: [] },
          { id: '3', description: 'Item 3', quantity: 1, unitPrice: 200, vatRate: 0.10, taxCategoryCode: 'S', unitCode: 'C62', lineTotal: 200, allowances: [], charges: [] },
        ],
      );

      const result = await renderer.generate(multiItemInvoice, {
        validateBeforeGeneration: false,
        validateAfterGeneration: false,
      });

      expect(result.pdf).toBeDefined();
      expect(result.pdf.length).toBeGreaterThan(0);
    }, 30000);
  });
});
