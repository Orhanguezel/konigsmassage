// =============================================================
// FILE: src/components/containers/blog/BlogDetails.tsx
// FINAL – Blog Details (Single)
// - App Router: reads slug from useParams()
// - ✅ Locale-prefixed internal links via localizePath()
// - Prose content + Lightbox gallery
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// RTK
import {
  useGetCustomPageBySlugPublicQuery,
  useListCustomPagesPublicQuery,
} from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/shared';

// Helpers
import { toCdnSrc } from '@/shared/media';

// i18n
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

// Lightbox
import ImageLightboxModal, {
  type LightboxImage,
} from '@/components/common/public/ImageLightboxModal';
import OtherServicesSidebar from '@/components/containers/services/OtherServicesSidebar';
import ReviewForm from '@/components/common/public/ReviewForm';
import ReviewList from '@/components/common/public/ReviewList';
import ContactCtaCard from '@/components/common/public/ContactCtaCard';
import SocialShare from '@/components/common/public/SocialShare';

const THUMB_W = 220;
const THUMB_H = 140;

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function stripPresentationAttrs(html: string): string {
  const src = safeStr(html);
  if (!src) return '';
  const noClass = src.replace(/\sclass="[^"]*"/gi, '');
  const noStyle = noClass.replace(/\sstyle="[^"]*"/gi, '');
  // Remove first h1 if present, we render title separately
  return noStyle.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, '').trim();
}

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

function buildGalleryImages(post: any, title: string): LightboxImage[] {
  const unique = new Set<string>();
  const gallery: LightboxImage[] = [];

  const add = (rawUrl: string, alt?: string) => {
    const u = safeStr(rawUrl);
    if (!u || unique.has(u)) return;
    unique.add(u);
    gallery.push({
      raw: toCdnSrc(u, 1600, 1200, 'fit') || u,
      thumb: toCdnSrc(u, THUMB_W, THUMB_H, 'fill') || u,
      alt: safeStr(alt) || safeStr(title) || 'image',
    });
  };

  add(safeStr(post?.featured_image), safeStr(post?.featured_image_alt));

  const candidates = [
    post?.images,
    post?.images_json,
    post?.gallery_images,
    post?.gallery,
    post?.media,
    post?.media_items,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      c.forEach((it: any) => {
        if (typeof it === 'string') add(it);
        else if (it && typeof it === 'object') add(it.url || it.src || it.raw, it.alt);
      });
    } else if (typeof c === 'string') {
      try {
        const parsed = JSON.parse(c);
        if (Array.isArray(parsed)) {
          parsed.forEach((it: any) => {
            if (typeof it === 'string') add(it);
            else if (it && typeof it === 'object') add(it.url || it.src || it.raw, it.alt);
          });
        }
      } catch {
        // ignore
      }
    }
  }

  extractImgSrcListFromHtml(safeStr(post?.content_html)).forEach((u) => add(u));

  return gallery.slice(0, 12);
}

export default function BlogDetails() {
  const locale = useLocaleShort(); // "de" | "en" | "tr" short
  const { ui } = useUiSection('ui_blog', locale as any);

  const fb = useMemo(() => {
    if (locale === 'tr') {
      return {
        backToList: 'Tüm yazılara dön',
        otherBlogsTitle: 'Diğer yazılar',
        loading: 'Yükleniyor...',
        notFound: 'Blog içeriği bulunamadı.',
        galleryTitle: 'Galeriyi aç',
        like: 'Beğen',
        liked: 'Beğenildi',
        share: 'Paylaş',
        commentsTitle: 'Yorumlar',
        leaveComment: 'Yorum bırak',
        commentLabel: 'Yorumunuz',
        commentSubmit: 'Yorum gönder',
        contactCtaTitle: 'Sorunuz mu var?',
        contactCtaDesc: 'Seanslar veya randevu ile ilgili sorularınız için bize ulaşabilirsiniz.',
        contactPhone: 'Telefon',
        contactWhatsapp: 'WhatsApp',
        contactForm: 'İletişim formu',
      };
    }

    if (locale === 'de') {
      return {
        backToList: 'Zur Übersicht',
        otherBlogsTitle: 'Weitere Beiträge',
        loading: 'Wird geladen...',
        notFound: 'Blogbeitrag nicht gefunden.',
        galleryTitle: 'Galerie öffnen',
        like: 'Gefällt mir',
        liked: 'Gefällt mir',
        share: 'Teilen',
        commentsTitle: 'Kommentare',
        leaveComment: 'Kommentar hinterlassen',
        commentLabel: 'Ihr Kommentar',
        commentSubmit: 'Kommentar senden',
        contactCtaTitle: 'Noch Fragen?',
        contactCtaDesc:
          'Wenn Sie Fragen zur Sitzung oder zur Terminvereinbarung haben, kontaktieren Sie uns gern.',
        contactPhone: 'Telefon',
        contactWhatsapp: 'WhatsApp',
        contactForm: 'Kontaktformular',
      };
    }

    return {
      backToList: 'Back to all posts',
      otherBlogsTitle: 'Other posts',
      loading: 'Loading...',
      notFound: 'Blog post not found.',
      galleryTitle: 'Open gallery',
      like: 'Like',
      liked: 'Liked',
      share: 'Share',
      commentsTitle: 'Comments',
      leaveComment: 'Leave a comment',
      commentLabel: 'Your comment',
      commentSubmit: 'Post comment',
      contactCtaTitle: 'Have a question?',
      contactCtaDesc:
        'If you have questions about a session or scheduling, feel free to contact us.',
      contactPhone: 'Phone',
      contactWhatsapp: 'WhatsApp',
      contactForm: 'Contact form',
    };
  }, [locale]);

  const params = useParams<{ slug?: string | string[] }>();
  const slug = useMemo(() => {
    const v = params?.slug;
    return Array.isArray(v) ? safeStr(v[0]) : safeStr(v);
  }, [params]);

  const isSlugReady = !!slug;

  const t = useMemo(
    () => ({
      backToList: ui('ui_blog_back_to_list', fb.backToList),
      otherBlogsTitle: ui('ui_blog_other_blogs_title', fb.otherBlogsTitle),
      loading: ui('ui_blog_loading', fb.loading),
      notFound: ui('ui_blog_not_found', fb.notFound),
      galleryTitle: ui('ui_blog_gallery_title', fb.galleryTitle),
      like: ui('ui_blog_like', fb.like),
      liked: ui('ui_blog_liked', fb.liked),
      share: ui('ui_blog_share', fb.share),
      commentsTitle: ui('ui_blog_comments_title', fb.commentsTitle),
      leaveComment: ui('ui_blog_leave_comment', fb.leaveComment),
      commentLabel: ui('ui_blog_comment_label', fb.commentLabel),
      commentSubmit: ui('ui_blog_comment_submit', fb.commentSubmit),
      contactCtaTitle: ui('ui_blog_contact_cta_title', fb.contactCtaTitle),
      contactCtaDesc: ui('ui_blog_contact_cta_desc', fb.contactCtaDesc),
      contactPhone: ui('ui_blog_contact_phone', fb.contactPhone),
      contactWhatsapp: ui('ui_blog_contact_whatsapp', fb.contactWhatsapp),
      contactForm: ui('ui_blog_contact_form', fb.contactForm),
    }),
    [ui, fb],
  );

  // ✅ Locale-prefixed URLs
  const blogListHref = useMemo(() => localizePath(locale, '/blog'), [locale]);

  const { data, isLoading, isError } = useGetCustomPageBySlugPublicQuery({ slug, locale } as any, {
    skip: !isSlugReady,
  });

  const post = data as CustomPageDto | undefined;
  const hasPost = !!post && !!post.id && !isError;
  const title = safeStr(post?.title);

  const rawHtml = useMemo(() => {
    return (
      safeStr((post as any)?.content_html) || safeStr(((post as any)?.content as any)?.html) || ''
    );
  }, [post]);

  const contentHtml = useMemo(() => stripPresentationAttrs(rawHtml), [rawHtml]);

  // Gallery
  const galleryImages = useMemo(() => buildGalleryImages(post, title), [post, title]);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = galleryImages.length ? galleryImages[activeIdx % galleryImages.length] : null;
  const heroSrc = activeImage ? activeImage.raw || activeImage.thumb : '';

  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Like (client-only)
  const likeKey = useMemo(() => (slug ? `blog_like:${slug}` : ''), [slug]);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!likeKey) return;
    try {
      setLiked(window.localStorage.getItem(likeKey) === '1');
    } catch {
      setLiked(false);
    }
  }, [likeKey]);

  const toggleLike = () => {
    if (!likeKey) return;
    setLiked((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(likeKey, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Other blogs
  const { data: otherBlogsData } = useListCustomPagesPublicQuery(
    {
      module_key: 'blog',
      locale,
      limit: 5,
      sort: 'created_at',
      order: 'desc',
      is_published: 1,
    } as any,
    { skip: !isSlugReady },
  );

  const otherBlogs = useMemo(() => {
    const arr = ((otherBlogsData as any)?.items || []) as any[];
    return arr
      .filter((p) => safeStr(p.slug) !== slug && p.id !== post?.id)
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        title: safeStr(p.title),
        slug: safeStr(p.slug),
        date: p.created_at,
      }));
  }, [otherBlogsData, slug, post?.id]);

  if (!isSlugReady || isLoading) {
    return (
      <div className="py-20 text-center bg-bg-primary">
        <div className="animate-pulse">
          <div className="h-4 bg-sand-200 rounded w-48 mx-auto mb-4" />
          <div className="h-64 bg-sand-200 rounded w-full max-w-4xl mx-auto" />
        </div>
      </div>
    );
  }

  if (!hasPost) {
    return (
      <div className="py-20 text-center bg-bg-primary min-h-[50vh] flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-text-primary mb-4">{t.notFound}</h3>
        <Link href={blogListHref} className="text-brand-primary font-bold hover:underline">
          {t.backToList}
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="bg-bg-primary py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* SIDEBAR (LEFT) */}
            <div className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-24 space-y-8">
                <OtherServicesSidebar />

                {otherBlogs.length > 0 && (
                  <div className="bg-bg-secondary p-6 rounded-xl shadow-soft border border-border-light">
                    <h3 className="text-xl font-bold font-serif text-text-primary mb-6 border-b border-border-light pb-2">
                      {t.otherBlogsTitle}
                    </h3>
                    <ul className="space-y-4">
                      {otherBlogs.map((b) => {
                        const href = localizePath(locale, `/blog/${b.slug}`);
                        return (
                          <li key={b.id}>
                            <Link href={href} className="group block">
                              <h4 className="font-medium text-text-primary group-hover:text-brand-primary transition-colors leading-snug mb-1">
                                {b.title}
                              </h4>
                              {b.date && (
                                <span className="text-xs font-semibold text-text-muted">
                                  {new Date(b.date).toLocaleDateString(locale)}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="lg:col-span-8 order-1 lg:order-2">
              <div className="mb-8">
                <Link
                  href={blogListHref}
                  className="inline-flex items-center text-text-muted hover:text-brand-primary transition-colors text-sm font-bold uppercase tracking-wide group mb-6"
                >
                  <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>{' '}
                  {t.backToList}
                </Link>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-text-primary leading-tight mb-6">
                  {title}
                </h1>
              </div>

              {/* HERO */}
              {heroSrc && (
                <div className="mb-8 rounded-xl overflow-hidden shadow-medium bg-sand-100 relative group">
                  <div
                    className="aspect-video relative cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <Image
                      src={heroSrc as any}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 bg-black/50 px-3 py-1 rounded text-sm transition-opacity">
                        {t.galleryTitle}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions (under image) */}
              <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleLike}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                      liked
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-bg-secondary text-text-primary border-border-light hover:bg-sand-100',
                    ].join(' ')}
                    aria-pressed={liked}
                  >
                    <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
                    <span>{liked ? t.liked : t.like}</span>
                  </button>

                  <a
                    href="#comments"
                    className="inline-flex items-center gap-2 rounded-full border border-border-light bg-bg-secondary px-4 py-2 text-sm font-semibold text-text-primary hover:bg-sand-100 transition-colors"
                  >
                    <span aria-hidden="true">💬</span>
                    <span>{t.commentsTitle}</span>
                  </a>
                </div>

                <SocialShare
                  className="flex items-center justify-start sm:justify-end"
                  showLabel={false}
                  label={t.share}
                  title={title}
                  text={safeStr((post as any)?.summary)}
                />
              </div>

              {/* Thumbs */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveIdx(i);
                        setLightboxOpen(true);
                      }}
                      className={`relative w-24 h-16 rounded-md overflow-hidden shrink-0 border-2 transition-all ${
                        i === activeIdx
                          ? 'border-brand-primary'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      type="button"
                    >
                      <Image
                        src={(img.thumb || img.raw) as any}
                        alt="thumb"
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="bg-bg-secondary p-8 md:p-10 rounded-xl shadow-soft border border-border-light">
                <div className="prose prose-lg prose-rose max-w-none prose-headings:font-serif prose-headings:text-text-primary prose-a:text-brand-primary prose-p:text-base prose-p:leading-[1.8] prose-li:text-base prose-li:leading-[1.8] prose-ul:mb-6 prose-ol:mb-6 prose-p:mb-6">
                  {contentHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                  ) : (
                    <p>{safeStr((post as any)?.summary)}</p>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div id="comments" className="mt-12">
                <ReviewList
                  targetType="blog"
                  targetId={post.id}
                  locale={locale}
                  variant="comments"
                  titleOverride={t.commentsTitle}
                />

                <div className="mt-8">
                  <ReviewForm
                    targetType="blog"
                    targetId={post.id}
                    locale={locale}
                    initialOpen={false}
                    showToggle
                    titleOverride={t.leaveComment}
                    hideRating
                    commentLabelOverride={t.commentLabel}
                    submitTextOverride={t.commentSubmit}
                  />
                </div>

                <div className="mt-10">
                  <ContactCtaCard
                    title={t.contactCtaTitle}
                    description={t.contactCtaDesc}
                    phoneLabel={t.contactPhone}
                    whatsappLabel={t.contactWhatsapp}
                    formLabel={t.contactForm}
                    contactHref={localizePath(locale, '/contact')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ImageLightboxModal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={galleryImages}
        index={activeIdx}
        onIndexChange={setActiveIdx}
        title={title}
        showThumbs
      />
    </>
  );
}
