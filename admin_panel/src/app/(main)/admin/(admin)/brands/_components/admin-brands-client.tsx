'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/brands/admin-brands-client.tsx
// FINAL — Admin Brands (logos)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, RefreshCcw, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { BrandLogoMerged, BrandTrack, CreateBrandLogoInput } from '@/integrations/shared';
import {
  useListBrandsAdminQuery,
  useCreateBrandAdminMutation,
  useUpdateBrandAdminMutation,
  useRemoveBrandAdminMutation,
} from '@/integrations/hooks';

type Filters = {
  locale: string;
  track: 'all' | BrandTrack;
  activeOnly: boolean;
};

type FormState = CreateBrandLogoInput & { id?: string };

const emptyForm: FormState = {
  label: '',
  track: 'left',
  is_active: true,
  display_order: 0,
  locale: '',
  image_url: '',
  image_asset_id: '',
};

export default function AdminBrandsClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.brands ?? {};
  const common = copy.common;

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  const [filters, setFilters] = React.useState<Filters>({
    locale: '',
    track: 'all',
    activeOnly: false,
  });

  React.useEffect(() => {
    if (!localeOptions?.length) return;
    setFilters((p) => {
      if (p.locale) return p;
      return { ...p, locale: defaultLocaleFromDb || localeOptions[0]?.value || '' };
    });
  }, [localeOptions, defaultLocaleFromDb]);

  const params = React.useMemo(
    () => ({
      locale: filters.locale || undefined,
      track: filters.track === 'all' ? undefined : filters.track,
      active: filters.activeOnly ? true : undefined,
      limit: 200,
      offset: 0,
    }),
    [filters],
  );

  const listQ = useListBrandsAdminQuery(params, { refetchOnMountOrArgChange: true });
  const rows = React.useMemo(() => {
    const items = (listQ.data?.items ?? []) as BrandLogoMerged[];
    return [...items].sort((a, b) => {
      const d = (a.display_order ?? 0) - (b.display_order ?? 0);
      if (d !== 0) return d;
      return String(a.label || '').localeCompare(String(b.label || ''));
    });
  }, [listQ.data]);

  const [createBrand, createState] = useCreateBrandAdminMutation();
  const [updateBrand, updateState] = useUpdateBrandAdminMutation();
  const [removeBrand, removeState] = useRemoveBrandAdminMutation();

  const busy = listQ.isFetching || createState.isLoading || updateState.isLoading || removeState.isLoading;

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  function openCreate() {
    setForm({
      ...emptyForm,
      locale: filters.locale || defaultLocaleFromDb || '',
    });
    setOpen(true);
  }

  function openEdit(item: BrandLogoMerged) {
    setForm({
      id: item.id,
      label: item.label,
      track: item.track,
      is_active: item.is_active,
      display_order: item.display_order,
      locale: item.locale,
      image_url: item.image_url ?? '',
      image_asset_id: item.image_asset_id ?? '',
    });
    setOpen(true);
  }

  function closeModal() {
    if (busy) return;
    setOpen(false);
  }

  async function onSave() {
    if (!form.label.trim()) {
      toast.error(page?.label_required || '');
      return;
    }

    try {
      if (form.id) {
        await updateBrand({
          id: form.id,
          patch: {
            label: form.label.trim(),
            track: form.track,
            is_active: form.is_active,
            display_order: form.display_order ?? 0,
            locale: form.locale || undefined,
            image_url: form.image_url?.trim() || null,
            image_asset_id: form.image_asset_id?.trim() || null,
          },
        }).unwrap();
      } else {
        await createBrand({
          label: form.label.trim(),
          track: form.track,
          is_active: form.is_active,
          display_order: form.display_order ?? 0,
          locale: form.locale || undefined,
          image_url: form.image_url?.trim() || null,
          image_asset_id: form.image_asset_id?.trim() || null,
        }).unwrap();
      }

      toast.success(common?.actions?.save || '');
      closeModal();
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  async function onDelete(item: BrandLogoMerged) {
    if (!window.confirm(page?.delete_confirm || '')) return;
    try {
      await removeBrand({ id: item.id }).unwrap();
      toast.success(common?.actions?.delete || '');
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{page?.title}</h1>
          <p className="text-sm text-muted-foreground">{page?.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => listQ.refetch()} disabled={busy}>
            <RefreshCcw className="mr-2 size-4" />
            {common?.actions?.refresh}
          </Button>
          <Button size="sm" onClick={openCreate} disabled={busy}>
            <Plus className="mr-2 size-4" />
            {common?.actions?.create}
          </Button>
        </div>
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
            options={localeOptions}
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

          <div className="flex items-center gap-2">
            <Switch
              checked={filters.activeOnly}
              onCheckedChange={(v) => setFilters((p) => ({ ...p, activeOnly: v }))}
            />
            <Label>{page?.active_only}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{page?.list_title}</CardTitle>
          <CardDescription>{page?.list_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{page?.col_label}</TableHead>
                <TableHead>{page?.col_track}</TableHead>
                <TableHead>{page?.col_locale}</TableHead>
                <TableHead>{page?.col_order}</TableHead>
                <TableHead>{page?.col_active}</TableHead>
                <TableHead className="text-right">{page?.col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !busy && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    {common?.states?.empty}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.track}</Badge>
                  </TableCell>
                  <TableCell>{item.locale}</TableCell>
                  <TableCell>{item.display_order}</TableCell>
                  <TableCell>{item.is_active ? page?.active_yes : page?.active_no}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)} disabled={busy}>
                        <Pencil className="mr-2 size-4" />
                        {common?.actions?.edit}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(item)} disabled={busy}>
                        <Trash2 className="mr-2 size-4" />
                        {common?.actions?.delete}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => (v ? null : closeModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? page?.edit_title : page?.create_title}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{page?.label_label}</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder={page?.label_ph}
              />
            </div>

            <div className="space-y-2">
              <Label>{page?.track_label}</Label>
              <Select
                value={form.track}
                onValueChange={(v) => setForm((p) => ({ ...p, track: v as BrandTrack }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">{page?.track_left}</SelectItem>
                  <SelectItem value="right">{page?.track_right}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AdminLocaleSelect
              value={form.locale || ''}
              onChange={(v) => setForm((p) => ({ ...p, locale: v }))}
              options={localeOptions}
              loading={localesLoading}
              label={page?.locale_label}
            />

            <div className="space-y-2">
              <Label>{page?.image_url_label}</Label>
              <Input
                value={form.image_url || ''}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                placeholder={page?.image_url_ph}
              />
            </div>

            <div className="space-y-2">
              <Label>{page?.asset_id_label}</Label>
              <Input
                value={form.image_asset_id || ''}
                onChange={(e) => setForm((p) => ({ ...p, image_asset_id: e.target.value }))}
                placeholder={page?.asset_id_ph}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{page?.order_label}</Label>
                <Input
                  type="number"
                  value={form.display_order ?? 0}
                  onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={!!form.is_active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                />
                <Label>{page?.active_label}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={busy}>
              {common?.actions?.cancel}
            </Button>
            <Button onClick={onSave} disabled={busy}>
              {common?.actions?.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
