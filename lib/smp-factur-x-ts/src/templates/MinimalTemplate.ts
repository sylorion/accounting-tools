/**
 * @module MinimalTemplate
 * @description Clean and minimal template for Factur-X invoices
 *
 * Features:
 * - Ultra-clean design
 * - Monochrome color scheme
 * - Typography-focused
 * - Compact layout: payment left, totals right, tax below
 */

import { PDFPage } from 'pdf-lib';
import { formatAmount } from '@facturx/core';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

export class MinimalTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    return TemplateType.MINIMAL;
  }

  protected async renderContent(): Promise<void> {
    await this.renderMinimalHeader();
    this.renderContext.currentY -= 30;

    this.renderMinimalParties();
    this.renderContext.currentY -= 25;

    this.renderMinimalLineItems();
    this.renderContext.currentY -= 20;

    // Side-by-side: payment (left) + totals (right)
    this.checkPageBreak(110);
    this.renderPaymentAndTotals();

    // Tax breakdown below totals
    if (this.context.options.showTaxBreakdown) {
      this.renderContext.currentY -= 15;
      this.checkPageBreak(50);
      this.renderTaxBreakdown();
    }
  }

  // ===========================================================================
  // HEADER
  // ===========================================================================

  private async renderMinimalHeader(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const startY = this.renderContext.currentY;
    const invoice = this.context.invoice;

    this.drawLine(margins.left, startY - 2, width - margins.right, startY - 2, { color: '#000000', width: 2 });

    const docTitle = invoice.header.name || this.strings.invoice;
    this.drawText(docTitle, margins.left, startY - 35, { size: 36, bold: true, color: '#000000' });

    const rightX = width - margins.right - 170;
    this.drawText(this.strings.invoiceNumber, rightX, startY - 20, { size: 8, color: '#808080' });
    this.drawText(invoice.header.id, rightX, startY - 33, { size: 12, bold: true, color: '#000000' });

    this.drawText(this.strings.issueDate, rightX, startY - 50, { size: 8, color: '#808080' });
    this.drawText(this.formatInvoiceDateFull(), rightX, startY - 63, { size: 10, color: '#333333' });

    this.drawText(this.strings.dueDate, rightX, startY - 78, { size: 8, color: '#808080' });
    this.drawText(this.formatDateFull(this.getDueDate()), rightX, startY - 91, { size: 10, bold: true, color: '#000000' });

    this.renderContext.currentY -= 100;
  }

  // ===========================================================================
  // PARTIES
  // ===========================================================================

  private renderMinimalParties(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;
    const halfWidth = (width - margins.left - margins.right) / 2 - 20;

    // Seller
    this.drawText(this.strings.seller.toUpperCase(), margins.left, startY, { size: 8, color: '#808080' });
    this.drawLine(margins.left, startY - 4, margins.left + 60, startY - 4, { color: '#333333', width: 0.5 });

    let y = startY - 20;
    this.drawText(invoice.seller.name, margins.left, y, { size: 12, bold: true, color: '#000000' });
    if (invoice.seller.address) {
      const a = invoice.seller.address;
      y -= 18;
      if (a.street) { this.drawText(a.street, margins.left, y, { size: 9, color: '#333333' }); y -= 12; }
      this.drawText(`${a.postalCode} ${a.city}`, margins.left, y, { size: 9, color: '#333333' }); y -= 12;
      this.drawText(a.countryCode, margins.left, y, { size: 9, color: '#333333' });
    }
    if (invoice.seller.vatId) {
      y -= 14;
      this.drawText(`TVA: ${invoice.seller.vatId}`, margins.left, y, { size: 8, color: '#808080' });
    }

    // Buyer
    const buyerX = margins.left + halfWidth + 40;
    this.drawText(this.strings.buyer.toUpperCase(), buyerX, startY, { size: 8, color: '#808080' });
    this.drawLine(buyerX, startY - 4, buyerX + 60, startY - 4, { color: '#333333', width: 0.5 });

    y = startY - 20;
    this.drawText(invoice.buyer.name, buyerX, y, { size: 12, bold: true, color: '#000000' });
    if (invoice.buyer.address) {
      const a = invoice.buyer.address;
      y -= 18;
      if (a.street) { this.drawText(a.street, buyerX, y, { size: 9, color: '#333333' }); y -= 12; }
      this.drawText(`${a.postalCode} ${a.city}`, buyerX, y, { size: 9, color: '#333333' }); y -= 12;
      this.drawText(a.countryCode, buyerX, y, { size: 9, color: '#333333' });
    }
    if (invoice.buyer.vatId) {
      y -= 14;
      this.drawText(`TVA: ${invoice.buyer.vatId}`, buyerX, y, { size: 8, color: '#808080' });
    }

    this.renderContext.currentY = startY - 100;
  }

  // ===========================================================================
  // LINE ITEMS
  // ===========================================================================

  private renderMinimalLineItems(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const tableWidth = width - margins.left - margins.right;
    const colWidths = {
      description: tableWidth * 0.40,
      quantity: tableWidth * 0.12,
      unitPrice: tableWidth * 0.18,
      vatRate: tableWidth * 0.12,
      total: tableWidth * 0.18,
    };

    const drawTableHeader = (y: number) => {
      let hx = margins.left;
      this.drawText(this.strings.description.toUpperCase(), hx, y, { bold: true, color: '#000000', size: 8 });
      hx += colWidths.description;
      this.drawText(this.strings.quantity.toUpperCase(), hx, y, { bold: true, color: '#000000', size: 8 });
      hx += colWidths.quantity;
      this.drawText(this.strings.unitPrice.toUpperCase(), hx, y, { bold: true, color: '#000000', size: 8 });
      hx += colWidths.unitPrice;
      this.drawText(this.strings.vatRate.toUpperCase(), hx, y, { bold: true, color: '#000000', size: 8 });
      hx += colWidths.vatRate;
      this.drawText(this.strings.lineTotal.toUpperCase(), hx, y, { bold: true, color: '#000000', size: 8 });
    };

    drawTableHeader(startY);
    this.drawLine(margins.left, startY - 5, width - margins.right, startY - 5, { color: '#000000', width: 1 });

    let y = startY - 12;

    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];
      const rowHeight = 20;

      const pageBefore = this.renderContext.pageNumber;
      this.checkPageBreak(rowHeight + 5);
      if (this.renderContext.pageNumber > pageBefore) {
        y = this.renderContext.currentY;
        drawTableHeader(y);
        this.drawLine(margins.left, y - 5, width - margins.right, y - 5, { color: '#000000', width: 1 });
        y -= 12;
      }

      this.drawLine(margins.left, y, width - margins.right, y, { color: '#e5e5e5', width: 0.3 });

      let x = margins.left;
      this.drawText(line.description, x, y - 13, { size: 9, color: '#333333' });
      x += colWidths.description;
      this.drawText(String(line.quantity), x, y - 13, { size: 9, color: '#333333' });
      x += colWidths.quantity;
      this.drawText(formatAmount(line.unitPrice) + ' €', x, y - 13, { size: 9, color: '#333333' });
      x += colWidths.unitPrice;
      this.drawText(`${formatAmount(line.vatRate * 100)}%`, x, y - 13, { size: 9, color: '#333333' });
      x += colWidths.vatRate;
      this.drawText(formatAmount(line.lineTotal) + ' €', x, y - 13, { size: 9, bold: true, color: '#000000' });

      y -= rowHeight;
    }

    this.drawLine(margins.left, y, width - margins.right, y, { color: '#000000', width: 0.5 });
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
    const rightX = margins.left + contentWidth * 0.50 + 15;

    // ---- LEFT: Payment terms ----
    if (this.context.options.showPaymentTerms) {
      this.drawText(this.strings.paymentTerms.toUpperCase(), margins.left, startY, { size: 8, bold: true, color: '#000000' });
      this.drawLine(margins.left, startY - 4, margins.left + 180, startY - 4, { color: '#333333', width: 0.5 });

      let py = startY - 20;
      if (invoice.payment) {
        if (invoice.payment.iban) {
          this.drawText(this.strings.iban.toUpperCase(), margins.left + 5, py, { size: 7, color: '#808080' });
          this.drawText(invoice.payment.iban, margins.left + 5, py - 10, { size: 9, color: '#000000' });
          py -= 22;
        }
        if (invoice.payment.bic) {
          this.drawText(this.strings.bic.toUpperCase(), margins.left + 5, py, { size: 7, color: '#808080' });
          this.drawText(invoice.payment.bic, margins.left + 5, py - 10, { size: 9, color: '#000000' });
          py -= 22;
        }
        if (invoice.payment.dueDate) {
          this.drawText(this.strings.dueDate.toUpperCase(), margins.left + 5, py, { size: 7, color: '#808080' });
          this.drawText(this.formatDateFull(invoice.payment.dueDate), margins.left + 5, py - 10, { size: 9, bold: true, color: '#000000' });
          py -= 22;
        }
        if (invoice.payment.termsDescription) {
          this.drawText(invoice.payment.termsDescription, margins.left + 5, py, { size: 8, color: '#333333' });
        }
      }
    }

    // ---- RIGHT: Totals ----
    let y = startY;

    this.drawText(this.strings.subtotal, rightX, y, { size: 9, color: '#333333' });
    this.drawText(formatAmount(summary.lineTotal) + ' €', rightX + 130, y, { size: 9, color: '#333333' });
    y -= 18;

    this.drawText(this.strings.taxTotal, rightX, y, { size: 9, color: '#333333' });
    this.drawText(formatAmount(summary.taxTotal) + ' €', rightX + 130, y, { size: 9, color: '#333333' });
    y -= 10;

    this.drawLine(rightX, y, rightX + 210, y, { color: '#000000', width: 1.5 });
    y -= 18;

    this.drawText(this.strings.grandTotal, rightX, y, { size: 14, bold: true, color: '#000000' });
    this.drawText(formatAmount(summary.grandTotal) + ' €', rightX + 130, y, { size: 14, bold: true, color: '#000000' });

    this.renderContext.currentY = y - 15;
  }

  // ===========================================================================
  // TAX BREAKDOWN - Below totals, right-aligned
  // ===========================================================================

  private renderTaxBreakdown(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const contentWidth = width - margins.left - margins.right;
    const rightX = margins.left + contentWidth * 0.50 + 15;

    this.drawText(this.strings.taxBreakdown.toUpperCase(), rightX, startY, { size: 8, bold: true, color: '#000000' });
    this.drawLine(rightX, startY - 4, rightX + 130, startY - 4, { color: '#333333', width: 0.5 });

    let y = startY - 20;

    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate}%`, rightX, y, { size: 9, color: '#333333' });
      this.drawText(formatAmount(taxSum.taxable) + ' €', rightX + 50, y, { size: 9, color: '#333333' });
      this.drawText(formatAmount(taxSum.taxAmount) + ' €', rightX + 130, y, { size: 9, bold: true, color: '#000000' });
      y -= 14;
    }

    this.renderContext.currentY = y - 10;
  }

  // ===========================================================================
  // CUSTOM FOOTER - Ultra-minimal: no background, just line + text
  // ===========================================================================

  protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void {
    const { margins } = this.context.options;
    const pageWidth = 595.28;
    const footerH = 40;
    const footerTop = margins.bottom + footerH;
    const contentW = pageWidth - margins.left - margins.right;
    const font = (this as any).getFont('Helvetica');
    const fontBold = (this as any).getFont('Helvetica-Bold');
    const black = (this as any).parseColor('#333333');
    const muted = (this as any).parseColor('#808080');
    const veryLight = (this as any).parseColor('#cccccc');

    page.drawText(this.getGeneratedDateText(), {
      x: margins.left, y: footerTop - 10, size: 7, font: fontBold, color: black,
    });
    page.drawLine({
      start: { x: margins.left, y: footerTop - 16 },
      end: { x: margins.left + contentW, y: footerTop - 16 },
      color: veryLight, thickness: 0.5,
    });
    page.drawText(`${pageNum} / ${totalPages}`, {
      x: margins.left, y: margins.bottom + 5, size: 8, font, color: muted,
    });
    page.drawText('@facturx/templates', {
      x: pageWidth - margins.right - 100, y: margins.bottom + 5, size: 7, font, color: veryLight,
    });
  }
}
