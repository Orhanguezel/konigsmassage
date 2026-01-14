// =============================================================
// FILE: src/features/analytics/GAViewPages.tsx
// konigsmassage – Page view tracking (Pages Router) respecting consent
// - If GTM present: push a custom dataLayer event (no dependency on window.gtag)
// - If only GA4 gtag present: send gtag('event','page_view', ...)
// =============================================================
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAnalyticsSettings } from './useAnalyticsSettings';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    __analyticsConsentGranted?: boolean;
  }
}

function isValidGtmId(v: unknown) {
  const s = String(v ?? '').trim();
  return !!s && s.startsWith('GTM-');
}

function isValidGa4Id(v: unknown) {
  const s = String(v ?? '').trim();
  return !!s && s.startsWith('G-');
}

export default function GAViewPages() {
  const router = useRouter();
  const { locale, ga4Id, gtmId } = useAnalyticsSettings();

  const hasGtm = useMemo(() => isValidGtmId(gtmId), [gtmId]);
  const hasGa = useMemo(() => isValidGa4Id(ga4Id), [ga4Id]);

  const hasAnyAnalytics = hasGtm || hasGa;

  const lastAbsUrlRef = useRef<string>('');

  useEffect(() => {
    if (!hasAnyAnalytics) return;
    if (!router.isReady) return;

    const send = (nextUrl: string) => {
      try {
        if (typeof window === 'undefined') return;
        if (window.__analyticsConsentGranted !== true) return;

        const path = (nextUrl || '/').split(/[?#]/)[0] || '/';
        const abs = window.location.origin + path;

        if (lastAbsUrlRef.current === abs) return;
        lastAbsUrlRef.current = abs;

        const payload = {
          page_title: document.title,
          page_location: abs,
          page_path: path,
          language: locale,
        };

        // 1) GTM path: push custom event (recommended)
        if (hasGtm) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'konigsmassage_page_view',
            ...payload,
          });
          return;
        }

        // 2) gtag.js fallback path
        if (hasGa && window.gtag) {
          window.gtag('event', 'page_view', payload);
        }
      } catch {
        // ignore
      }
    };

    // first load
    send(router.asPath || router.pathname || '/');

    const onRouteChangeComplete = (url: string) => send(url);

    router.events.on('routeChangeComplete', onRouteChangeComplete);
    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, [
    router.isReady,
    router.events,
    router.asPath,
    router.pathname,
    hasAnyAnalytics,
    hasGtm,
    hasGa,
    locale,
  ]);

  return null;
}
