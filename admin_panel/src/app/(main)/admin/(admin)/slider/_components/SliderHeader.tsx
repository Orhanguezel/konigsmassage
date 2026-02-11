'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/_components/SliderHeader.tsx
// Admin Slider Header (shadcn/tailwind)
// - Locale: parent passes options
// - Filters: q + locale + onlyActive
// =============================================================

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type AdminLocaleOption = { value: string; label: string };

export type SliderHeaderProps = {
  search: string;
  onSearchChange: (v: string) => void;

  locale: string;
  onLocaleChange: (v: string) => void;

  showOnlyActive: boolean;
  onShowOnlyActiveChange: (v: boolean) => void;

  loading: boolean;
  total?: number;

  onRefresh?: () => void;
  onCreateClick?: () => void;

  locales: AdminLocaleOption[];
  localesLoading?: boolean;
};

const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

export function SliderHeader({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
  showOnlyActive,
  onShowOnlyActiveChange,
  loading,
  total,
  onRefresh,
  onCreateClick,
  locales,
  localesLoading,
}: SliderHeaderProps) {
  const t = useAdminT();
  const localeOptions = React.useMemo(
    () =>
      (locales ?? [])
        .map((x) => ({ value: norm(x.value), label: String(x.label || '').trim() }))
        .filter((x) => !!x.value),
    [locales],
  );

  const effectiveLocale = React.useMemo(() => {
    const selected = norm(locale);
    const list = new Set(localeOptions.map((x) => x.value));
    if (selected && list.has(selected)) return selected;
    return localeOptions?.[0]?.value || '';
  }, [locale, localeOptions]);

  // auto-repair (if parent forgets)
  React.useEffect(() => {
    if (localesLoading) return;
    if (norm(locale)) return;
    if (!localeOptions?.[0]?.value) return;
    onLocaleChange(localeOptions[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localesLoading, localeOptions]);

  const localeDisabled = loading || !!localesLoading || localeOptions.length === 0;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.slider.header.title')}</CardTitle>
            <CardDescription>
              {t('admin.slider.header.description')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {typeof total === 'number' ? (
              <div className="text-sm text-muted-foreground">
                {t('admin.slider.header.total')} <span className="font-medium text-foreground">{total}</span>
              </div>
            ) : null}
            {loading ? <Badge variant="secondary">{t('admin.slider.header.loading')}</Badge> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="slider-q">{t('admin.slider.header.searchLabel')}</Label>
            <Input
              id="slider-q"
              type="search"
              placeholder={t('admin.slider.header.searchPlaceholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.slider.header.localeLabel')}</Label>
            <Select
              value={effectiveLocale || ''}
              onValueChange={(v) => onLocaleChange(norm(v))}
              disabled={localeDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.slider.header.localePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {localeOptions.map((opt) => (
                  <SelectItem key={`${opt.value}:${opt.label}`} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!localesLoading && localeOptions.length === 0 ? (
              <p className="text-xs text-destructive">
                <strong>{t('admin.slider.header.localeEmptyError')}</strong> {t('admin.slider.header.localeEmptyHelp')}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('admin.slider.header.filterLabel')}</Label>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{t('admin.slider.header.onlyActiveLabel')}</div>
                <div className="text-xs text-muted-foreground">{t('admin.slider.header.onlyActiveHelp')}</div>
              </div>
              <Switch
                checked={showOnlyActive}
                onCheckedChange={(v) => onShowOnlyActiveChange(!!v)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh ? (
            <Button variant="outline" onClick={onRefresh} disabled={loading}>
              {t('admin.slider.header.refreshButton')}
            </Button>
          ) : null}

          <div className="ml-auto">
            {onCreateClick ? (
              <Button onClick={onCreateClick} disabled={loading || localeDisabled}>
                {t('admin.slider.header.createButton')}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
