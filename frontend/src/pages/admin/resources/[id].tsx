// =============================================================
// FILE: src/pages/admin/resources/[id].tsx
// konigsmassage – Admin Resource Detail (Edit)
// Route: /admin/resources/:id
// FINAL — TR UI + hide ID + NO external_ref_id
// =============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type {
  ResourceAdminUpdatePayload,
  ResourceRowDto,
} from '@/integrations/types/resources.types';
import { useGetResourceAdminQuery, useUpdateResourceAdminMutation } from '@/integrations/rtk/hooks';

import { ResourceForm, type ResourceFormValues } from '@/components/admin/resources/ResourceForm';

const pickId = (v: string | string[] | undefined): string | undefined => {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return String(v[0] || '').trim() || undefined;
  return undefined;
};

const isUuidLike = (v?: string) => {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
};

const AdminResourceDetailPage: NextPage = () => {
  const router = useRouter();
  const isRouterReady = router.isReady;

  const routeId = useMemo(
    () => (isRouterReady ? pickId(router.query.id as any) : undefined),
    [isRouterReady, router.query.id],
  );

  const validId = !!routeId && isUuidLike(routeId);
  const shouldSkip = !isRouterReady || !validId;

  const { data, isLoading, isFetching, error, refetch } = useGetResourceAdminQuery(
    routeId as any,
    {
      skip: shouldSkip,
      refetchOnMountOrArgChange: true,
    } as any,
  );

  const [item, setItem] = useState<ResourceRowDto | null>(null);
  useEffect(() => {
    if (data) setItem(data as any);
  }, [data]);

  const [updateResource, { isLoading: isUpdating }] = useUpdateResourceAdminMutation();
  const saving = isUpdating;
  const loading = isLoading || isFetching;

  const reqSeq = useRef(0);

  const handleCancel = () => {
    void router.push('/admin/resources');
  };

  const handleSubmit = async (values: ResourceFormValues) => {
    if (!routeId) return;
    const mySeq = ++reqSeq.current;

    try {
      const patch: ResourceAdminUpdatePayload = {
        title: values.title.trim() || null,
        type: values.type,
        is_active: values.is_active ? 1 : 0,
      };

      const updated = await updateResource({ id: routeId, patch } as any).unwrap();
      if (mySeq !== reqSeq.current) return;

      toast.success('Kaynak güncellendi.');
      if (updated) setItem(updated as any);

      await refetch();
    } catch (err: any) {
      if (mySeq !== reqSeq.current) return;
      toast.error(err?.data?.error?.message || err?.message || 'Güncellenemedi.');
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

  if (!shouldSkip && !loading && !item && error) {
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

  const pageTitle = item?.title ? `Kaynak: ${item.title}` : 'Kaynak Düzenle';

  return (
    <div className="container-fluid py-3">
      <div className="mb-3 d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div style={{ minWidth: 0 }}>
          <h4 className="h5 mb-1">{pageTitle}</h4>
          <p className="text-muted small mb-0">Kaynak bilgilerini güncelle.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
            Listeye dön
          </button>
        </div>
      </div>

      <ResourceForm
        mode="edit"
        initialData={item}
        loading={loading}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminResourceDetailPage;
