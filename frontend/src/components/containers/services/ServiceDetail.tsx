// =============================================================
// FILE: src/components/containers/services/ServiceDetail.tsx
// FINAL — Massage Detail (Services module) — NewsDetail sidebar pattern applied
// - ✅ Adds "Other massages" sidebar block
// - ✅ Uses public services list (DB) + filters current service
// - ✅ Links are locale-aware (localizePath)
// - ✅ CTA button routes to /[locale]/appointment (in-page navigation)
// - ✅ No inline styles
// =============================================================

'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import {
  useGetServiceBySlugPublicQuery,
  useListServiceImagesPublicQuery,
  useGetSiteSettingByKeyQuery,
  useListServicesPublicQuery,
} from '@/integrations/rtk/hooks';

import type { ServiceImageDto } from '@/integrations/types';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';
import { normLocaleTag } from '@/i18n/localeUtils';

import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

import ImageLightboxModal, {
  type LightboxImage,
} from '@/components/common/public/ImageLightboxModal';
import { SkeletonLine, SkeletonStack } from '@/components/ui/skeleton';

const HERO_W = 1200;
const HERO_H = 700;

const THUMB_W = 220;
const THUMB_H = 140;

type ServiceDetailProps = { slug: string };

const safeUiText = (
  ui: (k: string, f?: any) => any,
  key: string,
  fallback: string,
  opts?: { maxLen?: number },
): string => {
  const fb = String(fallback ?? '').trim();
  const raw = ui(key, fb);
  const s = String(raw ?? '').trim();

  if (!s) return fb;
  if (s === key) return fb;
  if (s.startsWith(key)) return fb;
  if (opts?.maxLen && s.length > opts.maxLen) return fb;

  return s;
};

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ slug }) => {
  const locale = useLocaleShort() || 'de';
  const { ui } = useUiSection('ui_services', locale as any);

  // ✅ default_locale DB’den (fallback arama için)
  const { data: defaultLocaleRow } = useGetSiteSettingByKeyQuery({ key: 'default_locale' } as any);
  const defaultLocale = useMemo(
    () => normLocaleTag((defaultLocaleRow as any)?.value) || 'de',
    [defaultLocaleRow],
  );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    data: service,
    isLoading,
    isError,
  } = useGetServiceBySlugPublicQuery({ slug, locale, default_locale: defaultLocale } as any, {
    skip: !slug,
  });

  const serviceId = useMemo(() => safeStr((service as any)?.id), [service]);

  const { data: images, isLoading: isImagesLoading } = useListServiceImagesPublicQuery(
    serviceId
      ? ({ serviceId, locale, default_locale: defaultLocale } as any)
      : ({ serviceId: '', locale, default_locale: defaultLocale } as any),
    { skip: !serviceId },
  );

  // ✅ Back link: /services list
  const backHref = useMemo(() => localizePath(locale as any, '/services'), [locale]);

  // ✅ Appointment route (in-page navigation)
  const appointmentHref = useMemo(() => localizePath(locale as any, '/appointment'), [locale]);

  const title = useMemo(() => {
    const t = String((service as any)?.name || (service as any)?.title || '').trim();
    return t || safeUiText(ui as any, 'ui_services_detail_title', 'Masaj Detayı');
  }, [service, ui]);

  const summary = useMemo(() => {
    const raw =
      (service as any)?.description ||
      (service as any)?.includes ||
      safeUiText(
        ui as any,
        'ui_services_placeholder_summary',
        'Bu masajın açıklaması yakında eklenecektir.',
      );
    return String(raw || '').trim();
  }, [service, ui]);

  const shortSummary = useMemo(() => excerpt(String(summary), 380), [summary]);

  const categoryLabel = useMemo(
    () => String((service as any)?.category_name || '').trim(),
    [service],
  );

  const gallery: ServiceImageDto[] = useMemo(() => {
    if (!Array.isArray(images)) return [];
    return images.filter((img) => (img as any)?.is_active);
  }, [images]);

  const lightboxImages = useMemo<LightboxImage[]>(() => {
    const out: LightboxImage[] = [];

    const add = (rawBase: string, alt?: string) => {
      const base = safeStr(rawBase);
      if (!base) return;

      const raw = toCdnSrc(base, 1600, 1200, 'fit') || base;
      const thumb = toCdnSrc(base, THUMB_W, THUMB_H, 'fill') || base;

      out.push({
        raw,
        thumb,
        alt: safeStr(alt) || title || 'image',
      });
    };

    const featured =
      safeStr((service as any)?.featured_image_url) ||
      safeStr((service as any)?.image_url) ||
      safeStr((service as any)?.featured_image);

    if (featured) add(featured, safeStr((service as any)?.image_alt));

    if (gallery.length) {
      gallery.forEach((img: any) => add(safeStr(img?.image_url), safeStr(img?.alt || img?.title)));
    }

    const uniq = new Set<string>();
    return out.filter((x) => {
      const k = safeStr(x.raw);
      if (!k) return false;
      if (uniq.has(k)) return false;
      uniq.add(k);
      return true;
    });
  }, [service, gallery, title]);

  useEffect(() => {
    const len = lightboxImages.length;
    if (!len) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex((prev) => {
      if (prev < 0) return 0;
      if (prev > len - 1) return len - 1;
      return prev;
    });
  }, [lightboxImages.length]);

  const safeActiveIdx = useMemo(() => {
    const len = lightboxImages.length;
    if (!len) return 0;
    const i = selectedIndex % len;
    return i < 0 ? i + len : i;
  }, [selectedIndex, lightboxImages.length]);

  const activeImage = lightboxImages[safeActiveIdx];

  const heroSrc = useMemo(() => {
    const raw = safeStr(activeImage?.raw);
    if (!raw) return '';
    return toCdnSrc(raw, HERO_W, HERO_H, 'fill') || raw;
  }, [activeImage?.raw]);

  const heroAlt = useMemo(
    () => safeStr(activeImage?.alt) || title || 'massage image',
    [activeImage?.alt, title],
  );

  const onThumbSelect = useCallback((idx: number) => {
    setSelectedIndex(idx);
  }, []);

  const onHeroOpenLightbox = useCallback(() => {
    if (!lightboxImages.length) return;
    setLightboxOpen(true);
  }, [lightboxImages.length]);

  const openLightboxAt = useCallback((idx: number) => {
    setSelectedIndex(idx);
    setLightboxOpen(true);
  }, []);

  const onLightboxIndexChange = useCallback((next: number) => {
    setSelectedIndex(next);
  }, []);

  // ============================================================
  // OTHER MASSAGES (DB) for sidebar
  // ============================================================
  const { data: otherServicesData } = useListServicesPublicQuery(
    {
      locale,
      default_locale: defaultLocale,
      limit: 12,
      offset: 0,
      sort: 'created_at',
      order: 'desc',
      orderDir: 'desc',
      is_active: 1,
    } as any,
    { skip: !safeStr(slug) },
  );

  const otherServices = useMemo(() => {
    const raw =
      (otherServicesData as any)?.items ??
      (otherServicesData as any)?.data ??
      (otherServicesData as any)?.rows ??
      otherServicesData ??
      [];

    const arr = Array.isArray(raw) ? raw : [];

    const currentSlug = safeStr(slug);
    const currentId = safeStr(serviceId);

    return arr
      .map((x: any) => ({
        id: safeStr(x?.id),
        slug: safeStr(x?.slug),
        name: safeStr(x?.name || x?.title),
      }))
      .filter((x) => x.slug && x.name)
      .filter((x) => x.slug !== currentSlug && x.id !== currentId)
      .slice(0, 8);
  }, [otherServicesData, slug, serviceId]);

  const otherServicesTitle = safeUiText(ui as any, 'ui_services_other_title', 'Diğer Masajlar', {
    maxLen: 40,
  });

  if (isLoading) {
    return (
      <div className="service__area pt-120 pb-90">
        <div className="container">
          <div className="row g-4">
            <div className="col-xl-8 col-lg-8">
              <div className="blog__content-wrapper">
                <SkeletonStack>
                  <SkeletonLine className="ens-skel--h32" />
                  <SkeletonLine className="mt-10 ens-skel--h18" />
                  <SkeletonLine className="mt-10 ens-skel--h18" />
                  <SkeletonLine className="mt-20 ens-skel--h260" />
                </SkeletonStack>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4">
              <div className="blog__content-wrapper">
                <SkeletonStack>
                  <SkeletonLine className="ens-skel--h160" />
                  <SkeletonLine className="mt-10 ens-skel--h90" />
                </SkeletonStack>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="service__area pt-120 pb-90">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="blog__content-wrapper text-center">
                <h2 className="section__title mb-15">
                  {safeUiText(ui as any, 'ui_services_not_found_title', 'Masaj bulunamadı')}
                </h2>
                <p className="mb-20">
                  {safeUiText(
                    ui as any,
                    'ui_services_not_found_desc',
                    'Aradığınız masaj bulunamadı veya yayından kaldırıldı.',
                    { maxLen: 180 },
                  )}
                </p>
                <Link href={backHref} className="tp-btn">
                  {safeUiText(ui as any, 'ui_services_back_to_list', 'Masaj çeşitlerine geri dön')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bookBtnText = safeUiText(
    ui as any,
    'ui_services_cta_request_quote',
    'Bu masaj için randevu al',
    { maxLen: 70 },
  );

  const moreInfoText = safeUiText(
    ui as any,
    'ui_services_cta_more_info',
    'Detaylı bilgi ve randevu için ekibimizle iletişime geçebilirsiniz.',
    { maxLen: 240 },
  );

  const galleryTitle = safeUiText(ui as any, 'ui_services_gallery_title', 'Galeri');

  return (
    <div className="service__area pt-120 pb-90">
      <div className="container">
        <div className="row g-4">
          {/* LEFT */}
          <div className="col-xl-8 col-lg-8">
            <div className="blog__content-wrapper">
              <div className="ens-service__back mb-25">
                <Link href={backHref} className="ens-service__backLink">
                  <span aria-hidden>←</span>
                  {safeUiText(ui as any, 'ui_services_back_to_list', 'Masaj çeşitlerine geri dön')}
                </Link>
              </div>

              <div className="ens-service__head mb-25">
                {categoryLabel ? (
                  <div className="ens-service__badges">
                    <span className="ens-service__tag ens-service__tag--muted">
                      {categoryLabel}
                    </span>
                  </div>
                ) : null}

                <h2 className="ens-service__title">{title}</h2>
              </div>

              {/* HERO + THUMBS */}
              <div className="ens-service__hero mb-30">
                <button
                  type="button"
                  className="ens-gallery__heroBtn"
                  onClick={onHeroOpenLightbox}
                  aria-label={safeUiText(ui as any, 'ui_services_gallery_open', 'Görseli büyüt')}
                  disabled={!lightboxImages.length}
                >
                  <div className="technical__thumb mb-20">
                    <Image src={heroSrc} alt={heroAlt} width={HERO_W} height={HERO_H} priority />
                  </div>
                </button>

                {lightboxImages.length > 1 && (
                  <div className="ens-gallery__thumbs" aria-label={galleryTitle}>
                    {lightboxImages.slice(0, 12).map((img, i) => {
                      const src = safeStr(img.thumb || img.raw);
                      if (!src) return null;

                      const isActive = i === safeActiveIdx;

                      return (
                        <button
                          key={`${img.raw}-${i}`}
                          type="button"
                          className={`ens-gallery__thumb ${isActive ? 'is-active' : ''}`}
                          onClick={() => onThumbSelect(i)}
                          onDoubleClick={() => openLightboxAt(i)}
                          aria-label={`${galleryTitle} ${i + 1}`}
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
              </div>

              {/* BODY */}
              <div className="postbox__text tp-postbox-details">
                <p className="postbox__lead">{shortSummary}</p>

                {/* Grid gallery */}
                {gallery.length > 0 ? (
                  <div className="ens-serviceGallery mt-40">
                    <div className="ens-serviceGallery__head">
                      <h4 className="ens-service__blockTitle mb-0">{galleryTitle}</h4>
                    </div>

                    <div className="ens-serviceGallery__grid">
                      {gallery.map((img: any, idx: number) => {
                        const base = safeStr(img?.image_url);
                        const thumb = (base && (toCdnSrc(base, 620, 420, 'fill') || base)) || '';

                        const cardTitle = safeStr(img?.title);
                        const cardCaption = safeStr(img?.caption);

                        return (
                          <button
                            type="button"
                            key={String(img?.id || idx)}
                            className="ens-serviceGallery__card"
                            onClick={() => openLightboxAt(idx)}
                            aria-label={`${galleryTitle} ${idx + 1}`}
                          >
                            <span className="ens-serviceGallery__img">
                              <Image
                                src={thumb}
                                alt={safeStr(img?.alt || cardTitle || title)}
                                width={620}
                                height={420}
                                className="img-fluid"
                                loading="lazy"
                              />
                            </span>

                            {cardTitle || cardCaption ? (
                              <span className="ens-serviceGallery__cap">
                                {cardTitle ? (
                                  <span className="ens-serviceGallery__capTitle">{cardTitle}</span>
                                ) : null}
                                {cardCaption ? (
                                  <span className="ens-serviceGallery__capText">{cardCaption}</span>
                                ) : null}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {isImagesLoading ? (
                      <div className="mt-10" aria-hidden>
                        <SkeletonStack>
                          <SkeletonLine className="ens-skel--h8" />
                        </SkeletonStack>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="col-xl-4 col-lg-4">
            <div className="sideber__widget">
              {/* Other massages */}
              <div className="sideber__widget-item mb-40">
                <div className="sidebar__category">
                  <div className="sidebar__contact-title mb-35">
                    <h3>{otherServicesTitle}</h3>
                  </div>

                  <ul>
                    {otherServices.length > 0 ? (
                      otherServices.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={localizePath(
                              locale as any,
                              `/services/${encodeURIComponent(s.slug)}`,
                            )}
                            aria-label={s.name}
                          >
                            {s.name}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li>
                        <span>-</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* CTA -> /appointment */}
              <div className="sideber__widget-item mb-40">
                <div className="blog__content-wrapper">
                  <Link
                    href={appointmentHref}
                    className="ens-service__quoteBtn"
                    aria-label={bookBtnText}
                  >
                    <span className="ens-service__quoteBtnIcon" aria-hidden>
                      +
                    </span>
                    <span className="ens-service__quoteBtnText">{bookBtnText}</span>
                  </Link>

                  <div className="postbox__text mt-15">
                    <p className="mb-0">{moreInfoText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox modal */}
      <ImageLightboxModal
        open={lightboxOpen}
        images={lightboxImages}
        index={safeActiveIdx}
        title={title}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={onLightboxIndexChange}
        showThumbs={true}
      />
    </div>
  );
};

export default ServiceDetail;
