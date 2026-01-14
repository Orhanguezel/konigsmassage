// =============================================================
// FILE: src/pages/blog/index.tsx
// konigsmassage – Blog Page (list) [FINAL / STANDARD]
// - Route: /blog
// - ✅ NO <Head>
// - ✅ Page SEO overrides via <LayoutSeoBridge /> (SINGLE STANDARD)
// - ✅ General meta/canonical/hreflang/etc. stays in Layout/_document (no duplication)
// - Data source priority:
//   title: ui_blog_meta_title -> ui_blog_page_title -> fallback
//   desc : ui_blog_meta_description -> (primary custom_pages meta/summary/content) -> fallback
//   og   : primary.featured_image (optional) -> undefined (Layout decides)
// =============================================================

'use client';

import React, { useMemo } from 'react';
import type { NextPage } from 'next';

import Banner from '@/layout/banner/Breadcrum';
import BlogPageContent from '@/components/containers/blog/BlogPageContent';
import Feedback from '@/components/containers/feedback/Feedback';

// ✅ Page -> Layout SEO overrides (STANDARD)
import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

// i18n
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

// data
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

// helpers
import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

const BlogPage: NextPage = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);

  // -----------------------------
  // Banner title (UI)
  // -----------------------------
  const bannerTitle = useMemo(() => {
    const key = 'ui_blog_page_title';
    const v = safeStr(ui(key, 'Blog'));
    return isValidUiText(v, key) ? v : 'Blog';
  }, [ui]);

  // -----------------------------
  // Blog custom pages (meta override için: ilk published kayıt)
  // PERF: limit küçük
  // -----------------------------
  const { data: blogData } = useListCustomPagesPublicQuery({
    module_key: 'blog',
    locale,
    limit: 5,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const primary = useMemo<CustomPageDto | null>(() => {
    const items = (blogData?.items ?? []) as any[];
    if (!Array.isArray(items) || items.length === 0) return null;

    for (const it of items) {
      if (it && it.is_published) return it as CustomPageDto;
    }
    return null;
  }, [blogData?.items]);

  // -----------------------------
  // Page SEO (override only what you need)
  // -----------------------------
  const pageTitle = useMemo(() => {
    const key = 'ui_blog_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const mt = safeStr(primary?.meta_title);
    if (mt) return mt;

    const t = safeStr(primary?.title);
    if (t) return t;

    return bannerTitle || 'Blog';
  }, [ui, primary?.meta_title, primary?.title, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_blog_meta_description';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const md = safeStr(primary?.meta_description);
    if (md) return md;

    const s = safeStr(primary?.summary);
    if (s) return s;

    const ex = excerpt(primary?.content_html ?? '', 160).trim();
    if (ex) return ex;

    return 'Blog articles and updates from konigsmassage.';
  }, [ui, primary?.meta_description, primary?.summary, primary?.content_html]);

  // Optional OG: only if page has a featured image
  const ogImageOverride = useMemo(() => {
    const raw = safeStr(primary?.featured_image);
    if (!raw) return undefined;
    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [primary?.featured_image]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />
      <BlogPageContent />
      <Feedback />
    </>
  );
};

export default BlogPage;
