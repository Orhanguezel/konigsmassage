'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/availability/admin-availability-detail-client.tsx
// guezelwebdesign — Admin Availability Detail (Resource + Weekly + Daily)
// FINAL — App Router client
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import type { AvailabilityResourceValues } from '@/integrations/shared';
import { isUuidLike } from '@/integrations/shared';
import {
  useCreateResourceAdminMutation,
  useGetResourceAdminQuery,
  useUpdateResourceAdminMutation,
} from '@/integrations/hooks';

import { AvailabilityForm } from './AvailabilityForm';

function getErrMessage(err: unknown): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m1b = anyErr?.data?.error;
  if (typeof m1b === 'string' && m1b.trim()) return m1b;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return 'İşlem başarısız. Lütfen tekrar deneyin.';
}

export default function AdminAvailabilityDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const safeId = String(id ?? '').trim();
  const isNew = safeId === 'new';
  const isValidId = isUuidLike(safeId);

  const getQ = useGetResourceAdminQuery(safeId, {
    skip: isNew || !isValidId,
    refetchOnMountOrArgChange: true,
  } as any);

  const [createResource, createState] = useCreateResourceAdminMutation();
  const [updateResource, updateState] = useUpdateResourceAdminMutation();

  const loading = getQ.isLoading || getQ.isFetching;
  const saving = createState.isLoading || updateState.isLoading;

  React.useEffect(() => {
    if (!isNew && !isValidId) {
      toast.error('Geçersiz kaynak id.');
    }
  }, [isNew, isValidId]);

  const handleSubmit = async (values: AvailabilityResourceValues) => {
    try {
      if (isNew) {
        const created = await createResource(values as any).unwrap();
        const newId = String((created as any)?.id || '').trim();
        toast.success('Kaynak oluşturuldu.');
        if (isUuidLike(newId)) {
          router.replace(`/admin/availability/${encodeURIComponent(newId)}`);
        } else {
          router.replace('/admin/availability');
        }
        return;
      }

      await updateResource({ id: safeId, patch: values } as any).unwrap();
      toast.success('Kaynak güncellendi.');
      await getQ.refetch();
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  };

  if (!isNew && !isValidId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geçersiz Kaynak</CardTitle>
          <CardDescription>Gelen id geçersiz. Lütfen listeye dön.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => router.push('/admin/availability')}
          >
            Listeye Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isNew && getQ.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kaynak Bulunamadı</CardTitle>
          <CardDescription>Bu kaynağa erişilemedi veya silinmiş olabilir.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => router.push('/admin/availability')}
          >
            Listeye Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AvailabilityForm
        mode={isNew ? 'create' : 'edit'}
        initialData={isNew ? undefined : (getQ.data as any)}
        loading={loading}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/availability')}
      />
    </div>
  );
}
