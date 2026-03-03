/**
 * @module FancyTemplate
 * @description Fancy, colorful template for Factur-X invoices
 *
 * Features:
 * - Pink and blue color scheme
 * - Modern gradient header
 * - Colorful section highlights
 * - Perfect for creative businesses
 */

import { PDFPage } from 'pdf-lib';
import { formatAmount } from '@facturx/core';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

export class FancyTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    return TemplateType.FANCY;
  }

  protected async renderContent(): Promise<void> {
    await this.renderFancyHeader();
    this.renderContext.currentY -= 25;

    this.renderFancyParties();
    this.renderContext.currentY -= 20;

    this.renderFancyLineItems();
    this.renderContext.currentY -= 15;

    // Side-by-side: payment (left) + totals (right)
    this.checkPageBreak(120);
    this.renderPaymentAndTotals();

    // Tax breakdown below totals
    if (this.context.options.showTaxBreakdown) {
      this.renderContext.currentY -= 15;
      this.checkPageBreak(60);
      this.renderFancyTaxBreakdown();
    }
  }

  // ===========================================================================
  // HEADER
  // ===========================================================================

  private async renderFancyHeader(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const startY = this.renderContext.currentY;
    const invoice = this.context.invoice;

    const headerHeight = 110;

    // Pink background
    this.drawRect(
      margins.left, startY - headerHeight,
      width - margins.left - margins.right, headerHeight,
      { fillColor: '#db2777' }
    );

    // Blue accent right
    this.drawRect(
      width - margins.right - 150, startY - headerHeight,
      150, headerHeight,
      { fillColor: '#3b82f6' }
    );

    // Title (FACTURE / AVOIR / DEVIS)
    const docTitle = invoice.header.name || this.strings.invoice;
    this.drawText(docTitle, margins.left + 20, startY - 30, {
      size: 32, bold: true, color: '#ffffff',
    });

    // Number
    this.drawText(
      `${this.strings.invoiceNumber}: ${invoice.header.id}`,
      margins.left + 20, startY - 55,
      { size: 11, color: '#ffffff' }
    );

    // Issue date
    this.drawText(
      `${this.strings.issueDate}: ${this.formatInvoiceDateFull()}`,
      margins.left + 20, startY - 72,
      { size: 10, color: '#ffffff' }
    );

    // Due date
    this.drawText(
      `${this.strings.dueDate}: ${this.formatDateFull(this.getDueDate())}`,
      margins.left + 20, startY - 87,
      { size: 10, color: '#ffffff' }
    );

    this.renderContext.currentY -= headerHeight + 10;
  }

  // ===========================================================================
  // PARTIES
  // ===========================================================================

  private renderFancyParties(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const halfWidth = (width - margins.left - margins.right) / 2 - 10;

    // Seller box - pink accent
    this.drawRect(margins.left, startY - 120, halfWidth, 120,
      { fillColor: '#fce7f3', borderColor: '#db2777', borderWidth: 2 });

    this.drawText(this.strings.seller, margins.left + 10, startY - 20, {
      size: 12, bold: true, color: '#db2777',
    });
    this.drawText(invoice.seller.name, margins.left + 10, startY - 38, {
      size: 11, bold: true,
    });

    if (invoice.seller.address) {
      const addr = invoice.seller.address;
      let y = startY - 55;
      if (addr.street) { this.drawText(addr.street, margins.left + 10, y, { size: 9 }); y -= 14; }
      this.drawText(`${addr.postalCode} ${addr.city}`, margins.left + 10, y, { size: 9 }); y -= 14;
      this.drawText(addr.countryCode, margins.left + 10, y, { size: 9 });
    }
    if (invoice.seller.vatId) {
      this.drawText(`TVA: ${invoice.seller.vatId}`, margins.left + 10, startY - 105, { size: 9, color: '#6b7280' });
    }

    // Buyer box - blue accent
    const buyerX = margins.left + halfWidth + 20;
    this.drawRect(buyerX, startY - 120, halfWidth, 120,
      { fillColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: 2 });

    this.drawText(this.strings.buyer, buyerX + 10, startY - 20, {
      size: 12, bold: true, color: '#3b82f6',
    });
    this.drawText(invoice.buyer.name, buyerX + 10, startY - 38, {
      size: 11, bold: true,
    });

    if (invoice.buyer.address) {
      const addr = invoice.buyer.address;
      let y = startY - 55;
      if (addr.street) { this.drawText(addr.street, buyerX + 10, y, { size: 9 }); y -= 14; }
      this.drawText(`${addr.postalCode} ${addr.city}`, buyerX + 10, y, { size: 9 }); y -= 14;
      this.drawText(addr.countryCode, buyerX + 10, y, { size: 9 });
    }
    if (invoice.buyer.vatId) {
      this.drawText(`TVA: ${invoice.buyer.vatId}`, buyerX + 10, startY - 105, { size: 9, color: '#6b7280' });
    }

    this.renderContext.currentY -= 130;
  }

  // ===========================================================================
  // LINE ITEMS
  // ===========================================================================

  private renderFancyLineItems(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const tableWidth = width - margins.left - margins.right;
    const colWidths = {
      description: tableWidth * 0.4,
      quantity: tableWidth * 0.12,
      unitPrice: tableWidth * 0.18,
      vatRate: tableWidth * 0.12,
      total: tableWidth * 0.18,
    };

    // Table header
    this.drawRect(margins.left, startY - 28, tableWidth, 28, { fillColor: '#3b82f6' });

    const drawTableHeader = (y: number) => {
      let hx = margins.left + 8;
      this.drawText(this.strings.description, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
      hx += colWidths.description;
      this.drawText(this.strings.quantity, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
      hx += colWidths.quantity;
      this.drawText(this.strings.unitPrice, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
      hx += colWidths.unitPrice;
      this.drawText(this.strings.vatRate, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
      hx += colWidths.vatRate;
      this.drawText(this.strings.lineTotal, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
    };

    drawTableHeader(startY);
    let y = startY - 28;

    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];
      const rowHeight = 22;

      // Page break detection
      const pageBefore = this.renderContext.pageNumber;
      this.checkPageBreak(rowHeight + 5);
      if (this.renderContext.pageNumber > pageBefore) {
        y = this.renderContext.currentY;
        this.drawRect(margins.left, y - 28, tableWidth, 28, { fillColor: '#3b82f6' });
        drawTableHeader(y);
        y -= 28;
      }

      // Alternating pink/blue rows
      const bgColor = i % 2 === 0 ? '#fce7f3' : '#eff6ff';
      this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, { fillColor: bgColor });

      let x = margins.left + 8;
      this.drawText(line.description, x, y - 14, { size: 9 });
      x += colWidths.description;
      this.drawText(String(line.quantity), x, y - 14, { size: 9 });
      x += colWidths.quantity;
      this.drawText(formatAmount(line.unitPrice) + ' €', x, y - 14, { size: 9 });
      x += colWidths.unitPrice;
      this.drawText(`${formatAmount(line.vatRate * 100)}%`, x, y - 14, { size: 9 });
      x += colWidths.vatRate;
      this.drawText(formatAmount(line.lineTotal) + ' €', x, y - 14, { size: 9, bold: true });

      y -= rowHeight;
    }

    this.renderContext.currentY = y - 10;
  }

  // ===========================================================================
  // PAYMENT (left) + TOTALS (right) - Side by side
  // ===========================================================================

  private renderPaymentAndTotals(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice, summary } = this.context;
    const startY = this.renderContext.currentY;

    const contentWidth = width - margins.left - margins.right;
    const rightX = margins.left + contentWidth * 0.50 + 20;
    const rightW = contentWidth * 0.50 - 10;

    // ---- LEFT: Payment terms ----
    if (this.context.options.showPaymentTerms) {
      this.drawText(this.strings.paymentTerms, margins.left, startY, {
        size: 11, bold: true, color: '#3b82f6',
      });

      let py = startY - 20;
      if (invoice.payment) {
        if (invoice.payment.iban) {
          this.drawText(`${this.strings.iban}: ${invoice.payment.iban}`, margins.left + 5, py, { size: 9 });
          py -= 15;
        }
        if (invoice.payment.bic) {
          this.drawText(`${this.strings.bic}: ${invoice.payment.bic}`, margins.left + 5, py, { size: 9 });
          py -= 15;
        }
        if (invoice.payment.dueDate) {
          this.drawText(`${this.strings.dueDate}: ${this.formatDateFull(invoice.payment.dueDate)}`, margins.left + 5, py, { size: 9 });
          py -= 15;
        }
        if (invoice.payment.termsDescription) {
          this.drawText(invoice.payment.termsDescription, margins.left + 5, py, { size: 9 });
        }
      }
    }

    // ---- RIGHT: Totals with pink highlight ----
    // Background box
    this.drawRect(rightX - 10, startY - 90, rightW + 10, 90,
      { fillColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1 });

    let y = startY - 20;

    this.drawText(this.strings.subtotal, rightX, y, { size: 10 });
    this.drawText(formatAmount(summary.lineTotal) + ' €', rightX + rightW - 80, y, { size: 10 });
    y -= 22;

    this.drawText(this.strings.taxTotal, rightX, y, { size: 10 });
    this.drawText(formatAmount(summary.taxTotal) + ' €', rightX + rightW - 80, y, { size: 10 });
    y -= 28;

    // Grand total pink highlight
    this.drawRect(rightX - 10, y - 8, rightW + 10, 25, { fillColor: '#db2777' });
    this.drawText(this.strings.grandTotal, rightX, y, { size: 13, bold: true, color: '#ffffff' });
    this.drawText(formatAmount(summary.grandTotal) + ' €', rightX + rightW - 80, y, { size: 13, bold: true, color: '#ffffff' });

    this.renderContext.currentY = startY - 100;
  }

  // ===========================================================================
  // TAX BREAKDOWN
  // ===========================================================================

  private renderFancyTaxBreakdown(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const contentWidth = width - margins.left - margins.right;
    const rightX = margins.left + contentWidth * 0.50 + 20;

    this.drawText(this.strings.taxBreakdown, rightX, startY, {
      size: 10, bold: true, color: '#db2777',
    });

    let y = startY - 20;

    // Header row
    this.drawRect(rightX - 5, y - 18, 220, 18, { fillColor: '#fce7f3' });
    this.drawText(this.strings.vatRate, rightX, y - 12, { size: 8, bold: true });
    this.drawText(this.strings.taxBase, rightX + 60, y - 12, { size: 8, bold: true });
    this.drawText(this.strings.taxAmount, rightX + 140, y - 12, { size: 8, bold: true });
    y -= 28;

    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate}%`, rightX, y, { size: 9 });
      this.drawText(formatAmount(taxSum.taxable) + ' €', rightX + 60, y, { size: 9 });
      this.drawText(formatAmount(taxSum.taxAmount) + ' €', rightX + 140, y, { size: 9 });
      y -= 16;
    }

    this.renderContext.currentY = y - 10;
  }

  // ===========================================================================
  // CUSTOM FOOTER - Pink/Blue gradient style
  // ===========================================================================

  protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void {
    const { margins } = this.context.options;
    const size = [595.28, 841.89]; // A4
    const pageWidth = size[0];
    const footerH = 40;
    const footerTop = margins.bottom + footerH;
    const halfW = (pageWidth - margins.left - margins.right) / 2;
    const font = (this as any).getFont('Helvetica');
    const fontBold = (this as any).getFont('Helvetica-Bold');
    const white = (this as any).parseColor('#ffffff');
    const gray = (this as any).parseColor('#6b7280');

    // Generation date above colored bar
    const generatedDateText = this.getGeneratedDateText();
    page.drawText(generatedDateText, {
      x: margins.left + 10, y: footerTop - 2,
      size: 7, font: fontBold, color: gray,
    });

    // Pink left half
    page.drawRectangle({
      x: margins.left, y: margins.bottom,
      width: halfW, height: footerH - 12,
      color: (this as any).parseColor('#db2777'),
    });

    // Blue right half
    page.drawRectangle({
      x: margins.left + halfW, y: margins.bottom,
      width: halfW, height: footerH - 12,
      color: (this as any).parseColor('#3b82f6'),
    });

    // Page number (left, white on pink)
    const pageText = `${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`;
    page.drawText(pageText, {
      x: margins.left + 10, y: margins.bottom + 8,
      size: 8, font, color: white,
    });

    // Powered by (right, white on blue)
    page.drawText('@facturx/templates', {
      x: pageWidth - margins.right - 120, y: margins.bottom + 8,
      size: 8, font, color: white,
    });
  }
}
