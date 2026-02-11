'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/audit/admin-audit-client.tsx
// FINAL — Admin Audit (Requests / Auth Events / Daily Metrics)
// - Tabs: requests | auth | metrics
// - URL state: filters + pagination
// - RTK Query hooks
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity,
  ShieldCheck,
  UserCheck,
  RefreshCcw,
  Search,
  Calendar,
  Filter,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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

import { AuditDailyChart } from '@/components/admin/audit/AuditDailyChart';

import type {
  AuditAuthEvent,
  AuditAuthEventDto,
  AuditRequestLogDto,
  AuditListResponse,
  AuditMetricsDailyResponseDto,
} from '@/integrations/shared';
import { AUDIT_AUTH_EVENTS } from '@/integrations/shared';
import {
  useListAuditRequestLogsAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useGetAuditMetricsDailyAdminQuery,
} from '@/integrations/hooks';

/* ----------------------------- helpers ----------------------------- */

type TabKey = 'requests' | 'auth' | 'metrics';

function safeText(v: unknown, fb = ''): string {
  const s = String(v ?? '').trim();
  return s ? s : fb;
}

function safeInt(v: string | null, fb: number): number {
  const n = Number(v ?? '');
  return Number.isFinite(n) && n >= 0 ? n : fb;
}

function parseStatusCode(v: string): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n < 100 || n > 599) return undefined;
  return Math.floor(n);
}

function normalizeTab(v: string | null): TabKey {
  const s = String(v ?? '').toLowerCase();
  if (s === 'auth') return 'auth';
  if (s === 'metrics') return 'metrics';
  return 'requests';
}

function normalizeBoolLike(v: string | null): boolean {
  return v === '1' || v === 'true';
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

function fmtWhen(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function statusVariant(code: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (code >= 500) return 'destructive';
  if (code >= 400) return 'secondary';
  if (code >= 300) return 'outline';
  return 'default';
}

/* ----------------------------- component ----------------------------- */

export default function AdminAuditClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const tab = normalizeTab(sp.get('tab'));

  const q = sp.get('q') ?? '';
  const method = sp.get('method') ?? '';
  const status = sp.get('status') ?? '';
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const onlyAdmin = normalizeBoolLike(sp.get('only_admin'));

  const event = sp.get('event') ?? '';
  const email = sp.get('email') ?? '';
  const user_id = sp.get('user_id') ?? '';
  const ip = sp.get('ip') ?? '';

  const days = String(safeInt(sp.get('days'), 14) || 14);
  const path_prefix = sp.get('path_prefix') ?? '';

  const limit = safeInt(sp.get('limit'), 50) || 50;
  const offset = safeInt(sp.get('offset'), 0);

  // local state for request filters
  const [qText, setQText] = React.useState(q);
  const [methodText, setMethodText] = React.useState(method);
  const [statusText, setStatusText] = React.useState(status);
  const [fromText, setFromText] = React.useState(from);
  const [toText, setToText] = React.useState(to);
  const [onlyAdminFlag, setOnlyAdminFlag] = React.useState(onlyAdmin);

  // local state for auth filters
  const [eventText, setEventText] = React.useState(event);
  const [emailText, setEmailText] = React.useState(email);
  const [userIdText, setUserIdText] = React.useState(user_id);
  const [ipText, setIpText] = React.useState(ip);

  // local state for metrics
  const [daysText, setDaysText] = React.useState(days);
  const [pathPrefixText, setPathPrefixText] = React.useState(path_prefix);

  React.useEffect(() => setQText(q), [q]);
  React.useEffect(() => setMethodText(method), [method]);
  React.useEffect(() => setStatusText(status), [status]);
  React.useEffect(() => setFromText(from), [from]);
  React.useEffect(() => setToText(to), [to]);
  React.useEffect(() => setOnlyAdminFlag(onlyAdmin), [onlyAdmin]);

  React.useEffect(() => setEventText(event), [event]);
  React.useEffect(() => setEmailText(email), [email]);
  React.useEffect(() => setUserIdText(user_id), [user_id]);
  React.useEffect(() => setIpText(ip), [ip]);

  React.useEffect(() => setDaysText(days), [days]);
  React.useEffect(() => setPathPrefixText(path_prefix), [path_prefix]);

  function apply(next: Partial<Record<string, any>>) {
    const merged = {
      tab,
      q,
      method,
      status,
      from,
      to,
      only_admin: onlyAdmin ? '1' : '',
      event,
      email,
      user_id,
      ip,
      days,
      path_prefix,
      limit,
      offset,
      ...next,
    };

    if (next.offset == null) merged.offset = 0;

    const qs = toQS({
      tab: merged.tab,
      q: merged.q || undefined,
      method: merged.method || undefined,
      status: merged.status || undefined,
      from: merged.from || undefined,
      to: merged.to || undefined,
      only_admin: merged.only_admin || undefined,
      event: merged.event || undefined,
      email: merged.email || undefined,
      user_id: merged.user_id || undefined,
      ip: merged.ip || undefined,
      days: merged.days || undefined,
      path_prefix: merged.path_prefix || undefined,
      limit: merged.limit || undefined,
      offset: merged.offset || undefined,
    });

    router.push(`/admin/dashboard/audit${qs}`);
  }

  function onTabChange(next: string) {
    apply({ tab: next, offset: 0 });
  }

  function onSubmitRequests(e: React.FormEvent) {
    e.preventDefault();
    apply({
      tab: 'requests',
      q: qText.trim(),
      method: methodText.trim().toUpperCase(),
      status: statusText.trim(),
      from: fromText.trim(),
      to: toText.trim(),
      only_admin: onlyAdminFlag ? '1' : '',
      offset: 0,
    });
  }

  function onResetRequests() {
    setQText('');
    setMethodText('');
    setStatusText('');
    setFromText('');
    setToText('');
    setOnlyAdminFlag(false);
    apply({
      tab: 'requests',
      q: '',
      method: '',
      status: '',
      from: '',
      to: '',
      only_admin: '',
      offset: 0,
    });
  }

  function onSubmitAuth(e: React.FormEvent) {
    e.preventDefault();
    apply({
      tab: 'auth',
      event: eventText,
      email: emailText.trim(),
      user_id: userIdText.trim(),
      ip: ipText.trim(),
      from: fromText.trim(),
      to: toText.trim(),
      offset: 0,
    });
  }

  function onResetAuth() {
    setEventText('');
    setEmailText('');
    setUserIdText('');
    setIpText('');
    setFromText('');
    setToText('');
    apply({
      tab: 'auth',
      event: '',
      email: '',
      user_id: '',
      ip: '',
      from: '',
      to: '',
      offset: 0,
    });
  }

  function onSubmitMetrics(e: React.FormEvent) {
    e.preventDefault();
    const d = String(safeInt(daysText, 14) || 14);
    setDaysText(d);
    apply({
      tab: 'metrics',
      days: d,
      path_prefix: pathPrefixText.trim(),
      only_admin: onlyAdminFlag ? '1' : '',
    });
  }

  function onResetMetrics() {
    setDaysText('14');
    setPathPrefixText('');
    setOnlyAdminFlag(false);
    apply({
      tab: 'metrics',
      days: '14',
      path_prefix: '',
      only_admin: '',
    });
  }

  /* ----------------------------- queries ----------------------------- */

  const reqParams = React.useMemo(() => {
    const code = parseStatusCode(status);
    return {
      q: q || undefined,
      method: method || undefined,
      status_code: code,
      only_admin: onlyAdmin ? 1 : undefined,
      created_from: from || undefined,
      created_to: to || undefined,
      sort: 'created_at' as const,
      orderDir: 'desc' as const,
      limit,
      offset,
    };
  }, [q, method, status, onlyAdmin, from, to, limit, offset]);

  const authParams = React.useMemo(() => {
    return {
      event: (event || undefined) as AuditAuthEvent | undefined,
      email: email || undefined,
      user_id: user_id || undefined,
      ip: ip || undefined,
      created_from: from || undefined,
      created_to: to || undefined,
      sort: 'created_at' as const,
      orderDir: 'desc' as const,
      limit,
      offset,
    };
  }, [event, email, user_id, ip, from, to, limit, offset]);

  const metricsParams = React.useMemo(() => {
    const d = safeInt(days, 14) || 14;
    return {
      days: d,
      only_admin: onlyAdmin ? 1 : undefined,
      path_prefix: path_prefix || undefined,
    };
  }, [days, onlyAdmin, path_prefix]);

  const reqQ = useListAuditRequestLogsAdminQuery(
    tab === 'requests' ? (reqParams as any) : (undefined as any),
    { skip: tab !== 'requests', refetchOnFocus: true } as any,
  ) as any;

  const authQ = useListAuditAuthEventsAdminQuery(
    tab === 'auth' ? (authParams as any) : (undefined as any),
    { skip: tab !== 'auth', refetchOnFocus: true } as any,
  ) as any;

  const metricsQ = useGetAuditMetricsDailyAdminQuery(
    tab === 'metrics' ? (metricsParams as any) : (undefined as any),
    { skip: tab !== 'metrics', refetchOnFocus: true } as any,
  ) as any;

  const reqData = (reqQ.data as AuditListResponse<AuditRequestLogDto> | undefined) ?? {
    items: [],
    total: 0,
  };
  const authData = (authQ.data as AuditListResponse<AuditAuthEventDto> | undefined) ?? {
    items: [],
    total: 0,
  };
  const metricsData = (metricsQ.data as AuditMetricsDailyResponseDto | undefined) ?? { days: [] };

  const reqLoading = reqQ.isLoading || reqQ.isFetching;
  const authLoading = authQ.isLoading || authQ.isFetching;
  const metricsLoading = metricsQ.isLoading || metricsQ.isFetching;

  const reqTotal = reqData.total ?? 0;
  const authTotal = authData.total ?? 0;

  const canPrev = offset > 0;
  const canNextReq = offset + limit < reqTotal;
  const canNextAuth = offset + limit < authTotal;

  async function onRefresh() {
    try {
      if (tab === 'requests') await reqQ.refetch();
      if (tab === 'auth') await authQ.refetch();
      if (tab === 'metrics') await metricsQ.refetch();
      toast.success('Yenilendi');
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit & Logs</h1>
          <p className="text-sm text-muted-foreground">
            İstek logları, auth olayları ve günlük metrikleri tek ekrandan izleyin.
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={reqLoading || authLoading || metricsLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Yenile
        </Button>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="requests">
            <Activity className="mr-2 h-4 w-4" /> Request Logs
          </TabsTrigger>
          <TabsTrigger value="auth">
            <UserCheck className="mr-2 h-4 w-4" /> Auth Events
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <ShieldCheck className="mr-2 h-4 w-4" /> Günlük Metrikler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" /> Request Filtreleri
              </CardTitle>
              <CardDescription>Path, method ve tarih bazlı filtreleme.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitRequests} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Arama</Label>
                  <Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="/api/orders" />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Input value={methodText} onChange={(e) => setMethodText(e.target.value)} placeholder="GET" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={statusText} onChange={(e) => setStatusText(e.target.value)} placeholder="200" />
                </div>
                <div className="space-y-2">
                  <Label>Başlangıç</Label>
                  <Input type="datetime-local" value={fromText} onChange={(e) => setFromText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş</Label>
                  <Input type="datetime-local" value={toText} onChange={(e) => setToText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>Sadece Admin</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={onlyAdminFlag} onCheckedChange={setOnlyAdminFlag} />
                    <span className="text-sm text-muted-foreground">Admin istekleri</span>
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" /> Uygula
                  </Button>
                  <Button type="button" variant="secondary" onClick={onResetRequests}>
                    Sıfırla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Request Logları</CardTitle>
                  <CardDescription>
                    Toplam <strong>{reqTotal}</strong> kayıt
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {reqLoading ? 'Yükleniyor…' : `${reqData.items.length} kayıt`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {reqQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrMessage(reqQ.error)}
                </div>
              )}

              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>İstek</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP / User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reqData.items.length === 0 && !reqLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          Kayıt bulunamadı.
                        </TableCell>
                      </TableRow>
                    )}

                    {reqData.items.map((r) => {
                      const code = Number(r.status_code ?? 0);
                      return (
                        <TableRow key={String(r.id)}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {fmtWhen(r.created_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{safeText(r.method)}</div>
                            <div className="text-muted-foreground">{safeText(r.path)}</div>
                            <div className="text-muted-foreground text-xs">{safeText(r.url)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(code)}>{code || '—'}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {Number(r.response_time_ms ?? 0)}ms
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{safeText(r.ip)}</div>
                            <div className="text-muted-foreground">
                              {r.user_id ? `uid:${r.user_id}` : 'anon'}
                              {r.is_admin ? ' · admin' : ''}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {reqTotal === 0 ? '0' : `${offset + 1}-${Math.min(offset + limit, reqTotal)}`}
                  {' / '} {reqTotal}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => apply({ offset: Math.max(0, offset - limit) })}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextReq}
                    onClick={() => apply({ offset: offset + limit })}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" /> Auth Filtreleri
              </CardTitle>
              <CardDescription>Login / logout eventlerini filtreleyin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitAuth} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Event</Label>
                  <Select value={eventText || ''} onValueChange={setEventText}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hepsi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Hepsi</SelectItem>
                      {AUDIT_AUTH_EVENTS.map((ev) => (
                        <SelectItem key={ev} value={ev}>
                          {ev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={emailText} onChange={(e) => setEmailText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input value={userIdText} onChange={(e) => setUserIdText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>IP</Label>
                  <Input value={ipText} onChange={(e) => setIpText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Başlangıç</Label>
                  <Input type="datetime-local" value={fromText} onChange={(e) => setFromText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş</Label>
                  <Input type="datetime-local" value={toText} onChange={(e) => setToText(e.target.value)} />
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" /> Uygula
                  </Button>
                  <Button type="button" variant="secondary" onClick={onResetAuth}>
                    Sıfırla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Auth Eventleri</CardTitle>
                  <CardDescription>
                    Toplam <strong>{authTotal}</strong> kayıt
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {authLoading ? 'Yükleniyor…' : `${authData.items.length} kayıt`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {authQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrMessage(authQ.error)}
                </div>
              )}

              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authData.items.length === 0 && !authLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          Kayıt bulunamadı.
                        </TableCell>
                      </TableRow>
                    )}

                    {authData.items.map((r) => (
                      <TableRow key={String(r.id)}>
                        <TableCell className="whitespace-nowrap text-sm">{fmtWhen(r.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{safeText(r.event)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{safeText(r.email || r.user_id || '—')}</div>
                          <div className="text-muted-foreground">{r.user_id ? `uid:${r.user_id}` : ''}</div>
                        </TableCell>
                        <TableCell className="text-sm">{safeText(r.ip)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {authTotal === 0 ? '0' : `${offset + 1}-${Math.min(offset + limit, authTotal)}`}
                  {' / '} {authTotal}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => apply({ offset: Math.max(0, offset - limit) })}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextAuth}
                    onClick={() => apply({ offset: offset + limit })}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" /> Günlük Metrikler
              </CardTitle>
              <CardDescription>Request sayısı, unique IP ve error sayıları.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitMetrics} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Gün</Label>
                  <Select value={daysText} onValueChange={setDaysText}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 gün</SelectItem>
                      <SelectItem value="14">14 gün</SelectItem>
                      <SelectItem value="30">30 gün</SelectItem>
                      <SelectItem value="60">60 gün</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Path Prefix</Label>
                  <Input value={pathPrefixText} onChange={(e) => setPathPrefixText(e.target.value)} placeholder="/api" />
                </div>
                <div className="space-y-2">
                  <Label>Sadece Admin</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={onlyAdminFlag} onCheckedChange={setOnlyAdminFlag} />
                    <span className="text-sm text-muted-foreground">Admin istekleri</span>
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                  <Button type="submit">
                    <Filter className="mr-2 h-4 w-4" /> Uygula
                  </Button>
                  <Button type="button" variant="secondary" onClick={onResetMetrics}>
                    Sıfırla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Günlük Grafik</CardTitle>
                  <CardDescription>Son {metricsData.days?.length ?? 0} gün</CardDescription>
                </div>
                {metricsLoading && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Yükleniyor
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {metricsQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrMessage(metricsQ.error)}
                </div>
              )}
              <AuditDailyChart rows={metricsData.days ?? []} loading={metricsLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
