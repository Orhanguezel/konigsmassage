'use client';

import React from 'react';
import Link from 'next/link';
import { useResolvedLocale } from '@/i18n/locale';
import { useUiSection } from '@/i18n/uiDb';

const ServiceCta = () => {
  const locale = useResolvedLocale();
  const { ui } = useUiSection('ui_offer', locale);

  const offerHref = `/${locale}/offer`;

  const title = ui(
    'ui_offer_cta_title','Let’s design the most suitable cooling solution for your plant.'
  );

  const description = ui(
    'ui_offer_cta_text',
    'Tell us briefly about your system and our engineering team will propose a performance-focused solution.',
  );

  const buttonLabel = ui('ui_offer_cta_button', 'Request a quote');

  return (
    <div className="cta__area">
      <div className="container">
        <div className="cta__main-wrappper">
          <div className="row" data-aos="fade-up" data-aos-delay="300">
            <div className="col-xl-12">
              <div className="cta__content-box text-center">
                <div className="cta__title mb-20">{title}</div>
                <p className="mb-30">{description}</p>

                {/* CTA Button */}
                <div className="cta__btn-wrap">
                  <Link href={offerHref} className="btn btn-primary">
                    {buttonLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCta;
