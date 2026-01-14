// SSR-side settings helper'ları (SEO, başlık vs. için)

// ✅ Yeni importlar
import { BASE_URL } from '@/integrations/rtk/constants';
import { normLocaleTag } from '@/i18n/localeUtils';
import { siteUrlBase } from '@/features/seo/utils';

// Dinamik locale: artık sabit liste yok
export type RuntimeLocale = string;

// RTK tarafındaki SiteSetting yapısına benzer basit tip
type SettingDoc = { key: string; value: any };

function toShortLocale(v: unknown): string {
  // normLocaleTag zaten normalize ediyor; yine de short’a düşürelim
  const n = normLocaleTag(String(v || ''));
  return (n || '').toLowerCase().split('-')[0] || '';
}

function resolveApiBase(): string {
  const raw = String(BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (!raw) return `${siteUrlBase()}/api`;

  // absolute ise dokunma
  if (/^https?:\/\//i.test(raw)) return raw;

  // relative (/api) ise site base ile birleştir
  const base = siteUrlBase();
  const rel = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${rel}`.replace(/\/+$/, '');
}

/** İç içe yapılardan sadece İLGİLİ dilin metnini, fallback yapmadan çıkarır */
export function readLocalizedLabel(value: any, locale: RuntimeLocale): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();

  const l = toShortLocale(locale);

  const cands = [
    l ? value?.[l] : undefined,
    l ? value?.label?.[l] : undefined,
    l ? value?.title?.label?.[l] : undefined,
    l ? value?.description?.label?.[l] : undefined,
  ];

  for (const c of cands) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }

  if (typeof value === 'object') {
    if (value.label && typeof value.label === 'object' && l) {
      const c = value.label?.[l];
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    for (const k of Object.keys(value)) {
      const out = readLocalizedLabel(value[k], locale);
      if (out) return out;
    }
  }
  return '';
}

/**
 * site_settings listesini çeker.
 * BE: GET /site_settings?locale=tr
 */
async function fetchSettingsList(locale: RuntimeLocale): Promise<SettingDoc[]> {
  const apiBase = resolveApiBase();
  const l = toShortLocale(locale) || 'de'; // son çare: "de" (istersen FALLBACK_LOCALE kullan)
  const url = `${apiBase}/site_settings?locale=${encodeURIComponent(l)}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': l,
    },
    // SEO snapshot/test için deterministik: DB’den güncel gelsin
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`site_settings ${res.status}`);
  const j = await res.json();

  // RTK'ye paralel: API ya [] ya da {data: []} dönebilir
  return Array.isArray(j) ? (j as SettingDoc[]) : j?.data ?? [];
}

/** Ham value’yu döndürür (array/obje/string olabilir) */
export async function getSettingValue(locale: RuntimeLocale, key: string): Promise<any> {
  const list = await fetchSettingsList(locale);
  return list.find((s) => s.key === key)?.value;
}

/** Tek bir label/string gerekirken kullan (ör. başlık) */
export async function getSettingLabel(locale: RuntimeLocale, key: string): Promise<string> {
  const val = await getSettingValue(locale, key);
  return readLocalizedLabel(val, locale);
}

/** SEO için iki anahtarı birden oku (fallback sadece parametre ile) */
export async function getSeoFromSettings(
  locale: RuntimeLocale,
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
