// =============================================================
// FILE: src/pages/admin/availability/[id].tsx
// FINAL — Admin Availability Detail (clean page, form split)
// =============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type {
  ResourceRowDto,
  ResourceAdminUpdatePayload,
  AvailabilityResourceValues,
} from '@/integrations/types';
import { useGetResourceAdminQuery, useUpdateResourceAdminMutation } from '@/integrations/rtk/hooks';

import {
  AvailabilityForm
} from '@/components/admin/availability/AvailabilityForm';

const pickId = (v: string | string[] | undefined): string | undefined => {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return String(v[0] || '').trim() || undefined;
  return undefined;
};

const isUuidLike = (v?: string) => {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
};

const AdminAvailabilityDetailPage: NextPage = () => {
  const router = useRouter();
  const isRouterReady = router.isReady;

  const routeId = useMemo(
    () => (isRouterReady ? pickId(router.query.id as any) : undefined),
    [isRouterReady, router.query.id],
  );

  const validId = !!routeId && isUuidLike(routeId);

  const { data, isLoading, isFetching, error, refetch } = useGetResourceAdminQuery(
    routeId as any,
    {
      skip: !isRouterReady || !validId,
      refetchOnMountOrArgChange: true,
    } as any,
  );

  const resource = data as ResourceRowDto | undefined;

  const [updateResource, { isLoading: isUpdating }] = useUpdateResourceAdminMutation();

  const saving = isUpdating;
  const loading = isLoading || isFetching;

  const reqSeq = useRef(0);
  const [localResource, setLocalResource] = useState<ResourceRowDto | undefined>(undefined);

  useEffect(() => {
    if (!resource) return;
    setLocalResource(resource);
  }, [resource]);

  const handleCancel = () => {
    void router.push('/admin/availability');
  };

  const handleSubmit = async (values: AvailabilityResourceValues) => {
    if (!routeId) return;

    const mySeq = ++reqSeq.current;

    try {
      const patch: ResourceAdminUpdatePayload = {
        title: values.title.trim(),
        type: values.type || null,
        is_active: values.is_active,
      };

      const updated = await updateResource({ id: routeId, patch } as any).unwrap();
      if (mySeq !== reqSeq.current) return;

      if (updated) setLocalResource(updated as any);
      toast.success('Kaynak güncellendi.');
      await refetch();
    } catch (err: any) {
      if (mySeq !== reqSeq.current) return;
      toast.error(err?.data?.error?.message || err?.message || 'Kaydetme sırasında hata oluştu.');
    }
  };

  if (!isRouterReady) {
    return (
      <div className="container-fluid py-3">
        <div className="text-muted small">Yükleniyor...</div>
      </div>
    );
  }

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

  if (!loading && !resource && error) {
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

  return (
    <div className="container-fluid py-3">
      <div className="mb-3 d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div>
          <h4 className="h5 mb-1">Müsaitlik — Kaynak</h4>
          <p className="text-muted small mb-0">
            Haftalık çalışma saatlerini tanımla, günlük planı üret ve slot override işlemlerini
            yönet.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
            Listeye dön
          </button>
        </div>
      </div>

      <AvailabilityForm
        mode="edit"
        initialData={localResource}
        loading={loading}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminAvailabilityDetailPage;
