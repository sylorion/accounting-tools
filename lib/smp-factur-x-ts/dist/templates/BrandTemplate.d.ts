import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class BrandTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderBrandHeader;
    private renderBrandParties;
    private renderBrandLineItems;
    private renderBrandTotals;
    private renderTaxBreakdown;
    private renderPaymentInfo;
    private renderBrandFooter;
    private formatCurrency;
}
//# sourceMappingURL=BrandTemplate.d.ts.map