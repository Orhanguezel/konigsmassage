// =============================================================
// FILE: src/components/admin/availability/AvailabilityHeader.tsx
// konigsmassage – Admin Availability Header (filters + summary)
// FINAL — Turkish UI
// =============================================================

import React from 'react';
import Link from 'next/link';

import type { ResourceType } from '@/integrations/types';

export type AvailabilityFilters = {
  q: string;
  type: ResourceType | '';
  status: 'all' | 'active' | 'inactive';
};

export type AvailabilityHeaderProps = {
  filters: AvailabilityFilters;
  total: number;
  loading?: boolean;
  onFiltersChange: (next: AvailabilityFilters) => void;
  onRefresh?: () => void;
};

const RESOURCE_TYPE_OPTIONS: Array<{ value: ResourceType | ''; label: string }> = [
  { value: '', label: 'Tümü' },
  { value: 'therapist', label: 'Terapist' },
  { value: 'doctor', label: 'Doktor' },
  { value: 'table', label: 'Masa' },
  { value: 'room', label: 'Oda' },
  { value: 'staff', label: 'Personel' },
  { value: 'other', label: 'Diğer' },
];

export const AvailabilityHeader: React.FC<AvailabilityHeaderProps> = ({
  filters,
  total,
  loading,
  onFiltersChange,
  onRefresh,
}) => {
  return (
    <div className="card mb-3">
      <div className="card-body py-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
          <div style={{ minWidth: 0, flex: 2 }}>
            <div className="mb-2">
              <h5 className="mb-0 small fw-semibold">Müsaitlik Yönetimi</h5>
              <div className="text-muted small">
                Kaynakları (therapist/oda/masa vb.) ve haftalık çalışma saatlerini yönet. Gün bazlı
                iptal/override ve slot bazlı geçici değişiklikleri buradan yapacağız.
              </div>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-md-6">
                <label className="form-label small mb-1">Ara (ad / referans)</label>
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Örn: 'Anna', 'room-2'"
                  value={filters.q}
                  onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small mb-1">Tür</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.type}
                  onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as any })}
                >
                  {RESOURCE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label small mb-1">Durum</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
                >
                  <option value="all">Hepsi</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="border-start ps-lg-3 ms-lg-3 d-flex flex-column justify-content-between"
            style={{ minWidth: 0, flex: 1 }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <div className="small fw-semibold">Toplam</div>
                <div className="display-6 fs-4 fw-bold">{total}</div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {loading ? <span className="badge bg-secondary small">Yükleniyor...</span> : null}

                {onRefresh ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={onRefresh}
                  >
                    Yenile
                  </button>
                ) : null}
              </div>
            </div>

            <div className="text-muted small">
              <ul className="mb-0 ps-3">
                <li>Haftalık çalışma saatleri, plan/slot üretiminin kaynağıdır.</li>
                <li>Gün iptali (override-day) rezervasyonu kapatır.</li>
              </ul>
            </div>

            <div className="mt-2 d-flex justify-content-end">
              <Link href="/admin/availability/new" className="btn btn-primary btn-sm">
                Yeni Kaynak
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
