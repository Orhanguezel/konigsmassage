'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/menuitem/admin-menuitem-client.tsx
// FINAL — Admin Menu Items List (App Router + shadcn)
// ✅ All TypeScript errors fixed
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Save,
  Search,
  Trash2,
  Pencil,
  GripVertical,
} from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';

import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type {
  AdminMenuItemDto,
  AdminMenuItemListQueryParams,
  MenuLocation,
} from '@/integrations/shared';
import {
  useListMenuItemsAdminQuery,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
  useReorderMenuItemsAdminMutation,
} from '@/integrations/hooks';

type ActiveFilter = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | 'page' | 'custom';

type Filters = {
  search: string;
  activeFilter: ActiveFilter;
  location: MenuLocation | 'all';
  type: TypeFilter;
  locale: string;
};

function truncate(text: string | null | undefined, max = 40) {
  const t = text || '';
  if (t.length <= max) return t || '-';
  return t.slice(0, max - 1) + '…';
}

export default function AdminMenuItemClient() {
  const t = useAdminT('admin.menuitem');
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const router = useRouter();
  const sp = useSearchParams();

  const fmtDate = React.useCallback(
    (val: string | null | undefined) => {
      if (!val) return '-';
      try {
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) return String(val);
        return d.toLocaleString(adminLocale || undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return String(val);
      }
    },
    [adminLocale],
  );

  const getErrMsg = React.useCallback(
    (e: unknown): string => {
      const anyErr = e as any;
      return (
        anyErr?.data?.error?.message ||
        anyErr?.data?.message ||
        anyErr?.message ||
        t('form.errors.generic')
      );
    },
    [t],
  );

  const {
    localeOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
    fetching: localesFetching,
  } = useAdminLocales();

  const apiLocale = React.useMemo(() => {
    return resolveAdminApiLocale(localeOptions as any, defaultLocaleFromDb, 'de');
  }, [localeOptions, defaultLocaleFromDb]);

  const urlLocale = React.useMemo(() => {
    const q = sp?.get('locale');
    return localeShortClient(q) || '';
  }, [sp]);

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    activeFilter: 'all',
    location: 'all',
    type: 'all',
    locale: '',
  });

  const [reorderMode, setReorderMode] = React.useState(false);
  const [reorderedItems, setReorderedItems] = React.useState<AdminMenuItemDto[]>([]);

  // init locale from URL -> DB default -> fallback
  React.useEffect(() => {
    if (!localeOptions || localeOptions.length === 0) return;

    setFilters((prev) => {
      const prevLoc = localeShortClient(prev.locale);
      const urlLoc = localeShortClient(urlLocale);
      const defLoc = localeShortClientOr(apiLocale, 'de');

      const canUse = (l: string) =>
        !!l && (localeOptions ?? []).some((x: any) => localeShortClient(x.value) === l);

      if (prevLoc && canUse(prevLoc)) return prev;

      if (urlLoc && canUse(urlLoc)) return { ...prev, locale: urlLoc };

      if (defLoc && canUse(defLoc)) return { ...prev, locale: defLoc };

      return { ...prev, locale: localeShortClient((localeOptions as any)?.[0]?.value) || 'de' };
    });
  }, [localeOptions, urlLocale, apiLocale]);

  const effectiveLocale = React.useMemo(() => {
    const l = localeShortClient(filters.locale);
    return l || apiLocale;
  }, [filters.locale, apiLocale]);

  // locale -> URL sync
  React.useEffect(() => {
    const l = localeShortClient(filters.locale);
    if (!l) return;
    if (l === urlLocale) return;

    const params = new URLSearchParams(sp?.toString() || '');
    params.set('locale', l);
    router.replace(`/admin/menuitem?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locale]);

  const is_active = React.useMemo(() => {
    if (filters.activeFilter === 'all') return undefined;
    return filters.activeFilter === 'active' ? 1 : 0;
  }, [filters.activeFilter]);

  const queryParams = React.useMemo(() => {
    const qp: AdminMenuItemListQueryParams = {
      q: filters.search.trim() || undefined,
      locale: effectiveLocale || undefined,
      is_active,
      location: filters.location === 'all' ? undefined : filters.location,
      limit: 200,
      offset: 0,
      sort: 'display_order',
      order: 'asc',
    };
    return qp;
  }, [filters.search, effectiveLocale, is_active, filters.location]);

  const { data: result, isLoading, isFetching, refetch } = useListMenuItemsAdminQuery(queryParams);

  // ✅ FIX: Extract items array from response
  const items = React.useMemo(() => {
    if (!result) return [];
    // If result is already an array, use it directly
    if (Array.isArray(result)) return result;
    // If result has items property, use that
    if ('items' in result && Array.isArray(result.items)) return result.items;
    return [];
  }, [result]);

  const [updateMenuItem, { isLoading: isUpdating }] = useUpdateMenuItemAdminMutation();
  const [deleteMenuItem, { isLoading: isDeleting }] = useDeleteMenuItemAdminMutation();
  const [reorderMenuItems, { isLoading: isReordering }] = useReorderMenuItemsAdminMutation();

  const busy = isLoading || isFetching || isUpdating || isDeleting || isReordering;

  // Client-side type filter
  const filteredItems = React.useMemo(() => {
    if (filters.type === 'all') return items;
    return items.filter((item: AdminMenuItemDto) => item.type === filters.type);
  }, [items, filters.type]);

  React.useEffect(() => {
    setReorderedItems(filteredItems);
  }, [filteredItems]);

  const handleRefresh = () => {
    refetch();
  };

  const handleCreate = () => {
    router.push('/admin/menuitem/new');
  };

  const handleEdit = (item: AdminMenuItemDto) => {
    router.push(`/admin/menuitem/${encodeURIComponent(item.id)}`);
  };

  const handleDelete = async (item: AdminMenuItemDto) => {
    if (!confirm(t('list.deleteConfirm', { title: item.title }))) return;

    try {
      await deleteMenuItem({ id: item.id }).unwrap();
      toast.success(t('list.deleted'));
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleToggleActive = async (item: AdminMenuItemDto) => {
    try {
      // ✅ FIX: Changed 'body' to 'data' (correct RTK Query parameter name)
      await updateMenuItem({
        id: item.id,
        data: { is_active: item.is_active ? 0 : 1 },
      }).unwrap();
      toast.success(item.is_active ? t('list.statusPassive') : t('list.statusActive'));
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...reorderedItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setReorderedItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === reorderedItems.length - 1) return;
    const newItems = [...reorderedItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setReorderedItems(newItems);
  };

  const handleSaveOrder = async () => {
    const payload = {
      items: reorderedItems.map((item, idx) => ({
        id: item.id,
        display_order: idx + 1,
      })),
    };

    try {
      await reorderMenuItems(payload).unwrap();
      toast.success(t('list.orderSaved'));
      setReorderMode(false);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleCancelReorder = () => {
    setReorderMode(false);
    setReorderedItems(filteredItems);
  };

  const displayItems = reorderMode ? reorderedItems : filteredItems;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{t('header.title')}</CardTitle>
              <CardDescription>{t('header.total', { count: displayItems.length })}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {reorderMode ? (
                <>
                  <Button onClick={handleSaveOrder} disabled={busy} size="sm">
                    <Save className="mr-2 size-4" />
                    {t('list.saveOrder')}
                  </Button>
                  <Button onClick={handleCancelReorder} variant="outline" size="sm">
                    {t('admin.common.cancel')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setReorderMode(true)}
                    variant="outline"
                    size="sm"
                    disabled={busy || displayItems.length === 0}
                  >
                    <GripVertical className="mr-2 size-4" />
                    {t('header.sortLabel')}
                  </Button>
                  <Button onClick={handleRefresh} disabled={busy} variant="outline" size="sm">
                    <RefreshCcw className={cn('mr-2 size-4', busy && 'animate-spin')} />
                    {t('header.refresh')}
                  </Button>
                  <Button onClick={handleCreate} size="sm">
                    <Plus className="mr-2 size-4" />
                    {t('header.create')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      {!reorderMode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t('header.filtersTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">{t('header.searchLabel')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    className="pl-9"
                    placeholder={t('header.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  />
                </div>
              </div>

              {/* Locale */}
              <div className="space-y-2">
                <Label htmlFor="locale">{t('header.localeLabel')}</Label>
                <Select
                  value={filters.locale}
                  onValueChange={(v) => setFilters((p) => ({ ...p, locale: v }))}
                >
                  <SelectTrigger id="locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {localeOptions.map((opt: any) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">{t('list.columns.location')}</Label>
                <Select
                  value={filters.location}
                  onValueChange={(v) => setFilters((p) => ({ ...p, location: v as any }))}
                >
                  <SelectTrigger id="location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('header.allStats')}</SelectItem>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">{t('list.columns.type')}</Label>
                <Select
                  value={filters.type}
                  onValueChange={(v) => setFilters((p) => ({ ...p, type: v as TypeFilter }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('header.allStats')}</SelectItem>
                    <SelectItem value="page">{t('list.types.page')}</SelectItem>
                    <SelectItem value="custom">{t('list.types.custom')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filter */}
              <div className="space-y-2">
                <Label htmlFor="activeFilter">{t('header.activeLabel')}</Label>
                <Select
                  value={filters.activeFilter}
                  onValueChange={(v) =>
                    setFilters((p) => ({ ...p, activeFilter: v as ActiveFilter }))
                  }
                >
                  <SelectTrigger id="activeFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('header.allStats')}</SelectItem>
                    <SelectItem value="active">{t('header.active')}</SelectItem>
                    <SelectItem value="inactive">{t('header.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden overflow-auto xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {reorderMode && <TableHead className="w-12"></TableHead>}
                  <TableHead className="w-50">{t('list.columns.title')}</TableHead>
                  <TableHead className="w-25">{t('list.columns.location')}</TableHead>
                  <TableHead className="w-25">{t('list.columns.type')}</TableHead>
                  <TableHead className="w-50">{t('list.columns.url')}</TableHead>
                  <TableHead className="w-20">{t('list.columns.active')}</TableHead>
                  <TableHead className="w-20">{t('header.sortOrder')}</TableHead>
                  <TableHead className="w-50 text-right">{t('list.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={reorderMode ? 8 : 7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {busy ? t('list.loading') : t('list.noData')}
                    </TableCell>
                  </TableRow>
                )}
                {displayItems.map((item: AdminMenuItemDto, index: number) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      !reorderMode && 'cursor-pointer hover:bg-muted/50',
                      !item.is_active && 'opacity-50',
                    )}
                    onClick={() => !reorderMode && handleEdit(item)}
                  >
                    {reorderMode && (
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || busy}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="size-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === displayItems.length - 1 || busy}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{truncate(item.title, 40)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.location === 'header' ? 'Header' : 'Footer'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'page' ? 'default' : 'secondary'}>
                        {item.type === 'page' ? t('list.types.page') : t('list.types.custom')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {truncate(item.url, 40)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? t('header.active') : t('header.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.display_order}
                    </TableCell>
                    <TableCell className="text-right">
                      {!reorderMode && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(item);
                            }}
                            disabled={busy}
                          >
                            {item.is_active ? t('header.inactive') : t('header.active')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            disabled={busy}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            disabled={busy}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-3 p-4 xl:hidden">
            {displayItems.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                {busy ? t('list.loading') : t('list.noData')}
              </div>
            )}
            {displayItems.map((item: AdminMenuItemDto, index: number) => (
              <Card
                key={item.id}
                className={cn(
                  !reorderMode && 'cursor-pointer transition-colors hover:bg-muted/50',
                  !item.is_active && 'opacity-50',
                )}
                onClick={() => !reorderMode && handleEdit(item)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{truncate(item.url, 50)}</p>
                      </div>
                      {reorderMode && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || busy}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === displayItems.length - 1 || busy}
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">
                        {item.location === 'header' ? 'Header' : 'Footer'}
                      </Badge>
                      <Badge variant={item.type === 'page' ? 'default' : 'secondary'}>
                        {item.type === 'page' ? t('list.types.page') : t('list.types.custom')}
                      </Badge>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? t('header.active') : t('header.inactive')}
                      </Badge>
                      <span className="text-muted-foreground">
                        {t('header.sortOrder')}: {item.display_order}
                      </span>
                    </div>
                  </div>
                  {!reorderMode && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(item);
                        }}
                        disabled={busy}
                        className="flex-1"
                      >
                        {item.is_active ? t('header.inactive') : t('header.active')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        disabled={busy}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        disabled={busy}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
