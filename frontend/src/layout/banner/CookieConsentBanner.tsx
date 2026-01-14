// =============================================================
// FILE: src/components/layout/banner/CookieConsentBanner.tsx
// konigsmassage – Cookie Consent Banner (DB-driven + localized) + Analytics Consent bridge
// - Reads site_settings key: cookie_consent (localized: tr/en/de)
// - Persists consent to cookie + localStorage (versioned key)
// - Calls window.__setAnalyticsConsent(boolean) OR queues until analytics-consent-init loads
// =============================================================
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

import CookieSettingsModal, { type ConsentState } from './CookieSettingsModal';

// i18n + UI (STANDARD)
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

// DB
import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';

type CookieConsentDb = {
  consent_version?: number;
  defaults?: {
    necessary?: boolean;
    analytics?: boolean;
    marketing?: boolean;
  };
  ui?: {
    enabled?: boolean;
    position?: 'bottom' | 'top';
    show_reject_all?: boolean;
  };
  texts?: {
    title?: string;
    description?: string;
  };
};

const COOKIE_DAYS = 180;

function setCookie(name: string, value: string, days: number) {
  try {
    const maxAge = days * 24 * 60 * 60;
    const isHttps =
      typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    const secure = isHttps ? '; secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const pattern = new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`);
    const m = document.cookie.match(pattern);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function safeJsonParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? (obj as T) : null;
  } catch {
    return null;
  }
}

function makeKeys(version: number) {
  const v = Number.isFinite(version) && version > 0 ? version : 1;
  const base = `konigsmassage_cookie_consent_v${v}`;
  return {
    cookieKey: base,
    lsKey: base,
    version: v,
  };
}

function normalizeConsent(input: any): ConsentState | null {
  if (!input || typeof input !== 'object') return null;
  // we only store analytics choice; necessary always true
  const analytics = !!(input as any).analytics;
  return { necessary: true, analytics };
}

function persistConsent(keys: { cookieKey: string; lsKey: string }, consent: ConsentState) {
  const raw = JSON.stringify({ analytics: !!consent.analytics });
  try {
    localStorage.setItem(keys.lsKey, raw);
  } catch {}
  setCookie(keys.cookieKey, raw, COOKIE_DAYS);
}

function loadConsent(keys: { cookieKey: string; lsKey: string }): ConsentState | null {
  const fromCookie = normalizeConsent(safeJsonParse(getCookie(keys.cookieKey)));
  if (fromCookie) return fromCookie;

  try {
    const fromLs = normalizeConsent(safeJsonParse(localStorage.getItem(keys.lsKey)));
    if (fromLs) return fromLs;
  } catch {}

  return null;
}

function queueConsent(next: boolean) {
  try {
    (window as any).__pendingAnalyticsConsent = (window as any).__pendingAnalyticsConsent || [];
    const q = (window as any).__pendingAnalyticsConsent as any[];

    const last = q.length ? q[q.length - 1] : null;
    if (typeof last === 'boolean' && last === next) return;

    q.push(next);
  } catch {}
}

function applyAnalyticsConsent(next: boolean) {
  try {
    // UI tarafında da güncel tutalım (AnalyticsScripts de set ediyor)
    (window as any).__analyticsConsentGranted = next === true;

    if (typeof (window as any).__setAnalyticsConsent === 'function') {
      // ✅ Final: boolean kullan
      (window as any).__setAnalyticsConsent(next);
    } else {
      queueConsent(next);
    }
  } catch {}
}

function parseCookieConsentSetting(value: unknown): CookieConsentDb | null {
  // site_settings.value bazen JSON string olarak gelebilir
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value as CookieConsentDb;
  if (typeof value === 'string') return safeJsonParse<CookieConsentDb>(value);
  return null;
}

export default function CookieConsentBanner() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_cookie', locale as any);

  // DB: cookie_consent (localized)
  const { data: consentSettingRaw, isLoading: isConsentLoading } = useGetSiteSettingByKeyQuery({
    key: 'cookie_consent',
    locale,
  } as any);

  const consentSetting: CookieConsentDb | null = useMemo(() => {
    const v = (consentSettingRaw as any)?.value ?? consentSettingRaw;
    return parseCookieConsentSetting(v);
  }, [consentSettingRaw]);

  const consentVersion = useMemo(() => {
    const v = Number(consentSetting?.consent_version);
    return Number.isFinite(v) && v > 0 ? v : 1;
  }, [consentSetting]);

  const keys = useMemo(() => makeKeys(consentVersion), [consentVersion]);

  const enabled = consentSetting?.ui?.enabled !== false; // default enabled
  const showRejectAll = consentSetting?.ui?.show_reject_all !== false; // default true
  const position = consentSetting?.ui?.position === 'top' ? 'top' : 'bottom';

  const defaultAnalytics = !!consentSetting?.defaults?.analytics;

  const [ready, setReady] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({ necessary: true, analytics: false });
  const [hasChoice, setHasChoice] = useState<boolean>(false);

  useEffect(() => {
    // DB gelmeden banner state başlatma (version bilgisi lazım)
    if (isConsentLoading) return;

    // Eğer banner kapalıysa, privacy-by-default yine uygulanmalı.
    if (!enabled) {
      applyAnalyticsConsent(false);
      setReady(true);
      setHasChoice(true);
      return;
    }

    const existing = loadConsent(keys);

    if (existing) {
      setConsent(existing);
      setHasChoice(true);
      applyAnalyticsConsent(existing.analytics);
    } else {
      // default: DB defaults (genelde false) ama privacy-by-default önerisi: false
      const initial: ConsentState = { necessary: true, analytics: !!defaultAnalytics };
      setConsent(initial);
      setHasChoice(false);

      // Banner görünürken bile, analytics’i varsayılan olarak denied tutmak istersen:
      // applyAnalyticsConsent(false);
      // Sen DB defaults ile yönetmek istiyorsan:
      applyAnalyticsConsent(!!initial.analytics);
    }

    setReady(true);
  }, [isConsentLoading, enabled, keys, defaultAnalytics]);

  const policyHref = useMemo(() => localizePath(locale as any, '/cookie-policy'), [locale]);

  const onRejectAll = useCallback(() => {
    const next: ConsentState = { necessary: true, analytics: false };
    setConsent(next);
    persistConsent(keys, next);
    applyAnalyticsConsent(false);
    setHasChoice(true);
    setOpenSettings(false);
  }, [keys]);

  const onAcceptAll = useCallback(() => {
    const next: ConsentState = { necessary: true, analytics: true };
    setConsent(next);
    persistConsent(keys, next);
    applyAnalyticsConsent(true);
    setHasChoice(true);
    setOpenSettings(false);
  }, [keys]);

  const onSaveSettings = useCallback(
    (next: ConsentState) => {
      const normalized: ConsentState = { necessary: true, analytics: !!next.analytics };
      setConsent(normalized);
      persistConsent(keys, normalized);
      applyAnalyticsConsent(!!normalized.analytics);
      setHasChoice(true);
      setOpenSettings(false);
    },
    [keys],
  );

  // SSR/hydration güvenliği
  if (!ready) return null;

  // Banner tamamen devre dışıysa hiçbir UI basma (ama modal da yok)
  if (!enabled) return null;

  // Seçim yapıldıysa banner gizli kalsın; ayar modalı yine açılabilir.
  if (hasChoice) {
    return (
      <CookieSettingsModal
        open={openSettings}
        consent={consent}
        onClose={() => setOpenSettings(false)}
        onSave={onSaveSettings}
      />
    );
  }

  // Text priority: DB(cookie_consent.texts) > ui_cookie > fallback
  const titleText =
    (consentSetting?.texts?.title ?? '').trim() || ui('cc_banner_title', 'Cookie Preferences');

  const descText =
    (consentSetting?.texts?.description ?? '').trim() ||
    ui(
      'cc_banner_desc',
      'We use cookies to ensure the site works properly and to optionally analyze traffic. You can manage your preferences.',
    );

  const policyLabel = ui('cc_banner_link_policy', 'Cookie Policy');

  const btnSettings = ui('cc_banner_btn_settings', 'Cookie Settings');
  const btnReject = ui('cc_banner_btn_reject', 'Reject All');
  const btnAccept = ui('cc_banner_btn_accept', 'Accept All');

  const ariaClose = ui('cc_banner_aria_close', 'Close');

  return (
    <>
      <div
        className={`ccb__wrap ccb__wrap--${position}`}
        role="region"
        aria-label={ui('cc_banner_aria_region', 'Cookie consent')}
      >
        <div className="ccb__inner">
          <div className="ccb__text">
            <div className="ccb__title">{titleText}</div>

            <div className="ccb__desc">
              {descText}{' '}
              <Link className="ccb__link" href={policyHref}>
                {policyLabel}
              </Link>
            </div>
          </div>

          <div className="ccb__actions">
            <button
              type="button"
              className="ccb__btn ccb__btn--ghost"
              onClick={() => setOpenSettings(true)}
            >
              {btnSettings}
            </button>

            {showRejectAll ? (
              <button type="button" className="ccb__btn ccb__btn--outline" onClick={onRejectAll}>
                {btnReject}
              </button>
            ) : null}

            <button type="button" className="ccb__btn ccb__btn--primary" onClick={onAcceptAll}>
              {btnAccept}
            </button>
          </div>

          <button
            type="button"
            className="ccb__close"
            onClick={showRejectAll ? onRejectAll : () => setOpenSettings(true)}
            aria-label={ariaClose}
            title={ariaClose}
          >
            ×
          </button>
        </div>
      </div>

      <CookieSettingsModal
        open={openSettings}
        consent={consent}
        onClose={() => setOpenSettings(false)}
        onSave={onSaveSettings}
      />
    </>
  );
}
