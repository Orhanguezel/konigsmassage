'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/availability/admin-availability-client.tsx
// guezelwebdesign — Admin Availability Client (Resources)
// FINAL — shadcn/ui + RTK resources admin endpoints
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';

import { AvailabilityHeader, type AvailabilityFilters } from './AvailabilityHeader';
import { AvailabilityList } from './AvailabilityList';

import type { ResourcesAdminListQueryParams } from '@/integrations/shared';
import { useListResourcesAdminQuery } from '@/integrations/hooks';

const DEFAULT_FILTERS: AvailabilityFilters = {
  q: '',
  type: '',
  status: 'all',
};

function getErrMessage(err: unknown): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m1b = anyErr?.data?.error;
  if (typeof m1b === 'string' && m1b.trim()) return m1b;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return 'İşlem başarısız. Lütfen tekrar deneyin.';
}

function parseSearch(input: string): { q?: string; external_ref_id?: string } {
  const raw = String(input ?? '').trim();
  if (!raw) return {};
  const low = raw.toLowerCase();
  if (low.startsWith('ref:') || low.startsWith('ref=')) {
    const v = raw.slice(4).trim();
    return v ? { external_ref_id: v } : {};
  }
  return { q: raw };
}

export default function AdminAvailabilityClient() {
  const [filters, setFilters] = React.useState<AvailabilityFilters>(DEFAULT_FILTERS);

  const queryArgs: ResourcesAdminListQueryParams = React.useMemo(() => {
    const search = parseSearch(filters.q);

    return {
      q: search.q,
      external_ref_id: search.external_ref_id,
      type: filters.type || undefined,
      is_active:
        filters.status === 'all' ? undefined : filters.status === 'active' ? true : false,
      limit: 200,
      offset: 0,
      sort: 'updated_at',
      order: 'desc',
    } as ResourcesAdminListQueryParams;
  }, [filters]);

  const listQ = useListResourcesAdminQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
  } as any);

  const loading = listQ.isLoading || listQ.isFetching;
  const total = (listQ.data ?? []).length;

  React.useEffect(() => {
    if (listQ.isError) toast.error(getErrMessage(listQ.error));
  }, [listQ.isError, listQ.error]);

  return (
    <div className="space-y-6">
      <AvailabilityHeader
        filters={filters}
        total={total}
        loading={loading}
        onFiltersChange={setFilters}
        onRefresh={() => listQ.refetch()}
      />

      <AvailabilityList items={listQ.data as any} loading={loading} />
    </div>
  );
}
