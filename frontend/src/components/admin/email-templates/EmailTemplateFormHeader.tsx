// ===================================================================
// FILE: src/components/admin/email-templates/EmailTemplateFormHeader.tsx
// Email Templates – Form Header (üst bar + template_key + locale)
// ===================================================================

'use client';

import React from 'react';
import type { EmailTemplateFormMode, EmailTemplateFormValues } from './EmailTemplateFormPage';
import type { LocaleOption } from '@/components/admin/email-templates/EmailTemplateHeader';

interface EmailTemplateFormHeaderProps {
  mode: EmailTemplateFormMode;
  values: EmailTemplateFormValues;
  onChange: (patch: Partial<EmailTemplateFormValues>) => void;

  // locale listesi: DB’den gelir
  localeOptions: LocaleOption[];
  localesLoading?: boolean;

  loading: boolean;

  onSubmit: () => void;
  onCancel: () => void;

  /**
   * Locale değiştiğinde container’ın edit modda BE’den o locale’i çekmesi için.
   * (Create modda sadece state değiştirilebilir.)
   */
  onLocaleChange?: (nextLocale: string) => void;
}

export const EmailTemplateFormHeader: React.FC<EmailTemplateFormHeaderProps> = ({
  mode,
  values,
  onChange,
  localeOptions,
  localesLoading,
  loading,
  onSubmit,
  onCancel,
  onLocaleChange,
}) => {
  const handleTemplateKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ template_key: e.target.value });
  };

  const handleLocaleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    const nextLocale = raw ? raw.trim().toLowerCase() : '';
    onChange({ locale: nextLocale });
    onLocaleChange?.(nextLocale);
  };

  const handleActiveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ is_active: e.target.checked });
  };

  const formatDate = (value?: string | Date) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const title = mode === 'create' ? 'Yeni Email Şablonu Oluştur' : 'Email Şablonu Düzenle';

  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <div className="row g-2 align-items-end">
          {/* Sol: başlık + template_key */}
          <div className="col-md-5">
            <div className="mb-1 small text-muted">{title}</div>
            <label className="form-label small mb-1">Template Key</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={values.template_key}
              onChange={handleTemplateKeyChange}
              disabled={loading}
              placeholder="Örn: contact_admin_notification"
            />
            <div className="form-text small">
              Backend’de <code>template_key</code> parent kayıt için tekildir. Farklı diller aynı
              key’i paylaşır.
            </div>
          </div>

          {/* Orta: Locale seçici + aktif switch */}
          <div className="col-md-4">
            <div className="row g-2">
              <div className="col-7">
                <label className="form-label small mb-1">
                  Locale{' '}
                  {localesLoading && <span className="spinner-border spinner-border-sm ms-1" />}
                </label>

                <select
                  className="form-select form-select-sm"
                  value={values.locale}
                  onChange={handleLocaleSelectChange}
                  disabled={loading || (localesLoading && !localeOptions.length)}
                >
                  {localeOptions.length === 0 && <option value="">Locale seç</option>}
                  {localeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="form-text small">Her locale için ayrı çeviri kaydı tutulur.</div>
              </div>

              <div className="col-5 d-flex align-items-end">
                <div className="form-check form-switch small">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="email-tpl-form-active"
                    checked={values.is_active}
                    onChange={handleActiveToggle}
                    disabled={loading}
                  />
                  <label className="form-check-label ms-1" htmlFor="email-tpl-form-active">
                    Aktif
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: meta + aksiyonlar */}
          <div className="col-md-3">
            <div className="d-flex flex-column align-items-end gap-1">
              <div className="small text-muted">
                <div>
                  Parent oluşturma:{' '}
                  <span className="fw-semibold">{formatDate(values.parentCreatedAt)}</span>
                </div>
                <div>
                  Parent güncelleme:{' '}
                  <span className="fw-semibold">{formatDate(values.parentUpdatedAt)}</span>
                </div>
                {values.translationCreatedAt && (
                  <div>
                    Çeviri ({values.locale}) oluşturma:{' '}
                    <span className="fw-semibold">{formatDate(values.translationCreatedAt)}</span>
                  </div>
                )}
                {values.translationUpdatedAt && (
                  <div>
                    Çeviri ({values.locale}) güncelleme:{' '}
                    <span className="fw-semibold">{formatDate(values.translationUpdatedAt)}</span>
                  </div>
                )}
              </div>

              <div className="btn-group btn-group-sm mt-1">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Geri dön
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onSubmit}
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : mode === 'create' ? 'Oluştur' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
