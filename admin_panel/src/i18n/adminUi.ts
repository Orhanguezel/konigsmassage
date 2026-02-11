// =============================================================
// FILE: src/i18n/adminUi.ts
// Admin panel i18n support - JSON based translations
// =============================================================
'use client';

import tr from '@/locale/tr.json';
import en from '@/locale/en.json';
import de from '@/locale/de.json';
import { normLocaleTag } from './localeUtils';
import { buildTranslator, getValueByPath, type TranslateFn } from './translation-utils';

const translations = { tr, en, de } as const;

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

function isAdminLocale(v: string): v is AdminLocale {
  return (ADMIN_LOCALE_LIST as readonly string[]).includes(v);
}

/**
 * Get translation function for specific locale
 */
export function getAdminTranslations(locale: AdminLocale = 'tr'): TranslateFn {
  const normalized = normLocaleTag(locale);
  const activeLocale: AdminLocale = isAdminLocale(normalized) ? normalized : 'tr';

  const fallbackChain = [activeLocale, 'tr', 'en', 'de'] as const satisfies readonly AdminLocale[];

  return buildTranslator<AdminLocale>({
    translations,
    locales: ADMIN_LOCALE_LIST,
    fallbackChain,
  });
}

/**
 * Hook for admin translations
 * Usage: const t = useAdminTranslations(locale);
 *        t('admin.common.save'); => "Kaydet" (tr) or "Save" (en)
 */
export function useAdminTranslations(locale?: string): TranslateFn {
  const normalized = normLocaleTag(locale) || 'tr';
  const adminLocale: AdminLocale = isAdminLocale(normalized) ? normalized : 'tr';
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
  const v = getValueByPath(translations[locale], section);
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;

  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === 'string') out[k] = val;
  }
  return Object.keys(out).length ? out : undefined;
}
