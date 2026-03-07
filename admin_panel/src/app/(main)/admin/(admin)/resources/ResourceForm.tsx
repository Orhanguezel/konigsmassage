// =============================================================
// FILE: src/components/admin/resources/ResourceForm.tsx
// guezelwebdesign – Admin Resource Create/Edit Form
// FINAL — TR UI + NO external_ref_id (Availability standard)
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { ResourceRowDto, ResourceType } from '@/integrations/shared/resources.types';
import type { AdminLocaleOption } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

export type ResourceFormMode = 'create' | 'edit';

export type ResourceFormValues = {
  title: string;
  type: ResourceType;
  capacity: number;
  external_ref_id: string;
  i18nTitles: Record<string, string>;
  is_active: boolean;
};

export type ResourceFormProps = {
  mode: ResourceFormMode;
  initialData?: ResourceRowDto | null;
  loading: boolean;
  saving: boolean;
  locales: AdminLocaleOption[];
  defaultLocale?: string;
  onSubmit: (values: ResourceFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

const toType = (v: unknown): ResourceType => {
  const s = String(v ?? 'other').trim() as ResourceType;
  const ok: ResourceType[] = ['therapist', 'doctor', 'table', 'room', 'staff', 'other'];
  return (ok.includes(s) ? s : 'other') as ResourceType;
};

const buildInitial = (
  dto?: ResourceRowDto | null,
  locales: AdminLocaleOption[] = [],
  defaultLocale?: string,
): ResourceFormValues => {
  const localeCodes = locales.map((item) => String(item.value || '').trim()).filter(Boolean);
  const fallbackDefault = String(defaultLocale || localeCodes[0] || 'de').trim() || 'de';
  const initialI18nTitles = Object.fromEntries(localeCodes.map((code) => [code, ''])) as Record<
    string,
    string
  >;

  if (!dto) {
    return {
      title: '',
      type: 'therapist',
      capacity: 1,
      external_ref_id: '',
      i18nTitles: initialI18nTitles,
      is_active: true,
    };
  }
  const i18nRows = Array.isArray((dto as any).i18n) ? ((dto as any).i18n as Array<any>) : [];
  const nextI18nTitles = { ...initialI18nTitles };
  for (const row of i18nRows) {
    const locale = String(row?.locale ?? '').trim().toLowerCase();
    if (!locale) continue;
    nextI18nTitles[locale] = String(row?.title ?? '');
  }
  if (!nextI18nTitles[fallbackDefault] && dto.title) {
    nextI18nTitles[fallbackDefault] = String(dto.title ?? '');
  }
  return {
    title: String(dto.title ?? ''),
    type: toType(dto.type),
    capacity: Math.max(1, Number(dto.capacity ?? 1)),
    external_ref_id: String(dto.external_ref_id ?? ''),
    i18nTitles: nextI18nTitles,
    is_active: Number(dto.is_active ?? 0) === 1 || (dto as any).is_active === true,
  };
};

const TYPE_LABEL: Record<ResourceType, string> = {
  therapist: 'Terapist',
  doctor: 'Doktor',
  table: 'Masa',
  room: 'Oda',
  staff: 'Personel',
  other: 'Diğer',
};

export const ResourceForm: React.FC<ResourceFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  locales,
  defaultLocale,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<ResourceFormValues>(
    buildInitial(initialData, locales, defaultLocale),
  );

  useEffect(() => {
    setValues(buildInitial(initialData, locales, defaultLocale));
  }, [initialData, locales, defaultLocale]);

  const disabled = loading || saving;

  const titleHelp = useMemo(() => {
    if (values.title.trim().length >= 2) return '';
    return 'Ad en az 2 karakter olmalı.';
  }, [values.title]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    const title = values.title.trim();
    if (!title || title.length < 2) {
      toast.error('Lütfen geçerli bir ad gir.');
      return;
    }
    const capacity = Number(values.capacity ?? 1);
    if (!Number.isFinite(capacity) || capacity < 1) {
      toast.error('Kapasite en az 1 olmalı.');
      return;
    }

    void onSubmit({
      title,
      type: values.type,
      capacity: Math.floor(capacity),
      external_ref_id: values.external_ref_id.trim(),
      i18nTitles: Object.fromEntries(
        Object.entries(values.i18nTitles).map(([locale, localeTitle]) => [
          locale,
          String(localeTitle ?? '').trim(),
        ]),
      ),
      is_active: values.is_active,
    });
  };

  return (
    <div className="guezelwebdesign-admin-page">
      <div className="container-fluid px-2 px-lg-3">
        <div className="guezelwebdesign-admin-page__inner">
          <form onSubmit={handleSubmit}>
            <div className="card guezelwebdesign-admin-card">
              <div className="card-header py-2 guezelwebdesign-admin-card__header">
                <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-2">
                  <div style={{ minWidth: 0 }}>
                    <h5 className="mb-1 small fw-semibold text-truncate">
                      {mode === 'create' ? 'Yeni Kaynak' : 'Kaynak Düzenle'}
                    </h5>
                    <div className="text-muted small text-truncate">
                      Kaynak adı, tipi, kapasitesi ve rezervasyon bağlantı alanlarını yönet.
                    </div>
                  </div>

                  <div className="d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
                    {onCancel ? (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={onCancel}
                        disabled={disabled}
                      >
                        Geri
                      </button>
                    ) : null}

                    <button type="submit" className="btn btn-primary btn-sm" disabled={disabled}>
                      {saving
                        ? mode === 'create'
                          ? 'Oluşturuluyor...'
                          : 'Kaydediliyor...'
                        : mode === 'create'
                          ? 'Oluştur'
                          : 'Kaydet'}
                    </button>

                    {loading ? (
                      <span className="badge bg-secondary small">Yükleniyor...</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="card-body guezelwebdesign-admin-card__body">
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <label className="form-label small mb-1">Ad</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.title}
                      onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Örn: Anna (Terapist)"
                      disabled={disabled}
                    />
                    {titleHelp ? (
                      <div className="form-text small text-muted">{titleHelp}</div>
                    ) : null}
                    <div className="form-text small">
                      Fallback başlık. `de` çevirisi boşsa public tarafta bu değer kullanılır.
                    </div>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Tür</label>
                    <select
                      className="form-select form-select-sm"
                      value={values.type}
                      onChange={(e) => setValues((p) => ({ ...p, type: toType(e.target.value) }))}
                      disabled={disabled}
                    >
                      {(Object.keys(TYPE_LABEL) as ResourceType[]).map((k) => (
                        <option key={k} value={k}>
                          {TYPE_LABEL[k]}
                        </option>
                      ))}
                    </select>
                    <div className="form-text small">Filtreleme ve raporlama için.</div>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Kapasite</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      className="form-control form-control-sm"
                      value={values.capacity}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, capacity: Number(e.target.value || 1) }))
                      }
                      disabled={disabled}
                    />
                    <div className="form-text small">
                      Aynı slotta aynı kaynak için kaç paralel rezervasyon alınabileceği.
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label small mb-1">Harici Referans ID</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.external_ref_id}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, external_ref_id: e.target.value }))
                      }
                      placeholder="Opsiyonel UUID"
                      disabled={disabled}
                    />
                    <div className="form-text small">
                      Kaynağı başka bir kayıtla eşlemek için kullanılır. Boş bırakılabilir.
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="border rounded-3 p-3 bg-light-subtle">
                      <div className="fw-semibold small mb-2">Dil Başlıkları</div>
                      <div className="row g-3">
                        {locales.map((locale) => {
                          const code = String(locale.value || '').trim().toLowerCase();
                          if (!code) return null;
                          const isDefault = code === String(defaultLocale || '').trim().toLowerCase();
                          return (
                            <div key={code} className="col-12 col-lg-4">
                              <label className="form-label small mb-1">{locale.label}</label>
                              <input
                                className="form-control form-control-sm"
                                value={values.i18nTitles[code] ?? ''}
                                onChange={(e) =>
                                  setValues((p) => ({
                                    ...p,
                                    i18nTitles: { ...p.i18nTitles, [code]: e.target.value },
                                  }))
                                }
                                placeholder={isDefault ? 'Zorunlu fallback locale' : 'Opsiyonel'}
                                disabled={disabled}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Durum</label>
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={values.is_active}
                        onChange={(e) => setValues((p) => ({ ...p, is_active: e.target.checked }))}
                        disabled={disabled}
                        id="resource-is-active"
                      />
                      <label className="form-check-label small" htmlFor="resource-is-active">
                        {values.is_active ? 'Aktif' : 'Pasif'}
                      </label>
                    </div>
                    <div className="form-text small">
                      Pasif kaynak rezervasyonda listelenmez (backend kuralı).
                    </div>
                  </div>
                </div>

                {mode === 'create' ? (
                  <div className="alert alert-info mt-3 mb-0 small">
                    Kaynak oluşturulduktan sonra gerekirse ilgili modüllerde (ör. müsaitlik/slot)
                    planlama yapılabilir.
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
