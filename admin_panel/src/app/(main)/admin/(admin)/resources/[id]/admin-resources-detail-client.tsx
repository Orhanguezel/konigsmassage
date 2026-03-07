'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ResourceForm, type ResourceFormValues } from '../ResourceForm';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import {
  useCreateResourceAdminMutation,
  useGetResourceAdminQuery,
  useUpdateResourceAdminMutation,
} from '@/integrations/hooks';

export default function AdminResourcesDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { localeOptions, defaultLocaleFromDb } = useAdminLocales();
  const formLocales = React.useMemo(() => {
    if (localeOptions.length) return localeOptions;
    const fallback = String(defaultLocaleFromDb || 'de').trim().toLowerCase() || 'de';
    return [{ value: fallback, label: `${fallback.toUpperCase()} (${fallback})` }];
  }, [localeOptions, defaultLocaleFromDb]);
  const isCreate = String(id) === 'new';
  const canLoad = !isCreate && String(id).length === 36;

  const detailQ = useGetResourceAdminQuery(id, {
    skip: !canLoad,
    refetchOnMountOrArgChange: true,
  });
  const [createResource, createState] = useCreateResourceAdminMutation();
  const [updateResource, updateState] = useUpdateResourceAdminMutation();

  const loading = detailQ.isLoading || detailQ.isFetching;
  const saving = createState.isLoading || updateState.isLoading;

  const handleSubmit = async (values: ResourceFormValues) => {
    try {
      const defaultLocale = String(defaultLocaleFromDb || formLocales[0]?.value || 'de')
        .trim()
        .toLowerCase();
      const i18n = Object.entries(values.i18nTitles)
        .map(([locale, title]) => ({
          locale: String(locale || '').trim().toLowerCase(),
          title: String(title || '').trim(),
        }))
        .filter((row) => row.locale && row.title);
      const fallbackTitle =
        i18n.find((row) => row.locale === defaultLocale)?.title || values.title.trim();

      const payload = {
        title: fallbackTitle,
        type: values.type,
        capacity: Math.max(1, Math.floor(Number(values.capacity ?? 1))),
        external_ref_id: values.external_ref_id.trim() || null,
        is_active: values.is_active,
        i18n,
      };

      if (isCreate) {
        const created = await createResource(payload).unwrap();
        const nextId = String((created as any)?.id ?? '').trim();
        toast.success('Kaynak oluşturuldu.');
        if (nextId) {
          router.replace(`/admin/resources/${encodeURIComponent(nextId)}`);
          return;
        }
        router.replace('/admin/resources');
        return;
      }

      await updateResource({ id, patch: payload }).unwrap();
      toast.success('Kaynak güncellendi.');
      await detailQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Kaydetme işlemi başarısız.');
    }
  };

  React.useEffect(() => {
    if (!isCreate && !canLoad) {
      toast.error('Geçersiz kaynak ID.');
      router.replace('/admin/resources');
    }
  }, [isCreate, canLoad, router]);

  return (
    <ResourceForm
      mode={isCreate ? 'create' : 'edit'}
      initialData={isCreate ? null : (detailQ.data ?? null)}
      loading={loading}
      saving={saving}
      locales={formLocales}
      defaultLocale={defaultLocaleFromDb}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/resources')}
    />
  );
}
