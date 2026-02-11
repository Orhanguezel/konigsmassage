'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/projects/admin-projects-client.tsx
// FINAL — Admin Projects List
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

import type { Project } from '@/integrations/shared';
import { useListProjectsAdminQuery } from '@/integrations/hooks';

type Filters = {
  locale: string;
  q: string;
  is_published: 'all' | 'yes' | 'no';
  is_featured: 'all' | 'yes' | 'no';
  orderDir: 'asc' | 'desc';
};

export default function AdminProjectsClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.projects ?? {};
  const common = copy.common;

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  const [filters, setFilters] = React.useState<Filters>({
    locale: '',
    q: '',
    is_published: 'all',
    is_featured: 'all',
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
      q: filters.q.trim() || undefined,
      is_published:
        filters.is_published === 'all' ? undefined : filters.is_published === 'yes',
      is_featured: filters.is_featured === 'all' ? undefined : filters.is_featured === 'yes',
      orderBy: 'created_at' as const,
      orderDir: filters.orderDir,
      limit: 200,
      offset: 0,
    }),
    [filters],
  );

  const listQ = useListProjectsAdminQuery(params, { refetchOnMountOrArgChange: true });
  const rows = (listQ.data ?? []) as Project[];

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
            <Link href="/admin/projects/new">
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
            <Label>{page?.published_label}</Label>
            <Select
              value={filters.is_published}
              onValueChange={(v) => setFilters((p) => ({ ...p, is_published: v as Filters['is_published'] }))}
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

          <div className="space-y-2">
            <Label>{page?.featured_label}</Label>
            <Select
              value={filters.is_featured}
              onValueChange={(v) => setFilters((p) => ({ ...p, is_featured: v as Filters['is_featured'] }))}
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
                <TableHead>{page?.col_locale}</TableHead>
                <TableHead>{page?.col_published}</TableHead>
                <TableHead>{page?.col_featured}</TableHead>
                <TableHead>{page?.col_order}</TableHead>
                <TableHead className="text-right">{page?.col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !listQ.isFetching && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    {common?.states?.empty}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.locale}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_published ? 'secondary' : 'outline'}>
                      {item.is_published ? page?.filter_yes : page?.filter_no}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_featured ? 'secondary' : 'outline'}>
                      {item.is_featured ? page?.filter_yes : page?.filter_no}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.display_order}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/projects/${encodeURIComponent(item.id)}`}>
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
