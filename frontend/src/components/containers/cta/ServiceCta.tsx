// =============================================================
// FILE: src/components/containers/cta/ServiceCta.tsx
// FINAL – Service Offer CTA
// - Tailwind v4 Semantic Tokens
// =============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

const ServiceCta = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_offer', locale as any);

  // Fallback to manual path construction if localizePath is not handy, 
  // or use `/${locale}/offer` which is safe for simple paths.
  const offerHref = `/${locale}/offer`;

  const title = ui(
    'ui_offer_cta_title',
    'Let’s find the perfect massage for your needs.'
  );

  const description = ui(
    'ui_offer_cta_text',
    'Contact us or check our offers page to find the most relaxing experience for you.',
  );

  const buttonLabel = ui('ui_offer_cta_button', 'View Offers');

  return (
    <section className="py-20 md:py-32 bg-bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto" data-aos="fade-up" data-aos-delay="200">
          <div className="bg-white rounded-xl p-10 md:p-16 shadow-medium border border-sand-100 text-center relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-sand-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-text-primary mb-6 leading-tight">
                 {title}
              </h2>
              
              <p className="text-lg md:text-xl text-text-secondary mb-10 leading-relaxed max-w-2xl mx-auto">
                {description}
              </p>

              <Link 
                href={offerHref} 
                className="inline-flex items-center justify-center px-10 py-4 bg-brand-primary text-white font-bold text-lg rounded-sm hover:bg-brand-hover transition-all duration-300 shadow-soft hover:shadow-lg hover:-translate-y-1 uppercase tracking-widest"
              >
                {buttonLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceCta;
