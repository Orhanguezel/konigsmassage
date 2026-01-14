// =============================================================
// FILE: src/components/admin/bookings/BookingsHeader.tsx
// konigsmassage – Admin Bookings Header (Filters + Summary)
// FINAL — TR UI + filter key fix (is_read)
// =============================================================

import React from 'react';

export type BookingStatusFilter =
  | 'all'
  | 'new'
  | 'confirmed'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type BookingReadFilter = 'all' | 'unread' | 'read';

export type BookingsFilters = {
  q: string;
  status: BookingStatusFilter;
  is_read: BookingReadFilter;
  appointment_date: string; // YYYY-MM-DD
  resource_id: string;
  service_id: string;
};

export type BookingsHeaderProps = {
  filters: BookingsFilters;
  total: number;
  loading: boolean;
  onFiltersChange: (next: BookingsFilters) => void;
  onRefresh?: () => void;
};

export const BookingsHeader: React.FC<BookingsHeaderProps> = ({
  filters,
  total,
  loading,
  onFiltersChange,
  onRefresh,
}) => {
  const handleInput =
    (k: keyof BookingsFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onFiltersChange({ ...filters, [k]: e.target.value });
    };

  return (
    <div className="card mb-3">
      <div className="card-body py-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
          <div style={{ minWidth: 0, flex: 2 }}>
            <div className="mb-2">
              <h5 className="mb-0 small fw-semibold">Randevular</h5>
              <div className="text-muted small">Filtrele, görüntüle ve durum güncelle.</div>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label small mb-1">Arama</label>
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="İsim / Email / Telefon"
                  value={filters.q}
                  onChange={handleInput('q')}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small mb-1">Durum</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={handleInput('status')}
                >
                  <option value="all">Hepsi</option>
                  <option value="new">Yeni</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                  <option value="expired">Süresi Doldu</option>
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label small mb-1">Okunma</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.is_read}
                  onChange={handleInput('is_read')}
                >
                  <option value="all">Hepsi</option>
                  <option value="unread">Okunmadı</option>
                  <option value="read">Okundu</option>
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label small mb-1">Tarih</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={filters.appointment_date}
                  onChange={handleInput('appointment_date')}
                />
              </div>

              <div className="col-md-1">
                <label className="form-label small mb-1">Kaynak</label>
                <input
                  className="form-control form-control-sm"
                  value={filters.resource_id}
                  onChange={handleInput('resource_id')}
                  placeholder="(ops.)"
                />
              </div>

              <div className="col-md-1">
                <label className="form-label small mb-1">Servis</label>
                <input
                  className="form-control form-control-sm"
                  value={filters.service_id}
                  onChange={handleInput('service_id')}
                  placeholder="(ops.)"
                />
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

              {onRefresh ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Yenile
                </button>
              ) : null}
            </div>

            <div className="d-flex justify-content-end">
              {loading ? <span className="badge bg-secondary small">Yükleniyor...</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
