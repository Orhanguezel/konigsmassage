// =============================================================
// FILE: src/i18n/adminUi.ts
// Admin panel i18n support - JSON based translations
// =============================================================
'use client';


import tr from '../locale/tr.json';
import en from '../locale/en.json';
import de from '../locale/de.json';

const translations: Record<string, any> = { tr, en, de };

/**
 * Supported languages for admin panel
 */
export type AdminLocale = 'tr' | 'en' | 'de';

/**
 * Dynamically derived list of available admin locales from translations JSON.
 */
export const ADMIN_LOCALE_LIST = Object.keys(translations) as AdminLocale[];

const ADMIN_LOCALE_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
};

export const ADMIN_LOCALE_OPTIONS: { value: string; label: string }[] =
  ADMIN_LOCALE_LIST.map((code) => ({
    value: code,
    label: ADMIN_LOCALE_LABELS[code] || code.toUpperCase(),
  }));

/**
 * Get translation by path (e.g., "admin.common.save")
 */
function getTranslationByPath(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Simple template replacement: "Hello {name}" + {name: "World"} => "Hello World"
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;

  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Translation function type
 */
export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
  fallback?: string,
) => string;

/**
 * Get translation function for specific locale
 */
export function getAdminTranslations(locale: AdminLocale = 'tr'): TranslateFn {
  const normalizedLocale = (['tr', 'en', 'de'].includes(locale) ? locale : 'tr') as AdminLocale;

  return (key: string, params?: Record<string, string | number>, fallback?: string): string => {
    // Try current locale
    let text = getTranslationByPath(translations[normalizedLocale], key);

    // Fallback to Turkish
    if (!text && normalizedLocale !== 'tr') {
      text = getTranslationByPath(translations.tr, key);
    }

    // Fallback to English
    if (!text && normalizedLocale !== 'en') {
      text = getTranslationByPath(translations.en, key);
    }

    // Use provided fallback or key itself
    const finalText = text || fallback || key;

    return interpolate(finalText, params);
  };
}

/**
 * Hook for admin translations
 * Usage: const t = useAdminTranslations(locale);
 *        t('admin.common.save'); => "Kaydet" (tr) or "Save" (en)
 */
export function useAdminTranslations(locale?: string): TranslateFn {
  // Normalize locale: "tr-TR" => "tr"
  const normalizedLocale = String(locale || 'tr')
    .toLowerCase()
    .split('-')[0]
    .split('_')[0];

  const adminLocale = (['tr', 'en', 'de'].includes(normalizedLocale)
    ? normalizedLocale
    : 'tr') as AdminLocale;

  return getAdminTranslations(adminLocale);
}

/**
 * Get all translations for a section
 * Usage: const seo = getAdminSection('tr', 'admin.siteSettings.seo');
 */
export function getAdminSection(
  locale: AdminLocale,
  section: string,
): Record<string, string> | undefined {
  const obj = getTranslationByPath(translations[locale], section);
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return obj as Record<string, string>;
  }
  return undefined;
}
