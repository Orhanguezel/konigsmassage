'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useListServicesPublicQuery } from '@/integrations/rtk/hooks';
import { excerpt } from '@/shared/text';
import { toCdnSrc } from '@/shared/media';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';
import {
  IconActivity,
  IconArrowRight,
  IconHeart,
  IconMoon,
  IconSmile,
  IconSun,
  IconZap,
} from '@/components/ui/icons';

const SHOW_COUNT = 3;
const FALLBACK_IMG = 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp';

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function isValidImageSrc(src: string): boolean {
  const s = safeStr(src);
  if (!s) return false;
  if (s.startsWith('http://') || s.startsWith('https://')) return true;
  if (s.startsWith('/')) return true;
  return false;
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

    if (!list.length) {
      if (isLoading) {
         // Return empty if loading, managed by skeleton below
         return [];
      }
      return new Array(SHOW_COUNT).fill(0).map((_, i) => ({
        id: `ph-${i + 1}`,
        title: ui('ui_services_placeholder_title', 'Massage Service'),
        summary: ui('ui_services_placeholder_summary', 'Coming soon.'),
        slug: '',
        src: FALLBACK_IMG,
      }));
    }

    return list.map((s: any, idx) => {
      const imgBase = safeStr(s?.featured_image_url) || safeStr(s?.image_url) || safeStr(s?.featured_image);
      const title = safeStr(s?.title) || safeStr(s?.name) || ui('ui_services_placeholder_title', 'Service');
      const rawSummary = safeStr(s?.summary) || safeStr(s?.short_description) || safeStr(s?.description);
      const summary = rawSummary ? excerpt(rawSummary, 150) : ui('ui_services_placeholder_summary', 'Description coming soon.');

      let srcCandidate = '';
      if (imgBase) {
        srcCandidate = toCdnSrc(imgBase, 640, 420, 'fill') || imgBase;
      }
      const finalSrc = isValidImageSrc(srcCandidate) ? srcCandidate : FALLBACK_IMG;

      return {
        id: safeStr(s?.id) || `s-${idx}`,
        title,
        summary,
        slug: safeStr(s?.slug),
        src: finalSrc,
      };
    });
  }, [data, ui, isLoading]);

  return (
    <section className="bg-bg-primary relative py-20 lg:py-32">
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sand-200 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="mb-16 text-center" data-aos="fade-up">
            <span className="inline-block py-1 px-3 rounded-full bg-sand-100 text-brand-dark text-xs font-bold uppercase tracking-widest mb-4">
                 {ui('ui_services_subprefix', 'Königs Massage')} {ui('ui_services_sublabel', 'Services')}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-text-primary leading-tight">
                {ui('ui_services_title', 'Our Services')}
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-aos="fade-up" data-aos-delay="200">
            {isLoading && cards.length === 0 ? (
                // Skeleton
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex w-full flex-col bg-white rounded-2xl border border-sand-200 overflow-hidden h-[500px]">
                        <div className="h-64 bg-sand-100 animate-pulse" />
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
                    : localizePath(locale, '/services');

                    return (
                    <div className="flex w-full group" key={it.id}>
                        <div className="bg-white hover:bg-sand-50 rounded-2xl border border-sand-200 hover:border-sand-300 w-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                            <div className="relative h-64 overflow-hidden bg-sand-100">
                                <Image 
                                    src={it.src} 
                                    alt={it.title} 
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy" 
                                />
                                <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-brand-primary shadow-sm z-10">
                                    <ServiceIcon label={it.title} size={22} />
                                </div>
                            </div>
                            
                            <div className="p-8 flex flex-col flex-1">
                                <h3 className="text-2xl font-serif font-bold text-brand-dark mb-3 group-hover:text-brand-primary transition-colors">
                                    <Link href={href} className="focus:outline-none">
                                        <span className="absolute inset-0 z-0" aria-hidden="true" />
                                        {it.title}
                                    </Link>
                                </h3>
                                <p className="text-text-secondary mb-6 line-clamp-3 leading-relaxed flex-1">
                                    {it.summary}
                                </p>
                                
                                <div className="pt-6 border-t border-sand-100 flex items-center justify-between text-brand-dark group-hover:text-brand-primary transition-colors">
                                    <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        {ui('ui_services_btn_detail', 'Discover')}
                                    </span>
                                    <IconArrowRight className="transform group-hover:translate-x-1 transition-transform" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })
            )}
        </div>
      </div>
    </section>
  );
};

export default ServiceSection;
