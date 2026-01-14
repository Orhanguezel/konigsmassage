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
    <div className="breadcrumb__area">

      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="breadcrumb__wrapper text-center">
              <div className="breadcrumb__title">
                <h2>{title}</h2>
              </div>

              <div className="breadcrumb__menu">
                <nav aria-label="Breadcrumbs" className="breadcrumb-trail breadcrumbs">
                  <ul className="trail-items">
                    {/* Home */}
                    <li className="trail-item trail-begin">
                      <span>
                        <Link href={homeHref}>{ui('ui_breadcrumb_home', 'Home')}</Link>
                      </span>
                    </li>

                    {/* Separator (ARTIK li içinde) */}
                    <li className="trail-item trail-separator" aria-hidden="true">
                      <span>›</span>
                    </li>

                    {/* Current page */}
                    <li className="trail-item trail-end">
                      <span aria-current="page">{title}</span>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
