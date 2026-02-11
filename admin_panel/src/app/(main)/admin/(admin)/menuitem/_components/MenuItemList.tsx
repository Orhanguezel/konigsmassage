// =============================================================
// FILE: src/components/admin/menuitem/MenuItemList.tsx
// guezelwebdesign – Admin Menu Items (Responsive + DnD + Pagination) (HEADER ONLY friendly)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { AdminMenuItemDto } from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

/* ---------------- Constants ---------------- */

const PAGE_SIZE = 50;

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const fmtDate = (value: unknown, locale: string) => {
  if (!value) return '-';
  try {
    const d = new Date(value as any);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString(locale);
  } catch {
    return String(value ?? '-');
  }
};

const fmtLocation = (loc?: string | null) => {
  if (loc === 'header') return 'Header';
  if (loc === 'footer') return 'Footer';
  return loc ?? '-';
};

const truncate = (v: unknown, max = 60) => {
  const s = safeText(v);
  if (!s) return '-';
  return s.length <= max ? s : `${s.slice(0, max)}…`;
};

const noWrapEllipsis: React.CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const getTypeLabel = (raw: unknown, t: any): string => {
  const v = safeText(raw).trim().toLowerCase();
  if (!v) return '-';
  if (v === 'page' || v === 'internal_page' || v === 'route' || v === '1' || v === 'true')
    return t('admin.menuitem.list.types.page');
  return t('admin.menuitem.list.types.custom');
};

/* ---------------- Props ---------------- */

export type MenuItemListProps = {
  items?: AdminMenuItemDto[];
  loading: boolean;

  onEdit?: (item: AdminMenuItemDto) => void;
  onDelete?: (item: AdminMenuItemDto) => void;
  onToggleActive?: (item: AdminMenuItemDto, value: boolean) => void;

  onReorder?: (next: AdminMenuItemDto[]) => void;
  onSaveOrder?: () => void;
  savingOrder?: boolean;

  localeLabelMap?: Record<string, string>;
  dateLocale?: string;

  // ✅ HEADER ONLY use-case
  hideLocationColumn?: boolean;
};

/* ---------------- Component ---------------- */

export const MenuItemList: React.FC<MenuItemListProps> = ({
  items = [],
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
  onSaveOrder,
  savingOrder,
  localeLabelMap,
  dateLocale = 'tr-TR',
  hideLocationColumn = false,
}) => {
  const t = useAdminT();
  const total = items.length;
  const hasData = total > 0;

  const busy = loading || !!savingOrder;

  const [page, setPage] = useState(1);
  const [dragId, setDragId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const start = (page - 1) * PAGE_SIZE;
  const pageRows = items.slice(start, start + PAGE_SIZE);

  const pages = useMemo(() => {
    const out: Array<number | 'ellipsis'> = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i += 1) out.push(i);
      return out;
    }
    out.push(1);
    if (page > 3) out.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i += 1) {
      out.push(i);
    }
    if (page < pageCount - 2) out.push('ellipsis');
    out.push(pageCount);
    return out;
  }, [page, pageCount]);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId || !onReorder || busy) return;

    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    onReorder(next);
    setDragId(null);
  };

  const renderLocale = (raw: unknown) => {
    const code = toShortLocale(raw);
    if (!code) return '-';
    return localeLabelMap?.[code] ?? code;
  };

  const desktopColSpan = hideLocationColumn ? 8 : 9;

  return (
    <div className="card">
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <span className="small fw-semibold">{t('admin.menuitem.list.title')}</span>

        <div className="d-flex gap-2 align-items-center flex-wrap">
          {loading && (
            <span className="badge bg-secondary">
              {t('admin.menuitem.header.loading') || 'Yükleniyor'}
            </span>
          )}

          {onSaveOrder && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={onSaveOrder}
              disabled={!hasData || savingOrder || loading}
            >
              {savingOrder
                ? t('admin.menuitem.list.savingOrder')
                : t('admin.menuitem.list.saveOrder')}
            </button>
          )}

          <span className="text-muted small">
            {t('admin.menuitem.list.totalLabel')} <strong>{total}</strong>
          </span>
        </div>
      </div>

      {/* ================= DESKTOP TABLE (lg+) ================= */}
      <div className="d-none d-lg-block">
        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead className="table-light">
              <tr>
                <th className="text-nowrap" style={{ ...noWrapEllipsis, width: 90 }} />
                <th
                  className="text-nowrap"
                  style={{ ...noWrapEllipsis, width: 240, minWidth: 200 }}
                  title={t('admin.menuitem.list.columns.title')}
                >
                  {t('admin.menuitem.list.columns.title')}
                </th>
                <th
                  className="text-nowrap"
                  style={{ ...noWrapEllipsis, width: 260, minWidth: 220 }}
                  title={t('admin.menuitem.list.columns.url')}
                >
                  {t('admin.menuitem.list.columns.url')}
                </th>
                <th className="text-nowrap" style={{ ...noWrapEllipsis, width: 110 }}>
                  {t('admin.menuitem.list.columns.type')}
                </th>

                {/* ✅ Konum kolonunu opsiyonel gizle */}
                {!hideLocationColumn && (
                  <th className="text-nowrap" style={{ ...noWrapEllipsis, width: 110 }}>
                    {t('admin.menuitem.list.columns.location')}
                  </th>
                )}

                <th className="text-nowrap text-center" style={{ ...noWrapEllipsis, width: 86 }}>
                  {t('admin.menuitem.list.columns.active')}
                </th>
                <th className="text-nowrap" style={{ ...noWrapEllipsis, width: 130 }}>
                  {t('admin.menuitem.list.columns.locale')}
                </th>
                <th className="text-nowrap" style={{ ...noWrapEllipsis, width: 190 }}>
                  {t('admin.menuitem.list.columns.date')}
                </th>
                <th className="text-nowrap text-end" style={{ ...noWrapEllipsis, width: 170 }}>
                  {t('admin.menuitem.list.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {hasData ? (
                pageRows.map((item, idx) => {
                  const globalIndex = start + idx + 1;
                  const locale = renderLocale((item as any).locale);
                  const created = fmtDate((item as any).created_at, dateLocale);
                  const typeLabel = getTypeLabel((item as any).type, t);

                  return (
                    <tr
                      key={item.id}
                      draggable={!!onReorder && !busy}
                      onDragStart={() => !busy && setDragId(item.id)}
                      onDragOver={(e) => !!onReorder && !busy && e.preventDefault()}
                      onDrop={() => handleDrop(item.id)}
                      onDragEnd={() => setDragId(null)}
                      className={dragId === item.id ? 'table-active' : undefined}
                      style={{
                        cursor: onReorder && !busy ? 'move' : onEdit ? 'pointer' : 'default',
                      }}
                      onClick={() => onEdit?.(item)}
                    >
                      <td className="text-muted small text-nowrap align-middle">
                        {onReorder && !busy && <span className="me-1">≡</span>}#{globalIndex}
                        <div className="mt-1">
                          <span className="badge bg-secondary-subtle text-muted border">
                            {item.display_order ?? 0}
                          </span>
                        </div>
                      </td>

                      <td className="align-middle" style={{ minWidth: 0 }}>
                        <div
                          className="fw-semibold small text-truncate"
                          title={safeText(item.title)}
                        >
                          {item.title || '-'}
                        </div>
                        {item.icon ? (
                          <div
                            className="text-muted small text-truncate"
                            title={safeText(item.icon)}
                          >
                            icon: <code>{truncate(item.icon, 26)}</code>
                          </div>
                        ) : null}
                      </td>

                      <td className="align-middle text-muted small" style={{ minWidth: 0 }}>
                        <div className="text-truncate" title={safeText(item.url)}>
                          {item.url ? safeText(item.url) : '-'}
                        </div>
                      </td>

                      <td className="align-middle text-nowrap">
                        <span className="badge bg-light border text-dark text-nowrap">
                          {typeLabel}
                        </span>
                      </td>

                      {!hideLocationColumn && (
                        <td className="align-middle small text-nowrap">
                          {fmtLocation(item.location)}
                        </td>
                      )}

                      <td className="align-middle text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="form-check form-switch d-inline-flex m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!item.is_active}
                            disabled={busy}
                            onChange={(e) => onToggleActive?.(item, e.target.checked)}
                          />
                        </div>
                      </td>

                      <td className="align-middle small text-nowrap">
                        <code>{locale}</code>
                      </td>

                      <td className="align-middle small text-muted text-nowrap">{created}</td>

                      <td className="align-middle text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="btn-group btn-group-sm">
                          {onEdit && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => onEdit(item)}
                              disabled={busy}
                            >
                              {t('list.editButton')}
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => onDelete(item)}
                              disabled={busy}
                            >
                              {t('list.deleteButton')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={desktopColSpan} className="text-center py-3 text-muted small">
                    {t('list.noData')}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={desktopColSpan} className="text-center py-3 text-muted small">
                    {t('list.loading')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MOBILE / TABLET CARDS (< lg) ================= */}
      <div className="d-block d-lg-none">
        {!hasData && !loading ? (
          <div className="px-3 py-3 text-center text-muted small">{t('list.noData')}</div>
        ) : loading ? (
          <div className="px-3 py-3 text-center text-muted small">{t('list.loading')}</div>
        ) : (
          <div className="p-2">
            <div className="row g-2">
              {pageRows.map((item, idx) => {
                const globalIndex = start + idx + 1;
                const locale = renderLocale((item as any).locale);
                const created = fmtDate((item as any).created_at, dateLocale);
                const typeLabel = getTypeLabel((item as any).type, t);

                return (
                  <div key={item.id} className="col-12">
                    <div
                      className="border rounded-3 p-3 bg-white"
                      style={{ cursor: onEdit ? 'pointer' : 'default' }}
                      onClick={() => onEdit?.(item)}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className="badge bg-light text-dark border">#{globalIndex}</span>
                          <span className="badge bg-secondary-subtle text-muted border">
                            {t('header.sortOrder')}: {item.display_order ?? 0}
                          </span>
                          <span className="badge bg-light border text-dark">{typeLabel}</span>

                          {!hideLocationColumn && (
                            <span className="badge bg-light text-dark border">
                              {fmtLocation(item.location)}
                            </span>
                          )}

                          <span className="badge bg-light text-dark border">
                            <code>{locale}</code>
                          </span>
                        </div>

                        <div
                          className="form-check form-switch m-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!item.is_active}
                            disabled={busy}
                            onChange={(e) => onToggleActive?.(item, e.target.checked)}
                          />
                          <label className="form-check-label small">{t('header.active')}</label>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>
                          {item.title || <span className="text-muted">{t('list.noTitle')}</span>}
                        </div>

                        {item.icon ? (
                          <div
                            className="text-muted small mt-1"
                            style={{ wordBreak: 'break-word' }}
                          >
                            icon: <code>{safeText(item.icon)}</code>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-2 text-muted small" style={{ wordBreak: 'break-word' }}>
                        <div className="fw-semibold text-dark small">{t('list.columns.url')}</div>
                        {item.url ? <code>{safeText(item.url)}</code> : <span>-</span>}
                      </div>

                      <div className="mt-2 text-muted small">
                        <div className="fw-semibold text-dark small">{t('header.sortCreated')}</div>
                        <div style={{ wordBreak: 'break-word' }}>{created}</div>
                      </div>

                      {(onEdit || onDelete) && (
                        <div className="mt-3 d-flex gap-2 flex-wrap justify-content-end">
                          {onEdit && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                              }}
                              disabled={busy}
                            >
                              {t('list.editButton')}
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                              }}
                              disabled={busy}
                            >
                              {t('list.deleteButton')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      {pageCount > 1 && (
        <div className="py-2">
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

              {pages.map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
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
  );
};
