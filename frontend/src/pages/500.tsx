// =============================================================
// FILE: src/pages/500.tsx
// konigsmassage – 500 Page (i18n + dynamic locales)
//  - UI keys: site_settings.ui_errors (JSON)
//  - Locale: useResolvedLocale() single source of truth
//  - Canonical/og:url: _document tek kaynak
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useResolvedLocale } from '@/i18n/locale';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';
import { normLocaleTag } from '@/i18n/localeUtils';
import { isValidUiText } from '@/i18n/uiText';

const Error500: React.FC = () => {
  const router = useRouter();

  const resolved = useResolvedLocale();
  const locale = useMemo(() => normLocaleTag(resolved) || 'de', [resolved]);

  const { ui } = useUiSection('ui_errors', locale);

  const title = useMemo(() => {
    const key = 'ui_500_title';
    const v = ui(key, '');
    return isValidUiText(v, key) ? v : 'Something Went Wrong';
  }, [ui]);

  const subtitle = useMemo(() => {
    const key = 'ui_500_subtitle';
    const v = ui(key, '');
    return isValidUiText(v, key) ? v : 'An unexpected error occurred. Please try again later.';
  }, [ui]);

  const tryAgain = useMemo(() => {
    const key = 'ui_500_try_again';
    const v = ui(key, '');
    return isValidUiText(v, key) ? v : 'Try Again';
  }, [ui]);

  const homeLabel = useMemo(() => {
    const key = 'ui_404_back_home';
    const v = ui(key, '');
    return isValidUiText(v, key) ? v : 'Back To Home';
  }, [ui]);

  const homeHref = useMemo(() => localizePath(locale, '/'), [locale]);

  return (
    <div className="pt-120 pb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-7 text-center">
            <h2 className="mb-25">{title}</h2>
            <p className="mb-35">{subtitle}</p>

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button
                type="button"
                className="solid__btn d-inline-flex align-items-center"
                onClick={() => router.reload()}
              >
                {tryAgain}
              </button>

              <Link
                href={homeHref}
                className="border-btn text-dark bg-warning border border-dark text-center borderc-btn d-inline-flex"
              >
                {homeLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error500;
