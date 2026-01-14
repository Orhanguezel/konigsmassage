// =============================================================
// FILE: src/pages/404.tsx
// konigsmassage – 404 Page (i18n + dynamic locales)
//  - UI keys: site_settings.ui_errors (JSON)
//  - Locale resolution: useResolvedLocale() single source of truth
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { useResolvedLocale } from '@/i18n/locale';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';
import { normLocaleTag } from '@/i18n/localeUtils';
import { isValidUiText } from '@/i18n/uiText';

const Error404: React.FC = () => {
  const resolved = useResolvedLocale();
  const locale = useMemo(() => normLocaleTag(resolved) || 'de', [resolved]);

  const { ui } = useUiSection('ui_errors', locale);

  const title = useMemo(() => {
    const key = 'ui_404_title';
    const v = ui(key, '');
    return isValidUiText(v, key) ? v : 'Page Not Found';
  }, [ui]);

  const subtitle = useMemo(() => {
    const key = 'ui_404_subtitle';
    const v = ui(key, '');
    return isValidUiText(v, key)
      ? v
      : 'The page you are looking for may have been moved or does not exist.';
  }, [ui]);

  const cta = useMemo(() => {
    const key = 'ui_404_back_home';
    const v = ui(key, '');
    return isValidUiText(v, key) ? v : 'Back To Home';
  }, [ui]);

  const homeHref = useMemo(() => localizePath(locale, '/'), [locale]);

  return (
    <div className="pt-120 pb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-6 text-center">
            <h2 className="mb-25">{title}</h2>
            <p className="mb-35">{subtitle}</p>

            <Link
              href={homeHref}
              className="border-btn text-dark bg-warning border border-dark text-center ms-3 borderc-btn d-inline-flex"
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error404;
