// =============================================================
// FILE: src/components/admin/db/fullDb/FullDbHeader.tsx
// =============================================================
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

import {
  useCreateDbSnapshotMutation,
  useExportSqlMutation,
  useExportJsonMutation,
} from '@/integrations/rtk/hooks';

import { buildDownloadName, triggerDownload } from '../shared/download';

export type FullDbHeaderProps = {
  onChanged?: () => void; // ✅ optional
};

export const FullDbHeader: React.FC<FullDbHeaderProps> = ({ onChanged }) => {
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  const [createSnapshot, { isLoading: isCreating }] = useCreateDbSnapshotMutation();
  const [exportSql, { isLoading: isExportingSql }] = useExportSqlMutation();
  const [exportJson, { isLoading: isExportingJson }] = useExportJsonMutation();

  const busy = isCreating || isExportingSql || isExportingJson;

  const handleCreateSnapshot = async () => {
    try {
      const body: { label?: string; note?: string } = {};
      if (label.trim()) body.label = label.trim();
      if (note.trim()) body.note = note.trim();

      const snap = await createSnapshot(body).unwrap();
      toast.success(`Snapshot oluşturuldu: ${snap.label || snap.filename || snap.id}`);

      setLabel('');
      setNote('');

      // ✅ call only if provided
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Snapshot oluşturulurken hata oluştu.');
    }
  };

  const handleExportSql = async () => {
    try {
      const blob = await exportSql().unwrap();
      triggerDownload(blob, buildDownloadName('db_backup', 'sql'));
      toast.success('SQL yedeği indirildi.');
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'DB export (SQL) sırasında hata oluştu.');
    }
  };

  const handleExportJson = async () => {
    try {
      const blob = await exportJson().unwrap();
      triggerDownload(blob, buildDownloadName('db_backup', 'json'));
      toast.success('JSON yedeği indirildi.');
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'DB export (JSON) sırasında hata oluştu.');
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body py-3">
        <div className="d-flex flex-column flex-lg-row gap-3 justify-content-between">
          <div style={{ minWidth: 0, flex: 2 }}>
            <div className="mb-2">
              <h5 className="mb-0 small fw-semibold">
                Veritabanı Yedekleme &amp; Snapshot Yönetimi
              </h5>
              <div className="text-muted small">
                Snapshot oluşturabilir ve tam veritabanı yedeği indirebilirsin.
              </div>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-sm-4">
                <label className="form-label small">Snapshot etiketi</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Örn: Güncel canlı sistem"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label small">Not (opsiyonel)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Bu snapshot neden alındı?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="col-sm-2 d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-primary btn-sm mt-3 mt-sm-0"
                  disabled={busy}
                  onClick={handleCreateSnapshot}
                >
                  {isCreating ? 'Oluşturuluyor...' : 'Snapshot Oluştur'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-start ps-lg-3 ms-lg-3" style={{ minWidth: 0, flex: 1 }}>
            <div className="small fw-semibold mb-1">Tam Veritabanı Yedeği İndir</div>
            <div className="text-muted small mb-2">Şu anki DB durumunu tam dump olarak indir.</div>
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={busy}
                onClick={handleExportSql}
              >
                {isExportingSql ? 'SQL hazırlanıyor...' : 'SQL İndir (.sql)'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={busy}
                onClick={handleExportJson}
              >
                {isExportingJson ? 'JSON hazırlanıyor...' : 'JSON İndir (.json)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
