// =============================================================
// FILE: src/components/admin/availability/AvailabilityList.tsx
// konigsmassage – Admin Availability List (resources)
// FINAL — Responsive (mobile cards + desktop table) + no technical ID display + lint fix
// =============================================================

import React, { useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import type { ResourceAdminListItemDto, ResourceType } from '@/integrations/types';
import { useDeleteResourceAdminMutation } from '@/integrations/rtk/hooks';

export type AvailabilityListProps = {
  items?: ResourceAdminListItemDto[];
  loading: boolean;
};

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return safeText(value);
  return d.toLocaleString();
};

const typeLabel = (t: ResourceType | string | null | undefined) => {
  const v = String(t ?? '').trim();
  switch (v) {
    case 'therapist':
      return 'Terapist';
    case 'doctor':
      return 'Doktor';
    case 'table':
      return 'Masa';
    case 'room':
      return 'Oda';
    case 'staff':
      return 'Personel';
    case 'other':
      return 'Diğer';
    default:
      return v || '-';
  }
};

// uzun ref'leri kısalt (istersen tamamen gizleyebiliriz)
const shortRef = (v: string, head = 8, tail = 4) => {
  const s = String(v || '').trim();
  if (!s) return '';
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}...${s.slice(-tail)}`;
};

export const AvailabilityList: React.FC<AvailabilityListProps> = ({ items, loading }) => {
  // ✅ LINT FIX: rows stabil referans
  const rows = useMemo(() => items ?? [], [items]);
  const hasData = rows.length > 0;

  const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceAdminMutation();
  const busy = loading || isDeleting;

  const handleDelete = async (r: ResourceAdminListItemDto) => {
    const ok = window.confirm(
      `Bu kaynağı silmek üzeresin.\n\n` +
        `Ad: ${r.title ?? '(ad yok)'}\n` +
        `Tür: ${typeLabel(r.type as any)}\n` +
        `Referans: ${r.external_ref_id ? String(r.external_ref_id) : '-'}\n\n` +
        `Devam etmek istiyor musun?`,
    );
    if (!ok) return;

    try {
      await deleteResource(r.id).unwrap();
      toast.success('Kaynak silindi.');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silme sırasında hata oluştu.');
    }
  };

  const renderEmptyOrLoading = () => {
    if (loading) return <div className="text-muted small p-3">Yükleniyor...</div>;
    return <div className="text-muted small p-3">Henüz kayıt yok.</div>;
  };

  const statusBadge = (r: ResourceAdminListItemDto) => {
    const active = Number((r as any).is_active ?? 0) === 1 || (r as any).is_active === true;
    return active ? (
      <span className="badge bg-success-subtle text-success border border-success-subtle">
        Aktif
      </span>
    ) : (
      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
        Pasif
      </span>
    );
  };

  const normalized = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        _created: formatDate(r.created_at as any),
        _updated: formatDate(r.updated_at as any),
        _typeLabel: typeLabel(r.type as any),
        _refFull: r.external_ref_id ? String(r.external_ref_id) : '',
        _refShort: r.external_ref_id ? shortRef(String(r.external_ref_id)) : '',
      })),
    [rows],
  );

  if (!hasData) {
    return (
      <div className="card">
        <div className="card-header py-2">
          <div className="d-flex align-items-center justify-content-between">
            <span className="small fw-semibold">Kaynaklar</span>
            {loading ? <span className="badge bg-secondary small">Yükleniyor...</span> : null}
          </div>
        </div>
        <div className="card-body p-0">{renderEmptyOrLoading()}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header py-2">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span className="small fw-semibold">Kaynaklar</span>
          <div className="d-flex align-items-center gap-2">
            {busy ? <span className="badge bg-secondary small">İşlem yapılıyor...</span> : null}
            <span className="text-muted small">
              Toplam: <strong>{rows.length}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {/* ✅ MOBILE: Card list (responsive) */}
        <div className="d-block d-lg-none">
          <div className="list-group list-group-flush">
            {normalized.map((r, idx) => (
              <div key={r.id} className="list-group-item">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <div style={{ minWidth: 0 }}>
                    <div className="text-muted small">#{idx + 1}</div>
                    <div className="fw-semibold text-truncate" title={safeText(r.title)}>
                      {r.title || <span className="text-muted">(ad yok)</span>}
                    </div>

                    {/* ID yok — istersen referansı da tamamen kapatabiliriz */}
                    {r._refFull ? (
                      <div className="text-muted small text-truncate" title={r._refFull}>
                        Referans: <code>{r._refShort}</code>
                      </div>
                    ) : (
                      <div className="text-muted small">(referans yok)</div>
                    )}

                    <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                      <span className="badge bg-light text-dark border">{r._typeLabel}</span>
                      {statusBadge(r)}
                    </div>

                    <div className="mt-2 small">
                      <div className="text-muted">Güncellendi: {r._updated}</div>
                      <div className="text-muted">Oluşturma: {r._created}</div>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <Link
                      href={`/admin/availability/${encodeURIComponent(r.id)}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Yönet
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={busy}
                      onClick={() => handleDelete(r)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ DESKTOP: Table */}
        <div className="table-responsive d-none d-lg-block">
          <table className="table table-hover table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-muted" style={{ width: 56 }}>
                  #
                </th>
                <th>Ad</th>
                <th className="text-nowrap">Tür</th>
                <th className="text-nowrap">Durum</th>
                <th className="text-nowrap">Güncellendi</th>
                <th className="text-end text-nowrap">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {normalized.map((r, idx) => (
                <tr key={r.id}>
                  <td className="text-muted small text-nowrap">{idx + 1}</td>

                  <td style={{ minWidth: 220 }}>
                    <div className="fw-semibold text-truncate" title={safeText(r.title)}>
                      {r.title || <span className="text-muted">(ad yok)</span>}
                    </div>
                  </td>

                  <td className="text-nowrap">
                    <span className="badge bg-light text-dark border">{r._typeLabel}</span>
                  </td>

                  <td className="text-nowrap">{statusBadge(r)}</td>

                  <td className="small text-nowrap">
                    <div title={r._updated}>{r._updated}</div>
                    <div className="text-muted small" title={r._created}>
                      Oluşturma: {r._created}
                    </div>
                  </td>

                  <td className="text-end text-nowrap">
                    <div className="btn-group btn-group-sm" role="group">
                      <Link
                        href={`/admin/availability/${encodeURIComponent(r.id)}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        Yönet
                      </Link>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        disabled={busy}
                        onClick={() => handleDelete(r)}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
