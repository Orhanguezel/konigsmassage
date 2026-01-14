// =============================================================
// FILE: src/pages/admin/bookings/[id].tsx
// konigsmassage – Admin Booking Detail/Edit/Create
// Route: /admin/bookings/:id  OR  /admin/bookings/new
// FINAL — TR UI + hide ID on screen
// =============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type {
  BookingAdminCreatePayload,
  BookingAdminUpdatePayload,
  BookingMergedDto,
} from '@/integrations/types';

import {
  useGetBookingAdminQuery,
  useCreateBookingAdminMutation,
  useUpdateBookingAdminMutation,
  useDeleteBookingAdminMutation,
  useMarkBookingReadAdminMutation,
} from '@/integrations/rtk/hooks';

import { BookingForm, type BookingFormValues } from '@/components/admin/bookings/BookingForm';

const pickId = (v: string | string[] | undefined): string | undefined => {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return String(v[0] || '').trim() || undefined;
  return undefined;
};

const isUuidLike = (v?: string) => {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
};

const statusLabelTr = (s?: string) => {
  const x = String(s || '').toLowerCase();
  if (x === 'new') return 'Yeni';
  if (x === 'confirmed') return 'Onaylandı';
  if (x === 'rejected') return 'Reddedildi';
  if (x === 'completed') return 'Tamamlandı';
  if (x === 'cancelled') return 'İptal';
  if (x === 'expired') return 'Süresi Doldu';
  return s ? String(s) : '-';
};

const AdminBookingDetailPage: NextPage = () => {
  const router = useRouter();
  const isRouterReady = router.isReady;

  const routeId = useMemo(
    () => (isRouterReady ? pickId(router.query.id as any) : undefined),
    [isRouterReady, router.query.id],
  );

  const isNewRoute = routeId === 'new';
  const validId = !!routeId && isUuidLike(routeId);

  const shouldSkip = !isRouterReady || isNewRoute || !validId;

  const { data, isLoading, isFetching, error, refetch } = useGetBookingAdminQuery(
    { id: routeId as string } as any,
    { skip: shouldSkip, refetchOnMountOrArgChange: true } as any,
  );

  // refetch sırasında UI boşalmasın diye local cache (edit)
  const [localItem, setLocalItem] = useState<BookingMergedDto | null>(null);
  useEffect(() => {
    if (data) setLocalItem(data as any);
  }, [data]);

  const [createBooking, { isLoading: isCreating }] = useCreateBookingAdminMutation();
  const [updateBooking, { isLoading: isUpdating }] = useUpdateBookingAdminMutation();
  const [deleteBooking, { isLoading: isDeleting }] = useDeleteBookingAdminMutation();
  const [markRead, { isLoading: isMarkingRead }] = useMarkBookingReadAdminMutation();

  const loading = isLoading || isFetching;
  const saving = isCreating || isUpdating;
  const busy = loading || saving || isDeleting || isMarkingRead;

  const reqSeq = useRef(0);

  const handleCancel = () => {
    void router.push('/admin/bookings');
  };

  const handleSubmitCreate = async (values: BookingFormValues) => {
    const mySeq = ++reqSeq.current;

    try {
      const body: BookingAdminCreatePayload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        locale: values.locale,

        customer_message: values.customer_message ? values.customer_message : undefined,

        resource_id: values.resource_id,
        service_id: values.service_id ? values.service_id : undefined,

        appointment_date: values.appointment_date,
        appointment_time: values.appointment_time,

        status: values.status as any,
        is_read: values.is_read as any,

        admin_note: values.admin_note ? values.admin_note : undefined,
      } as any;

      const created = await createBooking(body as any).unwrap();
      if (mySeq !== reqSeq.current) return;

      const newId = String((created as any)?.id || '').trim();
      toast.success('Randevu oluşturuldu.');
      if (newId) {
        void router.replace(`/admin/bookings/${encodeURIComponent(newId)}`);
      } else {
        void router.push('/admin/bookings');
      }
    } catch (err: any) {
      if (mySeq !== reqSeq.current) return;
      toast.error(err?.data?.error?.message || err?.message || 'Oluşturma sırasında hata oluştu.');
    }
  };

  const handleSubmitEdit = async (values: BookingFormValues) => {
    if (!routeId || isNewRoute) return;

    const mySeq = ++reqSeq.current;

    try {
      const patch: BookingAdminUpdatePayload = {
        name: values.name,
        email: values.email,
        phone: values.phone,

        locale: values.locale,

        customer_message: values.customer_message ? values.customer_message : null,

        service_id: values.service_id ? values.service_id : null,
        resource_id: values.resource_id ? values.resource_id : null,

        appointment_date: values.appointment_date,
        appointment_time: values.appointment_time || null,

        status: values.status as any,
        is_read: values.is_read as any,

        admin_note: values.admin_note ? values.admin_note : null,
        decision_note: values.decision_note ? values.decision_note : null,
      } as any;

      const updated = await updateBooking({ id: routeId, patch } as any).unwrap();
      if (mySeq !== reqSeq.current) return;

      setLocalItem(updated as any);
      toast.success('Randevu güncellendi.');
      await refetch();
    } catch (err: any) {
      if (mySeq !== reqSeq.current) return;
      toast.error(err?.data?.error?.message || err?.message || 'Kaydetme sırasında hata oluştu.');
    }
  };

  const handleDelete = async () => {
    if (!routeId || isNewRoute) return;

    const ok = window.confirm('Bu randevu kaydı silinecek.\n\nDevam edilsin mi?');
    if (!ok) return;

    try {
      await deleteBooking(routeId).unwrap();
      toast.success('Randevu silindi.');
      void router.push('/admin/bookings');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silme sırasında hata oluştu.');
    }
  };

  const handleMarkRead = async () => {
    if (!routeId || isNewRoute) return;

    try {
      const next = await markRead(routeId).unwrap();
      setLocalItem(next as any);
      toast.success('Okundu olarak işaretlendi.');
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'İşlem sırasında hata oluştu.');
    }
  };

  if (!isRouterReady) {
    return (
      <div className="container-fluid py-3">
        <div className="text-muted small">Yükleniyor...</div>
      </div>
    );
  }

  // CREATE route
  if (isNewRoute) {
    return (
      <div className="container-fluid py-3">
        <div className="mb-3 d-flex align-items-start justify-content-between gap-2 flex-wrap">
          <div style={{ minWidth: 0 }}>
            <h4 className="h5 mb-1">Yeni Randevu</h4>
            <p className="text-muted small mb-0">Yeni bir booking kaydı oluştur.</p>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleCancel}
            disabled={busy}
          >
            Listeye dön
          </button>
        </div>

        <BookingForm
          mode="create"
          initialData={null}
          loading={false}
          saving={saving}
          onSubmit={handleSubmitCreate}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // invalid id
  if (routeId && !validId) {
    return (
      <div className="container-fluid py-3">
        <h4 className="h5 mb-2">Geçersiz ID</h4>
        <p className="text-muted small mb-3">URL paramı UUID formatında değil.</p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
          Listeye dön
        </button>
      </div>
    );
  }

  // not found
  if (!shouldSkip && !loading && !localItem && error) {
    return (
      <div className="container-fluid py-3">
        <h4 className="h5 mb-2">Kayıt bulunamadı</h4>
        <p className="text-muted small mb-3">Bu kayıt için veri gelmedi.</p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
          Listeye dön
        </button>
      </div>
    );
  }

  const isRead =
    Number((localItem as any)?.is_read ?? 0) === 1 || (localItem as any)?.is_read === true;

  return (
    <div className="container-fluid py-3">
      <div className="mb-3 d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div style={{ minWidth: 0 }}>
          <h4 className="h5 mb-1">Randevu</h4>
          <p className="text-muted small mb-0">Randevu detaylarını ve durumunu yönet.</p>

          {localItem?.status ? (
            <div className="text-muted small mt-1">
              Durum: <span className="fw-semibold">{statusLabelTr(String(localItem.status))}</span>
            </div>
          ) : null}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleMarkRead}
            disabled={busy || isRead}
            title={isRead ? 'Zaten okundu' : 'Okundu olarak işaretle'}
          >
            Okundu İşaretle
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={handleDelete}
            disabled={busy}
          >
            Sil
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleCancel}
            disabled={busy}
          >
            Listeye dön
          </button>
        </div>
      </div>

      <BookingForm
        mode="edit"
        initialData={localItem}
        loading={loading}
        saving={saving}
        onSubmit={handleSubmitEdit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminBookingDetailPage;
