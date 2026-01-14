// =============================================================
// FILE: src/pages/admin/availability/new.tsx
// konigsmassage – Admin Availability Create Resource
// Route: /admin/availability/new
// FINAL — Turkish UI + NO external_ref_id
// =============================================================

import React, { useMemo } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type { ResourceAdminCreatePayload, AvailabilityResourceValues } from '@/integrations/types';
import { useCreateResourceAdminMutation } from '@/integrations/rtk/hooks';

import {
  AvailabilityForm,
} from '@/components/admin/availability/AvailabilityForm';

const AdminAvailabilityNewPage: NextPage = () => {
  const router = useRouter();

  const [createResource, { isLoading: isCreating }] = useCreateResourceAdminMutation();
  const saving = isCreating;

  const handleCancel = () => {
    void router.push('/admin/availability');
  };

  const handleSubmit = async (values: AvailabilityResourceValues) => {
    try {
      const payload: ResourceAdminCreatePayload = {
        type: values.type ?? 'therapist',
        title: String(values.title || '').trim(),
        is_active: values.is_active,
      };

      if (!payload.title) {
        toast.error('Ad zorunlu.');
        return;
      }

      const created = await createResource(payload as any).unwrap();
      toast.success('Kaynak oluşturuldu.');

      const nextId = created?.id ? String(created.id) : '';
      if (!nextId) {
        toast.error("Oluşturuldu ama id dönmedi. Backend response'u kontrol et.");
        return;
      }

      void router.replace(`/admin/availability/${encodeURIComponent(nextId)}`);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Oluşturma sırasında hata oluştu.');
    }
  };

  const title = useMemo(() => 'Yeni Kaynak', []);

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <h4 className="h5 mb-1">{title}</h4>
        <p className="text-muted small mb-0">
          Önce kaynak kaydını oluştur. Sonrasında haftalık çalışma saatleri ve günlük override
          ekranı aktifleşir.
        </p>
      </div>

      <AvailabilityForm
        mode="create"
        initialData={undefined}
        loading={false}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminAvailabilityNewPage;
