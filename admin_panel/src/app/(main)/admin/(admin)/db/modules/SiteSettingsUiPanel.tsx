// =============================================================
// FILE: src/components/admin/db/modules/SiteSettingsUiPanel.tsx
// =============================================================
'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
// import {
//   useBootstrapSiteSettingsUiLocaleMutation,
//   useExportSiteSettingsUiJsonQuery,
// } from '@/integrations/hooks'; // TODO: Backend endpoints not implemented
import { buildDownloadName, triggerDownload } from '../shared/download';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type SiteSettingsUiPanelProps = {
  disabled: boolean;
};

export const SiteSettingsUiPanel: React.FC<SiteSettingsUiPanelProps> = ({ disabled }) => {
  const t = useAdminT();
  // const { data, isLoading, isFetching } = useExportSiteSettingsUiJsonQuery(undefined, {
  //   skip: disabled,
  // }); // TODO: Backend endpoint not implemented

  const data: any = null;
  const isLoading = false;
  const isFetching = false;

  const [locale, setLocale] = useState('en');
  const [fromLocale, setFromLocale] = useState('de');
  const [overwrite, setOverwrite] = useState(false);
  const [onlyUiKeys, setOnlyUiKeys] = useState(true);

  // const [bootstrap, { isLoading: isBootstrapping }] = useBootstrapSiteSettingsUiLocaleMutation(); // TODO: Backend endpoint not implemented
  const bootstrap = (_params: any) => ({ unwrap: async () => ({ ok: false, error: 'Not implemented' }) });
  const isBootstrapping = false;

  const busy = disabled || isLoading || isFetching || isBootstrapping;

  const locales = useMemo(() => data?.locales ?? ['tr', 'en', 'de'], [data?.locales]);

  const handleDownloadJson = () => {
    if (!data) return toast.error(t('admin.db.modules.ui.downloadError'));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, buildDownloadName('site_settings_ui', 'json'));
    toast.success(t('admin.db.modules.ui.downloadSuccess'));
  };

  const handleBootstrap = async () => {
    try {
      const res = await bootstrap({ locale, fromLocale, overwrite, onlyUiKeys }).unwrap();
      if (!res?.ok) return toast.error(res?.error || t('admin.db.modules.ui.bootstrapError'));
      toast.success(t('admin.db.modules.ui.bootstrapSuccess'));
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('admin.db.modules.ui.bootstrapErrorGeneric'));
    }
  };

  return (
    <div className="border rounded-3 p-3">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <div className="fw-semibold small">{t('admin.db.modules.ui.title')}</div>
          <div className="text-muted small">
            {t('admin.db.modules.ui.description')}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={handleDownloadJson}
          disabled={busy || !data}
        >
          {t('admin.db.modules.ui.downloadButton')}
        </button>
      </div>

      <hr />

      <div className="row g-2">
        <div className="col-md-3">
          <label className="form-label small">{t('admin.db.modules.ui.targetLocale')}</label>
          <select
            className="form-select form-select-sm"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={busy}
          >
            {locales.map((l: string) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label small">{t('admin.db.modules.ui.sourceLocale')}</label>
          <select
            className="form-select form-select-sm"
            value={fromLocale}
            onChange={(e) => setFromLocale(e.target.value)}
            disabled={busy}
          >
            {locales.map((l: string) => (
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
              {t('admin.db.modules.ui.overwrite')}
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
              {t('admin.db.modules.ui.onlyUiKeys')}
            </label>
          </div>

          <button
            type="button"
            className="btn btn-warning btn-sm ms-auto"
            onClick={handleBootstrap}
            disabled={busy}
          >
            {isBootstrapping ? t('admin.db.modules.ui.applying') : t('admin.db.modules.ui.bootstrapButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
