'use client';

import React from 'react';
import Hero from '@/layout/banner/Hero';
import About from '@/components/containers/about/AboutSection';
import ServiceSection from '@/components/containers/services/ServiceSection';
import BlogHomeSection from '@/components/containers/blog/BlogHomeSection';
import Feedback from '@/components/containers/feedback/Feedback';
import AppointmentHomeCta from '@/components/containers/appointment/AppointmentHomeCta';

type Props = {
  locale?: string;
};

export default function HomeContent({ locale }: Props) {
  return (
    <main className="flex flex-col w-full">
      <Hero locale={locale} />
      <About locale={locale} />
      <ServiceSection locale={locale} />
      <BlogHomeSection locale={locale} />
      <Feedback locale={locale} />

      <section className="w-full bg-brand-light py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <AppointmentHomeCta locale={locale} />
        </div>
      </section>
    </main>
  );
}
