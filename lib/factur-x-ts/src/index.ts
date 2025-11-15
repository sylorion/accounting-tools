/**
 * @module factur-x-ts
 * @description Factur-X (ZUGFeRD) Core Library - Production Ready
 *
 * High-performance TypeScript implementation of Factur-X 1.07.2
 * Fully compliant with EN 16931:2017 standard
 *
 * @author Factur-X Team
 * @version 1.0.0
 * @license MIT
 */

// ============================================================================
// TYPE SYSTEM
// ============================================================================

export {
  // Enums
  FacturxProfile,
  DocTypeCode,
  TaxCategoryCode,
  PaymentMeansCode,
  UnitCode,
  CurrencyCode,
  ComplianceType,

  // Core Interfaces
  PostalAddress,
  TradeParty,
  PaymentDetails,
  DocumentHeader,
  InvoiceLine,
  AllowanceCharge,

  // Tax & Summary
  TaxSummary,
  MonetarySummary,

  // Validation
  ValidationResult,

  // Advanced Types
  ProfilePolicy,
  RegionalConfig,

} from './types';

// ============================================================================
// CORE BUSINESS LOGIC
// ============================================================================

export {
  // Main Invoice Class
  FacturXInvoice,
  FacturXInvoiceBuilder,
} from './core/FacturXInvoice';

export {
  // Tax Calculator
  TaxCalculator,
} from './core/TaxCalculator';

export {
  // Immutable Entities
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLine as InvoiceLineImpl,
  AllowanceCharge as AllowanceChargeImpl,
} from './core/entities';

export {
  // Constants & Helpers
  XML_NAMESPACES,
  GUIDELINE_URNS,
  PROFILE_POLICIES,
  PATTERNS,
  REGIONAL_CONFIGS,
  getGuidelineUrn,
  getProfilePolicy,
  getRegionalConfig,
  getRegionalConfigOrDefault,
  formatDateFacturX,
  formatAmount,
} from './core/constants';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  // Input Sanitization & Validation
  escapeXml,
  unescapeXml,
  sanitizeString,
  validateEmail,
  validatePhone,
  validateCountryCode,
  validateAmount,
  validateDate,
} from './utils/InputSanitizer';

export {
  // Currency Utilities
  CurrencyFormatter,
  isValidCurrency,
  getCurrencyInfo,
  formatCurrency,
  formatAmountForXml,
  parseCurrency,
  convertCurrency,
} from './utils/CurrencyFormatter';

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '1.0.0';
export const FACTURX_VERSION = '1.07.2';
export const EN16931_VERSION = '2017';

/**
 * Library metadata
 */
export const LIBRARY_INFO = Object.freeze({
  name: '@facturx/core',
  version: VERSION,
  facturxVersion: FACTURX_VERSION,
  en16931Version: EN16931_VERSION,
  description: 'High-performance Factur-X/ZUGFeRD implementation',
  license: 'MIT',
  repository: 'https://github.com/facturx/facturx-ts',
  homepage: 'https://factur-x.eu/',
  standards: [
    'Factur-X 1.07.2',
    'EN 16931:2017',
    'ZUGFeRD 2.3',
    'CII D16B',
  ],
});
