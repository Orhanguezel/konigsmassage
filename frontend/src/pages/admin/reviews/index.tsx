// =============================================================
// FILE: src/pages/admin/reviews/index.tsx
// konigsmassage – Admin Reviews Liste Sayfası
// - Dynamic locales: useAdminLocales()
// =============================================================

import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  ReviewsHeader,
  type ReviewFilters,
  type LocaleOption,
} from '@/components/admin/reviews/ReviewsHeader';
import { ReviewsList } from '@/components/admin/reviews/ReviewsList';

import { useListReviewsAdminQuery, useDeleteReviewAdminMutation } from '@/integrations/rtk/hooks';
import type { AdminReviewDto } from '@/integrations/types';

import { useAdminLocales } from '@/components/common/useAdminLocales';

const AdminReviewsIndexPage: NextPage = () => {
  const router = useRouter();

  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
  } = useAdminLocales();

  const locales: LocaleOption[] = useMemo(() => {
    return (adminLocaleOptions ?? [])
      .map((o) => ({
        value: String(o.value || '').toLowerCase(),
        label: o.label,
      }))
      .filter((o) => !!o.value);
  }, [adminLocaleOptions]);

  const [filters, setFilters] = useState<ReviewFilters>({
    search: '',
    locale: '',
    approval: 'all',
    active: 'all',
  });

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      search: filters.search || undefined,
      locale: filters.locale || undefined,
      limit: 50,
      offset: 0,
      orderBy: 'display_order',
      order: 'asc',
    };

    if (filters.approval === 'approved') params.approved = 1;
    else if (filters.approval === 'pending') params.approved = 0;

    if (filters.active === 'active') params.active = 1;
    else if (filters.active === 'inactive') params.active = 0;

    return params;
  }, [filters]);

  const { data, isLoading, isFetching, refetch } = useListReviewsAdminQuery(queryParams);

  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewAdminMutation();

  const loading = isLoading || isFetching;
  const busy = loading || isDeleting;

  const items: AdminReviewDto[] = data?.items ?? [];
  const total = data?.total ?? items.length;

  const handleDelete = async (r: AdminReviewDto) => {
    try {
      await deleteReview({ id: r.id }).unwrap();
      toast.success('Yorum başarıyla silindi.');
      await refetch();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Yorum silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleCreateClick = () => {
    router.push('/admin/reviews/new');
  };

  return (
    <div className="container-fluid py-3">
      <ReviewsHeader
        filters={filters}
        total={total}
        loading={busy}
        locales={locales}
        localesLoading={localesLoading}
        defaultLocale={defaultLocaleFromDb}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        onCreateClick={handleCreateClick}
      />

      <ReviewsList items={items} loading={busy} onDelete={handleDelete} />
    </div>
  );
};

export default AdminReviewsIndexPage;
