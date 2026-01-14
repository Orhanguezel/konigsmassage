// =============================================================
// FILE: src/pages/privacy-policy.tsx
// konigsmassage – Privacy Policy Page + SEO (STANDARD / HOOK-SAFE) [FINAL]
//   - Route: /privacy-policy
//   - Data: custom_pages (module_key="privacy") meta override
//   - SEO: NO <Head>. Only <LayoutSeoBridge />
//   - ✅ Canonical + og:url tek kaynak: _document (SSR)
// Pattern: cookie-policy / privacy-notice ile aynı (sadeleştirilmiş)
// =============================================================

'use client';

import React, { useMemo } from 'react';

import Banner from '@/layout/banner/Breadcrum';
import PrivacyPolicyPageContent from '@/components/containers/legal/PrivacyPolicyPageContent';

import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

import { asObj } from '@/seo/pageSeo';

import {
  useGetSiteSettingByKeyQuery,
  useListCustomPagesPublicQuery,
} from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

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

const PrivacyPolicyPage: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_privacy_policy', locale as any);

  // -----------------------------
  // UI (Banner Title)
  // -----------------------------
  const bannerTitle = useMemo(() => {
    const key = 'ui_privacy_policy_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Privacy Policy';
  }, [ui]);

  // -----------------------------
  // Global SEO settings (seo -> site_seo fallback) [for description fallback only]
  // -----------------------------
  const { data: seoSettingPrimary } = useGetSiteSettingByKeyQuery({ key: 'seo', locale } as any);
  const { data: seoSettingFallback } = useGetSiteSettingByKeyQuery({
    key: 'site_seo',
    locale,
  } as any);

  const seo = useMemo(() => {
    const raw =
      (seoSettingPrimary as any)?.value ??
      (seoSettingFallback as any)?.value ??
      seoSettingPrimary ??
      seoSettingFallback;

    return asObj(raw) ?? {};
  }, [seoSettingPrimary, seoSettingFallback]);

  // -----------------------------
  // Privacy custom page (meta override için: ilk published)
  // module_key = 'privacy'
  // -----------------------------
  const { data: privacyData } = useListCustomPagesPublicQuery(
    {
      module_key: 'privacy',
      locale,
      limit: 10,
      sort: 'created_at',
      orderDir: 'asc',
      is_published: 1,
    } as any,
    { refetchOnMountOrArgChange: true },
  );

  const primary = useMemo<CustomPageDto | null>(() => {
    const items: CustomPageDto[] = ((privacyData as any)?.items ?? []) as any;
    const published = items.filter((p) => !!(p as any)?.is_published);
    return published[0] ?? null;
  }, [privacyData]);

  // -----------------------------
  // SEO: sources (UI -> custom_page -> seo fallback)
  // -----------------------------
  const pageTitle = useMemo(() => {
    const key = 'ui_privacy_policy_meta_title';
    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    const fromPageMeta = safeStr((primary as any)?.meta_title);
    if (fromPageMeta) return fromPageMeta;

    const fromPageTitle = safeStr((primary as any)?.title);
    if (fromPageTitle) return fromPageTitle;

    return bannerTitle || 'Privacy Policy';
  }, [ui, primary, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_privacy_policy_meta_description';
    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    const fromPageMeta = safeStr((primary as any)?.meta_description);
    if (fromPageMeta) return fromPageMeta;

    const fromSummary = safeStr((primary as any)?.summary);
    if (fromSummary) return fromSummary;

    const html = extractHtmlFromAny(primary);
    const fromExcerpt = html ? excerpt(html, 160).trim() : '';
    if (fromExcerpt) return fromExcerpt;

    const fromUiDesc = safeStr(ui('ui_privacy_policy_page_description', ''));
    if (fromUiDesc && isValidUiText(fromUiDesc, 'ui_privacy_policy_page_description')) {
      return fromUiDesc;
    }

    const fromSeo = safeStr((seo as any)?.description);
    if (fromSeo) return fromSeo;

    return 'konigsmassage privacy policy: data we collect, purposes, retention, security, and user rights.';
  }, [ui, primary, seo]);

  const ogImageOverride = useMemo(() => {
    // optional: UI override > page featured image (raw) > undefined (Layout handles fallback)
    const uiImgKey = 'ui_privacy_policy_og_image';
    const fromUi = safeStr(ui(uiImgKey, ''));
    if (isValidUiText(fromUi, uiImgKey) && fromUi) return fromUi;

    const raw = safeStr((primary as any)?.featured_image);
    return raw || undefined;
  }, [ui, primary]);

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
      <PrivacyPolicyPageContent />
    </>
  );
};

export default PrivacyPolicyPage;
