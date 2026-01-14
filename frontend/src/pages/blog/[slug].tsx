// =============================================================
// FILE: src/pages/blog/[slug].tsx
// konigsmassage – Blog Detail Page (by slug) [FINAL / STANDARD]
// - Route: /blog/[slug]
// - Data: custom_pages/by-slug (module_key="blog")
// - ✅ NO <Head>
// - ✅ Page SEO overrides via <LayoutSeoBridge /> (SINGLE STANDARD)
// - ✅ General meta/canonical/hreflang/etc. stays in Layout/_document (no duplication)
// - SEO priority:
//   title: page.meta_title -> page.title -> ui_blog_detail_page_title -> ui_blog_page_title -> fallback
//   desc : page.meta_description -> page.summary -> excerpt(page.content_html) -> ui fallback
//   og   : page.featured_image -> undefined (Layout decides)
// =============================================================

'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/router';

import Banner from '@/layout/banner/Breadcrum';
import BlogDetailsArea from '@/components/containers/blog/BlogDetails';
import Feedback from '@/components/containers/feedback/Feedback';

// ✅ Page -> Layout SEO overrides (STANDARD)
import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

// i18n
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

// data
import { useGetCustomPageBySlugPublicQuery } from '@/integrations/rtk/hooks';

// helpers
import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

// skeleton (separate file)
import BlogDetailSkeleton from '@/components/common/public/Skeleton';

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

const BlogDetailPage: React.FC = () => {
  const router = useRouter();
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);

  const slug = useMemo(() => {
    const q = router.query.slug;
    if (typeof q === 'string') return q.trim();
    if (Array.isArray(q)) return String(q[0] ?? '').trim();
    return '';
  }, [router.query.slug]);

  const isSlugReady = router.isReady && !!slug;

  const { data: page, isFetching } = useGetCustomPageBySlugPublicQuery(
    { slug, locale },
    { skip: !isSlugReady },
  );

  const listTitleFallback = useMemo(
    () => safeStr(ui('ui_blog_page_title', 'Blog')) || 'Blog',
    [ui],
  );

  const detailTitleFallback = useMemo(
    () => safeStr(ui('ui_blog_detail_page_title', 'Blog Detail')) || 'Blog Detail',
    [ui],
  );

  const bannerTitle = useMemo(() => {
    const t = safeStr(page?.title);
    if (t) return t;

    const d = safeStr(detailTitleFallback);
    if (d) return d;

    return listTitleFallback || 'Blog';
  }, [page?.title, detailTitleFallback, listTitleFallback]);

  // -----------------------------
  // SEO fields (override only what you need)
  // -----------------------------

  const pageTitle = useMemo(() => {
    const mt = safeStr(page?.meta_title);
    if (mt) return mt;

    const t = safeStr(page?.title);
    if (t) return t;

    const d = safeStr(detailTitleFallback);
    if (d) return d;

    return listTitleFallback || 'Blog';
  }, [page?.meta_title, page?.title, detailTitleFallback, listTitleFallback]);

  const pageDescription = useMemo(() => {
    const md = safeStr(page?.meta_description);
    if (md) return md;

    const s = safeStr(page?.summary);
    if (s) return s;

    const ex = excerpt(safeStr(page?.content_html), 160).trim();
    if (ex) return ex;

    // Optional UI fallback
    const uiDesc = safeStr(ui('ui_blog_detail_meta_description_fallback', ''));
    if (uiDesc) return uiDesc;

    return 'Blog article details from konigsmassage.';
  }, [page?.meta_description, page?.summary, page?.content_html, ui]);

  const ogImageOverride = useMemo(() => {
    const raw = safeStr(page?.featured_image);
    if (!raw) return undefined;

    // if already absolute keep; otherwise cdn transform
    if (/^https?:\/\//i.test(raw)) return raw;

    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [page?.featured_image]);

  const showSkeleton = !isSlugReady || isFetching || !page;

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />

      {showSkeleton ? (
        <BlogDetailSkeleton />
      ) : (
        <>
          <BlogDetailsArea />
          <Feedback />
        </>
      )}
    </>
  );
};

export default BlogDetailPage;
