// =============================================================
// FILE: src/components/layout/banner/CookieSettingsModal.tsx
// konigsmassage – Cookie Settings Modal (DB/UI localized) + final consent state
// - Necessary always on
// - Analytics switch toggles analytics consent
// =============================================================
'use client';

import React, { useEffect, useMemo, useState } from 'react';

// i18n + UI (STANDARD)
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

export type ConsentState = {
  necessary: true;
  analytics: boolean;
};

type Props = {
  open: boolean;
  locale?: string;

  consent: ConsentState;

  title?: string;
  description?: string;

  labelNecessary?: string;
  descNecessary?: string;

  labelAnalytics?: string;
  descAnalytics?: string;

  btnSave?: string;
  btnCancel?: string;

  ariaClose?: string;

  onClose: () => void;
  onSave: (next: ConsentState) => void;
};

function pickText(primary?: string, secondary?: string, fallback?: string) {
  const p = (primary ?? '').trim();
  if (p) return p;
  const s = (secondary ?? '').trim();
  if (s) return s;
  return (fallback ?? '').trim();
}

export default function CookieSettingsModal({
  open,
  consent,
  onClose,
  onSave,

  title,
  description,

  labelNecessary,
  descNecessary,

  labelAnalytics,
  descAnalytics,

  btnSave,
  btnCancel,

  ariaClose,
}: Props) {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_cookie', locale as any);

  const [analytics, setAnalytics] = useState<boolean>(!!consent.analytics);

  useEffect(() => {
    if (!open) return;
    setAnalytics(!!consent.analytics);
  }, [open, consent.analytics]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const nextState: ConsentState = useMemo(() => ({ necessary: true, analytics }), [analytics]);

  const uiTitle = ui('cc_title', 'Cookie Settings');
  const uiDesc = ui(
    'cc_description',
    'You can choose which cookie categories you allow. Necessary cookies are always enabled.',
  );

  const uiLabelNecessary = ui('cc_label_necessary', 'Necessary');
  const uiDescNecessary = ui(
    'cc_desc_necessary',
    'Required for core functions (session, security, language preference, etc.).',
  );

  const uiLabelAnalytics = ui('cc_label_analytics', 'Analytics');
  const uiDescAnalytics = ui(
    'cc_desc_analytics',
    'Helps us understand traffic and performance (e.g., page views).',
  );

  const uiBtnSave = ui('cc_btn_save', 'Save');
  const uiBtnCancel = ui('cc_btn_cancel', 'Cancel');
  const uiAriaClose = ui('cc_aria_close', 'Close');

  const finalTitle = pickText(title, uiTitle, 'Cookie Settings');
  const finalDesc = pickText(description, uiDesc, '');

  const finalLabelNecessary = pickText(labelNecessary, uiLabelNecessary, 'Necessary');
  const finalDescNecessary = pickText(descNecessary, uiDescNecessary, '');

  const finalLabelAnalytics = pickText(labelAnalytics, uiLabelAnalytics, 'Analytics');
  const finalDescAnalytics = pickText(descAnalytics, uiDescAnalytics, '');

  const finalBtnSave = pickText(btnSave, uiBtnSave, 'Save');
  const finalBtnCancel = pickText(btnCancel, uiBtnCancel, 'Cancel');
  const finalAriaClose = pickText(ariaClose, uiAriaClose, 'Close');

  if (!open) return null;

  return (
    <div
      className="ccm__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={finalTitle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ccm__modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ccm__head">
          <div className="ccm__titles">
            <div className="ccm__title">{finalTitle}</div>
            <div className="ccm__desc">{finalDesc}</div>
          </div>

          <button
            type="button"
            className="ccm__close"
            onClick={onClose}
            aria-label={finalAriaClose}
            title={finalAriaClose}
          >
            ×
          </button>
        </div>

        <div className="ccm__content">
          {/* Necessary */}
          <div className="ccm__row">
            <div className="ccm__rowText">
              <div className="ccm__rowTitle">{finalLabelNecessary}</div>
              <div className="ccm__rowDesc">{finalDescNecessary}</div>
            </div>

            <div className="ccm__rowCtrl">
              <span className="ccm__pill ccm__pill--on">{ui('cc_pill_on', 'On')}</span>
            </div>
          </div>

          <div className="ccm__divider" />

          {/* Analytics */}
          <div className="ccm__row">
            <div className="ccm__rowText">
              <div className="ccm__rowTitle">{finalLabelAnalytics}</div>
              <div className="ccm__rowDesc">{finalDescAnalytics}</div>
            </div>

            <div className="ccm__rowCtrl">
              <label className="ccm__switch" aria-label={finalLabelAnalytics}>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <span className="ccm__slider" />
              </label>
            </div>
          </div>
        </div>

        <div className="ccm__actions">
          {/* ✅ Colors come from existing button system */}
          <button type="button" className="ccm__btn border__btn s-2" onClick={onClose}>
            {finalBtnCancel}
          </button>

          <button type="button" className="ccm__btn solid__btn" onClick={() => onSave(nextState)}>
            {finalBtnSave}
          </button>
        </div>
      </div>
    </div>
  );
}
