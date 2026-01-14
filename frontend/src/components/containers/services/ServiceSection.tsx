// =============================================================
// FILE: src/components/containers/services/Service.tsx
// Public Services List (PATTERN: useLocaleShort + useUiSection)
// - Shows ONLY first 3 services
// - FIX: next/image src empty -> do NOT render empty src (use fallback)
// - Icons: Königs Massage (massage/wellness/spa) oriented
// - Equal card heights (no inline styles)
// =============================================================
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// RTK – public services
import { useListServicesPublicQuery } from '@/integrations/rtk/hooks';

// Helpers
import { excerpt } from '@/shared/text';
import { toCdnSrc } from '@/shared/media';

// i18n (PATTERN)
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

import { SkeletonLine, SkeletonStack } from '@/components/ui/skeleton';

// Icons (massage / wellness)
import { FiArrowRight, FiHeart, FiMoon, FiSun, FiZap, FiSmile, FiActivity } from 'react-icons/fi';

const SHOW_COUNT = 3;

// ✅ Replace later with your real path (public/...)
const FALLBACK_IMG =
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp';

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function isValidImageSrc(src: string): boolean {
  const s = safeStr(src);
  if (!s) return false;
  // allow absolute http(s) and site-root relative
  if (s.startsWith('http://') || s.startsWith('https://')) return true;
  if (s.startsWith('/')) return true;
  return false;
}

function ServiceIcon({ label, size = 40 }: { label: string; size?: number }) {
  const t = (label || '').toLowerCase();

  // Massage types / wellness mapping (TR/DE/EN common terms)
  if (/sport|sports|spor|athlet|athletik|deep\s*tissue|tiefen|tiefengewebe/.test(t))
    return <FiActivity size={size} />;

  if (/relax|relaxing|entspann|calm|ruhe|anti\s*stress|stress|stres/.test(t))
    return <FiMoon size={size} />;

  if (/thai|thaimassage|shiatsu|reflex|reflexzonen|fuß|fuss|foot|ayak/.test(t))
    return <FiZap size={size} />;

  if (/aroma|aromatherapy|aroma\s*therap|öl|oel|oil/.test(t)) return <FiHeart size={size} />;

  if (/hot\s*stone|stone|taş|tas|stein/.test(t)) return <FiSun size={size} />;

  if (/face|gesicht|yüz|yuz|beauty|kosmetik|cosmetic/.test(t)) return <FiSmile size={size} />;

  // default
  return <FiHeart size={size} />;
}

type ServiceCardVM = {
  id: string;
  title: string;
  summary: string;
  slug: string;
  src: string; // always non-empty, valid (fallback guarantees)
};

const ServiceSection: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);

  const { data, isLoading } = useListServicesPublicQuery({
    locale,
    limit: SHOW_COUNT,
    order: 'display_order.asc',
  } as any);

  const cards = useMemo<ServiceCardVM[]>(() => {
    const items = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];
    const list = items.slice(0, SHOW_COUNT);

    // If no data, still show placeholders with fallback image (never empty)
    if (!list.length) {
      return new Array(SHOW_COUNT).fill(0).map((_, i) => ({
        id: `ph-${i + 1}`,
        title: ui('ui_services_placeholder_title', 'Massage service'),
        summary: ui('ui_services_placeholder_summary', 'Service description is coming soon.'),
        slug: '',
        src: FALLBACK_IMG,
      }));
    }

    return list.map((s: any) => {
      const imgBase =
        safeStr(s?.featured_image_url) || safeStr(s?.image_url) || safeStr(s?.featured_image);

      const title =
        safeStr(s?.title) ||
        safeStr(s?.name) ||
        ui('ui_services_placeholder_title', 'Massage service');

      const rawSummary =
        safeStr(s?.summary) || safeStr(s?.short_description) || safeStr(s?.description);

      const summary = rawSummary
        ? excerpt(rawSummary, 150)
        : ui('ui_services_placeholder_summary', 'Service description is coming soon.');

      // ✅ Build image src safely
      let srcCandidate = '';
      if (imgBase) {
        srcCandidate = toCdnSrc(imgBase, 640, 420, 'fill') || imgBase;
      }

      const finalSrc = isValidImageSrc(srcCandidate) ? srcCandidate : FALLBACK_IMG;

      return {
        id: safeStr(s?.id) || safeStr(s?.slug) || cryptoRandomId(),
        title,
        summary,
        slug: safeStr(s?.slug),
        src: finalSrc,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ui]);

  return (
    <div className="service__area service__bg z-index-1 pt-120 pb-90">
      <div className="container">
        {/* Title */}
        <div className="row tik">
          <div className="col-12">
            <div className="section__title-wrapper text-center mb-65">
              <span className="section__subtitle">
                <span>{ui('ui_services_subprefix', 'Königs Massage')}</span>{' '}
                {ui('ui_services_sublabel', 'Services')}
              </span>

              <h2 className="section__title">
                {ui('ui_services_title', 'Our Services')}
                <span className="down__mark-middle" />
              </h2>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="row tik align-items-stretch" data-aos="fade-left" data-aos-delay="300">
          {cards.map((it) => {
            const href = it.slug
              ? localizePath(locale, `/services/${encodeURIComponent(it.slug)}`)
              : localizePath(locale, '/services');

            return (
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex" key={it.id}>
                <div className="service__item ens-serviceCard mb-30 w-100">
                  <div className="service__thumb include__bg service-two-cmn" aria-hidden="true">
                    {/* ✅ Never render empty src (final src always fallback or valid) */}
                    <Image src={it.src} alt={it.title} width={640} height={420} loading="lazy" />
                  </div>

                  <div className="service__icon transition-3" aria-hidden="true">
                    <ServiceIcon label={it.title} />
                  </div>

                  <div className="service__content ens-serviceCard__content">
                    <h3>
                      <Link href={href}>{it.title}</Link>
                    </h3>
                    <p>{it.summary}</p>
                  </div>

                  <div className="service__link ens-serviceCard__link">
                    <Link
                      href={href}
                      aria-label={`${it.title} — ${ui(
                        'ui_services_details_aria',
                        'view service details',
                      )}`}
                    >
                      <FiArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading ? (
            <div className="col-12 mt-10" aria-hidden>
              <SkeletonStack>
                <SkeletonLine style={{ height: 8 }} />
              </SkeletonStack>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ServiceSection;

function cryptoRandomId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {}
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}
