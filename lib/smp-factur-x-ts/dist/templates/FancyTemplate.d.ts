import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class FancyTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderFancyHeader;
    private renderFancyParties;
    private renderFancyLineItems;
    private renderFancyTotals;
    private renderFancyTaxBreakdown;
    private renderPaymentTerms;
    private renderFancyFooter;
    private formatCurrency;
}
//# sourceMappingURL=FancyTemplate.d.ts.map