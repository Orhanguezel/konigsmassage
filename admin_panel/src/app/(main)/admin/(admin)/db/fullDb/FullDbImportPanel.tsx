// =============================================================
// FILE: src/components/admin/db/fullDb/FullDbImportPanel.tsx
// =============================================================
'use client';

import React, { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { errorText } from '../shared/errorText';
import { askConfirm } from '../shared/confirm';
import { HelpHint } from '../shared/HelpHint';
import { HelpBlock } from '../shared/HelpBlock';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import {
  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,
} from '@/integrations/hooks';

type TabKey = 'text' | 'url' | 'file';

export const FullDbImportPanel: React.FC = () => {
  const t = useAdminT();
  const [activeTab, setActiveTab] = useState<TabKey>('text');

  const [sqlText, setSqlText] = useState('');
  const [truncateText, setTruncateText] = useState(true);
  const [dryRunText, setDryRunText] = useState(false);

  const [url, setUrl] = useState('');
  const [truncateUrl, setTruncateUrl] = useState(true);
  const [dryRunUrl, setDryRunUrl] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [truncateFile, setTruncateFile] = useState(true);

  const [fileInputKey, setFileInputKey] = useState(0);

  const [importText, { isLoading: isImportingText }] = useImportSqlTextMutation();
  const [importUrl, { isLoading: isImportingUrl }] = useImportSqlUrlMutation();
  const [importFile, { isLoading: isImportingFile }] = useImportSqlFileMutation();

  const busy = isImportingText || isImportingUrl || isImportingFile;

  const activeLabel = useMemo(() => {
    if (activeTab === 'text') return t('admin.db.import.tabs.text');
    if (activeTab === 'url') return t('admin.db.import.tabs.url');
    return t('admin.db.import.tabs.file');
  }, [activeTab, t]);

  const handleSubmitText = async (e: FormEvent) => {
    e.preventDefault();
    if (!sqlText.trim()) return toast.error(t('admin.db.import.text.required'));

    if (!dryRunText) {
      const truncateLabel = truncateText ? t('admin.db.import.confirm.truncateYes') : t('admin.db.import.confirm.truncateNo');
      const ok = askConfirm(
        t('admin.db.import.confirm.text', { truncate: truncateLabel })
      );
      if (!ok) return;
    }

    try {
      const res = await importText({
        sql: sqlText,
        truncateBefore: truncateText,
        dryRun: dryRunText,
      }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, t('admin.db.import.error.text')),
        );
      }

      if (res.dryRun) toast.success(t('admin.db.import.success.dryRun'));
      else {
        toast.success(t('admin.db.import.success.text'));
        setSqlText('');
      }
    } catch (err: any) {
      toast.error(errorText(err, t('admin.db.import.error.textGeneric')));
    }
  };

  const handleSubmitUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return toast.error(t('admin.db.import.url.required'));

    if (!dryRunUrl) {
      const truncateLabel = truncateUrl ? t('admin.db.import.confirm.truncateYes') : t('admin.db.import.confirm.truncateNo');
      const ok = askConfirm(
        t('admin.db.import.confirm.url', { url, truncate: truncateLabel })
      );
      if (!ok) return;
    }

    try {
      const res = await importUrl({
        url: url.trim(),
        truncateBefore: truncateUrl,
        dryRun: dryRunUrl,
      }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, t('admin.db.import.error.url')),
        );
      }

      if (res.dryRun) toast.success(t('admin.db.import.success.dryRun'));
      else {
        toast.success(t('admin.db.import.success.url'));
        setUrl('');
      }
    } catch (err: any) {
      toast.error(errorText(err, t('admin.db.import.error.urlGeneric')));
    }
  };

  const handleSubmitFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error(t('admin.db.import.file.required'));

    const truncateLabel = truncateFile ? t('admin.db.import.confirm.truncateYes') : t('admin.db.import.confirm.truncateNo');
    const ok = askConfirm(
      t('admin.db.import.confirm.file', { file: file.name, truncate: truncateLabel })
    );
    if (!ok) return;

    try {
      const res = await importFile({ file, truncateBefore: truncateFile }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, t('admin.db.import.error.file')),
        );
      }

      toast.success(t('admin.db.import.success.file'));
      setFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err: any) {
      toast.error(errorText(err, t('admin.db.import.error.fileGeneric')));
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-header py-2 d-flex justify-content-between align-items-center flex-wrap gap-2 position-relative">
        <span className="small fw-semibold d-inline-flex align-items-center gap-2 flex-wrap">
          {t('admin.db.import.title')} <span className="text-muted">— {activeLabel}</span>
          <HelpHint icon="question" title={t('admin.db.import.helpTitle')} align="end">
            <HelpBlock headline={t('admin.db.import.helpHeadline')}>
              <ul className="mb-0 ps-3">
                <li>{t('admin.db.import.helpDesc1')}</li>
                <li>
                  <strong>Truncate</strong>: {t('admin.db.import.helpDesc2')}
                </li>
                <li>
                  <strong>Dry run</strong>: {t('admin.db.import.helpDesc3')}
                </li>
              </ul>
            </HelpBlock>
          </HelpHint>
        </span>

        {busy && <span className="badge bg-secondary small">{t('admin.db.import.processing')}</span>}
      </div>

      <div className="card-body position-relative">
        <p className="text-muted small mb-3">
          <strong>{t('admin.db.import.dangerLabel')}</strong> {t('admin.db.import.warning')}
        </p>

        <ul className="nav nav-tabs small mb-3 flex-wrap">
          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (activeTab === 'text' ? 'active' : '')}
              onClick={() => setActiveTab('text')}
              disabled={busy}
            >
              {t('admin.db.import.tabs.text')}
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (activeTab === 'url' ? 'active' : '')}
              onClick={() => setActiveTab('url')}
              disabled={busy}
            >
              {t('admin.db.import.tabs.url')}
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (activeTab === 'file' ? 'active' : '')}
              onClick={() => setActiveTab('file')}
              disabled={busy}
            >
              {t('admin.db.import.tabs.file')}
            </button>
          </li>
        </ul>

        {activeTab === 'text' && (
          <form onSubmit={handleSubmitText}>
            <div className="mb-2 position-relative">
              <label className="form-label small d-flex align-items-center gap-1 flex-wrap">
                {t('admin.db.import.text.label')} <span className="text-danger">*</span>
                <HelpHint icon="question" title={t('admin.db.import.text.helpTitle')}>
                  <HelpBlock headline={t('admin.db.import.text.helpHeadline')}>
                    <ul className="mb-0 ps-3">
                      <li>{t('admin.db.import.text.helpDesc1')}</li>
                      <li>{t('admin.db.import.text.helpDesc2')}</li>
                      <li>{t('admin.db.import.text.helpDesc3')}</li>
                    </ul>
                  </HelpBlock>
                </HelpHint>
              </label>

              <textarea
                className="form-control form-control-sm"
                rows={8}
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                placeholder={t('admin.db.import.text.placeholder')}
                disabled={busy}
              />
            </div>

            <div className="d-flex flex-wrap gap-3 mb-3">
              <div className="form-check position-relative">
                <input
                  id="import-text-truncate"
                  className="form-check-input"
                  type="checkbox"
                  checked={truncateText}
                  onChange={(e) => setTruncateText(e.target.checked)}
                  disabled={busy}
                />
                <label className="form-check-label small" htmlFor="import-text-truncate">
                  {t('admin.db.import.truncate.label')}
                  <HelpHint icon="bulb" title={t('admin.db.import.truncate.helpTitle')}>
                    <HelpBlock headline={t('admin.db.import.truncate.helpHeadline')}>
                      <div>{t('admin.db.import.truncate.helpDesc')}</div>
                    </HelpBlock>
                  </HelpHint>
                </label>
              </div>

              <div className="form-check position-relative">
                <input
                  id="import-text-dryrun"
                  className="form-check-input"
                  type="checkbox"
                  checked={dryRunText}
                  onChange={(e) => setDryRunText(e.target.checked)}
                  disabled={busy}
                />
                <label className="form-check-label small" htmlFor="import-text-dryrun">
                  {t('admin.db.import.dryRun.label')}
                  <HelpHint icon="question" title={t('admin.db.import.dryRun.helpTitle')}>
                    <HelpBlock headline={t('admin.db.import.dryRun.helpHeadline')}>
                      <div>{t('admin.db.import.dryRun.helpDesc')}</div>
                    </HelpBlock>
                  </HelpHint>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
              {isImportingText ? t('admin.db.import.buttons.importing') : t('admin.db.import.buttons.apply')}
            </button>
          </form>
        )}

        {activeTab === 'url' && (
          <form onSubmit={handleSubmitUrl}>
            <div className="mb-2 position-relative">
              <label className="form-label small d-flex align-items-center gap-1 flex-wrap">
                {t('admin.db.import.url.label')} <span className="text-danger">*</span>
                <HelpHint icon="question" title={t('admin.db.import.url.helpTitle')}>
                  <HelpBlock headline={t('admin.db.import.url.helpHeadline')}>
                    <ul className="mb-0 ps-3">
                      <li>{t('admin.db.import.url.helpDesc1')}</li>
                      <li>{t('admin.db.import.url.helpDesc2')}</li>
                      <li>{t('admin.db.import.url.helpDesc3')}</li>
                    </ul>
                  </HelpBlock>
                </HelpHint>
              </label>

              <input
                type="url"
                className="form-control form-control-sm"
                placeholder={t('admin.db.import.url.placeholder')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="d-flex flex-wrap gap-3 mb-3">
              <div className="form-check position-relative">
                <input
                  id="import-url-truncate"
                  className="form-check-input"
                  type="checkbox"
                  checked={truncateUrl}
                  onChange={(e) => setTruncateUrl(e.target.checked)}
                  disabled={busy}
                />
                <label className="form-check-label small" htmlFor="import-url-truncate">
                  {t('admin.db.import.truncate.label')}
                  <HelpHint icon="bulb" title={t('admin.db.import.truncate.helpTitle')}>
                    <HelpBlock headline={t('admin.db.import.truncate.helpHeadline')}>
                      <div>{t('admin.db.import.truncate.helpDesc')}</div>
                    </HelpBlock>
                  </HelpHint>
                </label>
              </div>

              <div className="form-check position-relative">
                <input
                  id="import-url-dryrun"
                  className="form-check-input"
                  type="checkbox"
                  checked={dryRunUrl}
                  onChange={(e) => setDryRunUrl(e.target.checked)}
                  disabled={busy}
                />
                <label className="form-check-label small" htmlFor="import-url-dryrun">
                  {t('admin.db.import.dryRun.label')}
                  <HelpHint icon="question" title={t('admin.db.import.dryRun.helpTitle')}>
                    <HelpBlock headline={t('admin.db.import.dryRun.helpHeadline')}>
                      <div>{t('admin.db.import.dryRun.helpDescUrl')}</div>
                    </HelpBlock>
                  </HelpHint>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
              {isImportingUrl ? t('admin.db.import.buttons.importing') : t('admin.db.import.buttons.importFromUrl')}
            </button>
          </form>
        )}

        {activeTab === 'file' && (
          <form onSubmit={handleSubmitFile}>
            <div className="mb-2 position-relative">
              <label className="form-label small d-flex align-items-center gap-1 flex-wrap">
                {t('admin.db.import.file.label')} <span className="text-danger">*</span>
                <HelpHint icon="question" title={t('admin.db.import.file.helpTitle')}>
                  <HelpBlock headline={t('admin.db.import.file.helpHeadline')}>
                    <ul className="mb-0 ps-3">
                      <li>{t('admin.db.import.file.helpDesc1')}</li>
                      <li>{t('admin.db.import.file.helpDesc2')}</li>
                      <li>{t('admin.db.import.file.helpDesc3')}</li>
                    </ul>
                  </HelpBlock>
                </HelpHint>
              </label>

              <input
                key={fileInputKey}
                type="file"
                className="form-control form-control-sm"
                accept=".sql,.gz,.sql.gz"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={busy}
              />

              {file && (
                <div className="text-muted small mt-1">
                  {t('admin.db.import.file.selected')} <code>{file.name}</code>
                </div>
              )}

              <div className="text-muted small mt-1">
                {t('admin.common.note')}: {t('admin.db.import.file.note')}
              </div>
            </div>

            <div className="form-check mb-3 position-relative">
              <input
                id="import-file-truncate"
                className="form-check-input"
                type="checkbox"
                checked={truncateFile}
                onChange={(e) => setTruncateFile(e.target.checked)}
                disabled={busy}
              />
              <label className="form-check-label small" htmlFor="import-file-truncate">
                {t('admin.db.import.truncate.label')}
                <HelpHint icon="bulb" title={t('admin.db.import.truncate.helpTitle')}>
                  <HelpBlock headline={t('admin.db.import.truncate.helpHeadline')}>
                    <div>{t('admin.db.import.truncate.helpDescFile')}</div>
                  </HelpBlock>
                </HelpHint>
              </label>
            </div>

            <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
              {isImportingFile ? t('admin.db.import.buttons.importing') : t('admin.db.import.buttons.importFromFile')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
