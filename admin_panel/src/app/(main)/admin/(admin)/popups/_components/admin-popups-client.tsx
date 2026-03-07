'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react';

import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

import type {
  PopupAdminCreateBody,
  PopupAdminView,
  PopupDisplayFrequency,
  PopupLinkTarget,
  PopupTextBehavior,
  PopupType,
} from '@/integrations/shared';
import {
  useCreatePopupAdminMutation,
  useDeletePopupAdminMutation,
  useListPopupsAdminQuery,
  useReorderPopupsAdminMutation,
  useSetPopupStatusAdminMutation,
  useUpdatePopupAdminMutation,
} from '@/integrations/hooks';

type FormState = {
  id?: number;
  locale: string;
  type: PopupType;
  title: string;
  content: string;
  target_paths_text: string;
  button_text: string;
  link_url: string;
  link_target: PopupLinkTarget;
  image_url: string;
  image_asset_id: string;
  alt: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_hover_color: string;
  button_text_color: string;
  display_frequency: PopupDisplayFrequency;
  text_behavior: PopupTextBehavior;
  scroll_speed: number;
  is_active: boolean;
  closeable: boolean;
  delay_seconds: number;
  display_order: number;
  start_at: string;
  end_at: string;
};

const emptyForm: FormState = {
  locale: '',
  type: 'topbar',
  title: '',
  content: '',
  target_paths_text: '',
  button_text: '',
  link_url: '',
  link_target: '_self',
  image_url: '',
  image_asset_id: '',
  alt: '',
  background_color: '',
  text_color: '',
  button_color: '',
  button_hover_color: '',
  button_text_color: '',
  display_frequency: 'always',
  text_behavior: 'marquee',
  scroll_speed: 60,
  is_active: true,
  closeable: true,
  delay_seconds: 0,
  display_order: 0,
  start_at: '',
  end_at: '',
};

function asLocalDateTimeValue(v: string | null) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function toNullable(v: string) {
  const x = v.trim();
  return x ? x : null;
}

function errMsg(err: unknown, fallback: string) {
  const e = err as any;
  return e?.data?.error || e?.data?.message || e?.error || e?.message || fallback;
}

export default function AdminPopupsClient() {
  const t = useAdminT('admin.popups');
  const { localeOptions, defaultLocaleFromDb, coerceLocale, loading: localesLoading } = useAdminLocales();
  const typeOptions: Array<{ value: PopupType | 'all'; label: string }> = [
    { value: 'all', label: t('filters.typeAll', {}, 'Tümü') },
    { value: 'topbar', label: t('types.topbar', {}, 'Üst bar') },
    { value: 'sidebar_top', label: t('types.sidebarTop', {}, 'Sidebar üst') },
    { value: 'sidebar_center', label: t('types.sidebarCenter', {}, 'Sidebar orta') },
    { value: 'sidebar_bottom', label: t('types.sidebarBottom', {}, 'Sidebar alt') },
  ];
  const statusOptions: Array<{ value: 'all' | '1' | '0'; label: string }> = [
    { value: 'all', label: t('filters.statusAll', {}, 'Tümü') },
    { value: '1', label: t('filters.statusActive', {}, 'Aktif') },
    { value: '0', label: t('filters.statusPassive', {}, 'Pasif') },
  ];
  const frequencyOptions: Array<{ value: PopupDisplayFrequency; label: string }> = [
    { value: 'always', label: t('frequency.always', {}, 'Her zaman') },
    { value: 'once', label: t('frequency.once', {}, 'Bir kez') },
    { value: 'daily', label: t('frequency.daily', {}, 'Günlük') },
  ];
  const linkTargetOptions: Array<{ value: PopupLinkTarget; label: string }> = [
    { value: '_self', label: t('linkTargets.self', {}, 'Aynı sekme') },
    { value: '_blank', label: t('linkTargets.blank', {}, 'Yeni sekme') },
  ];
  const textBehaviorOptions: Array<{ value: PopupTextBehavior; label: string }> = [
    { value: 'marquee', label: t('textBehavior.marquee', {}, 'Kayan yazı') },
    { value: 'static', label: t('textBehavior.static', {}, 'Sabit') },
  ];

  const [q, setQ] = React.useState('');
  const [type, setType] = React.useState<PopupType | 'all'>('all');
  const [active, setActive] = React.useState<'all' | '1' | '0'>('all');

  const [page, setPage] = React.useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const listQ = useListPopupsAdminQuery({
    q: q.trim() || undefined,
    type: type === 'all' ? undefined : type,
    is_active: active === 'all' ? undefined : active === '1',
    sort: 'display_order',
    order: 'asc',
    limit,
    offset,
  });

  const rows = listQ.data ?? [];

  const [createPopup, createState] = useCreatePopupAdminMutation();
  const [updatePopup, updateState] = useUpdatePopupAdminMutation();
  const [setStatusPopup, setStatusState] = useSetPopupStatusAdminMutation();
  const [reorderPopups, reorderState] = useReorderPopupsAdminMutation();
  const [deletePopup, deleteState] = useDeletePopupAdminMutation();

  const busy =
    listQ.isFetching ||
    createState.isLoading ||
    updateState.isLoading ||
    setStatusState.isLoading ||
    reorderState.isLoading ||
    deleteState.isLoading;

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  function openCreate() {
    setForm({ ...emptyForm, locale: coerceLocale('', defaultLocaleFromDb) });
    setOpen(true);
  }

  function openEdit(item: PopupAdminView) {
    setForm({
      id: item.id,
      locale: coerceLocale('', defaultLocaleFromDb),
      type: item.type,
      title: item.title,
      content: item.content ?? '',
      target_paths_text: item.target_paths.join('\n'),
      button_text: item.button_text ?? '',
      link_url: item.link_url ?? '',
      link_target: item.link_target ?? '_self',
      image_url: item.image_url ?? '',
      image_asset_id: item.image_asset_id ?? '',
      alt: item.alt ?? '',
      background_color: item.background_color ?? '',
      text_color: item.text_color ?? '',
      button_color: item.button_color ?? '',
      button_hover_color: item.button_hover_color ?? '',
      button_text_color: item.button_text_color ?? '',
      display_frequency: item.display_frequency,
      text_behavior: item.text_behavior ?? 'marquee',
      scroll_speed: item.scroll_speed ?? 60,
      is_active: item.is_active,
      closeable: item.closeable,
      delay_seconds: item.delay_seconds,
      display_order: item.display_order,
      start_at: asLocalDateTimeValue(item.start_at),
      end_at: asLocalDateTimeValue(item.end_at),
    });
    setOpen(true);
  }

  function buildBody(): PopupAdminCreateBody {
    return {
      locale: toNullable(form.locale) || undefined,
      type: form.type,
      title: form.title.trim(),
      content: toNullable(form.content),
      target_paths: form.target_paths_text
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      button_text: toNullable(form.button_text),
      link_url: toNullable(form.link_url),
      link_target: form.link_target,
      image_url: toNullable(form.image_url),
      image_asset_id: toNullable(form.image_asset_id),
      alt: toNullable(form.alt),
      background_color: toNullable(form.background_color),
      text_color: toNullable(form.text_color),
      button_color: toNullable(form.button_color),
      button_hover_color: toNullable(form.button_hover_color),
      button_text_color: toNullable(form.button_text_color),
      display_frequency: form.display_frequency,
      text_behavior: form.text_behavior,
      scroll_speed: Number(form.scroll_speed || 60),
      is_active: form.is_active,
      closeable: form.closeable,
      delay_seconds: Number(form.delay_seconds || 0),
      display_order: Number(form.display_order || 0),
      start_at: form.start_at || null,
      end_at: form.end_at || null,
    };
  }

  async function onSave() {
    if (!form.title.trim()) {
      toast.error(t('messages.titleRequired', {}, 'Başlık zorunlu'));
      return;
    }

    try {
      const body = buildBody();
      if (form.id) await updatePopup({ id: form.id, body }).unwrap();
      else await createPopup(body).unwrap();
      toast.success(t('messages.saved', {}, 'Kaydedildi'));
      setOpen(false);
      listQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.failed', {}, 'İşlem başarısız')));
    }
  }

  async function onDelete(item: PopupAdminView) {
    if (!window.confirm(t('messages.deleteConfirm', {}, 'Silmek istediğinize emin misiniz?'))) return;
    try {
      await deletePopup({ id: item.id }).unwrap();
      toast.success(t('messages.deleted', {}, 'Silindi'));
      listQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.failed', {}, 'İşlem başarısız')));
    }
  }

  async function onToggleStatus(item: PopupAdminView, value: boolean) {
    try {
      await setStatusPopup({ id: item.id, is_active: value }).unwrap();
      toast.success(t('messages.statusUpdated', {}, 'Durum güncellendi'));
      listQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.failed', {}, 'İşlem başarısız')));
    }
  }

  async function moveRow(item: PopupAdminView, direction: -1 | 1) {
    const idx = rows.findIndex((r) => r.id === item.id);
    if (idx < 0) return;
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= rows.length) return;
    const next = [...rows];
    const a = next[idx];
    next[idx] = next[swapIdx];
    next[swapIdx] = a;
    try {
      await reorderPopups({ ids: next.map((r) => r.id) }).unwrap();
      listQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.failed', {}, 'İşlem başarısız')));
    }
  }

  const hasPrev = page > 1;
  const hasNext = rows.length >= limit;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('title', {}, 'Popup Yönetimi')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description', {}, 'Popup içerikleri, sırası ve görünürlük yönetimi')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('list.title', {}, 'Popup Listesi')}</CardTitle>
          <CardDescription>{t('list.desc', {}, 'Aktif/pasif filtreleri ile popup yönetimi')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t('filters.search', {}, 'Başlık veya içerik ara')}
            />

            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as PopupType | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={active}
              onValueChange={(v) => {
                setActive(v as 'all' | '1' | '0');
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => listQ.refetch()} disabled={busy}>
                <RefreshCcw className="mr-2 size-4" />
                {t('actions.refresh', {}, 'Yenile')}
              </Button>
              <Button onClick={openCreate} disabled={busy}>
                <Plus className="mr-2 size-4" />
                {t('actions.create', {}, 'Yeni')}
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.title', {}, 'Başlık')}</TableHead>
                  <TableHead>{t('table.type', {}, 'Tip')}</TableHead>
                  <TableHead>{t('table.targets', {}, 'Hedef')}</TableHead>
                  <TableHead>{t('table.order', {}, 'Sıra')}</TableHead>
                  <TableHead>{t('table.active', {}, 'Durum')}</TableHead>
                  <TableHead className="text-right">{t('table.actions', {}, 'Aksiyon')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!listQ.isFetching && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t('states.empty', {}, 'Kayıt bulunamadı')}
                    </TableCell>
                  </TableRow>
                ) : null}

                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell className="max-w-[240px] text-xs text-muted-foreground">
                      {item.target_paths.length ? item.target_paths.join(', ') : t('table.allPages', {}, 'Tüm sayfalar')}
                    </TableCell>
                    <TableCell>{item.display_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={(v) => onToggleStatus(item, v)}
                          disabled={busy}
                        />
                        <Badge variant={item.is_active ? 'secondary' : 'outline'}>
                          {item.is_active
                            ? t('badges.active', {}, 'Aktif')
                            : t('badges.passive', {}, 'Pasif')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => moveRow(item, -1)} disabled={busy}>
                          ↑
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => moveRow(item, 1)} disabled={busy}>
                          ↓
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)} disabled={busy}>
                          <Pencil className="mr-2 size-4" />
                          {t('actions.edit', {}, 'Düzenle')}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete(item)} disabled={busy}>
                          <Trash2 className="mr-2 size-4" />
                          {t('actions.delete', {}, 'Sil')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={!hasPrev || busy} onClick={() => setPage((p) => p - 1)}>
              {t('actions.prev', {}, 'Önceki')}
            </Button>
            <Badge variant="outline">{t('labels.page', { page }, `Sayfa ${page}`)}</Badge>
            <Button variant="outline" size="sm" disabled={!hasNext || busy} onClick={() => setPage((p) => p + 1)}>
              {t('actions.next', {}, 'Sonraki')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => (!v ? setOpen(false) : null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{form.id ? t('modal.edit', {}, 'Popup Düzenle') : t('modal.new', {}, 'Popup Ekle')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>{t('form.title', {}, 'Başlık')}</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <AdminLocaleSelect
                value={form.locale}
                onChange={(locale) => setForm((p) => ({ ...p, locale }))}
                options={localeOptions}
                loading={localesLoading}
                label={t('form.locale', {}, 'Locale')}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>{t('form.content', {}, 'İçerik')}</Label>
              <Textarea
                rows={4}
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.type', {}, 'Tip')}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as PopupType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions
                    .filter((opt) => opt.value !== 'all')
                    .map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.frequency', {}, 'Frekans')}</Label>
              <Select
                value={form.display_frequency}
                onValueChange={(v) => setForm((p) => ({ ...p, display_frequency: v as PopupDisplayFrequency }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.order', {}, 'Sıra')}</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value || 0) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.buttonText', {}, 'Buton Metni')}</Label>
              <Input
                value={form.button_text}
                onChange={(e) => setForm((p) => ({ ...p, button_text: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('form.linkUrl', {}, 'Bağlantı')}</Label>
              <Input value={form.link_url} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>{t('form.targetPaths', {}, 'Hedef sayfalar')}</Label>
              <Textarea
                rows={3}
                value={form.target_paths_text}
                onChange={(e) => setForm((p) => ({ ...p, target_paths_text: e.target.value }))}
                placeholder={'/services\n/services/*'}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.linkTarget', {}, 'Link Target')}</Label>
              <Select
                value={form.link_target}
                onValueChange={(v) => setForm((p) => ({ ...p, link_target: v as PopupLinkTarget }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {linkTargetOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.textBehavior', {}, 'Metin Davranışı')}</Label>
              <Select
                value={form.text_behavior}
                onValueChange={(v) => setForm((p) => ({ ...p, text_behavior: v as PopupTextBehavior }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {textBehaviorOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.scrollSpeed', {}, 'Scroll Hızı')}</Label>
              <Input
                type="number"
                min={10}
                max={500}
                value={form.scroll_speed}
                onChange={(e) => setForm((p) => ({ ...p, scroll_speed: Number(e.target.value || 60) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.imageUrl', {}, 'Image URL')}</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.imageAsset', {}, 'Image Asset ID')}</Label>
              <Input
                value={form.image_asset_id}
                onChange={(e) => setForm((p) => ({ ...p, image_asset_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.alt', {}, 'Alt')}</Label>
              <Input value={form.alt} onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>{t('form.bgColor', {}, 'Arkaplan Rengi')}</Label>
              <Input
                value={form.background_color}
                onChange={(e) => setForm((p) => ({ ...p, background_color: e.target.value }))}
                placeholder="#0f172a"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.textColor', {}, 'Yazı Rengi')}</Label>
              <Input
                value={form.text_color}
                onChange={(e) => setForm((p) => ({ ...p, text_color: e.target.value }))}
                placeholder="#ffffff"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.buttonColor', {}, 'Buton Rengi')}</Label>
              <Input
                value={form.button_color}
                onChange={(e) => setForm((p) => ({ ...p, button_color: e.target.value }))}
                placeholder="#111827"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.buttonHoverColor', {}, 'Buton Hover Rengi')}</Label>
              <Input
                value={form.button_hover_color}
                onChange={(e) => setForm((p) => ({ ...p, button_hover_color: e.target.value }))}
                placeholder="#1f2937"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.buttonTextColor', {}, 'Buton Yazı Rengi')}</Label>
              <Input
                value={form.button_text_color}
                onChange={(e) => setForm((p) => ({ ...p, button_text_color: e.target.value }))}
                placeholder="#ffffff"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.start', {}, 'Başlangıç')}</Label>
              <Input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.end', {}, 'Bitiş')}</Label>
              <Input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.delay', {}, 'Gecikme (sn)')}</Label>
              <Input
                type="number"
                value={form.delay_seconds}
                onChange={(e) => setForm((p) => ({ ...p, delay_seconds: Number(e.target.value || 0) }))}
              />
            </div>

            <div className="flex items-center gap-6 pt-8">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                />
                <Label>{t('form.active', {}, 'Aktif')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.closeable}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, closeable: v }))}
                />
                <Label>{t('form.closeable', {}, 'Kapatılabilir')}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              {t('actions.cancel', {}, 'İptal')}
            </Button>
            <Button onClick={onSave} disabled={busy}>
              {t('actions.save', {}, 'Kaydet')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
