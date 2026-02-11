// src/components/containers/banner/Banner.tsx
'use client';

import React from 'react';
import Link from 'next/link';

// Yeni i18n helper’lar
import { useResolvedLocale } from '@/i18n/locale';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

type Props = { title: string };

const Banner: React.FC<Props> = ({ title }) => {
  const locale = useResolvedLocale();
  const { ui } = useUiSection('ui_banner', locale);

  const homeHref = localizePath(locale, '/');

  return (
    <section data-header-overlay="true" className="bg-bg-dark relative py-20 md:py-32 overflow-hidden">
      {/* Background pattern/overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/35 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center" data-aos="fade-up">
          <h1 className="text-3xl md:text-5xl font-bold text-text-on-dark mb-6 tracking-tight">
            {title}
          </h1>
          <nav aria-label="Breadcrumb" className="flex justify-center">
            <ol className="flex items-center space-x-3 text-sm md:text-base font-medium text-text-on-dark/80">
              <li>
                <Link
                  href={homeHref}
                  className="flex items-center gap-1.5 text-text-on-dark/70 hover:text-text-on-dark transition-colors"
                >
                  <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  {ui('ui_breadcrumb_home', 'Home')}
                </Link>
              </li>
              <li className="text-text-on-dark/50" aria-hidden="true">
                /
              </li>
              <li className="text-text-on-dark truncate max-w-52 md:max-w-none" aria-current="page">
                {title}
              </li>
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
};

export default Banner;
