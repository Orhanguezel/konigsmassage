'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/pricing/admin-pricing-client.tsx
// FINAL — Admin Pricing Plans List
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { RefreshCcw, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { PricingPlanAdmin } from '@/integrations/shared';
import { useListPricingPlansAdminQuery } from '@/integrations/hooks';

export default function AdminPricingClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.pricing ?? {};
  const common = copy.common;

  const listQ = useListPricingPlansAdminQuery({ limit: 200, offset: 0 }, { refetchOnMountOrArgChange: true });
  const rows = React.useMemo(() => {
    const items = (listQ.data ?? []) as PricingPlanAdmin[];
    return [...items].sort((a, b) => {
      const d = (a.display_order ?? 0) - (b.display_order ?? 0);
      if (d !== 0) return d;
      return String(a.code || '').localeCompare(String(b.code || ''));
    });
  }, [listQ.data]);

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
            <Link href="/admin/pricing/new">
              <Plus className="mr-2 size-4" />
              {common?.actions?.create}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{page?.list_title}</CardTitle>
          <CardDescription>{page?.list_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{page?.col_code}</TableHead>
                <TableHead>{page?.col_currency}</TableHead>
                <TableHead>{page?.col_price}</TableHead>
                <TableHead>{page?.col_active}</TableHead>
                <TableHead>{page?.col_featured}</TableHead>
                <TableHead>{page?.col_order}</TableHead>
                <TableHead className="text-right">{page?.col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !listQ.isFetching && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    {common?.states?.empty}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.code}</TableCell>
                  <TableCell>{plan.currency}</TableCell>
                  <TableCell>
                    {plan.price_amount} / {plan.price_unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? 'secondary' : 'outline'}>
                      {plan.is_active ? page?.active_yes : page?.active_no}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_featured ? 'secondary' : 'outline'}>
                      {plan.is_featured ? page?.featured_yes : page?.featured_no}
                    </Badge>
                  </TableCell>
                  <TableCell>{plan.display_order}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/pricing/${encodeURIComponent(plan.id)}`}>
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
