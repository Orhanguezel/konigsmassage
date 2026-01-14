// =============================================================
// FILE: src/components/admin/db/modules/ModuleImportPanel.tsx
// =============================================================
'use client';

import React, { useMemo, useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { useImportModuleMutation } from '@/integrations/rtk/hooks';
import { askConfirm } from '../shared/confirm';

type TabKey = 'text' | 'file';

export type ModuleImportPanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleImportPanel: React.FC<ModuleImportPanelProps> = ({ module, disabled }) => {
  const [tab, setTab] = useState<TabKey>('text');

  const [sqlText, setSqlText] = useState('');
  const [truncate, setTruncate] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [importModule, { isLoading }] = useImportModuleMutation();

  const busy = disabled || isLoading;

  const tabLabel = useMemo(() => (tab === 'text' ? 'SQL Metni' : 'Dosya'), [tab]);

  const handleSubmitText = async (e: FormEvent) => {
    e.preventDefault();
    if (!sqlText.trim()) return toast.error('SQL metni boş olamaz.');

    const ok = askConfirm(
      `${module} modülünü içe aktarmak üzeresin.\n\n` +
        `Kaynak: ${tabLabel}\n` +
        `Truncate: ${truncate ? 'EVET (modül tabloları temizlenir)' : 'Hayır'}\n\n` +
        'Devam etmek istiyor musun?',
    );
    if (!ok) return;

    try {
      const res = await importModule({ module, sqlText, truncateBefore: truncate }).unwrap();
      if (!res?.ok) return toast.error(res?.error || 'Modül import sırasında hata oluştu.');
      toast.success('Modül içe aktarıldı.');
      setSqlText('');
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Modül import sırasında hata oluştu.');
    }
  };

  const handleSubmitFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Önce dosya seç.');

    const ok = askConfirm(
      `${module} modülünü dosyadan içe aktarmak üzeresin.\n\n` +
        `Dosya: ${file.name}\n` +
        `Truncate: ${truncate ? 'EVET (modül tabloları temizlenir)' : 'Hayır'}\n\n` +
        'Devam etmek istiyor musun?',
    );
    if (!ok) return;

    try {
      const res = await importModule({ module, file, truncateBefore: truncate }).unwrap();
      if (!res?.ok) return toast.error(res?.error || 'Modül import sırasında hata oluştu.');
      toast.success('Modül içe aktarıldı.');
      setFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Modül import sırasında hata oluştu.');
    }
  };

  return (
    <div className="border rounded-3 p-3">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
        <div>
          <div className="fw-semibold small">Modül Import</div>
          <div className="text-muted small">
            {module} modül tablolarını manifest sırasına göre içeri alır.
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
            Önce modül tablolarını TRUNCATE et
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
            SQL Metni
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={'nav-link py-1 px-2 ' + (tab === 'file' ? 'active' : '')}
            onClick={() => setTab('file')}
            disabled={busy}
          >
            Dosya
          </button>
        </li>
      </ul>

      {tab === 'text' && (
        <form onSubmit={handleSubmitText}>
          <div className="mb-2">
            <label className="form-label small">
              SQL Script <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control form-control-sm"
              rows={8}
              value={sqlText}
              onChange={(e) => setSqlText(e.target.value)}
              placeholder="Module SQL içeriğini buraya yapıştır."
              disabled={busy}
            />
          </div>
          <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
            {isLoading ? 'İçe aktarılıyor...' : "SQL'i Uygula"}
          </button>
        </form>
      )}

      {tab === 'file' && (
        <form onSubmit={handleSubmitFile}>
          <div className="mb-2">
            <label className="form-label small">
              Dosya (.sql / .gz) <span className="text-danger">*</span>
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
            {isLoading ? 'İçe aktarılıyor...' : 'Dosyadan İçe Aktar'}
          </button>
        </form>
      )}
    </div>
  );
};
