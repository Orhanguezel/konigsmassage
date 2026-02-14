'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/footer-sections/_components/admin-footer-sections-client.tsx
// FINAL — Admin Footer Sections List (App Router + shadcn)
// ✅ Refetch error fixed
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, RefreshCcw, Search, Trash2, Pencil, Loader2 } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { localeShortClientOr } from '@/i18n/localeShortClient';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  AdminLocaleSelect,
  type AdminLocaleOption,
} from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type { FooterSectionDto, FooterSectionListQueryParams } from '@/integrations/shared';
import {
  useListFooterSectionsAdminQuery,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
} from '@/integrations/hooks';

type ActiveFilter = 'all' | 'active' | 'inactive';

type Filters = {
  search: string;
  activeFilter: ActiveFilter;
  locale: string;
};

function fmtDate(val: string | null | undefined, localeStr: string) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString(localeStr, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function truncate(text: string | null | undefined, max = 40) {
  const t = text || '';
  if (t.length <= max) return t || '-';
  return t.slice(0, max - 1) + '…';
}

function getErrMsg(e: unknown, defaultMsg: string = 'Operation failed'): string {
  const anyErr = e as any;
  return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.message || defaultMsg;
}

export default function AdminFooterSectionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useAdminT();

  // Locale management
  const {
    localeOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  const [filters, setFilters] = React.useState<Filters>(() => ({
    search: '',
    activeFilter: 'all',
    locale: '',
  }));

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<FooterSectionDto | null>(null);

  // Set initial locale once when locales are loaded
  React.useEffect(() => {
    if (!filters.locale && defaultLocaleFromDb) {
      const urlLocale = searchParams.get('locale') || '';
      const initialLocale =
        urlLocale ||
        defaultLocaleFromDb ||
        localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de') ||
        'de';

      setFilters((prev) => ({ ...prev, locale: initialLocale }));
    }
  }, [defaultLocaleFromDb, searchParams, filters.locale]);

  // Update URL when locale changes (with guard to prevent loop)
  React.useEffect(() => {
    if (!filters.locale) return;

    const currentUrlLocale = searchParams.get('locale') || '';
    if (currentUrlLocale === filters.locale) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('locale', filters.locale);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters.locale, router, searchParams]);

  // Build query params
  const queryParams = React.useMemo((): FooterSectionListQueryParams => {
    const apiLocale = filters.locale || defaultLocaleFromDb || 'de';

    return {
      q: filters.search || undefined,
      is_active:
        filters.activeFilter === 'active'
          ? true
          : filters.activeFilter === 'inactive'
            ? false
            : undefined,
      locale: apiLocale,
      sort: 'display_order',
      orderDir: 'asc',
    };
  }, [filters, defaultLocaleFromDb]);

  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
  } = useListFooterSectionsAdminQuery(queryParams);

  const [updateSection] = useUpdateFooterSectionAdminMutation();
  const [deleteSection] = useDeleteFooterSectionAdminMutation();

  const items = result?.items || [];
  const total = result?.total || 0;

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleActiveFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, activeFilter: value as ActiveFilter }));
  };

  const handleLocaleChange = (locale: string) => {
    const coerced = coerceLocale(locale, defaultLocaleFromDb);
    setFilters((prev) => ({ ...prev, locale: coerced }));
  };

  const handleToggleActive = async (item: FooterSectionDto) => {
    try {
      await updateSection({
        id: item.id,
        data: { is_active: !item.is_active },
      }).unwrap();
      toast.success(
        item.is_active
          ? t('footerSections.list.statusPassive')
          : t('footerSections.list.statusActive'),
      );
    } catch (err) {
      toast.error(getErrMsg(err, 'Status update failed'));
    }
  };

  const handleEdit = (item: FooterSectionDto) => {
    router.push(`/admin/footer-sections/${item.id}`);
  };

  const handleDeleteClick = (item: FooterSectionDto) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteSection(itemToDelete.id).unwrap();
      toast.success(t('footerSections.list.deleted'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      toast.error(t('footerSections.list.deleteError'));
    }
  };

  const busy = isLoading;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>{t('footerSections.header.title')}</CardTitle>
                <CardDescription>{t('footerSections.header.description')}</CardDescription>
              </div>
              <Button
                onClick={() => router.push('/admin/footer-sections/new')}
                disabled={busy}
                className="gap-2"
              >
                <Plus className="size-4" />
                {t('footerSections.header.create')}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm">
                  {t('footerSections.header.searchLabel')}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('footerSections.header.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={busy}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Active Filter */}
              <div className="space-y-2">
                <Label htmlFor="activeFilter" className="text-sm">
                  {t('footerSections.header.activeLabel')}
                </Label>
                <Select
                  value={filters.activeFilter}
                  onValueChange={handleActiveFilterChange}
                  disabled={busy}
                >
                  <SelectTrigger id="activeFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('footerSections.header.activeOptions.all')}
                    </SelectItem>
                    <SelectItem value="active">
                      {t('footerSections.header.activeOptions.active')}
                    </SelectItem>
                    <SelectItem value="inactive">
                      {t('footerSections.header.activeOptions.inactive')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Locale */}
              <div className="sm:col-span-2 lg:col-span-1">
                <AdminLocaleSelect
                  value={filters.locale || defaultLocaleFromDb || ''}
                  onChange={handleLocaleChange}
                  options={safeLocaleOptions}
                  loading={localesLoading}
                  disabled={busy}
                />
              </div>

              {/* Refresh */}
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={busy}
                  className="w-full gap-2 sm:w-auto"
                >
                  <RefreshCcw className={cn('size-4', isFetching && 'animate-spin')} />
                  {t('common.refresh', undefined, 'Refresh')}
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {t('slider.header.total', undefined, 'Found:')} <strong>{total}</strong>
              </span>
              {isFetching && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('footerSections.header.loading')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table (Desktop) */}
        <Card className="hidden xl:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>{t('footerSections.list.title')}</TableHead>
                  <TableHead>{t('footerSections.list.slug')}</TableHead>
                  <TableHead className="w-24 text-center">
                    {t('footerSections.list.active')}
                  </TableHead>
                  <TableHead className="w-32">Locale</TableHead>
                  <TableHead className="w-44">{t('footerSections.list.createdAt')}</TableHead>
                  <TableHead className="w-40 text-right">
                    {t('footerSections.list.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin" />
                        <span>{t('footerSections.header.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t('footerSections.list.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {item.display_order}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.title || '-'}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {truncate(item.description, 60)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {item.slug || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                        />
                      </TableCell>
                      <TableCell>
                        {item.locale ? (
                          <Badge variant="outline">{item.locale}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{fmtDate(item.created_at, filters.locale)}</div>
                        <div className="text-[10px]">
                          Upd: {fmtDate(item.updated_at, filters.locale)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Pencil className="size-3.5" />
                            {t('footerSections.header.edit')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Trash2 className="size-3.5" />
                            {t('footerSections.header.delete')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cards (Mobile) */}
        <div className="space-y-4 xl:hidden">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>{t('footerSections.header.loading')}</span>
                </div>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('footerSections.list.empty')}
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">#{item.display_order}</Badge>
                        {item.locale && <Badge variant="outline">{item.locale}</Badge>}
                      </div>
                      <h3 className="font-semibold">{item.title || '-'}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {truncate(item.description, 80)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">{t('footerSections.list.active')}</Label>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggleActive(item)}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {t('footerSections.list.slug')}
                    </Label>
                    <code className="block rounded bg-muted px-2 py-1 text-xs">
                      {item.slug || '-'}
                    </code>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Create: {fmtDate(item.created_at, filters.locale)}</div>
                    <div>Update: {fmtDate(item.updated_at, filters.locale)}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Pencil className="size-3.5" />
                      {t('footerSections.header.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Trash2 className="size-3.5" />
                      {t('footerSections.header.delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('footerSections.list.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('footerSections.list.deleteConfirmDesc')}
              <br />
              <strong>{itemToDelete?.title || '-'}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('footerSections.list.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t('footerSections.list.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
