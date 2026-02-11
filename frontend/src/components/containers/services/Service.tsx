'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// RTK
import { useListServicesPublicQuery } from '@/integrations/rtk/hooks';

// Helpers
import { excerpt } from '@/shared/text';
import { toCdnSrc } from '@/shared/media';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

// Icons
import {
  IconActivity,
  IconArrowRight,
  IconHeart,
  IconMoon,
  IconSmile,
  IconSun,
  IconZap,
} from '@/components/ui/icons';

const FALLBACK_IMG = 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp';

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function ServiceIcon({ label, size = 40 }: { label: string; size?: number }) {
  const t = (label || '').toLowerCase();
  
  if (/sport|sports|spor|athlet|athletik|deep\s*tissue|tiefen|tiefengewebe/.test(t))
    return <IconActivity size={size} />;
  if (/relax|relaxing|entspann|calm|ruhe|anti\s*stress|stress|stres/.test(t))
    return <IconMoon size={size} />;
  if (/thai|thaimassage|shiatsu|reflex|reflexzonen|fuß|fuss|foot|ayak/.test(t))
    return <IconZap size={size} />;
  if (/aroma|aromatherapy|aroma\s*therap|öl|oel|oil/.test(t)) return <IconHeart size={size} />;
  if (/hot\s*stone|stone|taş|tas|stein/.test(t)) return <IconSun size={size} />;
  if (/face|gesicht|yüz|yuz|beauty|kosmetik|cosmetic/.test(t)) return <IconSmile size={size} />;

  return <IconHeart size={size} />;
}

type ServiceCardVM = {
  id: string;
  title: string;
  summary: string;
  slug: string;
  src: string;
};

const Service: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);

  const { data, isLoading } = useListServicesPublicQuery({
    locale,
    limit: 12, // More items for the main page
    order: 'display_order.asc',
  } as any);

  const cards = useMemo<ServiceCardVM[]>(() => {
    const items = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];

    const mapped = items.map((s: any) => {
      const imgBase =
        safeStr(s?.featured_image_url) || safeStr(s?.image_url) || safeStr(s?.featured_image);

      const title = safeStr(s?.title) || safeStr(s?.name) || ui('ui_services_placeholder_title', 'Our service');

      const rawSummary = safeStr(s?.summary) || safeStr(s?.short_description) || safeStr(s?.description);

      const summary = rawSummary
        ? excerpt(rawSummary, 150)
        : ui('ui_services_placeholder_summary', 'Description coming soon.');

      let src = FALLBACK_IMG;
      if (imgBase) {
        src = toCdnSrc(imgBase, 640, 420, 'fill') || imgBase;
      }

      return {
        id: safeStr(s?.id) || safeStr(s?.slug) || Math.random().toString(36).slice(2),
        title,
        summary,
        slug: safeStr(s?.slug),
        src,
      };
    });

    if (!mapped.length && !isLoading) {
      return new Array(3).fill(0).map((_, i) => ({
        id: `ph-${i + 1}`,
        title: ui('ui_services_placeholder_title', 'Service'),
        summary: ui('ui_services_placeholder_summary', 'Coming soon.'),
        slug: '',
        src: FALLBACK_IMG,
      }));
    }

    return mapped;
  }, [data, ui, isLoading]);

  return (
    <div className="bg-bg-primary relative py-20 lg:py-32 min-h-screen">
       {/* Decor */}
      <div className="absolute top-0 right-0 w-1/4 h-full bg-sand-50/50 skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-sand-100 text-brand-dark text-xs font-bold uppercase tracking-widest mb-4">
                 {ui('ui_services_subprefix', 'Königs Massage')} {ui('ui_services_sublabel', 'Services')}
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-primary leading-tight mb-6">
              {ui('ui_services_title', 'Our Treatments')}
            </h2>
            <p className="text-text-secondary text-lg">
                Discover our range of professional massage therapies designed to help you relax, recover, and rejuvenate.
            </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-aos="fade-up">
            {isLoading && cards.length === 0 ? (
                 Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex w-full flex-col bg-white rounded-2xl border border-sand-200 overflow-hidden h-112.5">
                        <div className="h-56 bg-sand-100 animate-pulse" />
                        <div className="p-8 space-y-4">
                            <div className="h-6 bg-sand-100 rounded w-3/4 animate-pulse" />
                            <div className="h-4 bg-sand-100 rounded w-full animate-pulse" />
                            <div className="h-4 bg-sand-100 rounded w-5/6 animate-pulse" />
                        </div>
                    </div>
                 ))
            ) : (
                cards.map((it) => {
                    const href = it.slug
                    ? localizePath(locale, `/services/${encodeURIComponent(it.slug)}`)
                    : localizePath(locale, '/service');

                    return (
                    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-sand-200 hover:border-sand-300 flex flex-col" key={it.id}>
                        <div className="relative h-64 overflow-hidden bg-sand-100">
                             <Image 
                                src={it.src} 
                                alt={it.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full text-brand-primary shadow-sm z-20 transform transition-transform group-hover:scale-110">
                                <ServiceIcon label={it.title} size={24} />
                            </div>
                        </div>

                        <div className="p-8 flex flex-col flex-1">
                            <h3 className="text-2xl font-serif font-bold mb-3 text-brand-dark group-hover:text-brand-primary transition-colors">
                                <Link href={href} className="focus:outline-none">
                                    <span className="absolute inset-0 z-0" />
                                    {it.title}
                                </Link>
                            </h3>
                            <p className="text-text-secondary mb-6 line-clamp-3 leading-relaxed flex-1">
                                {it.summary}
                            </p>
                            
                            <div className="pt-4 border-t border-sand-100 flex justify-between items-center text-brand-dark group-hover:text-brand-primary transition-colors mt-auto">
                                <span className="text-sm font-bold uppercase tracking-wider">
                                    {ui('ui_services_btn_detail', 'Details')}
                                </span>
                                <IconArrowRight className="transform group-hover:translate-x-1 transition-transform" size={18} />
                            </div>
                        </div>
                    </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
};

export default Service;
