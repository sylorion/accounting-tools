export { FacturxProfile, DocTypeCode, TaxCategoryCode, PaymentMeansCode, UnitCode, CurrencyCode, ComplianceType, PostalAddress, TradeParty, PaymentDetails, DocumentHeader, InvoiceLine, AllowanceCharge, TaxSummary, MonetarySummary, ValidationResult, ProfilePolicy, RegionalConfig, } from './types';
export { FacturXInvoice, FacturXInvoiceBuilder, } from './core/FacturXInvoice';
export { TaxCalculator, } from './core/TaxCalculator';
export { PostalAddressImpl, TradePartyImpl, PaymentDetailsImpl, DocumentHeaderImpl, InvoiceLine as InvoiceLineImpl, AllowanceCharge as AllowanceChargeImpl, } from './core/entities';
export { XML_NAMESPACES, GUIDELINE_URNS, PROFILE_POLICIES, PATTERNS, REGIONAL_CONFIGS, getGuidelineUrn, getProfilePolicy, getRegionalConfig, getRegionalConfigOrDefault, formatDateFacturX, formatAmount, } from './core/constants';
export { escapeXml, unescapeXml, sanitizeString, validateEmail, validatePhone, validateCountryCode, validateAmount, validateDate, } from './utils/InputSanitizer';
export { CurrencyFormatter, isValidCurrency, getCurrencyInfo, formatCurrency, formatAmountForXml, parseCurrency, convertCurrency, } from './utils/CurrencyFormatter';
export declare const VERSION = "1.0.0";
export declare const FACTURX_VERSION = "1.07.2";
export declare const EN16931_VERSION = "2017";
export declare const LIBRARY_INFO: Readonly<{
    name: "@facturx/core";
    version: "1.0.0";
    facturxVersion: "1.07.2";
    en16931Version: "2017";
    description: "High-performance Factur-X/ZUGFeRD implementation";
    license: "MIT";
    repository: "https://github.com/facturx/facturx-ts";
    homepage: "https://factur-x.eu/";
    standards: string[];
}>;
//# sourceMappingURL=index.d.ts.map