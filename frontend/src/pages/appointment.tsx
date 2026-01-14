// =============================================================
// FILE: src/pages/appointment.tsx
// konigsmassage – Appointment Page (Public) + SEO (PUBLIC PAGES ROUTER STANDARD)
//   - Route: /appointment
//   - NO <Head>
//   - SEO override: <LayoutSeoBridge />
//   - Canonical/og:url/hreflang: _document (SSR) + Layout
//   - UI overrides: ui_contact_* (validated)
//   - Map: site_settings.contact_map (dynamic)
// =============================================================

'use client';

import React, { useMemo } from 'react';

import Banner from '@/layout/banner/Breadcrum';
import AppointmentPageContent from '@/components/containers/appointment/AppointmentPageContent';

import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

import { toCdnSrc } from '@/shared/media';

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

const AppointmentPage: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_appointment', locale as any);

  // ======================
  // UI / Banner title (validated)
  // ======================
  const bannerTitle = useMemo(() => {
    // Prefer:
    // 1) ui_appointment_page_title
    // 2) ui_appointment_subprefix + ui_appointment_sublabel
    // 3) fallback
    const keyPage = 'ui_appointment_page_title';
    const fromPage = safeStr(ui(keyPage, ''));
    if (isValidUiText(fromPage, keyPage)) return fromPage;

    const p = safeStr(ui('ui_appointment_subprefix', ''));
    const l = safeStr(ui('ui_appointment_sublabel', ''));
    const t = `${p} ${l}`.trim();
    if (t) return t;

    return 'Appointment';
  }, [ui]);

  // ======================
  // SEO override (UI-only; Layout handles global defaults)
  // ======================
  const pageTitle = useMemo(() => {
    const key = 'ui_appointment_meta_title';
    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    return bannerTitle || 'Appointment';
  }, [ui, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_appointment_meta_description';
    const fromUi = safeStr(ui(key, ''));
    if (isValidUiText(fromUi, key)) return fromUi;

    return ''; // empty => Layout default
  }, [ui]);

  const ogImageOverride = useMemo(() => {
    const key = 'ui_appointment_og_image';
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
      <AppointmentPageContent />
    </>
  );
};

export default AppointmentPage;
