// =============================================================
// FILE: src/components/admin/custompage/CustomPageList.tsx
// konigsmassage – Admin Custom Pages Listesi + Drag & Drop Reorder
//
// FULL-WIDTH FIX:
// - This screen must be full width (no clamp / no left gap)
// - Remove container paddings (px-0)
// - Disable .konigsmassage-admin-page__inner max-width via modifier
// - Keep: Default cards, >=1700px table + DnD
// - No style-jsx / no inline styles
// =============================================================

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import type { CustomPageDto } from '@/integrations/types';
import { useDeleteCustomPageAdminMutation } from '@/integrations/rtk/hooks';

export type CustomPageListProps = {
  items?: CustomPageDto[];
  loading: boolean;

  onReorder?: (next: CustomPageDto[]) => void;
  onSaveOrder?: () => void;
  savingOrder?: boolean;

  activeLocale?: string;
};

const VERY_LARGE_BP = 1700;

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const normLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export const CustomPageList: React.FC<CustomPageListProps> = ({
  items,
  loading,
  onReorder,
  onSaveOrder,
  savingOrder,
  activeLocale,
}) => {
  const rows = items ?? [];
  const hasData = rows.length > 0;

  const [deletePage, { isLoading: isDeleting }] = useDeleteCustomPageAdminMutation();
  const busy = loading || isDeleting || !!savingOrder;

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const effectiveLocale = useMemo(() => normLocale(activeLocale) || '', [activeLocale]);
  const canReorder = !!onReorder;

  const editHrefById = (id: string) => ({
    pathname: `/admin/custompage/${encodeURIComponent(id)}`,
    query: effectiveLocale ? { locale: effectiveLocale } : undefined,
  });

  const renderStatus = (p: CustomPageDto) =>
    p.is_published ? (
      <span className="badge bg-success-subtle text-success border border-success-subtle">
        Yayında
      </span>
    ) : (
      <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
        Taslak
      </span>
    );

  const handleDelete = async (page: CustomPageDto) => {
    const ok = window.confirm(
      `Bu sayfayı silmek üzeresin.\n\n` +
        `Başlık: ${page.title ?? '(başlık yok)'}\n` +
        `ID: ${page.id}\n` +
        `Slug: ${page.slug ?? '(slug yok)'}\n\n` +
        `Devam etmek istiyor musun?`,
    );
    if (!ok) return;

    try {
      await deletePage(page.id).unwrap();
      toast.success('Sayfa başarıyla silindi.');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message ??
        'Sayfa silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragEnd = () => setDraggingId(null);

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

  const renderEmptyOrLoading = () => {
    if (loading) return <div className="konigsmassage-cp-list__state">Sayfalar yükleniyor...</div>;
    return <div className="konigsmassage-cp-list__state">Henüz kayıtlı sayfa bulunmuyor.</div>;
  };

  const renderCards = () => {
    if (!hasData) return renderEmptyOrLoading();

    return (
      <div className="konigsmassage-cp-list__cards p-3">
        <div className="row g-3">
          {rows.map((p, idx) => {
            const localeResolved = safeText((p as any).locale_resolved);
            const subName = safeText((p as any).sub_category_name);
            const subSlug = safeText((p as any).sub_category_slug);

            return (
              <div key={p.id} className="col-12 col-xxl-6">
                <div className="konigsmassage-cp-card border rounded-3 bg-white h-100 p-3">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="konigsmassage-cp-card__main">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge bg-light text-dark border">#{idx + 1}</span>
                        {renderStatus(p)}
                        {localeResolved ? (
                          <span className="badge bg-light text-dark border">
                            Locale: <code>{localeResolved}</code>
                          </span>
                        ) : null}
                      </div>

                      <div className="fw-semibold mt-2 konigsmassage-cp-card__title">
                        {p.title ?? <span className="text-muted">Başlık yok</span>}
                      </div>

                      {p.meta_title ? (
                        <div className="text-muted small mt-1 konigsmassage-cp-card__seo">
                          SEO: {p.meta_title}
                        </div>
                      ) : null}

                      <div className="text-muted small mt-1 konigsmassage-cp-card__line">
                        Slug: <code>{p.slug ?? '-'}</code>
                      </div>

                      <div className="mt-2">
                        {subName || subSlug ? (
                          <div className="small mt-2">
                            {subSlug ? (
                              <div className="text-muted small konigsmassage-cp-card__line">
                                Slug: <code>{subSlug}</code>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="text-muted small mt-2">
                        <div>Oluşturulma: {formatDate(p.created_at)}</div>
                        <div>Güncelleme: {formatDate(p.updated_at)}</div>
                      </div>
                    </div>

                    <div className="konigsmassage-cp-card__actions">
                      <Link
                        href={editHrefById(p.id)}
                        className="btn btn-outline-primary btn-sm w-100"
                      >
                        Düzenle
                      </Link>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm w-100"
                        disabled={busy}
                        onClick={() => handleDelete(p)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3">
          <span className="text-muted small">
            Varsayılan görünüm karttır. Sıralama (DnD) sadece çok büyük ekranlarda (≥{' '}
            {VERY_LARGE_BP}
            px) tabloda aktiftir.
          </span>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!hasData) return renderEmptyOrLoading();

    return (
      <div className="konigsmassage-cp-list__table">
        <div className="table-responsive konigsmassage-cp-tablewrap">
          <table className="table table-hover table-sm mb-0 align-middle konigsmassage-cp-table">
            <thead className="table-light">
              <tr>
                <th className="konigsmassage-cp-col--index text-muted">#</th>
                <th className="konigsmassage-cp-col--title">Başlık</th>
                <th className="konigsmassage-cp-col--slug">Slug</th>
                <th className="konigsmassage-cp-col--status">Durum</th>
                <th className="konigsmassage-cp-col--date">Tarih</th>
                <th className="konigsmassage-cp-col--actions text-end text-nowrap">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((p, idx) => {
                const localeResolved = safeText((p as any).locale_resolved);
                const rowIsDragging = draggingId === p.id;

                return (
                  <tr
                    key={p.id}
                    draggable={canReorder}
                    onDragStart={() => canReorder && handleDragStart(p.id)}
                    onDragEnd={canReorder ? handleDragEnd : undefined}
                    onDragOver={canReorder ? (e) => e.preventDefault() : undefined}
                    onDrop={canReorder ? () => handleDropOn(p.id) : undefined}
                    className={[
                      rowIsDragging ? 'table-active' : '',
                      canReorder ? 'konigsmassage-cp-dnd' : '',
                    ].join(' ')}
                  >
                    <td className="konigsmassage-cp-col--index text-muted small text-nowrap">
                      {canReorder ? (
                        <span className="konigsmassage-cp-dnd__handle me-2">≡</span>
                      ) : null}
                      {idx + 1}
                    </td>

                    <td className="konigsmassage-cp-col--title">
                      <div className="konigsmassage-minw-0">
                        <div className="fw-semibold text-truncate" title={safeText(p.title)}>
                          {p.title ?? 'Başlık yok'}
                        </div>

                        {p.meta_title ? (
                          <div className="text-muted small text-truncate" title={p.meta_title}>
                            SEO: {p.meta_title}
                          </div>
                        ) : null}

                        <div className="text-muted small text-truncate" title={p.id}>
                          {localeResolved ? (
                            <>
                              {' '}
                              • Locale: <code>{localeResolved}</code>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="konigsmassage-cp-col--slug">
                      <div className="text-truncate" title={safeText(p.slug)}>
                        <code>{p.slug ?? '-'}</code>
                      </div>
                    </td>


                    <td className="konigsmassage-cp-col--status text-nowrap">{renderStatus(p)}</td>

                    <td className="konigsmassage-cp-col--date small text-nowrap">
                      <div className="text-truncate" title={formatDate(p.created_at)}>
                        {formatDate(p.created_at)}
                      </div>
                      <div
                        className="text-muted small text-truncate"
                        title={formatDate(p.updated_at)}
                      >
                        Güncelleme: {formatDate(p.updated_at)}
                      </div>
                    </td>

                    <td className="konigsmassage-cp-col--actions text-end text-nowrap">
                      <div className="btn-group btn-group-sm" role="group">
                        <Link href={editHrefById(p.id)} className="btn btn-outline-primary btn-sm">
                          Düzenle
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          disabled={busy}
                          onClick={() => handleDelete(p)}
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <caption className="konigsmassage-cp-caption">
              <span className="text-muted small">
                Sıralama (DnD) sadece çok büyük ekranlarda (≥ {VERY_LARGE_BP}px) tabloda
                kullanılabilir.
              </span>
            </caption>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="konigsmassage-admin-page konigsmassage-admin-page--full">
      {/* FULL WIDTH: remove horizontal padding */}
      <div className="container-fluid px-0">
        {/* FULL WIDTH: disable clamp */}
        <div className="konigsmassage-admin-page__inner konigsmassage-admin-page__inner--full">
          <div className="card konigsmassage-cp-list konigsmassage-cp-list--full">
            <div className="card-header py-2">
              <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 flex-wrap px-2 px-lg-3">
                <span className="small fw-semibold">Sayfa Listesi</span>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {loading && <span className="badge bg-secondary small">Yükleniyor...</span>}

                  {onSaveOrder && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={onSaveOrder}
                      disabled={savingOrder || !hasData}
                    >
                      {savingOrder ? 'Sıralama kaydediliyor...' : 'Sıralamayı Kaydet'}
                    </button>
                  )}

                  <span className="text-muted small">
                    Toplam: <strong>{rows.length}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="card-body p-0 konigsmassage-cp-list__body">
              <div className="konigsmassage-cp-view konigsmassage-cp-view--table">
                {renderTable()}
              </div>
              <div className="konigsmassage-cp-view konigsmassage-cp-view--cards">
                {renderCards()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
