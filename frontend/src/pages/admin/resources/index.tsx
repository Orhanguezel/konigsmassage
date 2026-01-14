// =============================================================
// FILE: src/pages/admin/resources/index.tsx
// konigsmassage – Admin Resources List
// Route: /admin/resources
// FINAL — TR UI + no redundant local state
// =============================================================

import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import type { ResourceAdminListItemDto, ResourcesAdminListQueryParams } from '@/integrations/types';
import { useListResourcesAdminQuery } from '@/integrations/rtk/hooks';

import {
  ResourcesHeader,
  type ResourcesFilters,
} from '@/components/admin/resources/ResourcesHeader';
import { ResourcesList } from '@/components/admin/resources/ResourcesList';

const AdminResourcesIndex: NextPage = () => {
  const router = useRouter();

  const [filters, setFilters] = useState<ResourcesFilters>({
    q: '',
    type: '',
    status: 'all',
    sort: 'updated_at',
    order: 'desc',
  });

  const queryParams: ResourcesAdminListQueryParams = useMemo(() => {
    const is_active = filters.status === 'all' ? undefined : filters.status === 'active' ? 1 : 0;

    return {
      q: filters.q?.trim() || undefined,
      type: (filters.type || undefined) as any,
      is_active,
      limit: 500,
      offset: 0,
      sort: filters.sort,
      order: filters.order,
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
    void router.push('/admin/resources/new');
  };

  return (
    <div className="container-fluid py-3">
      <div className="mb-3 d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div style={{ minWidth: 0 }}>
          <h4 className="h5 mb-1">Kaynaklar</h4>
          <p className="text-muted small mb-0">Kaynak kayıtlarını yönet.</p>
        </div>

        <button type="button" className="btn btn-sm btn-primary" onClick={handleCreate}>
          Yeni Kaynak
        </button>
      </div>

      <ResourcesHeader
        filters={filters}
        total={items.length}
        loading={loading}
        onFiltersChange={setFilters}
        onRefresh={refetch}
      />

      <ResourcesList items={items} loading={loading} />
    </div>
  );
};

export default AdminResourcesIndex;
