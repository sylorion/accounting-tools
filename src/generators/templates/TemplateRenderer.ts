// src/generators/templates/TemplateRenderer.ts
import { PDFDocument } from 'pdf-lib';
import { Invoice } from '../../models/Invoice';
import { RendererOption } from './RendererOption';
import { InvoiceLineCore } from '../../models/InvoiceLineCore';

export interface TemplateRenderer<TLine extends InvoiceLineCore = InvoiceLineCore> {

  render(
    pdfDoc: PDFDocument,
    invoice: Invoice<TLine>,
    mergedOptions: RendererOption<TLine>
  ): Promise<void>;
}
