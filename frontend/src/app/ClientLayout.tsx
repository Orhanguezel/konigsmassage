'use client';

import React, { Fragment, useMemo, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Header from '@/layout/header/Header';
import FooterTwo from '@/layout/footer/Footer';
import ScrollProgress from '@/layout/ScrollProgress';

import AnalyticsScripts from '@/features/analytics/AnalyticsScripts';
import GAViewPages from '@/features/analytics/GAViewPages';
import CookieConsentBanner from '@/layout/banner/CookieConsentBanner';
import SupportBotWidget from '@/components/containers/chat/SupportBotWidget';
import { resetLayoutSeo } from '@/seo';

export default function ClientLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  // Keep layout light: Header already fetches dynamic brand/settings on its own.
  const brand = useMemo(() => ({ name: 'KÖNIG ENERGETIK' }), []);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
     // Reset SEO store on route change
     resetLayoutSeo();
  }, [pathname, searchParams]);

  return (
    <Fragment>
      <AnalyticsScripts />
      <GAViewPages />
      
      <Header brand={brand} locale={locale} />
      <main className="min-h-screen bg-bg-primary">
        {children}
      </main>
      <FooterTwo locale={locale} />
      <ScrollProgress />

      <CookieConsentBanner />
      <SupportBotWidget />
    </Fragment>
  );
}
