'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/admin-dashboard-client.tsx
// Admin Dashboard Client (summary cards)
// - GET /admin/dashboard/summary → { items: [{ key, label, count }] }
// - Labels: nav copy > page copy > API label > key fallback
// - Cards link to their respective admin pages
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetDashboardSummaryAdminQuery } from '@/integrations/hooks';
import type { DashboardSummaryItem } from '@/integrations/shared';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useAdminSettings } from './admin-settings-provider';

// dashboard key → admin route
const ROUTE_MAP: Record<string, string> = {
  site_settings: '/admin/site-settings',
  custom_pages: '/admin/custompage',
  services: '/admin/services',
  projects: '/admin/projects',
  offers: '/admin/offers',
  pricing: '/admin/pricing',
  brands: '/admin/brands',
  resume: '/admin/resume',
  skills: '/admin/skills',
  sliders: '/admin/slider',
  menu_items: '/admin/menuitem',
  footer_sections: '/admin/footer-sections',
  faqs: '/admin/faqs',
  popups: '/admin/popups',
  newsletter: '/admin/newsletter',
  contacts: '/admin/contacts',
  reviews: '/admin/reviews',
  bookings: '/admin/bookings',
  mail: '/admin/mail',
  users: '/admin/users',
  email_templates: '/admin/email-templates',
  notifications: '/admin/notifications',
  storage: '/admin/storage',
  db: '/admin/db',
  audit: '/admin/audit',
  availability: '/admin/availability',
  reports: '/admin/reports',
  resources: '/admin/resources',
};

function getErrMessage(err: unknown): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return '';
}

export default function AdminDashboardClient() {
  const { copy } = useAdminUiCopy();
  const t = useAdminT();
  const page = copy.pages?.dashboard ?? {};

  const { pageMeta } = useAdminSettings();
  const dashboardMeta = pageMeta?.dashboard;

  const q = useGetDashboardSummaryAdminQuery();

  React.useEffect(() => {
    if (!q.isError) return;
    toast.error(getErrMessage(q.error) || copy.common?.states?.error || t('admin.common.error'));
  }, [q.isError, q.error, copy.common?.states?.error, t]);

  const items = React.useMemo(() => {
    let data = (q.data?.items ?? []) as DashboardSummaryItem[];
    if (dashboardMeta?.metrics && Array.isArray(dashboardMeta.metrics)) {
      data = data.filter((m) => dashboardMeta!.metrics!.includes(m.key));
    }

    const nav = copy.nav?.items ?? ({} as Record<string, string>);

    return data.map((item) => ({
      ...item,
      label:
        (nav as Record<string, string>)[item.key] ||
        page[`label_${item.key}`] ||
        page[item.key] ||
        t(`admin.dashboard.items.${item.key}` as any) ||
        item.label ||
        item.key.replace(/_/g, ' '),
      href: ROUTE_MAP[item.key] ?? null,
    }));
  }, [q.data, copy.nav?.items, page, t, dashboardMeta]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">
            {dashboardMeta?.title || page?.title || t('admin.dashboard.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {page?.subtitle || t('admin.dashboard.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => q.refetch()}
          disabled={q.isFetching}
        >
          <RefreshCcw className={`mr-2 size-4${q.isFetching ? ' animate-spin' : ''}`} />
          {copy.common?.actions?.refresh || t('admin.common.refresh')}
        </Button>
      </div>

      {/* Loading skeleton */}
      {q.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="gap-2 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary cards */}
      {!q.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const card = (
              <Card className={item.href ? 'transition-colors hover:border-primary/50' : ''}>
                <CardHeader className="gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tabular-nums">{item.count}</div>
                </CardContent>
              </Card>
            );

            return item.href ? (
              <Link key={item.key} href={item.href} prefetch={false}>
                {card}
              </Link>
            ) : (
              <div key={item.key}>{card}</div>
            );
          })}

          {items.length === 0 && !q.isFetching && (
            <Card className="sm:col-span-2 xl:col-span-4">
              <CardContent className="py-6 text-sm text-muted-foreground">
                {copy.common?.states?.empty || t('admin.common.noData')}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
