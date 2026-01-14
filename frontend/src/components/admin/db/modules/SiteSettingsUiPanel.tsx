// =============================================================
// FILE: src/components/admin/db/modules/SiteSettingsUiPanel.tsx
// =============================================================
'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useBootstrapSiteSettingsUiLocaleMutation,
  useExportSiteSettingsUiJsonQuery,
} from '@/integrations/rtk/hooks';
import { buildDownloadName, triggerDownload } from '../shared/download';

export type SiteSettingsUiPanelProps = {
  disabled: boolean;
};

export const SiteSettingsUiPanel: React.FC<SiteSettingsUiPanelProps> = ({ disabled }) => {
  const { data, isLoading, isFetching } = useExportSiteSettingsUiJsonQuery(undefined, {
    skip: disabled,
  });

  const [locale, setLocale] = useState('en');
  const [fromLocale, setFromLocale] = useState('de');
  const [overwrite, setOverwrite] = useState(false);
  const [onlyUiKeys, setOnlyUiKeys] = useState(true);

  const [bootstrap, { isLoading: isBootstrapping }] = useBootstrapSiteSettingsUiLocaleMutation();

  const busy = disabled || isLoading || isFetching || isBootstrapping;

  const locales = useMemo(() => data?.locales ?? ['tr', 'en', 'de'], [data?.locales]);

  const handleDownloadJson = () => {
    if (!data) return toast.error('UI export verisi hazır değil.');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, buildDownloadName('site_settings_ui', 'json'));
    toast.success('UI JSON indirildi.');
  };

  const handleBootstrap = async () => {
    try {
      const res = await bootstrap({ locale, fromLocale, overwrite, onlyUiKeys }).unwrap();
      if (!res?.ok) return toast.error(res?.error || 'UI bootstrap başarısız.');
      toast.success('UI bootstrap tamamlandı.');
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'UI bootstrap sırasında hata oluştu.');
    }
  };

  return (
    <div className="border rounded-3 p-3">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <div className="fw-semibold small">Site Settings UI Export / Bootstrap</div>
          <div className="text-muted small">
            ui_* key’lerini toplu export et ve locale bootstrap yap.
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={handleDownloadJson}
          disabled={busy || !data}
        >
          JSON İndir
        </button>
      </div>

      <hr />

      <div className="row g-2">
        <div className="col-md-3">
          <label className="form-label small">Hedef locale</label>
          <select
            className="form-select form-select-sm"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={busy}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label small">Kaynak locale</label>
          <select
            className="form-select form-select-sm"
            value={fromLocale}
            onChange={(e) => setFromLocale(e.target.value)}
            disabled={busy}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6 d-flex flex-wrap gap-3 align-items-end">
          <div className="form-check">
            <input
              id="ui-overwrite"
              className="form-check-input"
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              disabled={busy}
            />
            <label className="form-check-label small" htmlFor="ui-overwrite">
              Overwrite
            </label>
          </div>

          <div className="form-check">
            <input
              id="ui-onlyUi"
              className="form-check-input"
              type="checkbox"
              checked={onlyUiKeys}
              onChange={(e) => setOnlyUiKeys(e.target.checked)}
              disabled={busy}
            />
            <label className="form-check-label small" htmlFor="ui-onlyUi">
              Sadece ui_* key’ler
            </label>
          </div>

          <button
            type="button"
            className="btn btn-warning btn-sm ms-auto"
            onClick={handleBootstrap}
            disabled={busy}
          >
            {isBootstrapping ? 'Uygulanıyor...' : 'Bootstrap Uygula'}
          </button>
        </div>
      </div>
    </div>
  );
};
