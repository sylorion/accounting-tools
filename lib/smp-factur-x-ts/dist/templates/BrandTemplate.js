"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandTemplate = void 0;
const TemplateRenderer_1 = require("../core/TemplateRenderer");
const types_1 = require("../types");
class BrandTemplate extends TemplateRenderer_1.TemplateRenderer {
    getTemplateType() {
        return types_1.TemplateType.BRAND;
    }
    async renderContent() {
        await this.renderBrandHeader();
        this.renderContext.currentY -= 25;
        this.renderBrandParties();
        this.renderContext.currentY -= 25;
        this.renderBrandLineItems();
        this.renderContext.currentY -= 25;
        this.renderBrandTotals();
        if (this.context.options.showTaxBreakdown) {
            this.renderContext.currentY -= 30;
            this.renderTaxBreakdown();
        }
        if (this.context.options.showPaymentTerms) {
            this.renderContext.currentY -= 30;
            this.renderPaymentInfo();
        }
        this.renderBrandFooter();
    }
    async renderBrandHeader() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const startY = this.renderContext.currentY;
        const headerHeight = 90;
        this.drawRect(margins.left, startY - headerHeight, width - margins.left - margins.right, headerHeight, { fillColor: '#0d2f5e' });
        this.drawRect(margins.left, startY - 8, width - margins.left - margins.right, 8, { fillColor: '#ff6600' });
        this.drawText('YOUR COMPANY', margins.left + 20, startY - 35, {
            size: 22,
            bold: true,
            color: '#ffffff',
        });
        this.drawLine(margins.left + 20, startY - 42, margins.left + 200, startY - 42, { color: '#ff6600', width: 2 });
        const invoice = this.context.invoice;
        const invoiceTitleX = width - margins.right - 180;
        this.drawText(this.strings.invoice, invoiceTitleX, startY - 28, {
            size: 24,
            bold: true,
            color: '#ff6600',
        });
        this.drawText(`${this.strings.invoiceNumber}: ${invoice.header.id}`, invoiceTitleX, startY - 50, { size: 10, color: '#ffffff' });
        const dateStr = invoice.header.invoiceDate.toLocaleDateString();
        this.drawText(`${this.strings.invoiceDate}: ${dateStr}`, invoiceTitleX, startY - 68, { size: 9, color: '#ffffff' });
        this.renderContext.currentY -= headerHeight + 10;
    }
    renderBrandParties() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        const halfWidth = (width - margins.left - margins.right) / 2 - 10;
        this.drawRect(margins.left, startY - 22, halfWidth, 22, {
            fillColor: '#0d2f5e',
        });
        this.drawText(this.strings.seller, margins.left + 10, startY - 15, {
            size: 11,
            bold: true,
            color: '#ffffff',
        });
        this.drawRect(margins.left, startY - 110, halfWidth, 88, {
            fillColor: '#f5f5f5',
            borderColor: '#cccccc',
            borderWidth: 1,
        });
        let y = startY - 38;
        this.drawText(invoice.seller.name, margins.left + 10, y, {
            size: 11,
            bold: true,
            color: '#0d2f5e',
        });
        if (invoice.seller.address) {
            const addr = invoice.seller.address;
            y -= 18;
            if (addr.street) {
                this.drawText(addr.street, margins.left + 10, y, { size: 9 });
                y -= 14;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, margins.left + 10, y, { size: 9 });
            y -= 14;
            this.drawText(addr.countryCode, margins.left + 10, y, { size: 9 });
        }
        if (invoice.seller.vatId) {
            y -= 16;
            this.drawText(`TVA: ${invoice.seller.vatId}`, margins.left + 10, y, {
                size: 9,
                color: '#4d4d4d'
            });
        }
        const buyerX = margins.left + halfWidth + 20;
        this.drawRect(buyerX, startY - 22, halfWidth, 22, {
            fillColor: '#ff6600',
        });
        this.drawText(this.strings.buyer, buyerX + 10, startY - 15, {
            size: 11,
            bold: true,
            color: '#ffffff',
        });
        this.drawRect(buyerX, startY - 110, halfWidth, 88, {
            fillColor: '#f5f5f5',
            borderColor: '#cccccc',
            borderWidth: 1,
        });
        y = startY - 38;
        this.drawText(invoice.buyer.name, buyerX + 10, y, {
            size: 11,
            bold: true,
            color: '#ff6600',
        });
        if (invoice.buyer.address) {
            const addr = invoice.buyer.address;
            y -= 18;
            if (addr.street) {
                this.drawText(addr.street, buyerX + 10, y, { size: 9 });
                y -= 14;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, buyerX + 10, y, { size: 9 });
            y -= 14;
            this.drawText(addr.countryCode, buyerX + 10, y, { size: 9 });
        }
        if (invoice.buyer.vatId) {
            y -= 16;
            this.drawText(`TVA: ${invoice.buyer.vatId}`, buyerX + 10, y, {
                size: 9,
                color: '#4d4d4d'
            });
        }
        this.renderContext.currentY -= 120;
    }
    renderBrandLineItems() {
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
        this.drawRect(margins.left, startY - 26, tableWidth, 26, {
            fillColor: '#0d2f5e',
        });
        let x = margins.left + 8;
        this.drawText(this.strings.description, x, startY - 17, {
            bold: true,
            color: '#ffffff',
            size: 9
        });
        x += colWidths.description;
        this.drawText(this.strings.quantity, x, startY - 17, {
            bold: true,
            color: '#ffffff',
            size: 9
        });
        x += colWidths.quantity;
        this.drawText(this.strings.unitPrice, x, startY - 17, {
            bold: true,
            color: '#ffffff',
            size: 9
        });
        x += colWidths.unitPrice;
        this.drawText(this.strings.vatRate, x, startY - 17, {
            bold: true,
            color: '#ffffff',
            size: 9
        });
        x += colWidths.vatRate;
        this.drawText(this.strings.lineTotal, x, startY - 17, {
            bold: true,
            color: '#ffffff',
            size: 9
        });
        let y = startY - 26;
        for (let i = 0; i < invoice.lines.length; i++) {
            const line = invoice.lines[i];
            const rowHeight = 20;
            this.checkPageBreak(rowHeight + 50);
            if (this.renderContext.currentY > startY - 26) {
                y = this.renderContext.currentY;
                this.drawRect(margins.left, y - 26, tableWidth, 26, {
                    fillColor: '#0d2f5e',
                });
                y -= 26;
            }
            const bgColor = i % 2 === 0 ? '#ffffff' : '#f5f5f5';
            this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, {
                fillColor: bgColor,
            });
            this.drawLine(margins.left, y - rowHeight, margins.left + tableWidth, y - rowHeight, { color: '#e0e0e0', width: 0.5 });
            x = margins.left + 8;
            this.drawText(line.description, x, y - 13, { size: 9 });
            x += colWidths.description;
            this.drawText(String(line.quantity), x, y - 13, { size: 9 });
            x += colWidths.quantity;
            this.drawText(this.formatCurrency(line.unitPrice), x, y - 13, { size: 9 });
            x += colWidths.unitPrice;
            this.drawText(`${(line.vatRate * 100).toFixed(1)}%`, x, y - 13, { size: 9 });
            x += colWidths.vatRate;
            this.drawText(this.formatCurrency(line.lineTotal), x, y - 13, {
                size: 9,
                bold: true,
                color: '#0d2f5e'
            });
            y -= rowHeight;
        }
        this.renderContext.currentY = y - 10;
    }
    renderBrandTotals() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { summary } = this.context;
        const startY = this.renderContext.currentY;
        const totalsX = width - margins.right - 240;
        const totalsWidth = 220;
        let y = startY - 15;
        this.drawText(this.strings.subtotal, totalsX, y, { size: 10 });
        this.drawText(this.formatCurrency(summary.lineTotal), totalsX + 140, y, { size: 10 });
        this.drawLine(totalsX, y - 5, totalsX + totalsWidth, y - 5, {
            color: '#cccccc',
            width: 0.5
        });
        y -= 22;
        this.drawText(this.strings.taxTotal, totalsX, y, { size: 10 });
        this.drawText(this.formatCurrency(summary.taxTotal), totalsX + 140, y, { size: 10 });
        y -= 28;
        this.drawRect(totalsX - 10, y - 10, totalsWidth + 10, 30, {
            fillColor: '#ff6600',
        });
        this.drawText(this.strings.grandTotal, totalsX, y, {
            size: 14,
            bold: true,
            color: '#ffffff'
        });
        this.drawText(this.formatCurrency(summary.grandTotal), totalsX + 140, y, {
            size: 14,
            bold: true,
            color: '#ffffff'
        });
        this.renderContext.currentY = y - 30;
    }
    renderTaxBreakdown() {
        const { margins } = this.context.options;
        const { summary } = this.context;
        const startY = this.renderContext.currentY;
        this.drawText(this.strings.taxBreakdown, margins.left, startY, {
            size: 11,
            bold: true,
            color: '#0d2f5e',
        });
        let y = startY - 25;
        this.drawRect(margins.left, y - 18, 280, 18, {
            fillColor: '#f5f5f5',
        });
        this.drawText(this.strings.vatRate, margins.left + 10, y - 12, {
            size: 9,
            bold: true,
        });
        this.drawText(this.strings.taxBase, margins.left + 100, y - 12, {
            size: 9,
            bold: true,
        });
        this.drawText(this.strings.taxAmount, margins.left + 200, y - 12, {
            size: 9,
            bold: true,
        });
        y -= 18;
        for (const taxSum of summary.taxSummaries) {
            this.drawText(`${taxSum.rate}%`, margins.left + 10, y, { size: 9 });
            this.drawText(this.formatCurrency(taxSum.taxable), margins.left + 100, y, { size: 9 });
            this.drawText(this.formatCurrency(taxSum.taxAmount), margins.left + 200, y, {
                size: 9,
                color: '#ff6600'
            });
            y -= 16;
        }
        this.renderContext.currentY = y - 10;
    }
    renderPaymentInfo() {
        const { margins } = this.context.options;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        this.drawRect(margins.left, startY - 20, 300, 20, {
            fillColor: '#0d2f5e',
        });
        this.drawText(this.strings.paymentTerms, margins.left + 10, startY - 13, {
            size: 11,
            bold: true,
            color: '#ffffff',
        });
        let y = startY - 35;
        if (invoice.payment) {
            if (invoice.payment.iban) {
                this.drawText(`${this.strings.iban}: ${invoice.payment.iban}`, margins.left + 10, y, {
                    size: 9,
                });
                y -= 15;
            }
            if (invoice.payment.bic) {
                this.drawText(`${this.strings.bic}: ${invoice.payment.bic}`, margins.left + 10, y, {
                    size: 9,
                });
                y -= 15;
            }
            if (invoice.payment.dueDate) {
                this.drawText(`${this.strings.dueDate}: ${invoice.payment.dueDate.toLocaleDateString()}`, margins.left + 10, y, { size: 9, color: '#ff6600', bold: true });
                y -= 15;
            }
            if (invoice.payment.termsDescription) {
                this.drawText(invoice.payment.termsDescription, margins.left + 10, y, { size: 9 });
                y -= 15;
            }
        }
        this.renderContext.currentY = y - 10;
    }
    renderBrandFooter() {
        const { margins, customFooter } = this.context.options;
        const { width } = this.renderContext;
        const footerY = margins.bottom + 30;
        this.drawRect(margins.left, footerY - 32, width - margins.left - margins.right, 32, {
            fillColor: '#0d2f5e',
        });
        this.drawRect(margins.left, footerY - 5, width - margins.left - margins.right, 5, {
            fillColor: '#ff6600',
        });
        const pageText = `${this.strings.page} ${this.renderContext.pageNumber}`;
        this.drawText(pageText, margins.left + 15, footerY - 20, {
            size: 8,
            color: '#ffffff'
        });
        if (customFooter) {
            const customX = width / 2 - 60;
            this.drawText(customFooter, customX, footerY - 20, {
                size: 8,
                color: '#ffffff'
            });
        }
        const generatedText = 'Generated by @facturx/templates';
        const generatedX = width - margins.right - 170;
        this.drawText(generatedText, generatedX, footerY - 20, {
            size: 8,
            color: '#ff6600'
        });
    }
    formatCurrency(amount) {
        return amount.toFixed(2) + ' €';
    }
}
exports.BrandTemplate = BrandTemplate;
//# sourceMappingURL=BrandTemplate.js.map