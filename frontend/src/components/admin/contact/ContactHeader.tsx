// =============================================================
// FILE: src/components/admin/contact/ContactHeader.tsx
// Admin Contact Listesi – Üst Filtre Barı
// =============================================================

import React from 'react';
import type { ContactStatus } from '@/integrations/types';

interface ContactHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;

  status: '' | ContactStatus;
  onStatusChange: (v: '' | ContactStatus) => void;

  showOnlyUnresolved: boolean;
  onShowOnlyUnresolvedChange: (v: boolean) => void;

  orderBy: 'created_at' | 'updated_at' | 'status' | 'name';
  order: 'asc' | 'desc';
  onOrderByChange: (v: 'created_at' | 'updated_at' | 'status' | 'name') => void;
  onOrderChange: (v: 'asc' | 'desc') => void;

  loading: boolean;
  onRefresh: () => void;

  total: number;
}

export const ContactHeader: React.FC<ContactHeaderProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  showOnlyUnresolved,
  onShowOnlyUnresolvedChange,
  orderBy,
  order,
  onOrderByChange,
  onOrderChange,
  loading,
  onRefresh,
  total,
}) => {
  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-md-4">
            <label className="form-label small mb-1">
              Arama (isim, email, telefon, konu, mesaj)
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Ara..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="col-md-3">
            <label className="form-label small mb-1">Durum</label>
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => onStatusChange((e.target.value || '') as '' | ContactStatus)}
            >
              <option value="">Tümü</option>
              <option value="new">Yeni</option>
              <option value="in_progress">Üzerinde Çalışılıyor</option>
              <option value="closed">Kapalı</option>
            </select>
          </div>

          {/* Resolved filter */}
          <div className="col-md-2 d-flex align-items-end">
            <div className="form-check form-switch small mt-3 mt-md-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="filter-unresolved"
                checked={showOnlyUnresolved}
                onChange={(e) => onShowOnlyUnresolvedChange(e.target.checked)}
              />
              <label className="form-check-label ms-1" htmlFor="filter-unresolved">
                Sadece çözülmemişler
              </label>
            </div>
          </div>

          {/* Order */}
          <div className="col-md-3">
            <div className="row g-1">
              <div className="col-7">
                <label className="form-label small mb-1">Sırala (orderBy)</label>
                <select
                  className="form-select form-select-sm"
                  value={orderBy}
                  onChange={(e) =>
                    onOrderByChange(
                      e.target.value as 'created_at' | 'updated_at' | 'status' | 'name',
                    )
                  }
                >
                  <option value="created_at">Oluşturma tarihi</option>
                  <option value="updated_at">Güncelleme tarihi</option>
                  <option value="status">Durum</option>
                  <option value="name">İsim</option>
                </select>
              </div>
              <div className="col-5">
                <label className="form-label small mb-1">Yön</label>
                <select
                  className="form-select form-select-sm"
                  value={order}
                  onChange={(e) => onOrderChange(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Alt satır: toplam + refresh */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="small text-muted">
            Toplam: <strong>{total}</strong> kayıt
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Yenileniyor...' : 'Yenile'}
          </button>
        </div>
      </div>
    </div>
  );
};
