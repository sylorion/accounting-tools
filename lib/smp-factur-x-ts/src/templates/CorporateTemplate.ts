/**
 * @module CorporateTemplate
 * @description Professional corporate template for Factur-X invoices
 *
 * Features:
 * - Elegant gray and blue color scheme
 * - Clean, professional design
 * - Structured layout with clear sections
 * - Perfect for established businesses
 */

import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

export class CorporateTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    // Using BRAND type as CORPORATE doesn't exist in enum
    return TemplateType.BRAND;
  }

  protected async renderContent(): Promise<void> {
    // Corporate header with professional styling
    await this.renderCorporateHeader();

    // Spacing
    this.renderContext.currentY -= 30;

    // Parties section with clean layout
    this.renderCorporateParties();

    // Spacing
    this.renderContext.currentY -= 30;

    // Line items with professional table
    this.renderCorporateLineItems();

    // Spacing
    this.renderContext.currentY -= 25;

    // Summary and totals
    this.renderCorporateTotals();

    // Tax breakdown
    if (this.context.options.showTaxBreakdown) {
      this.renderContext.currentY -= 35;
      this.renderTaxBreakdown();
    }

    // Payment information
    if (this.context.options.showPaymentTerms) {
      this.renderContext.currentY -= 35;
      this.renderPaymentInfo();
    }

    // Footer
    this.renderCorporateFooter();
  }

  /**
   * Render corporate header
   */
  private async renderCorporateHeader(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const startY = this.renderContext.currentY;

    // Top accent line in gold
    this.drawRect(
      margins.left,
      startY - 4,
      width - margins.left - margins.right,
      4,
      { fillColor: '#b8a643' } // Gold
    );

    // Light blue header background
    const headerHeight = 85;
    this.drawRect(
      margins.left,
      startY - headerHeight,
      width - margins.left - margins.right,
      headerHeight - 4,
      { fillColor: '#d9e5f2' } // Light blue
    );

    // Company information area (left side)
    this.drawText('YOUR COMPANY NAME', margins.left + 20, startY - 30, {
      size: 18,
      bold: true,
      color: '#293a73', // Corporate blue
    });

    this.drawText('Votre slogan ou description', margins.left + 20, startY - 48, {
      size: 9,
      color: '#404040',
    });

    // Invoice information (right side)
    const invoice = this.context.invoice;
    const rightX = width - margins.right - 180;

    this.drawText(this.strings.invoice, rightX, startY - 25, {
      size: 20,
      bold: true,
      color: '#293a73',
    });

    // Info box with white background
    this.drawRect(rightX - 10, startY - 75, 170, 40, {
      fillColor: '#ffffff',
      borderColor: '#293a73',
      borderWidth: 1,
    });

    this.drawText(
      `${this.strings.invoiceNumber}:`,
      rightX,
      startY - 50,
      { size: 8, color: '#999999' }
    );
    this.drawText(invoice.header.id, rightX, startY - 62, {
      size: 10,
      bold: true,
      color: '#293a73'
    });

    const dateStr = invoice.header.invoiceDate.toLocaleDateString();
    this.drawText(
      `${this.strings.invoiceDate}: ${dateStr}`,
      rightX,
      startY - 72,
      { size: 8, color: '#404040' }
    );

    this.renderContext.currentY -= headerHeight + 5;
  }

  /**
   * Render parties with clean corporate layout
   */
  private renderCorporateParties(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const halfWidth = (width - margins.left - margins.right) / 2 - 15;

    // Seller section
    this.drawText(this.strings.seller.toUpperCase(), margins.left, startY, {
      size: 9,
      bold: true,
      color: '#b8a643', // Gold
    });

    // Separator line
    this.drawLine(
      margins.left,
      startY - 5,
      margins.left + halfWidth,
      startY - 5,
      { color: '#b8a643', width: 1.5 }
    );

    let y = startY - 20;

    // Seller box
    this.drawRect(margins.left, y - 90, halfWidth, 90, {
      fillColor: '#ffffff',
      borderColor: '#ededed',
      borderWidth: 1,
    });

    this.drawText(invoice.seller.name, margins.left + 12, y - 18, {
      size: 11,
      bold: true,
      color: '#293a73',
    });

    if (invoice.seller.address) {
      const addr = invoice.seller.address;
      y -= 32;
      if (addr.street) {
        this.drawText(addr.street, margins.left + 12, y, { size: 9 });
        y -= 13;
      }
      this.drawText(`${addr.postalCode} ${addr.city}`, margins.left + 12, y, { size: 9 });
      y -= 13;
      this.drawText(addr.countryCode, margins.left + 12, y, { size: 9 });
    }

    if (invoice.seller.vatId) {
      y -= 15;
      this.drawText(`N° TVA: ${invoice.seller.vatId}`, margins.left + 12, y, {
        size: 8,
        color: '#999999'
      });
    }

    // Buyer section
    const buyerX = margins.left + halfWidth + 30;

    this.drawText(this.strings.buyer.toUpperCase(), buyerX, startY, {
      size: 9,
      bold: true,
      color: '#b8a643',
    });

    // Separator line
    this.drawLine(
      buyerX,
      startY - 5,
      buyerX + halfWidth,
      startY - 5,
      { color: '#b8a643', width: 1.5 }
    );

    y = startY - 20;

    // Buyer box
    this.drawRect(buyerX, y - 90, halfWidth, 90, {
      fillColor: '#ffffff',
      borderColor: '#ededed',
      borderWidth: 1,
    });

    this.drawText(invoice.buyer.name, buyerX + 12, y - 18, {
      size: 11,
      bold: true,
      color: '#293a73',
    });

    if (invoice.buyer.address) {
      const addr = invoice.buyer.address;
      y -= 32;
      if (addr.street) {
        this.drawText(addr.street, buyerX + 12, y, { size: 9 });
        y -= 13;
      }
      this.drawText(`${addr.postalCode} ${addr.city}`, buyerX + 12, y, { size: 9 });
      y -= 13;
      this.drawText(addr.countryCode, buyerX + 12, y, { size: 9 });
    }

    if (invoice.buyer.vatId) {
      y -= 15;
      this.drawText(`N° TVA: ${invoice.buyer.vatId}`, buyerX + 12, y, {
        size: 8,
        color: '#999999'
      });
    }

    this.renderContext.currentY = startY - 110;
  }

  /**
   * Render line items with professional table
   */
  private renderCorporateLineItems(): void {
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

    // Table header with corporate blue
    this.drawRect(margins.left, startY - 24, tableWidth, 24, {
      fillColor: '#293a73',
    });

    let x = margins.left + 10;
    this.drawText(this.strings.description.toUpperCase(), x, startY - 16, {
      bold: true,
      color: '#ffffff',
      size: 8
    });
    x += colWidths.description;
    this.drawText(this.strings.quantity.toUpperCase(), x, startY - 16, {
      bold: true,
      color: '#ffffff',
      size: 8
    });
    x += colWidths.quantity;
    this.drawText(this.strings.unitPrice.toUpperCase(), x, startY - 16, {
      bold: true,
      color: '#ffffff',
      size: 8
    });
    x += colWidths.unitPrice;
    this.drawText(this.strings.vatRate.toUpperCase(), x, startY - 16, {
      bold: true,
      color: '#ffffff',
      size: 8
    });
    x += colWidths.vatRate;
    this.drawText(this.strings.lineTotal.toUpperCase(), x, startY - 16, {
      bold: true,
      color: '#ffffff',
      size: 8
    });

    let y = startY - 24;

    // Lines
    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];
      const rowHeight = 22;

      // Check page break
      this.checkPageBreak(rowHeight + 50);
      if (this.renderContext.currentY > startY - 24) {
        y = this.renderContext.currentY;
        // Redraw header
        this.drawRect(margins.left, y - 24, tableWidth, 24, {
          fillColor: '#293a73',
        });
        y -= 24;
      }

      // Alternate row colors
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f7f7f7';
      this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, {
        fillColor: bgColor,
      });

      // Thin separator line
      this.drawLine(
        margins.left,
        y - rowHeight,
        margins.left + tableWidth,
        y - rowHeight,
        { color: '#ededed', width: 0.5 }
      );

      // Draw line data
      x = margins.left + 10;
      this.drawText(line.description, x, y - 14, { size: 9 });
      x += colWidths.description;
      this.drawText(String(line.quantity), x, y - 14, { size: 9 });
      x += colWidths.quantity;
      this.drawText(this.formatCurrency(line.unitPrice), x, y - 14, { size: 9 });
      x += colWidths.unitPrice;
      this.drawText(`${(line.vatRate * 100).toFixed(1)}%`, x, y - 14, { size: 9 });
      x += colWidths.vatRate;
      this.drawText(this.formatCurrency(line.lineTotal), x, y - 14, {
        size: 9,
        bold: true,
        color: '#293a73'
      });

      y -= rowHeight;
    }

    this.renderContext.currentY = y - 12;
  }

  /**
   * Render totals with professional styling
   */
  private renderCorporateTotals(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const totalsX = width - margins.right - 230;
    const totalsWidth = 210;

    let y = startY - 18;

    // Subtotal
    this.drawText(this.strings.subtotal, totalsX, y, { size: 10 });
    this.drawText(this.formatCurrency(summary.lineTotal), totalsX + 130, y, { size: 10 });

    y -= 20;

    // Tax total
    this.drawText(this.strings.taxTotal, totalsX, y, { size: 10 });
    this.drawText(this.formatCurrency(summary.taxTotal), totalsX + 130, y, { size: 10 });

    // Double line separator
    y -= 8;
    this.drawLine(totalsX, y, totalsX + totalsWidth, y, {
      color: '#293a73',
      width: 0.5
    });
    y -= 3;
    this.drawLine(totalsX, y, totalsX + totalsWidth, y, {
      color: '#293a73',
      width: 1.5
    });

    y -= 18;

    // Grand total with subtle background
    this.drawRect(totalsX - 8, y - 8, totalsWidth + 8, 26, {
      fillColor: '#d9e5f2',
      borderColor: '#293a73',
      borderWidth: 1,
    });

    this.drawText(this.strings.grandTotal, totalsX, y, {
      size: 12,
      bold: true,
      color: '#293a73'
    });
    this.drawText(this.formatCurrency(summary.grandTotal), totalsX + 130, y, {
      size: 12,
      bold: true,
      color: '#293a73'
    });

    this.renderContext.currentY = y - 28;
  }

  /**
   * Render tax breakdown
   */
  private renderTaxBreakdown(): void {
    const { margins } = this.context.options;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    // Title
    this.drawText(this.strings.taxBreakdown.toUpperCase(), margins.left, startY, {
      size: 10,
      bold: true,
      color: '#b8a643',
    });

    this.drawLine(
      margins.left,
      startY - 5,
      margins.left + 200,
      startY - 5,
      { color: '#b8a643', width: 1 }
    );

    let y = startY - 22;

    // Header
    this.drawText(this.strings.vatRate, margins.left + 12, y, {
      size: 8,
      bold: true,
      color: '#999999'
    });
    this.drawText(this.strings.taxBase, margins.left + 90, y, {
      size: 8,
      bold: true,
      color: '#999999'
    });
    this.drawText(this.strings.taxAmount, margins.left + 180, y, {
      size: 8,
      bold: true,
      color: '#999999'
    });

    y -= 18;

    // Tax summaries
    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate}%`, margins.left + 12, y, { size: 9 });
      this.drawText(this.formatCurrency(taxSum.taxable), margins.left + 90, y, { size: 9 });
      this.drawText(this.formatCurrency(taxSum.taxAmount), margins.left + 180, y, {
        size: 9,
        bold: true,
        color: '#293a73'
      });
      y -= 16;
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render payment information
   */
  private renderPaymentInfo(): void {
    const { margins } = this.context.options;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    // Title
    this.drawText(this.strings.paymentTerms.toUpperCase(), margins.left, startY, {
      size: 10,
      bold: true,
      color: '#b8a643',
    });

    this.drawLine(
      margins.left,
      startY - 5,
      margins.left + 250,
      startY - 5,
      { color: '#b8a643', width: 1 }
    );

    let y = startY - 25;

    if (invoice.payment) {
      if (invoice.payment.iban) {
        this.drawText(`${this.strings.iban}:`, margins.left + 12, y, {
          size: 8,
          color: '#999999'
        });
        this.drawText(invoice.payment.iban, margins.left + 60, y, {
          size: 9,
          bold: true,
          color: '#293a73'
        });
        y -= 16;
      }

      if (invoice.payment.bic) {
        this.drawText(`${this.strings.bic}:`, margins.left + 12, y, {
          size: 8,
          color: '#999999'
        });
        this.drawText(invoice.payment.bic, margins.left + 60, y, {
          size: 9,
          bold: true,
          color: '#293a73'
        });
        y -= 16;
      }

      if (invoice.payment.dueDate) {
        this.drawText(`${this.strings.dueDate}:`, margins.left + 12, y, {
          size: 8,
          color: '#999999'
        });
        this.drawText(
          invoice.payment.dueDate.toLocaleDateString(),
          margins.left + 60,
          y,
          { size: 9, bold: true, color: '#b8a643' }
        );
        y -= 16;
      }

      if (invoice.payment.termsDescription) {
        this.drawText(invoice.payment.termsDescription, margins.left + 12, y, {
          size: 9,
          color: '#404040'
        });
        y -= 16;
      }
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render corporate footer
   */
  private renderCorporateFooter(): void {
    const { margins, customFooter } = this.context.options;
    const { width } = this.renderContext;

    const footerY = margins.bottom + 28;

    // Light background
    this.drawRect(margins.left, footerY - 28, width - margins.left - margins.right, 28, {
      fillColor: '#f7f7f7',
    });

    // Gold accent line on top
    this.drawRect(margins.left, footerY, width - margins.left - margins.right, 2, {
      fillColor: '#b8a643',
    });

    // Page number
    const pageText = `${this.strings.page} ${this.renderContext.pageNumber}`;
    this.drawText(pageText, margins.left + 15, footerY - 17, {
      size: 8,
      color: '#404040'
    });

    // Custom footer
    if (customFooter) {
      const customX = width / 2 - 70;
      this.drawText(customFooter, customX, footerY - 17, {
        size: 8,
        color: '#404040'
      });
    }

    // Generated by
    const generatedText = 'Powered by @facturx/templates';
    const generatedX = width - margins.right - 170;
    this.drawText(generatedText, generatedX, footerY - 17, {
      size: 8,
      color: '#999999'
    });
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return amount.toFixed(2) + ' €';
  }
}
