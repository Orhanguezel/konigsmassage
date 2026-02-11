'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  useGetServiceBySlugPublicQuery,
  useListServiceImagesPublicQuery,
  useGetSiteSettingByKeyQuery,
} from '@/integrations/rtk/hooks';

import { toCdnSrc } from '@/shared/media';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

import ImageLightboxModal from '@/components/common/public/ImageLightboxModal';
import OtherServicesSidebar from '@/components/containers/services/OtherServicesSidebar';

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

export default function ServiceDetail() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);

  const params = useParams<{ slug?: string | string[] }>();
  const slug = useMemo(() => {
    const v = params?.slug;
    return Array.isArray(v) ? safeStr(v[0]) : safeStr(v);
  }, [params]);

  const servicesHref = useMemo(() => localizePath(locale, '/services'), [locale]);
  const appointmentHref = useMemo(() => {
    const base = localizePath(locale, '/appointment');
    if (!slug) return base;
    return `${base}?service=${encodeURIComponent(slug)}`;
  }, [locale, slug]);

  const { data: defaultLocaleRow } = useGetSiteSettingByKeyQuery({ key: 'default_locale' } as any);
  const defaultLocale = safeStr((defaultLocaleRow as any)?.value) || 'de';

  const { data: service, isLoading } = useGetServiceBySlugPublicQuery(
    { slug, locale, default_locale: defaultLocale } as any,
    { skip: !slug },
  );

  const serviceId = safeStr((service as any)?.id);

  const { data: images } = useListServiceImagesPublicQuery(
    { serviceId, locale, default_locale: defaultLocale } as any,
    { skip: !serviceId },
  );

  const title = safeStr((service as any)?.name);

  const hero = useMemo(() => {
    const featured =
      safeStr((service as any)?.featured_image_url) ||
      safeStr((service as any)?.image_url) ||
      safeStr((service as any)?.featured_image);

    if (featured) return featured;

    const first = images?.[0]?.image_url;
    return safeStr(first);
  }, [service, images]);

  const gallery = useMemo(() => {
    const arr = [];

    if (hero) arr.push(hero);

    (images || []).forEach((i: any) => {
      if (i?.image_url) arr.push(i.image_url);
    });

    return Array.from(new Set(arr));
  }, [hero, images]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  const heroSrc = gallery[idx] || hero;

  if (!slug || isLoading) {
    return <div className="py-20 text-center">Loading...</div>;
  }

  if (!service) {
    return <div className="py-20 text-center">Not found</div>;
  }

  const details = [
    { label: ui('ui_services_duration_label', 'Duration'), value: safeStr((service as any)?.duration) },
    { label: ui('ui_services_area_label', 'Area'), value: safeStr((service as any)?.area) },
    { label: ui('ui_services_season_label', 'Season'), value: safeStr((service as any)?.season) },
    { label: ui('ui_services_equipment_label', 'Equipment'), value: safeStr((service as any)?.equipment) },
  ].filter((x) => x.value);

  return (
    <>
      <section className="bg-bg-primary py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* SIDEBAR (LEFT) */}
            <div className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-24 space-y-8">
                <OtherServicesSidebar currentSlug={slug} />

                <div className="bg-bg-secondary p-6 rounded-xl shadow-soft border border-border-light">
                  <h3 className="text-xl font-serif font-bold mb-6 border-b border-border-light pb-2">
                    {ui('ui_services_sidebar_info_title', 'Service details')}
                  </h3>

                  {details.length ? (
                    <dl className="space-y-4 text-sm">
                      {details.map((d) => (
                        <div key={d.label} className="flex items-start justify-between gap-4">
                          <dt className="text-text-muted font-semibold">{d.label}</dt>
                          <dd className="text-text-primary font-medium text-right">{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-text-muted">
                      {ui('ui_services_details_empty', 'No details yet.')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* MAIN */}
            <div className="lg:col-span-8 order-1 lg:order-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <Link
                  href={servicesHref}
                  className="inline-flex text-sm font-bold uppercase tracking-wide text-text-muted hover:text-brand-primary"
                >
                  ← {ui('ui_services_back_to_list', 'Back')}
                </Link>

                <Link
                  href={appointmentHref}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-brand-primary text-white text-sm font-bold uppercase tracking-wide hover:bg-brand-hover transition-colors"
                >
                  {ui('ui_services_cta_request_quote', 'Book appointment')}
                </Link>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-6">
                {title}
              </h1>

              {/* HERO BLOG STYLE */}
              {heroSrc && (
                <div className="mb-8 rounded-xl overflow-hidden shadow-medium bg-sand-100">
                  <div
                    className="aspect-video relative cursor-pointer"
                    onClick={() => setOpen(true)}
                  >
                    <Image
                      src={toCdnSrc(heroSrc, 1600, 900, 'fit') || heroSrc}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {/* THUMBS BLOG STYLE */}
              {gallery.length > 1 && (
                <div className="flex gap-2 mb-8">
                  {gallery.map((g, i) => (
                    <button
                      key={g}
                      onClick={() => {
                        setIdx(i);
                        setOpen(true);
                      }}
                      className={`w-24 h-16 relative rounded-md overflow-hidden border ${
                        i === idx ? 'border-brand-primary' : 'border-transparent opacity-70'
                      }`}
                    >
                      <Image src={g} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* CONTENT BLOG STYLE */}
              <div className="bg-bg-secondary p-8 md:p-10 rounded-xl shadow-soft border border-border-light">
                <div className="prose prose-lg max-w-none">
                  <p>{safeStr((service as any)?.description)}</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      <ImageLightboxModal
        open={open}
        onClose={() => setOpen(false)}
        images={gallery.map((g) => ({ raw: g, thumb: g }))}
        index={idx}
        onIndexChange={setIdx}
        title={title}
      />
    </>
  );
}
