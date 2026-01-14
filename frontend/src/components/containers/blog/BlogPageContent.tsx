// =============================================================
// FILE: src/components/containers/blog/BlogProjectGallery.tsx
// Uses ProjectGallery SCSS (project__area / project__item ...)
// Data: custom_pages (module_key="blog") via RTK
// UI i18n: site_settings.ui_blog (PATTERN)
// Locale: useLocaleShort() (hydration-safe)
// URL: "/{locale}/blog" + "/{locale}/blog/[slug]" (NO localizePath)
// NO Tailwind, NO inline styles
// =============================================================
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { motion } from 'framer-motion';

// RTK – Custom Pages Public
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

// Helpers
import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

// i18n (PATTERN)
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

const CARD_W = 720;
const CARD_H = 480;
const PAGE_LIMIT = 12;

function safeStr(x: unknown): string {
  return typeof x === 'string' ? x.trim() : '';
}

function safeJson<T>(v: unknown, fallback: T): T {
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

/**
 * DB content uyumu:
 * - content_html (string)
 * - content (object: { html })
 * - content (json-string: {"html":"..."})
 * - content (raw html string)
 */
function extractHtmlFromAny(page: any): string {
  const ch = safeStr(page?.content_html);
  if (ch) return ch;

  const c = page?.content ?? page?.content_json ?? page?.contentJson;
  if (!c) return '';

  if (typeof c === 'object') return safeStr((c as any)?.html);

  if (typeof c === 'string') {
    const s = c.trim();
    if (!s) return '';
    if (s.startsWith('{') || s.startsWith('[')) {
      const obj = safeJson<any>(s, null);
      const html = safeStr(obj?.html);
      if (html) return html;
    }
    return s;
  }

  return '';
}

/**
 * localizePath kullanmıyoruz.
 * - locale varsa: "/de/blog" "/tr/blog"
 * - locale yoksa: "/blog"
 */
function withLocale(locale: string, path: string): string {
  const loc = safeStr(locale);
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!loc) return p;

  if (p === `/${loc}` || p.startsWith(`/${loc}/`)) return p;
  return `/${loc}${p}`;
}

type BlogCardVM = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  hero: string;
  // ProjectGallery filter için:
  area: string; // category label
  links: string[]; // chips
};

function normalizeTags(page: any): string[] {
  // custom_pages içinde tags alanı varsa:
  const raw = (page as any)?.tags ?? (page as any)?.tag ?? (page as any)?.keywords;
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((x) => safeStr(x))
      .filter(Boolean)
      .slice(0, 3);
  }

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    // json array olabilir
    if (s.startsWith('[')) {
      const arr = safeJson<any[]>(s, []);
      return (arr || [])
        .map((x) => safeStr(x))
        .filter(Boolean)
        .slice(0, 3);
    }
    // csv olabilir
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  return [];
}

function normalizeArea(page: any, fallback: string): string {
  // custom_pages içinde category / sub_category / type vb. varsa kullan
  const a =
    safeStr((page as any)?.category) ||
    safeStr((page as any)?.category_name) ||
    safeStr((page as any)?.sub_category) ||
    safeStr((page as any)?.type);

  return a || fallback;
}

const BlogProjectGallery: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);
  const t = useCallback((key: string, fb: string) => ui(key, fb), [ui]);

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'blog',
    sort: 'created_at',
    order: 'desc',
    orderDir: 'desc',
    limit: PAGE_LIMIT,
    is_published: 1,
    locale,
  } as any);

  const untitled = t('ui_blog_untitled', 'Untitled post');
  const allLabel = t('ui_blog_filter_all', 'All');
  const readMoreAria = t('ui_blog_read_more_aria', 'view blog details');

  const listHref = withLocale(locale, '/blog');

  const allItems = useMemo<BlogCardVM[]>(() => {
    const items: CustomPageDto[] = ((data as any)?.items ?? []) as any;

    return items
      .filter((p: any) => !!p && !!(p as any)?.is_published)
      .map((p: any) => {
        const id =
          safeStr(p?.id) || safeStr(p?.slug) || `blog-${Math.random().toString(16).slice(2)}`;
        const title = safeStr(p?.title) || untitled;

        const metaDesc = safeStr(p?.meta_description);
        const sum = safeStr(p?.summary);
        const html = extractHtmlFromAny(p);
        const baseText = metaDesc || sum || html;

        const textExcerpt = excerpt(baseText, 140).trim();

        const imgRaw = safeStr(p?.featured_image);
        const hero = imgRaw ? toCdnSrc(imgRaw, CARD_W, CARD_H, 'fill') || imgRaw : '';

        const links = normalizeTags(p);
        const area = normalizeArea(p, t('ui_blog_filter_default', 'Blog'));

        return {
          id,
          title,
          excerpt: textExcerpt,
          slug: safeStr(p?.slug),
          hero,
          area,
          links,
        };
      });
  }, [data, untitled, t]);

  // Filter buttons: "All" + unique areas
  const filterButtons = useMemo<string[]>(() => {
    const unique = Array.from(new Set(allItems.map((x) => x.area).filter(Boolean)));
    // area yoksa sadece All
    if (!unique.length) return [allLabel];
    return [allLabel, ...unique];
  }, [allItems, allLabel]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedKey = filterButtons[selectedIndex] || allLabel;

  const visibleItems = useMemo(() => {
    if (selectedKey === allLabel) return allItems;
    return allItems.filter((x) => x.area === selectedKey);
  }, [allItems, selectedKey, allLabel]);

  return (
    <section className="project__area pt-115 pb-90">
      <div className="container">
        {/* Header (ProjectGallery style) */}
        <div className="row">
          <div className="col-12">
            <div className="project__filter-button text-center p-relative mb-55">
              {filterButtons.map((cat, index) => (
                <button
                  type="button"
                  key={`${cat}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  className={'filter-btn' + (selectedIndex === index ? ' active' : '')}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="row grid portfolio-grid-items" data-aos="fade-up" data-aos-delay="300">
          {visibleItems.map((it, index) => {
            const href = it.slug
              ? withLocale(locale, `/blog/${encodeURIComponent(it.slug)}`)
              : listHref;

            return (
              <motion.div
                layout
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="col-xl-6 col-lg-6 col-md-6 grid-item c-3 c-2"
                key={it.id || index}
              >
                <div className="project__item mb-30">
                  <div className="project__thumb">
                    <Link href={href} aria-label={it.title || readMoreAria}>
                      <Image
                        src={(it.hero as any)}
                        alt={it.title || 'blog image'}
                        width={CARD_W}
                        height={CARD_H}
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                    </Link>
                  </div>

                  <div className="project__content">
                    <h3>
                      <Link href={href}>{it.title}</Link>
                    </h3>

                    {!!safeStr(it.excerpt) ? <p>{it.excerpt}</p> : null}

                    <div className="project__tag">
                      {(it.links?.length ? it.links : [t('ui_blog_tag_default', 'Blog')])
                        .slice(0, 3)
                        .map((tag) => (
                          <Link
                            key={`${it.id}-${tag}`}
                            href={href}
                            aria-label={`${it.title} — ${tag}`}
                          >
                            {tag}
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Loading */}
          {isLoading ? (
            <div className="col-12">
              <div className="ens-skel ens-skel--md" />
              <div className="ens-skel ens-skel--md ens-skel--w80 mt-10" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default BlogProjectGallery;
