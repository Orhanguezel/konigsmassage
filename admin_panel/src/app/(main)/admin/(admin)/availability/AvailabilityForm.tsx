// =============================================================
// FILE: src/components/admin/availability/AvailabilityForm.tsx
// FINAL — Admin Availability Form (Tabbed, split into components)
// FIX: dailyEditCtx state + props plumbing
// =============================================================

'use client';

import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { AvailabilityResourceValues, ResourceRowDto, ResourceType } from '@/integrations/shared';
import { RESOURCE_TYPE_VALUES, isUuidLike, toActiveBool } from '@/integrations/shared';

import { ResourceTab } from './tabs/ResourceTab';
import { WeeklyWorkingHoursTab } from './_components/WeeklyWorkingHoursTab';
import { DailyPlanTab } from './tabs/DailyPlanTab';

const toStr = (v: unknown) => String(v ?? '').trim();

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
    const safeType: ResourceType = RESOURCE_TYPE_VALUES.includes(dtoType) ? dtoType : 'therapist';
    return {
      title: toStr((initialData as any)?.title),
      type: safeType,
      is_active: toActiveBool((initialData as any)?.is_active ?? 1),
      capacity: Number((initialData as any)?.capacity ?? 1),
      external_ref_id: (initialData as any)?.external_ref_id
        ? String((initialData as any)?.external_ref_id)
        : null,
    };
  });

  useEffect(() => {
    const dtoType = toStr((initialData as any)?.type) as ResourceType;
    const safeType: ResourceType = RESOURCE_TYPE_VALUES.includes(dtoType) ? dtoType : 'therapist';
    setValues({
      title: toStr((initialData as any)?.title),
      type: safeType,
      is_active: toActiveBool((initialData as any)?.is_active ?? 1),
      capacity: Number((initialData as any)?.capacity ?? 1),
      external_ref_id: (initialData as any)?.external_ref_id
        ? String((initialData as any)?.external_ref_id)
        : null,
    });
  }, [initialData]);

  const disabled = loading || saving;

  const submitResource = async () => {
    const title = values.title.trim();
    const capacity = Number(values.capacity ?? 1);
    const external_ref_id = values.external_ref_id ? values.external_ref_id.trim() : null;
    await onSubmit({
      ...values,
      title,
      capacity: Number.isFinite(capacity) && capacity > 0 ? Math.floor(capacity) : 1,
      external_ref_id: external_ref_id || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{mode === 'create' ? 'Yeni Kaynak' : 'Kaynak Yönetimi'}</CardTitle>
            <CardDescription>Kaynak bilgileri + haftalık plan + günlük plan.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCancel ? (
              <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
                Geri
              </Button>
            ) : null}

            <Button size="sm" onClick={() => void submitResource()} disabled={disabled}>
              {saving
                ? mode === 'create'
                  ? 'Oluşturuluyor...'
                  : 'Kaydediliyor...'
                : mode === 'create'
                  ? 'Oluştur'
                  : 'Kaydet'}
            </Button>

            {loading ? (
              <Badge variant="secondary" className="text-xs">
                Yükleniyor...
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="resource" disabled={disabled}>
              Kaynak
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              disabled={disabled || !hasResourceId}
              title={!hasResourceId ? 'Önce kaynak oluştur.' : undefined}
            >
              Haftalık Plan
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              disabled={disabled || !hasResourceId}
              title={!hasResourceId ? 'Önce kaynak oluştur.' : undefined}
            >
              Günlük Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resource">
            <ResourceTab
              mode={mode}
              values={values}
              disabled={disabled}
              hasResourceId={hasResourceId}
              onChange={(patch) => setValues((p) => ({ ...p, ...patch }))}
              onSubmit={submitResource}
            />
          </TabsContent>

          <TabsContent value="weekly">
            <WeeklyWorkingHoursTab
              resourceId={resourceId}
              hasResourceId={hasResourceId}
              disabled={disabled}
              onEditDay={({ dow, wh_id }) => {
                setDailyEditCtx({ dow, wh_id });
                setActiveTab('daily');
              }}
            />
          </TabsContent>

          <TabsContent value="daily">
            <DailyPlanTab
              resourceId={resourceId}
              hasResourceId={hasResourceId}
              disabled={disabled}
              initialDow={dailyEditCtx.dow}
              initialWhId={dailyEditCtx.wh_id}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
