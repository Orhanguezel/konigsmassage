// =============================================================
// FILE: src/components/admin/users/UsersHeader.tsx
// konigsmassage – Admin Users Header (filtreler + search + refresh)
// =============================================================

import React from 'react';
import type { AdminUserRoleName } from '@/integrations/types';

export type UsersHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;

  roleFilter: '' | AdminUserRoleName;
  onRoleFilterChange: (value: '' | AdminUserRoleName) => void;

  showOnlyActive: boolean;
  onShowOnlyActiveChange: (value: boolean) => void;

  loading: boolean;
  onRefresh: () => void;
};

export const UsersHeader: React.FC<UsersHeaderProps> = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  showOnlyActive,
  onShowOnlyActiveChange,
  loading,
  onRefresh,
}) => {
  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-md-4">
            <label className="form-label small mb-1">Arama (e-posta / ad)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="E-posta veya ad ile ara..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Role filter */}
          <div className="col-md-3">
            <label className="form-label small mb-1">Rol</label>
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => onRoleFilterChange((e.target.value || '') as '' | AdminUserRoleName)}
            >
              <option value="">Tümü</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Only active */}
          <div className="col-md-2 d-flex align-items-center">
            <div className="form-check form-switch mt-3 mt-md-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="users-only-active"
                checked={showOnlyActive}
                onChange={(e) => onShowOnlyActiveChange(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="users-only-active">
                Sadece aktifler
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="col-md-3 d-flex justify-content-md-end align-items-center mt-2 mt-md-4">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? 'Yenileniyor...' : 'Yenile'}
            </button>

            {/* Şimdilik create yok; istersen buraya 'Yeni Kullanıcı' butonu ekleriz */}
          </div>
        </div>
      </div>
    </div>
  );
};
