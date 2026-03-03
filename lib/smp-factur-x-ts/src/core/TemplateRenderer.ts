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

import { PDFDocument, PDFPage, PDFFont, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
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
import {
  setupPDFA3Compliance,
  loadChillaxFonts,
} from '../utils/PDFA3Compliance';
import { attachFileWithAFRelationship } from '../utils/AFRelationshipFix';

// ============================================================================
// BASE TEMPLATE RENDERER
// ============================================================================

export abstract class TemplateRenderer {
  protected pdfDoc!: PDFDocument;
  protected currentPage!: PDFPage;
  protected context!: TemplateContext;
  protected renderContext!: RenderContext;
  protected strings!: LocalizedStrings;

  // Track all pages for deferred footer rendering
  private allPages: PDFPage[] = [];

  // Font cache (now contains embedded fonts)
  private fontCache: Map<string, PDFFont> = new Map();

  // Embedded Chillax fonts (loaded once)
  private chillaxFonts?: {
    regular: PDFFont;
    bold: PDFFont;
  };

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

    // STEP 3.0: Register fontkit to enable custom font embedding
    this.pdfDoc.registerFontkit(fontkit);

    // STEP 3.1: Load and embed Chillax fonts (PDF/A-3 compliance: all fonts must be embedded)
    await this.loadEmbeddedFonts();

    // STEP 3.2: Apply PDF/A-3 compliance (XMP metadata, OutputIntent, etc.)
    await setupPDFA3Compliance(this.pdfDoc, {
      title: invoice.header.name || 'Invoice',
      author: invoice.seller.name,
      subject: `Invoice ${invoice.header.invoiceNumber}`,
      creator: 'factur-x-ts',
      keywords: ['Invoice', 'Factur-X', 'EN16931', 'PDF/A-3'],
    });

    // Add metadata (basic PDF metadata, XMP is already added by setupPDFA3Compliance)
    this.addMetadata();

    // Create first page
    this.addPage();

    // Render content (implemented by subclasses)
    await this.renderContent();

    // Draw footer on ALL pages with correct total page count
    this.drawAllPageFooters();

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
  // PAGE FOOTER SYSTEM
  // ==========================================================================

  /** Height reserved at bottom of every page for the page footer */
  protected static readonly PAGE_FOOTER_HEIGHT = 40;

  /**
   * Draw page footers on ALL pages at once (called at end of document).
   * This ensures correct "Page X sur Y" with the final total page count.
   */
  protected drawAllPageFooters(): void {
    const totalPages = this.allPages.length;
    for (let i = 0; i < totalPages; i++) {
      this.drawSinglePageFooter(this.allPages[i], i + 1, totalPages);
    }
  }

  /**
   * Draw footer on a single page. Override in subclasses for custom styling.
   * @param page - The PDF page to draw on
   * @param pageNum - Current page number (1-based)
   * @param totalPages - Total number of pages
   */
  protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void {
    const { margins } = this.context.options;
    const { theme } = this.context;
    const size = this.getPageSize(this.context.options.pageFormat);
    const pageWidth = size[0];
    const footerTop = margins.bottom + TemplateRenderer.PAGE_FOOTER_HEIGHT;
    const font = this.getFont('Helvetica');
    const fontBold = this.getFont('Helvetica-Bold');

    // Footer background
    page.drawRectangle({
      x: margins.left,
      y: margins.bottom,
      width: pageWidth - margins.left - margins.right,
      height: TemplateRenderer.PAGE_FOOTER_HEIGHT,
      color: this.parseColor(theme.footerBackground),
    });

    // Generation date (bold)
    const generatedDateText = this.getGeneratedDateText();
    page.drawText(generatedDateText, {
      x: margins.left + 10,
      y: footerTop - 14,
      size: 8,
      font: fontBold,
      color: this.parseColor(theme.textColor),
    });

    // Page number
    const pageText = `${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`;
    page.drawText(pageText, {
      x: margins.left + 10,
      y: footerTop - 28,
      size: 8,
      font,
      color: this.parseColor(theme.textColor),
    });

    // Powered by (right-aligned)
    const creditText = '@facturx/templates';
    const creditX = pageWidth - margins.right - 120;
    page.drawText(creditText, {
      x: creditX,
      y: footerTop - 28,
      size: 8,
      font,
      color: this.parseColor(theme.secondaryColor),
    });
  }

  // ==========================================================================
  // PAGE MANAGEMENT
  // ==========================================================================

  /**
   * Add new page and track it for deferred footer rendering
   */
  protected addPage(): void {
    const { pageFormat, margins } = this.context.options;
    const size = this.getPageSize(pageFormat);

    this.currentPage = this.pdfDoc.addPage(size);
    this.allPages.push(this.currentPage);

    this.renderContext = {
      width: size[0],
      height: size[1],
      margins,
      currentY: size[1] - margins.top,
      pageNumber: this.pdfDoc.getPageCount(),
    };
  }

  /**
   * Check if we need new page - accounts for reserved footer space
   */
  protected needsNewPage(requiredHeight: number): boolean {
    const { margins } = this.context.options;
    const reservedBottom = margins.bottom + TemplateRenderer.PAGE_FOOTER_HEIGHT;
    return this.renderContext.currentY - requiredHeight < reservedBottom;
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
    const fontName = options.bold ? 'Helvetica-Bold' : 'Helvetica';

    // Get font (cached - now returns embedded Chillax fonts)
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
    const invoice = this.context.invoice;

    const headerHeight = 95;

    // Draw header background
    this.drawRect(
      margins.left,
      startY - headerHeight,
      width - margins.left - margins.right,
      headerHeight,
      { fillColor: theme.headerBackground }
    );

    // Document title (FACTURE, AVOIR, DEVIS)
    const docTitle = invoice.header.name || this.strings.invoice;
    this.drawText(docTitle, margins.left + 10, startY - 30, {
      size: 24,
      bold: true,
      color: theme.primaryColor,
    });

    // Document number
    this.drawText(
      `${this.strings.invoiceNumber}: ${invoice.header.id}`,
      margins.left + 10,
      startY - 55,
      { size: 11 }
    );

    // Issue date
    const issueDateStr = this.formatInvoiceDateFull();
    this.drawText(
      `${this.strings.issueDate}: ${issueDateStr}`,
      margins.left + 10,
      startY - 70,
      { size: 10 }
    );

    // Due date (from payment, header, or default +60 days)
    const dueDateStr = this.formatDateFull(this.getDueDate());
    this.drawText(
      `${this.strings.dueDate}: ${dueDateStr}`,
      margins.left + 10,
      startY - 85,
      { size: 10 }
    );

    this.renderContext.currentY -= (headerHeight + 10);

    return {
      height: headerHeight + 10,
      y: startY,
    };
  }

  /**
   * Get due date: from payment, from header, or default to issueDate + 60 days
   */
  protected getDueDate(): Date {
    const invoice = this.context.invoice;

    // 1. From payment details
    if (invoice.payment?.dueDate) {
      return invoice.payment.dueDate;
    }

    // 2. From document header
    if (invoice.header.dueDate) {
      return invoice.header.dueDate;
    }

    // 3. Default: issue date + 60 days
    const issueDate = invoice.header.invoiceDate;
    const defaultDue = new Date(issueDate.getTime() + 60 * 24 * 60 * 60 * 1000);
    return defaultDue;
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
    const headerColor = theme.primaryColor;
    this.drawText(this.strings.description, x, startY - 18, { bold: true, size: 9, color: headerColor });
    x += colWidths.description;
    this.drawText(this.strings.quantity, x, startY - 18, { bold: true, size: 9, color: headerColor });
    x += colWidths.quantity;
    this.drawText(this.strings.unitPrice, x, startY - 18, { bold: true, size: 9, color: headerColor });
    x += colWidths.unitPrice;
    this.drawText(this.strings.vatRate, x, startY - 18, { bold: true, size: 9, color: headerColor });
    x += colWidths.vatRate;
    this.drawText(this.strings.lineTotal, x, startY - 18, { bold: true, size: 9, color: headerColor });

    let y = startY - 25;

    // Lines
    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];
      const rowHeight = 20;

      // Check page break
      const pageBefore = this.renderContext.pageNumber;
      this.checkPageBreak(rowHeight + 5);
      if (this.renderContext.pageNumber > pageBefore) {
        // New page actually created - redraw header
        y = this.renderContext.currentY;
        this.drawRect(margins.left, y - 25, tableWidth, 25, {
          fillColor: theme.tableHeaderBackground,
        });
        let hx = margins.left + 5;
        this.drawText(this.strings.description, hx, y - 18, { bold: true });
        hx += colWidths.description;
        this.drawText(this.strings.quantity, hx, y - 18, { bold: true });
        hx += colWidths.quantity;
        this.drawText(this.strings.unitPrice, hx, y - 18, { bold: true });
        hx += colWidths.unitPrice;
        this.drawText(this.strings.vatRate, hx, y - 18, { bold: true });
        hx += colWidths.vatRate;
        this.drawText(this.strings.lineTotal, hx, y - 18, { bold: true });
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
  // DATE FORMATTING
  // ==========================================================================

  /**
   * Format date in full locale format (e.g., "2 mars 2026" for fr)
   */
  protected formatDateFull(date: Date): string {
    const lang = this.context.options.language || 'fr';
    const localeMap: Record<string, string> = {
      fr: 'fr-FR',
      en: 'en-GB',
      de: 'de-DE',
      es: 'es-ES',
    };
    const locale = localeMap[lang] || 'fr-FR';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Get the generation date text (e.g., "Document généré le 2 mars 2026")
   */
  protected getGeneratedDateText(): string {
    return `${this.strings.generatedOn} ${this.formatDateFull(this.context.generatedAt)}`;
  }

  /**
   * Format invoice date in full locale format
   */
  protected formatInvoiceDateFull(): string {
    return this.formatDateFull(this.context.invoice.header.invoiceDate);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get font - Cached
   */
  /**
   * Load embedded Chillax fonts (PDF/A-3 compliance)
   */
  private async loadEmbeddedFonts(): Promise<void> {
    if (this.chillaxFonts) {
      return; // Already loaded
    }

    const fontFiles = await loadChillaxFonts();

    const regular = await this.pdfDoc.embedFont(fontFiles.regular);
    const bold = await this.pdfDoc.embedFont(fontFiles.bold);

    this.chillaxFonts = { regular, bold };

    // Pre-populate font cache with embedded fonts
    this.fontCache.set('Helvetica', regular);
    this.fontCache.set('Helvetica-Bold', bold);
    this.fontCache.set('Times-Roman', regular);
    this.fontCache.set('Times-Bold', bold);
    this.fontCache.set('Courier', regular);
    this.fontCache.set('Courier-Bold', bold);
  }

  /**
   * Get font - now returns embedded Chillax fonts
   */
  private getFont(fontName: string): PDFFont {
    // All standard font requests are mapped to embedded Chillax fonts
    if (!this.fontCache.has(fontName)) {
      // Default to regular if font not found
      return this.chillaxFonts?.regular || this.fontCache.get('Helvetica')!;
    }
    return this.fontCache.get(fontName)!;
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
      validateBeforeGeneration: options.validateBeforeGeneration ?? true,
      validateAfterGeneration: options.validateAfterGeneration ?? true,
      strictValidation: options.strictValidation ?? false,
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

    // Manually attach the file with AFRelationship for PDF/A-3 compliance
    await attachFileWithAFRelationship(
      this.pdfDoc,
      Buffer.from(xml, 'utf-8'),
      'factur-x.xml',
      {
        mimeType: 'text/xml',
        description: 'Factur-X XML Invoice',
        creationDate: this.context.generatedAt,
        modificationDate: this.context.generatedAt,
        relationship: 'Data', // PDF/A-3 requirement for Factur-X
      }
    );

    return xml;
  }
}
