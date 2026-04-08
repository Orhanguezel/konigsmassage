'use client';

import React from 'react';
import Hero from '@/layout/banner/Hero';
import About from '@/components/containers/about/AboutSection';
import ServiceSection from '@/components/containers/services/ServiceSection';
import BlogHomeSection from '@/components/containers/blog/BlogHomeSection';
import Feedback from '@/components/containers/feedback/Feedback';
import AppointmentHomeCta from '@/components/containers/appointment/AppointmentHomeCta';
import GutscheinHomeCta from '@/components/containers/gutschein/GutscheinHomeCta';
import HomeIntroSection from '@/components/containers/home/HomeIntroSection';

type Props = { locale?: string };

export default function HomeContent({ locale }: Props) {
  return (
    <main className="flex flex-col w-full">
      <Hero locale={locale} />
      <About locale={locale} />
      <ServiceSection locale={locale} />
      <HomeIntroSection locale={locale} />
      <Feedback locale={locale} />
      <BlogHomeSection locale={locale} />

      <section className="py-28 lg:py-36" style={{ padding: '7rem 4%' }}>
        <GutscheinHomeCta locale={locale} />
      </section>

      <AppointmentHomeCta locale={locale} />
    </main>
  );
}
