// =============================================================
// FILE: src/components/admin/availability/tabs/ResourceTab.tsx
// FINAL — Resource editor tab
// =============================================================

'use client';

import React from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { AvailabilityResourceValues, ResourceType } from '@/integrations/shared';
import { RESOURCE_TYPE_OPTIONS } from '@/integrations/shared';

export type ResourceTabProps = {
  mode: 'create' | 'edit';
  values: AvailabilityResourceValues;
  disabled: boolean;
  hasResourceId: boolean;
  onChange: (patch: Partial<AvailabilityResourceValues>) => void;
  onSubmit: () => void | Promise<void>;
};

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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Ad</Label>
          <Input
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            disabled={disabled}
            placeholder="Örn: Anna (Terapist)"
          />
          <div className="text-xs text-muted-foreground">Admin panelde görünen isim.</div>
        </div>

        <div className="space-y-2">
          <Label>Tür</Label>
          <Select
            value={values.type}
            onValueChange={(v) => onChange({ type: v as ResourceType })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">Filtreleme ve raporlama için.</div>
        </div>

        <div className="space-y-2">
          <Label>Kapasite</Label>
          <Input
            type="number"
            min={1}
            value={values.capacity}
            onChange={(e) => onChange({ capacity: Number(e.target.value) })}
            disabled={disabled}
          />
          <div className="text-xs text-muted-foreground">
            Haftalık plan kapasitesi bu değeri aşamaz.
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dış Referans (opsiyonel)</Label>
          <Input
            type="text"
            value={values.external_ref_id ?? ''}
            onChange={(e) => onChange({ external_ref_id: e.target.value || null })}
            disabled={disabled}
          />
          <div className="text-xs text-muted-foreground">Harici sistem id / ref.</div>
        </div>

        <div className="space-y-2">
          <Label>Durum</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={values.is_active}
              onCheckedChange={(v) => onChange({ is_active: v })}
              disabled={disabled}
            />
            <span className="text-sm">Aktif</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Pasif kaynak public ekranda listelenmez (backend kuralı).
          </div>
        </div>
      </div>

      {!hasResourceId && mode === 'create' ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Kaynak oluşturulduktan sonra <strong>Haftalık Plan</strong> ve{' '}
          <strong>Günlük Plan</strong> sekmeleri aktif olur.
        </div>
      ) : null}
    </form>
  );
};
