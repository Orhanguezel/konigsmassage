'use client';

import React, { Fragment, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Header from '@/layout/header/Header';
import FooterTwo from '@/layout/footer/Footer';
import ScrollProgress from '@/layout/ScrollProgress';

import AnalyticsScripts from '@/features/analytics/AnalyticsScripts';
import GAViewPages from '@/features/analytics/GAViewPages';
import CookieConsentBanner from '@/layout/banner/CookieConsentBanner';
import SupportBotWidget from '@/components/containers/chat/SupportBotWidget';
import { resetLayoutSeo } from '@/seo';

const SITE_LINKS: Record<string, { href: string; labels: Record<string, string> }[]> = {
  main: [
    { href: '/', labels: { de: 'Startseite', tr: 'Ana Sayfa', en: 'Home' } },
    { href: '/about', labels: { de: 'Über mich', tr: 'Hakkımda', en: 'About' } },
    { href: '/services', labels: { de: 'Leistungen', tr: 'Hizmetler', en: 'Services' } },
    { href: '/blog', labels: { de: 'Blog', tr: 'Blog', en: 'Blog' } },
    { href: '/contact', labels: { de: 'Kontakt', tr: 'İletişim', en: 'Contact' } },
    { href: '/appointment', labels: { de: 'Termin buchen', tr: 'Randevu Al', en: 'Book Appointment' } },
    { href: '/faqs', labels: { de: 'FAQ', tr: 'SSS', en: 'FAQ' } },
  ],
};

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

  // Sync <html lang="..."> with current locale
  useEffect(() => {
    if (locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <Fragment>
      <AnalyticsScripts />
      <GAViewPages />
      
      <Header brand={brand} locale={locale} />
      <main className="min-h-screen bg-bg-primary">
        {children}
      </main>
      {/* SEO: Static internal links — always SSR-rendered, independent of API */}
      <nav aria-label="Site Navigation" className="bg-sand-50 border-t border-sand-200">
        <div className="container mx-auto px-4 py-6">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {SITE_LINKS.main.map((link) => {
              const loc = locale || 'de';
              const label = link.labels[loc] || link.labels.de;
              const href = link.href === '/' ? `/${loc}` : `/${loc}${link.href}`;
              return (
                <li key={link.href}>
                  <Link
                    href={href}
                    className="text-text-secondary hover:text-brand-primary transition-colors font-medium"
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <FooterTwo locale={locale} />
      <ScrollProgress />

      <CookieConsentBanner />
      <SupportBotWidget />
    </Fragment>
  );
}
