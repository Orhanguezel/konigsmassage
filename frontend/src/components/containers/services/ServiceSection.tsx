// =============================================================
// FILE: src/components/containers/services/Service.tsx
// Public Services List (PATTERN: useLocaleShort + useUiSection)
// - Shows ONLY first 3 services
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

// Icons
import {
  FiTool,
  FiLayers,
  FiPackage,
  FiRefreshCcw,
  FiSettings,
  FiTarget,
  FiUserPlus,
  FiFileText,
  FiShoppingCart,
  FiArrowRight,
} from 'react-icons/fi';
import { MdAdsClick } from 'react-icons/md';
import { GiFactory } from 'react-icons/gi';

const SHOW_COUNT = 3;

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function ServiceIcon({ label, size = 40 }: { label: string; size?: number }) {
  const t = (label || '').toLowerCase();
  if (/\bppc|\bads?|\breklam|\badvert/i.test(t)) return <MdAdsClick size={size} />;
  if (/performans|content|içerik|contenido/i.test(t)) return <FiFileText size={size} />;
  if (/lead|müşteri|cliente|prospect/i.test(t)) return <FiUserPlus size={size} />;
  if (/strateji|planlam|strategy|estrateg/i.test(t)) return <FiTarget size={size} />;
  if (/ürün|product|producto|danışman/i.test(t)) return <FiShoppingCart size={size} />;
  if (/mühendis|engineer|soporte|support/i.test(t)) return <FiTool size={size} />;
  if (/uygulama|referans|aplicac|reference/i.test(t)) return <FiLayers size={size} />;
  if (/parça|parca|repuesto|component|komponent/i.test(t)) return <FiPackage size={size} />;
  if (/modern|upgrade|moderniz/i.test(t)) return <FiRefreshCcw size={size} />;
  if (/bakım|onarım|mantenimiento|repar|maintenance|repair/i.test(t))
    return <FiSettings size={size} />;
  if (/üretim|uretim|producción|production|manufact/i.test(t)) return <GiFactory size={size} />;
  return <FiLayers size={size} />;
}

type ServiceCardVM = {
  id: string;
  title: string;
  summary: string;
  slug: string;
  src: string;
};

const ServiceSection: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);

  // ✅ only 3 items fetched
  const { data, isLoading } = useListServicesPublicQuery({
    locale,
    limit: SHOW_COUNT,
    order: 'display_order.asc',
  } as any);

  const cards = useMemo<ServiceCardVM[]>(() => {
    const items = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];

    const mapped = items.slice(0, SHOW_COUNT).map((s: any) => {
      const imgBase =
        safeStr(s?.featured_image_url) || safeStr(s?.image_url) || safeStr(s?.featured_image);

      const title = safeStr(s?.name) || ui('ui_services_placeholder_title', 'Our service');

      const rawSummary = safeStr(s?.description) || safeStr(s?.includes);
      const summary = rawSummary
        ? excerpt(rawSummary, 150)
        : ui('ui_services_placeholder_summary', 'Service description is coming soon.');

      const src = (imgBase && (toCdnSrc(imgBase, 640, 420, 'fill') || imgBase)) || '';

      return {
        id: safeStr(s?.id) || safeStr(s?.slug) || cryptoRandomId(),
        title,
        summary,
        slug: safeStr(s?.slug),
        src,
      };
    });

    if (!mapped.length) {
      return new Array(SHOW_COUNT).fill(0).map((_, i) => ({
        id: `ph-${i + 1}`,
        title: ui('ui_services_placeholder_title', 'Our service'),
        summary: ui('ui_services_placeholder_summary', 'Service description is coming soon.'),
        slug: '',
        src: '',
      }));
    }

    return mapped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ui]);

  return (
    <div className="service__area service__bg z-index-1 pt-120 pb-90">
      <div className="container">
        {/* Başlık */}
        <div className="row tik">
          <div className="col-12">
            <div className="section__title-wrapper text-center mb-65">
              <span className="section__subtitle">
                <span>{ui('ui_services_subprefix', 'konigsmassage')}</span>{' '}
                {ui('ui_services_sublabel', 'Services')}
              </span>

              <h2 className="section__title">
                {ui('ui_services_title', 'What we do')}
                <span className="down__mark-middle" />
              </h2>
            </div>
          </div>
        </div>

        {/* Kartlar */}
        <div className="row tik align-items-stretch" data-aos="fade-left" data-aos-delay="300">
          {cards.map((it) => {
            const href = it.slug
              ? localizePath(locale, `/services/${encodeURIComponent(it.slug)}`)
              : localizePath(locale, '/services');

            return (
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex" key={it.id}>
                <div className="service__item ens-serviceCard mb-30 w-100">
                  <div className="service__thumb include__bg service-two-cmn" aria-hidden="true">
                    <Image src={it.src} alt="" width={640} height={420} loading="lazy" />
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
