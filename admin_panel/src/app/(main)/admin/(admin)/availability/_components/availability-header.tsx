// =============================================================
// FILE: src/components/admin/availability/AvailabilityHeader.tsx
// guezelwebdesign – Admin Availability Header (filters + summary)
// FINAL — Turkish UI
// =============================================================

import React from 'react';
import Link from 'next/link';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
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

const ALL = '__all__' as const;

export const AvailabilityHeader: React.FC<AvailabilityHeaderProps> = ({
  filters,
  total,
  loading,
  onFiltersChange,
  onRefresh,
}) => {
  const t = useAdminT();

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t("admin.availability.header.title", undefined, "Müsaitlik Yönetimi")}</CardTitle>
            <CardDescription>
              {t(
                "admin.availability.header.description",
                undefined,
                "Kaynakları (therapist/oda/masa vb.) ve haftalık çalışma saatlerini yönet.",
              )}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <Badge variant="secondary" className="text-xs">
                {t("admin.availability.common.loading", undefined, "Yükleniyor...")}
              </Badge>
            ) : null}
            {onRefresh ? (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                {t("admin.availability.header.actions.refresh", undefined, "Yenile")}
              </Button>
            ) : null}
            <Button asChild size="sm">
              <Link href="/admin/availability/new">
                {t("admin.availability.header.actions.create", undefined, "Yeni Kaynak")}
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("admin.availability.filters.searchLabel", undefined, "Ara (ad / referans)")}</Label>
            <Input
              type="search"
              placeholder={t("admin.availability.filters.searchPlaceholder", undefined, "Örn: Anna, ref:room-2")}
              value={filters.q}
              onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
            />
            <div className="text-xs text-muted-foreground">
              {t("admin.availability.filters.searchHelp", undefined, "Referans aramak için")} <code>ref:</code>{" "}
              {t("admin.availability.filters.searchHelpSuffix", undefined, "kullanabilirsin.")}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("admin.availability.filters.typeLabel", undefined, "Tür")}</Label>
            <Select
              value={filters.type}
              onValueChange={(v) => onFiltersChange({ ...filters, type: v as ResourceType | '' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPE_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || ALL} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("admin.availability.filters.statusLabel", undefined, "Durum")}</Label>
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
                <SelectItem value={ALL}>{t("admin.availability.filters.statusOptions.all", undefined, "Hepsi")}</SelectItem>
                <SelectItem value="active">
                  {t("admin.availability.filters.statusOptions.active", undefined, "Aktif")}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("admin.availability.filters.statusOptions.inactive", undefined, "Pasif")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {t(
              "admin.availability.header.note",
              undefined,
              "Haftalık çalışma saatleri, plan/slot üretiminin kaynağıdır. Gün iptali (override-day) rezervasyonu kapatır.",
            )}
          </div>
          <Badge variant="outline">
            {t("admin.availability.header.total", { total }, "Toplam: {total}")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
