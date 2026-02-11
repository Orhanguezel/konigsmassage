// =============================================================
// FILE: src/components/admin/availability/AvailabilityHeader.tsx
// guezelwebdesign – Admin Availability Header (filters + summary)
// FINAL — Turkish UI
// =============================================================

import React from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ResourceType } from '@/integrations/shared';
import { RESOURCE_TYPE_FILTER_OPTIONS } from '@/integrations/shared';

export type AvailabilityFilters = {
  q: string;
  type: ResourceType | '';
  status: 'all' | 'active' | 'inactive';
};

export type AvailabilityHeaderProps = {
  filters: AvailabilityFilters;
  total: number;
  loading?: boolean;
  onFiltersChange: (next: AvailabilityFilters) => void;
  onRefresh?: () => void;
};

export const AvailabilityHeader: React.FC<AvailabilityHeaderProps> = ({
  filters,
  total,
  loading,
  onFiltersChange,
  onRefresh,
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Müsaitlik Yönetimi</CardTitle>
            <CardDescription>
              Kaynakları (therapist/oda/masa vb.) ve haftalık çalışma saatlerini yönet.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <Badge variant="secondary" className="text-xs">
                Yükleniyor...
              </Badge>
            ) : null}
            {onRefresh ? (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Yenile
              </Button>
            ) : null}
            <Button asChild size="sm">
              <Link href="/admin/availability/new">Yeni Kaynak</Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Ara (ad / referans)</Label>
            <Input
              type="search"
              placeholder="Örn: Anna, ref:room-2"
              value={filters.q}
              onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
            />
            <div className="text-xs text-muted-foreground">
              Referans aramak için <code>ref:</code> kullanabilirsin.
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tür</Label>
            <Select
              value={filters.type}
              onValueChange={(v) => onFiltersChange({ ...filters, type: v as ResourceType | '' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPE_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Durum</Label>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onFiltersChange({ ...filters, status: v as AvailabilityFilters['status'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hepsi</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Haftalık çalışma saatleri, plan/slot üretiminin kaynağıdır. Gün iptali (override-day)
            rezervasyonu kapatır.
          </div>
          <Badge variant="outline">Toplam: {total}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
