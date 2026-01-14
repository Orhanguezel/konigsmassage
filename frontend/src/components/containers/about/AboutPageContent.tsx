// =============================================================
// FILE: src/components/containers/about/AboutPageContent.tsx
// konigsmassage – About Page Content (SINGLE PAGE) (I18N + SAFE) [FINAL]
// - NO inline styles / NO styled-jsx
// - H1 forbidden: CMS html <h1> -> <h2>
// - ✅ FIX: ui() missing-key returns key itself => treat as empty/fallback
// - ✅ Pattern: t(key, fb) wrapper
// - ✅ CHANGE: Removed Extra blocks (What/Why/Goal) completely (kept header + seo/title flow)
// =============================================================

'use client';

import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';

// RTK – Custom Pages Public
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

// Helpers
import { toCdnSrc } from '@/shared/media';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

const downgradeH1ToH2 = (rawHtml: string) =>
  String(rawHtml || '')
    .replace(/<h1(\s|>)/gi, '<h2$1')
    .replace(/<\/h1>/gi, '</h2>');

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

function extractHtmlFromAny(v: unknown): string {
  if (!v) return '';

  if (typeof v === 'object') {
    const html = (v as any)?.html;
    return typeof html === 'string' ? html.trim() : '';
  }

  if (typeof v === 'string') {
    const s = v.trim();
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

function pickFirstPublished(items: any): CustomPageDto | null {
  const arr: CustomPageDto[] = Array.isArray(items) ? (items as any) : [];
  const published = arr.filter((p) => !!p?.is_published);
  return published[0] ?? null;
}

function isRemoteUrl(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  return /^https?:\/\//i.test(src) || /^\/\//.test(src);
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
    () => String(readUi('ui_about_subprefix', 'konigsmassage') || '').trim() || 'konigsmassage',
    [readUi],
  );

  const headerSubtitleLabel = useMemo(() => {
    const v = String(readUi('ui_about_sublabel', '') || '').trim();
    return v; // empty allowed
  }, [readUi]);

  const headerTitle = useMemo(() => {
    const v = String(readUi('ui_about_page_title', '') || '').trim();
    return v || 'konigsmassage';
  }, [readUi]);

  const headerLead = useMemo(() => String(readUi('ui_about_page_lead', '') || '').trim(), [readUi]);



  // CMS html (DB)
  const html = useMemo(() => {
    const raw =
      String((page as any)?.content_html ?? '').trim() ||
      extractHtmlFromAny((page as any)?.content) ||
      extractHtmlFromAny((page as any)?.content_json);

    return raw ? downgradeH1ToH2(raw) : '';
  }, [page]);

  // Featured image
  const imgSrc = useMemo(() => {
    const raw = String((page as any)?.featured_image ?? '').trim();
    if (!raw) return '';

    const cdn = toCdnSrc(raw, 1200, 800, 'fill');
    return (cdn || raw) as any;
  }, [page]);

  const imgAlt = useMemo(() => {
    const alt = String((page as any)?.featured_image_alt ?? '').trim();
    return alt|| 'about image';
  }, [page]);

  return (
    <section className="about__area grey-bg z-index-11 p-relative pt-120 pb-60 ens-about">
      <div className="container">
        {/* Header (KEEP) */}
        <div className="row">
          <div className="col-12">
            <div className="section__title-wrapper mb-40 text-center">
              <span className="section__subtitle-2">
                <span>{headerSubtitlePrefix}</span>
                {headerSubtitleLabel ? ` ${headerSubtitleLabel}` : null}
              </span>

              <h2 className="section__title-2">{headerTitle}</h2>

              {headerLead ? <p className="mt-10 mb-0">{headerLead}</p> : null}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="row mb-40">
            <div className="col-12">
              <div className="ens-skel ens-skel--md" aria-hidden />
              <div className="ens-skel ens-skel--md ens-skel--w80 mt-10" aria-hidden />
              <div className="ens-skel ens-skel--md ens-skel--w60 mt-10" aria-hidden />
            </div>
          </div>
        )}

        {/* Empty / Error */}
        {!isLoading && (!page || isError) && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-warning">
                {readUi('ui_about_empty', 'Content not found.')}
              </div>
            </div>
          </div>
        )}

        {!!page && !isLoading && (
          <>
            <div className="row align-items-center mb-40" data-aos="fade-up" data-aos-delay={150}>
              {/* Image LEFT */}
              <div className="col-xl-6 col-lg-6">
                <div className="blog__thumb-wrapper mb-30 mb-lg-0">
                  <div className="blog__thumb w-img">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={imgAlt}
                        width={1200}
                        height={800}
                        className="img-fluid"
                        unoptimized={isRemoteUrl(imgSrc)}
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Content RIGHT */}
              <div className="col-xl-6 col-lg-6">
                <div className="blog__content-wrapper mb-30 mb-lg-0" id="content">
                  <div className="blog__content">

                    {html ? (
                      <div
                        className="postbox__text tp-postbox-details ens-about__html"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    ) : (
                      <div className="postbox__text">
                        <p className="mb-0">
                          {readUi('ui_about_empty_text', 'Content will be published here.')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ REMOVED: Extra blocks (What/Why/Goal) */}
          </>
        )}
      </div>
    </section>
  );
};

export default AboutPageContent;
