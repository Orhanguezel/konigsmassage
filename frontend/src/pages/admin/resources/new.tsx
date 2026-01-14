// =============================================================
// FILE: src/pages/admin/resources/new.tsx
// konigsmassage – Admin Resource Create
// Route: /admin/resources/new
// FINAL — TR UI + NO external_ref_id
// =============================================================

import React from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type { ResourceAdminCreatePayload } from '@/integrations/types/resources.types';
import { useCreateResourceAdminMutation } from '@/integrations/rtk/hooks';

import { ResourceForm, type ResourceFormValues } from '@/components/admin/resources/ResourceForm';

const AdminResourceNewPage: NextPage = () => {
  const router = useRouter();

  const [createResource, { isLoading: isCreating }] = useCreateResourceAdminMutation();

  const handleCancel = () => {
    void router.push('/admin/resources');
  };

  const handleSubmit = async (values: ResourceFormValues) => {
    try {
      const payload: ResourceAdminCreatePayload = {
        title: values.title.trim(),
        type: values.type,
        is_active: values.is_active ? 1 : 0,
      };

      if (!payload.title) {
        toast.error('Ad zorunlu.');
        return;
      }

      const created = await createResource(payload as any).unwrap();
      toast.success('Kaynak oluşturuldu.');

      const id = created?.id ? String(created.id) : '';
      if (!id) {
        toast.error("Oluşturuldu ama id dönmedi. Backend response'u kontrol et.");
        void router.push('/admin/resources');
        return;
      }

      void router.replace(`/admin/resources/${encodeURIComponent(id)}`);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Kaydedilemedi.');
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <h4 className="h5 mb-1">Yeni Kaynak</h4>
        <p className="text-muted small mb-0">Yeni bir kaynak oluştur.</p>
      </div>

      <ResourceForm
        mode="create"
        loading={false}
        saving={isCreating}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminResourceNewPage;
