'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListServicesPublicQuery } from '@/integrations/rtk/hooks';
import type { ServiceDto } from '@/integrations/types';

import { useUiSection } from '@/i18n/uiDb';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { localizePath } from '@/i18n/url';

import { toCdnSrc } from '@/shared/media';
import { excerpt } from '@/shared/text';

import { IconArrowRight } from '@/components/ui/icons';

const FALLBACK_IMG = 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp';

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function cryptoRandomId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {}
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

export interface ServiceMoreProps {
  currentSlug?: string;
}

const ServiceMore: React.FC<ServiceMoreProps> = ({ currentSlug }) => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);

  const { data, isLoading } = useListServicesPublicQuery({
    limit: 6,
    order: 'display_order.asc,created_at.desc',
    locale,
  } as any);

  const items = useMemo<ServiceDto[]>(() => {
    const raw: ServiceDto[] = ((data as any)?.items ?? []) as any;

    const curr = safeStr(currentSlug);
    const filtered = raw.filter((s: any) => {
      const sSlug = safeStr(s?.slug);
      if (!sSlug) return true;
      if (!curr) return true;
      return sSlug !== curr;
    });

    return filtered.slice(0, 3);
  }, [data, currentSlug]);

  if (!items.length && !isLoading) return null;

  return (
    <section className="bg-sand-50 py-20 lg:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-white border border-sand-200 text-brand-dark text-xs font-bold uppercase tracking-widest mb-4">
                {ui('ui_services_more_subtitle', 'More Treatments')}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary leading-tight">
                {ui('ui_services_more_title', 'You may also like')}
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((s: any, idx: number) => {
            const id = safeStr(s?.id) || safeStr(s?.slug) || `more-${idx}-${cryptoRandomId()}`;

            const imgBase =
              safeStr(s?.featured_image_url) || safeStr(s?.image_url) || safeStr(s?.featured_image);

            let src = (imgBase && (toCdnSrc(imgBase, 640, 420, 'fill') || imgBase)) || '';
            if (!src) src = FALLBACK_IMG;

            const title =
              safeStr(s?.name || s?.title) || ui('ui_services_placeholder_title', 'Service');

            const summaryRaw = safeStr(s?.description) || safeStr(s?.includes) || safeStr(s?.short_description);
            const summary = summaryRaw
              ? excerpt(summaryRaw, 140)
              : ui('ui_services_placeholder_summary', 'Description coming soon.');

            const href = safeStr(s?.slug)
              ? localizePath(locale, `/services/${encodeURIComponent(safeStr(s.slug))}`)
              : localizePath(locale, '/services');

            return (
              <div 
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-sand-200 hover:border-sand-300 flex flex-col transform hover:-translate-y-1" 
                key={id}
              >
                <div className="relative h-56 overflow-hidden bg-sand-100">
                  <Image 
                    src={src} 
                    alt={title} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-xl font-serif font-bold mb-3 text-brand-dark group-hover:text-brand-primary transition-colors">
                    <Link href={href} className="focus:outline-none">
                        <span className="absolute inset-0 z-0" />
                        {title}
                    </Link>
                  </h3>
                  <p className="text-text-secondary mb-6 text-base leading-relaxed line-clamp-3">{summary}</p>
                </div>

                <div className="px-8 pb-8 mt-auto flex justify-between items-center border-t border-sand-100 pt-6">
                    <span className="text-sm font-bold uppercase tracking-wider text-brand-dark group-hover:text-brand-primary transition-colors">
                        {ui('ui_services_btn_detail', 'Details')}
                    </span>
                    <IconArrowRight className="text-brand-dark group-hover:text-brand-primary group-hover:translate-x-1 transition-transform" size={18} />
                </div>
              </div>
            );
          })}

          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-sand-200 overflow-hidden h-96">
                    <div className="h-56 bg-sand-100 animate-pulse" />
                    <div className="p-8 space-y-4">
                        <div className="h-6 bg-sand-100 rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-sand-100 rounded w-full animate-pulse" />
                        <div className="h-4 bg-sand-100 rounded w-5/6 animate-pulse" />
                    </div>
                </div>
             ))
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ServiceMore;
