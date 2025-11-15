import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class ModernTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderTaxBreakdown;
    private renderPaymentTerms;
    private renderFooter;
    private formatCurrency;
    private getPaymentMeansLabel;
}
//# sourceMappingURL=ModernTemplate.d.ts.map