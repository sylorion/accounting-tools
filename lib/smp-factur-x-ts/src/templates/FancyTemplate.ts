/**
 * @module FancyTemplate
 * @description Elegant, premium template for Factur-X invoices
 *
 * Features:
 * - Elegant, luxurious design
 * - Gold and dark color scheme
 * - Decorative elements and borders
 * - Premium typography
 * - Perfect for high-end services and luxury goods
 */

import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

export class FancyTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    return TemplateType.FANCY;
  }

  protected async renderContent(): Promise<void> {
    // Decorative header border
    this.renderDecorativeHeader();

    // Header with logo space
    await this.renderHeader();

    // Spacing
    this.renderContext.currentY -= 30;

    // Parties with elegant boxes
    this.renderPartiesWithBoxes();

    // Spacing
    this.renderContext.currentY -= 30;

    // Line items with alternating colors
    this.renderLineItems();

    // Spacing
    this.renderContext.currentY -= 30;

    // Totals with highlight box
    this.renderTotalsWithHighlight();

    // Tax breakdown
    if (this.context.options.showTaxBreakdown) {
      this.renderContext.currentY -= 30;
      this.renderTaxBreakdown();
    }

    // Payment terms
    if (this.context.options.showPaymentTerms) {
      this.renderContext.currentY -= 30;
      this.renderPaymentTerms();
    }

    // Decorative footer
    this.renderDecorativeFooter();
  }

  /**
   * Render decorative header border
   */
  private renderDecorativeHeader(): void {
    const { margins } = this.context.options;
    const { width, height } = this.renderContext;
    const { theme } = this.context;

    // Top accent line (gold)
    this.drawLine(margins.left, height - margins.top + 10, width - margins.right, height - margins.top + 10, {
      color: theme.accentColor,
      width: 3,
    });

    // Thinner line below
    this.drawLine(margins.left, height - margins.top + 5, width - margins.right, height - margins.top + 5, {
      color: theme.secondaryColor,
      width: 1,
    });
  }

  /**
   * Render parties with elegant boxes
   */
  private renderPartiesWithBoxes(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { theme, invoice } = this.context;
    const startY = this.renderContext.currentY;

    const boxWidth = (width - margins.left - margins.right - 30) / 2;
    const boxHeight = 120;

    // Seller box with accent border
    this.drawRect(margins.left, startY - boxHeight, boxWidth, boxHeight, {
      fillColor: theme.backgroundColor,
      borderColor: theme.accentColor,
      borderWidth: 2,
    });

    // Seller title
    this.drawText(this.strings.seller.toUpperCase(), margins.left + 15, startY - 25, {
      size: 11,
      bold: true,
      color: theme.accentColor,
    });

    // Seller details
    let y = startY - 45;
    this.drawText(invoice.seller.name, margins.left + 15, y, { size: 10, bold: true });
    y -= 18;
    if (invoice.seller.address) {
      this.drawText(invoice.seller.address.street || '', margins.left + 15, y, { size: 9 });
      y -= 15;
      const cityLine = `${invoice.seller.address.postalCode || ''} ${invoice.seller.address.city || ''}`;
      this.drawText(cityLine, margins.left + 15, y, { size: 9 });
      y -= 15;
      this.drawText(invoice.seller.address.countryCode || '', margins.left + 15, y, { size: 9 });
    }

    // Buyer box with accent border
    const buyerX = margins.left + boxWidth + 30;
    this.drawRect(buyerX, startY - boxHeight, boxWidth, boxHeight, {
      fillColor: theme.backgroundColor,
      borderColor: theme.accentColor,
      borderWidth: 2,
    });

    // Buyer title
    this.drawText(this.strings.buyer.toUpperCase(), buyerX + 15, startY - 25, {
      size: 11,
      bold: true,
      color: theme.accentColor,
    });

    // Buyer details
    y = startY - 45;
    this.drawText(invoice.buyer.name, buyerX + 15, y, { size: 10, bold: true });
    y -= 18;
    if (invoice.buyer.address) {
      this.drawText(invoice.buyer.address.street || '', buyerX + 15, y, { size: 9 });
      y -= 15;
      const cityLine = `${invoice.buyer.address.postalCode || ''} ${invoice.buyer.address.city || ''}`;
      this.drawText(cityLine, buyerX + 15, y, { size: 9 });
      y -= 15;
      this.drawText(invoice.buyer.address.countryCode || '', buyerX + 15, y, { size: 9 });
    }

    this.renderContext.currentY = startY - boxHeight - 10;
  }

  /**
   * Render totals with highlight box
   */
  private renderTotalsWithHighlight(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { theme, summary } = this.context;
    const startY = this.renderContext.currentY;

    const totalsWidth = 280;
    const totalsX = width - margins.right - totalsWidth;
    const lineHeight = 25;

    // Highlight box for grand total
    this.drawRect(totalsX, startY - lineHeight * 4, totalsWidth, lineHeight, {
      fillColor: theme.accentColor,
    });

    let y = startY;

    // Subtotal
    this.drawText(this.strings.subtotal, totalsX + 10, y, { size: 10 });
    this.drawText(this.formatCurrency(summary.taxBasis), totalsX + totalsWidth - 80, y, {
      size: 10,
    });
    y -= lineHeight;

    // Tax total
    this.drawText(this.strings.taxTotal, totalsX + 10, y, { size: 10 });
    this.drawText(this.formatCurrency(summary.taxTotal), totalsX + totalsWidth - 80, y, {
      size: 10,
    });
    y -= lineHeight;

    // Separator line
    this.drawLine(totalsX + 10, y + 10, totalsX + totalsWidth - 10, y + 10, {
      color: theme.accentColor,
      width: 1,
    });
    y -= lineHeight;

    // Grand total (in highlight box)
    this.drawText(this.strings.grandTotal.toUpperCase(), totalsX + 10, y, {
      size: 12,
      bold: true,
      color: '#FFFFFF',
    });
    this.drawText(this.formatCurrency(summary.grandTotal), totalsX + totalsWidth - 80, y, {
      size: 12,
      bold: true,
      color: '#FFFFFF',
    });

    this.renderContext.currentY = y - 30;
  }

  /**
   * Render tax breakdown section
   */
  private renderTaxBreakdown(): void {
    const { margins } = this.context.options;
    const { theme, summary } = this.context;
    const startY = this.renderContext.currentY;

    // Title with underline
    this.drawText(this.strings.taxBreakdown.toUpperCase(), margins.left, startY, {
      size: 11,
      bold: true,
      color: theme.accentColor,
    });

    this.drawLine(margins.left, startY - 15, margins.left + 150, startY - 15, {
      color: theme.accentColor,
      width: 2,
    });

    let y = startY - 35;

    // Header
    this.drawText(this.strings.vatRate, margins.left + 10, y, {
      size: 9,
      bold: true,
    });
    this.drawText(this.strings.taxBase, margins.left + 100, y, {
      size: 9,
      bold: true,
    });
    this.drawText(this.strings.taxAmount, margins.left + 200, y, {
      size: 9,
      bold: true,
    });

    y -= 25;

    // Tax summaries
    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate}%`, margins.left + 10, y, { size: 9 });
      this.drawText(`${this.formatCurrency(taxSum.taxable)}`, margins.left + 100, y, {
        size: 9,
      });
      this.drawText(`${this.formatCurrency(taxSum.taxAmount)}`, margins.left + 200, y, {
        size: 9,
      });
      y -= 18;
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render payment terms
   */
  private renderPaymentTerms(): void {
    const { margins } = this.context.options;
    const { theme, invoice } = this.context;
    const startY = this.renderContext.currentY;

    // Title with underline
    this.drawText(this.strings.paymentTerms.toUpperCase(), margins.left, startY, {
      size: 11,
      bold: true,
      color: theme.accentColor,
    });

    this.drawLine(margins.left, startY - 15, margins.left + 150, startY - 15, {
      color: theme.accentColor,
      width: 2,
    });

    let y = startY - 35;

    // Payment details
    if (invoice.payment) {
      this.drawText(
        `${this.strings.paymentMeans}: ${this.getPaymentMeansLabel(invoice.payment.meansCode)}`,
        margins.left + 10,
        y,
        { size: 9 }
      );
      y -= 18;

      if (invoice.payment.iban) {
        this.drawText(`${this.strings.iban}: ${invoice.payment.iban}`, margins.left + 10, y, {
          size: 9,
        });
        y -= 18;
      }

      if (invoice.payment.bic) {
        this.drawText(`${this.strings.bic}: ${invoice.payment.bic}`, margins.left + 10, y, {
          size: 9,
        });
        y -= 18;
      }

      if (invoice.payment.dueDate) {
        this.drawText(
          `${this.strings.dueDate}: ${invoice.payment.dueDate.toLocaleDateString()}`,
          margins.left + 10,
          y,
          { size: 9 }
        );
        y -= 18;
      }

      if (invoice.payment.termsDescription) {
        this.drawText(invoice.payment.termsDescription, margins.left + 10, y, { size: 9 });
        y -= 18;
      }
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render decorative footer
   */
  private renderDecorativeFooter(): void {
    const { margins, customFooter } = this.context.options;
    const { width } = this.renderContext;
    const { theme } = this.context;

    const footerY = margins.bottom + 30;

    // Decorative top line
    this.drawLine(margins.left, footerY + 10, width - margins.right, footerY + 10, {
      color: theme.accentColor,
      width: 2,
    });

    // Footer background
    this.drawRect(margins.left, footerY - 30, width - margins.left - margins.right, 30, {
      fillColor: theme.footerBackground,
    });

    // Page number
    const pageText = `${this.strings.page} ${this.renderContext.pageNumber}`;
    this.drawText(pageText, margins.left + 10, footerY - 18, {
      size: 8,
      color: theme.accentColor,
    });

    // Custom footer text
    if (customFooter) {
      const customX = width / 2 - 50;
      this.drawText(customFooter, customX, footerY - 18, { size: 8 });
    }

    // Generated by
    const generatedText = 'Generated by @facturx/templates - Fancy Edition';
    const generatedX = width - margins.right - 200;
    this.drawText(generatedText, generatedX, footerY - 18, {
      size: 8,
      color: theme.accentColor,
    });
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return amount.toFixed(2) + ' €';
  }

  /**
   * Get payment means label
   */
  private getPaymentMeansLabel(code: number): string {
    const labels: Record<number, string> = {
      1: 'Not defined',
      10: 'Cash',
      20: 'Check',
      30: 'Credit transfer',
      31: 'Debit transfer',
      42: 'Payment to bank account',
      48: 'Bank card',
      49: 'Direct debit',
      57: 'Standing agreement',
      58: 'SEPA credit transfer',
      59: 'SEPA direct debit',
    };
    return labels[code] || `Code ${code}`;
  }
}
