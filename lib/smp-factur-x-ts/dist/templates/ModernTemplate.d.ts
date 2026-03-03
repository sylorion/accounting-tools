import { PDFPage } from 'pdf-lib';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class ModernTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderPaymentAndTotals;
    private renderTaxBreakdown;
    private getPaymentMeansLabel;
    protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void;
}
//# sourceMappingURL=ModernTemplate.d.ts.map