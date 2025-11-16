"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRenderer = void 0;
const pdf_lib_1 = require("pdf-lib");
const core_1 = require("@facturx/core");
const types_1 = require("../types");
const ValidationPipeline_1 = require("../validation/ValidationPipeline");
class TemplateRenderer {
    constructor() {
        this.fontCache = new Map();
        this.validationPipeline = new ValidationPipeline_1.ValidationPipeline();
    }
    async generate(invoice, options = {}) {
        let preValidation;
        if (options.validateBeforeGeneration !== false) {
            try {
                preValidation = await this.validationPipeline.validateBeforeGeneration(invoice);
                if (options.strictValidation && !preValidation.isValid) {
                    throw new Error(`Factur-X validation failed: ${preValidation.summary.totalErrors} error(s). ` +
                        `Recommendations: ${preValidation.recommendations.join(', ')}`);
                }
            }
            catch (error) {
                if (options.strictValidation) {
                    throw error;
                }
                console.warn('Pre-generation validation failed:', error);
            }
        }
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
        this.strings = types_1.LOCALIZED_STRINGS[fullOptions.language];
        this.pdfDoc = await pdf_lib_1.PDFDocument.create();
        this.addMetadata();
        this.addPage();
        await this.renderContent();
        const xmlContent = await this.attachFacturXml();
        const pdfBytes = await this.pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);
        let postValidation;
        if (options.validateAfterGeneration !== false) {
            try {
                postValidation = await this.validationPipeline.validateAfterGeneration(invoice, pdfBuffer, xmlContent);
                if (options.strictValidation && !postValidation.isValid) {
                    throw new Error(`Factur-X post-generation validation failed: ${postValidation.summary.totalErrors} error(s). ` +
                        `Compliance: ${postValidation.summary.complianceLevel}`);
                }
            }
            catch (error) {
                if (options.strictValidation) {
                    throw error;
                }
                console.warn('Post-generation validation failed:', error);
            }
        }
        return {
            pdf: pdfBuffer,
            pageCount: this.pdfDoc.getPageCount(),
            fileSize: pdfBytes.length,
            generatedAt: this.context.generatedAt,
            templateType: this.getTemplateType(),
            validation: postValidation || preValidation,
        };
    }
    addPage() {
        const { pageFormat, margins } = this.context.options;
        const size = this.getPageSize(pageFormat);
        this.currentPage = this.pdfDoc.addPage(size);
        this.renderContext = {
            width: size[0],
            height: size[1],
            margins,
            currentY: size[1] - margins.top,
            pageNumber: this.pdfDoc.getPageCount(),
        };
    }
    needsNewPage(requiredHeight) {
        const { margins } = this.context.options;
        return this.renderContext.currentY - requiredHeight < margins.bottom;
    }
    checkPageBreak(requiredHeight) {
        if (this.needsNewPage(requiredHeight)) {
            this.addPage();
        }
    }
    drawText(text, x, y, options = {}) {
        const { theme } = this.context;
        const size = options.size || theme.fontSize;
        const color = options.color || theme.textColor;
        const fontName = options.bold ? pdf_lib_1.StandardFonts.HelveticaBold : pdf_lib_1.StandardFonts.Helvetica;
        const font = this.getFont(fontName);
        const rgbColor = this.parseColor(color);
        this.currentPage.drawText(text, {
            x,
            y,
            size,
            font,
            color: rgbColor,
        });
    }
    drawRect(x, y, width, height, options = {}) {
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
    drawLine(x1, y1, x2, y2, options = {}) {
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
    async renderHeader() {
        const { margins } = this.context.options;
        const { theme } = this.context;
        const { width } = this.renderContext;
        const startY = this.renderContext.currentY;
        this.drawRect(margins.left, startY - 80, width - margins.left - margins.right, 80, { fillColor: theme.headerBackground });
        this.drawText(this.strings.invoice, margins.left + 10, startY - 30, {
            size: 24,
            bold: true,
            color: theme.primaryColor,
        });
        const invoice = this.context.invoice;
        this.drawText(`${this.strings.invoiceNumber}: ${invoice.header.id}`, margins.left + 10, startY - 55, { size: 12 });
        const dateStr = invoice.header.invoiceDate.toLocaleDateString();
        this.drawText(`${this.strings.invoiceDate}: ${dateStr}`, margins.left + 10, startY - 70, { size: 10 });
        this.renderContext.currentY -= 90;
        return {
            height: 90,
            y: startY,
        };
    }
    renderParties() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        const halfWidth = (width - margins.left - margins.right) / 2;
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
    renderLineItems() {
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
        this.drawRect(margins.left, startY - 25, tableWidth, 25, {
            fillColor: theme.tableHeaderBackground,
        });
        let x = margins.left + 5;
        this.drawText(this.strings.description, x, startY - 18, { bold: true });
        x += colWidths.description;
        this.drawText(this.strings.quantity, x, startY - 18, { bold: true });
        x += colWidths.quantity;
        this.drawText(this.strings.unitPrice, x, startY - 18, { bold: true });
        x += colWidths.unitPrice;
        this.drawText(this.strings.vatRate, x, startY - 18, { bold: true });
        x += colWidths.vatRate;
        this.drawText(this.strings.lineTotal, x, startY - 18, { bold: true });
        let y = startY - 25;
        for (let i = 0; i < invoice.lines.length; i++) {
            const line = invoice.lines[i];
            const rowHeight = 20;
            this.checkPageBreak(rowHeight);
            if (this.renderContext.currentY > startY - 25) {
                y = this.renderContext.currentY;
                this.drawRect(margins.left, y - 25, tableWidth, 25, {
                    fillColor: theme.tableHeaderBackground,
                });
                y -= 25;
            }
            const bgColor = i % 2 === 0 ? theme.tableRowEvenBackground : theme.tableRowOddBackground;
            this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, {
                fillColor: bgColor,
            });
            x = margins.left + 5;
            this.drawText(line.description, x, y - 14, { size: 9 });
            x += colWidths.description;
            this.drawText(String(line.quantity), x, y - 14, { size: 9 });
            x += colWidths.quantity;
            this.drawText((0, core_1.formatAmount)(line.unitPrice) + ' €', x, y - 14, { size: 9 });
            x += colWidths.unitPrice;
            this.drawText((0, core_1.formatAmount)(line.vatRate * 100) + '%', x, y - 14, { size: 9 });
            x += colWidths.vatRate;
            this.drawText((0, core_1.formatAmount)(line.lineTotal) + ' €', x, y - 14, { size: 9 });
            y -= rowHeight;
        }
        this.renderContext.currentY = y - 10;
        return {
            height: startY - y,
            y: startY,
        };
    }
    renderTotals() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { summary } = this.context;
        const startY = this.renderContext.currentY;
        const totalsX = width - margins.right - 200;
        let y = startY;
        this.drawText(this.strings.subtotal, totalsX, y, { size: 10 });
        this.drawText((0, core_1.formatAmount)(summary.lineTotal) + ' €', totalsX + 120, y, { size: 10 });
        y -= 20;
        this.drawText(this.strings.taxTotal, totalsX, y, { size: 10 });
        this.drawText((0, core_1.formatAmount)(summary.taxTotal) + ' €', totalsX + 120, y, { size: 10 });
        y -= 25;
        this.drawText(this.strings.grandTotal, totalsX, y, { size: 12, bold: true });
        this.drawText((0, core_1.formatAmount)(summary.grandTotal) + ' €', totalsX + 120, y, {
            size: 12,
            bold: true,
        });
        this.renderContext.currentY = y - 20;
        return {
            height: startY - y,
            y: startY,
        };
    }
    getFont(fontName) {
        if (!this.fontCache.has(fontName)) {
            const font = this.pdfDoc.embedStandardFont(fontName);
            this.fontCache.set(fontName, font);
        }
        return this.fontCache.get(fontName);
    }
    parseColor(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return (0, pdf_lib_1.rgb)(r, g, b);
    }
    getPageSize(format) {
        switch (format) {
            case 'A4':
                return [595.28, 841.89];
            case 'Letter':
                return [612, 792];
            case 'Legal':
                return [612, 1008];
            default:
                return [595.28, 841.89];
        }
    }
    mergeOptions(options) {
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
    mergeTheme(theme) {
        return {
            ...types_1.DEFAULT_THEME,
            ...theme,
        };
    }
    addMetadata() {
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
    async attachFacturXml() {
        const { invoice } = this.context;
        const xml = invoice.generateXml(true);
        await this.pdfDoc.attach(Buffer.from(xml, 'utf-8'), 'factur-x.xml', {
            mimeType: 'text/xml',
            description: 'Factur-X XML Invoice',
            creationDate: this.context.generatedAt,
            modificationDate: this.context.generatedAt,
        });
        return xml;
    }
}
exports.TemplateRenderer = TemplateRenderer;
//# sourceMappingURL=TemplateRenderer.js.map