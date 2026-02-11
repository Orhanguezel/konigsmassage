// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/fullDb/FullDbHeader.tsx
// =============================================================
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

import {
  useCreateDbSnapshotMutation,
  useExportSqlMutation,
  // useExportJsonMutation, // TODO: Backend endpoint not implemented yet
} from '@/integrations/hooks';

import { buildDownloadName, triggerDownload } from '../shared/download';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type FullDbHeaderProps = {
  onChanged?: () => void; // ✅ optional
};

export const FullDbHeader: React.FC<FullDbHeaderProps> = ({ onChanged }) => {
  const t = useAdminT();
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  const [createSnapshot, { isLoading: isCreating }] = useCreateDbSnapshotMutation();
  const [exportSql, { isLoading: isExportingSql }] = useExportSqlMutation();
  // const [exportJson, { isLoading: isExportingJson }] = useExportJsonMutation(); // TODO: Not implemented

  const busy = isCreating || isExportingSql; // || isExportingJson;

  const handleCreateSnapshot = async () => {
    try {
      const body: { label?: string; note?: string } = {};
      if (label.trim()) body.label = label.trim();
      if (note.trim()) body.note = note.trim();

      const snap = await createSnapshot(body).unwrap();
      toast.success(t('admin.db.fullDb.snapshotCreated', { label: snap.label || snap.filename || snap.id }));

      setLabel('');
      setNote('');

      // ✅ call only if provided
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('admin.db.fullDb.snapshotError'));
    }
  };

  const handleExportSql = async () => {
    try {
      const blob = await exportSql().unwrap();
      triggerDownload(blob, buildDownloadName('db_backup', 'sql'));
      toast.success(t('admin.db.fullDb.exportSuccess'));
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('admin.db.fullDb.exportError'));
    }
  };

  const handleExportJson = async () => {
    // TODO: Backend JSON export endpoint not implemented yet
    toast.info(t('admin.db.fullDb.jsonNotImplemented'));
    /* try {
      const blob = await exportJson().unwrap();
      triggerDownload(blob, buildDownloadName('db_backup', 'json'));
      toast.success('JSON yedeği indirildi.');
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'DB export (JSON) sırasında hata oluştu.');
    } */
  };

  return (
    <div className="card mb-3">
      <div className="card-body py-3">
        <div className="d-flex flex-column flex-lg-row gap-3 justify-content-between">
          <div style={{ minWidth: 0, flex: 2 }}>
            <div className="mb-2">
              <h5 className="mb-0 small fw-semibold">
                {t('admin.db.fullDb.title')}
              </h5>
              <div className="text-muted small">
                {t('admin.db.fullDb.description')}
              </div>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-sm-4">
                <label className="form-label small">{t('admin.db.fullDb.snapshotLabel')}</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder={t('admin.db.fullDb.snapshotPlaceholder')}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label small">{t('admin.db.fullDb.noteLabel')}</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder={t('admin.db.fullDb.notePlaceholder')}
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
                  {isCreating ? t('admin.db.fullDb.creating') : t('admin.db.fullDb.createButton')}
                </button>
              </div>
            </div>
          </div>

          <div className="border-start ps-lg-3 ms-lg-3" style={{ minWidth: 0, flex: 1 }}>
            <div className="small fw-semibold mb-1">{t('admin.db.fullDb.downloadTitle')}</div>
            <div className="text-muted small mb-2">{t('admin.db.fullDb.downloadDesc')}</div>
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={busy}
                onClick={handleExportSql}
              >
                {isExportingSql ? t('admin.db.fullDb.sqlPreparing') : t('admin.db.fullDb.sqlButton')}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={busy}
                onClick={handleExportJson}
              >
                {t('admin.db.fullDb.jsonButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
