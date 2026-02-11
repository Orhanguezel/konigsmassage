// =============================================================
// FILE: src/components/containers/about/AboutPageContent.tsx
// konigsmassage – About Page Content (SINGLE PAGE) (I18N + SAFE) [FINAL]
// - NO inline styles / NO styled-jsx
// - H1 forbidden: CMS html <h1> -> <h2>
// - ✅ FIX: ui() missing-key returns key itself => treat as empty/fallback
// - ✅ Pattern: t(key, fb) wrapper
// - ✅ REPLACE: Legacy Bootstrap/Template classes with Tailwind v4
// =============================================================

'use client';

import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';

// RTK – Custom Pages Public
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';
import { downgradeH1ToH2, extractHtmlFromAny, isRemoteUrl } from '@/integrations/types';

// Helpers
import { toCdnSrc } from '@/shared/media';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

function pickFirstPublished(items: any): CustomPageDto | null {
  const arr: CustomPageDto[] = Array.isArray(items) ? (items as any) : [];
  const published = arr.filter((p) => !!p?.is_published);
  return published[0] ?? null;
}

function safeJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x || '').trim()).filter(Boolean);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed.map((x) => String(x || '').trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

const AboutPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);

  // base wrapper
  const t = useCallback((key: string, fallback: any) => ui(key, fallback), [ui]);

  // ✅ IMPORTANT: if ui() returns the key itself, treat as missing and use fallback
  const readUi = useCallback(
    (key: string, fallback: any) => {
      const v = t(key, fallback);

      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return fallback;
        if (s === key) return fallback; // missing-key behavior
      }

      return v;
    },
    [t],
  );

  const { data, isLoading, isError } = useListCustomPagesPublicQuery({
    module_key: 'about',
    locale,
    limit: 10,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const page = useMemo<CustomPageDto | null>(
    () => pickFirstPublished((data as any)?.items),
    [data],
  );

  // Header strings (keep these — do NOT remove)
  const headerSubtitlePrefix = useMemo(
    () => String(readUi('ui_about_subprefix', 'KÖNIG ENERGETIK') || '').trim() || 'KÖNIG ENERGETIK',
    [readUi],
  );

  const headerSubtitleLabel = useMemo(() => {
    const v = String(readUi('ui_about_sublabel', '') || '').trim();
    return v; // empty allowed
  }, [readUi]);

  const headerTitle = useMemo(() => {
    const v = String(readUi('ui_about_page_title', '') || '').trim();
    if (v) return v;
    if (locale === 'de') return 'Über mich';
    if (locale === 'tr') return 'Hakkımda';
    return 'About';
  }, [readUi, locale]);

  const headerLead = useMemo(() => String(readUi('ui_about_page_lead', '') || '').trim(), [readUi]);

  // CMS html (DB)
  const html = useMemo(() => {
    const raw =
      String((page as any)?.content_html ?? '').trim() ||
      extractHtmlFromAny((page as any)?.content) ||
      extractHtmlFromAny((page as any)?.content_json);

    return raw ? downgradeH1ToH2(raw) : '';
  }, [page]);

  const featuredImageRaw = useMemo(() => String((page as any)?.featured_image ?? '').trim(), [page]);

  // Featured image
  const imgSrc = useMemo(() => {
    if (!featuredImageRaw) return '';

    const cdn = toCdnSrc(featuredImageRaw, 1200, 800, 'fill');
    return (cdn || featuredImageRaw) as any;
  }, [featuredImageRaw]);

  const imgAlt = useMemo(() => {
    const alt = String((page as any)?.featured_image_alt ?? '').trim();
    return alt || 'about image';
  }, [page]);

  const gallery = useMemo(() => {
    const raw = (page as any)?.images;
    const list = safeJsonArray(raw);
    const unique = Array.from(new Set(list));
    return unique.filter(Boolean);
  }, [page]);

  const galleryThumbs = useMemo(() => {
    const list = gallery.filter((x) => x && x !== featuredImageRaw);
    return list.slice(0, 3);
  }, [gallery, featuredImageRaw]);

  return (
    <section className="relative py-20 z-10 bg-bg-primary text-text-primary">
      <div className="container mx-auto px-4">
        {/* Header (KEEP) */}
        <div className="mb-12 text-center">
          <div className="mb-4">
            <span className="block text-brand-primary font-bold uppercase tracking-wide mb-2 text-sm md:text-base">
              <span>{headerSubtitlePrefix}</span>
              {headerSubtitleLabel ? ` ${headerSubtitleLabel}` : null}
            </span>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary leading-tight">
              {headerTitle}
            </h2>

            {headerLead ? <p className="mt-4 mb-0 text-text-secondary max-w-2xl mx-auto">{headerLead}</p> : null}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mb-10 max-w-4xl mx-auto">
            <div className="h-4 bg-gray-200 rounded w-full mb-2.5 animate-pulse" aria-hidden />
            <div className="h-4 bg-gray-200 rounded w-4/5 mb-2.5 animate-pulse" aria-hidden />
            <div className="h-4 bg-gray-200 rounded w-3/5 animate-pulse" aria-hidden />
          </div>
        )}

        {/* Empty / Error */}
        {!isLoading && (!page || isError) && (
          <div className="max-w-4xl mx-auto">
            <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50" role="alert">
              {readUi('ui_about_empty', 'Content not found.')}
            </div>
          </div>
        )}

        {!!page && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12" data-aos="fade-up" data-aos-delay={150}>
            {/* Image LEFT */}
            <div className="w-full">
              <div className="rounded-2xl overflow-hidden shadow-medium bg-bg-secondary border border-border-light">
                <div className="w-full h-auto aspect-3/2 relative">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={imgAlt}
                      fill
                      className="object-cover"
                      unoptimized={isRemoteUrl(imgSrc)}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : null}
                </div>
              </div>

              {galleryThumbs.length ? (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {galleryThumbs.map((src) => (
                    <div key={src} className="relative aspect-square rounded-xl overflow-hidden border border-border-light bg-bg-secondary shadow-soft">
                      <Image
                        src={src}
                        alt={imgAlt}
                        fill
                        className="object-cover"
                        unoptimized={isRemoteUrl(src)}
                        sizes="(max-width: 768px) 33vw, 160px"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Content RIGHT */}
            <div className="w-full">
              <div className="prose prose-lg prose-rose text-text-secondary max-w-none">
                {html ? (
                  <div
                    className="prose-h2:font-serif prose-h2:text-text-primary prose-a:text-brand-primary"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <div>
                    <p className="mb-0">
                      {readUi('ui_about_empty_text', 'Content will be published here.')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutPageContent;
