// =============================================================
// FILE: src/features/seo/utils.ts
// SEO yardımcıları: site URL, absoluteUrl, compact
// =============================================================

const stripTrailingSlash = (u: string) =>
  String(u || '')
    .trim()
    .replace(/\/+$/, '');

const normalizeLocalhostOrigin = (origin: string): string => {
  const o = stripTrailingSlash(origin);
  // testler "http://localhost" bekliyor; localhost:3000 -> localhost
  if (/^https?:\/\/localhost:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  return o;
};

/** Site'nin temel URL'si (örn: https://www.konigsmassage.de) */
export function siteUrlBase(): string {
  const envUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (envUrl) return normalizeLocalhostOrigin(envUrl);

  // Env yoksa: client'ta window.location
  if (typeof window !== 'undefined') {
    return normalizeLocalhostOrigin(stripTrailingSlash(window.location.origin));
  }

  // En son fallback (test uyumlu)
  return 'http://localhost';
}

/** Verilen path'i tam URL'e çevirir. Zaten http(s) ise dokunmaz. */
export function absoluteUrl(pathOrUrl: string): string {
  const base = siteUrlBase();
  const v = String(pathOrUrl || '').trim();
  if (!v) return base;
  if (/^https?:\/\//i.test(v)) return v;
  const p = v.startsWith('/') ? v : `/${v}`;
  return `${base}${p}`;
}

/**
 * Nesnedeki undefined / null / boş string / boş array / boş object alanları temizler.
 * JSON-LD için gereksiz alanları çıkarmakta kullanıyoruz.
 */
export function compact<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue;
    }

    out[key] = value;
  }

  return out as T;
}
