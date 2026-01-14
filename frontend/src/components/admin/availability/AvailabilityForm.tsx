// =============================================================
// FILE: src/components/admin/availability/AvailabilityForm.tsx
// FINAL — Admin Availability Form (Tabbed, split into components)
// FIX: dailyEditCtx state + props plumbing
// =============================================================

'use client';

import React, { useEffect, useState } from 'react';

import type { ResourceRowDto, ResourceType } from '@/integrations/types';

import { ResourceTab, type AvailabilityResourceValues } from './tabs/ResourceTab';
import { WeeklyWorkingHoursTab } from '@/components/containers/appointment/_utils/WeeklyWorkingHoursTab';
import { DailyPlanTab } from './tabs/DailyPlanTab';

const toStr = (v: unknown) => String(v ?? '').trim();

const isUuidLike = (v?: string) => {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
};

const toBool01 = (v: unknown) => {
  if (v === true) return true;
  if (v === false) return false;
  return Number(v ?? 0) === 1;
};

const RESOURCE_TYPES: ResourceType[] = ['therapist', 'doctor', 'table', 'room', 'staff', 'other'];

export type AvailabilityFormProps = {
  mode: 'create' | 'edit';
  initialData?: ResourceRowDto;
  loading: boolean;
  saving: boolean;
  onSubmit: (values: AvailabilityResourceValues) => void | Promise<void>;
  onCancel?: () => void;
};

export const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  onSubmit,
  onCancel,
}) => {
  const resourceId = toStr(initialData?.id);
  const hasResourceId = isUuidLike(resourceId);

  const [activeTab, setActiveTab] = useState<'resource' | 'weekly' | 'daily'>('resource');

  // ✅ FIX: daily edit context
  const [dailyEditCtx, setDailyEditCtx] = useState<{ dow?: number; wh_id?: string }>({});

  const [values, setValues] = useState<AvailabilityResourceValues>(() => {
    const dtoType = toStr((initialData as any)?.type) as ResourceType;
    const safeType: ResourceType = RESOURCE_TYPES.includes(dtoType) ? dtoType : 'therapist';
    return {
      title: toStr((initialData as any)?.title),
      type: safeType,
      is_active: toBool01((initialData as any)?.is_active ?? 1),
    };
  });

  useEffect(() => {
    const dtoType = toStr((initialData as any)?.type) as ResourceType;
    const safeType: ResourceType = RESOURCE_TYPES.includes(dtoType) ? dtoType : 'therapist';
    setValues({
      title: toStr((initialData as any)?.title),
      type: safeType,
      is_active: toBool01((initialData as any)?.is_active ?? 1),
    });
  }, [initialData]);

  const disabled = loading || saving;

  const submitResource = async () => {
    const title = values.title.trim();
    await onSubmit({ ...values, title });
  };

  return (
    <div className="card konigsmassage-admin-card">
      <div className="card-header py-2 konigsmassage-admin-card__header">
        <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-2">
          <div>
            <h5 className="mb-1 small fw-semibold text-truncate">
              {mode === 'create' ? 'Yeni Kaynak' : 'Kaynak Yönetimi'}
            </h5>
            <div className="text-muted small text-truncate">
              Kaynak bilgileri + haftalık plan + günlük plan.
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={
                  'btn btn-outline-secondary btn-sm' + (activeTab === 'resource' ? ' active' : '')
                }
                onClick={() => setActiveTab('resource')}
                disabled={disabled}
              >
                Kaynak
              </button>

              <button
                type="button"
                className={
                  'btn btn-outline-secondary btn-sm' + (activeTab === 'weekly' ? ' active' : '')
                }
                onClick={() => setActiveTab('weekly')}
                disabled={disabled || !hasResourceId}
                title={!hasResourceId ? 'Önce kaynak oluştur.' : undefined}
              >
                Haftalık Plan
              </button>

              <button
                type="button"
                className={
                  'btn btn-outline-secondary btn-sm' + (activeTab === 'daily' ? ' active' : '')
                }
                onClick={() => setActiveTab('daily')}
                disabled={disabled || !hasResourceId}
                title={!hasResourceId ? 'Önce kaynak oluştur.' : undefined}
              >
                Günlük Plan
              </button>
            </div>

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

            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={disabled}
              onClick={() => void submitResource()}
            >
              {saving
                ? mode === 'create'
                  ? 'Oluşturuluyor...'
                  : 'Kaydediliyor...'
                : mode === 'create'
                ? 'Oluştur'
                : 'Kaydet'}
            </button>

            {loading ? <span className="badge bg-secondary small">Yükleniyor...</span> : null}
          </div>
        </div>
      </div>

      <div className="card-body konigsmassage-admin-card__body">
        {activeTab === 'resource' ? (
          <ResourceTab
            mode={mode}
            values={values}
            disabled={disabled}
            hasResourceId={hasResourceId}
            onChange={(patch) => setValues((p) => ({ ...p, ...patch }))}
            onSubmit={submitResource}
          />
        ) : null}

        {activeTab === 'weekly' ? (
          <WeeklyWorkingHoursTab
            resourceId={resourceId}
            hasResourceId={hasResourceId}
            disabled={disabled}
            onEditDay={({ dow, wh_id }) => {
              setDailyEditCtx({ dow, wh_id });
              setActiveTab('daily');
            }}
          />
        ) : null}

        {activeTab === 'daily' ? (
          <DailyPlanTab
            resourceId={resourceId}
            hasResourceId={hasResourceId}
            disabled={disabled}
            initialDow={dailyEditCtx.dow}
            initialWhId={dailyEditCtx.wh_id}
          />
        ) : null}
      </div>
    </div>
  );
};
