/**
 * @module constants
 * @description Factur-X constants and profile policies
 * Optimized for fast lookups using Maps and frozen objects
 */

import { FacturxProfile, ProfilePolicy } from '../types';

// ============================================================================
// XML NAMESPACES - Frozen for immutability
// ============================================================================

export const XML_NAMESPACES = Object.freeze({
  QDT: 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
  RAM: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
  RSM: 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
  UDT: 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
  XSI: 'http://www.w3.org/2001/XMLSchema-instance',
} as const);

// ============================================================================
// GUIDELINE URNs - Optimized Map for O(1) lookup
// ============================================================================

export const GUIDELINE_URNS = new Map<FacturxProfile, string>([
  [FacturxProfile.MINIMUM, 'urn:factur-x.eu:1p0:minimum'],
  [
    FacturxProfile.BASICWL,
    'urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basicwl',
  ],
  [
    FacturxProfile.BASIC,
    'urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basic',
  ],
  [
    FacturxProfile.EN16931,
    'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931',
  ],
  [
    FacturxProfile.EXTENDED,
    'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:extended',
  ],
]);

// ============================================================================
// PROFILE POLICIES - Optimized Map for O(1) lookup
// ============================================================================

const createProfilePolicy = (
  profile: FacturxProfile,
  mandatoryFields: string[],
  forbiddenFields: string[]
): ProfilePolicy =>
  Object.freeze({
    profile,
    mandatoryFields: Object.freeze(mandatoryFields),
    forbiddenFields: Object.freeze(forbiddenFields),
    guidelineUrn: GUIDELINE_URNS.get(profile)!,
  });

export const PROFILE_POLICIES = new Map<FacturxProfile, ProfilePolicy>([
  [
    FacturxProfile.MINIMUM,
    createProfilePolicy(
      FacturxProfile.MINIMUM,
      [
        'header.id',
        'header.invoiceDate',
        'header.typeCode',
        'seller.name',
        'buyer.name',
        'totals.grandTotal',
      ],
      [
        'lines',
        'payment.iban',
        'payment.bic',
        'header.purchaseOrderReference',
      ]
    ),
  ],
  [
    FacturxProfile.BASICWL,
    createProfilePolicy(
      FacturxProfile.BASICWL,
      [
        'header.id',
        'header.invoiceDate',
        'header.typeCode',
        'seller.name',
        'seller.address',
        'buyer.name',
        'buyer.address',
        'totals.grandTotal',
        'totals.taxTotal',
      ],
      ['lines']
    ),
  ],
  [
    FacturxProfile.BASIC,
    createProfilePolicy(
      FacturxProfile.BASIC,
      [
        'header.id',
        'header.invoiceDate',
        'header.typeCode',
        'seller.name',
        'seller.address',
        'buyer.name',
        'buyer.address',
        'lines',
        'totals.grandTotal',
        'totals.taxTotal',
      ],
      []
    ),
  ],
  [
    FacturxProfile.EN16931,
    createProfilePolicy(
      FacturxProfile.EN16931,
      [
        'header.id',
        'header.invoiceDate',
        'header.typeCode',
        'seller.name',
        'seller.address.city',
        'seller.address.postalCode',
        'seller.address.countryCode',
        'buyer.name',
        'buyer.address.city',
        'buyer.address.postalCode',
        'buyer.address.countryCode',
        'lines',
        'payment.meansCode',
        'totals.lineTotal',
        'totals.taxBasis',
        'totals.taxTotal',
        'totals.grandTotal',
      ],
      []
    ),
  ],
  [
    FacturxProfile.EXTENDED,
    createProfilePolicy(
      FacturxProfile.EXTENDED,
      [
        'header.id',
        'header.invoiceDate',
        'header.typeCode',
        'seller.name',
        'seller.address',
        'buyer.name',
        'buyer.address',
        'lines',
        'payment',
        'totals.lineTotal',
        'totals.taxBasis',
        'totals.taxTotal',
        'totals.grandTotal',
      ],
      []
    ),
  ],
]);

// ============================================================================
// DATE FORMAT
// ============================================================================

/**
 * Format code for dates in Factur-X XML (CCYYMMDD)
 */
export const DATE_FORMAT_CODE = '102' as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION_LIMITS = Object.freeze({
  MAX_INVOICE_NUMBER_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NOTE_LENGTH: 1000,
  MAX_EMAIL_LENGTH: 254,
  MAX_PHONE_LENGTH: 30,
  MAX_VAT_ID_LENGTH: 15,
  MAX_IBAN_LENGTH: 34,
  MAX_BIC_LENGTH: 11,
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 999999999.99,
  MAX_QUANTITY: 999999999.99,
  MAX_DECIMAL_PLACES: 2,
  MAX_LINES: 9999,
} as const);

// ============================================================================
// REGEX PATTERNS - Pre-compiled for performance
// ============================================================================

export const PATTERNS = Object.freeze({
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[+]?[0-9\s\-()]{6,30}$/,
  INVOICE_NUMBER: /^[A-Z0-9\-_]{1,50}$/,
  VAT_ID: /^[A-Z]{2}[A-Z0-9]{2,13}$/,
  COUNTRY_CODE: /^[A-Z]{2}$/,
  CURRENCY_CODE: /^[A-Z]{3}$/,
  IBAN: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/,
  BIC: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
} as const);

// ============================================================================
// HELPER FUNCTIONS - Optimized
// ============================================================================

/**
 * Get guideline URN for a profile (O(1) lookup)
 */
export const getGuidelineUrn = (profile: FacturxProfile): string => {
  const urn = GUIDELINE_URNS.get(profile);
  if (!urn) {
    throw new Error(`Unknown profile: ${profile}`);
  }
  return urn;
};

/**
 * Get profile policy (O(1) lookup)
 */
export const getProfilePolicy = (profile: FacturxProfile): ProfilePolicy => {
  const policy = PROFILE_POLICIES.get(profile);
  if (!policy) {
    throw new Error(`Unknown profile: ${profile}`);
  }
  return policy;
};

/**
 * Format date to CCYYMMDD (Factur-X format)
 * Optimized for performance - no regex, direct string manipulation
 */
export const formatDateFacturX = (date: Date): string => {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return year + month + day;
};

/**
 * Format amount with exactly 2 decimal places
 * Optimized: uses toFixed which is faster than regex
 */
export const formatAmount = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Validate amount is within acceptable range
 * Optimized: simple comparison operations
 */
export const isValidAmount = (amount: number): boolean => {
  return (
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= VALIDATION_LIMITS.MIN_AMOUNT &&
    amount <= VALIDATION_LIMITS.MAX_AMOUNT
  );
};
