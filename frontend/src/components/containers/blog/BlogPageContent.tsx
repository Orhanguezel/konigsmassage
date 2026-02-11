// =============================================================
// FILE: src/components/containers/blog/BlogPageContent.tsx
// FINAL – Blog Listing
// - App Router
// - ✅ Locale-prefixed internal links via localizePath()
// - Tailwind v4 Semantic Tokens
// - Grid Layout
// =============================================================

'use client';

import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// RTK
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';

// Helpers
import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

// i18n
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

const CARD_W = 720;
const CARD_H = 480;

function safeStr(val: unknown) {
  return typeof val === 'string' ? val.trim() : '';
}

const BlogPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);
  const t = useCallback((k: string, fb: string) => ui(k, fb), [ui]);

  const { data, isLoading } = useListCustomPagesPublicQuery(
    {
      module_key: 'blog',
      sort: 'created_at',
      order: 'desc',
      locale,
      limit: 12,
    } as any,
  );

  const items = useMemo(() => {
    const raw = (data as any)?.items ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const pageTitle = t('ui_blog_page_title', 'Blog');
  const pageLead = t('ui_blog_page_lead', 'Latest news and updates.');

  // ✅ Locale-prefixed list href (optional usage)
  const blogListHref = useMemo(() => localizePath(locale, '/blog'), [locale]);

  return (
    <section className="bg-bg-primary py-20 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="block text-brand-primary font-bold uppercase tracking-widest text-sm mb-3">
            {t('ui_blog_subprefix', 'Königs Massage')}
          </span>

          <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-primary mb-8">
            {pageTitle}
          </h2>

          <p className="text-text-secondary text-lg leading-loose mb-8">{pageLead}</p>

          {/* İstersen başlığı link yapabilirsin (prefixli) */}
          {/* <div className="mt-4">
            <Link href={blogListHref} className="text-sm font-bold text-brand-primary hover:underline">
              {blogListHref}
            </Link>
          </div> */}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-sand-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">{t('ui_blog_empty', 'No blog posts found.')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((post: any) => {
            const title = safeStr(post.title) || t('ui_blog_untitled', 'Untitled');

            const summary = excerpt(
              safeStr(post.summary) || safeStr(post.content_html) || '',
              120,
            );

            const slug = safeStr(post.slug);

            // ✅ IMPORTANT: always localize internal paths
            const href = slug ? localizePath(locale, `/blog/${slug}`) : blogListHref;

            const imgRaw = safeStr(post.featured_image);
            const imgSrc = imgRaw ? toCdnSrc(imgRaw, CARD_W, CARD_H) || imgRaw : '';

            const dateStr = post.created_at
              ? new Date(post.created_at).toLocaleDateString(locale)
              : '';

            return (
              <article
                key={String(post.id ?? slug ?? title)}
                className="group flex flex-col bg-white rounded-xl shadow-medium hover:shadow-xl transition-all duration-300 overflow-hidden h-full border border-sand-50 hover:-translate-y-1"
              >
                {/* Image */}
                <Link href={href} className="relative aspect-3/2 overflow-hidden bg-sand-200 block">
                  {imgSrc ? (
                    <Image
                      src={imgSrc as any}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sand-400">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </Link>

                {/* Content */}
                <div className="flex flex-col grow p-6 md:p-8">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-primary/80">
                    {dateStr && <span>{dateStr}</span>}
                  </div>

                  <h3 className="text-xl font-bold font-serif text-text-primary mb-4 leading-[1.4] group-hover:text-brand-primary transition-colors">
                    <Link href={href}>{title}</Link>
                  </h3>

                  <p className="text-text-secondary text-base leading-[1.8] mb-8 grow line-clamp-3">
                    {summary}
                  </p>

                  <div className="mt-auto pt-4 border-t border-sand-100">
                    <Link
                      href={href}
                      className="inline-flex items-center text-sm font-bold text-text-primary hover:text-brand-primary transition-colors group/link uppercase tracking-wide"
                    >
                      {t('ui_blog_read_more', 'Read More')}
                      <svg
                        className="ml-2 w-4 h-4 transform group-hover/link:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BlogPageContent;
