'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type {
  PopupAdminView,
  PopupType,
} from '@/integrations/shared';
import {
  useDeletePopupAdminMutation,
  useListPopupsAdminQuery,
  useReorderPopupsAdminMutation,
  useSetPopupStatusAdminMutation,
} from '@/integrations/hooks';

function errMsg(err: unknown, fallback: string) {
  const e = err as any;
  return e?.data?.error || e?.data?.message || e?.error || e?.message || fallback;
}

export default function AdminPopupsClient() {
  const t = useAdminT('admin.popups');
  const router = useRouter();
  const sp = useSearchParams();

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  // --- Locale state synced with URL ---
  const urlLocale = React.useMemo(() => {
    return sp?.get('locale')?.trim().toLowerCase() || '';
  }, [sp]);

  const [selectedLocale, setSelectedLocale] = React.useState('');

  const effectiveLocale = React.useMemo(() => {
    if (selectedLocale && localeOptions.some((o: any) => o.value === selectedLocale)) return selectedLocale;
    if (defaultLocaleFromDb) return defaultLocaleFromDb;
    return localeOptions[0]?.value || 'de';
  }, [selectedLocale, localeOptions, defaultLocaleFromDb]);

  React.useEffect(() => {
    if (localesLoading || localeOptions.length === 0) return;
    if (selectedLocale) return;

    const canUse = (l: string) => !!l && localeOptions.some((o: any) => o.value === l);

    if (urlLocale && canUse(urlLocale)) {
      setSelectedLocale(urlLocale);
    } else if (defaultLocaleFromDb && canUse(defaultLocaleFromDb)) {
      setSelectedLocale(defaultLocaleFromDb);
    } else if (localeOptions.length > 0) {
      setSelectedLocale(localeOptions[0].value);
    }
  }, [localesLoading, localeOptions, urlLocale, defaultLocaleFromDb, selectedLocale]);

  React.useEffect(() => {
    if (!effectiveLocale) return;
    if (effectiveLocale === urlLocale) return;

    const params = new URLSearchParams(sp?.toString() || '');
    params.set('locale', effectiveLocale);
    router.replace(`/admin/popups?${params.toString()}`);
  }, [effectiveLocale, urlLocale, sp, router]);

  const typeOptions: Array<{ value: PopupType | 'all'; label: string }> = [
    { value: 'all', label: t('filters.typeAll', {}, 'Alle Typen') },
    { value: 'topbar', label: t('types.topbar', {}, 'Top-Leiste') },
    { value: 'sidebar_top', label: t('types.sidebarTop', {}, 'Sidebar oben') },
    { value: 'sidebar_center', label: t('types.sidebarCenter', {}, 'Sidebar mitte') },
    { value: 'sidebar_bottom', label: t('types.sidebarBottom', {}, 'Sidebar unten') },
  ];
  const statusOptions: Array<{ value: 'all' | '1' | '0'; label: string }> = [
    { value: 'all', label: t('filters.statusAll', {}, 'Alle') },
    { value: '1', label: t('filters.statusActive', {}, 'Aktiv') },
    { value: '0', label: t('filters.statusPassive', {}, 'Passiv') },
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
    locale: effectiveLocale || undefined,
    sort: 'display_order',
    order: 'asc',
    limit,
    offset,
  });

  const rows = listQ.data ?? [];

  const [setStatusPopup, setStatusState] = useSetPopupStatusAdminMutation();
  const [reorderPopups, reorderState] = useReorderPopupsAdminMutation();
  const [deletePopup, deleteState] = useDeletePopupAdminMutation();

  const busy =
    listQ.isFetching ||
    setStatusState.isLoading ||
    reorderState.isLoading ||
    deleteState.isLoading;

  function goToNew() {
    router.push(`/admin/popups/new?locale=${effectiveLocale}`);
  }

  function goToEdit(item: PopupAdminView) {
    router.push(`/admin/popups/${item.id}?locale=${effectiveLocale}`);
  }

  async function onDelete(item: PopupAdminView) {
    if (!window.confirm(t('messages.deleteConfirm', {}, 'Möchten Sie diesen Eintrag wirklich löschen?'))) return;
    try {
      await deletePopup({ id: item.id }).unwrap();
      toast.success(t('messages.deleted', {}, 'Gelöscht'));
      listQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.failed', {}, 'Vorgang fehlgeschlagen')));
    }
  }

  async function onToggleStatus(item: PopupAdminView, value: boolean) {
    try {
      await setStatusPopup({ id: item.id, is_active: value, locale: effectiveLocale }).unwrap();
      toast.success(t('messages.statusUpdated', {}, 'Status aktualisiert'));
      listQ.refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.failed', {}, 'Vorgang fehlgeschlagen')));
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
      toast.error(errMsg(e, t('messages.failed', {}, 'Vorgang fehlgeschlagen')));
    }
  }

  const hasPrev = page > 1;
  const hasNext = rows.length >= limit;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('title', {}, 'Popup-Verwaltung')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description', {}, 'Popup-Inhalte, Reihenfolge und Sichtbarkeit verwalten')}
        </p>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('list.title', {}, 'Popup-Liste')}</CardTitle>
              <CardDescription>
                {t('list.desc', {}, 'Popups mit Aktiv/Passiv-Filtern verwalten')}
                {' '}&bull;{' '}
                {t('filters.activeLocale', {}, 'Sprache')}{' '}
                <Badge variant="secondary">{effectiveLocale?.toUpperCase() || '—'}</Badge>
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={goToNew} disabled={busy || localesLoading}>
                <Plus className="mr-2 size-4" />
                {t('actions.create', {}, 'Neu')}
              </Button>
              <Button variant="outline" onClick={() => listQ.refetch()} disabled={busy}>
                <RefreshCcw className="mr-2 size-4" />
                {t('actions.refresh', {}, 'Aktualisieren')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{t('filters.search', {}, 'Titel oder Inhalt suchen')}</Label>
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder={t('filters.search', {}, 'Titel oder Inhalt suchen')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('filters.localeLabel', {}, 'Sprache')}</Label>
              <Select
                value={effectiveLocale}
                onValueChange={(v) => {
                  setSelectedLocale(v);
                  setPage(1);
                }}
                disabled={busy || localesLoading || localeOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.localePlaceholder', {}, 'Sprache wählen')} />
                </SelectTrigger>
                <SelectContent>
                  {localeOptions.map((opt: any) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {String(opt.label ?? opt.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('filters.typeLabel', {}, 'Typ')}</Label>
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
            </div>

            <div className="space-y-2">
              <Label>{t('filters.statusLabel', {}, 'Status')}</Label>
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
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.title', {}, 'Titel')}</TableHead>
                  <TableHead>{t('table.type', {}, 'Typ')}</TableHead>
                  <TableHead>{t('table.targets', {}, 'Ziel')}</TableHead>
                  <TableHead>{t('table.order', {}, 'Reihenfolge')}</TableHead>
                  <TableHead>{t('table.active', {}, 'Status')}</TableHead>
                  <TableHead className="text-right">{t('table.actions', {}, 'Aktionen')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!listQ.isFetching && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t('states.empty', {}, 'Keine Einträge gefunden')}
                    </TableCell>
                  </TableRow>
                ) : null}

                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell className="max-w-[240px] text-xs text-muted-foreground">
                      {item.target_paths.length ? item.target_paths.join(', ') : t('table.allPages', {}, 'Alle Seiten')}
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
                            ? t('badges.active', {}, 'Aktiv')
                            : t('badges.passive', {}, 'Passiv')}
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
                        <Button variant="outline" size="sm" onClick={() => goToEdit(item)} disabled={busy}>
                          <Pencil className="mr-2 size-4" />
                          {t('actions.edit', {}, 'Bearbeiten')}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete(item)} disabled={busy}>
                          <Trash2 className="mr-2 size-4" />
                          {t('actions.delete', {}, 'Löschen')}
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
              {t('actions.prev', {}, 'Zurück')}
            </Button>
            <Badge variant="outline">{t('labels.page', { page }, `Seite ${page}`)}</Badge>
            <Button variant="outline" size="sm" disabled={!hasNext || busy} onClick={() => setPage((p) => p + 1)}>
              {t('actions.next', {}, 'Weiter')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
