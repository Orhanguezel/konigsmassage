'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/popups/admin-popups-client.tsx
// FINAL — Admin Popups
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, RefreshCcw, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type {
  PopupAdminView,
  PopupAdminCreateBody,
  PopupDisplayFrequency,
} from '@/integrations/shared';
import {
  useListPopupsAdminQuery,
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useDeletePopupAdminMutation,
} from '@/integrations/hooks';

type FormState = PopupAdminCreateBody & { id?: string };

const emptyForm: FormState = {
  title: '',
  content: '',
  image_url: '',
  image_asset_id: '',
  image_alt: '',
  button_text: '',
  button_link: '',
  is_active: true,
  display_frequency: 'always',
  delay_seconds: 0,
  start_date: null,
  end_date: null,
  services_id: null,
  display_pages: 'all',
  priority: null,
  duration_seconds: null,
};

export default function AdminPopupsClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.popups ?? {};
  const common = copy.common;

  const listQ = useListPopupsAdminQuery({ order: 'created_at.desc' }, { refetchOnMountOrArgChange: true });
  const rows = (listQ.data ?? []) as PopupAdminView[];

  const [createPopup, createState] = useCreatePopupAdminMutation();
  const [updatePopup, updateState] = useUpdatePopupAdminMutation();
  const [deletePopup, deleteState] = useDeletePopupAdminMutation();

  const busy = listQ.isFetching || createState.isLoading || updateState.isLoading || deleteState.isLoading;

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  function openCreate() {
    setForm({ ...emptyForm });
    setOpen(true);
  }

  function openEdit(item: PopupAdminView) {
    setForm({
      id: item.id,
      title: item.title ?? '',
      content: item.content ?? '',
      image_url: item.image_url ?? '',
      image_asset_id: item.image_asset_id ?? '',
      image_alt: item.image_alt ?? '',
      button_text: item.button_text ?? '',
      button_link: item.button_link ?? '',
      is_active: item.is_active,
      display_frequency: item.display_frequency ?? 'always',
      delay_seconds: item.delay_seconds ?? 0,
      start_date: item.start_date ?? null,
      end_date: item.end_date ?? null,
      services_id: item.services_id ?? null,
      display_pages: item.display_pages ?? 'all',
      priority: item.priority ?? null,
      duration_seconds: item.duration_seconds ?? null,
    });
    setOpen(true);
  }

  function closeModal() {
    if (busy) return;
    setOpen(false);
  }

  async function onSave() {
    if (!form.title.trim()) {
      toast.error(page?.title_required || '');
      return;
    }

    const body: PopupAdminCreateBody = {
      title: form.title.trim(),
      content: form.content ?? '',
      image_url: form.image_url?.trim() || null,
      image_asset_id: form.image_asset_id?.trim() || null,
      image_alt: form.image_alt?.trim() || null,
      button_text: form.button_text?.trim() || null,
      button_link: form.button_link?.trim() || null,
      is_active: !!form.is_active,
      display_frequency: form.display_frequency as PopupDisplayFrequency,
      delay_seconds: Number(form.delay_seconds ?? 0),
      start_date: form.start_date ?? null,
      end_date: form.end_date ?? null,
      services_id: form.services_id?.trim() || null,
      display_pages: form.display_pages?.trim() || 'all',
      priority: form.priority != null ? Number(form.priority) : null,
      duration_seconds: form.duration_seconds != null ? Number(form.duration_seconds) : null,
    };

    try {
      if (form.id) {
        await updatePopup({ id: form.id, body }).unwrap();
      } else {
        await createPopup(body).unwrap();
      }
      toast.success(common?.actions?.save || '');
      closeModal();
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  async function onDelete(item: PopupAdminView) {
    if (!window.confirm(page?.delete_confirm || '')) return;
    try {
      await deletePopup({ id: item.id }).unwrap();
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
          <CardTitle className="text-base">{page?.list_title}</CardTitle>
          <CardDescription>{page?.list_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{page?.col_title}</TableHead>
                <TableHead>{page?.col_active}</TableHead>
                <TableHead>{page?.col_frequency}</TableHead>
                <TableHead>{page?.col_dates}</TableHead>
                <TableHead className="text-right">{page?.col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !busy && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    {common?.states?.empty}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? 'secondary' : 'outline'}>
                      {item.is_active ? page?.active_yes : page?.active_no}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.display_frequency}</TableCell>
                  <TableCell>
                    {item.start_date || '-'} → {item.end_date || '-'}
                  </TableCell>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{form.id ? page?.edit_title : page?.create_title}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{page?.title_label}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={page?.title_ph}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{page?.content_label}</Label>
              <Textarea
                value={form.content ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>{page?.frequency_label}</Label>
              <Select
                value={form.display_frequency || 'always'}
                onValueChange={(v) => setForm((p) => ({ ...p, display_frequency: v as PopupDisplayFrequency }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">{page?.frequency_always}</SelectItem>
                  <SelectItem value="once">{page?.frequency_once}</SelectItem>
                  <SelectItem value="daily">{page?.frequency_daily}</SelectItem>
                  <SelectItem value="weekly">{page?.frequency_weekly}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={!!form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
              <Label>{page?.active_label}</Label>
            </div>

            <div className="space-y-2">
              <Label>{page?.start_date_label}</Label>
              <Input
                type="date"
                value={typeof form.start_date === 'string' ? form.start_date : (form.start_date instanceof Date ? form.start_date.toISOString().slice(0, 10) : '')}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value || null }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{page?.end_date_label}</Label>
              <Input
                type="date"
                value={typeof form.end_date === 'string' ? form.end_date : (form.end_date instanceof Date ? form.end_date.toISOString().slice(0, 10) : '')}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{page?.delay_label}</Label>
              <Input
                type="number"
                value={form.delay_seconds ?? 0}
                onChange={(e) => setForm((p) => ({ ...p, delay_seconds: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{page?.duration_label}</Label>
              <Input
                type="number"
                value={form.duration_seconds ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, duration_seconds: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{page?.display_pages_label}</Label>
              <Input
                value={form.display_pages ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, display_pages: e.target.value }))}
                placeholder={page?.display_pages_ph}
              />
            </div>

            <div className="space-y-2">
              <Label>{page?.priority_label}</Label>
              <Input
                type="number"
                value={form.priority ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priority: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{page?.services_id_label}</Label>
              <Input
                value={form.services_id ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, services_id: e.target.value }))}
                placeholder={page?.services_id_ph}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{page?.image_url_label}</Label>
              <Input
                value={form.image_url ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                placeholder={page?.image_url_ph}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{page?.asset_id_label}</Label>
              <Input
                value={form.image_asset_id ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, image_asset_id: e.target.value }))}
                placeholder={page?.asset_id_ph}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{page?.image_alt_label}</Label>
              <Input
                value={form.image_alt ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, image_alt: e.target.value }))}
                placeholder={page?.image_alt_ph}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{page?.button_text_label}</Label>
              <Input
                value={form.button_text ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, button_text: e.target.value }))}
                placeholder={page?.button_text_ph}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{page?.button_link_label}</Label>
              <Input
                value={form.button_link ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, button_link: e.target.value }))}
                placeholder={page?.button_link_ph}
              />
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
