// =============================================================
// FILE: src/pages/index.tsx
// konigsmassage – Home Page (PUBLIC PAGES ROUTER STANDARD) — FINAL
// - NO <Head>
// - SEO override only via <LayoutSeoBridge />
// - Locale: useLocaleShort() (Pages Router)
// - H1: site_settings.ui_home.ui_home_h1 -> fallback
// - OG IMAGE: DB single source => site_settings(key='site_og_default_image', locale='*')
// - Guard: ui() missing-key returns key string => do not treat as url/path
// =============================================================

import type { NextPage } from 'next';
import React, { useMemo } from 'react';

import Hero from '@/layout/banner/Hero';
import About from '@/components/containers/about/AboutSection';
import ServiceSection from '@/components/containers/services/ServiceSection';
import Feedback from '@/components/containers/feedback/Feedback';
import AppointmentSection from '@/components/containers/appointment/AppointmentSection';

import { LayoutSeoBridge } from '@/seo/LayoutSeoBridge';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

function tryParseJson(input: unknown): any {
  if (typeof input !== 'string') return input;
  const s = input.trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function pickOgUrlFromSettingValue(value: unknown): string | undefined {
  // expected: {"url":"https://...","width":1200,...}
  const raw = tryParseJson(value);
  if (raw && typeof raw === 'object') {
    const url = safeStr((raw as any).url);
    if (url) return url;
  }
  // allow plain url as text
  const plain = safeStr(value);
  if (/^https?:\/\//i.test(plain)) return plain;
  return undefined;
}

const Home: NextPage = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_home', locale as any);

  // site_title (localized)
  const { data: siteTitleSetting } = useGetSiteSettingByKeyQuery({
    key: 'site_title',
    locale,
  });

  const siteTitle = useMemo(() => {
    const t = safeStr(siteTitleSetting?.value);
    return t || 'Königs Massage';
  }, [siteTitleSetting?.value]);

  // ✅ OG default image (global)
  const { data: ogDefaultSetting } = useGetSiteSettingByKeyQuery({
    key: 'site_og_default_image',
    locale: '*',
  });

  const ogDefaultUrl = useMemo(() => {
    return pickOgUrlFromSettingValue(ogDefaultSetting?.value);
  }, [ogDefaultSetting?.value]);

  // -------------------------------------------------------------
  // H1 (SEO-only) — DB ui_home.ui_home_h1 is primary
  // -------------------------------------------------------------
  const h1 = useMemo(() => {
    const key = 'ui_home_h1';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    // brand-safe fallback
    if (locale === 'de') return `${siteTitle} – Professionelle Massage und Wellness in Bonn`;
    if (locale === 'tr') return `${siteTitle} – Profesyonel Masaj ve Wellness – Bonn`;
    return `${siteTitle} – Professional Massage and Wellness in Bonn`;
  }, [ui, siteTitle, locale]);

  // -------------------------------------------------------------
  // SEO title/description (optional UI keys)
  // -------------------------------------------------------------
  const pageTitle = useMemo(() => {
    const key = 'ui_home_meta_title';
    const v = safeStr(ui(key, ''));
    // Guard: if ui() returns the key itself, treat as missing
    if (v && v !== key && isValidUiText(v, key)) return v;
    return h1 || siteTitle || 'Königs Massage';
  }, [ui, h1, siteTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_home_meta_description';
    const v = safeStr(ui(key, ''));
    if (v && v !== key && isValidUiText(v, key)) return v;
    return ''; // empty => Layout default
  }, [ui]);

  // -------------------------------------------------------------
  // ✅ OG image override policy:
  // - We do NOT use ui_home_og_image at all (since your DB doesn't contain it)
  // - We rely on DB global single source: site_og_default_image
  // -------------------------------------------------------------
  const ogImage = useMemo(() => {
    return ogDefaultUrl; // undefined => Layout fallback if needed
  }, [ogDefaultUrl]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription || undefined}
        ogImage={ogImage}
        noindex={false}
      />

      <h1 className="sr-only">{h1}</h1>

      <Hero />
      <ServiceSection />
      <About />
      <Feedback />
      <AppointmentSection />
    </>
  );
};

export default Home;
