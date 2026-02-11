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

function getErrMessage(err: unknown): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return 'İşlem başarısız. Lütfen tekrar deneyin.';
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
  const router = useRouter();
  const sp = useSearchParams();

  const tab = React.useMemo(() => pickTab(sp), [sp]);

  // URL params
  const { from: dfb, to: dtb } = React.useMemo(() => defaultRange(), []);
  const from = sp.get('from') ?? dfb;
  const to = sp.get('to') ?? dtb;
  const role = (sp.get('role') as ReportRole) ?? 'seller';

  // local inputs
  const [fromText, setFromText] = React.useState(from);
  const [toText, setToText] = React.useState(to);
  const [roleSel, setRoleSel] = React.useState<ReportRole>(role);

  React.useEffect(() => setFromText(from), [from]);
  React.useEffect(() => setToText(to), [to]);
  React.useEffect(() => setRoleSel(role), [role]);

  function apply(next: Partial<{ tab: TabKey; from: string; to: string; role: ReportRole }>) {
    const merged = {
      tab,
      from,
      to,
      role,
      ...next,
    };

    const qs = toQS({
      tab: merged.tab,
      from: merged.from || undefined,
      to: merged.to || undefined,
      role: merged.tab === 'users' ? merged.role : undefined,
    });

    router.push(`/admin/dashboard/reports${qs}`);
  }

  function onSubmitFilters(e: React.FormEvent) {
    e.preventDefault();

    // minimal UI guard (backend refine will still validate)
    const f = fromText.trim();
    const t = toText.trim();

    if (f && Number.isNaN(new Date(f).getTime())) {
      toast.error('from geçersiz tarih.');
      return;
    }
    if (t && Number.isNaN(new Date(t).getTime())) {
      toast.error('to geçersiz tarih.');
      return;
    }

    apply({ from: f, to: t, role: roleSel });
  }

  function onReset() {
    const d = defaultRange();
    setFromText(d.from);
    setToText(d.to);
    setRoleSel('seller');
    apply({ from: d.from, to: d.to, role: 'seller' });
  }

  /* ----------------------------- queries ----------------------------- */

  const commonRange = React.useMemo(() => ({ from, to }), [from, to]);

  const kpiQ = useAdminReportsKpiQuery(tab === 'kpi' ? (commonRange as any) : (undefined as any), {
    skip: tab !== 'kpi',
  } as any) as any;

  const usersQ = useAdminReportsUsersPerformanceQuery(
    tab === 'users' ? ({ ...commonRange, role } as any) : (undefined as any),
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
          <h1 className="text-lg font-semibold">Raporlar (Admin)</h1>
          <p className="text-sm text-muted-foreground">
            KPI, kullanıcı performansı ve lokasyon kırılımı.
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
            title="Yenile"
          >
            {busy ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 size-4" />
            )}
            Yenile
          </Button>
        </div>
      </div>

      {/* tabs */}
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">Sekmeler</CardTitle>
          <CardDescription>KPI • Kullanıcı Performansı • Lokasyonlar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => apply({ tab: v as TabKey })}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="kpi" className="gap-2">
                <BarChart3 className="size-4" />
                KPI
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="size-4" />
                Kullanıcılar
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="size-4" />
                Lokasyonlar
              </TabsTrigger>
            </TabsList>

            {/* filters (shared) */}
            <div className="mt-4">
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Filtre</CardTitle>
                  <CardDescription>Tarih aralığı (from/to) ve kullanıcı rolü.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmitFilters} className="grid gap-3 lg:grid-cols-12">
                    <div className="space-y-2 lg:col-span-4">
                      <Label htmlFor="from">from</Label>
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
                      <Label htmlFor="to">to</Label>
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

                    <div className={cn('space-y-2 lg:col-span-3', tab !== 'users' && 'opacity-60')}>
                      <Label>role</Label>
                      <Select
                        value={roleSel}
                        onValueChange={(v) => setRoleSel(v as ReportRole)}
                        disabled={busy || tab !== 'users'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seller">seller</SelectItem>
                          <SelectItem value="driver">driver</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Sadece “Kullanıcılar” sekmesinde kullanılır.
                      </p>
                    </div>

                    <div className="flex gap-2 lg:col-span-1 lg:items-end">
                      <Button type="submit" disabled={busy} className="w-full">
                        Uygula
                      </Button>
                    </div>

                    <div className="flex gap-2 lg:col-span-12">
                      <Button type="button" variant="outline" onClick={onReset} disabled={busy}>
                        Sıfırla
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
                  KPI yüklenemedi.{' '}
                  <Button variant="link" className="px-1" onClick={() => kpiQ.refetch()}>
                    Yeniden dene
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(kpiQ.error)}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  <KpiTable title="Günlük" rows={kpiDay} />
                  <KpiTable title="Haftalık" rows={kpiWeek} />
                  <KpiTable title="Aylık" rows={kpiMonth} />
                </div>
              )}
            </TabsContent>

            {/* Users */}
            <TabsContent value="users" className="space-y-4">
              {usersQ.isError ? (
                <div className="rounded-md border p-4 text-sm">
                  Kullanıcı performansı yüklenemedi.{' '}
                  <Button variant="link" className="px-1" onClick={() => usersQ.refetch()}>
                    Yeniden dene
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(usersQ.error)}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Kullanıcı Performansı</CardTitle>
                    <CardDescription>
                      role={role} • kayıt: {usersQ.isFetching ? '—' : userRows.length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Orders</TableHead>
                            <TableHead className="text-right">Delivered</TableHead>
                            <TableHead className="text-right">Cancelled</TableHead>
                            <TableHead className="text-right">Chickens</TableHead>
                            <TableHead className="text-right">Success</TableHead>
                            <TableHead className="text-right">Incentive</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userRows.map((r) => (
                            <TableRow key={`${r.role}-${r.user_id}`}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="truncate">{r.user_id}</span>
                                  <span className="text-xs text-muted-foreground">{r.role}</span>
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
                                {fmtNum(r.chickens_delivered)}
                              </TableCell>
                              <TableCell className="text-right">
                                {fmtRate(r.success_rate)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-medium">
                                    {fmtMoneyTry(r.incentive_amount_total)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    del:{fmtNum(r.incentive_deliveries_count)} • ck:
                                    {fmtNum(r.incentive_chickens_count)}
                                  </span>
                                </div>
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
                  Lokasyon raporu yüklenemedi.{' '}
                  <Button variant="link" className="px-1" onClick={() => locQ.refetch()}>
                    Yeniden dene
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(locQ.error)}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Lokasyon Kırılımı</CardTitle>
                    <CardDescription>
                      kayıt: {locQ.isFetching ? '—' : locRows.length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Şehir</TableHead>
                            <TableHead>İlçe</TableHead>
                            <TableHead className="text-right">Orders</TableHead>
                            <TableHead className="text-right">Delivered</TableHead>
                            <TableHead className="text-right">Cancelled</TableHead>
                            <TableHead className="text-right">Chickens</TableHead>
                            <TableHead className="text-right">Success</TableHead>
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
                                {fmtNum(r.chickens_delivered)}
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

function KpiTable(props: { title: string; rows: KpiRow[] }) {
  const { title, rows } = props;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>Kayıt: {rows.length}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Chickens</TableHead>
                <TableHead className="text-right">Success</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.period}-${r.bucket}`}>
                  <TableCell className="font-medium">{r.bucket}</TableCell>
                  <TableCell className="text-right">{fmtNum(r.orders_total)}</TableCell>
                  <TableCell className="text-right">{fmtNum(r.delivered_orders)}</TableCell>
                  <TableCell className="text-right">{fmtNum(r.chickens_delivered)}</TableCell>
                  <TableCell className="text-right">{fmtRate(r.success_rate)}</TableCell>
                </TableRow>
              ))}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Kayıt yok.
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
