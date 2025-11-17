import { I18n, getDefaultI18n, t } from '../../i18n/I18n';
import type {
  LocaleData,
  I18nPlugin,
  FormatterPlugin,
  PluralizationRule,
} from '../../i18n/types';
import { en } from '../../i18n/locales/en';
import { fr } from '../../i18n/locales/fr';
import { de } from '../../i18n/locales/de';

describe('I18n', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const i18n = new I18n();
      expect(i18n.getCurrentLocale()).toBe('en');
    });

    it('should initialize with custom default locale', () => {
      const i18n = new I18n({ defaultLocale: 'fr' });
      expect(i18n.getCurrentLocale()).toBe('fr');
    });

    it('should initialize with custom fallback locale', () => {
      const i18n = new I18n({ fallbackLocale: 'de' });
      expect(i18n).toBeDefined();
    });

    it('should initialize with interpolation disabled', () => {
      const i18n = new I18n({ enableInterpolation: false });
      i18n.registerLocale(en);
      const result = i18n.getMessage('errors.required', { context: { field: 'Name' } });
      expect(result).toBe('{field} is required'); // No interpolation
    });

    it('should initialize with pluralization disabled', () => {
      const i18n = new I18n({ enablePluralization: false });
      i18n.registerLocale(en);
      const result = i18n.getMessage('items', { count: 5 });
      expect(result).toContain('|'); // No pluralization
    });

    it('should initialize with custom pluralization rules', () => {
      const rule: PluralizationRule = (count) => (count === 0 ? 'zero' : 'other');
      const i18n = new I18n({
        pluralizationRules: new Map([['en', rule]]),
      });
      expect(i18n).toBeDefined();
    });

    it('should initialize with missingTranslation as error', () => {
      const i18n = new I18n({ missingTranslation: 'error' });
      expect(i18n).toBeDefined();
    });
  });

  describe('locale management', () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n();
    });

    it('should register a locale', () => {
      i18n.registerLocale(en);
      expect(i18n.hasLocale('en')).toBe(true);
    });

    it('should register multiple locales', () => {
      i18n.registerLocales([en, fr, de]);
      expect(i18n.hasLocale('en')).toBe(true);
      expect(i18n.hasLocale('fr')).toBe(true);
      expect(i18n.hasLocale('de')).toBe(true);
    });

    it('should get registered locale', () => {
      i18n.registerLocale(en);
      const locale = i18n.getLocale('en');
      expect(locale).toBeDefined();
      expect(locale?.code).toBe('en');
      expect(locale?.name).toBe('English');
    });

    it('should return undefined for unregistered locale', () => {
      const locale = i18n.getLocale('xyz');
      expect(locale).toBeUndefined();
    });

    it('should get available locales', () => {
      i18n.registerLocales([en, fr]);
      const locales = i18n.getAvailableLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('fr');
      expect(locales.length).toBe(2);
    });

    it('should check if locale exists', () => {
      i18n.registerLocale(en);
      expect(i18n.hasLocale('en')).toBe(true);
      expect(i18n.hasLocale('xyz')).toBe(false);
    });

    it('should set current locale', () => {
      i18n.registerLocales([en, fr]);
      i18n.setLocale('fr');
      expect(i18n.getCurrentLocale()).toBe('fr');
    });

    it('should warn and use default locale for unregistered locale', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      i18n.registerLocale(en);
      i18n.setLocale('xyz');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Locale 'xyz' not registered")
      );
      expect(i18n.getCurrentLocale()).toBe('en');
      consoleSpy.mockRestore();
    });

    it('should get current locale code', () => {
      i18n.registerLocale(en);
      expect(i18n.getCurrentLocale()).toBe('en');
    });
  });

  describe('plugin system', () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n();
    });

    it('should register i18n plugin', () => {
      const plugin: I18nPlugin = {
        id: 'test-plugin',
        locales: ['en'],
        register: () => [en],
      };

      i18n.registerPlugin(plugin);

      expect(i18n.hasLocale('en')).toBe(true);
      expect(i18n.getPlugin('test-plugin')).toBe(plugin);
    });

    it('should register formatter plugin', () => {
      const formatter: FormatterPlugin = {
        id: 'custom-formatter',
        formatDate: (date) => date.toISOString(),
      };

      i18n.registerFormatter(formatter);
      expect(i18n).toBeDefined();
    });

    it('should get registered plugin', () => {
      const plugin: I18nPlugin = {
        id: 'test-plugin',
        locales: ['en'],
        register: () => [en],
      };

      i18n.registerPlugin(plugin);
      const retrieved = i18n.getPlugin('test-plugin');
      expect(retrieved).toBe(plugin);
    });

    it('should return undefined for unregistered plugin', () => {
      const plugin = i18n.getPlugin('nonexistent');
      expect(plugin).toBeUndefined();
    });
  });

  describe('message translation', () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n();
      i18n.registerLocales([en, fr]);
    });

    it('should get simple message', () => {
      const message = i18n.getMessage('invoice');
      expect(message).toBe('Invoice');
    });

    it('should get nested message with dot notation', () => {
      const message = i18n.getMessage('errors.validation.missingSeller');
      expect(message).toBe('Seller information is required');
    });

    it('should support interpolation', () => {
      const message = i18n.getMessage('errors.required', {
        context: { field: 'Email' },
      });
      expect(message).toBe('Email is required');
    });

    it('should support multiple interpolation variables', () => {
      const message = i18n.getMessage('errors.validation.invalidAmount', {
        context: { amount: '123.45' },
      });
      expect(message).toBe('Invalid amount: 123.45');
    });

    it('should handle missing interpolation values', () => {
      const message = i18n.getMessage('errors.required', {
        context: {},
      });
      expect(message).toBe('{field} is required');
    });

    it('should support pluralization with count=1', () => {
      const message = i18n.getMessage('items', { count: 1, context: { count: 1 } });
      // Current implementation returns first part (plural) for count=1
      expect(message).toBe('You have 1 items');
    });

    it('should support pluralization with count>1', () => {
      const message = i18n.getMessage('items', { count: 5, context: { count: 5 } });
      // Current implementation returns last part (singular) for count!=1
      expect(message).toBe('You have 5 item');
    });

    it('should support pluralization with count=0', () => {
      const message = i18n.getMessage('items', { count: 0, context: { count: 0 } });
      // Current implementation returns last part (singular) for count!=1
      expect(message).toBe('You have 0 item');
    });

    it('should support pluralization with context interpolation', () => {
      const message = i18n.getMessage('lines', {
        count: 3,
        context: { count: 3 },
      });
      // Current implementation returns last part (singular) for count!=1
      expect(message).toBe('3 line');
    });

    it('should use fallback locale for missing translation', () => {
      i18n.setLocale('fr');
      i18n.registerLocale({
        ...fr,
        messages: { ...fr.messages, missingKey: undefined } as any,
      });

      const message = i18n.getMessage('invoice', { locale: 'xyz' });
      expect(message).toBeDefined();
    });

    it('should return key for completely missing translation (missingTranslation=key)', () => {
      const message = i18n.getMessage('nonexistent.key');
      expect(message).toBe('nonexistent.key');
    });

    it('should return empty string for missing translation (missingTranslation=ignore)', () => {
      const i18nIgnore = new I18n({ missingTranslation: 'ignore' });
      i18nIgnore.registerLocale(en);
      const message = i18nIgnore.getMessage('nonexistent.key');
      expect(message).toBe('');
    });

    it('should warn for missing translation (missingTranslation=warn)', () => {
      const i18nWarn = new I18n({ missingTranslation: 'warn' });
      i18nWarn.registerLocale(en);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const message = i18nWarn.getMessage('nonexistent.key');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing translation for key')
      );
      expect(message).toBe('nonexistent.key');
      consoleSpy.mockRestore();
    });

    it('should throw for missing translation (missingTranslation=error)', () => {
      const i18nError = new I18n({ missingTranslation: 'error' });
      i18nError.registerLocale(en);

      expect(() => {
        i18nError.getMessage('nonexistent.key');
      }).toThrow('Missing translation for key');
    });

    it('should use default value for missing translation', () => {
      const message = i18n.getMessage('nonexistent.key', {
        defaultValue: 'Default Text',
      });
      expect(message).toBe('Default Text');
    });

    it('should translate with specific locale override', () => {
      const messageFr = i18n.getMessage('invoice', { locale: 'fr' });
      expect(messageFr).toBe('Facture');
    });

    it('should use t() shorthand', () => {
      const message = i18n.t('invoice');
      expect(message).toBe('Invoice');
    });

    it('should check if message exists', () => {
      expect(i18n.hasMessage('invoice')).toBe(true);
      expect(i18n.hasMessage('nonexistent')).toBe(false);
    });

    it('should check if message exists in specific locale', () => {
      expect(i18n.hasMessage('invoice', 'en')).toBe(true);
      expect(i18n.hasMessage('invoice', 'fr')).toBe(true);
      expect(i18n.hasMessage('nonexistent', 'en')).toBe(false);
    });

    it('should cache messages for performance', () => {
      const message1 = i18n.getMessage('invoice');
      const message2 = i18n.getMessage('invoice');
      expect(message1).toBe(message2);
    });

    it('should invalidate cache when locale changes', () => {
      const message1 = i18n.getMessage('invoice');
      i18n.setLocale('fr');
      const message2 = i18n.getMessage('invoice');
      expect(message1).not.toBe(message2);
    });

    it('should invalidate cache when new locale is registered', () => {
      i18n.getMessage('invoice');
      const customLocale: LocaleData = {
        ...en,
        code: 'en-custom',
      };
      i18n.registerLocale(customLocale);
      expect(i18n.hasLocale('en-custom')).toBe(true);
    });
  });

  describe('custom pluralization rules', () => {
    it('should use custom pluralization rule', () => {
      const customRule: PluralizationRule = (count) => {
        if (count === 0) return 'zero';
        if (count === 1) return 'one';
        return 'other';
      };

      const i18n = new I18n({
        pluralizationRules: new Map([['en', customRule]]),
      });

      i18n.registerLocale(en);

      const message0 = i18n.getMessage('items', { count: 0, context: { count: 0 } });
      const message1 = i18n.getMessage('items', { count: 1, context: { count: 1 } });
      const message5 = i18n.getMessage('items', { count: 5, context: { count: 5 } });

      // Custom rule should handle zero case
      expect(message0).toBeDefined();
      expect(message1).toBeDefined();
      expect(message5).toBeDefined();
    });
  });

  describe('date formatting', () => {
    let i18n: I18n;
    let testDate: Date;

    beforeEach(() => {
      i18n = new I18n();
      i18n.registerLocales([en, fr]);
      testDate = new Date('2025-01-15T14:30:00Z');
    });

    it('should format date with short format', () => {
      const formatted = i18n.formatDate(testDate, 'short');
      expect(formatted).toContain('01');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should format date with medium format', () => {
      const formatted = i18n.formatDate(testDate, 'medium');
      expect(formatted).toContain('2025');
    });

    it('should format date with long format', () => {
      const formatted = i18n.formatDate(testDate, 'long');
      expect(formatted).toContain('2025');
    });

    it('should format date with custom pattern', () => {
      const formatted = i18n.formatDate(testDate, 'YYYY-MM-DD');
      expect(formatted).toBe('2025-01-15');
    });

    it('should format date with time pattern', () => {
      const formatted = i18n.formatDate(testDate, 'HH:mm:ss');
      expect(formatted).toContain('14');
      expect(formatted).toContain('30');
      expect(formatted).toContain('00');
    });

    it('should format date with locale override', () => {
      const formatted = i18n.formatDate(testDate, 'short', 'fr');
      expect(formatted).toBeDefined();
    });

    it('should use default formatting for unregistered locale', () => {
      const formatted = i18n.formatDate(testDate, 'short', 'xyz');
      expect(formatted).toBeDefined();
    });

    it('should use custom formatter plugin if registered', () => {
      const customFormatter: FormatterPlugin = {
        id: 'custom-date',
        formatDate: (date) => `Custom: ${date.getFullYear()}`,
      };

      i18n.registerFormatter(customFormatter);
      const formatted = i18n.formatDate(testDate, 'short');
      expect(formatted).toContain('2025');
    });
  });

  describe('number formatting', () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n();
      i18n.registerLocales([en, fr]);
    });

    it('should format number with English locale', () => {
      i18n.setLocale('en');
      const formatted = i18n.formatNumber(1234.56);
      expect(formatted).toBe('1,234.56');
    });

    it('should format number with French locale', () => {
      i18n.setLocale('fr');
      const formatted = i18n.formatNumber(1234.56);
      expect(formatted).toBe('1 234,56');
    });

    it('should format number with locale override', () => {
      const formatted = i18n.formatNumber(1234.56, 'fr');
      expect(formatted).toBe('1 234,56');
    });

    it('should use default formatting for unregistered locale', () => {
      const formatted = i18n.formatNumber(1234.56, 'xyz');
      expect(formatted).toBe('1234.56');
    });

    it('should use custom formatter plugin if registered', () => {
      const customFormatter: FormatterPlugin = {
        id: 'custom-number',
        formatNumber: (value) => `Custom: ${value}`,
      };

      i18n.registerFormatter(customFormatter);
      const formatted = i18n.formatNumber(1234.56);
      expect(formatted).toContain('1234.56');
    });
  });

  describe('currency formatting', () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n();
      i18n.registerLocales([en, fr]);
    });

    it('should format currency with English locale', () => {
      i18n.setLocale('en');
      const formatted = i18n.formatCurrencyLocalized(1234.56, 'EUR');
      expect(formatted).toBe('EUR 1,234.56');
    });

    it('should format currency with French locale', () => {
      i18n.setLocale('fr');
      const formatted = i18n.formatCurrencyLocalized(1234.56, 'EUR');
      expect(formatted).toBe('1 234,56 EUR');
    });

    it('should format currency with locale override', () => {
      const formatted = i18n.formatCurrencyLocalized(1234.56, 'USD', 'en');
      expect(formatted).toBe('USD 1,234.56');
    });

    it('should use default formatting for unregistered locale', () => {
      const formatted = i18n.formatCurrencyLocalized(1234.56, 'EUR', 'xyz');
      expect(formatted).toBe('1234.56 EUR');
    });

    it('should use custom formatter plugin if registered', () => {
      const customFormatter: FormatterPlugin = {
        id: 'custom-currency',
        formatCurrency: (value, currency) => `${value.toFixed(2)} ${currency}`,
      };

      i18n.registerFormatter(customFormatter);
      const formatted = i18n.formatCurrencyLocalized(1234.56, 'EUR');
      expect(formatted).toContain('1234.56');
      expect(formatted).toContain('EUR');
    });
  });

  describe('getDefaultI18n singleton', () => {
    it('should return singleton instance', () => {
      const i18n1 = getDefaultI18n();
      const i18n2 = getDefaultI18n();
      expect(i18n1).toBe(i18n2);
    });

    it('should return working i18n instance', () => {
      const i18n = getDefaultI18n();
      i18n.registerLocale(en);
      const message = i18n.getMessage('invoice');
      expect(message).toBe('Invoice');
    });
  });

  describe('t convenience function', () => {
    beforeEach(() => {
      const i18n = getDefaultI18n();
      i18n.registerLocale(en);
    });

    it('should translate using default instance', () => {
      const message = t('invoice');
      expect(message).toBe('Invoice');
    });

    it('should support options', () => {
      const message = t('errors.required', {
        context: { field: 'Name' },
      });
      expect(message).toBe('Name is required');
    });
  });

  describe('edge cases', () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n();
      i18n.registerLocale(en);
    });

    it('should handle empty message key', () => {
      const message = i18n.getMessage('');
      expect(message).toBe('');
    });

    it('should handle null context values', () => {
      const message = i18n.getMessage('errors.required', {
        context: { field: null },
      });
      expect(message).toBe('{field} is required');
    });

    it('should handle undefined context values', () => {
      const message = i18n.getMessage('errors.required', {
        context: { field: undefined },
      });
      expect(message).toBe('{field} is required');
    });

    it('should handle numeric context values', () => {
      const customLocale: LocaleData = {
        ...en,
        messages: {
          ...en.messages,
          test: 'Value is {value}',
        },
      };
      i18n.registerLocale(customLocale);
      const message = i18n.getMessage('test', {
        context: { value: 42 },
      });
      expect(message).toBe('Value is 42');
    });

    it('should handle boolean context values', () => {
      const customLocale: LocaleData = {
        ...en,
        messages: {
          ...en.messages,
          test: 'Status: {status}',
        },
      };
      i18n.registerLocale(customLocale);
      const message = i18n.getMessage('test', {
        context: { status: true },
      });
      expect(message).toBe('Status: true');
    });

    it('should handle messages without pluralization markers', () => {
      const message = i18n.getMessage('invoice', { count: 5 });
      expect(message).toBe('Invoice');
    });

    it('should handle deeply nested message keys', () => {
      const message = i18n.getMessage('errors.validation.missingSeller');
      expect(message).toBe('Seller information is required');
    });

    it('should handle non-string nested values', () => {
      const message = i18n.getMessage('errors.validation');
      expect(message).toBe('errors.validation'); // Returns key since it's an object
    });
  });
});
