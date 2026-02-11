// =============================================================
// FILE: src/components/containers/about/AboutSection.tsx
// Public About – Custom Pages (module_key="about") + UI i18n
// FINAL (no extra cards / no bullets / no third page)
// - Fixes syntax issue
// - Uses only keys that exist in ui_about seed below
// - ✅ Updated to Semantic Tailwind v4 Tokens
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';
import { downgradeH1ToH2, safeStr, extractHtmlFromAny, isRemoteUrl } from '@/integrations/types';

import { excerpt } from '@/shared/text';
import { toCdnSrc } from '@/shared/media';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';
import { localizePath } from '@/i18n/url';

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
    return t || safeStr(ui('ui_about_fallback_title', 'KÖNIG ENERGETIK')) || 'KÖNIG ENERGETIK';
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

  const subPrefix = useMemo(() => {
    const key = 'ui_about_subprefix';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'KÖNIG ENERGETIK';
  }, [ui]);

  const subLabel = useMemo(() => {
    const key = 'ui_about_sublabel';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    if (locale === 'de') return 'Über mich';
    if (locale === 'tr') return 'Hakkımda';
    return 'About';
  }, [ui, locale]);

  const viewAllText = useMemo(() => {
    const key = 'ui_about_view_all';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    if (locale === 'de') return 'Alle anzeigen';
    if (locale === 'tr') return 'Tümünü Gör';
    return 'View all';
  }, [ui, locale]);

  const readMoreText = useMemo(() => {
    const key = 'ui_about_read_more';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    if (locale === 'de') return 'Mehr lesen';
    if (locale === 'tr') return 'Devamı';
    return 'Read more';
  }, [ui, locale]);

  const emptyText = useMemo(() => {
    const key = 'ui_about_empty_text';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    if (locale === 'de') return 'Der Über-mich-Inhalt wird bald hier veröffentlicht.';
    if (locale === 'tr') return 'İçerik yakında burada yayınlanacaktır.';
    return 'Content will be published here soon.';
  }, [ui, locale]);

  const errorText = useMemo(() => {
    const key = 'ui_about_error';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    if (locale === 'de') return 'Inhalt konnte nicht geladen werden.';
    if (locale === 'tr') return 'İçerik yüklenemedi.';
    return 'Failed to load content.';
  }, [ui, locale]);

  return (
    <div className="bg-bg-primary relative py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center" data-aos="fade-up" data-aos-delay="300">
          {/* Left */}
          <div className="w-full">
            <div className="relative mb-12 lg:mb-0">
              <div className="w-full relative h-100 sm:h-125 lg:h-150 rounded-sm overflow-hidden shadow-medium">
                {heroSrc ? (
                  <Image
                    src={heroSrc as any}
                    alt={heroAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    unoptimized={isRemoteUrl(heroSrc)}
                  />
                ) : (
                  <div className="w-full h-full bg-sand-200 flex items-center justify-center text-text-muted">
                    <span className="text-sm">(No Image)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="w-full">
            <div className="flex flex-col">
              <div className="mb-8">
                <span className="block text-brand-primary font-bold uppercase tracking-widest text-sm mb-2">
                  <span>{subPrefix}</span> {subLabel}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-text-primary leading-tight mb-6">
                  {firstTitle}
                </h2>
              </div>

              {/* Summary */}
              {isLoading ? (
                <div className="space-y-4 mb-8">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" aria-hidden />
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" aria-hidden />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" aria-hidden />
                </div>
              ) : hasFirstSummary ? (
                <div className="mb-8">
                  <p className="text-text-secondary text-lg leading-relaxed mb-6">{firstSummary}</p>

                  {isTruncated ? (
                    <Link
                      href={aboutHref}
                      className="text-brand-primary font-bold hover:text-brand-hover transition-colors inline-flex items-center gap-1"
                      aria-label={readMoreText}
                    >
                      {readMoreText} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  ) : null}
                </div>
              ) : (
                <p className="text-text-muted mb-8">{emptyText}</p>
              )}

              {/* Error */}
              {!isLoading && isError ? (
                <div className="bg-rose-50 text-rose-800 p-4 rounded-md mb-8">
                  {errorText}
                </div>
              ) : null}

              {/* CTA */}
              <div className="mt-4">
                <Link 
                  href={aboutHref} 
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-primary text-text-on-dark font-bold uppercase tracking-widest hover:bg-brand-hover transition-all duration-300 shadow-soft rounded-sm" 
                  aria-label={viewAllText}
                >
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
