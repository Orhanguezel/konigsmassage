// =============================================================
// FILE: src/pages/terms.tsx
// konigsmassage – Terms Page + SEO (STANDARD / HOOK-SAFE) [FINAL]
//   - Route: /terms
//   - Data: custom_pages (module_key="terms") meta override
//   - Locale: useLocaleShort() single source
//   - SEO: seo -> site_seo fallback + UI overrides
//   - ✅ Canonical + og:url tek kaynak: _document (SSR)
//   - SEO: NO <Head>. Only <LayoutSeoBridge />
// Pattern: cookie-policy / privacy-policy / privacy-notice ile aynı (bridge)
// =============================================================

'use client';

import React, { useMemo } from 'react';

import Banner from '@/layout/banner/Breadcrum';
import TermsPageContent from '@/components/containers/legal/TermsPageContent';

import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

// i18n + UI
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

// SEO helpers
import { asObj } from '@/seo/pageSeo';

// data
import {
  useGetSiteSettingByKeyQuery,
  useListCustomPagesPublicQuery,
} from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

// helpers
import { excerpt } from '@/shared/text';

function safeJson<T>(v: any, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === 'object') return v as T;
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function safeStr(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function extractHtmlFromAny(page: any): string {
  if (!page) return '';

  const ch = safeStr(page?.content_html);
  if (ch) return ch;

  const c = page?.content ?? page?.content_json ?? page?.contentJson;
  if (!c) return '';

  if (typeof c === 'object') {
    const html = (c as any)?.html;
    return typeof html === 'string' ? html.trim() : '';
  }

  if (typeof c === 'string') {
    const s = c.trim();
    if (!s) return '';
    if (s.startsWith('{') || s.startsWith('[')) {
      const obj = safeJson<any>(s, null);
      const html = obj?.html;
      if (typeof html === 'string' && html.trim()) return html.trim();
    }
    return s;
  }

  return '';
}

const TermsPage: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_terms', locale as any);

  // -----------------------------
  // Banner Title (UI)
  // -----------------------------
  const bannerTitle = useMemo(() => {
    const key = 'ui_terms_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Terms';
  }, [ui]);

  // -----------------------------
  // Global SEO settings (seo -> site_seo fallback)
  // -----------------------------
  const { data: seoPrimary } = useGetSiteSettingByKeyQuery({ key: 'seo', locale } as any);
  const { data: seoFallback } = useGetSiteSettingByKeyQuery({ key: 'site_seo', locale } as any);

  const seo = useMemo(() => {
    const raw =
      (seoPrimary as any)?.value ?? (seoFallback as any)?.value ?? seoPrimary ?? seoFallback;
    return asObj(raw) ?? {};
  }, [seoPrimary, seoFallback]);

  // -----------------------------
  // Terms custom page (meta override için: ilk published)
  // -----------------------------
  const { data: termsData } = useListCustomPagesPublicQuery(
    {
      module_key: 'terms',
      locale,
      limit: 10,
      sort: 'created_at',
      orderDir: 'asc',
      is_published: 1,
    } as any,
    { refetchOnMountOrArgChange: true },
  );

  const primary = useMemo<CustomPageDto | null>(() => {
    const items: CustomPageDto[] = ((termsData as any)?.items ?? []) as any;
    const published = items.filter((p) => !!(p as any)?.is_published);
    return published[0] ?? null;
  }, [termsData]);

  // -----------------------------
  // SEO sources (UI -> custom_page -> seo)
  // -----------------------------
  const pageTitle = useMemo(() => {
    const key = 'ui_terms_meta_title';

    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    const fromMeta = safeStr((primary as any)?.meta_title);
    if (fromMeta) return fromMeta;

    const fromTitle = safeStr((primary as any)?.title);
    if (fromTitle) return fromTitle;

    return safeStr(bannerTitle) || 'Terms';
  }, [ui, primary, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_terms_meta_description';

    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    const fromMeta = safeStr((primary as any)?.meta_description);
    if (fromMeta) return fromMeta;

    const fromSummary = safeStr((primary as any)?.summary);
    if (fromSummary) return fromSummary;

    const html = extractHtmlFromAny(primary);
    const fromExcerpt = safeStr(excerpt(html, 160));
    if (fromExcerpt) return fromExcerpt;

    const keyPageDesc = 'ui_terms_page_description';
    const fromUiDesc = safeStr(ui(keyPageDesc, ''));
    if (fromUiDesc && isValidUiText(fromUiDesc, keyPageDesc)) return fromUiDesc;

    const fromSeo = safeStr((seo as any)?.description);
    if (fromSeo) return fromSeo;

    return 'konigsmassage terms of use: content usage, limitations, external links and updates.';
  }, [ui, primary, seo]);

  const ogImageOverride = useMemo(() => {
    // optional UI override; otherwise LayoutSeoBridge will fallback to seo/site default
    const key = 'ui_terms_og_image';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key) && v) return v;
    return undefined;
  }, [ui]);

  const noindex = useMemo(() => {
    const robots = asObj((seo as any)?.robots) || {};
    return typeof (robots as any).noindex === 'boolean' ? (robots as any).noindex : false;
  }, [seo]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription || undefined}
        ogImage={ogImageOverride}
        noindex={noindex}
      />

      <Banner title={bannerTitle} />
      <TermsPageContent />
    </>
  );
};

export default TermsPage;
