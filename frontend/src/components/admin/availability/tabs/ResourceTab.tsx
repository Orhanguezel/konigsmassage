// =============================================================
// FILE: src/components/admin/availability/tabs/ResourceTab.tsx
// FINAL — Resource editor tab
// =============================================================

'use client';

import React from 'react';
import { toast } from 'sonner';

import type { ResourceType } from '@/integrations/types';

export type AvailabilityResourceValues = {
  title: string;
  type: ResourceType;
  is_active: boolean;
};

export type ResourceTabProps = {
  mode: 'create' | 'edit';
  values: AvailabilityResourceValues;
  disabled: boolean;
  hasResourceId: boolean;
  onChange: (patch: Partial<AvailabilityResourceValues>) => void;
  onSubmit: () => void | Promise<void>;
};

const RESOURCE_TYPE_OPTIONS: Array<{ value: ResourceType; label: string }> = [
  { value: 'therapist', label: 'Terapist' },
  { value: 'doctor', label: 'Doktor' },
  { value: 'table', label: 'Masa' },
  { value: 'room', label: 'Oda' },
  { value: 'staff', label: 'Personel' },
  { value: 'other', label: 'Diğer' },
];

export const ResourceTab: React.FC<ResourceTabProps> = ({
  mode,
  values,
  disabled,
  hasResourceId,
  onChange,
  onSubmit,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const title = values.title.trim();
    if (!title) {
      toast.error('Ad zorunlu.');
      return;
    }
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <label className="form-label small mb-1">Ad</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            disabled={disabled}
            placeholder="Örn: Anna (Terapist)"
          />
          <div className="form-text small">Admin panelde görünen isim.</div>
        </div>

        <div className="col-12 col-lg-3">
          <label className="form-label small mb-1">Tür</label>
          <select
            className="form-select form-select-sm"
            value={values.type}
            onChange={(e) => onChange({ type: e.target.value as any })}
            disabled={disabled}
          >
            {RESOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="form-text small">Filtreleme ve raporlama için.</div>
        </div>

        <div className="col-12 col-lg-3">
          <label className="form-label small mb-1">Durum</label>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={values.is_active}
              onChange={(e) => onChange({ is_active: e.target.checked })}
              disabled={disabled}
            />
            <label className="form-check-label small">Aktif</label>
          </div>
          <div className="form-text small">
            Pasif kaynak public ekranda listelenmez (backend kuralı).
          </div>
        </div>
      </div>

      {!hasResourceId && mode === 'create' ? (
        <div className="alert alert-info mt-3 mb-0 small">
          Kaynak oluşturulduktan sonra <strong>Haftalık Plan</strong> ve{' '}
          <strong>Günlük Plan</strong> sekmeleri aktif olur.
        </div>
      ) : null}
    </form>
  );
};
