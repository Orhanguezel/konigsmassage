// =============================================================
// FILE: src/components/admin/services/ServicesList.tsx
// konigsmassage – Admin Services List
// Responsive & UX FIXED
// =============================================================

import React, { useEffect, useState } from 'react';
import type { ServiceDto } from '@/integrations/types';
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

/* ------------------------------------------------------------- */
/* Helpers                                                       */
/* ------------------------------------------------------------- */

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatType(t: ServiceDto['type']): string {
  switch (t) {
    case 'maintenance_repair':
      return 'Bakım & Onarım';
    case 'modernization':
      return 'Modernizasyon';
    case 'spare_parts_components':
      return 'Yedek Parça';
    case 'applications_references':
      return 'Referanslar';
    case 'engineering_support':
      return 'Mühendislik';
    case 'production':
      return 'Üretim';
    case 'other':
    default:
      return 'Diğer';
  }
}

function formatPrice(price: string | null): string {
  return price || '-';
}

/* ------------------------------------------------------------- */
/* Component                                                     */
/* ------------------------------------------------------------- */

export type ServicesListProps = {
  items?: ServiceDto[];
  loading: boolean;

  onToggleActive?: (service: ServiceDto, value: boolean) => void;
  onToggleFeatured?: (service: ServiceDto, value: boolean) => void;
  onEdit?: (service: ServiceDto) => void;
  onDelete?: (service: ServiceDto) => void;

  onReorder?: (next: ServiceDto[]) => void;
  onSaveOrder?: () => void;
  savingOrder?: boolean;
};

export const ServicesList: React.FC<ServicesListProps> = ({
  items,
  loading,
  onToggleActive,
  onToggleFeatured,
  onEdit,
  onDelete,
  onReorder,
  onSaveOrder,
  savingOrder,
}) => {
  const rows = items ?? [];
  const totalItems = rows.length;
  const hasData = totalItems > 0;

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  /* ---------------- Drag & Drop ---------------- */

  const draggable = !!onReorder;

  const handleDropOn = (targetId: string) => {
    if (!draggingId || draggingId === targetId || !onReorder) return;

    const currentIndex = rows.findIndex((r) => r.id === draggingId);
    const targetIndex = rows.findIndex((r) => r.id === targetId);
    if (currentIndex === -1 || targetIndex === -1) return;

    const next = [...rows];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next);
  };

  /* ---------------- Pagination ---------------- */

  const buildPages = () => {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
    return [1, '...', currentPage, '...', pageCount];
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header py-2">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="small fw-semibold">Hizmet Listesi</span>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {loading && <span className="badge bg-secondary small">Yükleniyor…</span>}

            <span className="text-muted small">
              Toplam: <strong>{totalItems}</strong>
            </span>

            {onSaveOrder && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                disabled={!hasData || !!savingOrder}
                onClick={onSaveOrder}
              >
                {savingOrder ? 'Kaydediliyor…' : 'Sıralamayı Kaydet'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {/* ---------------- Desktop Table ---------------- */}
        <div className="d-none d-md-block">
          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }} />
                  <th>Hizmet</th>
                  <th style={{ width: 120 }}>Tip</th>
                  <th style={{ width: 120 }}>Durum</th>
                  <th style={{ width: 160 }}>Fiyat / Tarih</th>
                  <th style={{ width: 220 }} className="text-end">
                    İşlemler
                  </th>
                </tr>
              </thead>

              <tbody>
                {hasData ? (
                  pageRows.map((s, i) => (
                    <tr
                      key={s.id}
                      draggable={draggable}
                      onDragStart={() => draggable && setDraggingId(s.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onDragOver={(e) => draggable && e.preventDefault()}
                      onDrop={() => draggable && handleDropOn(s.id)}
                      className={draggingId === s.id ? 'table-active' : undefined}
                      style={{ cursor: draggable ? 'move' : 'default' }}
                    >
                      <td className="text-muted small">
                        {draggable && <span className="me-1">≡</span>}
                        {startIndex + i + 1}
                      </td>

                      <td>
                        <div className="fw-semibold small">{s.name || '—'}</div>
                        <div className="text-muted small">
                          {s.slug && (
                            <>
                              Slug: <code>{s.slug}</code>
                            </>
                          )}
                        </div>
                        {s.locale_resolved && (
                          <div className="text-muted small">
                            Locale: <code>{s.locale_resolved}</code>
                          </div>
                        )}
                      </td>

                      <td className="small">{formatType(s.type)}</td>

                      <td className="small">
                        <span
                          className={`badge ${
                            s.is_active ? 'bg-success-subtle text-success' : 'bg-light text-muted'
                          }`}
                        >
                          {s.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                        <div>
                          <span
                            className={`badge ${
                              s.featured ? 'bg-warning-subtle text-warning' : 'bg-light text-muted'
                            }`}
                          >
                            {s.featured ? 'Öne çıkan' : 'Normal'}
                          </span>
                        </div>
                      </td>

                      <td className="small">
                        <div>Fiyat: {formatPrice(s.price)}</div>
                        <div className="text-muted">Kayıt: {formatDate(s.created_at)}</div>
                      </td>

                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {onToggleFeatured && (
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => onToggleFeatured(s, !s.featured)}
                            >
                              Öne Çıkar
                            </button>
                          )}
                          {onToggleActive && (
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => onToggleActive(s, !s.is_active)}
                            >
                              {s.is_active ? 'Pasif' : 'Aktif'}
                            </button>
                          )}
                          {onEdit && (
                            <button className="btn btn-outline-secondary" onClick={() => onEdit(s)}>
                              Düzenle
                            </button>
                          )}
                          {onDelete && (
                            <button className="btn btn-danger" onClick={() => onDelete(s)}>
                              Sil
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted small py-3">
                      Kayıt bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------- Mobile Cards ---------------- */}
        <div className="d-block d-md-none">
          {hasData ? (
            pageRows.map((s, i) => (
              <div
                key={s.id}
                className="border-bottom px-3 py-2"
                draggable={draggable}
                onDragStart={() => draggable && setDraggingId(s.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(e) => draggable && e.preventDefault()}
                onDrop={() => draggable && handleDropOn(s.id)}
                style={{ cursor: draggable ? 'move' : 'default' }}
              >
                <div className="fw-semibold small mb-1">
                  #{startIndex + i + 1} {s.name || '—'}
                </div>

                <div className="text-muted small mb-1">{formatType(s.type)}</div>

                <div className="small mb-1">
                  {s.is_active ? 'Aktif' : 'Pasif'} · {s.featured ? 'Öne çıkan' : 'Normal'}
                </div>

                <div className="text-muted small mb-2">Fiyat: {formatPrice(s.price)}</div>

                <div className="d-grid gap-1">
                  {onEdit && (
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => onEdit(s)}>
                      Düzenle
                    </button>
                  )}
                  {onDelete && (
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(s)}>
                      Sil
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted small py-3">Kayıt bulunamadı</div>
          )}
        </div>

        {/* ---------------- Pagination ---------------- */}
        {pageCount > 1 && (
          <div className="py-2 d-flex justify-content-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>

                {buildPages().map((p, i) =>
                  typeof p === 'number' ? (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(pageCount, p + 1));
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
