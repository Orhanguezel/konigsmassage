'use client';

import React, { Fragment, useMemo, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Header from '../layout/header/Header';
import FooterTwo from '../layout/footer/Footer';
import ScrollProgress from '../layout/ScrollProgress';

import AnalyticsScripts from '../features/analytics/AnalyticsScripts';
import GAViewPages from '../features/analytics/GAViewPages';
import CookieConsentBanner from '../layout/banner/CookieConsentBanner';
import SitePopups from '../layout/banner/SitePopups';
import SupportBotWidget from '../components/containers/chat/SupportBotWidget';
import PwaRegistration from '../components/system/PwaRegistration';
import { resetLayoutSeo } from '../seo';


export default function ClientLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  // Keep layout light: Header already fetches dynamic brand/settings on its own.
  const brand = useMemo(() => ({ name: 'Energetische Massage' }), []);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
     // Reset SEO store on route change
     resetLayoutSeo();
  }, [pathname, searchParams]);

  // Sync <html lang="..."> with current locale
  useEffect(() => {
    if (locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // Global scroll reveal observer for all pages
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' },
    );

    const scan = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el));
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);

  return (
    <Fragment>
      <PwaRegistration />
      <AnalyticsScripts />
      <GAViewPages />
      
      <Header brand={brand} locale={locale} />
      <SitePopups />
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
