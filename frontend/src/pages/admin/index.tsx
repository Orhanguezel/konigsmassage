// =============================================================
// FILE: src/pages/admin/index.tsx
// konigsmassage Admin Dashboard – modern özet ekranı + Audit widgets
// Layout: _app.tsx içindeki AdminLayoutShell ile geliyor
// Fix:
//  - Audit list response normalize: Array | {items: Array} | {data: Array}
//  - Daily metrics normalize: Array | {days:Array} | {items:Array} | {data:Array}
//  - “kart şeklindeki analiz” kaldırıldı (tekrar veriydi)
//  - Hooks order fix: useMemo/useEffect conditional değil
//  - Responsive düzen: audit 2 kolon, içerik dağılımı scroll
// =============================================================

'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  useStatusQuery,
  useGetMyProfileQuery,
  useGetDashboardSummaryAdminQuery,
  useGetUnreadNotificationsCountQuery,
  useListAuditRequestLogsAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useGetAuditMetricsDailyAdminQuery,
} from '@/integrations/rtk/hooks';

import type {
  DashboardCountItemDto,
  AuditRequestLogDto,
  AuditAuthEventDto,
} from '@/integrations/types';

import { AuditDailyChart } from '@/components/admin/audit/AuditDailyChart';

import {
  BarChart3,
  Package,
  Settings,
  FileText,
  FolderTree,
  HelpCircle,
  Mail,
  ImageIcon,
  BookOpen,
  Users,
  Database,
  MessageCircle,
  ListTree,
  Tag,
  Activity,
  LogIn,
} from 'lucide-react';

type NormalizedRole = 'admin' | 'moderator' | 'user';

function normalizeRole(rawRole: unknown, isAdminFlag: boolean | undefined): NormalizedRole {
  if (isAdminFlag) return 'admin';

  const s = String(rawRole || '').toLowerCase();
  if (s === 'admin' || s === 'super_admin' || s === 'superadmin') return 'admin';
  if (s === 'moderator' || s === 'editor') return 'moderator';
  return 'user';
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  dashboard: BarChart3,
  site_settings: Settings,
  custom_pages: FileText,
  services: FolderTree,
  products: Package,
  categories: FolderTree,
  subcategories: FolderTree,
  slider: ImageIcon,
  references: FileText,
  faqs: HelpCircle,
  contacts: Mail,
  newsletter: Mail,
  email_templates: Mail,
  library: BookOpen,
  reviews: MessageCircle,
  support: HelpCircle,
  menuitem: ListTree,
  users: Users,
  db: Database,
  offers: Tag,
};

function getIconForItem(item: DashboardCountItemDto) {
  const Icon = ICON_MAP[item.key] ?? BarChart3;
  return Icon;
}

function fmtTs(s?: string | null) {
  if (!s) return '-';
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return String(s);
    return d.toLocaleString();
  } catch {
    return String(s);
  }
}

function toInt(v: unknown, fallback = 0) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** ✅ API list response normalize (Array | {items: Array} | {data: Array}) */
function normalizeList<T = any>(input: any): T[] {
  if (!input) return [];
  if (Array.isArray(input)) return input as T[];

  const items = (input as any).items ?? (input as any).data ?? null;
  if (Array.isArray(items)) return items as T[];

  return [];
}

/** ✅ Daily metrics normalize (Array | {days:Array} | {items:Array} | {data:Array}) */
type DailyRow = { date: string; requests: any; unique_ips: any; errors: any };
function normalizeDailyRows(input: any): DailyRow[] {
  if (!input) return [];
  if (Array.isArray(input)) return input as DailyRow[];

  const days = (input as any).days ?? (input as any).items ?? (input as any).data ?? null;
  if (Array.isArray(days)) return days as DailyRow[];

  return [];
}

const AdminDashboardPage: React.FC = () => {
  const router = useRouter();

  // ---------------- Queries (hooks) ----------------
  const { data: statusData, isLoading: statusLoading, isError: statusError } = useStatusQuery();

  const authed = !!statusData?.authenticated;
  const adminSkip = statusLoading || !authed;

  const { data: profile } = useGetMyProfileQuery(undefined, { skip: adminSkip });

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetDashboardSummaryAdminQuery(undefined, { skip: adminSkip });

  const { data: unreadData } = useGetUnreadNotificationsCountQuery(undefined, { skip: adminSkip });
  const unreadCount = unreadData?.count ?? 0;

  const {
    data: daily,
    isLoading: isDailyLoading,
    isFetching: isDailyFetching,
    error: dailyError,
    refetch: refetchDaily,
  } = useGetAuditMetricsDailyAdminQuery({ days: 14 }, { skip: adminSkip });

  const {
    data: recentRequestsRaw,
    isLoading: isReqLogsLoading,
    isFetching: isReqLogsFetching,
    error: reqLogsError,
    refetch: refetchReqLogs,
  } = useListAuditRequestLogsAdminQuery(
    { limit: 20, offset: 0, orderDir: 'desc', sort: 'created_at' },
    {
      skip: adminSkip,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    } as any,
  );

  const {
    data: recentLoginsRaw,
    isLoading: isAuthLogsLoading,
    isFetching: isAuthLogsFetching,
    error: authLogsError,
    refetch: refetchAuthLogs,
  } = useListAuditAuthEventsAdminQuery(
    { event: 'login_success', limit: 20, offset: 0, orderDir: 'desc', sort: 'created_at' },
    {
      skip: adminSkip,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    } as any,
  );

  // ---------------- Derived state (hooks) ----------------
  useEffect(() => {
    if (statusLoading) return;
    if (statusError || !authed) router.push('/login');
  }, [statusLoading, statusError, authed, router]);

  const items: DashboardCountItemDto[] = useMemo(
    () => (summary?.items ?? []) as DashboardCountItemDto[],
    [summary],
  );

  const totalCount = useMemo(() => items.reduce((sum, it) => sum + (it.count ?? 0), 0), [items]);

  const maxCount = useMemo(
    () => items.reduce((m, it) => (it.count > m ? it.count : m), 0),
    [items],
  );

  const topItems = useMemo(
    () => [...items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 6),
    [items],
  );

  const recentRequestsSafe: AuditRequestLogDto[] = useMemo(
    () => normalizeList<AuditRequestLogDto>(recentRequestsRaw),
    [recentRequestsRaw],
  );

  const recentLoginsSafe: AuditAuthEventDto[] = useMemo(
    () => normalizeList<AuditAuthEventDto>(recentLoginsRaw),
    [recentLoginsRaw],
  );

  const dailyRows = useMemo(() => normalizeDailyRows(daily), [daily]);

  const loadingSummary = isSummaryLoading || isSummaryFetching;
  const loadingAudit =
    isReqLogsLoading ||
    isReqLogsFetching ||
    isAuthLogsLoading ||
    isAuthLogsFetching ||
    isDailyLoading ||
    isDailyFetching;

  // ---------------- Early UI returns (AFTER hooks) ----------------
  if (statusLoading || !statusData) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '16rem' }}>
        <div className="text-center">
          <div
            className="mx-auto mb-3 rounded-circle border border-primary border-2"
            style={{
              width: 32,
              height: 32,
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p>Admin paneli yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!authed) return null;

  const role = normalizeRole(statusData.user?.role, statusData.is_admin);
  const userName = profile?.full_name || statusData.user?.email || 'Yönetici';
  const badgeLabel = role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderator' : 'Kullanıcı';

  return (
    <div className="container-fluid py-3">
      {/* Üst başlık */}
      <div className="d-flex flex-column gap-2 flex-md-row align-items-md-center justify-content-md-between mb-3">
        <div>
          <h1 className="h3 mb-1 d-flex align-items-center gap-2">
            <BarChart3 size={20} />
            <span>konigsmassage Admin Panel</span>
          </h1>
          <p className="text-muted small mb-0">
            İçerik ve ayarları yönet, audit loglarını ve temel metrikleri tek ekrandan takip et.
          </p>
        </div>
        <div className="text-md-end">
          <p className="mb-0 small fw-semibold">{userName}</p>
          <Badge variant="outline" className="mt-1 text-xs">
            {badgeLabel}
          </Badge>
        </div>
      </div>

      {/* Üst istatistik kartları */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <Card className="h-100">
            <CardHeader className="py-2">
              <CardTitle className="text-sm d-flex align-items-center gap-2">
                <BarChart3 size={16} />
                <span>Toplam İçerik</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="d-flex align-items-baseline justify-content-between">
                <div className="fs-3 fw-bold">{totalCount}</div>
                <div className="text-muted small text-end">
                  Dashboard özetine dahil edilen
                  <br />
                  tüm kayıt sayısı
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-12 col-md-4">
          <Card className="h-100">
            <CardHeader className="py-2">
              <CardTitle className="text-sm d-flex align-items-center gap-2">
                <Settings size={16} />
                <span>Modül Sayısı</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="d-flex align-items-baseline justify-content-between">
                <div className="fs-3 fw-bold">{items.length}</div>
                <div className="text-muted small text-end">
                  Özet rapora dahil edilen
                  <br />
                  modül sayısı
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-12 col-md-4">
          <Card className="h-100">
            <CardHeader className="py-2">
              <CardTitle className="text-sm d-flex align-items-center gap-2">
                <Mail size={16} />
                <span>Okunmamış Bildirim</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="d-flex align-items-baseline justify-content-between">
                <div className="fs-3 fw-bold">{unreadCount > 99 ? '99+' : unreadCount}</div>
                <div className="text-muted small text-end">
                  Admin hesabı için unread
                  <br />
                  notifications
                </div>
              </div>
              <p className="text-muted small mb-0 mt-2">
                Detay için üst header&apos;daki bildirim çanını kullan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily chart */}
      <div className="row g-3 mb-3">
        <div className="col-12">
          <Card className="border-0 shadow-sm">
            <CardHeader className="py-2 d-flex align-items-center justify-content-between">
              <CardTitle className="text-sm mb-0">Ziyaretçi / Trafik (Günlük)</CardTitle>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => refetchDaily()}
                disabled={isDailyLoading || isDailyFetching}
              >
                {isDailyLoading || isDailyFetching ? 'Yenileniyor...' : 'Grafiği yenile'}
              </button>
            </CardHeader>

            <CardContent className="py-2">
              <div className="text-muted small mb-2">Son 14 gün: requests / unique IP / errors</div>

              {dailyError && (
                <div className="alert alert-warning py-2 small mb-2">
                  Günlük metrikler yüklenemedi. Endpoint:{' '}
                  <code>/api/admin/audit/metrics/daily</code>
                </div>
              )}

              <AuditDailyChart
                rows={dailyRows as any}
                loading={isDailyLoading || isDailyFetching}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {summaryError && (
        <div className="alert alert-danger py-2 small mb-3">
          Dashboard verileri yüklenirken hata oluştu. Backend&apos;de{' '}
          <code>/admin/dashboard/summary</code> endpoint&apos;inin{' '}
          <code>{`{ items: DashboardCountItemDto[] }`}</code> formatında döndüğünden emin ol.
        </div>
      )}

      {/* AUDIT listeler */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <Card className="h-100 border-0 shadow-sm">
            <CardHeader className="py-2 d-flex align-items-center justify-content-between">
              <CardTitle className="text-sm d-flex align-items-center gap-2 mb-0">
                <LogIn size={16} />
                <span>Son Giriş Yapanlar</span>
              </CardTitle>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => refetchAuthLogs()}
                disabled={loadingAudit}
              >
                {loadingAudit ? 'Yenileniyor...' : 'Yenile'}
              </button>
            </CardHeader>
            <CardContent className="py-2">
              {authLogsError && (
                <div className="alert alert-warning py-2 small mb-2">
                  Auth audit verileri yüklenemedi.
                </div>
              )}

              {recentLoginsSafe.length === 0 && !loadingAudit && (
                <div className="text-muted small">Kayıt bulunamadı.</div>
              )}

              <div className="d-flex flex-column gap-2">
                {recentLoginsSafe.slice(0, 10).map((e) => (
                  <div key={String(e.id)} className="d-flex justify-content-between gap-2">
                    <div className="small">
                      <div className="fw-semibold">{e.email ?? e.user_id ?? '-'}</div>
                      <div className="text-muted">
                        {e.ip} {e.country ? `· ${e.country}` : ''} {e.city ? `· ${e.city}` : ''}
                      </div>
                    </div>
                    <div className="text-muted small text-end" style={{ whiteSpace: 'nowrap' }}>
                      {fmtTs(e.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-12 col-lg-6">
          <Card className="h-100 border-0 shadow-sm">
            <CardHeader className="py-2 d-flex align-items-center justify-content-between">
              <CardTitle className="text-sm d-flex align-items-center gap-2 mb-0">
                <Activity size={16} />
                <span>Son Request’ler</span>
              </CardTitle>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => refetchReqLogs()}
                disabled={loadingAudit}
              >
                {loadingAudit ? 'Yenileniyor...' : 'Yenile'}
              </button>
            </CardHeader>
            <CardContent className="py-2">
              {reqLogsError && (
                <div className="alert alert-warning py-2 small mb-2">
                  Request audit verileri yüklenemedi.
                </div>
              )}

              {recentRequestsSafe.length === 0 && !loadingAudit && (
                <div className="text-muted small">Kayıt bulunamadı.</div>
              )}

              <div className="d-flex flex-column gap-2">
                {recentRequestsSafe.slice(0, 10).map((r) => {
                  const sc = toInt(r.status_code);
                  const isErr = sc >= 400;
                  return (
                    <div key={String(r.id)} className="d-flex justify-content-between gap-2">
                      <div className="small">
                        <div className="fw-semibold">
                          <span className={isErr ? 'text-danger' : 'text-success'}>{sc}</span>{' '}
                          <span className="text-muted">{r.method}</span> <span>{r.path}</span>
                        </div>
                        <div className="text-muted">
                          {r.ip} · {toInt(r.response_time_ms)}ms{' '}
                          {r.user_id ? `· uid:${r.user_id}` : ''}
                        </div>
                      </div>
                      <div className="text-muted small text-end" style={{ whiteSpace: 'nowrap' }}>
                        {fmtTs(r.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modül kartları + dağılım */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="row g-3">
            {topItems.length === 0 && !loadingSummary && (
              <div className="col-12">
                <Card>
                  <CardContent className="py-3 text-sm text-muted">
                    Henüz özetlenecek içerik bulunamadı. <code>/admin/dashboard/summary</code>{' '}
                    yanıtına <code>items</code> ekle.
                  </CardContent>
                </Card>
              </div>
            )}

            {topItems.map((item) => {
              const Icon = getIconForItem(item);
              const percent = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;

              return (
                <div key={item.key} className="col-12 col-sm-6">
                  <Card className="h-100 border-0 shadow-sm">
                    <CardContent className="py-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                            style={{ width: 32, height: 32 }}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="small fw-semibold">{item.label}</div>
                            <div className="text-muted small">{item.key}</div>
                          </div>
                        </div>
                        <div className="fs-4 fw-bold">{item.count}</div>
                      </div>

                      <div className="progress" style={{ height: 6 }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${percent}%` }}
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <small className="text-muted">Genel toplam içindeki pay</small>
                        <small className="text-muted">{percent}%</small>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <Card className="h-100 border-0 shadow-sm">
            <CardHeader className="py-2 d-flex justify-content-between align-items-center">
              <CardTitle className="text-sm mb-0">İçerik Dağılımı (Tüm Modüller)</CardTitle>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => refetchSummary()}
                disabled={loadingSummary}
              >
                {loadingSummary ? 'Yenileniyor...' : 'Yenile'}
              </button>
            </CardHeader>

            <CardContent className="py-2">
              {items.length === 0 && !loadingSummary && (
                <p className="text-muted small mb-0">Gösterilecek modül bulunamadı.</p>
              )}

              <div style={{ maxHeight: 520, overflow: 'auto', paddingRight: 4 }}>
                {items.map((item) => {
                  const Icon = getIconForItem(item);
                  const percent =
                    maxCount > 0 ? Math.max(4, Math.round((item.count / maxCount) * 100)) : 0;

                  return (
                    <div key={item.key} className="mb-2 d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                        style={{ width: 28, height: 28, flex: '0 0 auto' }}
                      >
                        <Icon size={14} className="text-secondary" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="fw-semibold">{item.label}</span>
                          <span className="text-muted">{item.count} kayıt</span>
                        </div>
                        <div className="progress" style={{ height: 5 }}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${percent}%` }}
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {loadingSummary && (
                <p className="text-muted small mt-2 mb-0">Dashboard verileri yükleniyor...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-muted small mt-3">
        Günlük metrikler: <code>/api/admin/audit/metrics/daily</code> üzerinden gelmektedir.
      </div>
    </div>
  );
};

export default AdminDashboardPage;
