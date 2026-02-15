'use client';

// =============================================================
// FILE: src/app/(main)/admin/reports/_components/admin-reports-client.tsx
// FINAL — Admin Reports (KPI + Users Performance + Locations)
// - Tabs: kpi | users | locations
// - URL state: tab, from, to, role
// - RTK: reports_admin.api.ts hooks
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCcw, Calendar, Users, MapPin, BarChart3, Loader2 } from 'lucide-react';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ReportRole, KpiRow, UserPerformanceRow, LocationRow } from '@/integrations/shared';

import {
  useAdminReportsKpiQuery,
  useAdminReportsUsersPerformanceQuery,
  useAdminReportsLocationsQuery,
} from '@/integrations/hooks';

/* ----------------------------- helpers ----------------------------- */

type TabKey = 'kpi' | 'users' | 'locations';

function safeText(v: unknown, fb = ''): string {
  const s = String(v ?? '').trim();
  return s ? s : fb;
}

function getErrMessage(err: unknown, t: (k: string, p?: any, fb?: string) => string): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return t('reports.error.generic', {}, 'İşlem başarısız. Lütfen tekrar deneyin.');
}

function pickTab(sp: URLSearchParams): TabKey {
  const t = (sp.get('tab') ?? 'kpi').toLowerCase();
  if (t === 'users' || t === 'locations') return t;
  return 'kpi';
}

function toQS(next: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(next).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

function yyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  return { from: yyyyMmDd(from), to: yyyyMmDd(to) };
}

function fmtNum(n: any): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return new Intl.NumberFormat('tr-TR').format(x);
}

function fmtMoneyTry(n: any): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(x);
}

function fmtRate(r: any): string {
  const x = Number(r);
  if (!Number.isFinite(x)) return '0%';
  // backend 0..1 => percent
  return `${Math.round(x * 10000) / 100}%`;
}

/* ----------------------------- component ----------------------------- */

export default function AdminReportsClient() {
  const t = useAdminT();
  const router = useRouter();
  const sp = useSearchParams();

  const tab = React.useMemo(() => pickTab(sp), [sp]);

  // URL params
  const { from: dfb, to: dtb } = React.useMemo(() => defaultRange(), []);
  const from = sp.get('from') ?? dfb;
  const to = sp.get('to') ?? dtb;

  // local inputs
  const [fromText, setFromText] = React.useState(from);
  const [toText, setToText] = React.useState(to);

  React.useEffect(() => setFromText(from), [from]);
  React.useEffect(() => setToText(to), [to]);

  function apply(next: Partial<{ tab: TabKey; from: string; to: string }>) {
    const merged = {
      tab,
      from,
      to,
      ...next,
    };

    const qs = toQS({
      tab: merged.tab,
      from: merged.from || undefined,
      to: merged.to || undefined,
    });

    router.push(`/admin/reports${qs}`);
  }

  function onSubmitFilters(e: React.FormEvent) {
    e.preventDefault();

    // minimal UI guard (backend refine will still validate)
    const f = fromText.trim();
    const toVal = toText.trim();

    if (f && Number.isNaN(new Date(f).getTime())) {
      toast.error(t('reports.filter.invalidFrom', {}, 'Başlangıç geçersiz tarih.'));
      return;
    }
    if (toVal && Number.isNaN(new Date(toVal).getTime())) {
      toast.error(t('reports.filter.invalidTo', {}, 'Bitiş geçersiz tarih.'));
      return;
    }

    apply({ from: f, to: toVal });
  }

  function onReset() {
    const d = defaultRange();
    setFromText(d.from);
    setToText(d.to);
    apply({ from: d.from, to: d.to });
  }

  /* ----------------------------- queries ----------------------------- */

  const commonRange = React.useMemo(() => ({ from, to }), [from, to]);

  const kpiQ = useAdminReportsKpiQuery(tab === 'kpi' ? (commonRange as any) : (undefined as any), {
    skip: tab !== 'kpi',
  } as any) as any;

  const usersQ = useAdminReportsUsersPerformanceQuery(
    tab === 'users' ? ({ ...commonRange } as any) : (undefined as any),
    { skip: tab !== 'users' } as any,
  ) as any;

  const locQ = useAdminReportsLocationsQuery(
    tab === 'locations' ? (commonRange as any) : (undefined as any),
    { skip: tab !== 'locations' } as any,
  ) as any;

  const busy = kpiQ.isFetching || usersQ.isFetching || locQ.isFetching;

  const kpiRows: KpiRow[] = Array.isArray(kpiQ.data) ? (kpiQ.data as any) : [];
  const userRows: UserPerformanceRow[] = Array.isArray(usersQ.data) ? (usersQ.data as any) : [];
  const locRows: LocationRow[] = Array.isArray(locQ.data) ? (locQ.data as any) : [];

  // convenience splits for KPI
  const kpiDay = kpiRows.filter((x) => x.period === 'day');
  const kpiWeek = kpiRows.filter((x) => x.period === 'week');
  const kpiMonth = kpiRows.filter((x) => x.period === 'month');

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('reports.title', {}, 'Raporlar (Admin)')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('reports.description', {}, 'KPI, kaynak performansı ve lokasyon kırılımı.')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (tab === 'kpi') kpiQ.refetch();
              if (tab === 'users') usersQ.refetch();
              if (tab === 'locations') locQ.refetch();
            }}
            disabled={busy}
            title={t('reports.refresh', {}, 'Yenile')}
          >
            {busy ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 size-4" />
            )}
            {t('reports.refresh', {}, 'Yenile')}
          </Button>
        </div>
      </div>

      {/* tabs */}
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('reports.tabs.title', {}, 'Sekmeler')}</CardTitle>
          <CardDescription>
            {t('reports.tabs.description', {}, 'KPI • Kaynak Performansı • Lokasyonlar')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => apply({ tab: v as TabKey })}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="kpi" className="gap-2">
                <BarChart3 className="size-4" />
                {t('reports.tabs.kpi', {}, 'KPI')}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="size-4" />
                {t('reports.tabs.users', {}, 'Kaynaklar')}
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="size-4" />
                {t('reports.tabs.locations', {}, 'Lokasyonlar')}
              </TabsTrigger>
            </TabsList>

            {/* filters (shared) */}
            <div className="mt-4">
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('reports.filter.title', {}, 'Filtre')}</CardTitle>
                  <CardDescription>
                    {t('reports.filter.description', {}, 'Tarih aralığı (başlangıç/bitiş) ve kaynak seçimi.')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmitFilters} className="grid gap-3 lg:grid-cols-12">
                    <div className="space-y-2 lg:col-span-4">
                      <Label htmlFor="from">{t('reports.filter.from', {}, 'Başlangıç')}</Label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="from"
                          value={fromText}
                          onChange={(e) => setFromText(e.target.value)}
                          className="pl-9"
                          placeholder="YYYY-MM-DD"
                          disabled={busy}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 lg:col-span-4">
                      <Label htmlFor="to">{t('reports.filter.to', {}, 'Bitiş')}</Label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="to"
                          value={toText}
                          onChange={(e) => setToText(e.target.value)}
                          className="pl-9"
                          placeholder="YYYY-MM-DD"
                          disabled={busy}
                        />
                      </div>
                    </div>


                    <div className="flex gap-2 lg:col-span-1 lg:items-end">
                      <Button type="submit" disabled={busy} className="w-full">
                        {t('reports.filter.apply', {}, 'Uygula')}
                      </Button>
                    </div>

                    <div className="flex gap-2 lg:col-span-12">
                      <Button type="button" variant="outline" onClick={onReset} disabled={busy}>
                        {t('reports.filter.reset', {}, 'Sıfırla')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-5" />

            {/* KPI */}
            <TabsContent value="kpi" className="space-y-4">
              {kpiQ.isError ? (
                <div className="rounded-md border p-4 text-sm">
                  {t('reports.kpi.loadingError', {}, 'KPI yüklenemedi.')}{' '}
                  <Button variant="link" className="px-1" onClick={() => kpiQ.refetch()}>
                    {t('reports.retry', {}, 'Yeniden dene')}
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(kpiQ.error, t)}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  <KpiTable
                    title={t('reports.kpi.daily', {}, 'Günlük')}
                    rows={kpiDay}
                    t={t}
                  />
                  <KpiTable
                    title={t('reports.kpi.weekly', {}, 'Haftalık')}
                    rows={kpiWeek}
                    t={t}
                  />
                  <KpiTable
                    title={t('reports.kpi.monthly', {}, 'Aylık')}
                    rows={kpiMonth}
                    t={t}
                  />
                </div>
              )}
            </TabsContent>

            {/* Users */}
            <TabsContent value="users" className="space-y-4">
              {usersQ.isError ? (
                <div className="rounded-md border p-4 text-sm">
                  {t('reports.users.loadingError', {}, 'Performans raporu yüklenemedi.')}{' '}
                  <Button variant="link" className="px-1" onClick={() => usersQ.refetch()}>
                    {t('reports.retry', {}, 'Yeniden dene')}
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(usersQ.error, t)}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t('reports.users.title', {}, 'Kaynak Performansı')}
                    </CardTitle>
                    <CardDescription>
                      {t('reports.users.description', { count: usersQ.isFetching ? '—' : userRows.length }, `kayıt: ${usersQ.isFetching ? '—' : userRows.length}`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('reports.users.table.user', {}, 'Kaynak')}</TableHead>
                            <TableHead className="text-right">{t('reports.users.table.total', {}, 'Rezervasyon')}</TableHead>
                            <TableHead className="text-right">{t('reports.users.table.completed', {}, 'Tamamlanan')}</TableHead>
                            <TableHead className="text-right">{t('reports.users.table.cancelled', {}, 'İptal')}</TableHead>
                            <TableHead className="text-right">{t('reports.users.table.success', {}, 'Başarı')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userRows.map((r) => (
                            <TableRow key={`${r.role}-${r.user_id}`}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="truncate">{r.user_id}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {r.role === 'resource'
                                        ? t('reports.tabs.users', {}, 'Kaynak') // Singular fallback if needed, but 'Kaynaklar' is closest
                                        : r.role}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{fmtNum(r.orders_total)}</TableCell>
                              <TableCell className="text-right">
                                {fmtNum(r.delivered_orders)}
                              </TableCell>
                              <TableCell className="text-right">
                                {fmtNum(r.cancelled_orders)}
                              </TableCell>
                              <TableCell className="text-right">
                                {fmtRate(r.success_rate)}
                              </TableCell>
                            </TableRow>
                          ))}

                          {!usersQ.isFetching && userRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="py-10 text-center text-muted-foreground"
                              >
                                Kayıt bulunamadı.
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Locations */}
            <TabsContent value="locations" className="space-y-4">
              {locQ.isError ? (
                <div className="rounded-md border p-4 text-sm">
                  {t('reports.locations.loadingError', {}, 'Lokasyon raporu yüklenemedi.')}{' '}
                  <Button variant="link" className="px-1" onClick={() => locQ.refetch()}>
                    {t('reports.retry', {}, 'Yeniden dene')}
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(locQ.error, t)}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t('reports.locations.title', {}, 'Lokasyon (Dil) Kırılımı')}
                    </CardTitle>
                    <CardDescription>
                      {t('reports.locations.description', { count: locQ.isFetching ? '—' : locRows.length }, `kayıt: ${locQ.isFetching ? '—' : locRows.length}`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('reports.locations.table.city', {}, 'Dil / Bölge')}</TableHead>
                            <TableHead>{t('reports.locations.table.district', {}, 'Alt Bölge')}</TableHead>
                            <TableHead className="text-right">{t('reports.locations.table.total', {}, 'Rezervasyon')}</TableHead>
                            <TableHead className="text-right">{t('reports.locations.table.completed', {}, 'Tamamlanan')}</TableHead>
                            <TableHead className="text-right">{t('reports.locations.table.cancelled', {}, 'İptal')}</TableHead>
                            <TableHead className="text-right">{t('reports.locations.table.success', {}, 'Başarı')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {locRows.map((r, i) => (
                            <TableRow
                              key={`${r.city_id ?? 'null'}-${r.district_id ?? 'null'}-${i}`}
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="truncate">{r.city_name ?? '—'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {r.city_id ? `#${r.city_id.slice(0, 8)}` : '—'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="truncate">{r.district_name ?? '—'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {r.district_id ? `#${r.district_id.slice(0, 8)}` : '—'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{fmtNum(r.orders_total)}</TableCell>
                              <TableCell className="text-right">
                                {fmtNum(r.delivered_orders)}
                              </TableCell>
                              <TableCell className="text-right">
                                {fmtNum(r.cancelled_orders)}
                              </TableCell>
                              <TableCell className="text-right">
                                {fmtRate(r.success_rate)}
                              </TableCell>
                            </TableRow>
                          ))}

                          {!locQ.isFetching && locRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="py-10 text-center text-muted-foreground"
                              >
                                Kayıt bulunamadı.
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- KPI table ----------------------------- */

function KpiTable(props: {
  title: string;
  rows: KpiRow[];
  t: (k: string, p?: any, fb?: string) => string;
}) {
  const { title, rows, t } = props;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>
          {t('reports.kpi.count', { count: rows.length }, `Kayıt: ${rows.length}`)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.kpi.bucket', {}, 'Dönem')}</TableHead>
                <TableHead className="text-right">{t('reports.kpi.total', {}, 'Toplam')}</TableHead>
                <TableHead className="text-right">{t('reports.kpi.completed', {}, 'Tamamlanan')}</TableHead>
                <TableHead className="text-right">{t('reports.kpi.success', {}, 'Başarı')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.period}-${r.bucket}`}>
                  <TableCell className="font-medium">{r.bucket}</TableCell>
                  <TableCell className="text-right">{fmtNum(r.orders_total)}</TableCell>
                  <TableCell className="text-right">{fmtNum(r.delivered_orders)}</TableCell>
                  <TableCell className="text-right">{fmtRate(r.success_rate)}</TableCell>
                </TableRow>
              ))}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {t('reports.kpi.noData', {}, 'Kayıt yok.')}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
