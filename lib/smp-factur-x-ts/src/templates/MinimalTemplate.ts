/**
 * @module MinimalTemplate
 * @description Clean and minimal template for Factur-X invoices
 *
 * Features:
 * - Ultra-clean design
 * - Monochrome color scheme
 * - Typography-focused
 * - Perfect for modern, minimalist businesses
 */

import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

export class MinimalTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    return TemplateType.MINIMAL;
  }

  protected async renderContent(): Promise<void> {
    // Minimal header
    await this.renderMinimalHeader();

    // Spacing
    this.renderContext.currentY -= 40;

    // Parties section
    this.renderMinimalParties();

    // Spacing
    this.renderContext.currentY -= 35;

    // Line items
    this.renderMinimalLineItems();

    // Spacing
    this.renderContext.currentY -= 30;

    // Totals
    this.renderMinimalTotals();

    // Tax breakdown (optional)
    if (this.context.options.showTaxBreakdown) {
      this.renderContext.currentY -= 35;
      this.renderTaxBreakdown();
    }

    // Payment info (optional)
    if (this.context.options.showPaymentTerms) {
      this.renderContext.currentY -= 35;
      this.renderPaymentInfo();
    }

    // Minimal footer
    this.renderMinimalFooter();
  }

  /**
   * Render minimal header - typography focused
   */
  private async renderMinimalHeader(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const startY = this.renderContext.currentY;

    // Simple top line
    this.drawLine(
      margins.left,
      startY - 2,
      width - margins.right,
      startY - 2,
      { color: '#000000', width: 2 }
    );

    // Invoice title - large and bold
    this.drawText(this.strings.invoice, margins.left, startY - 35, {
      size: 36,
      bold: true,
      color: '#000000',
    });

    // Invoice details on right
    const invoice = this.context.invoice;
    const rightX = width - margins.right - 160;

    this.drawText(this.strings.invoiceNumber, rightX, startY - 25, {
      size: 8,
      color: '#808080',
    });

    this.drawText(invoice.header.id, rightX, startY - 38, {
      size: 12,
      bold: true,
      color: '#000000',
    });

    const dateStr = invoice.header.invoiceDate.toLocaleDateString();
    this.drawText(this.strings.invoiceDate, rightX, startY - 55, {
      size: 8,
      color: '#808080',
    });

    this.drawText(dateStr, rightX, startY - 68, {
      size: 10,
      color: '#333333',
    });

    this.renderContext.currentY -= 75;
  }

  /**
   * Render parties with minimal styling
   */
  private renderMinimalParties(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const halfWidth = (width - margins.left - margins.right) / 2 - 20;

    // From (Seller)
    this.drawText('FROM', margins.left, startY, {
      size: 8,
      color: '#808080',
    });

    this.drawLine(
      margins.left,
      startY - 4,
      margins.left + 50,
      startY - 4,
      { color: '#333333', width: 0.5 }
    );

    let y = startY - 20;

    this.drawText(invoice.seller.name, margins.left, y, {
      size: 12,
      bold: true,
      color: '#000000',
    });

    if (invoice.seller.address) {
      const addr = invoice.seller.address;
      y -= 18;
      if (addr.street) {
        this.drawText(addr.street, margins.left, y, { size: 9, color: '#333333' });
        y -= 12;
      }
      this.drawText(`${addr.postalCode} ${addr.city}`, margins.left, y, {
        size: 9,
        color: '#333333'
      });
      y -= 12;
      this.drawText(addr.countryCode, margins.left, y, { size: 9, color: '#333333' });
    }

    if (invoice.seller.vatId) {
      y -= 14;
      this.drawText(`VAT: ${invoice.seller.vatId}`, margins.left, y, {
        size: 8,
        color: '#808080'
      });
    }

    // To (Buyer)
    const buyerX = margins.left + halfWidth + 40;

    this.drawText('TO', buyerX, startY, {
      size: 8,
      color: '#808080',
    });

    this.drawLine(
      buyerX,
      startY - 4,
      buyerX + 30,
      startY - 4,
      { color: '#333333', width: 0.5 }
    );

    y = startY - 20;

    this.drawText(invoice.buyer.name, buyerX, y, {
      size: 12,
      bold: true,
      color: '#000000',
    });

    if (invoice.buyer.address) {
      const addr = invoice.buyer.address;
      y -= 18;
      if (addr.street) {
        this.drawText(addr.street, buyerX, y, { size: 9, color: '#333333' });
        y -= 12;
      }
      this.drawText(`${addr.postalCode} ${addr.city}`, buyerX, y, {
        size: 9,
        color: '#333333'
      });
      y -= 12;
      this.drawText(addr.countryCode, buyerX, y, { size: 9, color: '#333333' });
    }

    if (invoice.buyer.vatId) {
      y -= 14;
      this.drawText(`VAT: ${invoice.buyer.vatId}`, buyerX, y, {
        size: 8,
        color: '#808080'
      });
    }

    this.renderContext.currentY = startY - 100;
  }

  /**
   * Render line items with minimal table
   */
  private renderMinimalLineItems(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const tableWidth = width - margins.left - margins.right;
    const colWidths = {
      description: tableWidth * 0.45,
      quantity: tableWidth * 0.15,
      unitPrice: tableWidth * 0.2,
      vatRate: tableWidth * 0.1,
      total: tableWidth * 0.1,
    };

    // Table header - just text, no background
    let x = margins.left;
    this.drawText(this.strings.description.toUpperCase(), x, startY, {
      bold: true,
      color: '#000000',
      size: 8
    });
    x += colWidths.description;
    this.drawText(this.strings.quantity.toUpperCase(), x, startY, {
      bold: true,
      color: '#000000',
      size: 8
    });
    x += colWidths.quantity;
    this.drawText(this.strings.unitPrice.toUpperCase(), x, startY, {
      bold: true,
      color: '#000000',
      size: 8
    });
    x += colWidths.unitPrice;
    this.drawText(this.strings.vatRate.toUpperCase(), x, startY, {
      bold: true,
      color: '#000000',
      size: 8
    });
    x += colWidths.vatRate;
    this.drawText(this.strings.lineTotal.toUpperCase(), x, startY, {
      bold: true,
      color: '#000000',
      size: 8
    });

    // Header separator line
    this.drawLine(
      margins.left,
      startY - 5,
      width - margins.right,
      startY - 5,
      { color: '#000000', width: 1 }
    );

    let y = startY - 10;

    // Lines - no background, just separator lines
    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];
      const rowHeight = 20;

      // Check page break
      this.checkPageBreak(rowHeight + 50);
      if (this.renderContext.currentY > startY - 10) {
        y = this.renderContext.currentY;
        // Redraw header
        this.drawLine(
          margins.left,
          y + 5,
          width - margins.right,
          y + 5,
          { color: '#000000', width: 1 }
        );
        y -= 10;
      }

      y -= rowHeight;

      // Thin separator line
      this.drawLine(
        margins.left,
        y,
        width - margins.right,
        y,
        { color: '#e5e5e5', width: 0.3 }
      );

      // Draw line data
      x = margins.left;
      this.drawText(line.description, x, y + 7, { size: 9, color: '#333333' });
      x += colWidths.description;
      this.drawText(String(line.quantity), x, y + 7, { size: 9, color: '#333333' });
      x += colWidths.quantity;
      this.drawText(this.formatCurrency(line.unitPrice), x, y + 7, {
        size: 9,
        color: '#333333'
      });
      x += colWidths.unitPrice;
      this.drawText(`${(line.vatRate * 100).toFixed(1)}%`, x, y + 7, {
        size: 9,
        color: '#333333'
      });
      x += colWidths.vatRate;
      this.drawText(this.formatCurrency(line.lineTotal), x, y + 7, {
        size: 9,
        bold: true,
        color: '#000000'
      });
    }

    // Final line
    this.drawLine(
      margins.left,
      y,
      width - margins.right,
      y,
      { color: '#000000', width: 0.5 }
    );

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render minimal totals
   */
  private renderMinimalTotals(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const totalsX = width - margins.right - 200;

    let y = startY - 15;

    // Subtotal
    this.drawText(this.strings.subtotal, totalsX, y, {
      size: 9,
      color: '#333333'
    });
    this.drawText(this.formatCurrency(summary.lineTotal), totalsX + 110, y, {
      size: 9,
      color: '#333333'
    });

    y -= 18;

    // Tax
    this.drawText(this.strings.taxTotal, totalsX, y, {
      size: 9,
      color: '#333333'
    });
    this.drawText(this.formatCurrency(summary.taxTotal), totalsX + 110, y, {
      size: 9,
      color: '#333333'
    });

    // Separator
    y -= 10;
    this.drawLine(totalsX, y, totalsX + 190, y, {
      color: '#000000',
      width: 1.5
    });

    y -= 20;

    // Total
    this.drawText(this.strings.grandTotal, totalsX, y, {
      size: 14,
      bold: true,
      color: '#000000'
    });
    this.drawText(this.formatCurrency(summary.grandTotal), totalsX + 110, y, {
      size: 14,
      bold: true,
      color: '#000000'
    });

    this.renderContext.currentY = y - 25;
  }

  /**
   * Render tax breakdown
   */
  private renderTaxBreakdown(): void {
    const { margins } = this.context.options;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    this.drawText('TAX BREAKDOWN', margins.left, startY, {
      size: 9,
      bold: true,
      color: '#000000',
    });

    this.drawLine(
      margins.left,
      startY - 4,
      margins.left + 120,
      startY - 4,
      { color: '#333333', width: 0.5 }
    );

    let y = startY - 20;

    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate}%`, margins.left + 10, y, {
        size: 9,
        color: '#333333'
      });
      this.drawText(this.formatCurrency(taxSum.taxable), margins.left + 70, y, {
        size: 9,
        color: '#333333'
      });
      this.drawText(this.formatCurrency(taxSum.taxAmount), margins.left + 150, y, {
        size: 9,
        bold: true,
        color: '#000000'
      });
      y -= 14;
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render payment info
   */
  private renderPaymentInfo(): void {
    const { margins } = this.context.options;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    this.drawText('PAYMENT INFORMATION', margins.left, startY, {
      size: 9,
      bold: true,
      color: '#000000',
    });

    this.drawLine(
      margins.left,
      startY - 4,
      margins.left + 150,
      startY - 4,
      { color: '#333333', width: 0.5 }
    );

    let y = startY - 20;

    if (invoice.payment) {
      if (invoice.payment.iban) {
        this.drawText('IBAN', margins.left + 10, y, {
          size: 7,
          color: '#808080'
        });
        this.drawText(invoice.payment.iban, margins.left + 10, y - 10, {
          size: 9,
          color: '#000000'
        });
        y -= 24;
      }

      if (invoice.payment.bic) {
        this.drawText('BIC', margins.left + 10, y, {
          size: 7,
          color: '#808080'
        });
        this.drawText(invoice.payment.bic, margins.left + 10, y - 10, {
          size: 9,
          color: '#000000'
        });
        y -= 24;
      }

      if (invoice.payment.dueDate) {
        this.drawText('DUE DATE', margins.left + 10, y, {
          size: 7,
          color: '#808080'
        });
        this.drawText(
          invoice.payment.dueDate.toLocaleDateString(),
          margins.left + 10,
          y - 10,
          { size: 9, bold: true, color: '#000000' }
        );
        y -= 24;
      }

      if (invoice.payment.termsDescription) {
        this.drawText(invoice.payment.termsDescription, margins.left + 10, y, {
          size: 8,
          color: '#333333'
        });
        y -= 16;
      }
    }

    this.renderContext.currentY = y - 10;
  }

  /**
   * Render minimal footer
   */
  private renderMinimalFooter(): void {
    const { margins, customFooter } = this.context.options;
    const { width } = this.renderContext;

    const footerY = margins.bottom + 20;

    // Simple line
    this.drawLine(
      margins.left,
      footerY + 5,
      width - margins.right,
      footerY + 5,
      { color: '#cccccc', width: 0.5 }
    );

    // Page number (left)
    const pageText = `${this.renderContext.pageNumber}`;
    this.drawText(pageText, margins.left, footerY - 10, {
      size: 8,
      color: '#808080'
    });

    // Custom footer (center)
    if (customFooter) {
      const customX = width / 2 - 50;
      this.drawText(customFooter, customX, footerY - 10, {
        size: 7,
        color: '#808080'
      });
    }

    // Powered by (right)
    const generatedText = '@facturx/templates';
    const generatedX = width - margins.right - 100;
    this.drawText(generatedText, generatedX, footerY - 10, {
      size: 7,
      color: '#cccccc'
    });
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return amount.toFixed(2) + ' €';
  }
}
