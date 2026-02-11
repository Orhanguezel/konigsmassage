'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/services/_components/ServicesHeader.tsx
// guezelwebdesign – Admin Services Header (filters + locale + summary)
// - shadcn/tailwind theme
// - Locale source: useAdminLocales()
// - NO Category/SubCategory
// =============================================================

import * as React from 'react';

import type { BoolLike } from '@/integrations/shared';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const normalizeLocale = (v: unknown): string =>
  typeof v === 'string' ? v.trim().toLowerCase() : '';

const boolLikeToSelectValue = (v: BoolLike | undefined): string => {
  if (v === undefined) return '';
  if (v === true || v === 1 || v === '1' || v === 'true') return '1';
  if (v === false || v === 0 || v === '0' || v === 'false') return '0';
  return '';
};

const selectValueToBoolLike = (v: string): BoolLike | undefined => {
  if (v === '') return undefined;
  if (v === '1') return 1;
  if (v === '0') return 0;
  return undefined;
};

export type ServicesFilterState = {
  q?: string;
  is_active?: BoolLike;
  featured?: BoolLike;
  locale?: string;
};

export type ServicesHeaderProps = {
  loading: boolean;
  total: number;

  filters: ServicesFilterState;
  onChangeFilters: (patch: Partial<ServicesFilterState>) => void;

  onRefresh?: () => void;
  onCreateNew?: () => void;
};

type LocaleOption = { value: string; label: string };

export const ServicesHeader: React.FC<ServicesHeaderProps> = ({
  loading,
  total,
  filters,
  onChangeFilters,
  onRefresh,
  onCreateNew,
}) => {
  const t = useAdminT();

  // NOTE: Hook shape sende farklıysa sadece burada destructure değiştir
  const adminLocales = useAdminLocales() as any;

  const localesLoading: boolean =
    !!adminLocales?.loading || !!adminLocales?.isLoading || !!adminLocales?.isFetching;

  const defaultLocale: string = normalizeLocale(
    adminLocales?.defaultLocale ?? adminLocales?.default_locale ?? adminLocales?.default ?? '',
  );

  const localeOptions: LocaleOption[] = React.useMemo(() => {
    const raw = Array.isArray(adminLocales?.locales)
      ? adminLocales.locales
      : Array.isArray(adminLocales?.options)
        ? adminLocales.options
        : Array.isArray(adminLocales?.localeOptions)
          ? adminLocales.localeOptions
          : [];

    return raw
      .map((x: any) => ({
        value: normalizeLocale(x?.value ?? x?.code ?? x),
        label: String(x?.label ?? x?.name ?? x?.value ?? x?.code ?? x ?? '').trim(),
      }))
      .filter((x: LocaleOption) => !!x.value)
      .map((x: LocaleOption) => ({
        value: x.value,
        label: x.label || x.value.toUpperCase(),
      }));
  }, [adminLocales]);

  const effectiveLocale = React.useMemo(() => {
    const selected = normalizeLocale(filters.locale);
    const list = localeOptions.map((x) => x.value).filter(Boolean);

    if (selected && list.includes(selected)) return selected;
    if (defaultLocale && list.includes(defaultLocale)) return defaultLocale;
    return list[0] || '';
  }, [filters.locale, localeOptions, defaultLocale]);

  // auto-sync: filters.locale boşsa effectiveLocale set et
  React.useEffect(() => {
    if (localesLoading) return;
    if (normalizeLocale(filters.locale)) return;
    if (!effectiveLocale) return;

    onChangeFilters({ locale: effectiveLocale });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localesLoading, effectiveLocale]);

  const localeDisabled = loading || localesLoading || localeOptions.length === 0;

  const handleReset = () => {
    onChangeFilters({
      q: undefined,
      is_active: undefined,
      featured: undefined,
      // locale aynı kalsın
    });
  };

  const activeValue = boolLikeToSelectValue(filters.is_active);
  const featuredValue = boolLikeToSelectValue(filters.featured);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.services.header.title')}</CardTitle>
            <CardDescription>{t('admin.services.header.headerDescription')}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {t('admin.services.header.totalLabel')} <span className="font-medium text-foreground">{total}</span>
            </div>
            {loading ? <Badge variant="secondary">{t('admin.services.header.loading')}</Badge> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="svc-q">{t('admin.services.header.searchLabel')}</Label>
            <Input
              id="svc-q"
              type="search"
              placeholder={t('admin.services.header.searchPlaceholderLong')}
              value={filters.q ?? ''}
              onChange={(e) => onChangeFilters({ q: e.target.value || undefined })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.services.header.localeLabel')}</Label>
            <Select
              value={effectiveLocale || ''}
              onValueChange={(v) => onChangeFilters({ locale: normalizeLocale(v) || undefined })}
              disabled={localeDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.services.header.localePlaceholder')} />
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
                {t('admin.services.header.localeEmptyError')}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('admin.services.header.statusLabel')}</Label>
            <Select
              value={activeValue}
              onValueChange={(v) => onChangeFilters({ is_active: selectValueToBoolLike(v) })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.services.header.statusAllAlt')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('admin.services.header.statusAllAlt')}</SelectItem>
                <SelectItem value="1">{t('admin.services.header.statusOnlyActive')}</SelectItem>
                <SelectItem value="0">{t('admin.services.header.statusOnlyInactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.services.header.featuredLabel')}</Label>
            <Select
              value={featuredValue}
              onValueChange={(v) => onChangeFilters({ featured: selectValueToBoolLike(v) })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.services.header.statusAllAlt')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('admin.services.header.statusAllAlt')}</SelectItem>
                <SelectItem value="1">{t('admin.services.header.featuredItems')}</SelectItem>
                <SelectItem value="0">{t('admin.services.header.featuredOthers')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            {t('admin.services.header.clearFilters')}
          </Button>

          {onRefresh ? (
            <Button variant="outline" onClick={onRefresh} disabled={loading}>
              {t('admin.services.header.refreshButton')}
            </Button>
          ) : null}

          <div className="ml-auto">
            {onCreateNew ? (
              <Button onClick={onCreateNew} disabled={loading || localeDisabled}>
                {t('admin.services.header.createButtonLong')}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
