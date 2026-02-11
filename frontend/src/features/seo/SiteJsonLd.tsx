// =============================================================
// FILE: src/features/seo/SiteJsonLd.tsx
// konigsmassage – Site JSON-LD (WebSite + Organization)
//  - Dynamic locales (no static supported locale list)
//  - Safe SSR fetch base (BASE_URL can be "/api")
// =============================================================

import React from 'react';
import type { SupportedLocale } from '@/types/common';
import { siteUrlBase, absoluteUrl, compact } from '@/seo';
import { BASE_URL } from '@/integrations/rtk/constants';

/* ---------- helpers ---------- */
type SettingDoc = { key: string; value: any };
type CompanyDoc = {
  companyName?: Partial<Record<SupportedLocale, string>> | any;
  companyDesc?: Partial<Record<SupportedLocale, string>> | any;
  phone?: string;
  images?: Array<{ url?: string; webp?: string; thumbnail?: string }>;
  socialLinks?: Partial<
    Record<'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube', string>
  >;
};

/**
 * Dynamic locale normalize:
 * - "tr-TR" -> "de"
 * - "EN_us" -> "en"
 */
function normalizeLocaleTag(input: unknown): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

function readLocalizedLabel(value: any, locale: SupportedLocale): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();

  const l = normalizeLocaleTag(locale);

  // yaygın kalıplar (hem short hem full tag dene)
  const candidates = [
    value?.[l],
    value?.[locale as any],

    value?.label?.[l],
    value?.label?.[locale as any],

    value?.title?.label?.[l],
    value?.title?.label?.[locale as any],

    value?.description?.label?.[l],
    value?.description?.label?.[locale as any],
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }

  // derin arama
  if (typeof value === 'object') {
    if (value.label && typeof value.label === 'object') {
      const c1 = value.label?.[l];
      const c2 = value.label?.[locale as any];
      if (typeof c1 === 'string' && c1.trim()) return c1.trim();
      if (typeof c2 === 'string' && c2.trim()) return c2.trim();
    }
    for (const k of Object.keys(value)) {
      const out = readLocalizedLabel(value[k], locale);
      if (out) return out;
    }
  }

  return '';
}

/**
 * BASE_URL relative ("/api") olabilir.
 * Server Component fetch için absolute base üretelim.
 */
function resolveApiBase(): string {
  const raw = String(BASE_URL || '').trim();
  if (!raw) return `${siteUrlBase()}/api`.replace(/\/+$/, '');

  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, '');

  const base = siteUrlBase().replace(/\/+$/, '');
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${p}`.replace(/\/+$/, '');
}

async function fetchJSON<T>(path: string, locale: SupportedLocale): Promise<T> {
  const apiBase = resolveApiBase();
  const cleanPath = String(path || '').replace(/^\/+/, '');
  const url = `${apiBase}/${cleanPath}`;

  const l = normalizeLocaleTag(locale) || 'de';

  const r = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': l,
    },
    cache: 'force-cache',
    next: { revalidate: 300 },
  });

  if (!r.ok) throw new Error(`${path} failed: ${r.status}`);
  return r.json() as Promise<T>;
}

/* ---------- component ---------- */
export default async function SiteJsonLd({ locale }: { locale: SupportedLocale }) {
  const base = siteUrlBase();
  const l = normalizeLocaleTag(locale) || 'de';

  // SETTINGS + COMPANY
  let settings: SettingDoc[] = [];
  let company: CompanyDoc | null = null;

  try {
    // BE: /settings
    const s = await fetchJSON<SettingDoc[] | { data: SettingDoc[] }>('settings', locale);
    settings = Array.isArray(s) ? s : s?.data ?? [];
  } catch {
    // ignore
  }

  try {
    // BE: /company
    const c = await fetchJSON<CompanyDoc | { data: CompanyDoc }>('company', locale);
    company = (c as any)?.data ? (c as any).data : (c as CompanyDoc);
  } catch {
    // ignore
  }

  // --- name (brand) ---
  const brandFromCompany = readLocalizedLabel(company?.companyName, locale);
  const name = (
    brandFromCompany ||
    process.env.NEXT_PUBLIC_SITE_NAME ||
    'guezelwebdesign.de'
  ).trim();

  // --- description ---
  const descFromCompany = readLocalizedLabel(company?.companyDesc, locale);
  const descFromSettings = readLocalizedLabel(
    settings.find((s) => s.key === 'seo_default_description')?.value,
    locale,
  );

  const orgDescription =
    descFromCompany ||
    descFromSettings ||
    String(
      process.env.NEXT_PUBLIC_ORG_DESCRIPTION ||
        'guezelwebdesign – Industrial solutions & services.',
    ).trim();

  // --- logo ---
  const firstImg = (company?.images ?? []).find((i) => i?.webp || i?.url);
  const logoRaw = String(firstImg?.webp || firstImg?.url || '').trim();
  const logo = logoRaw ? logoRaw : absoluteUrl('/logo.png');

  // --- sameAs ---
  const fromCompany = Object.values(company?.socialLinks ?? {}).filter(Boolean) as string[];

  const settingSameAs = (() => {
    const v = settings.find((s) => s.key === 'org_sameas')?.value;
    if (!v) return [] as string[];
    if (Array.isArray(v)) return v.filter((x) => typeof x === 'string') as string[];
    if (typeof v === 'string') return [v];
    return Object.values(v).filter((x) => typeof x === 'string') as string[];
  })();

  const envSameAs = String(process.env.NEXT_PUBLIC_ORG_SAMEAS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const sameAs = [...fromCompany, ...settingSameAs, ...envSameAs].filter((u, i, arr) => {
    if (!/^https?:\/\//i.test(u)) return false;
    return arr.indexOf(u) === i;
  });

  // --- contactPoint ---
  const telephone = String(
    company?.phone || process.env.NEXT_PUBLIC_ORG_CONTACT_TELEPHONE || '',
  ).trim();

  const availableLanguage = String(process.env.NEXT_PUBLIC_ORG_CONTACT_LANGS || l)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const contactPoint = compact({
    '@type': 'ContactPoint',
    telephone: telephone || undefined,
    contactType: String(process.env.NEXT_PUBLIC_ORG_CONTACT_TYPE || 'customer support').trim(),
    areaServed: String(process.env.NEXT_PUBLIC_ORG_CONTACT_AREA || '').trim() || undefined,
    availableLanguage: availableLanguage.length ? availableLanguage : undefined,
  });

  // telephone boşsa hiç basma
  if (!(contactPoint as any).telephone) delete (contactPoint as any).telephone;

  const data = [
    compact({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${base}#website`,
      url: `${base}/`,
      name,
      inLanguage: l,
      publisher: { '@id': `${base}#organization` },
      potentialAction: compact({
        '@type': 'SearchAction',
        // Locale prefix routing kullanıyorsan bu uygundur ("/tr?q=" gibi).
        // Eğer arama route'un farklıysa burada target'i değiştir.
        target: `${base}/${l}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      }),
    }),
    compact({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${base}#organization`,
      url: `${base}/`,
      name,
      description: orgDescription,
      logo: {
        '@type': 'ImageObject',
        url: logo.startsWith('http') ? logo : absoluteUrl(logo),
      },
      ...(sameAs.length ? { sameAs } : {}),
      ...(Object.keys(contactPoint).length ? { contactPoint: [contactPoint] } : {}),
    }),
  ];

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
