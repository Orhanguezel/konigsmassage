// =============================================================
// FILE: src/pages/cookie-policy.tsx
// konigsmassage – Cookie Policy Page + SEO (PUBLIC PAGES ROUTER STANDARD)
//   - Route: /cookie-policy
//   - NO <Head>
//   - SEO override: <LayoutSeoBridge />
//   - Canonical/og:url/hreflang: _document (SSR) + Layout
//   - Data (optional meta): custom_pages (module_key="cookies") first published
//   - Meta precedence: UI -> custom_page -> Layout defaults (no page-level global seo fetch)
//   - Content: <CookiePolicyPageContent />
//   - content_html/content(JSON) compatibility for excerpt + og image
// =============================================================

'use client';

import React, { useMemo } from 'react';

import Banner from '@/layout/banner/Breadcrum';
import CookiePolicyPageContent from '@/components/containers/legal/CookiePolicyPageContent';

import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

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

    // JSON string?
    if (s.startsWith('{') || s.startsWith('[')) {
      const obj = safeJson<any>(s, null);
      const html = obj?.html;
      if (typeof html === 'string' && html.trim()) return html.trim();
    }

    // plain html/text
    return s;
  }

  return '';
}

const CookiePolicyPage: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_cookie_policy', locale as any);

  // -----------------------------
  // Banner Title (UI)
  // -----------------------------
  const bannerTitle = useMemo(() => {
    const key = 'ui_cookie_policy_page_title';
    const v = safeStr(ui(key, 'Cookie Policy'));
    return isValidUiText(v, key) ? v : 'Cookie Policy';
  }, [ui]);

  // -----------------------------
  // Cookies custom page (optional meta): first published
  // -----------------------------
  const { data: cookiesData } = useListCustomPagesPublicQuery(
    {
      module_key: 'cookies',
      locale,
      limit: 20,
      offset: 0,
      sort: 'created_at',
      orderDir: 'asc',
      is_published: 1,
    } as any,
    { skip: !locale },
  );

  const primary = useMemo<CustomPageDto | null>(() => {
    const items: CustomPageDto[] = ((cookiesData as any)?.items ?? []) as any;
    const published = items.filter((p) => !!p?.is_published);
    return published[0] ?? null;
  }, [cookiesData]);

  // -----------------------------
  // SEO override (UI -> custom_page -> Layout defaults)
  // -----------------------------
  const pageTitle = useMemo(() => {
    const key = 'ui_cookie_policy_meta_title';

    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    const mt = safeStr((primary as any)?.meta_title);
    if (mt) return mt;

    const t = safeStr((primary as any)?.title);
    if (t) return t;

    return bannerTitle || 'Cookie Policy';
  }, [ui, primary, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_cookie_policy_meta_description';

    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    const md = safeStr((primary as any)?.meta_description);
    if (md) return md;

    const sum = safeStr((primary as any)?.summary);
    if (sum) {
      const ex = excerpt(sum, 160).trim();
      if (ex) return ex;
    }

    const html = extractHtmlFromAny(primary);
    const ex2 = excerpt(html, 160).trim();
    if (ex2) return ex2;

    const key2 = 'ui_cookie_policy_page_description';
    const fromUiDesc = safeStr(ui(key2, ''));
    if (fromUiDesc && isValidUiText(fromUiDesc, key2)) return fromUiDesc;

    return ''; // empty => Layout default
  }, [ui, primary]);

  const ogImageOverride = useMemo(() => {
    const key = 'ui_cookie_policy_og_image';
    const fromUi = safeStr(ui(key, ''));
    if (fromUi) {
      if (/^https?:\/\//i.test(fromUi)) return fromUi;
      return toCdnSrc(fromUi, 1200, 630, 'fill') || fromUi;
    }

    const raw =
      safeStr((primary as any)?.featured_image) ||
      safeStr((primary as any)?.image_url) ||
      safeStr((primary as any)?.featured_image_url) ||
      '';

    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;

    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [ui, primary]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription || undefined}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />
      <CookiePolicyPageContent />
    </>
  );
};

export default CookiePolicyPage;
