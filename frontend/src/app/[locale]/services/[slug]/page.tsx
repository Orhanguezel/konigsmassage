// =============================================================
// FILE: src/app/[locale]/services/[slug]/page.tsx
// FINAL — Service Detail Page (BlogDetailsPage pattern)
// - ONLY Banner + ServiceDetail
// - Next.js 16 sync-dynamic-apis safe (params can be Promise)
// =============================================================

import React from 'react';
import type { Metadata } from 'next';
import Banner from '@/layout/banner/Breadcrum';
import ServiceDetail from '@/components/containers/services/ServiceDetail';
import { safeStr, titleFromSlug } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject, absUrlJoin, normPath } from '@/seo/server';
import { fetchServicePublicBySlug } from '@/seo/server';
import { excerpt } from '@/shared/text';

type PageProps = {
  params: Promise<{ locale: string; slug: string }> | { locale: string; slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = (await params) as { locale: string; slug: string };
  const locale = safeStr(p?.locale) || 'de';
  const slug = safeStr(p?.slug);

  const pathname = normPath(`/services/${slug || ''}`);

  const [seo, service] = await Promise.all([
    fetchSeoObject(locale),
    slug ? fetchServicePublicBySlug({ slug, locale }) : Promise.resolve(null),
  ]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname });

  const pageTitle =
    safeStr(service?.meta_title) || safeStr(service?.name) || titleFromSlug(slug, 'Service Detail');

  const rawDesc = safeStr(service?.meta_description) || safeStr(service?.description) || '';
  const pageDescription = rawDesc ? excerpt(rawDesc, 180) : '';

  const imageRaw =
    safeStr((service as any)?.featured_image_url) ||
    safeStr(service?.image_url) ||
    safeStr(service?.featured_image);

  const baseUrl = base.metadataBase?.toString() || '';
  const imageAbs = imageRaw ? absUrlJoin(baseUrl, imageRaw) : '';

  return {
    ...base,
    title: pageTitle,
    ...(pageDescription ? { description: pageDescription } : {}),
    openGraph: {
      ...(base.openGraph || {}),
      title: pageTitle,
      ...(pageDescription ? { description: pageDescription } : {}),
      ...(imageAbs ? { images: [{ url: imageAbs }] } : {}),
    },
    twitter: {
      ...(base.twitter || {}),
      ...(imageAbs ? { images: [imageAbs] } : {}),
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const p = (await params) as { locale: string; slug: string };
  const slug = safeStr(p?.slug);

  return (
    <>
      <Banner title={titleFromSlug(slug, 'Service Detail')} />
      <ServiceDetail />
    </>
  );
}
