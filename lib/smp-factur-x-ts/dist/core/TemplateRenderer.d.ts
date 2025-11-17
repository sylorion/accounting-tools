import { PDFDocument, PDFPage } from 'pdf-lib';
import { FacturXInvoice } from '@facturx/core';
import { TemplateOptions, TemplateContext, PDFGenerationResult, RenderContext, RenderedElement, LocalizedStrings, TemplateType } from '../types';
import { ValidationPipelineResult } from '../validation/ValidationPipeline';
export declare abstract class TemplateRenderer {
    protected pdfDoc: PDFDocument;
    protected currentPage: PDFPage;
    protected context: TemplateContext;
    protected renderContext: RenderContext;
    protected strings: LocalizedStrings;
    private fontCache;
    private chillaxFonts?;
    private validationPipeline;
    constructor();
    generate(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult & {
        validation?: ValidationPipelineResult;
    }>;
    protected abstract renderContent(): Promise<void>;
    protected abstract getTemplateType(): TemplateType;
    protected addPage(): void;
    protected needsNewPage(requiredHeight: number): boolean;
    protected checkPageBreak(requiredHeight: number): void;
    protected drawText(text: string, x: number, y: number, options?: {
        size?: number;
        color?: string;
        font?: string;
        bold?: boolean;
    }): void;
    protected drawRect(x: number, y: number, width: number, height: number, options?: {
        fillColor?: string;
        borderColor?: string;
        borderWidth?: number;
    }): void;
    protected drawLine(x1: number, y1: number, x2: number, y2: number, options?: {
        color?: string;
        width?: number;
    }): void;
    protected renderHeader(): Promise<RenderedElement>;
    protected renderParties(): RenderedElement;
    protected renderLineItems(): RenderedElement;
    protected renderTotals(): RenderedElement;
    private loadEmbeddedFonts;
    private getFont;
    private parseColor;
    private getPageSize;
    private mergeOptions;
    private mergeTheme;
    private addMetadata;
    private attachFacturXml;
}
//# sourceMappingURL=TemplateRenderer.d.ts.map