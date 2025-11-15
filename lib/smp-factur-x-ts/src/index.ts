/**
 * @module smp-factur-x-ts
 * @description Professional PDF templates for Factur-X invoices
 *
 * High-performance template rendering with multiple themes
 *
 * @author Factur-X Team
 * @version 1.0.0
 * @license MIT
 */

// ============================================================================
// TYPES
// ============================================================================

export {
  TemplateType,
  TemplateTheme,
  TemplateOptions,
  TemplateContext,
  PDFGenerationResult,
  PDFAttachmentOptions,
  RenderContext,
  RenderedElement,
  LocalizedStrings,
  DEFAULT_THEME,
  BRAND_THEME,
  FANCY_THEME,
  LOCALIZED_STRINGS,
} from './types';

// ============================================================================
// TEMPLATE RENDERERS
// ============================================================================

export { TemplateRenderer } from './core/TemplateRenderer';
export { ModernTemplate } from './templates/ModernTemplate';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { FacturXInvoice } from '@facturx/core';
import { ModernTemplate } from './templates/ModernTemplate';
import { TemplateOptions, PDFGenerationResult, TemplateType } from './types';

/**
 * Generate PDF with modern template - Convenience function
 */
export async function generateModernPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  const template = new ModernTemplate();
  return template.generate(invoice, options);
}

/**
 * Generate PDF with specified template type
 */
export async function generatePDF(
  invoice: FacturXInvoice,
  templateType: TemplateType = TemplateType.MODERN,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  let template;

  switch (templateType) {
    case TemplateType.MODERN:
      template = new ModernTemplate();
      break;
    // Future templates:
    // case TemplateType.BRAND:
    //   template = new BrandTemplate();
    //   break;
    // case TemplateType.FANCY:
    //   template = new FancyTemplate();
    //   break;
    default:
      template = new ModernTemplate();
  }

  return template.generate(invoice, options);
}

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '1.0.0';

export const LIBRARY_INFO = Object.freeze({
  name: '@facturx/templates',
  version: VERSION,
  description: 'Professional PDF templates for Factur-X',
  license: 'MIT',
  repository: 'https://github.com/facturx/facturx-ts',
  templates: [TemplateType.MODERN],
});
