// =============================================================
// FILE: src/pages/admin/bookings/new.tsx
// konigsmassage – Admin Booking Create
// Route: /admin/bookings/new
// FINAL — TR UI
// =============================================================

import React from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type { BookingAdminCreatePayload, BookingMergedDto } from '@/integrations/types';
import { useCreateBookingAdminMutation } from '@/integrations/rtk/hooks';

import { BookingForm, type BookingFormValues } from '@/components/admin/bookings/BookingForm';

const AdminBookingCreatePage: NextPage = () => {
  const router = useRouter();

  const [createBooking, { isLoading: isCreating }] = useCreateBookingAdminMutation();

  const handleCancel = () => {
    void router.push('/admin/bookings');
  };

  const handleSubmit = async (values: BookingFormValues) => {
    try {
      const payload: BookingAdminCreatePayload = {
        locale: values.locale,

        name: values.name,
        email: values.email,
        phone: values.phone,

        appointment_date: values.appointment_date,
        appointment_time: values.appointment_time,

        resource_id: values.resource_id,
        service_id: values.service_id ? values.service_id : undefined,

        customer_message: values.customer_message ? values.customer_message : undefined,

        status: values.status,
        is_read: values.is_read,
        admin_note: values.admin_note ? values.admin_note : undefined,
      };

      const created = (await createBooking(payload as any).unwrap()) as any;
      const id = String((created as BookingMergedDto)?.id || (created as any)?.id || '').trim();

      toast.success('Randevu oluşturuldu.');
      if (id) {
        void router.replace(`/admin/bookings/${encodeURIComponent(id)}`);
      } else {
        void router.push('/admin/bookings');
      }
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Oluşturma sırasında hata oluştu.');
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <h4 className="h5 mb-1">Yeni Randevu</h4>
        <p className="text-muted small mb-0">Yeni bir randevu kaydı oluştur.</p>
      </div>

      <BookingForm
        mode="create"
        loading={false}
        saving={isCreating}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminBookingCreatePage;
