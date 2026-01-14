// =============================================================
// FILE: src/components/admin/db/DbSnapshotsTable.tsx
// konigsmassage – Admin DB Snapshot Tablosu
// Fix: layout + responsive (xl+ table, <xl cards), no cut buttons, stable widths
// =============================================================

'use client';

import React, { useMemo } from 'react';
import { toast } from 'sonner';
import type { DbSnapshot } from '@/integrations/types';
import {
  useRestoreDbSnapshotMutation,
  useDeleteDbSnapshotMutation,
} from '@/integrations/rtk/hooks';

/* ---------------- Types ---------------- */

export type SnapshotsTableProps = {
  items?: DbSnapshot[];
  loading: boolean;
  refetch: () => void;
};

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

function formatDate(value: string | null | undefined, locale = 'tr-TR'): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return safeText(value) || '-';
    return d.toLocaleString(locale);
  } catch {
    return safeText(value) || '-';
  }
}

function formatSize(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

const noWrapEllipsis: React.CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const askConfirm = (message: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.confirm(message);
};

export const SnapshotsTable: React.FC<SnapshotsTableProps> = ({ items, loading, refetch }) => {
  const rows = items || [];
  const hasData = rows.length > 0;

  const [restoreSnapshot, { isLoading: isRestoring }] = useRestoreDbSnapshotMutation();
  const [deleteSnapshot, { isLoading: isDeleting }] = useDeleteDbSnapshotMutation();

  const busy = loading || isRestoring || isDeleting;

  const totalLabel = useMemo(() => {
    const n = rows.length;
    return Number.isFinite(n) ? n : 0;
  }, [rows.length]);

  const handleRestore = async (snap: DbSnapshot) => {
    const label = snap.label || snap.filename || snap.id;

    const ok = askConfirm(
      `Bu snapshot'tan geri yükleme yapacaksın.\n\n` +
        `Snapshot: ${label}\n\n` +
        `Bu işlem mevcut veritabanı içeriğini EZER (truncate).\nDevam etmek istiyor musun?`,
    );
    if (!ok) return;

    try {
      const res = await restoreSnapshot({
        id: snap.id,
        dryRun: false,
        truncateBefore: true,
      }).unwrap();

      if (res?.ok === false) {
        toast.error(res.error || 'Snapshot geri yükleme sırasında bir hata oluştu.');
      } else {
        toast.success('Snapshot başarıyla geri yüklendi.');
      }

      refetch();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Snapshot restore failed';
      toast.error(msg);
    }
  };

  const handleDelete = async (snap: DbSnapshot) => {
    const label = snap.label || snap.filename || snap.id;

    const ok = askConfirm(
      `Bu snapshot dosyasını silmek üzeresin.\n\n` +
        `Snapshot: ${label}\n\n` +
        `Devam etmek istiyor musun?`,
    );
    if (!ok) return;

    try {
      const res = await deleteSnapshot({ id: snap.id }).unwrap();
      if (res?.ok === false) {
        toast.error(res.message || 'Snapshot silinemedi.');
      } else {
        toast.success(res.message || 'Snapshot silindi.');
      }
      refetch();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Snapshot delete failed';
      toast.error(msg);
    }
  };

  return (
    <div className="card">
      <div className="card-header py-2 d-flex align-items-center justify-content-between">
        <span className="small fw-semibold">Snapshot Noktaları</span>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {busy && <span className="badge bg-secondary small">İşlem yapılıyor...</span>}
          <span className="text-muted small">
            Toplam: <strong>{totalLabel}</strong>
          </span>
        </div>
      </div>

      <div className="card-body p-0">
        {/* ================= TABLE (xl+) ================= */}
        <div className="d-none d-xl-block">
          <div className="table-responsive">
            <table
              className="table table-hover table-sm mb-0 align-middle"
              style={{
                width: '100%',
                minWidth: 980, // önemli: dar container’da header/cell parçalanmasın
                tableLayout: 'fixed',
              }}
            >
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap" style={{ width: 64 }}>
                    #
                  </th>

                  <th className="text-nowrap" style={{ width: 280 }}>
                    Etiket / Not
                  </th>

                  <th className="text-nowrap" style={{ width: 380 }}>
                    Dosya
                  </th>

                  <th className="text-nowrap" style={{ width: 200 }}>
                    Oluşturulma
                  </th>

                  <th className="text-nowrap" style={{ width: 120 }}>
                    Boyut
                  </th>

                  <th className="text-nowrap text-end" style={{ width: 220 }}>
                    İşlemler
                  </th>
                </tr>
              </thead>

              <tbody>
                {hasData ? (
                  rows.map((s, idx) => {
                    const label = safeText(s.label).trim();
                    const note = safeText(s.note).trim();
                    const filename = safeText(s.filename).trim();
                    const id = safeText(s.id).trim();

                    return (
                      <tr key={id || `${idx}`}>
                        <td className="text-muted small text-nowrap">{idx + 1}</td>

                        <td style={{ minWidth: 0 }}>
                          <div
                            className="fw-semibold small"
                            style={noWrapEllipsis}
                            title={label || 'Etiket yok'}
                          >
                            {label || <span className="text-muted">Etiket yok</span>}
                          </div>

                          {note ? (
                            <div className="text-muted small" style={noWrapEllipsis} title={note}>
                              {note}
                            </div>
                          ) : (
                            <div className="text-muted small">-</div>
                          )}
                        </td>

                        <td style={{ minWidth: 0 }}>
                          <div style={noWrapEllipsis} title={filename || '-'}>
                            <code className="small">{filename || '-'}</code>
                          </div>
                          <div className="text-muted small" style={noWrapEllipsis} title={id}>
                            ID: <code className="small">{id}</code>
                          </div>
                        </td>

                        <td className="text-muted small text-nowrap">{formatDate(s.created_at)}</td>

                        <td className="small text-nowrap">{formatSize(s.size_bytes ?? null)}</td>

                        <td className="text-end">
                          <div className="d-inline-flex gap-1 flex-nowrap">
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm text-nowrap"
                              disabled={busy}
                              onClick={() => handleRestore(s)}
                            >
                              Geri Yükle
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm text-nowrap"
                              disabled={busy}
                              onClick={() => handleDelete(s)}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="text-center text-muted small py-3">
                        {loading ? 'Yükleniyor...' : 'Henüz kayıtlı snapshot bulunmuyor.'}
                      </div>
                    </td>
                  </tr>
                )}

                {loading && hasData && (
                  <tr>
                    <td colSpan={6} className="text-center py-3 text-muted small">
                      Yükleniyor...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table alt bilgi: yatay scroll varsa kullanıcı anlasın */}
          <div className="px-3 py-2 border-top">
            <span className="text-muted small">Not: Ekran dar ise tablo yatay kaydırılabilir.</span>
          </div>
        </div>

        {/* ================= CARDS (< xl) ================= */}
        <div className="d-block d-xl-none">
          {!hasData && !loading ? (
            <div className="px-3 py-3 text-center text-muted small">
              Henüz kayıtlı snapshot bulunmuyor.
            </div>
          ) : loading && !hasData ? (
            <div className="px-3 py-3 text-center text-muted small">Yükleniyor...</div>
          ) : (
            <div className="p-2">
              <div className="row g-2">
                {rows.map((s, idx) => {
                  const label = safeText(s.label).trim();
                  const note = safeText(s.note).trim();
                  const filename = safeText(s.filename).trim();
                  const id = safeText(s.id).trim();

                  return (
                    <div key={id || `${idx}`} className="col-12">
                      <div className="border rounded-3 p-3 bg-white">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="d-flex flex-wrap gap-2">
                            <span className="badge bg-light text-dark border">#{idx + 1}</span>
                            <span className="badge bg-secondary-subtle text-muted border">
                              {formatSize(s.size_bytes ?? null)}
                            </span>
                            <span className="badge bg-light text-dark border">
                              {formatDate(s.created_at)}
                            </span>
                          </div>

                          <div className="d-flex gap-2 flex-wrap justify-content-end">
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              disabled={busy}
                              onClick={() => handleRestore(s)}
                            >
                              Geri Yükle
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              disabled={busy}
                              onClick={() => handleDelete(s)}
                            >
                              Sil
                            </button>
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>
                            {label || <span className="text-muted">Etiket yok</span>}
                          </div>
                          {note ? (
                            <div
                              className="text-muted small mt-1"
                              style={{ wordBreak: 'break-word' }}
                            >
                              {note}
                            </div>
                          ) : (
                            <div className="text-muted small mt-1">-</div>
                          )}
                        </div>

                        <div className="mt-2 text-muted small" style={{ wordBreak: 'break-word' }}>
                          <div className="fw-semibold text-dark small">Dosya</div>
                          <code>{filename || '-'}</code>
                        </div>

                        <div className="mt-2 text-muted small" style={{ wordBreak: 'break-word' }}>
                          <div className="fw-semibold text-dark small">ID</div>
                          <code>{id}</code>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && hasData && (
                  <div className="col-12">
                    <div className="text-center text-muted small py-2">Yükleniyor...</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
