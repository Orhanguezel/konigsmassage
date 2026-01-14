// =============================================================
// FILE: src/components/containers/about/AboutSection.tsx
// Public About – Custom Pages (module_key="about") + UI i18n
// FINAL (no extra cards / no bullets / no third page)
// - Fixes syntax issue
// - Uses only keys that exist in ui_about seed below
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

import { excerpt } from '@/shared/text';
import { toCdnSrc } from '@/shared/media';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

const downgradeH1ToH2 = (rawHtml: string) =>
  String(rawHtml || '')
    .replace(/<h1(\s|>)/gi, '<h2$1')
    .replace(/<\/h1>/gi, '</h2>');

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
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

function extractHtmlFromAny(page: any): string {
  if (!page) return '';

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
      const h = safeStr(obj?.html);
      if (h) return h;
    }
    return s;
  }

  return '';
}

function isRemoteUrl(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  return /^https?:\/\//i.test(src) || /^\/\//.test(src);
}

const SUMMARY_LEN = 260;

const AboutSection: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);

  const { data, isLoading, isError } = useListCustomPagesPublicQuery({
    module_key: 'about',
    locale,
    limit: 10,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const first = useMemo(() => {
    const items: CustomPageDto[] = ((data as any)?.items ?? []) as any;
    const published = items.filter((p) => !!p?.is_published);
    return published[0] ?? null;
  }, [data]);

  const aboutHref = useMemo(() => localizePath(locale as any, '/about'), [locale]);

  const firstTitle = useMemo(() => {
    const t = safeStr(first?.title);
    return t || safeStr(ui('ui_about_fallback_title', 'Königs Massage')) || 'Königs Massage';
  }, [first?.title, ui]);

  const firstSummaryRaw = useMemo(() => {
    const raw = extractHtmlFromAny(first);
    return raw ? downgradeH1ToH2(raw) : '';
  }, [first]);

  const firstSummary = useMemo(() => {
    return firstSummaryRaw ? excerpt(firstSummaryRaw, SUMMARY_LEN).trim() : '';
  }, [firstSummaryRaw]);

  const hasFirstSummary = !!safeStr(firstSummary);

  const isTruncated = useMemo(() => {
    const plain = safeStr(firstSummaryRaw)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain.length > SUMMARY_LEN + 20;
  }, [firstSummaryRaw]);

  const heroSrc = useMemo(() => {
    const raw = safeStr((first as any)?.featured_image);
    if (!raw) return '';

    const cdn = toCdnSrc(raw, 720, 520, 'fill');
    return (cdn || raw) as any;
  }, [first]);

  const heroAlt = useMemo(() => {
    const alt = safeStr((first as any)?.featured_image_alt);
    return alt || firstTitle || 'about';
  }, [first, firstTitle]);

  const viewAllText = safeStr(ui('ui_about_view_all', 'Tümünü Gör')) || 'Tümünü Gör';
  const readMoreText = safeStr(ui('ui_about_read_more', 'Devamı')) || 'Devamı';

  return (
    <div className="about__area grey-bg z-index-11 p-relative pt-120 pb-60">
      <div className="container">
        <div className="row align-items-center" data-aos="fade-up" data-aos-delay="300">
          {/* Left */}
          <div className="col-xl-6 col-lg-6">
            <div className="about__thumb-wrapper mb-60">
              <div className="about__thumb w-img">
                {heroSrc ? (
                  <Image
                    src={heroSrc as any}
                    alt={heroAlt}
                    width={720}
                    height={520}
                    priority
                    className="ens-about__heroImg"
                    unoptimized={isRemoteUrl(heroSrc)}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="col-xl-6 col-lg-6">
            <div className="about__content-wapper mb-60">
              <div className="section__title-wrapper mb-40">
                <span className="section__subtitle-2">
                  <span>{ui('ui_about_subprefix', 'Königs Massage')}</span>{' '}
                  {ui('ui_about_sublabel', 'Hakkımda')}
                </span>
              </div>

              {/* Summary */}
              {isLoading ? (
                <div className="ens-about__skel">
                  <div className="skeleton-line ens-about__skelLine" aria-hidden />
                  <div className="skeleton-line ens-about__skelLine" aria-hidden />
                  <div className="skeleton-line ens-about__skelLine" aria-hidden />
                </div>
              ) : hasFirstSummary ? (
                <div className="ens-about__summary">
                  <p className="ens-about__summaryText">{firstSummary}</p>

                  {isTruncated ? (
                    <Link
                      href={aboutHref}
                      className="ens-about__readMore"
                      aria-label={readMoreText}
                    >
                      {readMoreText} →
                    </Link>
                  ) : null}
                </div>
              ) : (
                <p>{ui('ui_about_empty_text', 'İçerik yakında burada yayınlanacaktır.')}</p>
              )}

              {/* Error */}
              {!isLoading && isError ? (
                <div className="alert alert-warning mt-15">
                  {ui('ui_about_error', 'İçerik yüklenemedi.')}
                </div>
              ) : null}

              {/* CTA */}
              <div className="project__view ens-about__cta">
                <Link href={aboutHref} className="solid__btn" aria-label={viewAllText}>
                  {viewAllText}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
