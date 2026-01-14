// =============================================================
// FILE: src/components/admin/users/UsersList.tsx
// konigsmassage – Admin Users Liste Bileşeni
// (Bootstrap table + mobile cards + client-side pagination)
// =============================================================

import React, { useEffect, useState } from 'react';
import type { AdminUserDto } from '@/integrations/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const PAGE_SIZE = 20;

export type UsersListProps = {
  items?: AdminUserDto[];
  loading: boolean;

  onEdit?: (user: AdminUserDto) => void;
  onToggleActive?: (user: AdminUserDto, value: boolean) => void;
  onDelete?: (user: AdminUserDto) => void;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

// 0/1, "1", true -> boolean
const isTruthy = (v: unknown): boolean => v === 1 || v === '1' || v === true;

export const UsersList: React.FC<UsersListProps> = ({
  items,
  loading,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  const rows = items || [];
  const totalItems = rows.length;
  const hasData = totalItems > 0;

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => {
      const maxPage = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
      return Math.min(prev, maxPage);
    });
  }, [totalItems]);

  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageRows = rows.slice(startIndex, endIndex);

  const buildPages = () => {
    const pages: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i += 1) pages.push(i);
      return pages;
    }

    pages.push(1);
    const siblings = 1;
    let left = Math.max(2, currentPage - siblings);
    let right = Math.min(pageCount - 1, currentPage + siblings);

    if (left > 2) {
      pages.push('ellipsis-left');
    } else {
      left = 2;
    }

    for (let i = left; i <= right; i += 1) pages.push(i);

    if (right < pageCount - 1) {
      pages.push('ellipsis-right');
    } else {
      right = pageCount - 1;
    }

    pages.push(pageCount);
    return pages;
  };

  const pages = buildPages();

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return;
    setPage(nextPage);
  };

  const renderRoleBadge = (role: AdminUserDto['role']) => {
    const label = role?.toUpperCase?.() ?? 'USER';
    const cls =
      role === 'admin'
        ? 'bg-danger'
        : role === 'moderator'
        ? 'bg-warning text-dark'
        : 'bg-secondary';
    return (
      <span className={`badge ${cls} ms-1`} style={{ fontSize: '0.7rem' }}>
        {label}
      </span>
    );
  };

  const renderStatusBadge = (u: AdminUserDto) => {
    const isActive = isTruthy(u.is_active as unknown);
    const verified = isTruthy(u.email_verified as unknown);
    return (
      <div className="d-flex flex-column gap-1 small">
        <span
          className={
            'badge rounded-pill ' +
            (isActive ? 'bg-success-subtle text-success' : 'bg-light text-muted')
          }
        >
          {isActive ? 'Aktif' : 'Pasif'}
        </span>
        <span
          className={
            'badge rounded-pill ' +
            (verified ? 'bg-primary-subtle text-primary' : 'bg-light text-muted')
          }
        >
          {verified ? 'E-posta doğrulandı' : 'E-posta doğrulanmadı'}
        </span>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header py-2 d-flex align-items-center justify-content-between">
        <span className="small fw-semibold">Kullanıcı Listesi</span>
        <div className="d-flex align-items-center gap-2">
          {loading && <span className="badge bg-secondary">Yükleniyor...</span>}
          <span className="text-muted small">
            Toplam: <strong>{totalItems}</strong>
          </span>
        </div>
      </div>

      <div className="card-body p-0">
        {/* Desktop / tablet */}
        <div className="d-none d-md-block">
          <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '30%' }}>Kullanıcı</th>
                <th style={{ width: '15%' }}>Rol</th>
                <th style={{ width: '15%' }}>Durum</th>
                <th style={{ width: '20%' }}>Tarihçeler</th>
                <th style={{ width: '15%' }} className="text-end">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {hasData ? (
                pageRows.map((u, index) => {
                  const globalIndex = startIndex + index;
                  const isActive = isTruthy(u.is_active as unknown);
                  return (
                    <tr key={u.id}>
                      <td className="text-muted small">{globalIndex + 1}</td>
                      <td>
                        <div className="fw-semibold small">
                          {u.full_name || <span className="text-muted">İsim yok</span>}
                          {renderRoleBadge(u.role)}
                        </div>
                        <div className="text-muted small">
                          <code>{u.email}</code>
                        </div>
                        {u.phone && <div className="text-muted small">{u.phone}</div>}
                      </td>
                      <td className="small">
                        <div>{u.role.toUpperCase()}</div>
                      </td>
                      <td>{renderStatusBadge(u)}</td>
                      <td className="small">
                        <div>
                          <span className="text-muted me-1">Kayıt:</span>
                          {formatDate(u.created_at)}
                        </div>
                        <div>
                          <span className="text-muted me-1">Son giriş:</span>
                          {formatDate(u.last_login_at)}
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          {onToggleActive && (
                            <button
                              type="button"
                              className={
                                'btn btn-sm ' +
                                (isActive ? 'btn-outline-warning' : 'btn-outline-success')
                              }
                              onClick={() => onToggleActive(u, !isActive)}
                            >
                              {isActive ? 'Pasif yap' : 'Aktif yap'}
                            </button>
                          )}
                          {onEdit && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => onEdit(u)}
                            >
                              Düzenle
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => onDelete(u)}
                            >
                              Sil
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="text-center text-muted small py-3">
                      Kayıtlı kullanıcı bulunamadı.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile – card görünümü */}
        <div className="d-block d-md-none">
          {hasData ? (
            pageRows.map((u, index) => {
              const globalIndex = startIndex + index;
              const isActive = isTruthy(u.is_active as unknown);
              return (
                <div key={u.id} className="border-bottom px-3 py-2">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="fw-semibold small">
                        <span className="text-muted me-1">#{globalIndex + 1}</span>
                        {u.full_name || <span className="text-muted">İsim yok</span>}
                        {renderRoleBadge(u.role)}
                      </div>
                      <div className="text-muted small">
                        <code>{u.email}</code>
                      </div>
                      {u.phone && <div className="text-muted small">{u.phone}</div>}
                      <div className="mt-1">{renderStatusBadge(u)}</div>
                      <div className="text-muted small mt-1">
                        <div>
                          <span className="me-1">Kayıt:</span>
                          {formatDate(u.created_at)}
                        </div>
                        <div>
                          <span className="me-1">Son giriş:</span>
                          {formatDate(u.last_login_at)}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-column align-items-end gap-1">
                      {onToggleActive && (
                        <button
                          type="button"
                          className={
                            'btn btn-sm w-100 ' +
                            (isActive ? 'btn-outline-warning' : 'btn-outline-success')
                          }
                          onClick={() => onToggleActive(u, !isActive)}
                        >
                          {isActive ? 'Pasif yap' : 'Aktif yap'}
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm w-100"
                          onClick={() => onEdit(u)}
                        >
                          Düzenle
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm w-100"
                          onClick={() => onDelete(u)}
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center text-muted small">
              Kayıtlı kullanıcı bulunamadı.
            </div>
          )}
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="py-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                  />
                </PaginationItem>

                {pages.map((p, idx) =>
                  typeof p === 'number' ? (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={`${p}-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};
