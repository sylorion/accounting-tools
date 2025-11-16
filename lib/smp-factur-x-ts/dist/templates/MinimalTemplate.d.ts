import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class MinimalTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderMinimalHeader;
    private renderMinimalParties;
    private renderMinimalLineItems;
    private renderMinimalTotals;
    private renderTaxBreakdown;
    private renderPaymentInfo;
    private renderMinimalFooter;
    private formatCurrency;
}
//# sourceMappingURL=MinimalTemplate.d.ts.map