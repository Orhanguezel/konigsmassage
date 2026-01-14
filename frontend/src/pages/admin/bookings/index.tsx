// =============================================================
// FILE: src/pages/admin/bookings/index.tsx
// konigsmassage – Admin Bookings List
// Route: /admin/bookings
// FINAL — TR UI + filter key fix (is_read)
// =============================================================

import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import type { BookingListQueryParams, BookingMergedDto } from '@/integrations/types';
import { useListBookingsAdminQuery } from '@/integrations/rtk/hooks';

import { BookingsHeader, type BookingsFilters } from '@/components/admin/bookings/BookingsHeader';
import { BookingsList } from '@/components/admin/bookings/BookingsList';

const AdminBookingsIndex: NextPage = () => {
  const router = useRouter();

  const [filters, setFilters] = useState<BookingsFilters>({
    q: '',
    status: 'all',
    is_read: 'all',
    appointment_date: '',
    resource_id: '',
    service_id: '',
  });

  const queryParams: BookingListQueryParams = useMemo(() => {
    const q = filters.q?.trim() || undefined;
    const status = filters.status === 'all' ? undefined : filters.status;

    const is_read =
      filters.is_read === 'all' ? undefined : filters.is_read === 'read' ? true : false;

    const appointment_date = filters.appointment_date?.trim() || undefined;
    const resource_id = filters.resource_id?.trim() || undefined;
    const service_id = filters.service_id?.trim() || undefined;

    return {
      q,
      status,
      is_read,
      appointment_date,
      resource_id,
      service_id,
      limit: 200,
      offset: 0,
    } as any;
  }, [filters]);

  const { data, isLoading, isFetching, refetch } = useListBookingsAdminQuery(
    queryParams as any,
    {
      refetchOnMountOrArgChange: true,
    } as any,
  );

  const items: BookingMergedDto[] = useMemo(() => (data as any) ?? [], [data]);
  const total = items.length;
  const busy = isLoading || isFetching;

  return (
    <div className="container-fluid py-3">
      <div className="mb-3 d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div style={{ minWidth: 0 }}>
          <h4 className="h5 mb-1">Randevular</h4>
          <p className="text-muted small mb-0">Randevu taleplerini listele ve yönet.</p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => void router.push('/admin/bookings/new')}
        >
          Yeni Randevu
        </button>
      </div>

      <BookingsHeader
        filters={filters}
        total={total}
        loading={busy}
        onFiltersChange={setFilters}
        onRefresh={() => void refetch()}
      />

      <BookingsList items={items} loading={busy} />
    </div>
  );
};

export default AdminBookingsIndex;
