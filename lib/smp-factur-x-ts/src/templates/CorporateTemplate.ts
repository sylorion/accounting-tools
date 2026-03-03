/**
 * @module CorporateTemplate
 * @description Professional corporate template for Factur-X invoices
 *
 * Features:
 * - Elegant gray, blue and gold color scheme
 * - Clean, professional design
 * - Structured layout with clear sections
 * - Perfect for established businesses
 */

import { PDFPage } from 'pdf-lib';
import { formatAmount } from '@facturx/core';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

export class CorporateTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    return TemplateType.CORPORATE;
  }

  protected async renderContent(): Promise<void> {
    await this.renderCorporateHeader();
    this.renderContext.currentY -= 25;

    this.renderCorporateParties();
    this.renderContext.currentY -= 25;

    this.renderCorporateLineItems();
    this.renderContext.currentY -= 15;

    this.checkPageBreak(120);
    this.renderPaymentAndTotals();

    if (this.context.options.showTaxBreakdown) {
      this.renderContext.currentY -= 15;
      this.checkPageBreak(60);
      this.renderTaxBreakdown();
    }
    // Page footer drawn automatically by base TemplateRenderer
  }

  // ===========================================================================
  // HEADER
  // ===========================================================================

  private async renderCorporateHeader(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const startY = this.renderContext.currentY;
    const invoice = this.context.invoice;

    const headerHeight = 95;

    // Gold accent line at top
    this.drawRect(margins.left, startY - 4, width - margins.left - margins.right, 4, { fillColor: '#b8a643' });

    // Light blue background
    this.drawRect(margins.left, startY - headerHeight, width - margins.left - margins.right, headerHeight - 4, { fillColor: '#d9e5f2' });

    // Seller company name (dynamic)
    this.drawText(invoice.seller.name, margins.left + 20, startY - 28, {
      size: 18, bold: true, color: '#293a73',
    });

    // Seller email if available
    if (invoice.seller.email) {
      this.drawText(invoice.seller.email, margins.left + 20, startY - 44, {
        size: 8, color: '#404040',
      });
    }

    // Document title on right (FACTURE / AVOIR / DEVIS)
    const docTitle = invoice.header.name || this.strings.invoice;
    const rightX = width - margins.right - 200;

    this.drawText(docTitle, rightX, startY - 22, {
      size: 20, bold: true, color: '#293a73',
    });

    // Info box
    this.drawRect(rightX - 10, startY - 88, 190, 58, {
      fillColor: '#ffffff', borderColor: '#293a73', borderWidth: 1,
    });

    this.drawText(`${this.strings.invoiceNumber}:`, rightX, startY - 42, { size: 8, color: '#999999' });
    this.drawText(invoice.header.id, rightX + 80, startY - 42, { size: 10, bold: true, color: '#293a73' });

    this.drawText(`${this.strings.issueDate}:`, rightX, startY - 58, { size: 8, color: '#999999' });
    this.drawText(this.formatInvoiceDateFull(), rightX + 80, startY - 58, { size: 9, color: '#293a73' });

    this.drawText(`${this.strings.dueDate}:`, rightX, startY - 74, { size: 8, color: '#999999' });
    this.drawText(this.formatDateFull(this.getDueDate()), rightX + 80, startY - 74, { size: 9, bold: true, color: '#b8a643' });

    this.renderContext.currentY -= headerHeight + 5;
  }

  // ===========================================================================
  // PARTIES
  // ===========================================================================

  private renderCorporateParties(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;
    const halfWidth = (width - margins.left - margins.right) / 2 - 15;

    // --- SELLER ---
    this.drawText(this.strings.seller.toUpperCase(), margins.left, startY, { size: 9, bold: true, color: '#b8a643' });
    this.drawLine(margins.left, startY - 5, margins.left + halfWidth, startY - 5, { color: '#b8a643', width: 1.5 });

    let y = startY - 20;
    this.drawRect(margins.left, y - 90, halfWidth, 90, { fillColor: '#ffffff', borderColor: '#ededed', borderWidth: 1 });

    this.drawText(invoice.seller.name, margins.left + 12, y - 18, { size: 11, bold: true, color: '#293a73' });
    if (invoice.seller.address) {
      const a = invoice.seller.address;
      let ay = y - 35;
      if (a.street) { this.drawText(a.street, margins.left + 12, ay, { size: 9 }); ay -= 13; }
      this.drawText(`${a.postalCode} ${a.city}`, margins.left + 12, ay, { size: 9 }); ay -= 13;
      this.drawText(a.countryCode, margins.left + 12, ay, { size: 9 });
    }
    if (invoice.seller.vatId) {
      this.drawText(`N° TVA: ${invoice.seller.vatId}`, margins.left + 12, y - 80, { size: 8, color: '#999999' });
    }

    // --- BUYER ---
    const buyerX = margins.left + halfWidth + 30;
    this.drawText(this.strings.buyer.toUpperCase(), buyerX, startY, { size: 9, bold: true, color: '#b8a643' });
    this.drawLine(buyerX, startY - 5, buyerX + halfWidth, startY - 5, { color: '#b8a643', width: 1.5 });

    y = startY - 20;
    this.drawRect(buyerX, y - 90, halfWidth, 90, { fillColor: '#ffffff', borderColor: '#ededed', borderWidth: 1 });

    this.drawText(invoice.buyer.name, buyerX + 12, y - 18, { size: 11, bold: true, color: '#293a73' });
    if (invoice.buyer.address) {
      const a = invoice.buyer.address;
      let ay = y - 35;
      if (a.street) { this.drawText(a.street, buyerX + 12, ay, { size: 9 }); ay -= 13; }
      this.drawText(`${a.postalCode} ${a.city}`, buyerX + 12, ay, { size: 9 }); ay -= 13;
      this.drawText(a.countryCode, buyerX + 12, ay, { size: 9 });
    }
    if (invoice.buyer.vatId) {
      this.drawText(`N° TVA: ${invoice.buyer.vatId}`, buyerX + 12, y - 80, { size: 8, color: '#999999' });
    }

    this.renderContext.currentY = startY - 120;
  }

  // ===========================================================================
  // LINE ITEMS
  // ===========================================================================

  private renderCorporateLineItems(): void {
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

    this.drawRect(margins.left, startY - 24, tableWidth, 24, { fillColor: '#293a73' });

    const drawTableHeader = (y: number) => {
      let hx = margins.left + 10;
      this.drawText(this.strings.description.toUpperCase(), hx, y - 16, { bold: true, color: '#ffffff', size: 8 });
      hx += colWidths.description;
      this.drawText(this.strings.quantity.toUpperCase(), hx, y - 16, { bold: true, color: '#ffffff', size: 8 });
      hx += colWidths.quantity;
      this.drawText(this.strings.unitPrice.toUpperCase(), hx, y - 16, { bold: true, color: '#ffffff', size: 8 });
      hx += colWidths.unitPrice;
      this.drawText(this.strings.vatRate.toUpperCase(), hx, y - 16, { bold: true, color: '#ffffff', size: 8 });
      hx += colWidths.vatRate;
      this.drawText(this.strings.lineTotal.toUpperCase(), hx, y - 16, { bold: true, color: '#ffffff', size: 8 });
    };

    drawTableHeader(startY);
    let y = startY - 24;

    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];
      const rowHeight = 22;

      const pageBefore = this.renderContext.pageNumber;
      this.checkPageBreak(rowHeight + 5);
      if (this.renderContext.pageNumber > pageBefore) {
        y = this.renderContext.currentY;
        this.drawRect(margins.left, y - 24, tableWidth, 24, { fillColor: '#293a73' });
        drawTableHeader(y);
        y -= 24;
      }

      const bgColor = i % 2 === 0 ? '#ffffff' : '#f7f7f7';
      this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, { fillColor: bgColor });
      this.drawLine(margins.left, y - rowHeight, margins.left + tableWidth, y - rowHeight, { color: '#ededed', width: 0.5 });

      let x = margins.left + 10;
      this.drawText(line.description, x, y - 14, { size: 9 });
      x += colWidths.description;
      this.drawText(String(line.quantity), x, y - 14, { size: 9 });
      x += colWidths.quantity;
      this.drawText(formatAmount(line.unitPrice) + ' €', x, y - 14, { size: 9 });
      x += colWidths.unitPrice;
      this.drawText(`${formatAmount(line.vatRate * 100)}%`, x, y - 14, { size: 9 });
      x += colWidths.vatRate;
      this.drawText(formatAmount(line.lineTotal) + ' €', x, y - 14, { size: 9, bold: true, color: '#293a73' });

      y -= rowHeight;
    }

    this.renderContext.currentY = y - 12;
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
    const leftW = contentWidth * 0.48;
    const rightX = margins.left + contentWidth * 0.52;
    const rightW = contentWidth * 0.48;

    // ---- LEFT: Payment info ----
    if (this.context.options.showPaymentTerms) {
      this.drawText(this.strings.paymentTerms.toUpperCase(), margins.left, startY, { size: 9, bold: true, color: '#b8a643' });
      this.drawLine(margins.left, startY - 5, margins.left + leftW, startY - 5, { color: '#b8a643', width: 1 });

      let py = startY - 22;
      if (invoice.payment) {
        if (invoice.payment.iban) {
          this.drawText(`${this.strings.iban}:`, margins.left + 8, py, { size: 7, color: '#999999' });
          this.drawText(invoice.payment.iban, margins.left + 50, py, { size: 8, bold: true, color: '#293a73' });
          py -= 14;
        }
        if (invoice.payment.bic) {
          this.drawText(`${this.strings.bic}:`, margins.left + 8, py, { size: 7, color: '#999999' });
          this.drawText(invoice.payment.bic, margins.left + 50, py, { size: 8, bold: true, color: '#293a73' });
          py -= 14;
        }
        if (invoice.payment.dueDate) {
          this.drawText(`${this.strings.dueDate}:`, margins.left + 8, py, { size: 7, color: '#999999' });
          this.drawText(this.formatDateFull(invoice.payment.dueDate), margins.left + 50, py, { size: 8, bold: true, color: '#b8a643' });
          py -= 14;
        }
        if (invoice.payment.termsDescription) {
          this.drawText(invoice.payment.termsDescription, margins.left + 8, py, { size: 8, color: '#404040' });
        }
      }
    }

    // ---- RIGHT: Totals with corporate styling ----
    let y = startY - 15;

    this.drawText(this.strings.subtotal, rightX, y, { size: 10 });
    this.drawText(formatAmount(summary.lineTotal) + ' €', rightX + rightW - 80, y, { size: 10 });
    y -= 20;

    this.drawText(this.strings.taxTotal, rightX, y, { size: 10 });
    this.drawText(formatAmount(summary.taxTotal) + ' €', rightX + rightW - 80, y, { size: 10 });

    y -= 8;
    this.drawLine(rightX, y, rightX + rightW, y, { color: '#293a73', width: 0.5 });
    y -= 3;
    this.drawLine(rightX, y, rightX + rightW, y, { color: '#293a73', width: 1.5 });
    y -= 18;

    this.drawRect(rightX - 5, y - 8, rightW + 5, 26, { fillColor: '#d9e5f2', borderColor: '#293a73', borderWidth: 1 });
    this.drawText(this.strings.grandTotal, rightX, y, { size: 12, bold: true, color: '#293a73' });
    this.drawText(formatAmount(summary.grandTotal) + ' €', rightX + rightW - 80, y, { size: 12, bold: true, color: '#293a73' });

    this.renderContext.currentY = y - 20;
  }

  // ===========================================================================
  // TAX BREAKDOWN - right-aligned below totals
  // ===========================================================================

  private renderTaxBreakdown(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const contentWidth = width - margins.left - margins.right;
    const rightX = margins.left + contentWidth * 0.52;

    this.drawText(this.strings.taxBreakdown.toUpperCase(), rightX, startY, { size: 9, bold: true, color: '#b8a643' });
    this.drawLine(rightX, startY - 4, rightX + 150, startY - 4, { color: '#b8a643', width: 0.5 });

    let y = startY - 20;
    this.drawText(this.strings.vatRate, rightX, y, { size: 8, bold: true, color: '#999999' });
    this.drawText(this.strings.taxBase, rightX + 60, y, { size: 8, bold: true, color: '#999999' });
    this.drawText(this.strings.taxAmount, rightX + 140, y, { size: 8, bold: true, color: '#999999' });
    y -= 16;

    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate}%`, rightX, y, { size: 9 });
      this.drawText(formatAmount(taxSum.taxable) + ' €', rightX + 60, y, { size: 9 });
      this.drawText(formatAmount(taxSum.taxAmount) + ' €', rightX + 140, y, { size: 9, bold: true, color: '#293a73' });
      y -= 14;
    }

    this.renderContext.currentY = y - 10;
  }

  // ===========================================================================
  // CUSTOM FOOTER - Corporate gray/gold/blue style
  // ===========================================================================

  protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void {
    const { margins } = this.context.options;
    const pageWidth = 595.28;
    const footerH = 40;
    const footerTop = margins.bottom + footerH;
    const contentW = pageWidth - margins.left - margins.right;
    const font = (this as any).getFont('Helvetica');
    const fontBold = (this as any).getFont('Helvetica-Bold');

    const lightGray = (this as any).parseColor('#f7f7f7');
    const gold = (this as any).parseColor('#b8a643');
    const darkText = (this as any).parseColor('#404040');
    const mutedText = (this as any).parseColor('#999999');

    // Light gray background
    page.drawRectangle({
      x: margins.left, y: margins.bottom,
      width: contentW, height: footerH,
      color: lightGray,
    });

    // Gold accent line at top of footer
    page.drawRectangle({
      x: margins.left, y: margins.bottom + footerH - 2,
      width: contentW, height: 2,
      color: gold,
    });

    // Generation date (bold)
    page.drawText(this.getGeneratedDateText(), {
      x: margins.left + 15, y: footerTop - 16,
      size: 8, font: fontBold, color: darkText,
    });

    // Page number
    page.drawText(`${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`, {
      x: margins.left + 15, y: footerTop - 30,
      size: 8, font, color: darkText,
    });

    // Powered by
    page.drawText('@facturx/templates', {
      x: pageWidth - margins.right - 130, y: footerTop - 30,
      size: 8, font, color: mutedText,
    });
  }
}
