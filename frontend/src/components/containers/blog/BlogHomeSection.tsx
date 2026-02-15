// =============================================================
// FILE: src/components/containers/blog/BlogHomeSection.tsx
// Home – Featured Blog (2 posts)
// - Source: custom_pages (module_key="blog")
// - Featured: parent `featured=1` filter (curated via seed/admin)
// - Tailwind v4 Semantic Tokens
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';

import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function formatDate(locale: string, isoLike: unknown): string {
  const s = safeStr(isoLike);
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

const CARD_W = 900;
const CARD_H = 560;

export default function BlogHomeSection() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'blog',
    locale,
    is_published: 1,
    featured: 1,
    limit: 2,
    order: 'display_order.asc',
  });

  const posts = useMemo(() => {
    const raw = (data as any)?.items ?? [];
    const items = Array.isArray(raw) ? raw : [];
    return items.filter((x) => !!x && !!x.is_published);
  }, [data]);

  const featured = useMemo(() => posts.slice(0, 2), [posts]);

  const blogHref = useMemo(() => localizePath(locale, '/blog'), [locale]);

  const title = safeStr(ui('ui_blog_home_title', '')) || safeStr(ui('ui_blog_highlights_title', 'Highlights')) || 'Highlights';
  const lead = safeStr(ui('ui_blog_home_lead', '')) || '';
  const viewAll = safeStr(ui('ui_blog_home_view_all', '')) || (locale === 'tr' ? 'Tümünü Gör' : locale === 'de' ? 'Alle anzeigen' : 'View all');
  const readMore = safeStr(ui('ui_blog_home_read_more', '')) || (locale === 'tr' ? 'Devamını oku' : locale === 'de' ? 'Weiterlesen' : 'Read more');

  if (!isLoading && featured.length === 0) return null;

  return (
    <section className="bg-bg-primary py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="block text-brand-primary font-bold uppercase tracking-widest text-sm mb-3">
              {safeStr(ui('ui_blog_home_subprefix', 'KÖNIG ENERGETIK')) || 'KÖNIG ENERGETIK'}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-text-primary leading-tight">
              {title}
            </h2>
            {lead ? <p className="text-text-secondary text-lg mt-4 leading-relaxed">{lead}</p> : null}
          </div>

          <Link
            href={blogHref}
            className="hidden sm:inline-flex items-center justify-center px-6 py-3 rounded-xl border border-sand-300 bg-bg-secondary text-text-primary font-bold uppercase tracking-widest text-sm hover:bg-sand-100 transition-colors shadow-soft"
            aria-label={viewAll}
          >
            {viewAll}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-sand-200 bg-bg-secondary overflow-hidden">
                <div className="h-64 bg-sand-100 animate-pulse" aria-hidden />
                <div className="p-8 space-y-4">
                  <div className="h-6 bg-sand-100 rounded w-3/4 animate-pulse" aria-hidden />
                  <div className="h-4 bg-sand-100 rounded w-full animate-pulse" aria-hidden />
                  <div className="h-4 bg-sand-100 rounded w-5/6 animate-pulse" aria-hidden />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featured.map((post: any) => {
              const slug = safeStr(post.slug);
              const href = slug ? localizePath(locale, `/blog/${encodeURIComponent(slug)}`) : blogHref;

              const titleText = safeStr(post.title) || safeStr(ui('ui_blog_untitled', 'Untitled')) || 'Untitled';
              const summaryText = excerpt(safeStr(post.summary) || safeStr(post.content_html) || '', 170);
              const dateStr = formatDate(locale, post.updated_at || post.created_at);

              const imgRaw = safeStr(post.featured_image);
              const imgSrc = imgRaw ? toCdnSrc(imgRaw, CARD_W, CARD_H, 'fill') || imgRaw : '';
              const imgAlt = safeStr(post.featured_image_alt) || titleText || 'blog';

              return (
                <article
                  key={safeStr(post.id) || href}
                  className="group rounded-2xl border border-sand-200 bg-bg-secondary overflow-hidden hover:shadow-medium transition-shadow"
                >
                  <div className="relative h-72 bg-sand-100 overflow-hidden">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={imgAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        loading="lazy"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                        <span className="text-sm">{safeStr(ui('ui_blog_no_image', '')) || '(No image)'}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-bg-dark/35 via-transparent to-transparent" aria-hidden />
                  </div>

                  <div className="p-8">
                    {dateStr ? (
                      <p className="text-sm text-text-muted font-semibold uppercase tracking-widest mb-3">
                        {dateStr}
                      </p>
                    ) : null}

                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-text-primary mb-4 leading-tight">
                      <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 rounded-sm">
                        {titleText}
                      </Link>
                    </h3>

                    {summaryText ? (
                      <p className="text-text-secondary leading-relaxed mb-6">{summaryText}</p>
                    ) : null}

                    <div className="pt-5 border-t border-sand-100 flex items-center justify-between text-brand-primary font-bold uppercase tracking-widest text-sm">
                      <span>{readMore}</span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="sm:hidden mt-10">
          <Link
            href={blogHref}
            className="inline-flex w-full items-center justify-center px-6 py-3 rounded-xl border border-sand-300 bg-bg-secondary text-text-primary font-bold uppercase tracking-widest text-sm hover:bg-sand-100 transition-colors shadow-soft"
            aria-label={viewAll}
          >
            {viewAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
