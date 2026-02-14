'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/services/admin-site_services-client.tsx
// FINAL — Admin Services List (App Router + shadcn)
// - Bootstrap yok, inline style yok
// - Locale: useAdminLocales (DB-driven) + URL sync (?locale=)
// - List: Desktop table, Mobile card list
// - Reorder: up/down + "Sıralamayı Kaydet"
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, RefreshCcw, ArrowUp, ArrowDown, Save, Search, Trash2, Pencil } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

import type { ServiceDto, ServiceListAdminQueryParams } from '@/integrations/shared';
import {
  useListServicesAdminQuery,
  useUpdateServiceAdminMutation,
  useDeleteServiceAdminMutation,
  useReorderServicesAdminMutation,
} from '@/integrations/hooks';

type PublishedFilter = 'all' | 'active' | 'inactive';

type Filters = {
  search: string;
  publishedFilter: PublishedFilter;
  locale: string;
  featuredOnly: boolean;
};

function isUuidLike(v?: string) {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export default function AdminServicesClient() {
  const t = useAdminT();
  const router = useRouter();
  const sp = useSearchParams();

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
    publishedFilter: 'all',
    locale: '',
    featuredOnly: false,
  });

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

  // locale -> URL sync (App Router)
  React.useEffect(() => {
    const l = localeShortClient(filters.locale);
    if (!l) return;
    if (l === urlLocale) return;

    const params = new URLSearchParams(sp?.toString() || '');
    params.set('locale', l);
    router.replace(`/admin/services?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locale]);

  const is_active = React.useMemo(() => {
    if (filters.publishedFilter === 'all') return undefined;
    return filters.publishedFilter === 'active' ? 1 : 0;
  }, [filters.publishedFilter]);

  const queryParams = React.useMemo(() => {
    const qp: ServiceListAdminQueryParams = {
      q: filters.search.trim() || undefined,
      locale: effectiveLocale || undefined,
      is_active,
      featured: filters.featuredOnly ? 1 : undefined,
      limit: 200,
      offset: 0,
    } as any;
    return qp;
  }, [filters.search, effectiveLocale, is_active, filters.featuredOnly]);

  const listQ = useListServicesAdminQuery(
    queryParams as any,
    {
      refetchOnMountOrArgChange: true,
    } as any,
  );

  const items: ServiceDto[] = React.useMemo(() => {
    return ((listQ.data as any)?.items ?? []) as ServiceDto[];
  }, [listQ.data]);

  const total: number = React.useMemo(() => {
    const t = (listQ.data as any)?.total;
    return typeof t === 'number' ? t : items.length;
  }, [listQ.data, items.length]);

  const [rows, setRows] = React.useState<ServiceDto[]>([]);
  React.useEffect(() => setRows(items), [items]);

  const [updateService, updateState] = useUpdateServiceAdminMutation();
  const [deleteService, deleteState] = useDeleteServiceAdminMutation();
  const [reorderServices, reorderState] = useReorderServicesAdminMutation();

  const busy =
    listQ.isLoading ||
    listQ.isFetching ||
    localesLoading ||
    localesFetching ||
    updateState.isLoading ||
    deleteState.isLoading ||
    reorderState.isLoading;

  function moveRow(from: number, to: number) {
    setRows((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const copy = prev.slice();
      const [x] = copy.splice(from, 1);
      copy.splice(to, 0, x);
      return copy;
    });
  }

  async function onSaveOrder() {
    try {
      const payload = { items: rows.map((p, idx) => ({ id: (p as any).id, display_order: idx })) };
      await reorderServices(payload as any).unwrap();
      toast.success(t('admin.services.list.orderSaved'));
      listQ.refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message || err?.message || t('admin.services.list.orderSaveError'),
      );
    }
  }

  function onCreate() {
    const l = localeShortClientOr(effectiveLocale, 'de');
    router.push(`/admin/services/new?locale=${encodeURIComponent(l)}`);
  }

  function onEdit(id: string) {
    const l = localeShortClientOr(effectiveLocale, 'de');
    router.push(`/admin/services/${encodeURIComponent(id)}?locale=${encodeURIComponent(l)}`);
  }

  async function onToggleActive(item: ServiceDto, next: boolean) {
    const id = String((item as any)?.id ?? '');
    if (!isUuidLike(id)) return;

    try {
      await updateService({ id, patch: { is_active: next } } as any).unwrap();
      toast.success(t('admin.services.list.statusUpdated'));
      setRows((prev) => prev.map((r: any) => (r.id === id ? { ...r, is_active: next } : r)));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message || err?.message || t('admin.services.list.statusUpdateError'),
      );
    }
  }

  async function onToggleFeatured(item: ServiceDto, next: boolean) {
    const id = String((item as any)?.id ?? '');
    if (!isUuidLike(id)) return;

    try {
      await updateService({ id, patch: { featured: next } } as any).unwrap();
      toast.success(t('admin.services.list.featuredUpdated'));
      setRows((prev) => prev.map((r: any) => (r.id === id ? { ...r, featured: next } : r)));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message || err?.message || t('admin.services.list.statusUpdateError'),
      );
    }
  }

  async function onDelete(item: ServiceDto) {
    const id = String((item as any)?.id ?? '');
    if (!isUuidLike(id)) return;

    const ok = window.confirm(
      t('admin.services.list.deleteConfirm', { name: String((item as any)?.name ?? 'Hizmet') }),
    );
    if (!ok) return;

    try {
      await deleteService({ id } as any).unwrap();
      toast.success(t('admin.services.list.deleted'));
      listQ.refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message || err?.message || t('admin.services.list.deleteError'),
      );
    }
  }

  function resetFilters() {
    setFilters((p) => ({
      ...p,
      search: '',
      publishedFilter: 'all',
      featuredOnly: false,
    }));
  }

  const showEmpty = !busy && (rows?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('admin.services.header.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.services.header.description')}</p>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('admin.services.header.filterLabel')}</CardTitle>
              <CardDescription>
                {t('admin.services.header.totalLabel')} <span className="font-medium">{total}</span>{' '}
                • {t('admin.services.header.activeLocale')}{' '}
                <Badge variant="secondary">{effectiveLocale || '—'}</Badge>
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={onCreate} disabled={busy}>
                <Plus className="mr-2 size-4" />
                {t('admin.services.header.createButton')}
              </Button>
              <Button variant="outline" onClick={() => listQ.refetch()} disabled={busy}>
                <RefreshCcw className="mr-2 size-4" />
                {t('admin.services.header.refreshButton')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="q">{t('admin.services.header.searchLabel')}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  placeholder={t('admin.services.header.searchPlaceholder')}
                  className="pl-9"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.services.header.statusLabel')}</Label>
              <Select
                value={filters.publishedFilter}
                onValueChange={(v) => setFilters((p) => ({ ...p, publishedFilter: v as any }))}
                disabled={busy}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.services.header.statusAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.services.header.statusAll')}</SelectItem>
                  <SelectItem value="active">{t('admin.services.header.statusActive')}</SelectItem>
                  <SelectItem value="inactive">
                    {t('admin.services.header.statusInactive')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.services.header.localeLabel')}</Label>
              <Select
                value={filters.locale || ''}
                onValueChange={(v) => setFilters((p) => ({ ...p, locale: v }))}
                disabled={busy || (localeOptions?.length ?? 0) === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.services.header.localePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(localeOptions ?? []).map((l: any) => (
                    <SelectItem key={l.value} value={String(l.value)}>
                      {String(l.label ?? l.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('admin.services.header.localeUrlSync')}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-6 md:pt-7">
              <Switch
                checked={!!filters.featuredOnly}
                onCheckedChange={(v) => setFilters((p) => ({ ...p, featuredOnly: !!v }))}
                disabled={busy}
              />
              <span className="text-sm text-muted-foreground">
                {t('admin.services.header.featuredOnly')}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-6 md:pt-7">
              <Button variant="outline" onClick={resetFilters} disabled={busy}>
                {t('admin.services.header.resetButton')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('admin.services.list.listTitle')}</CardTitle>
              <CardDescription>
                {busy
                  ? t('admin.services.list.loading')
                  : t('admin.services.list.recordCount', { count: rows.length })}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onSaveOrder} disabled={busy || rows.length === 0}>
                <Save className="mr-2 size-4" />
                {t('admin.services.list.saveOrderButton')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {listQ.isError ? (
            <div className="rounded-md border p-4 text-sm">
              {t('admin.services.list.listLoadError')}{' '}
              <Button
                variant="link"
                className="px-1"
                onClick={() => {
                  toast.error(t('admin.services.list.listLoadErrorToast'));
                  listQ.refetch();
                }}
              >
                {t('admin.services.list.retryButton')}
              </Button>
            </div>
          ) : null}

          {/* Desktop table */}
          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.services.list.nameColumn')}</TableHead>
                  <TableHead>{t('admin.services.list.slugColumn')}</TableHead>
                  <TableHead>{t('admin.services.list.featuredColumn')}</TableHead>
                  <TableHead>{t('admin.services.list.statusColumn')}</TableHead>
                  <TableHead className="text-right">
                    {t('admin.services.list.actionsColumn')}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((p: any, idx) => {
                  const id = String(p?.id ?? '');
                  const name = String(p?.name ?? '').trim() || '—';
                  const slug = String(p?.slug ?? '').trim() || '—';
                  const active = !!p?.is_active;
                  const featured = !!p?.featured;

                  return (
                    <TableRow key={id || `${idx}`}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="wrap-break-word">{slug}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={featured}
                            onCheckedChange={(v) => onToggleFeatured(p, !!v)}
                            disabled={busy || !isUuidLike(id)}
                          />
                          <Badge variant="secondary">
                            {featured
                              ? t('admin.services.list.featuredYes')
                              : t('admin.services.list.featuredNo')}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={active}
                            onCheckedChange={(v) => onToggleActive(p, !!v)}
                            disabled={busy || !isUuidLike(id)}
                          />
                          {active ? (
                            <Badge variant="secondary">
                              {t('admin.services.list.activeStatus')}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              {t('admin.services.list.inactiveStatus')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveRow(idx, idx - 1)}
                            disabled={busy || idx === 0}
                            title={t('admin.services.list.upButton')}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveRow(idx, idx + 1)}
                            disabled={busy || idx === rows.length - 1}
                            title={t('admin.services.list.downButton')}
                          >
                            <ArrowDown className="size-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(id)}
                            disabled={busy || !isUuidLike(id)}
                            title={t('admin.services.list.editButton')}
                          >
                            <Pencil className="mr-2 size-4" />
                            {t('admin.services.list.editButton')}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              'border-destructive text-destructive hover:text-destructive',
                            )}
                            onClick={() => onDelete(p)}
                            disabled={busy || !isUuidLike(id)}
                            title={t('admin.services.list.deleteButton')}
                          >
                            <Trash2 className="mr-2 size-4" />
                            {t('admin.services.list.deleteButton')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {showEmpty ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      {t('admin.services.list.noRecords')}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list */}
          <div className="rounded-md border md:hidden">
            <div className="divide-y">
              {rows.map((p: any, idx) => {
                const id = String(p?.id ?? '');
                const name = String(p?.name ?? '').trim() || '—';
                const slug = String(p?.slug ?? '').trim() || '—';
                const active = !!p?.is_active;
                const featured = !!p?.featured;

                return (
                  <div key={id || `${idx}`} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{name}</div>
                      {active ? (
                        <Badge variant="secondary">{t('admin.services.list.activeStatus')}</Badge>
                      ) : (
                        <Badge variant="destructive">
                          {t('admin.services.list.inactiveStatus')}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {featured
                          ? t('admin.services.list.featuredBadge')
                          : t('admin.services.list.normalStatus')}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-2 text-sm">
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {t('admin.services.list.slugLabel')}
                        </span>{' '}
                        <span className="wrap-break-word">{slug}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">
                            {t('admin.services.list.featuredMobileLabel')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('admin.services.list.featuredMobileHelp')}
                          </div>
                        </div>
                        <Switch
                          checked={featured}
                          onCheckedChange={(v) => onToggleFeatured(p, !!v)}
                          disabled={busy || !isUuidLike(id)}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">
                            {t('admin.services.list.activeMobileLabel')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('admin.services.list.activeMobileHelp')}
                          </div>
                        </div>
                        <Switch
                          checked={active}
                          onCheckedChange={(v) => onToggleActive(p, !!v)}
                          disabled={busy || !isUuidLike(id)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveRow(idx, idx - 1)}
                        disabled={busy || idx === 0}
                      >
                        <ArrowUp className="mr-2 size-4" />
                        {t('admin.services.list.upButton')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveRow(idx, idx + 1)}
                        disabled={busy || idx === rows.length - 1}
                      >
                        <ArrowDown className="mr-2 size-4" />
                        {t('admin.services.list.downButton')}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(id)}
                        disabled={busy || !isUuidLike(id)}
                      >
                        <Pencil className="mr-2 size-4" />
                        {t('admin.services.list.editButton')}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className={cn('border-destructive text-destructive hover:text-destructive')}
                        onClick={() => onDelete(p)}
                        disabled={busy || !isUuidLike(id)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        {t('admin.services.list.deleteButton')}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {showEmpty ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {t('admin.services.list.noRecords')}
                </div>
              ) : null}
            </div>
          </div>

          {rows.length > 0 ? (
            <p className="text-xs text-muted-foreground">{t('admin.services.list.reorderHelp')}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
