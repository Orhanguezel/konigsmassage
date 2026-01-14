// =============================================================
// FILE: src/components/admin/faqs/FaqsFormHeader.tsx
// konigsmassage – FAQ Form Header (References pattern)
// - Locale sadece gösterilir (dropdown yok)
// - Status badge: saving / localeChanging / localesLoading
// =============================================================

'use client';

import React from 'react';

export type FaqsFormEditMode = 'form' | 'json';

export type FaqsFormHeaderProps = {
  mode: 'create' | 'edit';
  locale: string; // sadece gösterim için

  editMode: FaqsFormEditMode;
  saving: boolean;

  localesLoading?: boolean;
  isLocaleChanging?: boolean;

  onChangeEditMode: (m: FaqsFormEditMode) => void;
  onCancel: () => void;
};

export const FaqsFormHeader: React.FC<FaqsFormHeaderProps> = ({
  mode,
  locale,
  editMode,
  saving,
  localesLoading,
  isLocaleChanging,
  onChangeEditMode,
  onCancel,
}) => {
  const title = mode === 'create' ? 'Yeni SSS Kaydı Oluştur' : 'SSS Kaydını Düzenle';

  const showBadge = !!saving || !!localesLoading || !!isLocaleChanging;

  const badgeText = isLocaleChanging
    ? 'Dil değiştiriliyor...'
    : localesLoading
    ? 'Diller yükleniyor...'
    : saving
    ? 'Kaydediliyor...'
    : '';

  return (
    <div className="card-header py-2 d-flex justify-content-between align-items-center">
      <div>
        <h5 className="mb-0">{title}</h5>
        <div className="small text-muted">
          Dil: <strong>{locale ? String(locale).toUpperCase() : '-'}</strong>
        </div>
      </div>

      <div className="d-flex gap-2 align-items-center">
        <div className="btn-group btn-group-sm" role="group">
          <button
            type="button"
            className={'btn btn-outline-secondary ' + (editMode === 'form' ? 'active' : '')}
            disabled={saving}
            onClick={() => onChangeEditMode('form')}
          >
            Form
          </button>
          <button
            type="button"
            className={'btn btn-outline-secondary ' + (editMode === 'json' ? 'active' : '')}
            disabled={saving}
            onClick={() => onChangeEditMode('json')}
          >
            JSON
          </button>
        </div>

        {showBadge && <span className="badge bg-secondary small">{badgeText}</span>}

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={saving}
          onClick={onCancel}
        >
          ← Geri
        </button>
      </div>
    </div>
  );
};
