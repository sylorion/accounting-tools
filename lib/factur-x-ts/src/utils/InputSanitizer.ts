/**
 * @module InputSanitizer
 * @description Optimized input validation and sanitization
 * All methods are pure functions for maximum performance
 */

import { ValidationResult } from '../types';
import { PATTERNS, VALIDATION_LIMITS } from '../core/constants';

// ============================================================================
// XML ESCAPE MAP - Pre-built for O(1) lookups
// ============================================================================

const XML_ESCAPE_MAP = new Map<string, string>([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>',
'&gt;'],
  ['"', '&quot;'],
  ["'", '&apos;'],
]);

const XML_UNESCAPE_MAP = new Map<string, string>([
  ['&amp;', '&'],
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&quot;', '"'],
  ['&apos;', "'"],
]);

// Regex for XML escape (compiled once)
const XML_SPECIAL_CHARS_REGEX = /[&<>"']/g;
const XML_ENTITY_REGEX = /&(?:amp|lt|gt|quot|apos);/g;

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize string - Optimized with early returns
 */
export const sanitizeString = (
  input: string | null | undefined,
  options?: {
    maxLength?: number;
    allowNewlines?: boolean;
    allowXmlChars?: boolean;
    pattern?: RegExp;
  }
): string => {
  // Fast path: null/undefined
  if (input === null || input === undefined) {
    return '';
  }

  let result = input.trim();

  // Fast path: empty string
  if (result.length === 0) {
    return result;
  }

  // Truncate if needed (before other operations for efficiency)
  if (options?.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength);
  }

  // Remove control characters (optimized regex)
  if (!options?.allowNewlines) {
    result = result.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    result = result.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  }

  // Escape XML if needed
  if (!options?.allowXmlChars) {
    result = escapeXml(result);
  }

  // Validate pattern if provided
  if (options?.pattern && !options.pattern.test(result)) {
    throw new Error(`Input does not match required pattern: ${options.pattern}`);
  }

  return result;
};

/**
 * Escape XML special characters - Optimized with Map lookup
 */
export const escapeXml = (input: string): string => {
  return input.replace(XML_SPECIAL_CHARS_REGEX, (char) => XML_ESCAPE_MAP.get(char) || char);
};

/**
 * Unescape XML entities - Optimized with Map lookup
 */
export const unescapeXml = (input: string): string => {
  return input.replace(XML_ENTITY_REGEX, (entity) => XML_UNESCAPE_MAP.get(entity) || entity);
};

// ============================================================================
// VALIDATION HELPERS - Pure functions
// ============================================================================

/**
 * Create validation result - Optimized factory
 */
const createValidationResult = (
  isValid: boolean,
  errors: string[] = [],
  warnings: string[] = []
): ValidationResult => ({
  isValid,
  errors: Object.freeze(errors),
  warnings: Object.freeze(warnings),
});

/**
 * Validate email - Optimized with pre-compiled regex
 */
export const validateEmail = (email: string | null | undefined): ValidationResult => {
  if (!email || email.trim() === '') {
    return createValidationResult(false, ['Email is required']);
  }

  const sanitized = sanitizeString(email, { maxLength: VALIDATION_LIMITS.MAX_EMAIL_LENGTH });

  if (!PATTERNS.EMAIL.test(sanitized)) {
    return createValidationResult(false, ['Invalid email format']);
  }

  if (sanitized.length > VALIDATION_LIMITS.MAX_EMAIL_LENGTH) {
    return createValidationResult(false, [
      `Email too long (max ${VALIDATION_LIMITS.MAX_EMAIL_LENGTH} characters)`,
    ]);
  }

  return createValidationResult(true);
};

/**
 * Validate phone - Optimized
 */
export const validatePhone = (phone: string | null | undefined): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return createValidationResult(false, ['Phone is required']);
  }

  const sanitized = sanitizeString(phone, { maxLength: VALIDATION_LIMITS.MAX_PHONE_LENGTH });

  if (!PATTERNS.PHONE.test(sanitized)) {
    return createValidationResult(false, ['Invalid phone number format']);
  }

  return createValidationResult(true);
};

/**
 * Validate invoice number - Optimized
 */
export const validateInvoiceNumber = (
  invoiceNumber: string | null | undefined
): ValidationResult => {
  if (!invoiceNumber || invoiceNumber.trim() === '') {
    return createValidationResult(false, ['Invoice number is required']);
  }

  const sanitized = sanitizeString(invoiceNumber, {
    maxLength: VALIDATION_LIMITS.MAX_INVOICE_NUMBER_LENGTH,
  });

  if (!/^[A-Z0-9\-_]+$/i.test(sanitized)) {
    return createValidationResult(false, [
      'Invoice number must contain only alphanumeric characters, hyphens, and underscores',
    ]);
  }

  return createValidationResult(true);
};

/**
 * Validate country code - Optimized with pre-compiled regex
 */
export const validateCountryCode = (code: string | null | undefined): ValidationResult => {
  if (!code || code.trim() === '') {
    return createValidationResult(false, ['Country code is required']);
  }

  const sanitized = code.trim().toUpperCase();

  if (!PATTERNS.COUNTRY_CODE.test(sanitized)) {
    return createValidationResult(false, [
      'Invalid country code (must be 2-letter ISO 3166-1 alpha-2 code)',
    ]);
  }

  return createValidationResult(true);
};

/**
 * Validate currency code - Optimized
 */
export const validateCurrencyCode = (code: string | null | undefined): ValidationResult => {
  if (!code || code.trim() === '') {
    return createValidationResult(false, ['Currency code is required']);
  }

  const sanitized = code.trim().toUpperCase();

  if (!PATTERNS.CURRENCY_CODE.test(sanitized)) {
    return createValidationResult(false, [
      'Invalid currency code (must be 3-letter ISO 4217 code)',
    ]);
  }

  return createValidationResult(true);
};

/**
 * Validate VAT number - Optimized
 */
export const validateVatNumber = (vat: string | null | undefined): ValidationResult => {
  if (!vat || vat.trim() === '') {
    return createValidationResult(false, ['VAT number is required']);
  }

  const sanitized = vat.trim().toUpperCase();

  if (!PATTERNS.VAT_ID.test(sanitized)) {
    return createValidationResult(false, [
      'Invalid VAT number format (must start with 2-letter country code followed by 2-13 alphanumeric characters)',
    ]);
  }

  if (sanitized.length > VALIDATION_LIMITS.MAX_VAT_ID_LENGTH) {
    return createValidationResult(false, [
      `VAT number too long (max ${VALIDATION_LIMITS.MAX_VAT_ID_LENGTH} characters)`,
    ]);
  }

  return createValidationResult(true);
};

/**
 * Validate amount - Optimized with simple number operations
 */
export const validateAmount = (
  amount: number | null | undefined,
  min?: number,
  max?: number
): ValidationResult => {
  if (amount === null || amount === undefined) {
    return createValidationResult(false, ['Amount is required']);
  }

  if (isNaN(amount)) {
    return createValidationResult(false, ['Amount must be a number']);
  }

  if (!isFinite(amount)) {
    return createValidationResult(false, ['Amount must be finite']);
  }

  if (min !== undefined && amount < min) {
    return createValidationResult(false, [`Amount must be at least ${min}`]);
  }

  if (max !== undefined && amount > max) {
    return createValidationResult(false, [`Amount must be at most ${max}`]);
  }

  // Check decimal places (optimized without regex)
  const amountStr = amount.toFixed(VALIDATION_LIMITS.MAX_DECIMAL_PLACES + 1);
  const decimalPart = amountStr.split('.')[1];
  if (decimalPart && decimalPart.replace(/0+$/, '').length > VALIDATION_LIMITS.MAX_DECIMAL_PLACES) {
    return createValidationResult(false, [
      `Amount cannot have more than ${VALIDATION_LIMITS.MAX_DECIMAL_PLACES} decimal places`,
    ]);
  }

  return createValidationResult(true);
};

/**
 * Validate date - Optimized
 */
export const validateDate = (
  date: Date | null | undefined,
  minDate?: Date,
  maxDate?: Date
): ValidationResult => {
  if (!date) {
    return createValidationResult(false, ['Date is required']);
  }

  if (isNaN(date.getTime())) {
    return createValidationResult(false, ['Invalid date']);
  }

  if (minDate && date < minDate) {
    return createValidationResult(false, [
      `Date must be on or after ${minDate.toISOString().split('T')[0]}`,
    ]);
  }

  if (maxDate && date > maxDate) {
    return createValidationResult(false, [
      `Date must be on or before ${maxDate.toISOString().split('T')[0]}`,
    ]);
  }

  return createValidationResult(true);
};

/**
 * Combine validation results - Optimized
 */
export const combineValidationResults = (
  ...results: ValidationResult[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  // Single pass through all results
  for (const result of results) {
    if (!result.isValid) {
      isValid = false;
    }
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return createValidationResult(isValid, errors, warnings);
};

// ============================================================================
// EXPORTS
// ============================================================================

export const InputSanitizer = {
  sanitizeString,
  escapeXml,
  unescapeXml,
  validateEmail,
  validatePhone,
  validateInvoiceNumber,
  validateCountryCode,
  validateCurrencyCode,
  validateVatNumber,
  validateAmount,
  validateDate,
  combineValidationResults,
} as const;
