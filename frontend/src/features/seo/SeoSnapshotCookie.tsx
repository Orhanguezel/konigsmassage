// =============================================================
// FILE: src/features/seotest/SeoSnapshotCookie.tsx
// konigsmassage – SSR-side settings helpers for SEO tests
//  - Dynamic locales (no static supported locale list)
//  - Safe locale normalization (short tag)
// =============================================================

import { BASE_URL } from '@/integrations/rtk/constants';
import type { SupportedLocale } from '@/types/common';
import { siteUrlBase } from '@/features/seo/utils';

// RTK tarafındaki SiteSetting yapısına benzer basit tip
type SettingDoc = { key: string; value: any };

/**
 * Dynamic locale normalize:
 * - "tr-TR" -> "de"
 * - "EN_us" -> "en"
 * - empty -> ""
 */
export function normalizeLocaleTag(input: unknown): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

/** İç içe yapılardan sadece İLGİLİ dilin metnini, fallback yapmadan çıkarır */
export function readLocalizedLabel(value: any, locale: SupportedLocale): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();

  const l = normalizeLocaleTag(locale);

  const cands = [
    value?.[l],
    value?.[locale as any], // bazı payload'lar full tag tutuyor olabilir
    value?.label?.[l],
    value?.label?.[locale as any],
    value?.title?.label?.[l],
    value?.title?.label?.[locale as any],
    value?.description?.label?.[l],
    value?.description?.label?.[locale as any],
  ];

  for (const c of cands) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }

  if (typeof value === 'object') {
    if (value.label && typeof value.label === 'object') {
      const c1 = value.label?.[l];
      const c2 = value.label?.[locale as any];
      if (typeof c1 === 'string' && c1.trim()) return c1.trim();
      if (typeof c2 === 'string' && c2.trim()) return c2.trim();
    }

    // derin arama (test helper; pahalı olabilir ama güvenli)
    for (const k of Object.keys(value)) {
      const out = readLocalizedLabel(value[k], locale);
      if (out) return out;
    }
  }

  return '';
}

/**
 * BASE_URL relative ("/api") olabilir.
 * SSR testlerinde absolute URL üretmek için siteUrlBase() ile birleştir.
 */
function resolveApiBase(): string {
  const raw = String(BASE_URL || '').trim();
  if (!raw) return `${siteUrlBase()}/api`.replace(/\/+$/, '');

  // absolute ise olduğu gibi
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, '');

  // relative ise site base ile birleştir
  const base = siteUrlBase().replace(/\/+$/, '');
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${p}`.replace(/\/+$/, '');
}

/**
 * site_settings listesini çeker.
 * BE: GET /site_settings?locale=tr
 */
async function fetchSettingsList(locale: SupportedLocale): Promise<SettingDoc[]> {
  const apiBase = resolveApiBase(); // ".../api"
  const l = normalizeLocaleTag(locale) || 'de'; // son çare; API boş locale ile hata veriyorsa
  const url = `${apiBase}/site_settings?locale=${encodeURIComponent(l)}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': l,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`site_settings failed: ${res.status} ${res.statusText}`);
  }

  const j = await res.json();
  return Array.isArray(j) ? (j as SettingDoc[]) : j?.data ?? [];
}

/** Ham value’yu döndürür (array/obje/string olabilir) */
export async function getSettingValue(locale: SupportedLocale, key: string): Promise<any> {
  const list = await fetchSettingsList(locale);
  return list.find((s) => s.key === key)?.value;
}

/** Tek bir label/string gerekirken kullan (ör. başlık) */
export async function getSettingLabel(locale: SupportedLocale, key: string): Promise<string> {
  const val = await getSettingValue(locale, key);
  return readLocalizedLabel(val, locale);
}

/** SEO için iki anahtarı birden oku (fallback sadece parametre ile) */
export async function getSeoFromSettings(
  locale: SupportedLocale,
  keys: { titleKey: string; descKey: string },
  fallback: { title: string; description: string },
) {
  const list = await fetchSettingsList(locale);

  const tVal = list.find((s) => s.key === keys.titleKey)?.value;
  const dVal = list.find((s) => s.key === keys.descKey)?.value;

  const title = readLocalizedLabel(tVal, locale) || fallback.title;
  const description = readLocalizedLabel(dVal, locale) || fallback.description;

  return { title, description };
}
