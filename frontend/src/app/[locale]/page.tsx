import type { Metadata } from 'next';
import React from 'react';
import Hero from '@/layout/banner/Hero';
import About from '@/components/containers/about/AboutSection';
import ServiceSection from '@/components/containers/services/ServiceSection';
import BlogHomeSection from '@/components/containers/blog/BlogHomeSection';
import Feedback from '@/components/containers/feedback/Feedback';
import AppointmentHomeCta from '@/components/containers/appointment/AppointmentHomeCta';

import { absUrlJoin, buildMetadataFromSeo, fetchSeoObject, normPath } from '@/seo/server';
import { fetchUiSectionObject, readUiText } from '@/seo/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const [seo, ui] = await Promise.all([fetchSeoObject(locale), fetchUiSectionObject('ui_home', locale)]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname: normPath('/') });

  const pageTitle =
    readUiText(ui, 'ui_home_meta_title') || readUiText(ui, 'ui_home_page_title', 'Home');
  const pageDescription =
    readUiText(ui, 'ui_home_meta_description') || readUiText(ui, 'ui_home_page_description', '');

  const ogRaw = readUiText(ui, 'ui_home_og_image', '');
  const baseUrl = base.metadataBase?.toString() || '';
  const ogAbs = ogRaw ? absUrlJoin(baseUrl, ogRaw) : '';

  return {
    ...base,
    title: pageTitle,
    ...(pageDescription ? { description: pageDescription } : {}),
    openGraph: {
      ...(base.openGraph || {}),
      title: pageTitle,
      ...(pageDescription ? { description: pageDescription } : {}),
      ...(ogAbs ? { images: [{ url: ogAbs }] } : {}),
    },
    twitter: {
      ...(base.twitter || {}),
      ...(ogAbs ? { images: [ogAbs] } : {}),
    },
  };
}

export default function HomePage() {
  return (
    <main className="flex flex-col w-full">
      <Hero />
      <About />
      <ServiceSection />
      <BlogHomeSection />
      <Feedback />

      <section className="w-full bg-brand-light py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <AppointmentHomeCta />
        </div>
      </section>
    </main>
  );
}
