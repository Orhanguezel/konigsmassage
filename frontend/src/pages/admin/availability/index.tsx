// =============================================================
// FILE: src/pages/admin/availability/index.tsx
// konigsmassage – Admin Availability (Resources) List
// Route: /admin/availability
// FINAL — Turkish UI headings (clean: no redundant local rows state)
// =============================================================

import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import { useListResourcesAdminQuery } from '@/integrations/rtk/hooks';
import type { ResourceAdminListItemDto, ResourcesAdminListQueryParams } from '@/integrations/types';

import {
  AvailabilityHeader,
  type AvailabilityFilters,
} from '@/components/admin/availability/AvailabilityHeader';
import { AvailabilityList } from '@/components/admin/availability/AvailabilityList';

const AdminAvailabilityIndex: NextPage = () => {
  const router = useRouter();

  const [filters, setFilters] = useState<AvailabilityFilters>({
    q: '',
    type: '',
    status: 'all',
  });

  const queryParams: ResourcesAdminListQueryParams = useMemo(() => {
    const is_active = filters.status === 'all' ? undefined : filters.status === 'active' ? 1 : 0;

    return {
      q: filters.q?.trim() || undefined,
      type: (filters.type || undefined) as any,
      is_active,
      limit: 500,
      offset: 0,
      sort: 'updated_at',
      order: 'desc',
    };
  }, [filters]);

  const { data, isLoading, isFetching, refetch } = useListResourcesAdminQuery(
    queryParams as any,
    {
      refetchOnMountOrArgChange: true,
    } as any,
  );

  const items: ResourceAdminListItemDto[] = useMemo(() => (data as any) ?? [], [data]);

  const loading = isLoading || isFetching;

  const handleCreate = () => {
    void router.push('/admin/availability/new');
  };

  return (
    <div className="container-fluid py-3">
      <div className="mb-3 d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div style={{ minWidth: 0 }}>
          <h4 className="h5 mb-1">Müsaitlik Yönetimi</h4>
          <p className="text-muted small mb-0">Kaynak kayıtlarını ve çalışma saatlerini yönet.</p>
        </div>

        <button type="button" className="btn btn-sm btn-primary" onClick={handleCreate}>
          Yeni Kaynak
        </button>
      </div>

      <AvailabilityHeader
        filters={filters}
        total={items.length}
        loading={loading}
        onFiltersChange={setFilters}
        onRefresh={refetch}
      />

      <AvailabilityList items={items} loading={loading} />
    </div>
  );
};

export default AdminAvailabilityIndex;
