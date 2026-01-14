// =============================================================
// FILE: src/components/home/Hero.tsx
// Public Hero – Full-width Slider background + Bottom overlay (ui_hero)
// =============================================================
'use client';

import React, { useMemo, useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper';
import 'swiper/css';

// Icons
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

  const { data: sliderList, isLoading: slidersLoading } = useListSlidersQuery({
    locale,
    limit: 5,
    sort: 'display_order',
    order: 'asc',
  });

  const slides: HeroSlide[] = useMemo(() => {
    const list: SliderPublicDto[] = Array.isArray(sliderList) ? sliderList : [];
    const active = list.filter((s) => s.isActive);

    return active.map<HeroSlide>((s) => {
      const rawImage = (s.image || '').trim();
      const cdn = rawImage ? toCdnSrc(rawImage, 1920, 1080, 'fill') : '';
      const src = cdn || rawImage;

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

  const [activeIdx, setActiveIdx] = useState(0);
  const current = slides[activeIdx] || slides[0];

  const h2Text =
    (current?.title || '').trim() ||
    ui('ui_hero_title_fallback', 'Rahatla. Yenilen. Masajla iyi hisset.');

  const text =
    (current?.desc || '').trim() ||
    ui(
      'ui_hero_desc_fallback',
      'Profesyonel masaj uygulamalarıyla kaslarını gevşet, stresini azalt, güne daha iyi devam et.',
    );

  const ctaText = current?.buttonText || ui('ui_hero_cta', 'Detay');
  const rawLink = current?.buttonLink || '/appointments';
  const normalizedLink = rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
  const ctaHref = localizePath(locale, normalizedLink);

  const hasSlides = slides.length > 0;

  return (
    <section className="hero__area hero__hight p-relative">
      {/* FULL-WIDTH BACKGROUND SLIDER */}
      <div className="hero__bg">
        <Swiper
          slidesPerView={1}
          spaceBetween={0}
          loop={slides.length > 1}
          roundLengths
          modules={[Autoplay, Navigation]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          navigation={{
            nextEl: '.recent-2__button-next',
            prevEl: '.recent-2__button-prev',
          }}
          // ✅ ensure swipe enabled
          allowTouchMove
          simulateTouch
          resistanceRatio={0.85}
          className="hero__swiper"
          onSlideChange={(sw) => {
            const real = sw?.realIndex ?? 0;
            setActiveIdx(slides.length ? real % slides.length : 0);
          }}
        >
          {hasSlides ? (
            slides.map((s, i) => (
              <SwiperSlide key={s.id}>
                <div className="hero__bg-slide">
                  <Image
                    src={s.src as any}
                    alt={s.alt}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </SwiperSlide>
            ))
          ) : (
            <SwiperSlide key="fallback">
              <div className="hero__bg-slide hero__bg-slide--empty" />
            </SwiperSlide>
          )}
        </Swiper>

        {slidersLoading && <div className="skeleton-line hero__loading" aria-hidden />}
      </div>

      {/* OVERLAY CONTENT (BOTTOM, NO BLUR CARD) */}
      <div className="hero__overlay hero__overlay--bottom">
        <div className="hero__container">
          <div className="hero__overlay-inner hero__overlay-inner--bottom">
            <div className="hero__content hero__content--overlay">
              <span data-aos="fade-up" data-aos-delay="200">
                <span>{ui('ui_hero_kicker_brand', 'Masaj & Wellness')}</span>
              </span>

              <h2
                data-aos="fade-up"
                data-aos-delay="500"
                style={{ lineHeight: 1.1, marginTop: 10 }}
              >
                {h2Text}
              </h2>

              <p data-aos="fade-up" data-aos-delay="600">
                {text}
              </p>

              <div
                className="hero__actions d-flex align-items-center justify-content-center gap-3 flex-wrap"
                data-aos="fade-up"
                data-aos-delay="800"
              >
                <div className="project__navigation d-flex align-items-center gap-2">
                  <button
                    className="recent-2__button-prev"
                    aria-label={ui('ui_hero_prev', 'Previous slide')}
                    type="button"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    className="recent-2__button-next"
                    aria-label={ui('ui_hero_next', 'Next slide')}
                    type="button"
                  >
                    <FiChevronRight />
                  </button>
                </div>

                <Link href={ctaHref} className="cta__btn" aria-label={ctaText}>
                  {ctaText}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /OVERLAY */}
    </section>
  );
};

export default Hero;
