// =============================================================
// FILE: src/pages/about.tsx
// konigsmassage – About Page [FINAL / STANDARD]
// - Route: /about
// - SEO: page overrides via <LayoutSeoBridge /> (store-based, navigation-safe)
// - General meta/canonical/hreflang/etc. stays in Layout/_document (no duplication)
// - Priority:
//   title: ui_about_meta_title -> ui_about_page_title -> fallback
//   desc : ui_about_meta_description -> ui_about_page_description -> fallback
//   og   : ui_about_og_image (optional) -> undefined (Layout decides)
// =============================================================

'use client';

import React, { useMemo } from 'react';
import type { NextPage } from 'next';

import Banner from '@/layout/banner/Breadcrum';
import AboutPageContent from '@/components/containers/about/AboutPageContent';

// ✅ Page -> Layout SEO overrides (STANDARD)
import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

// i18n + UI
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

// helpers
import { toCdnSrc } from '@/shared/media';

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

const AboutPage: NextPage = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_about_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'About Us';
  }, [ui]);

  const pageTitle = useMemo(() => {
    const key = 'ui_about_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    return bannerTitle || 'About konigsmassage';
  }, [ui, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_about_meta_description';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const key2 = 'ui_about_page_description';
    const d = safeStr(ui(key2, ''));
    if (isValidUiText(d, key2)) return d;

    return 'Information about konigsmassage, our company and capabilities.';
  }, [ui]);

  const ogImageOverride = useMemo(() => {
    const key = 'ui_about_og_image';
    const raw = safeStr(ui(key, ''));
    if (!raw) return undefined;

    if (/^https?:\/\//i.test(raw)) return raw;
    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />
      <AboutPageContent />
    </>
  );
};

export default AboutPage;
