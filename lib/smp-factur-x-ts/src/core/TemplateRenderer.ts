/**
 * @module TemplateRenderer
 * @description Base template renderer for Factur-X PDF generation
 *
 * Performance optimizations:
 * - Lazy font loading
 * - Cached measurements
 * - Efficient page management
 * - Optimized PDF-lib usage
 */

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import {
  FacturXInvoice,
  formatAmount,
} from '@facturx/core';
import {
  TemplateOptions,
  TemplateTheme,
  TemplateContext,
  PDFGenerationResult,
  RenderContext,
  RenderedElement,
  LocalizedStrings,
  LOCALIZED_STRINGS,
  DEFAULT_THEME,
  TemplateType,
} from '../types';
import {
  ValidationPipeline,
  ValidationPipelineResult,
} from '../validation/ValidationPipeline';

// ============================================================================
// BASE TEMPLATE RENDERER
// ============================================================================

export abstract class TemplateRenderer {
  protected pdfDoc!: PDFDocument;
  protected currentPage!: PDFPage;
  protected context!: TemplateContext;
  protected renderContext!: RenderContext;
  protected strings!: LocalizedStrings;

  // Font cache
  private fontCache: Map<string, any> = new Map();

  // Validation pipeline
  private validationPipeline: ValidationPipeline;

  constructor() {
    this.validationPipeline = new ValidationPipeline();
  }

  /**
   * Generate PDF from invoice - Main entry point with automatic validation
   */
  async generate(
    invoice: FacturXInvoice,
    options: Partial<TemplateOptions> = {}
  ): Promise<PDFGenerationResult & { validation?: ValidationPipelineResult }> {
    // STEP 1: Validate BEFORE generation (optional, enabled by default)
    let preValidation: ValidationPipelineResult | undefined;
    if (options.validateBeforeGeneration !== false) {
      try {
        preValidation = await this.validationPipeline.validateBeforeGeneration(invoice);

        // If strict mode and validation fails, throw error
        if (options.strictValidation && !preValidation.isValid) {
          throw new Error(
            `Factur-X validation failed: ${preValidation.summary.totalErrors} error(s). ` +
            `Recommendations: ${preValidation.recommendations.join(', ')}`
          );
        }
      } catch (error) {
        if (options.strictValidation) {
          throw error;
        }
        // In non-strict mode, log but continue
        console.warn('Pre-generation validation failed:', error);
      }
    }

    // STEP 2: Initialize context
    const fullOptions = this.mergeOptions(options);
    const summary = invoice.finalizeTotals();
    const theme = this.mergeTheme(fullOptions.theme || {});

    this.context = {
      invoice,
      summary,
      options: fullOptions,
      theme,
      generatedAt: new Date(),
    };

    this.strings = LOCALIZED_STRINGS[fullOptions.language];

    // STEP 3: Create PDF document
    this.pdfDoc = await PDFDocument.create();

    // Add metadata
    this.addMetadata();

    // Create first page
    this.addPage();

    // Render content (implemented by subclasses)
    await this.renderContent();

    // Attach Factur-X XML
    const xmlContent = await this.attachFacturXml();

    // STEP 4: Finalize PDF
    const pdfBytes = await this.pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // STEP 5: Validate AFTER generation (optional, enabled by default)
    let postValidation: ValidationPipelineResult | undefined;
    if (options.validateAfterGeneration !== false) {
      try {
        postValidation = await this.validationPipeline.validateAfterGeneration(
          invoice,
          pdfBuffer,
          xmlContent
        );

        // If strict mode and validation fails, throw error
        if (options.strictValidation && !postValidation.isValid) {
          throw new Error(
            `Factur-X post-generation validation failed: ${postValidation.summary.totalErrors} error(s). ` +
            `Compliance: ${postValidation.summary.complianceLevel}`
          );
        }
      } catch (error) {
        if (options.strictValidation) {
          throw error;
        }
        // In non-strict mode, log but continue
        console.warn('Post-generation validation failed:', error);
      }
    }

    return {
      pdf: pdfBuffer,
      pageCount: this.pdfDoc.getPageCount(),
      fileSize: pdfBytes.length,
      generatedAt: this.context.generatedAt,
      templateType: this.getTemplateType(),
      // Include validation result if available
      validation: postValidation || preValidation,
    };
  }

  /**
   * Render content - Must be implemented by subclasses
   */
  protected abstract renderContent(): Promise<void>;

  /**
   * Get template type - Must be implemented by subclasses
   */
  protected abstract getTemplateType(): TemplateType;

  // ==========================================================================
  // PAGE MANAGEMENT
  // ==========================================================================

  /**
   * Add new page - Optimized
   */
  protected addPage(): void {
    const { pageFormat, margins } = this.context.options;
    const size = this.getPageSize(pageFormat);

    this.currentPage = this.pdfDoc.addPage(size);

    this.renderContext = {
      width: size[0],
      height: size[1],
      margins,
      currentY: size[1] - margins.top,
      pageNumber: this.pdfDoc.getPageCount(),
    };
  }

  /**
   * Check if we need new page
   */
  protected needsNewPage(requiredHeight: number): boolean {
    const { margins } = this.context.options;
    return this.renderContext.currentY - requiredHeight < margins.bottom;
  }

  /**
   * Move to new page if needed
   */
  protected checkPageBreak(requiredHeight: number): void {
    if (this.needsNewPage(requiredHeight)) {
      this.addPage();
    }
  }

  // ==========================================================================
  // DRAWING PRIMITIVES
  // ==========================================================================

  /**
   * Draw text - Optimized
   */
  protected drawText(
    text: string,
    x: number,
    y: number,
    options: {
      size?: number;
      color?: string;
      font?: string;
      bold?: boolean;
    } = {}
  ): void {
    const { theme } = this.context;
    const size = options.size || theme.fontSize;
    const color = options.color || theme.textColor;
    const fontName = options.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;

    // Get font (cached)
    const font = this.getFont(fontName);

    // Parse color
    const rgbColor = this.parseColor(color);

    this.currentPage.drawText(text, {
      x,
      y,
      size,
      font,
      color: rgbColor,
    });
  }

  /**
   * Draw rectangle - Optimized
   */
  protected drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fillColor?: string;
      borderColor?: string;
      borderWidth?: number;
    } = {}
  ): void {
    if (options.fillColor) {
      this.currentPage.drawRectangle({
        x,
        y,
        width,
        height,
        color: this.parseColor(options.fillColor),
      });
    }

    if (options.borderColor && options.borderWidth) {
      this.currentPage.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: this.parseColor(options.borderColor),
        borderWidth: options.borderWidth,
      });
    }
  }

  /**
   * Draw line - Optimized
   */
  protected drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: {
      color?: string;
      width?: number;
    } = {}
  ): void {
    const { theme } = this.context;
    const color = options.color || theme.borderColor;
    const width = options.width || 1;

    this.currentPage.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      color: this.parseColor(color),
      thickness: width,
    });
  }

  // ==========================================================================
  // COMMON RENDERING HELPERS
  // ==========================================================================

  /**
   * Render header section
   */
  protected async renderHeader(): Promise<RenderedElement> {
    const { margins } = this.context.options;
    const { theme } = this.context;
    const { width } = this.renderContext;
    const startY = this.renderContext.currentY;

    // Draw header background
    this.drawRect(
      margins.left,
      startY - 80,
      width - margins.left - margins.right,
      80,
      { fillColor: theme.headerBackground }
    );

    // Invoice title
    this.drawText(this.strings.invoice, margins.left + 10, startY - 30, {
      size: 24,
      bold: true,
      color: theme.primaryColor,
    });

    // Invoice number and date
    const invoice = this.context.invoice;
    this.drawText(
      `${this.strings.invoiceNumber}: ${invoice.header.id}`,
      margins.left + 10,
      startY - 55,
      { size: 12 }
    );

    const dateStr = invoice.header.invoiceDate.toLocaleDateString();
    this.drawText(
      `${this.strings.invoiceDate}: ${dateStr}`,
      margins.left + 10,
      startY - 70,
      { size: 10 }
    );

    this.renderContext.currentY -= 90;

    return {
      height: 90,
      y: startY,
    };
  }

  /**
   * Render parties (seller/buyer)
   */
  protected renderParties(): RenderedElement {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const halfWidth = (width - margins.left - margins.right) / 2;

    // Seller
    this.drawText(this.strings.seller, margins.left, startY, {
      size: 12,
      bold: true,
    });
    this.drawText(invoice.seller.name, margins.left, startY - 20, { size: 10 });

    if (invoice.seller.address) {
      const addr = invoice.seller.address;
      let y = startY - 35;
      if (addr.street) {
        this.drawText(addr.street, margins.left, y, { size: 9 });
        y -= 12;
      }
      this.drawText(`${addr.postalCode} ${addr.city}`, margins.left, y, { size: 9 });
      y -= 12;
      this.drawText(addr.countryCode, margins.left, y, { size: 9 });
    }

    if (invoice.seller.vatId) {
      this.drawText(`TVA: ${invoice.seller.vatId}`, margins.left, startY - 80, { size: 9 });
    }

    // Buyer
    const buyerX = margins.left + halfWidth + 20;
    this.drawText(this.strings.buyer, buyerX, startY, {
      size: 12,
      bold: true,
    });
    this.drawText(invoice.buyer.name, buyerX, startY - 20, { size: 10 });

    if (invoice.buyer.address) {
      const addr = invoice.buyer.address;
      let y = startY - 35;
      if (addr.street) {
        this.drawText(addr.street, buyerX, y, { size: 9 });
        y -= 12;
      }
      this.drawText(`${addr.postalCode} ${addr.city}`, buyerX, y, { size: 9 });
      y -= 12;
      this.drawText(addr.countryCode, buyerX, y, { size: 9 });
    }

    if (invoice.buyer.vatId) {
      this.drawText(`TVA: ${invoice.buyer.vatId}`, buyerX, startY - 80, { size: 9 });
    }

    this.renderContext.currentY -= 110;

    return {
      height: 110,
      y: startY,
    };
  }

  /**
   * Render line items table
   */
  protected renderLineItems(): RenderedElement {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { theme, invoice } = this.context;
    const startY = this.renderContext.currentY;

    const tableWidth = width - margins.left - margins.right;
    const colWidths = {
      description: tableWidth * 0.4,
      quantity: tableWidth * 0.15,
      unitPrice: tableWidth * 0.2,
      vatRate: tableWidth * 0.1,
      total: tableWidth * 0.15,
    };

    // Table header
    this.drawRect(margins.left, startY - 25, tableWidth, 25, {
      fillColor: theme.tableHeaderBackground,
    });

    let x = margins.left + 5;
    this.drawText(this.strings.description, x, startY - 18, { bold: true });
    x += colWidths.description;
    this.drawText(this.strings.quantity, x, startY - 18, { bold: true });
    x += colWidths.quantity;
    this.drawText(this.strings.unitPrice, x, startY - 18, { bold: true });
    x += colWidths.unitPrice;
    this.drawText(this.strings.vatRate, x, startY - 18, { bold: true });
    x += colWidths.vatRate;
    this.drawText(this.strings.lineTotal, x, startY - 18, { bold: true });

    let y = startY - 25;

    // Lines
    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];
      const rowHeight = 20;

      // Check page break
      this.checkPageBreak(rowHeight);
      if (this.renderContext.currentY > startY - 25) {
        // New page, redraw header
        y = this.renderContext.currentY;
        this.drawRect(margins.left, y - 25, tableWidth, 25, {
          fillColor: theme.tableHeaderBackground,
        });
        // ... redraw headers
        y -= 25;
      }

      // Alternate row colors
      const bgColor = i % 2 === 0 ? theme.tableRowEvenBackground : theme.tableRowOddBackground;
      this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, {
        fillColor: bgColor,
      });

      // Draw line data
      x = margins.left + 5;
      this.drawText(line.description, x, y - 14, { size: 9 });
      x += colWidths.description;
      this.drawText(String(line.quantity), x, y - 14, { size: 9 });
      x += colWidths.quantity;
      this.drawText(formatAmount(line.unitPrice) + ' €', x, y - 14, { size: 9 });
      x += colWidths.unitPrice;
      this.drawText(formatAmount(line.vatRate * 100) + '%', x, y - 14, { size: 9 });
      x += colWidths.vatRate;
      this.drawText(formatAmount(line.lineTotal) + ' €', x, y - 14, { size: 9 });

      y -= rowHeight;
    }

    this.renderContext.currentY = y - 10;

    return {
      height: startY - y,
      y: startY,
    };
  }

  /**
   * Render totals section
   */
  protected renderTotals(): RenderedElement {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const totalsX = width - margins.right - 200;
    let y = startY;

    // Subtotal
    this.drawText(this.strings.subtotal, totalsX, y, { size: 10 });
    this.drawText(formatAmount(summary.lineTotal) + ' €', totalsX + 120, y, { size: 10 });
    y -= 20;

    // Tax total
    this.drawText(this.strings.taxTotal, totalsX, y, { size: 10 });
    this.drawText(formatAmount(summary.taxTotal) + ' €', totalsX + 120, y, { size: 10 });
    y -= 25;

    // Grand total
    this.drawText(this.strings.grandTotal, totalsX, y, { size: 12, bold: true });
    this.drawText(formatAmount(summary.grandTotal) + ' €', totalsX + 120, y, {
      size: 12,
      bold: true,
    });

    this.renderContext.currentY = y - 20;

    return {
      height: startY - y,
      y: startY,
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get font - Cached
   */
  private getFont(fontName: string): any {
    if (!this.fontCache.has(fontName)) {
      const font = this.pdfDoc.embedStandardFont(fontName as any);
      this.fontCache.set(fontName, font);
    }
    return this.fontCache.get(fontName);
  }

  /**
   * Parse color string to RGB
   */
  private parseColor(color: string): any {
    // Simple hex color parser
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }

  /**
   * Get page size
   */
  private getPageSize(format: string): [number, number] {
    switch (format) {
      case 'A4':
        return [595.28, 841.89]; // Points
      case 'Letter':
        return [612, 792];
      case 'Legal':
        return [612, 1008];
      default:
        return [595.28, 841.89];
    }
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(options: Partial<TemplateOptions>): Required<TemplateOptions> {
    return {
      theme: options.theme || {},
      logo: options.logo || '',
      showLogo: options.showLogo ?? false,
      showWatermark: options.showWatermark ?? false,
      watermarkText: options.watermarkText || 'DRAFT',
      showQRCode: options.showQRCode ?? false,
      qrCodeData: options.qrCodeData || '',
      pageFormat: options.pageFormat || 'A4',
      margins: options.margins || { top: 50, right: 50, bottom: 50, left: 50 },
      language: options.language || 'fr',
      showLineNumbers: options.showLineNumbers ?? true,
      showTaxBreakdown: options.showTaxBreakdown ?? true,
      showPaymentTerms: options.showPaymentTerms ?? true,
      customFooter: options.customFooter || '',
    };
  }

  /**
   * Merge theme with defaults
   */
  private mergeTheme(theme: Partial<TemplateTheme>): TemplateTheme {
    return {
      ...DEFAULT_THEME,
      ...theme,
    };
  }

  /**
   * Add PDF metadata
   */
  private addMetadata(): void {
    const { invoice } = this.context;

    this.pdfDoc.setTitle(`Invoice ${invoice.header.id}`);
    this.pdfDoc.setAuthor(invoice.seller.name);
    this.pdfDoc.setSubject(`Factur-X Invoice ${invoice.header.id}`);
    this.pdfDoc.setKeywords(['invoice', 'factur-x', 'zugferd', 'electronic']);
    this.pdfDoc.setProducer('@facturx/templates');
    this.pdfDoc.setCreator('@facturx/core');
    this.pdfDoc.setCreationDate(this.context.generatedAt);
    this.pdfDoc.setModificationDate(this.context.generatedAt);
  }

  /**
   * Attach Factur-X XML to PDF - Returns XML content for validation
   */
  private async attachFacturXml(): Promise<string> {
    const { invoice } = this.context;
    const xml = invoice.generateXml(true);

    // Attach as embedded file
    await this.pdfDoc.attach(
      Buffer.from(xml, 'utf-8'),
      'factur-x.xml',
      {
        mimeType: 'text/xml',
        description: 'Factur-X XML Invoice',
        creationDate: this.context.generatedAt,
        modificationDate: this.context.generatedAt,
      }
    );

    return xml;
  }
}
