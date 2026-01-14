// =============================================================
// FILE: src/components/admin/slider/SliderList.tsx
// konigsmassage – Slider Listesi
//
// Responsive Strategy (Bootstrap 5):
// - < xxl: CARDS (dar desktop + tablet + mobile) ✅
// - xxl+: TABLE (DnD enabled here only) ✅
//
// Fixes:
// - Prevent header/columns collapsing (e.g., "Başlık" vertical letters)
// - No "broken" table on narrow content area
// - Truncation + nowrap for key fields
// =============================================================

import React, { useState } from 'react';
import type { SliderAdminDto } from '@/integrations/types';

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const normLocale = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const formatText = (v: unknown, max = 80): string => {
  const s = safeText(v);
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
};

export type SliderListProps = {
  items: SliderAdminDto[];
  loading: boolean;

  onEdit: (item: SliderAdminDto) => void;
  onDelete: (item: SliderAdminDto) => void;

  onToggleActive: (item: SliderAdminDto, value: boolean) => void;
  onToggleFeatured: (item: SliderAdminDto, value: boolean) => void;

  onReorder: (next: SliderAdminDto[]) => void;
  onSaveOrder: () => void;
  savingOrder: boolean;
};

export const SliderList: React.FC<SliderListProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  onReorder,
  onSaveOrder,
  savingOrder,
}) => {
  const rows = items ?? [];
  const totalItems = rows.length;
  const hasData = totalItems > 0;

  const busy = loading || !!savingOrder;

  const [draggingId, setDraggingId] = useState<string | null>(null);

  // DnD sadece xxl+ tabloda
  const canReorderXxl = !busy;

  /* ---------------- DnD (full dataset) ---------------- */

  const handleDragStart = (id: string) => {
    if (!canReorderXxl) return;
    setDraggingId(id);
  };

  const handleDragEnd = () => setDraggingId(null);

  const handleDropOn = (targetId: string) => {
    if (!canReorderXxl) return;
    if (!draggingId || draggingId === targetId) return;

    const currentIndex = rows.findIndex((r) => String((r as any).id) === String(draggingId));
    const targetIndex = rows.findIndex((r) => String((r as any).id) === String(targetId));
    if (currentIndex === -1 || targetIndex === -1) return;

    const next = [...rows];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);

    onReorder(next);
  };

  const caption = (
    <span className="text-muted small">
      Sıralama (DnD) sadece çok büyük ekranlarda (xxl+) tabloda aktiftir. Değişiklikleri kalıcı
      yapmak için <strong>&quot;Sıralamayı Kaydet&quot;</strong> butonuna bas.
    </span>
  );

  const renderThumb = (item: SliderAdminDto) => {
    const img = (item as any).image_effective_url || (item as any).image_url || '';
    if (!img) return <span className="badge bg-light text-muted small">Görsel yok</span>;

    return (
      <div
        className="border rounded bg-light"
        style={{ width: 72, height: 44, overflow: 'hidden' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={safeText((item as any).alt) || safeText((item as any).name) || 'slider'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header py-2">
        <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 flex-wrap">
          <div className="small fw-semibold">Slider Listesi</div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {busy && <span className="badge bg-secondary small">İşlem yapılıyor...</span>}

            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={onSaveOrder}
              disabled={!hasData || savingOrder || loading}
            >
              {savingOrder ? 'Sıralama kaydediliyor...' : 'Sıralamayı Kaydet'}
            </button>

            <span className="text-muted small">
              Toplam: <strong>{totalItems}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {/* ===================== XXL+ TABLE ONLY ===================== */}
        <div className="d-none d-xxl-block">
          <div className="table-responsive">
            <table
              className="table table-sm table-hover align-middle mb-0"
              style={{ tableLayout: 'fixed', width: '100%' }}
            >
              {/* Kolon kontrolü: Başlık kolonuna gerçek alan bırak */}
              <colgroup>
                <col style={{ width: '56px' }} />
                <col style={{ width: '96px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '88px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '170px' }} />
              </colgroup>

              <thead className="table-light">
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }} />
                  <th style={{ whiteSpace: 'nowrap' }}>Görsel</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Başlık</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Dil</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Slug</th>
                  <th className="text-center" style={{ whiteSpace: 'nowrap' }}>
                    Aktif
                  </th>
                  <th className="text-center" style={{ whiteSpace: 'nowrap' }}>
                    Öne Çıkan
                  </th>
                  <th className="text-center" style={{ whiteSpace: 'nowrap' }}>
                    Sıra
                  </th>
                  <th className="text-end" style={{ whiteSpace: 'nowrap' }}>
                    İşlemler
                  </th>
                </tr>
              </thead>

              <tbody>
                {!hasData ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 small text-muted">
                      {loading
                        ? 'Slider kayıtları yükleniyor...'
                        : 'Henüz slider kaydı bulunmuyor.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((item, index) => {
                    const id = String((item as any).id);
                    const name = safeText((item as any).name) || '(Başlık yok)';
                    const slug = safeText((item as any).slug) || '-';
                    const desc = safeText((item as any).description);
                    const btnText = safeText((item as any).buttonText);
                    const btnLink = safeText((item as any).buttonLink);
                    const locale = normLocale((item as any).locale || 'de') || 'de';

                    return (
                      <tr
                        key={id}
                        draggable={canReorderXxl}
                        onDragStart={() => handleDragStart(id)}
                        onDragEnd={canReorderXxl ? handleDragEnd : undefined}
                        onDragOver={canReorderXxl ? (e) => e.preventDefault() : undefined}
                        onDrop={canReorderXxl ? () => handleDropOn(id) : undefined}
                        className={draggingId === id ? 'table-active' : undefined}
                        style={canReorderXxl ? { cursor: 'move' } : { cursor: 'default' }}
                      >
                        <td className="text-muted small text-nowrap">
                          {canReorderXxl && <span className="me-1">≡</span>}
                          {index + 1}
                        </td>

                        <td className="align-middle">{renderThumb(item)}</td>

                        {/* Başlık: kesinlikle daralıp harf harf düşmesin -> nowrap + truncate */}
                        <td className="align-middle" style={{ minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <div
                              className="fw-semibold small text-truncate"
                              title={name}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {name}
                            </div>

                            {desc ? (
                              <div
                                className="text-muted small text-truncate"
                                title={desc}
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                {formatText(desc, 140)}
                              </div>
                            ) : null}

                            {btnText ? (
                              <div
                                className="text-muted small text-truncate"
                                title={btnText}
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                BTN: {formatText(btnText, 34)}
                              </div>
                            ) : null}

                            {btnLink ? (
                              <div
                                className="text-muted small text-truncate"
                                title={btnLink}
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                Link: <code>{formatText(btnLink, 70)}</code>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="align-middle small text-nowrap">
                          <code>{locale}</code>
                        </td>

                        <td className="align-middle small" style={{ minWidth: 0 }}>
                          <div
                            className="text-truncate"
                            title={slug}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            <code>{slug}</code>
                          </div>
                        </td>

                        <td className="align-middle text-center">
                          <div className="form-check form-switch d-inline-flex m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!(item as any).is_active}
                              disabled={busy}
                              onChange={(e) => onToggleActive(item, e.target.checked)}
                            />
                          </div>
                        </td>

                        <td className="align-middle text-center">
                          <div className="form-check form-switch d-inline-flex m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!(item as any).featured}
                              disabled={busy}
                              onChange={(e) => onToggleFeatured(item, e.target.checked)}
                            />
                          </div>
                        </td>

                        <td className="align-middle text-center small">
                          {(item as any).display_order ?? 0}
                        </td>

                        <td className="align-middle text-end text-nowrap">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => onEdit(item)}
                              disabled={busy}
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => onDelete(item)}
                              disabled={busy}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <caption className="px-3 py-2 text-start">{caption}</caption>
            </table>
          </div>
        </div>

        {/* ===================== < XXL : CARDS (dar desktop + tablet + mobile) ===================== */}
        <div className="d-block d-xxl-none">
          {loading ? (
            <div className="px-3 py-3 text-center text-muted small">
              Slider kayıtları yükleniyor...
            </div>
          ) : hasData ? (
            <div className="p-3">
              <div className="row g-3">
                {rows.map((item, index) => {
                  const id = String((item as any).id);
                  const img = (item as any).image_effective_url || (item as any).image_url || '';
                  const name = safeText((item as any).name) || '(Başlık yok)';
                  const slug = safeText((item as any).slug) || '-';
                  const desc = safeText((item as any).description);
                  const btnText = safeText((item as any).buttonText);
                  const btnLink = safeText((item as any).buttonLink);
                  const locale = normLocale((item as any).locale || 'de') || 'de';

                  return (
                    <div key={id} className="col-12 col-lg-6">
                      <div className="border rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="badge bg-light text-dark border">#{index + 1}</span>
                            <span className="badge bg-light text-dark border small">
                              Dil: <code>{locale}</code>
                            </span>
                            <span className="badge bg-light text-dark border small">
                              Sıra: <strong>{(item as any).display_order ?? 0}</strong>
                            </span>
                          </div>

                          <div className="d-flex flex-column align-items-end gap-1">
                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={!!(item as any).is_active}
                                disabled={busy}
                                onChange={(e) => onToggleActive(item, e.target.checked)}
                              />
                              <label className="form-check-label small">Aktif</label>
                            </div>

                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={!!(item as any).featured}
                                disabled={busy}
                                onChange={(e) => onToggleFeatured(item, e.target.checked)}
                              />
                              <label className="form-check-label small">Öne çıkan</label>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 d-flex gap-2">
                          {img ? (
                            <div
                              className="border rounded bg-light"
                              style={{
                                width: 96,
                                height: 60,
                                overflow: 'hidden',
                                flex: '0 0 auto',
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img}
                                alt={safeText((item as any).alt) || name || 'slider'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="d-flex align-items-center">
                              <span className="badge bg-light text-muted small">Görsel yok</span>
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>
                              {name}
                              {btnText ? (
                                <span className="text-muted ms-1 small">
                                  ({formatText(btnText, 26)})
                                </span>
                              ) : null}
                            </div>

                            <div className="text-muted small" style={{ wordBreak: 'break-word' }}>
                              Slug: <code>{slug}</code>
                            </div>

                            {desc ? (
                              <div
                                className="text-muted small mt-1"
                                style={{ wordBreak: 'break-word' }}
                              >
                                {formatText(desc, 160)}
                              </div>
                            ) : null}

                            {btnLink ? (
                              <div
                                className="text-muted small mt-1"
                                style={{ wordBreak: 'break-word' }}
                              >
                                Link: <code>{formatText(btnLink, 110)}</code>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 d-flex gap-2 flex-wrap justify-content-end">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => onEdit(item)}
                            disabled={busy}
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onDelete(item)}
                            disabled={busy}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3">{caption}</div>
            </div>
          ) : (
            <div className="px-3 py-3 text-center text-muted small">
              Henüz slider kaydı bulunmuyor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
