/**
 * @module i18n/locales
 * @description Default locale exports and helpers
 */

import { en } from './en';
import { fr } from './fr';
import { de } from './de';
import type { LocaleData } from '../types';

// ============================================================================
// EXPORTS
// ============================================================================

export { en, fr, de };

/**
 * All default locales
 */
export const DEFAULT_LOCALES: ReadonlyArray<LocaleData> = Object.freeze([en, fr, de]);

/**
 * Get locale by code - O(n) linear search (small n=3)
 */
export function getLocaleByCode(code: string): LocaleData | undefined {
  return DEFAULT_LOCALES.find(loc => loc.code === code);
}

/**
 * Get all available locale codes
 */
export function getAvailableLocaleCodes(): string[] {
  return DEFAULT_LOCALES.map(loc => loc.code);
}
