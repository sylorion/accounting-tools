/**
 * @module ModernTemplate
 * @description Modern, clean template for Factur-X invoices
 *
 * Features:
 * - Clean, professional design
 * - Blue color scheme
 * - Compact layout: payment left, totals right, tax below
 * - Optimized for readability
 */

import { PDFPage } from 'pdf-lib';
import { formatAmount } from '@facturx/core';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

export class ModernTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    return TemplateType.MODERN;
  }

  protected async renderContent(): Promise<void> {
    await this.renderHeader();
    this.renderContext.currentY -= 20;

    this.renderParties();
    this.renderContext.currentY -= 20;

    this.renderLineItems();
    this.renderContext.currentY -= 15;

    // Side-by-side: payment terms (left) + totals (right)
    this.checkPageBreak(120);
    await this.renderPaymentAndTotals();

    // Tax breakdown below totals
    if (this.context.options.showTaxBreakdown) {
      this.renderContext.currentY -= 15;
      this.checkPageBreak(60);
      this.renderTaxBreakdown();
    }
  }

  // ===========================================================================
  // PAYMENT (left) + TOTALS (right) - Side by side
  // ===========================================================================

  private async renderPaymentAndTotals(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice, summary } = this.context;
    const startY = this.renderContext.currentY;

    const contentWidth = width - margins.left - margins.right;
    const leftWidth = contentWidth * 0.50;
    const rightX = margins.left + leftWidth + 20;

    // ---- LEFT: Payment terms ----
    let currentPaymentY = startY;
    if (this.context.options.showPaymentTerms) {
      this.drawText(this.strings.paymentTerms, margins.left, startY, {
        size: 11, bold: true, color: '#2563eb',
      });

      let y = startY - 20;

      if (invoice.payment) {
        this.drawText(
          `${this.strings.paymentMeans}: ${this.getPaymentMeansLabel(invoice.payment.meansCode)}`,
          margins.left + 5, y, { size: 9 }
        );
        y -= 15;

        if (invoice.payment.iban) {
          this.drawText(`${this.strings.iban}: ${invoice.payment.iban}`, margins.left + 5, y, { size: 9 });
          y -= 15;
        }
        if (invoice.payment.bic) {
          this.drawText(`${this.strings.bic}: ${invoice.payment.bic}`, margins.left + 5, y, { size: 9 });
          y -= 15;
        }
        if (invoice.payment.dueDate) {
          this.drawText(
            `${this.strings.dueDate}: ${this.formatDateFull(invoice.payment.dueDate)}`,
            margins.left + 5, y, { size: 9 }
          );
          y -= 15;
        }
        if (invoice.payment.termsDescription) {
          this.drawText(invoice.payment.termsDescription, margins.left + 5, y, { size: 9 });
          y -= 15;
        }
      }

      currentPaymentY = y;

      // QR code paiement
      const paymentLink = this.context.options.paymentLink ||
        `https://pay.services.ceo/invoices/${this.context.invoice.header.id}`;
      const qrSize = 80;
      const qrX = margins.left + 5;
      const minY = margins.bottom + TemplateRenderer.PAGE_FOOTER_HEIGHT + 5;
      const qrY = Math.max(currentPaymentY - qrSize, minY);
      await this.renderQRCode(qrX, qrY, paymentLink, qrSize, 'Scannez pour payer', '#2563eb');
    }

    // ---- RIGHT: Totals ----
    let y = startY;

    this.drawText(this.strings.subtotal, rightX, y, { size: 10 });
    this.drawText(formatAmount(summary.lineTotal) + ' €', rightX + 130, y, { size: 10 });
    y -= 20;

    this.drawText(this.strings.taxTotal, rightX, y, { size: 10 });
    this.drawText(formatAmount(summary.taxTotal) + ' €', rightX + 130, y, { size: 10 });
    y -= 25;

    // Grand total highlight
    const totalBoxW = contentWidth - leftWidth - 10;
    this.drawRect(rightX - 10, y - 8, totalBoxW, 28, { fillColor: '#2563eb' });
    this.drawText(this.strings.grandTotal, rightX, y, { size: 13, bold: true, color: '#ffffff' });
    this.drawText(formatAmount(summary.grandTotal) + ' €', rightX + 130, y, { size: 13, bold: true, color: '#ffffff' });

    this.renderContext.currentY = y - 20;
  }

  // ===========================================================================
  // TAX BREAKDOWN - Below totals
  // ===========================================================================

  private renderTaxBreakdown(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const contentWidth = width - margins.left - margins.right;
    const rightX = margins.left + contentWidth * 0.50 + 20;

    // Title aligned with totals column
    this.drawText(this.strings.taxBreakdown, rightX, startY, { size: 10, bold: true, color: '#2563eb' });

    let y = startY - 18;

    // Header
    this.drawText(this.strings.vatRate, rightX, y, { size: 8, bold: true, color: '#64748b' });
    this.drawText(this.strings.taxBase, rightX + 50, y, { size: 8, bold: true, color: '#64748b' });
    this.drawText(this.strings.taxAmount, rightX + 130, y, { size: 8, bold: true, color: '#64748b' });
    y -= 16;

    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate}%`, rightX, y, { size: 9 });
      this.drawText(formatAmount(taxSum.taxable) + ' €', rightX + 50, y, { size: 9 });
      this.drawText(formatAmount(taxSum.taxAmount) + ' €', rightX + 130, y, { size: 9 });
      y -= 14;
    }

    this.renderContext.currentY = y - 10;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private getPaymentMeansLabel(code: number): string {
    const labels: Record<number, string> = {
      10: 'Especes', 20: 'Cheque', 30: 'Virement',
      42: 'Virement bancaire', 48: 'Carte bancaire',
      49: 'Prelevement', 58: 'Virement SEPA', 59: 'Prelevement SEPA',
    };
    return labels[code] || `Code ${code}`;
  }

  // ===========================================================================
  // CUSTOM FOOTER - Modern blue/gray clean style
  // ===========================================================================

  protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void {
    const { margins } = this.context.options;
    const pageWidth = 595.28;
    const footerH = 40;
    const footerTop = margins.bottom + footerH;
    const contentW = pageWidth - margins.left - margins.right;
    const font = (this as any).getFont('Helvetica');
    const fontBold = (this as any).getFont('Helvetica-Bold');
    const bgColor = (this as any).parseColor('#f1f5f9');
    const primary = (this as any).parseColor('#2563eb');
    const text = (this as any).parseColor('#1e293b');
    const secondary = (this as any).parseColor('#64748b');

    page.drawRectangle({
      x: margins.left, y: margins.bottom, width: contentW, height: footerH, color: bgColor,
    });
    page.drawRectangle({
      x: margins.left, y: margins.bottom + footerH - 2, width: contentW, height: 2, color: primary,
    });

    page.drawText(this.getGeneratedDateText(), {
      x: margins.left + 10, y: footerTop - 16, size: 8, font: fontBold, color: primary,
    });
    page.drawText(`${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`, {
      x: margins.left + 10, y: footerTop - 30, size: 8, font, color: text,
    });
    page.drawText('@facturx/templates', {
      x: pageWidth - margins.right - 120, y: footerTop - 30, size: 8, font, color: secondary,
    });
  }
}
