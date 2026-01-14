// =============================================================
// FILE: src/components/containers/blog/BlogDetails.tsx
// UPDATED — Multi-image gallery + Lightbox modal (NEWS template pattern)
// - Hero + thumbs under hero
// - Click hero / double click thumb => opens ImageLightboxModal
// - Other blogs (DB) uses router.pathname + slug (no hardcoded /blog/:slug)
// - Share kept (sidebar or main preserved)
// - Reviews kept in SIDEBAR (under Other blogs)
// - Contact Info: ✅ use InfoContactCard (reusable) instead of manual contact_info parsing
// - SCSS-driven, accordion dynamic, no inline style
// =============================================================

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

// RTK – Custom Pages (public)
import {
  useGetCustomPageBySlugPublicQuery,
  useListCustomPagesPublicQuery,
} from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

// Helpers
import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

// i18n
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

// Reviews + Share
import ReviewList from '@/components/common/public/ReviewList';
import ReviewForm from '@/components/common/public/ReviewForm';
import SocialShare from '@/components/common/public/SocialShare';

// Lightbox (same as NewsDetail template)
import ImageLightboxModal, {
  type LightboxImage,
} from '@/components/common/public/ImageLightboxModal';



const HERO_W = 1200;
const HERO_H = 700;

const THUMB_W = 220;
const THUMB_H = 140;

type AccordionItem = { title: string; body: string };

function readSlug(q: unknown): string {
  if (typeof q === 'string') return q.trim();
  if (Array.isArray(q)) return String(q[0] ?? '').trim();
  return '';
}

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => safeStr(x)).filter(Boolean);
  const s = safeStr(v);
  if (!s) return [];
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

/** UI DB / API value parse helpers (site_settings value may be stringified JSON) */
function tryParseJson<T>(v: unknown): T | null {
  try {
    if (v == null) return null;
    if (typeof v === 'object') return v as T;
    const s = safeStr(v);
    if (!s) return null;
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/**
 * Tailwind uygulanmasın:
 * - class/style attr kaldır
 * - ilk h1'i düşür (sayfa başlığını component basıyor)
 */
function stripPresentationAttrs(html: string): string {
  const src = safeStr(html);
  if (!src) return '';

  const noClass = src.replace(/\sclass="[^"]*"/gi, '');
  const noStyle = noClass.replace(/\sstyle="[^"]*"/gi, '');
  const dropFirstH1 = noStyle.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, '');

  return dropFirstH1.trim();
}

/** content_html içinden img src yakala (basit ve güvenli) */
function extractImgSrcListFromHtml(html: string): string[] {
  const src = safeStr(html);
  if (!src) return [];

  const out: string[] = [];
  const re = /<img\b[^>]*?\ssrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src))) {
    const u = safeStr(m[1]);
    if (u) out.push(u);
    if (out.length >= 12) break;
  }

  return out;
}

/**
 * Blog kaydından “gallery images” toparla (NewsDetail ile aynı yaklaşım):
 * - featured_image
 * - images/gallery/media alanları (array veya json-string)
 * - content_html içindeki img tag'leri
 */
function buildGalleryImages(post: any, title: string): LightboxImage[] {
  const unique = new Set<string>();
  const gallery: LightboxImage[] = [];

  const add = (rawUrl: string, alt?: string) => {
    const u = safeStr(rawUrl);
    if (!u) return;
    if (unique.has(u)) return;
    unique.add(u);

    const thumb = toCdnSrc(u, THUMB_W, THUMB_H, 'fill') || u;
    const raw = toCdnSrc(u, 1600, 1200, 'fit') || u;

    gallery.push({
      raw,
      thumb,
      alt: safeStr(alt) || safeStr(title) || 'image',
    });
  };

  // 1) featured
  add(safeStr(post?.featured_image), safeStr(post?.featured_image_alt));

  // 2) common candidates (blog tarafında da olası alanlar)
  const candidates = [
    post?.images,
    post?.images_json,
    post?.gallery_images,
    post?.gallery,
    post?.media,
    post?.media_items,
    post?.storage_image_ids,
  ];

  for (const c of candidates) {
    if (!c) continue;

    // array
    if (Array.isArray(c)) {
      for (const it of c) {
        if (typeof it === 'string') add(it);
        else if (it && typeof it === 'object')
          add((it as any).url || (it as any).src || (it as any).raw, (it as any).alt);
      }
      continue;
    }

    // json string
    if (typeof c === 'string') {
      const parsed = tryParseJson<any>(c);
      if (Array.isArray(parsed)) {
        for (const it of parsed) {
          if (typeof it === 'string') add(it);
          else if (it && typeof it === 'object') add(it.url || it.src || it.raw, it.alt);
        }
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
        for (const it of parsed.items) {
          if (typeof it === 'string') add(it);
          else if (it && typeof it === 'object') add(it.url || it.src || it.raw, it.alt);
        }
      }
    }
  }

  // 3) content_html img src
  const htmlImgs = extractImgSrcListFromHtml(safeStr(post?.content_html));
  for (const u of htmlImgs) add(u);

  return gallery.slice(0, 12);
}

const BlogDetails: React.FC = () => {
  const router = useRouter();
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);

  // Accordion open state (none open by default)
  const [openIdx, setOpenIdx] = useState<number>(-1);

  const t = useMemo(
    () => ({
      backToList: ui('ui_blog_back_to_list', 'Back to all blog posts'),
      categoriesTitle: ui('ui_blog_other_blogs_title', 'Other blogs'),
      contactTitle: ui('ui_blog_sidebar_contact_title', 'Contact Info'),
      loading: ui('ui_blog_loading', 'Loading blog...'),
      notFound: ui('ui_blog_not_found', 'Blog post not found.'),
      writeReview: ui('ui_blog_write_comment', 'Write a review'),
      tagsLabel: ui('ui_blog_tags', 'Tags'),
      shareTitle: ui('ui_blog_share_title', 'Share'),
      galleryTitle: ui('ui_blog_gallery_title', 'Gallery'),

      // sidebar fallbacks (only if blog list cannot be fetched)
      sb1: ui('ui_blog_sidebar_item_1', ''),
      sb2: ui('ui_blog_sidebar_item_2', ''),
      sb3: ui('ui_blog_sidebar_item_3', ''),
    }),
    [ui],
  );

  const slug = useMemo(() => readSlug(router.query.slug), [router.query.slug]);
  const isSlugReady = !!slug;

  const { data, isLoading, isError } = useGetCustomPageBySlugPublicQuery({ slug, locale } as any, {
    skip: !isSlugReady,
  });

  const post = data as CustomPageDto | undefined;

  const postId = useMemo(() => safeStr((post as any)?.id), [post]);
  const hasPost = !!post && !!postId && !isError;

  const title = useMemo(() => safeStr((post as any)?.title), [post]);

  // Content: content_html -> content.html -> summary -> content_text excerpt
  const rawHtml = useMemo(() => {
    const html = safeStr((post as any)?.content_html);
    if (html) return html;

    const c = (post as any)?.content;
    if (
      c &&
      typeof c === 'object' &&
      typeof (c as any).html === 'string' &&
      safeStr((c as any).html)
    ) {
      return safeStr((c as any).html);
    }

    const summary = safeStr((post as any)?.summary);
    if (summary) return `<p>${summary}</p>`;

    const txt = excerpt(safeStr((post as any)?.content_text), 1000).trim();
    return txt ? `<p>${txt}</p>` : '';
  }, [post]);

  const contentHtml = useMemo(() => stripPresentationAttrs(rawHtml), [rawHtml]);

  const tags = useMemo(() => {
    const raw = (post as any)?.tags ?? (post as any)?.tag_list ?? (post as any)?.tags_csv ?? '';
    return asStringArray(raw);
  }, [post]);

  // ✅ Sidebar items fallback: tags -> ui_blog_sidebar_items (JSON) -> sb1..sb3
  const sidebarItems = useMemo(() => {
    if (tags.length) return tags.slice(0, 8);

    const json = tryParseJson<string[] | { items?: string[] }>(ui('ui_blog_sidebar_items', ''));
    const fromJson = Array.isArray(json)
      ? json
      : json && typeof json === 'object' && Array.isArray((json as any).items)
      ? ((json as any).items as string[])
      : [];

    const legacy = [t.sb1, t.sb2, t.sb3].map(safeStr).filter(Boolean);

    const normalized = fromJson.map(safeStr).filter(Boolean).slice(0, 8);
    return normalized.length ? normalized : legacy.slice(0, 8);
  }, [tags, ui, t.sb1, t.sb2, t.sb3]);

  // ✅ Accordion items: only ui_blog_accordion_items JSON
  const accordionItems = useMemo<AccordionItem[]>(() => {
    const json = tryParseJson<AccordionItem[] | { items?: AccordionItem[] } | null>(
      ui('ui_blog_accordion_items', ''),
    );

    const fromJson = Array.isArray(json)
      ? json
      : json && typeof json === 'object' && Array.isArray((json as any).items)
      ? ((json as any).items as AccordionItem[])
      : [];

    return fromJson
      .map((x) => ({ title: safeStr((x as any)?.title), body: safeStr((x as any)?.body) }))
      .filter((x) => x.title && x.body)
      .slice(0, 10);
  }, [ui]);

  // -----------------------------------------
  // OTHER BLOGS LIST (DB) for "Other blogs"
  // -----------------------------------------
  const { data: otherBlogsData } = useListCustomPagesPublicQuery(
    {
      module_key: 'blog',
      locale,
      limit: 10,
      offset: 0,
      sort: 'created_at',
      order: 'desc',
      is_published: 1,
    } as any,
    { skip: !isSlugReady },
  );

  const otherBlogs = useMemo(() => {
    const raw =
      (otherBlogsData as any)?.items ??
      (otherBlogsData as any)?.data ??
      (otherBlogsData as any)?.rows ??
      otherBlogsData ??
      [];

    const arr = Array.isArray(raw) ? raw : [];

    return arr
      .map((x: any) => ({
        id: safeStr(x?.id),
        slug: safeStr(x?.slug),
        title: safeStr(x?.title),
      }))
      .filter((x) => x.slug && x.title)
      .filter((x) => x.slug !== slug && x.id !== postId)
      .slice(0, 8);
  }, [otherBlogsData, slug, postId]);

  // No hardcoded "/blog": use current route template
  const makeOtherHref = useCallback(
    (s: string) => ({
      pathname: router.pathname,
      query: { ...router.query, slug: s },
    }),
    [router.pathname, router.query],
  );

  const sidebarOtherBlogTitles = useMemo(() => {
    if (otherBlogs.length) return { mode: 'links' as const, items: otherBlogs };
    return { mode: 'text' as const, items: sidebarItems };
  }, [otherBlogs, sidebarItems]);

  // -----------------------------
  // Gallery (multi-image)
  // -----------------------------
  const galleryImages = useMemo<LightboxImage[]>(
    () => buildGalleryImages(post as any, title),
    [post, title],
  );

  const [activeIdx, setActiveIdx] = useState<number>(0);
  const safeActiveIdx = useMemo(() => {
    const len = galleryImages.length;
    if (!len) return 0;
    const i = activeIdx % len;
    return i < 0 ? i + len : i;
  }, [activeIdx, galleryImages.length]);

  const activeImage = galleryImages[safeActiveIdx];

  const heroSrc = useMemo(() => {
    const raw = safeStr(activeImage?.raw);
    if (!raw) return '';
    return toCdnSrc(raw, HERO_W, HERO_H, 'fill') || raw;
  }, [activeImage?.raw]);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightboxAt = useCallback((idx: number) => {
    setActiveIdx(idx);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  // ----------------------------
  // RENDER STATES
  // ----------------------------
  if (!isSlugReady) {
    return (
      <section className="technical__area pt-120 pb-60 cus-faq">
        <div className="container">
          <div className="row" data-aos="fade-up" data-aos-delay="300">
            <div className="col-12">
              <p>{t.loading}</p>
              <div className="ens-skel ens-skel--md mt-10" />
              <div className="ens-skel ens-skel--md ens-skel--w80 mt-10" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="technical__area pt-120 pb-60 cus-faq">
        <div className="container">
          <div className="row" data-aos="fade-up" data-aos-delay="300">
            <div className="col-12">
              <p>{t.loading}</p>
              <div className="ens-skel ens-skel--md mt-10" />
              <div className="ens-skel ens-skel--md ens-skel--w80 mt-10" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!hasPost) {
    return (
      <section className="technical__area pt-120 pb-60 cus-faq">
        <div className="container">
          <div className="row" data-aos="fade-up" data-aos-delay="300">
            <div className="col-12">
              <p>{t.notFound}</p>
              <div className="ens-blog__back mt-10">
                <Link href="/blog" locale={locale} className="link-more" aria-label={t.backToList}>
                  ← {t.backToList}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ----------------------------
  // MAIN RENDER
  // ----------------------------
  return (
    <>
      <section className="technical__area pt-120 pb-60 cus-faq">
        <div className="container">
          <div className="row" data-aos="fade-up" data-aos-delay="300">
            {/* MAIN */}
            <div className="col-xl-8 col-lg-12">
              <div className="technical__main-wrapper mb-60">
                {/* Back */}
                <div className="ens-blog__back mb-35">
                  <Link
                    href="/blog"
                    locale={locale}
                    className="link-more"
                    aria-label={t.backToList}
                  >
                    ← {t.backToList}
                  </Link>
                </div>

                {/* HERO (click => modal) */}
                <button
                  type="button"
                  className="ens-gallery__heroBtn"
                  onClick={() => openLightboxAt(safeActiveIdx)}
                  aria-label={t.galleryTitle}
                  title={t.galleryTitle}
                >
                  <div className="technical__thumb mb-20 ens-blog__hero">
                    <Image
                      src={(heroSrc as any) }
                      alt={safeStr((post as any)?.featured_image_alt) || title || 'blog image'}
                      width={HERO_W}
                      height={HERO_H}
                      priority
                    />
                  </div>
                </button>

                {/* THUMBS under hero */}
                {galleryImages.length > 1 && (
                  <div className="ens-gallery__thumbs" aria-label={t.galleryTitle}>
                    {galleryImages.map((img, i) => {
                      const src = safeStr(img.thumb || img.raw);
                      if (!src) return null;

                      const isActive = i === safeActiveIdx;
                      return (
                        <button
                          key={`${img.raw}-${i}`}
                          type="button"
                          className={`ens-gallery__thumb ${isActive ? 'is-active' : ''}`}
                          onClick={() => setActiveIdx(i)}
                          onDoubleClick={() => openLightboxAt(i)}
                          aria-label={`${t.galleryTitle} ${i + 1}`}
                          title={`${i + 1}/${galleryImages.length}`}
                        >
                          <span className="ens-gallery__thumbImg">
                            <Image
                              src={src}
                              alt={safeStr(img.alt) || title || 'thumbnail'}
                              fill
                              sizes="96px"
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* CONTENT WRAPPER (uses your BLOG SCSS) */}
                <div className="blog__content-wrapper">
                  {/* TITLE + SUMMARY */}
                  <div className="blog__content-item">
                    <div className="technical__content mb-25">
                      <div className="technical__title">
                        <h3 className="postbox__title">{title || t.notFound}</h3>
                      </div>
                      {safeStr((post as any)?.summary) && (
                        <p className="postbox__text">{safeStr((post as any)?.summary)}</p>
                      )}
                    </div>

                    {/* BODY */}
                    {!!contentHtml && (
                      <div className="technical__content">
                        <div
                          className="tp-postbox-details postbox__text"
                          dangerouslySetInnerHTML={{ __html: contentHtml }}
                        />
                      </div>
                    )}

                    {/* TAGS */}
                    {tags.length > 0 && (
                      <div className="postbox__tag-wrapper">
                        <div className="postbox__tag-title">{t.tagsLabel}:</div>
                        <div className="postbox__tag">
                          {tags.map((tag) => (
                            <Link key={tag} href="/blog" locale={locale} aria-label={`tag: ${tag}`}>
                              {tag}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion (only if items exist) */}
                  {accordionItems.length > 0 && (
                    <div className="bd-faq__wrapper-2 mb-45 mt-40">
                      <div className="bd-faq__accordion style-2">
                        <div className="accordion" id="blogAccordion">
                          {accordionItems.map((it, idx) => (
                            <div className="accordion-item" key={`${it.title}-${idx}`}>
                              <h2 className="accordion-header" id={`blogHeading${idx}`}>
                                <button
                                  type="button"
                                  className={
                                    (openIdx === idx ? '' : ' collapsed') + ' accordion-button'
                                  }
                                  onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
                                  aria-expanded={openIdx === idx}
                                  aria-controls={`blogCollapse${idx}`}
                                >
                                  {it.title}
                                </button>
                              </h2>

                              <div
                                id={`blogCollapse${idx}`}
                                className={`accordion-collapse collapse${
                                  openIdx === idx ? ' show' : ''
                                }`}
                                aria-labelledby={`blogHeading${idx}`}
                              >
                                <div className="accordion-body">
                                  <p>{it.body}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="col-xl-4 col-lg-6">
              <div className="sideber__widget">
                {/* Other blogs */}
                <div className="sideber__widget-item mb-40">
                  <div className="sidebar__category">
                    <div className="sidebar__contact-title mb-35">
                      <h3>{t.categoriesTitle}</h3>
                    </div>

                    <ul>
                      {sidebarOtherBlogTitles.mode === 'links'
                        ? sidebarOtherBlogTitles.items.map((b) => (
                            <li key={b.slug}>
                              <Link
                                href={makeOtherHref(b.slug)}
                                locale={locale}
                                aria-label={b.title}
                              >
                                {b.title}
                              </Link>
                            </li>
                          ))
                        : sidebarOtherBlogTitles.items.map((name) => (
                            <li key={name}>
                              <span>{name}</span>
                            </li>
                          ))}
                    </ul>
                  </div>
                </div>

                {/* Share (same pattern as NewsDetail sidebar) */}
                <div className="sideber__widget-item mb-40">
                  <div className="sidebar__category">
                    <div className="sidebar__contact-title mb-35">
                      <h3>{t.shareTitle}</h3>
                    </div>

                    <SocialShare
                      title={title}
                      text={safeStr((post as any)?.summary) || title}
                      showLabel={false}
                      showCompanySocials={true}
                    />
                  </div>
                </div>

                {/* REVIEWS (under Other blogs): blog */}
                {!!postId && (
                  <div className="sideber__widget-item mb-40">
                    <div className="sidebar__contact">
                      <div className="sidebar__contact-title mb-35">
                        <h3>{t.writeReview}</h3>
                      </div>

                      <div className="sidebar__contact-inner">
                        <div className="mb-25">
                          <ReviewList
                            targetType="blog"
                            targetId={postId}
                            locale={locale}
                            showHeader={false}
                            className="blog__detail-reviews"
                          />
                        </div>

                        <ReviewForm
                          targetType="blog"
                          targetId={postId}
                          locale={locale}
                          className="blog__detail-review-form"
                          toggleLabel={t.writeReview}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox modal */}
      <ImageLightboxModal
        open={lightboxOpen}
        images={galleryImages}
        index={safeActiveIdx}
        title={title}
        onClose={closeLightbox}
        onIndexChange={(i) => setActiveIdx(i)}
        showThumbs={true}
      />
    </>
  );
};

export default BlogDetails;
