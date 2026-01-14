// =============================================================
// FILE: src/pages/faqs.tsx
// konigsmassage – Faqs Page (full list) + SEO (PUBLIC PAGES ROUTER STANDARD)
//   - Route: /faqs
//   - Layout: Banner + FaqsPageContent + Feedback
//   - NO <Head>
//   - SEO override: <LayoutSeoBridge />
//   - Canonical/og:url/hreflang: _document (SSR) + Layout
//   - i18n UI: site_settings.ui_faqs (validated)
// =============================================================

'use client';

import React, { useMemo } from 'react';

import Banner from '@/layout/banner/Breadcrum';
import FaqsPageContent from '@/components/containers/faqs/FaqsPageContent';
import Feedback from '@/components/containers/feedback/Feedback';

import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

import { toCdnSrc } from '@/shared/media';

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

const FaqsPage: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_faqs', locale as any);

  // ======================
  // Banner title (UI)
  // ======================
  const bannerTitle = useMemo(() => {
    const key = 'ui_faqs_page_title';
    const v = safeStr(ui(key, 'FAQs'));
    return isValidUiText(v, key) ? v : 'FAQs';
  }, [ui]);

  // ======================
  // SEO override (UI-only; Layout handles global defaults)
  // ======================
  const pageTitle = useMemo(() => {
    const key = 'ui_faqs_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    return bannerTitle || 'FAQs';
  }, [ui, bannerTitle]);

  const pageDescription = useMemo(() => {
    const keyMeta = 'ui_faqs_meta_description';
    const vMeta = safeStr(ui(keyMeta, ''));
    if (isValidUiText(vMeta, keyMeta)) return vMeta;

    const keyPage = 'ui_faqs_page_description';
    const vPage = safeStr(ui(keyPage, ''));
    if (isValidUiText(vPage, keyPage)) return vPage;

    return ''; // empty => Layout default
  }, [ui]);

  const ogImageOverride = useMemo(() => {
    const key = 'ui_faqs_og_image';
    const raw = safeStr(ui(key, ''));
    if (!raw) return undefined;

    if (/^https?:\/\//i.test(raw)) return raw;
    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription || undefined}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />
      <FaqsPageContent />
      <Feedback />
    </>
  );
};

export default FaqsPage;
