// =============================================================
// FILE: src/components/admin/db/modules/ModuleImportPanel.tsx
// =============================================================
'use client';

import React, { useMemo, useState, FormEvent } from 'react';
import { toast } from 'sonner';
// import { useImportModuleMutation } from '@/integrations/hooks'; // TODO: Backend endpoint not implemented
import { askConfirm } from '../shared/confirm';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type TabKey = 'text' | 'file';

export type ModuleImportPanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleImportPanel: React.FC<ModuleImportPanelProps> = ({ module, disabled }) => {
  const t = useAdminT();
  const [tab, setTab] = useState<TabKey>('text');

  const [sqlText, setSqlText] = useState('');
  const [truncate, setTruncate] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // const [importModule, { isLoading }] = useImportModuleMutation(); // TODO: Backend endpoint not implemented
  const isLoading = false;

  const busy = disabled || isLoading;

  const tabLabel = useMemo(() => (tab === 'text' ? t('admin.db.modules.import.tabs.text') : t('admin.db.modules.import.tabs.file')), [tab, t]);

  const handleSubmitText = async (e: FormEvent) => {
    e.preventDefault();
    // TODO: Backend endpoint for module import not implemented yet
    toast.info(t('admin.db.modules.import.notImplemented'));
  };

  const handleSubmitFile = async (e: FormEvent) => {
    e.preventDefault();
    // TODO: Backend endpoint for module import not implemented yet
    toast.info(t('admin.db.modules.import.notImplemented'));
  };

  return (
    <div className="border rounded-3 p-3">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
        <div>
          <div className="fw-semibold small">{t('admin.db.modules.import.title')}</div>
          <div className="text-muted small">
            {t('admin.db.modules.import.description', { module })}
          </div>
        </div>
        <div className="form-check">
          <input
            id="module-import-truncate"
            className="form-check-input"
            type="checkbox"
            checked={truncate}
            onChange={(e) => setTruncate(e.target.checked)}
            disabled={busy}
          />
          <label className="form-check-label small" htmlFor="module-import-truncate">
            {t('admin.db.modules.import.truncate')}
          </label>
        </div>
      </div>

      <ul className="nav nav-tabs small mb-3 flex-wrap">
        <li className="nav-item">
          <button
            type="button"
            className={'nav-link py-1 px-2 ' + (tab === 'text' ? 'active' : '')}
            onClick={() => setTab('text')}
            disabled={busy}
          >
            {t('admin.db.modules.import.tabs.text')}
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={'nav-link py-1 px-2 ' + (tab === 'file' ? 'active' : '')}
            onClick={() => setTab('file')}
            disabled={busy}
          >
            {t('admin.db.modules.import.tabs.file')}
          </button>
        </li>
      </ul>

      {tab === 'text' && (
        <form onSubmit={handleSubmitText}>
          <div className="mb-2">
            <label className="form-label small">
              {t('admin.db.modules.import.text.label')} <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control form-control-sm"
              rows={8}
              value={sqlText}
              onChange={(e) => setSqlText(e.target.value)}
              placeholder={t('admin.db.modules.import.text.placeholder')}
              disabled={busy}
            />
          </div>
          <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
            {isLoading ? t('admin.db.modules.import.importing') : t('admin.db.modules.import.applyButton')}
          </button>
        </form>
      )}

      {tab === 'file' && (
        <form onSubmit={handleSubmitFile}>
          <div className="mb-2">
            <label className="form-label small">
              {t('admin.db.modules.import.file.label')} <span className="text-danger">*</span>
            </label>
            <input
              key={fileInputKey}
              type="file"
              className="form-control form-control-sm"
              accept=".sql,.gz,.sql.gz"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={busy}
            />
          </div>
          <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
            {isLoading ? t('admin.db.modules.import.importing') : t('admin.db.modules.import.importButton')}
          </button>
        </form>
      )}
    </div>
  );
};
