'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/resume/admin-resume-client.tsx
// FINAL — Admin Resume List
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { RefreshCcw, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { ResumeMerged, ResumeType } from '@/integrations/shared';
import { useListResumeAdminQuery } from '@/integrations/hooks';

type Filters = {
  locale: string;
  q: string;
  type: 'all' | ResumeType;
  active: 'all' | 'yes' | 'no';
  orderDir: 'asc' | 'desc';
};

export default function AdminResumeClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.resume ?? {};
  const common = copy.common;

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  const [filters, setFilters] = React.useState<Filters>({
    locale: '',
    q: '',
    type: 'all',
    active: 'all',
    orderDir: 'desc',
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
      search: filters.q.trim() || undefined,
      type: filters.type === 'all' ? undefined : (filters.type as ResumeType),
      active: filters.active === 'all' ? undefined : filters.active === 'yes',
      orderBy: 'start_date' as const,
      order: filters.orderDir,
      limit: 200,
      offset: 0,
    }),
    [filters],
  );

  const listQ = useListResumeAdminQuery(params, { refetchOnMountOrArgChange: true });
  const rows = (listQ.data ?? []) as ResumeMerged[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{page?.title}</h1>
          <p className="text-sm text-muted-foreground">{page?.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => listQ.refetch()} disabled={listQ.isFetching}>
            <RefreshCcw className="mr-2 size-4" />
            {common?.actions?.refresh}
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/resume/new">
              <Plus className="mr-2 size-4" />
              {common?.actions?.create}
            </Link>
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
            <Label>{common?.actions?.search}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                placeholder={page?.search_ph}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{page?.type_label}</Label>
            <Select
              value={filters.type}
              onValueChange={(v) => setFilters((p) => ({ ...p, type: v as Filters['type'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{page?.filter_all}</SelectItem>
                <SelectItem value="education">{page?.type_education}</SelectItem>
                <SelectItem value="experience">{page?.type_experience}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{page?.active_label}</Label>
            <Select
              value={filters.active}
              onValueChange={(v) => setFilters((p) => ({ ...p, active: v as Filters['active'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{page?.filter_all}</SelectItem>
                <SelectItem value="yes">{page?.filter_yes}</SelectItem>
                <SelectItem value="no">{page?.filter_no}</SelectItem>
              </SelectContent>
            </Select>
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
                <TableHead>{page?.col_title}</TableHead>
                <TableHead>{page?.col_type}</TableHead>
                <TableHead>{page?.col_dates}</TableHead>
                <TableHead>{page?.col_active}</TableHead>
                <TableHead className="text-right">{page?.col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !listQ.isFetching && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    {common?.states?.empty}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    {item.start_date} → {item.is_current ? page?.present_label : item.end_date || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? 'secondary' : 'outline'}>
                      {item.is_active ? page?.filter_yes : page?.filter_no}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/resume/${encodeURIComponent(item.id)}`}>
                        {common?.actions?.edit}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
