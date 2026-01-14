// =============================================================
// FILE: src/components/admin/slider/SliderFormHeader.tsx
// =============================================================

'use client';

import React from 'react';

export type SliderFormEditMode = 'form' | 'json';

export type SliderFormHeaderProps = {
  mode: 'create' | 'edit';
  editMode: SliderFormEditMode;
  saving: boolean;

  // Category/SubCategory pattern'ine benzer: locale + locale loading göster
  locale: string;
  isLocaleLoading?: boolean;

  onChangeEditMode: (m: SliderFormEditMode) => void;
  onCancel: () => void;
};

export const SliderFormHeader: React.FC<SliderFormHeaderProps> = ({
  mode,
  editMode,
  saving,
  locale,
  isLocaleLoading,
  onChangeEditMode,
  onCancel,
}) => {
  return (
    <div className="card-header d-flex justify-content-between align-items-center">
      <div>
        <h5 className="mb-0">{mode === 'create' ? 'Yeni Slider Oluştur' : 'Slider Düzenle'}</h5>

        <div className="small text-muted">
          Aktif dil: <strong className="text-uppercase">{locale}</strong>
          {(saving || isLocaleLoading) && (
            <span className="badge bg-secondary ms-2">
              {isLocaleLoading ? 'Dil değiştiriliyor...' : 'Kaydediliyor...'}
            </span>
          )}
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
