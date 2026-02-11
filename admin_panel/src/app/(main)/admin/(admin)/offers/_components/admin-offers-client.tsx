'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/offers/admin-offers-client.tsx
// FINAL — Admin Offers List
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { RefreshCcw, Search, Plus } from 'lucide-react';

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

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { OfferStatus, OfferView } from '@/integrations/shared';
import { useListOffersAdminQuery } from '@/integrations/hooks';

type Filters = {
  q: string;
  status: 'all' | OfferStatus;
  email: string;
  orderDir: 'asc' | 'desc';
};

export default function AdminOffersClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.offers ?? {};
  const common = copy.common;

  const [filters, setFilters] = React.useState<Filters>({
    q: '',
    status: 'all',
    email: '',
    orderDir: 'desc',
  });

  const params = React.useMemo(
    () => ({
      q: filters.q.trim() || undefined,
      status: filters.status === 'all' ? undefined : (filters.status as OfferStatus),
      email: filters.email.trim() || undefined,
      orderDir: filters.orderDir,
      sort: 'created_at' as const,
      limit: 200,
      offset: 0,
    }),
    [filters],
  );

  const listQ = useListOffersAdminQuery(params, { refetchOnMountOrArgChange: true });
  const rows = (listQ.data ?? []) as OfferView[];

  const busy = listQ.isFetching;

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
          <Button size="sm" asChild>
            <Link href="/admin/offers/new">
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
            <Label>{page?.status_label}</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((p) => ({ ...p, status: v as Filters['status'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{page?.status_all}</SelectItem>
                <SelectItem value="new">{page?.status_new}</SelectItem>
                <SelectItem value="in_review">{page?.status_in_review}</SelectItem>
                <SelectItem value="quoted">{page?.status_quoted}</SelectItem>
                <SelectItem value="sent">{page?.status_sent}</SelectItem>
                <SelectItem value="accepted">{page?.status_accepted}</SelectItem>
                <SelectItem value="rejected">{page?.status_rejected}</SelectItem>
                <SelectItem value="cancelled">{page?.status_cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{page?.email_label}</Label>
            <Input
              value={filters.email}
              onChange={(e) => setFilters((p) => ({ ...p, email: e.target.value }))}
              placeholder={page?.email_ph}
            />
          </div>

          <div className="space-y-2">
            <Label>{page?.order_label}</Label>
            <Select
              value={filters.orderDir}
              onValueChange={(v) => setFilters((p) => ({ ...p, orderDir: v as Filters['orderDir'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{page?.order_desc}</SelectItem>
                <SelectItem value="asc">{page?.order_asc}</SelectItem>
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
                <TableHead>{page?.col_offer_no}</TableHead>
                <TableHead>{page?.col_status}</TableHead>
                <TableHead>{page?.col_customer}</TableHead>
                <TableHead>{page?.col_email}</TableHead>
                <TableHead>{page?.col_total}</TableHead>
                <TableHead>{page?.col_created}</TableHead>
                <TableHead className="text-right">{page?.col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !busy && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    {common?.states?.empty}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.offer_no || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.status}</Badge>
                  </TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.gross_total ?? '-'}</TableCell>
                  <TableCell>{item.created_at?.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/offers/${encodeURIComponent(item.id)}`}>
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
