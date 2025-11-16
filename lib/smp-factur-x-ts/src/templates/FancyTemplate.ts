/**
 * @module FancyTemplate
 * @description Fancy, colorful template for Factur-X invoices
 *
 * Design inspired by InvoiceTemplateFancy from src/templates/
 * Features:
 * - Pink and blue color scheme
 * - Modern gradient header
 * - Colorful section highlights
 * - Perfect for creative businesses
 */

import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

export class FancyTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    return TemplateType.FANCY;
  }

  protected async renderContent(): Promise<void> {
    // Fancy gradient header with pink/blue theme
    await this.renderFancyHeader();

    // Spacing
    this.renderContext.currentY -= 30;

    // Parties section with colored boxes
    this.renderFancyParties();

    // Spacing
    this.renderContext.currentY -= 25;

    // Line items with alternating colors
    this.renderFancyLineItems();

    // Spacing
    this.renderContext.currentY -= 25;

    // Totals section with highlight
    this.renderFancyTotals();

    // Tax breakdown with pink accents
    if (this.context.options.showTaxBreakdown) {
      this.renderContext.currentY -= 30;
      this.renderFancyTaxBreakdown();
    }

    // Payment terms
    if (this.context.options.showPaymentTerms) {
      this.renderContext.currentY -= 30;
      this.renderPaymentTerms();
    }

    // Footer
    this.renderFancyFooter();
  }

  /**
   * Render fancy header with gradient effect simulation
   */
  private async renderFancyHeader(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const startY = this.renderContext.currentY;

    // Header background with pink gradient effect (simulated with overlapping rectangles)
    const headerHeight = 100;

    // Base pink background
    this.drawRect(
      margins.left,
      startY - headerHeight,
      width - margins.left - margins.right,
      headerHeight,
      { fillColor: '#db2777' } // Pink
    );

    // Blue accent on right side
    this.drawRect(
      width - margins.right - 150,
      startY - headerHeight,
      150,
      headerHeight,
      { fillColor: '#3b82f6' } // Blue
    );

    // Invoice title in white
    this.drawText(this.strings.invoice, margins.left + 20, startY - 35, {
      size: 32,
      bold: true,
      color: '#ffffff',
    });

    // Invoice details
    const invoice = this.context.invoice;
    this.drawText(
      `${this.strings.invoiceNumber}: ${invoice.header.id}`,
      margins.left + 20,
      startY - 60,
      { size: 11, color: '#ffffff' }
    );

    const dateStr = invoice.header.invoiceDate.toLocaleDateString();
    this.drawText(
      `${this.strings.invoiceDate}: ${dateStr}`,
      margins.left + 20,
      startY - 78,
      { size: 10, color: '#ffffff' }
    );

    this.renderContext.currentY -= headerHeight + 10;
  }

  /**
   * Render parties with colored boxes
   */
  private renderFancyParties(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const halfWidth = (width - margins.left - margins.right) / 2 - 10;

    // Seller box with pink accent
    this.drawRect(
      margins.left,
      startY - 120,
      halfWidth,
      120,
      { fillColor: '#fce7f3', borderColor: '#db2777', borderWidth: 2 }
    );

    this.drawText(this.strings.seller, margins.left + 10, startY - 20, {
      size: 12,
      bold: true,
      color: '#db2777',
    });

    this.drawText(invoice.seller.name, margins.left + 10, startY - 38, {
      size: 11,
      bold: true
    });

    if (invoice.seller.address) {
      const addr = invoice.seller.address;
      let y = startY - 55;
      if (addr.street) {
        this.drawText(addr.street, margins.left + 10, y, { size: 9 });
        y -= 14;
      }
      this.drawText(`${addr.postalCode} ${addr.city}`, margins.left + 10, y, { size: 9 });
      y -= 14;
      this.drawText(addr.countryCode, margins.left + 10, y, { size: 9 });
    }

    if (invoice.seller.vatId) {
      this.drawText(`TVA: ${invoice.seller.vatId}`, margins.left + 10, startY - 105, {
        size: 9,
        color: '#6b7280'
      });
    }

    // Buyer box with blue accent
    const buyerX = margins.left + halfWidth + 20;
    this.drawRect(
      buyerX,
      startY - 120,
      halfWidth,
      120,
      { fillColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: 2 }
    );

    this.drawText(this.strings.buyer, buyerX + 10, startY - 20, {
      size: 12,
      bold: true,
      color: '#3b82f6',
    });

    this.drawText(invoice.buyer.name, buyerX + 10, startY - 38, {
      size: 11,
      bold: true
    });

    if (invoice.buyer.address) {
      const addr = invoice.buyer.address;
      let y = startY - 55;
      if (addr.street) {
        this.drawText(addr.street, buyerX + 10, y, { size: 9 });
        y -= 14;
      }
      this.drawText(`${addr.postalCode} ${addr.city}`, buyerX + 10, y, { size: 9 });
      y -= 14;
      this.drawText(addr.countryCode, buyerX + 10, y, { size: 9 });
    }

    if (invoice.buyer.vatId) {
      this.drawText(`TVA: ${invoice.buyer.vatId}`, buyerX + 10, startY - 105, {
        size: 9,
        color: '#6b7280'
      });
    }

    this.renderContext.currentY -= 130;
  }

  /**
   * Render line items with fancy styling
   */
  private renderFancyLineItems(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const tableWidth = width - margins.left - margins.right;
    const colWidths = {
      description: tableWidth * 0.4,
      quantity: tableWidth * 0.15,
      unitPrice: tableWidth * 0.2,
      vatRate: tableWidth * 0.1,
      total: tableWidth * 0.15,
    };

    // Table header with gradient effect
    this.drawRect(margins.left, startY - 28, tableWidth, 28, {
      fillColor: '#3b82f6', // Blue
    });

    let x = margins.left + 8;
    this.drawText(this.strings.description, x, startY - 18, {
      bold: true,
      color: '#ffffff',
      size: 10
    });
    x += colWidths.description;
    this.drawText(this.strings.quantity, x, startY - 18, {
      bold: true,
      color: '#ffffff',
      size: 10
    });
    x += colWidths.quantity;
    this.drawText(this.strings.unitPrice, x, startY - 18, {
      bold: true,
      color: '#ffffff',
      size: 10
    });
    x += colWidths.unitPrice;
    this.drawText(this.strings.vatRate, x, startY - 18, {
      bold: true,
      color: '#ffffff',
      size: 10
    });
    x += colWidths.vatRate;
    this.drawText(this.strings.lineTotal, x, startY - 18, {
      bold: true,
      color: '#ffffff',
      size: 10
    });

    let y = startY - 28;

    // Lines with alternating colors
    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];
      const rowHeight = 22;

      // Check page break
      this.checkPageBreak(rowHeight + 50);
      if (this.renderContext.currentY > startY - 28) {
        y = this.renderContext.currentY;
        // Redraw header on new page
        this.drawRect(margins.left, y - 28, tableWidth, 28, {
          fillColor: '#3b82f6',
        });
        y -= 28;
      }

      // Alternate row colors with pink and blue tints
      const bgColor = i % 2 === 0 ? '#fce7f3' : '#eff6ff';
      this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, {
        fillColor: bgColor,
      });

      // Draw line data
      x = margins.left + 8;
      this.drawText(line.description, x, y - 14, { size: 9 });
      x += colWidths.description;
      this.drawText(String(line.quantity), x, y - 14, { size: 9 });
      x += colWidths.quantity;
      this.drawText(this.formatCurrency(line.unitPrice), x, y - 14, { size: 9 });
      x += colWidths.unitPrice;
      this.drawText(`${(line.vatRate * 100).toFixed(1)}%`, x, y - 14, { size: 9 });
      x += colWidths.vatRate;
      this.drawText(this.formatCurrency(line.lineTotal), x, y - 14, { size: 9, bold: true });

      y -= rowHeight;
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render totals with fancy highlight
   */
  private renderFancyTotals(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const totalsX = width - margins.right - 250;
    const totalsWidth = 230;

    // Background box for totals
    this.drawRect(
      totalsX - 10,
      startY - 90,
      totalsWidth,
      90,
      { fillColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1 }
    );

    let y = startY - 20;

    // Subtotal
    this.drawText(this.strings.subtotal, totalsX, y, { size: 10 });
    this.drawText(this.formatCurrency(summary.lineTotal), totalsX + 150, y, { size: 10 });
    y -= 22;

    // Tax total
    this.drawText(this.strings.taxTotal, totalsX, y, { size: 10 });
    this.drawText(this.formatCurrency(summary.taxTotal), totalsX + 150, y, { size: 10 });
    y -= 28;

    // Grand total with pink background highlight
    this.drawRect(totalsX - 10, y - 8, totalsWidth, 25, {
      fillColor: '#db2777',
    });

    this.drawText(this.strings.grandTotal, totalsX, y, {
      size: 13,
      bold: true,
      color: '#ffffff'
    });
    this.drawText(this.formatCurrency(summary.grandTotal), totalsX + 150, y, {
      size: 13,
      bold: true,
      color: '#ffffff'
    });

    this.renderContext.currentY = startY - 100;
  }

  /**
   * Render tax breakdown with pink accents
   */
  private renderFancyTaxBreakdown(): void {
    const { margins } = this.context.options;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    // Title with pink accent
    this.drawText(this.strings.taxBreakdown, margins.left, startY, {
      size: 12,
      bold: true,
      color: '#db2777',
    });

    let y = startY - 25;

    // Header
    this.drawRect(margins.left, y - 20, 300, 20, {
      fillColor: '#fce7f3',
    });

    this.drawText(this.strings.vatRate, margins.left + 10, y - 13, {
      size: 9,
      bold: true,
    });
    this.drawText(this.strings.taxBase, margins.left + 100, y - 13, {
      size: 9,
      bold: true,
    });
    this.drawText(this.strings.taxAmount, margins.left + 200, y - 13, {
      size: 9,
      bold: true,
    });

    y -= 20;

    // Tax summaries
    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate}%`, margins.left + 10, y, { size: 9 });
      this.drawText(this.formatCurrency(taxSum.taxable), margins.left + 100, y, { size: 9 });
      this.drawText(this.formatCurrency(taxSum.taxAmount), margins.left + 200, y, { size: 9 });
      y -= 18;
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render payment terms
   */
  private renderPaymentTerms(): void {
    const { margins } = this.context.options;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    // Title with blue accent
    this.drawText(this.strings.paymentTerms, margins.left, startY, {
      size: 12,
      bold: true,
      color: '#3b82f6',
    });

    let y = startY - 25;

    if (invoice.payment) {
      if (invoice.payment.iban) {
        this.drawText(`${this.strings.iban}: ${invoice.payment.iban}`, margins.left + 10, y, {
          size: 9,
        });
        y -= 16;
      }

      if (invoice.payment.bic) {
        this.drawText(`${this.strings.bic}: ${invoice.payment.bic}`, margins.left + 10, y, {
          size: 9,
        });
        y -= 16;
      }

      if (invoice.payment.dueDate) {
        this.drawText(
          `${this.strings.dueDate}: ${invoice.payment.dueDate.toLocaleDateString()}`,
          margins.left + 10,
          y,
          { size: 9 }
        );
        y -= 16;
      }

      if (invoice.payment.termsDescription) {
        this.drawText(invoice.payment.termsDescription, margins.left + 10, y, { size: 9 });
        y -= 16;
      }
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render fancy footer
   */
  private renderFancyFooter(): void {
    const { margins, customFooter } = this.context.options;
    const { width } = this.renderContext;

    const footerY = margins.bottom + 25;

    // Footer with gradient (pink to blue)
    this.drawRect(margins.left, footerY - 35, (width - margins.left - margins.right) / 2, 35, {
      fillColor: '#db2777', // Pink
    });

    this.drawRect(
      margins.left + (width - margins.left - margins.right) / 2,
      footerY - 35,
      (width - margins.left - margins.right) / 2,
      35,
      {
        fillColor: '#3b82f6', // Blue
      }
    );

    // Page number
    const pageText = `${this.strings.page} ${this.renderContext.pageNumber}`;
    this.drawText(pageText, margins.left + 10, footerY - 20, {
      size: 8,
      color: '#ffffff'
    });

    // Custom footer text
    if (customFooter) {
      const customX = width / 2 - 50;
      this.drawText(customFooter, customX, footerY - 20, {
        size: 8,
        color: '#ffffff'
      });
    }

    // Generated by
    const generatedText = 'Powered by @facturx/templates';
    const generatedX = width - margins.right - 160;
    this.drawText(generatedText, generatedX, footerY - 20, {
      size: 8,
      color: '#ffffff'
    });
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return amount.toFixed(2) + ' €';
  }
}
