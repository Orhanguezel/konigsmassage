'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/skills/admin-skills-client.tsx
// FINAL — Admin Skills List (Counters + Logos)
// ✅ Changed from modal to separate pages pattern
// ✅ Fixed: Cannot read properties of undefined (reading 'label')
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, RefreshCcw, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

import {
  AdminLocaleSelect,
  type AdminLocaleOption,
} from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { SkillCounterMerged, SkillLogoMerged, SkillTrack } from '@/integrations/shared';
import {
  useListSkillCountersAdminQuery,
  useRemoveSkillCounterAdminMutation,
  useListSkillLogosAdminQuery,
  useRemoveSkillLogoAdminMutation,
} from '@/integrations/hooks';

type Filters = {
  locale: string;
  track: 'all' | SkillTrack;
  activeOnly: boolean;
};

export default function AdminSkillsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.skills ?? {};
  const common = copy.common;

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  // ✅ FIX: Safe locale options
  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  const activeTab = searchParams.get('tab') || 'counters';

  const [filters, setFilters] = React.useState<Filters>({
    locale: '',
    track: 'all',
    activeOnly: false,
  });

  // ✅ Set initial locale
  React.useEffect(() => {
    if (!filters.locale && defaultLocaleFromDb) {
      setFilters((p) => ({ ...p, locale: defaultLocaleFromDb }));
    }
  }, [defaultLocaleFromDb, filters.locale]);

  const listParams = React.useMemo(
    () => ({
      locale: filters.locale || undefined,
      track: filters.track === 'all' ? undefined : filters.track,
      active: filters.activeOnly ? true : undefined,
      limit: 200,
      offset: 0,
    }),
    [filters],
  );

  const countersQ = useListSkillCountersAdminQuery(listParams, {
    skip: !filters.locale,
    refetchOnMountOrArgChange: true,
  });

  const logosQ = useListSkillLogosAdminQuery(listParams, {
    skip: !filters.locale,
    refetchOnMountOrArgChange: true,
  });

  const counters = React.useMemo(() => {
    const items = (countersQ.data ?? []) as SkillCounterMerged[];
    return [...items].sort((a, b) => {
      const d = (a.display_order ?? 0) - (b.display_order ?? 0);
      if (d !== 0) return d;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }, [countersQ.data]);

  const logos = React.useMemo(() => {
    const items = (logosQ.data ?? []) as SkillLogoMerged[];
    return [...items].sort((a, b) => {
      const d = (a.display_order ?? 0) - (b.display_order ?? 0);
      if (d !== 0) return d;
      return String(a.label || '').localeCompare(String(b.label || ''));
    });
  }, [logosQ.data]);

  const [removeCounter, removeCounterState] = useRemoveSkillCounterAdminMutation();
  const [removeLogo, removeLogoState] = useRemoveSkillLogoAdminMutation();

  const busy =
    countersQ.isFetching ||
    logosQ.isFetching ||
    removeCounterState.isLoading ||
    removeLogoState.isLoading;

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<{
    type: 'counter' | 'logo';
    item: SkillCounterMerged | SkillLogoMerged;
  } | null>(null);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleDeleteClick = (
    type: 'counter' | 'logo',
    item: SkillCounterMerged | SkillLogoMerged,
  ) => {
    setItemToDelete({ type, item });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'counter') {
        await removeCounter({ id: itemToDelete.item.id }).unwrap();
        countersQ.refetch();
      } else {
        await removeLogo({ id: itemToDelete.item.id }).unwrap();
        logosQ.refetch();
      }
      toast.success(common?.actions?.delete || 'Silindi');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  };

  // ✅ FIX: Safe helper to get the display name of the item to delete
  const getDeleteItemName = (): string => {
    if (!itemToDelete?.item) return '';
    if (itemToDelete.type === 'counter') {
      return (itemToDelete.item as SkillCounterMerged).title || '';
    }
    return (itemToDelete.item as SkillLogoMerged).label || '';
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{page?.title}</h1>
            <p className="text-sm text-muted-foreground">{page?.subtitle}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              countersQ.refetch();
              logosQ.refetch();
            }}
            disabled={busy}
          >
            <RefreshCcw className="mr-2 size-4" />
            {common?.actions?.refresh}
          </Button>
        </div>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{page?.filters_title}</CardTitle>
            <CardDescription>{page?.filters_desc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminLocaleSelect
              value={filters.locale}
              onChange={(v) => setFilters((p) => ({ ...p, locale: v }))}
              options={safeLocaleOptions}
              loading={localesLoading}
              label={page?.locale_label}
            />

            <div className="space-y-2">
              <Label>{page?.track_label}</Label>
              <Select
                value={filters.track}
                onValueChange={(v) => setFilters((p) => ({ ...p, track: v as Filters['track'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{page?.track_all}</SelectItem>
                  <SelectItem value="left">{page?.track_left}</SelectItem>
                  <SelectItem value="right">{page?.track_right}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={filters.activeOnly}
                onCheckedChange={(v) => setFilters((p) => ({ ...p, activeOnly: v }))}
              />
              <Label>{page?.active_only}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <CardHeader>
              <TabsList>
                <TabsTrigger value="counters">{page?.counters_title}</TabsTrigger>
                <TabsTrigger value="logos">{page?.logos_title}</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="counters" className="m-0">
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{page?.counters_desc}</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/admin/skills/counters/new')}
                    disabled={busy}
                  >
                    <Plus className="mr-2 size-4" />
                    {common?.actions?.create}
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>{page?.col_title}</TableHead>
                      <TableHead className="w-24">{page?.col_percent}</TableHead>
                      <TableHead className="w-32">{page?.col_locale}</TableHead>
                      <TableHead className="w-24 text-center">{page?.col_active}</TableHead>
                      <TableHead className="w-40 text-right">{page?.col_actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {counters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          {busy ? 'Yükleniyor...' : 'Kayıt bulunamadı'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      counters.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {item.display_order}
                          </TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.percent}%</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.locale}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item.is_active ? 'secondary' : 'outline'}>
                              {item.is_active ? page?.active_yes : page?.active_no}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/skills/counters/${item.id}`)}
                                disabled={busy}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick('counter', item)}
                                disabled={busy}
                              >
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>

            <TabsContent value="logos" className="m-0">
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{page?.logos_desc}</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/admin/skills/logos/new')}
                    disabled={busy}
                  >
                    <Plus className="mr-2 size-4" />
                    {common?.actions?.create}
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>{page?.col_label}</TableHead>
                      <TableHead className="w-32">{page?.col_track}</TableHead>
                      <TableHead className="w-32">{page?.col_locale}</TableHead>
                      <TableHead className="w-24 text-center">{page?.col_active}</TableHead>
                      <TableHead className="w-40 text-right">{page?.col_actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          {busy ? 'Yükleniyor...' : 'Kayıt bulunamadı'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      logos.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {item.display_order}
                          </TableCell>
                          <TableCell className="font-medium">{item.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.track}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.locale}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item.is_active ? 'secondary' : 'outline'}>
                              {item.is_active ? page?.active_yes : page?.active_no}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/skills/logos/${item.id}`)}
                                disabled={busy}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick('logo', item)}
                                disabled={busy}
                              >
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Delete Dialog — ✅ FIX: Only render when itemToDelete is set */}
      {itemToDelete !== null && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Silmek istediğinizden emin misiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>
                  {itemToDelete.type === 'counter'
                    ? (itemToDelete.item as SkillCounterMerged).title
                    : (itemToDelete.item as SkillLogoMerged).label}
                </strong>{' '}
                silinecek. Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>Sil</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
