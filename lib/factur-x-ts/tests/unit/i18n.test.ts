/**
 * @file i18n.test.ts
 * @description Comprehensive unit tests for i18n system
 */

import { I18n, getDefaultI18n, t } from '../../src/i18n/I18n';
import type { LocaleData, I18nPlugin, FormatterPlugin } from '../../src/i18n/types';

describe('I18n', () => {
  describe('Constructor and Options', () => {
    it('should create i18n instance with default options', () => {
      const i18n = new I18n();

      expect(i18n.getCurrentLocale()).toBe('en');
      expect(i18n.getAvailableLocales()).toEqual([]);
    });

    it('should create i18n instance with custom options', () => {
      const i18n = new I18n({
        defaultLocale: 'fr',
        fallbackLocale: 'en',
        missingTranslation: 'warn',
      });

      expect(i18n.getCurrentLocale()).toBe('fr');
    });

    it('should honor interpolation and pluralization flags', () => {
      const i18n = new I18n({
        enableInterpolation: false,
        enablePluralization: false,
      });

      const localeData = createTestLocale('en', {
        greeting: 'Hello {name}',
        items: '{count} item | {count} items',
      });

      i18n.registerLocale(localeData);

      // With interpolation disabled
      const greeting = i18n.getMessage('greeting', { context: { name: 'John' } });
      expect(greeting).toBe('Hello {name}'); // Not interpolated

      // With pluralization disabled
      const items = i18n.getMessage('items', { count: 5 });
      expect(items).toContain('|'); // Not pluralized
    });
  });

  describe('Locale Management', () => {
    it('should register a single locale', () => {
      const i18n = new I18n();
      const locale = createTestLocale('fr', { hello: 'Bonjour' });

      i18n.registerLocale(locale);

      expect(i18n.hasLocale('fr')).toBe(true);
      expect(i18n.getLocale('fr')).toEqual(locale);
    });

    it('should register multiple locales', () => {
      const i18n = new I18n();
      const locales = [
        createTestLocale('en', { hello: 'Hello' }),
        createTestLocale('fr', { hello: 'Bonjour' }),
        createTestLocale('de', { hello: 'Hallo' }),
      ];

      i18n.registerLocales(locales);

      expect(i18n.getAvailableLocales()).toEqual(['en', 'fr', 'de']);
    });

    it('should get registered locale', () => {
      const i18n = new I18n();
      const locale = createTestLocale('es', { hello: 'Hola' });

      i18n.registerLocale(locale);

      const retrieved = i18n.getLocale('es');
      expect(retrieved).toEqual(locale);
    });

    it('should return undefined for non-existent locale', () => {
      const i18n = new I18n();

      const locale = i18n.getLocale('nonexistent' as any);
      expect(locale).toBeUndefined();
    });

    it('should set current locale', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('fr', { hello: 'Bonjour' }));

      i18n.setLocale('fr');

      expect(i18n.getCurrentLocale()).toBe('fr');
    });

    it('should warn and use default locale when setting non-existent locale', () => {
      const i18n = new I18n({ defaultLocale: 'en' });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      i18n.setLocale('nonexistent' as any);

      expect(i18n.getCurrentLocale()).toBe('en');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not registered'));

      consoleSpy.mockRestore();
    });

    it('should list all available locales', () => {
      const i18n = new I18n();
      i18n.registerLocales([
        createTestLocale('en', {}),
        createTestLocale('fr', {}),
        createTestLocale('de', {}),
      ]);

      const available = i18n.getAvailableLocales();

      expect(available).toHaveLength(3);
      expect(available).toContain('en');
      expect(available).toContain('fr');
      expect(available).toContain('de');
    });
  });

  describe('Plugin System', () => {
    it('should register i18n plugin', () => {
      const i18n = new I18n();
      const plugin: I18nPlugin = {
        id: 'test-plugin',
        locales: ['test'] as any,
        register: () => [createTestLocale('test', { hello: 'Test Hello' })],
      };

      i18n.registerPlugin(plugin);

      expect(i18n.getPlugin('test-plugin')).toBe(plugin);
      expect(i18n.hasLocale('test')).toBe(true);
    });

    it('should register formatter plugin', () => {
      const i18n = new I18n();
      const formatter: FormatterPlugin = {
        id: 'custom-formatter',
        formatDate: (date) => date.toISOString(),
      };

      i18n.registerFormatter(formatter);

      i18n.registerLocale(createTestLocale('en', {}));
      const result = i18n.formatDate(new Date('2023-11-15T12:00:00Z'));

      expect(result).toContain('2023-11-15');
    });
  });

  describe('Message Translation', () => {
    it('should translate simple message', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        welcome: 'Welcome to our application',
      }));

      const message = i18n.getMessage('welcome');

      expect(message).toBe('Welcome to our application');
    });

    it('should support dot notation for nested keys', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        errors: {
          validation: {
            required: 'This field is required',
            email: 'Invalid email format',
          },
        },
      }));

      const required = i18n.getMessage('errors.validation.required');
      const email = i18n.getMessage('errors.validation.email');

      expect(required).toBe('This field is required');
      expect(email).toBe('Invalid email format');
    });

    it('should use shorthand t() method', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        hello: 'Hello World',
      }));

      const message = i18n.t('hello');

      expect(message).toBe('Hello World');
    });

    it('should fallback to fallback locale', () => {
      const i18n = new I18n({ fallbackLocale: 'en' });
      i18n.registerLocales([
        createTestLocale('en', { welcome: 'Welcome' }),
        createTestLocale('fr', { hello: 'Bonjour' }), // Missing 'welcome'
      ]);

      i18n.setLocale('fr');
      const message = i18n.getMessage('welcome');

      expect(message).toBe('Welcome'); // Falls back to English
    });

    it('should return key when translation missing (default behavior)', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {}));

      const message = i18n.getMessage('nonexistent.key');

      expect(message).toBe('nonexistent.key');
    });

    it('should return default value when translation missing', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {}));

      const message = i18n.getMessage('nonexistent', { defaultValue: 'Default Message' });

      expect(message).toBe('Default Message');
    });

    it('should throw error when missing translation and missingTranslation=error', () => {
      const i18n = new I18n({ missingTranslation: 'error' });
      i18n.registerLocale(createTestLocale('en', {}));

      expect(() => {
        i18n.getMessage('nonexistent');
      }).toThrow('Missing translation');
    });

    it('should warn when missing translation and missingTranslation=warn', () => {
      const i18n = new I18n({ missingTranslation: 'warn' });
      i18n.registerLocale(createTestLocale('en', {}));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const message = i18n.getMessage('nonexistent');

      expect(message).toBe('nonexistent');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Missing translation'));

      consoleSpy.mockRestore();
    });

    it('should return empty string when missing translation and missingTranslation=ignore', () => {
      const i18n = new I18n({ missingTranslation: 'ignore' });
      i18n.registerLocale(createTestLocale('en', {}));

      const message = i18n.getMessage('nonexistent');

      expect(message).toBe('');
    });

    it('should check if message exists', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        existing: 'This exists',
      }));

      expect(i18n.hasMessage('existing')).toBe(true);
      expect(i18n.hasMessage('nonexistent')).toBe(false);
    });
  });

  describe('Interpolation', () => {
    it('should interpolate single placeholder', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        greeting: 'Hello {name}',
      }));

      const message = i18n.getMessage('greeting', {
        context: { name: 'John' },
      });

      expect(message).toBe('Hello John');
    });

    it('should interpolate multiple placeholders', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        order: 'Order #{orderId} for {customer} - Total: ${amount}',
      }));

      const message = i18n.getMessage('order', {
        context: { orderId: '12345', customer: 'Alice', amount: '99.99' },
      });

      expect(message).toBe('Order #12345 for Alice - Total: $99.99');
    });

    it('should handle missing context values gracefully', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        greeting: 'Hello {name}, welcome {user}',
      }));

      const message = i18n.getMessage('greeting', {
        context: { name: 'John' }, // 'user' missing
      });

      expect(message).toBe('Hello John, welcome {user}');
    });

    it('should convert non-string context values to strings', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        stats: 'Count: {count}, Active: {active}',
      }));

      const message = i18n.getMessage('stats', {
        context: { count: 42, active: true },
      });

      expect(message).toBe('Count: 42, Active: true');
    });
  });

  describe('Pluralization', () => {
    it('should pluralize with default English rules (singular)', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        items: '{count} item | {count} items',
      }));

      const message = i18n.getMessage('items', {
        count: 1,
        context: { count: 1 },
      });

      expect(message).toBe('1 item');
    });

    it('should pluralize with default English rules (plural)', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        items: '{count} item | {count} items',
      }));

      const message = i18n.getMessage('items', {
        count: 5,
        context: { count: 5 },
      });

      expect(message).toBe('5 items');
    });

    it('should handle zero as plural', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        items: '{count} item | {count} items',
      }));

      const message = i18n.getMessage('items', {
        count: 0,
        context: { count: 0 },
      });

      expect(message).toBe('0 items');
    });

    it('should use custom pluralization rules', () => {
      const customRule = (count: number) => {
        // Russian-style: one, few, many
        if (count === 1) return 'one';
        if (count >= 2 && count <= 4) return 'few';
        return 'many';
      };

      const i18n = new I18n({
        pluralizationRules: new Map([['ru', customRule]]),
      });

      i18n.registerLocale(createTestLocale('ru', {
        items: '{count} предмет | {count} предмета',
      }));

      i18n.setLocale('ru');

      const one = i18n.getMessage('items', { count: 1, context: { count: 1 } });
      const few = i18n.getMessage('items', { count: 3, context: { count: 3 } });

      expect(one).toBe('1 предмет');
      expect(few).toBe('3 предмета');
    });

    it('should handle messages without pluralization', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        static: 'This is static text',
      }));

      const message = i18n.getMessage('static', { count: 5 });

      expect(message).toBe('This is static text');
    });
  });

  describe('Date Formatting', () => {
    it('should format date with default medium format', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {}));

      const date = new Date('2023-11-15T12:30:00Z');
      const formatted = i18n.formatDate(date);

      expect(formatted).toContain('2023');
      expect(formatted).toContain('11');
      expect(formatted).toContain('15');
    });

    it('should format date with custom pattern', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {}));

      const date = new Date('2023-11-15T12:30:45Z');
      const formatted = i18n.formatDate(date, 'YYYY-MM-DD HH:mm:ss');

      expect(formatted).toBe('2023-11-15 12:30:45');
    });

    it('should use locale-specific date formats', () => {
      const i18n = new I18n();
      const locale = createTestLocaleWithDateFormat('fr', {}, 'DD/MM/YYYY');

      i18n.registerLocale(locale);
      i18n.setLocale('fr');

      const date = new Date('2023-11-15T00:00:00Z');
      const formatted = i18n.formatDate(date, 'medium');

      expect(formatted).toBe('15/11/2023');
    });
  });

  describe('Number Formatting', () => {
    it('should format number with default locale', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {}));

      const formatted = i18n.formatNumber(1234567.89);

      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
      expect(formatted).toContain('567');
      expect(formatted).toContain('89');
    });

    it('should use locale-specific number separators', () => {
      const i18n = new I18n();
      const locale = createTestLocaleWithNumberFormats('fr', {}, ',', ' ');

      i18n.registerLocale(locale);
      i18n.setLocale('fr');

      const formatted = i18n.formatNumber(1234.56);

      expect(formatted).toContain(','); // Decimal separator
      expect(formatted).toContain(' '); // Thousands separator
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with default locale', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {}));

      const formatted = i18n.formatCurrencyLocalized(1234.56, 'USD');

      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
      expect(formatted).toContain('56');
      expect(formatted).toContain('USD');
    });

    it('should use locale-specific currency format', () => {
      const i18n = new I18n();
      const locale = createTestLocaleWithCurrencyFormat('fr', {}, '{amount} {currency}');

      i18n.registerLocale(locale);
      i18n.setLocale('fr');

      const formatted = i18n.formatCurrencyLocalized(100.00, 'EUR');

      expect(formatted).toMatch(/[\d\s.,]+\s+EUR/);
    });
  });

  describe('Caching', () => {
    it('should cache translated messages', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        hello: 'Hello',
      }));

      // First call
      const message1 = i18n.getMessage('hello');

      // Second call should use cache
      const message2 = i18n.getMessage('hello');

      expect(message1).toBe(message2);
    });

    it('should invalidate cache when locale is added', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', { hello: 'Hello' }));

      i18n.getMessage('hello'); // Cache it

      // Add new locale (should clear cache)
      i18n.registerLocale(createTestLocale('fr', { hello: 'Bonjour' }));

      // Should work without issues
      const message = i18n.getMessage('hello');
      expect(message).toBe('Hello');
    });

    it('should invalidate cache when locale is changed', () => {
      const i18n = new I18n();
      i18n.registerLocales([
        createTestLocale('en', { hello: 'Hello' }),
        createTestLocale('fr', { hello: 'Bonjour' }),
      ]);

      i18n.getMessage('hello'); // Cache English

      i18n.setLocale('fr'); // Should clear cache

      const message = i18n.getMessage('hello');
      expect(message).toBe('Bonjour');
    });

    it('should cache different translations with different contexts', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        greeting: 'Hello {name}',
      }));

      const message1 = i18n.getMessage('greeting', { context: { name: 'John' } });
      const message2 = i18n.getMessage('greeting', { context: { name: 'Jane' } });

      expect(message1).toBe('Hello John');
      expect(message2).toBe('Hello Jane');
    });
  });

  describe('Singleton and Convenience Functions', () => {
    it('should get default i18n instance', () => {
      const i18n1 = getDefaultI18n();
      const i18n2 = getDefaultI18n();

      // Should be same instance (singleton)
      expect(i18n1).toBe(i18n2);
    });

    it('should translate with convenience t() function', () => {
      const i18n = getDefaultI18n();
      i18n.registerLocale(createTestLocale('en', {
        test: 'Test Message',
      }));

      const message = t('test');

      expect(message).toBe('Test Message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message keys', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {}));

      const message = i18n.getMessage('');

      expect(message).toBe('');
    });

    it('should handle null and undefined in context', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        test: 'Value: {value}',
      }));

      const messageNull = i18n.getMessage('test', {
        context: { value: null },
      });
      const messageUndefined = i18n.getMessage('test', {
        context: { value: undefined },
      });

      // Should leave placeholder unchanged for null/undefined
      expect(messageNull).toBe('Value: {value}');
      expect(messageUndefined).toBe('Value: {value}');
    });

    it('should handle deeply nested message keys', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        level1: {
          level2: {
            level3: {
              level4: 'Deep Message',
            },
          },
        },
      }));

      const message = i18n.getMessage('level1.level2.level3.level4');

      expect(message).toBe('Deep Message');
    });

    it('should handle non-string nested values gracefully', () => {
      const i18n = new I18n();
      i18n.registerLocale(createTestLocale('en', {
        object: {
          nested: 'value',
        },
      }));

      // Requesting the object itself (not a string)
      const message = i18n.getMessage('object');

      // Should return key since object is not a string
      expect(message).toBe('object');
    });
  });
});

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create test locale data
 */
function createTestLocale(code: string, messages: any): LocaleData {
  return {
    code: code as any,
    name: `Test ${code.toUpperCase()}`,
    direction: 'ltr',
    messages,
    dateFormats: {
      short: 'MM/DD/YYYY',
      medium: 'YYYY-MM-DD',
      long: 'MMMM DD, YYYY',
      full: 'dddd, MMMM DD, YYYY',
      time: 'HH:mm',
      datetime: 'YYYY-MM-DD HH:mm',
    },
    numberFormats: {
      decimal: '.',
      thousands: ',',
      currency: '{currency} {amount}',
      percentage: '{amount}%',
    },
  };
}

function createTestLocaleWithNumberFormats(code: string, messages: any, decimal: string, thousands: string): LocaleData {
  return {
    code: code as any,
    name: `Test ${code.toUpperCase()}`,
    direction: 'ltr',
    messages,
    dateFormats: {
      short: 'MM/DD/YYYY',
      medium: 'YYYY-MM-DD',
      long: 'MMMM DD, YYYY',
      full: 'dddd, MMMM DD, YYYY',
      time: 'HH:mm',
      datetime: 'YYYY-MM-DD HH:mm',
    },
    numberFormats: {
      decimal,
      thousands,
      currency: '{currency} {amount}',
      percentage: '{amount}%',
    },
  };
}

function createTestLocaleWithCurrencyFormat(code: string, messages: any, currencyFormat: string): LocaleData {
  return {
    code: code as any,
    name: `Test ${code.toUpperCase()}`,
    direction: 'ltr',
    messages,
    dateFormats: {
      short: 'MM/DD/YYYY',
      medium: 'YYYY-MM-DD',
      long: 'MMMM DD, YYYY',
      full: 'dddd, MMMM DD, YYYY',
      time: 'HH:mm',
      datetime: 'YYYY-MM-DD HH:mm',
    },
    numberFormats: {
      decimal: '.',
      thousands: ',',
      currency: currencyFormat,
      percentage: '{amount}%',
    },
  };
}

function createTestLocaleWithDateFormat(code: string, messages: any, mediumFormat: string): LocaleData {
  return {
    code: code as any,
    name: `Test ${code.toUpperCase()}`,
    direction: 'ltr',
    messages,
    dateFormats: {
      short: 'MM/DD/YYYY',
      medium: mediumFormat,
      long: 'MMMM DD, YYYY',
      full: 'dddd, MMMM DD, YYYY',
      time: 'HH:mm',
      datetime: 'YYYY-MM-DD HH:mm',
    },
    numberFormats: {
      decimal: '.',
      thousands: ',',
      currency: '{currency} {amount}',
      percentage: '{amount}%',
    },
  };
}
