// =============================================================
// FILE: src/pages/kvkk.tsx
// konigsmassage – KVKK Page (PUBLIC PAGES ROUTER STANDARD)
//   - Route: /kvkk
//   - NO <Head>
//   - SEO override only via <LayoutSeoBridge />
//   - Canonical/og:url/hreflang: _document (SSR) + Layout
//   - Data: custom_pages (module_key="kvkk") meta override
//   - Meta priority: UI -> custom_page -> Layout default
//   - Loading: shared <Skeleton />
//   - Inline style: NONE
// =============================================================

'use client';

import React, { useMemo } from 'react';

import Banner from '@/layout/banner/Breadcrum';
import KvkkPageContent from '@/components/containers/legal/KvkkPageContent';

import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

import Skeleton from '@/components/common/public/Skeleton';

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
    if (s.startsWith('{') || s.startsWith('[')) {
      const obj = safeJson<any>(s, null);
      const html = obj?.html;
      if (typeof html === 'string' && html.trim()) return html.trim();
    }
    return s;
  }

  return '';
}

const KvkkPage: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_kvkk', locale as any);

  // -----------------------------
  // KVKK custom page (meta override için: ilk published)
  // -----------------------------
  const { data: kvkkData, isFetching: isKvkkFetching } = useListCustomPagesPublicQuery(
    {
      module_key: 'kvkk',
      locale,
      limit: 10,
      offset: 0,
      sort: 'created_at',
      orderDir: 'asc',
      is_published: 1,
    } as any,
    { refetchOnMountOrArgChange: true } as any,
  );

  const primary = useMemo<CustomPageDto | null>(() => {
    const items: CustomPageDto[] = (((kvkkData as any)?.items ?? []) as any) || [];
    const published = items.filter((p) => !!(p as any)?.is_published);
    return published[0] ?? null;
  }, [kvkkData]);

  // -----------------------------
  // UI (Banner Title)
  // -----------------------------
  const bannerTitle = useMemo(() => {
    const key = 'ui_kvkk_page_title';
    const v = safeStr(ui(key, 'KVKK'));
    return isValidUiText(v, key) ? v : 'KVKK';
  }, [ui]);

  // -----------------------------
  // SEO: title/description sources (UI -> custom_page -> Layout default)
  // -----------------------------
  const pageTitle = useMemo(() => {
    const key = 'ui_kvkk_meta_title';

    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    const fromPageMeta = safeStr((primary as any)?.meta_title);
    if (fromPageMeta) return fromPageMeta;

    const fromPageTitle = safeStr((primary as any)?.title);
    if (fromPageTitle) return fromPageTitle;

    return bannerTitle || 'KVKK';
  }, [ui, primary, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_kvkk_meta_description';

    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    const fromPageMeta = safeStr((primary as any)?.meta_description);
    if (fromPageMeta) return fromPageMeta;

    const fromSummary = safeStr((primary as any)?.summary);
    if (fromSummary) return fromSummary;

    const html = extractHtmlFromAny(primary);
    const ex = html ? excerpt(html, 160).trim() : '';
    if (ex) return ex;

    const fromUiDesc = safeStr(ui('ui_kvkk_page_description', ''));
    if (fromUiDesc && isValidUiText(fromUiDesc, 'ui_kvkk_page_description')) return fromUiDesc;

    return ''; // empty => Layout default
  }, [ui, primary]);

  const ogImageOverride = useMemo(() => {
    const raw =
      safeStr((primary as any)?.featured_image) ||
      safeStr((primary as any)?.image_url) ||
      safeStr(ui('ui_kvkk_og_image', ''));

    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [primary, ui]);

  const showSkeleton = isKvkkFetching && !primary;

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription || undefined}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />

      {showSkeleton ? <Skeleton /> : <KvkkPageContent />}
    </>
  );
};

export default KvkkPage;
