// =============================================================
// FILE: src/components/containers/appointment/_components/TherapistSelect.tsx
// FINAL — Therapist select (single therapist auto-selected and locked)
// - Ensures selected therapist is always present in options (no "disappearing")
// =============================================================

'use client';

import React, { useMemo } from 'react';
import type { ResourcePublicItemDto } from '@/integrations/types/resources.types';

import { safeStr, therapistLabelText } from '../_utils/appointmentHelpers';

export type TherapistSelectProps = {
  resources: ResourcePublicItemDto[];
  loading: boolean;
  fetching: boolean;
  error: boolean;
  selectedId: string;
  onChange: (rid: string) => void;

  // optional: availability suffix text
  getSuffix?: (rid: string) => string;

  // optional: filter list (e.g., only available after date picked)
  filteredResources?: ResourcePublicItemDto[];

  t: (key: string, fallback: string) => string;
  disabled?: boolean;
};

export const TherapistSelect: React.FC<TherapistSelectProps> = ({
  resources,
  filteredResources,
  loading,
  fetching,
  error,
  selectedId,
  onChange,
  getSuffix,
  t,
  disabled,
}) => {
  const rid = safeStr(selectedId);

  const isSingle = resources.length === 1;
  const listBase = filteredResources && filteredResources.length ? filteredResources : resources;

  // ✅ ensure selected therapist always included (prevents "kayboluyor")
  const options = useMemo(() => {
    const out = [...listBase];
    if (rid) {
      const already = out.some((r) => safeStr((r as any)?.id) === rid);
      if (!already) {
        const sel = resources.find((r) => safeStr((r as any)?.id) === rid);
        if (sel) out.unshift(sel);
      }
    }
    return out;
  }, [listBase, resources, rid]);

  const placeholder =
    loading || fetching
      ? t('ui_appointment_resource_loading', 'Terapistler yükleniyor...')
      : t('ui_appointment_resource_placeholder', 'Terapist seçin');

  return (
    <div className="form-group mb-15">

      <select
        className="form-select form-control"
        value={rid}
        onChange={(e) => onChange(e.target.value)}
        disabled={!!disabled || isSingle || loading || fetching}
      >
        {/* Tek terapistte placeholder göstermiyoruz, direkt option */}
        {!isSingle ? <option value="">{placeholder}</option> : null}

        {(isSingle ? resources : options).map((r) => {
          const id = safeStr((r as any).id);
          const name = therapistLabelText(r);
          const suffix = getSuffix && id ? safeStr(getSuffix(id)) : '';
          return (
            <option key={id || name} value={id}>
              {suffix ? `${name} • ${suffix}` : name}
            </option>
          );
        })}
      </select>

      {error ? (
        <div className="form-text text-warning">
          {t('ui_appointment_resource_error', 'Terapistler yüklenemedi.')}
        </div>
      ) : null}

      {!loading && !fetching && !error && resources.length === 0 ? (
        <div className="form-text text-warning">
          {t(
            'ui_appointment_resource_empty',
            'Şu an terapist bulunamadı. Lütfen daha sonra tekrar deneyin.',
          )}
        </div>
      ) : null}

      {isSingle ? (
        <div className="form-text">
          {t('ui_appointment_single_therapist', 'Terapist otomatik seçildi.')}
        </div>
      ) : null}
    </div>
  );
};
