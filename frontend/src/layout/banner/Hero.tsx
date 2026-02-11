// =============================================================
// FILE: src/components/home/Hero.tsx
// Public Hero – Full-width Slider background + Bottom overlay (ui_hero)
// - FIX: İlk açılışta slider image geç gelince boş kalmasın diye fallback background ekledik
//   (fallback URL'yi sen düzelteceksin)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';

// RTK – PUBLIC sliders
import { useListSlidersQuery } from '@/integrations/rtk/hooks';
import type { SliderPublicDto } from '@/integrations/types';

// helpers
import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

// i18n
import { useResolvedLocale } from '@/i18n/locale';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

import { IconChevronLeft, IconChevronRight } from '@/components/ui/icons';

type HeroSlide = {
  id: string;
  title: string;
  desc: string;
  src: string | StaticImageData;
  alt: string;
  buttonText?: string;
  buttonLink?: string;
};

const Hero: React.FC = () => {
  const locale = useResolvedLocale();
  const { ui } = useUiSection('ui_hero', locale);

  const variantRaw = (ui('ui_hero_variant', 'v3') || '').toString().trim().toLowerCase();
  const variant: 'v1' | 'v2' | 'v3' = variantRaw === 'v1' || variantRaw === 'v2' ? variantRaw : 'v3';

  // ✅ Fallback: ilk açılışta boş görünmesin (adresini sen güncelle)
  const FALLBACK_HERO_IMAGE =
    'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866951/uploads/anastasia/gallery/21-1748866946899-726331234.webp';

  const { data: sliderList, isLoading: slidersLoading } = useListSlidersQuery({
    locale,
    limit: 6,
    sort: 'display_order',
    order: 'asc',
  });

  const slides: HeroSlide[] = useMemo(() => {
    const list: SliderPublicDto[] = Array.isArray(sliderList) ? sliderList : [];
    const active = list.filter((s) => s.isActive);

    return active.map<HeroSlide>((s) => {
      const rawImage = (s.image || '').trim();
      // Keep hero images smaller to reduce LCP payload (Cloudinary already optimizes to WebP/AVIF where possible)
      const cdn = rawImage ? toCdnSrc(rawImage, 1440, 900, 'fill') : '';
      const src = cdn || rawImage || FALLBACK_HERO_IMAGE;

      return {
        id: s.id,
        title: (s.title || '').trim(),
        desc: excerpt(s.description || '', 260),
        src,
        alt: s.alt || s.title || 'hero slide',
        buttonText: (s.buttonText || '').trim() || undefined,
        buttonLink: (s.buttonLink || '').trim() || undefined,
      };
    });
  }, [sliderList]);

  const hasSlides = slides.length > 0;

  const [activeIdx, setActiveIdx] = useState(0);
  const current = slides[activeIdx] || slides[0];

  useEffect(() => {
    if (!hasSlides || slides.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(id);
  }, [hasSlides, slides.length]);

  const h2Text =
    (current?.title || '').trim() ||
    ui('ui_hero_title_fallback', 'Rahatla. Yenilen. Masajla iyi hisset.');

  const text =
    (current?.desc || '').trim() ||
    ui(
      'ui_hero_desc_fallback',
      'Profesyonel masaj uygulamalarıyla kaslarını gevşet, stresini azalt, güne daha iyi devam et.',
    );

  const ctaText =
    (current?.buttonText || '').trim() || ui('ui_hero_cta', 'Detay').trim() || 'Detay';
  const rawLink = current?.buttonLink || '/appointment';
  const normalizedLink = rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
  const ctaHref = localizePath(locale, normalizedLink);

  // ✅ Her durumda gösterilecek en az bir background (ilk açılışta boş kalmaz)
  const firstBgSrc =
    (hasSlides ? (slides[0]?.src as any) : undefined) || (FALLBACK_HERO_IMAGE as any);

  const heroSrc = ((current?.src as any) || firstBgSrc) as any;
  const heroAlt = current?.alt || ui('ui_hero_fallback_alt', 'Hero background');

  const goPrev = () => {
    if (!hasSlides || slides.length <= 1) return;
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    if (!hasSlides || slides.length <= 1) return;
    setActiveIdx((prev) => (prev + 1) % slides.length);
  };

  return (
    <section
      data-header-overlay="true"
      className="relative w-full h-[100svh] min-h-screen overflow-hidden bg-bg-dark group"
    >
      {variant === 'v2' ? (
        <>
          {/* LIGHT / SPLIT HERO (mockup v2) */}
          <div className="absolute inset-0 bg-bg-primary" aria-hidden="true" />

          <div className="relative z-10 h-full container mx-auto px-4 flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 w-full items-center">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 text-text-secondary font-bold uppercase tracking-widest text-sm mb-5">
                  {ui('ui_hero_kicker_brand', 'Energetische Massage in Bonn')}
                </span>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.05] text-text-primary mb-6">
                  {h2Text}
                </h1>

                <p className="text-lg md:text-xl text-text-secondary leading-relaxed mb-10 max-w-xl">
                  {text}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center justify-center px-8 py-4 bg-brand-primary text-text-on-dark font-bold uppercase tracking-widest hover:bg-brand-hover transition-colors shadow-soft rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
                    aria-label={ctaText}
                  >
                    {ctaText}
                  </Link>
                </div>
              </div>

              <div className="relative w-full h-[46vh] min-h-[360px] lg:h-[64vh] rounded-3xl overflow-hidden bg-sand-200 border border-sand-300 shadow-medium">
                <Image
                  src={heroSrc}
                  alt={heroAlt}
                  fill
                  priority={activeIdx === 0}
                  fetchPriority={activeIdx === 0 ? 'high' : 'auto'}
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-bg-dark/10 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* FULL-WIDTH BACKGROUND (v1 + v3) */}
          <div className="absolute inset-0 w-full h-full z-0">
            <div className="absolute inset-0 w-full h-full" aria-hidden="true">
              <Image
                src={heroSrc}
                alt={heroAlt}
                fill
                priority={activeIdx === 0}
                fetchPriority={activeIdx === 0 ? 'high' : 'auto'}
                unoptimized
                sizes="100vw"
                className="object-cover"
              />

              {/* Token-based overlay (no pure black) */}
              <div className="absolute inset-0 bg-linear-to-b from-bg-dark/55 via-bg-dark/20 to-bg-dark/65" />
            </div>

            {slidersLoading ? (
              <div className="absolute inset-0 bg-sand-200 animate-pulse z-10" aria-hidden />
            ) : null}
          </div>

          {variant === 'v1' ? (
            <>
              {/* CENTER CARD (mockup v1) */}
              <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
                <div className="w-full max-w-5xl rounded-[2.5rem] border border-sand-300/30 bg-bg-dark/80 shadow-medium backdrop-blur-md px-6 py-14 md:px-12 md:py-16 text-center">
                  <p className="text-text-on-dark/80 font-semibold tracking-widest uppercase text-sm mb-6">
                    {ui('ui_hero_kicker_brand', 'Bonn’da Enerjetik Masaj')}
                  </p>

                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-text-on-dark leading-[1.02] mb-6">
                    {h2Text}
                  </h1>

                  <p className="text-text-on-dark/80 text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-10">
                    {text}
                  </p>

                  <div className="flex items-center justify-center gap-4">
                    <Link
                      href={ctaHref}
                      className="inline-flex items-center justify-center px-10 py-4 bg-bg-primary text-text-primary font-bold uppercase tracking-widest hover:bg-sand-100 transition-colors shadow-soft rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark"
                      aria-label={ctaText}
                    >
                      {ctaText}
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* OVERLAY CONTENT (BOTTOM) — v3 */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end pb-24 lg:pb-36 pointer-events-none bg-linear-to-t from-bg-dark/85 via-transparent to-transparent">
                <div className="container mx-auto px-4 pointer-events-auto">
                  <div className="w-full">
                    <div className="max-w-3xl text-text-on-dark">
                      <span
                        data-aos="fade-up"
                        data-aos-delay="200"
                        className="block text-text-on-dark/90 font-bold uppercase tracking-widest mb-4"
                      >
                        <span>{ui('ui_hero_kicker_brand', 'Masaj & Wellness')}</span>
                      </span>

                      <h1
                        data-aos="fade-up"
                        data-aos-delay="500"
                        className="text-4xl lg:text-6xl font-serif font-bold leading-tight mb-6 text-text-on-dark"
                      >
                        {h2Text}
                      </h1>

                      <p
                        data-aos="fade-up"
                        data-aos-delay="600"
                        className="text-lg text-text-on-dark/80 mb-8 max-w-xl"
                      >
                        {text}
                      </p>

                      <div
                        className="flex flex-wrap items-center gap-6"
                        data-aos="fade-up"
                        data-aos-delay="800"
                      >
                        <Link
                          href={ctaHref}
                          className="inline-flex items-center justify-center px-8 py-4 bg-brand-primary text-text-on-dark font-bold uppercase tracking-widest hover:bg-bg-primary hover:text-text-primary transition-colors shadow-lg rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark"
                          aria-label={ctaText}
                        >
                          {ctaText}
                        </Link>

                        <div className="flex items-center gap-3">
                          <button
                            className="w-12 h-12 flex items-center justify-center border border-text-on-dark/30 rounded-full text-text-on-dark hover:bg-bg-primary hover:text-text-primary transition-all backdrop-blur-sm cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark"
                            aria-label={ui('ui_hero_prev', 'Previous slide')}
                            type="button"
                            onClick={goPrev}
                            disabled={!hasSlides || slides.length <= 1}
                          >
                            <IconChevronLeft size={22} />
                          </button>
                          <button
                            className="w-12 h-12 flex items-center justify-center border border-text-on-dark/30 rounded-full text-text-on-dark hover:bg-bg-primary hover:text-text-primary transition-all backdrop-blur-sm cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark"
                            aria-label={ui('ui_hero_next', 'Next slide')}
                            type="button"
                            onClick={goNext}
                            disabled={!hasSlides || slides.length <= 1}
                          >
                            <IconChevronRight size={22} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* WAVE TRANSITION (mockup v3) */}
              <div className="absolute bottom-0 left-0 w-full z-30 pointer-events-none overflow-hidden leading-none">
                <svg
                  viewBox="0 0 1440 120"
                  preserveAspectRatio="none"
                  className="w-full h-20 md:h-24 text-bg-primary"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M0,64 C120,80 240,96 360,96 C480,96 600,80 720,72 C840,64 960,64 1080,72 C1200,80 1320,96 1440,88 L1440,120 L0,120 Z"
                  />
                </svg>
              </div>
            </>
          )}
        </>
      )}

    </section>
  );
};

export default Hero;
