// =============================================================
// FILE: src/components/admin/footer-sections/FooterSectionsFormHeader.tsx
// konigsmassage – Footer Sections Form Header (FAQ pattern)
// =============================================================

'use client';

import React from 'react';

export type FooterSectionsFormEditMode = 'form' | 'json';

export type FooterSectionsFormHeaderProps = {
  mode: 'create' | 'edit';
  locale: string;

  editMode: FooterSectionsFormEditMode;
  saving: boolean;

  localesLoading?: boolean;
  isLocaleChanging?: boolean;

  onChangeEditMode: (m: FooterSectionsFormEditMode) => void;
  onCancel: () => void;
};

export const FooterSectionsFormHeader: React.FC<FooterSectionsFormHeaderProps> = ({
  mode,
  locale,
  editMode,
  saving,
  localesLoading,
  isLocaleChanging,
  onChangeEditMode,
  onCancel,
}) => {
  const title = mode === 'create' ? 'Yeni Footer Section Oluştur' : 'Footer Section Düzenle';

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
