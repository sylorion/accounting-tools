export { TemplateType, TemplateTheme, TemplateOptions, TemplateContext, PDFGenerationResult, PDFAttachmentOptions, RenderContext, RenderedElement, LocalizedStrings, DEFAULT_THEME, BRAND_THEME, FANCY_THEME, LOCALIZED_STRINGS, } from './types';
export { TemplateRenderer } from './core/TemplateRenderer';
export { ModernTemplate } from './templates/ModernTemplate';
import { FacturXInvoice } from '@facturx/core';
import { TemplateOptions, PDFGenerationResult, TemplateType } from './types';
export declare function generateModernPDF(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult>;
export declare function generatePDF(invoice: FacturXInvoice, templateType?: TemplateType, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult>;
export declare const VERSION = "1.0.0";
export declare const LIBRARY_INFO: Readonly<{
    name: "@facturx/templates";
    version: "1.0.0";
    description: "Professional PDF templates for Factur-X";
    license: "MIT";
    repository: "https://github.com/facturx/facturx-ts";
    templates: TemplateType[];
}>;
//# sourceMappingURL=index.d.ts.map