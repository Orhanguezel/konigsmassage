'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useListServicesPublicQuery } from '@/integrations/rtk/hooks';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

import {
  safeStr,
  SERVICE_FALLBACK_IMG,
  toCdnSrc,
  isValidImageSrc,
  excerpt,
} from '@/integrations/shared';

import { ServiceIcon } from '@/components/common/ServiceIcon';
import { IconArrowRight } from '@/components/ui/icons';

const ServiceSection: React.FC<{ locale?: string }> = ({ locale: explicitLocale }) => {
  const locale = useLocaleShort(explicitLocale);
  const { ui } = useUiSection('ui_services', locale as any);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useListServicesPublicQuery({
    locale,
    limit: 1,
    order: 'display_order.asc',
  } as any, { skip: !mounted });

  const service = useMemo(() => {
    const items = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];
    const s = items[0];

    if (!s) {
      if (isLoading) return null;
      return {
        id: 'ph-1',
        title: ui('ui_services_placeholder_title', 'Massage Service'),
        summary: ui('ui_services_placeholder_summary', 'Coming soon.'),
        slug: '',
        src: SERVICE_FALLBACK_IMG,
      };
    }

    const imgBase = safeStr(s?.featured_image_url) || safeStr(s?.image_url) || safeStr(s?.featured_image);
    const title = safeStr(s?.title) || safeStr(s?.name) || ui('ui_services_placeholder_title', 'Service');
    const rawSummary = safeStr(s?.summary) || safeStr(s?.short_description) || safeStr(s?.description);
    const summary = rawSummary ? excerpt(rawSummary, 200) : ui('ui_services_placeholder_summary', 'Description coming soon.');

    let srcCandidate = '';
    if (imgBase) {
      srcCandidate = toCdnSrc(imgBase, 800, 600, 'fill') || imgBase;
    }
    const finalSrc = isValidImageSrc(srcCandidate) ? srcCandidate : SERVICE_FALLBACK_IMG;

    return {
      id: safeStr(s?.id) || 's-1',
      title,
      summary,
      slug: safeStr(s?.slug),
      src: finalSrc,
    };
  }, [data, ui, isLoading]);

  const href = service?.slug
    ? localizePath(locale, `/services/${encodeURIComponent(service.slug)}`)
    : localizePath(locale, '/services');

  return (
    <section className="bg-bg-primary relative py-20 lg:py-32">
      {/* Decor */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-sand-200 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="mb-16 text-center" data-aos="fade-up">
          <span className="inline-block py-1 px-3 rounded-full bg-sand-100 text-brand-dark text-xs font-bold uppercase tracking-widest mb-4">
            {ui('ui_services_subprefix', 'Königs Massage')} {ui('ui_services_sublabel', 'Services')}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-text-primary leading-tight">
            {ui('ui_services_title', 'Our Services')}
          </h2>
        </div>

        {(!mounted || (isLoading && !service)) ? (
          // Skeleton
          <div className="bg-white rounded-3xl border border-sand-200 overflow-hidden" data-aos="fade-up" data-aos-delay="200">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="h-80 lg:h-[500px] bg-sand-100 animate-pulse" />
              <div className="p-10 lg:p-16 space-y-6">
                <div className="h-10 bg-sand-100 rounded w-3/4 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 bg-sand-100 rounded w-full animate-pulse" />
                  <div className="h-4 bg-sand-100 rounded w-full animate-pulse" />
                  <div className="h-4 bg-sand-100 rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-sand-100 rounded w-4/5 animate-pulse" />
                </div>
                <div className="h-14 bg-sand-100 rounded-full w-48 animate-pulse" />
              </div>
            </div>
          </div>
        ) : service ? (
          <div
            className="group bg-white hover:bg-sand-50 rounded-3xl border border-sand-200 hover:border-sand-300 overflow-hidden transition-all duration-300 hover:shadow-xl"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image */}
              <div className="relative h-80 lg:h-[500px] overflow-hidden bg-sand-100">
                <Image
                  src={service.src}
                  alt={service.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute top-6 left-6 w-14 h-14 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-brand-primary shadow-md z-10">
                  <ServiceIcon label={service.title} size={28} />
                </div>
              </div>

              {/* Content */}
              <div className="p-10 lg:p-16 flex flex-col justify-center">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-brand-dark mb-6 group-hover:text-brand-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-text-secondary text-lg leading-relaxed mb-8">
                  {service.summary}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={href}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary hover:bg-brand-dark text-white font-bold uppercase tracking-wider rounded-full transition-all duration-300 hover:shadow-lg group/btn"
                  >
                    {ui('ui_services_btn_detail', 'Discover')}
                    <IconArrowRight className="transform group-hover/btn:translate-x-1 transition-transform" size={20} />
                  </Link>
                  <Link
                    href={localizePath(locale, '/appointment')}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-transparent border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-bold uppercase tracking-wider rounded-full transition-all duration-300"
                  >
                    {ui('ui_services_btn_book', 'Book Now')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ServiceSection;
