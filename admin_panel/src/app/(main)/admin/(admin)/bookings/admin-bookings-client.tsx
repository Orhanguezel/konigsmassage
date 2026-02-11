'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/bookings/admin-bookings-client.tsx
// FINAL — Admin Bookings
// =============================================================

import * as React from 'react';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useListBookingsAdminQuery } from '@/integrations/hooks';

import { BookingsHeader, type BookingsFilters } from './BookingsHeader';
import { BookingsList } from './BookingsList';

export default function AdminBookingsClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.bookings ?? {};

  const [filters, setFilters] = React.useState<BookingsFilters>({
    q: '',
    status: 'all',
    is_read: 'all',
    appointment_date: '',
    resource_id: '',
    service_id: '',
  });

  const params = React.useMemo(
    () => ({
      q: filters.q || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      is_read: filters.is_read === 'all' ? undefined : (filters.is_read === 'read' ? true : false),
      appointment_date: filters.appointment_date || undefined,
      resource_id: filters.resource_id || undefined,
      service_id: filters.service_id || undefined,
      limit: 200,
    }),
    [filters],
  );

  const { data: bookings = [], isLoading, refetch } = useListBookingsAdminQuery(params);

  return (
    <div className="space-y-6">
      <BookingsHeader
        filters={filters}
        total={bookings.length}
        loading={isLoading}
        onFiltersChange={setFilters}
        onRefresh={refetch}
      />

      <BookingsList items={bookings} loading={isLoading} />
    </div>
  );
}
