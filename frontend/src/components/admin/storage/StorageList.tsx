// =============================================================
// FILE: src/components/admin/storage/StorageList.tsx
// konigsmassage – Storage Liste Bileşeni (tablo + mobil kart + pagination)
// =============================================================

import React from 'react';
import type { StorageAsset } from '@/integrations/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import ImageNext from 'next/image';

export type StorageListProps = {
  items?: StorageAsset[];
  loading: boolean;

  page: number; // 1-based
  pageSize: number;
  total: number; // backend'den gelen total (x-total-count)

  onPageChange: (page: number) => void;

  onPreview?: (item: StorageAsset) => void;
  onDelete?: (item: StorageAsset) => void;
};

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

function isImage(mime: string | null | undefined): boolean {
  return !!mime && mime.startsWith('image/');
}

const buildPages = (current: number, pageCount: number) => {
  const pages: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [];
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i += 1) pages.push(i);
    return pages;
  }

  pages.push(1);
  const siblings = 1;
  let left = Math.max(2, current - siblings);
  let right = Math.min(pageCount - 1, current + siblings);

  if (left > 2) {
    pages.push('ellipsis-left');
  } else {
    left = 2;
  }

  for (let i = left; i <= right; i += 1) {
    pages.push(i);
  }

  if (right < pageCount - 1) {
    pages.push('ellipsis-right');
  } else {
    right = pageCount - 1;
  }

  pages.push(pageCount);
  return pages;
};

export const StorageList: React.FC<StorageListProps> = ({
  items,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPreview,
  onDelete,
}) => {
  const rows = items || [];
  const hasData = rows.length > 0;
  const pageCount = Math.max(1, Math.ceil((total || rows.length || 0) / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const pages = buildPages(currentPage, pageCount);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return;
    onPageChange(nextPage);
  };

  return (
    <div className="card">
      <div className="card-header py-2 d-flex align-items-center justify-content-between">
        <span className="small fw-semibold">Dosya Listesi</span>
        <div className="d-flex align-items-center gap-2">
          {loading && <span className="badge bg-secondary">Yükleniyor...</span>}
          <span className="text-muted small">
            Sayfa {currentPage} / {pageCount}
          </span>
        </div>
      </div>

      <div className="card-body p-0">
        {/* ========= Desktop / Tablet (md ve üstü) – Table görünümü ========= */}
        <div className="d-none d-md-block">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>Önizleme</th>
                <th style={{ width: '20%' }}>Ad</th>
                <th style={{ width: '22%' }}>Path</th>
                <th style={{ width: '10%' }}>Bucket</th>
                <th style={{ width: '10%' }}>Klasör</th>
                <th style={{ width: '10%' }}>Boyut</th>
                <th style={{ width: '10%' }}>MIME</th>
                <th style={{ width: '10%' }}>Güncellenme</th>
                <th style={{ width: '10%' }} className="text-end">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {hasData ? (
                rows.map((item, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr key={item.id}>
                      {/* Önizleme */}
                      <td className="align-middle">
                        {isImage(item.mime) && item.url ? (
                          <ImageNext
                            src={item.url}
                            alt={item.name}
                            width={64}
                            height={40}
                            className="img-thumbnail"
                            style={{
                              maxWidth: 64,
                              maxHeight: 40,
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <span className="text-muted small">#{globalIndex}</span>
                        )}
                      </td>

                      {/* Ad */}
                      <td className="align-middle">
                        <div className="fw-semibold small">{item.name}</div>
                        <div className="text-muted small">
                          ID: <code className="small">{item.id.slice(0, 8)}...</code>
                        </div>
                      </td>

                      {/* Path */}
                      <td className="align-middle">
                        <code className="small">{item.path}</code>
                      </td>

                      {/* Bucket */}
                      <td className="align-middle">
                        <span className="badge bg-light text-dark border small">{item.bucket}</span>
                      </td>

                      {/* Folder */}
                      <td className="align-middle small">
                        {item.folder || <span className="text-muted">-</span>}
                      </td>

                      {/* Boyut */}
                      <td className="align-middle small">{formatBytes(item.size)}</td>

                      {/* MIME */}
                      <td className="align-middle small">
                        {item.mime || <span className="text-muted">-</span>}
                      </td>

                      {/* Güncellenme */}
                      <td className="align-middle">
                        <span className="text-muted small">
                          {item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td className="align-middle text-end">
                        <div className="d-inline-flex gap-1">
                          {onPreview && item.url && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => onPreview(item)}
                            >
                              Görüntüle
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => onDelete(item)}
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
                  <td colSpan={9}>
                    <div className="text-center text-muted small py-3">Kayıt bulunamadı.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ========= Mobil (sm ve altı) – Card görünümü ========= */}
        <div className="d-block d-md-none">
          {hasData ? (
            rows.map((item, index) => {
              const globalIndex = (currentPage - 1) * pageSize + index + 1;
              return (
                <div key={item.id} className="border-bottom px-3 py-2 d-flex gap-2">
                  {isImage(item.mime) && item.url && (
                    <div style={{ minWidth: 80 }}>
                      <ImageNext
                        src={item.url}
                        alt={item.name}
                        width={80}
                        height={40}
                        className="img-fluid rounded"
                        style={{ maxHeight: 80, objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">
                      <span className="text-muted me-1">#{globalIndex}</span>
                      {item.name}
                    </div>
                    <div className="text-muted small">
                      <code>{item.path}</code>
                    </div>
                    <div className="text-muted small mt-1">
                      <span className="me-1">Bucket:</span>
                      <span className="badge bg-light text-dark border">{item.bucket}</span>
                    </div>
                    <div className="text-muted small mt-1">
                      <span className="me-1">Klasör:</span>
                      {item.folder || <span className="text-muted">-</span>}
                    </div>
                    <div className="text-muted small mt-1">
                      <span className="me-1">Boyut:</span>
                      {formatBytes(item.size)}
                    </div>
                    <div className="text-muted small mt-1">
                      <span className="me-1">MIME:</span>
                      {item.mime}
                    </div>
                    <div className="text-muted small mt-1">
                      <span className="me-1">Güncellenme:</span>
                      {item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}
                    </div>
                    <div className="d-flex gap-1 mt-2">
                      {onPreview && item.url && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => onPreview(item)}
                        >
                          Görüntüle
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onDelete(item)}
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
            <div className="px-3 py-3 text-center text-muted small">Kayıt bulunamadı.</div>
          )}
        </div>

        {/* ========= Pagination (ortak) ========= */}
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
