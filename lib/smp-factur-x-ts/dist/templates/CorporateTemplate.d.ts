import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class CorporateTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderCorporateHeader;
    private renderCorporateParties;
    private renderCorporateLineItems;
    private renderCorporateTotals;
    private renderTaxBreakdown;
    private renderPaymentInfo;
    private renderCorporateFooter;
    private formatCurrency;
}
//# sourceMappingURL=CorporateTemplate.d.ts.map