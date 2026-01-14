// =============================================================
// FILE: src/pages/admin/reviews/[slug].tsx
// konigsmassage – Admin Review Create/Edit Page (id/new)
// - Dynamic locales: useAdminLocales() => site_settings.app_locales + default_locale
// - Locale normalize: coerceLocale()
// =============================================================

import React, { useMemo } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import { ReviewsForm, type ReviewFormValues } from '@/components/admin/reviews/ReviewsForm';
import type { LocaleOption } from '@/components/admin/reviews/ReviewsHeader';

import {
  useGetReviewAdminQuery,
  useCreateReviewAdminMutation,
  useUpdateReviewAdminMutation,
} from '@/integrations/rtk/hooks';

import { useAdminLocales } from '@/components/common/useAdminLocales';

const AdminReviewDetailPage: NextPage = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const isRouterReady = router.isReady;

  const idOrSlug = useMemo(() => {
    return isRouterReady && typeof slugParam === 'string' ? slugParam : undefined;
  }, [isRouterReady, slugParam]);

  const isCreateMode = idOrSlug === 'new';
  const reviewId = !isCreateMode && idOrSlug ? idOrSlug : '';

  const shouldSkipQuery = !isRouterReady || isCreateMode || !reviewId;

  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const locales: LocaleOption[] = useMemo(() => {
    return (adminLocaleOptions ?? [])
      .map((o) => ({
        value: String(o.value || '').toLowerCase(),
        label: o.label,
      }))
      .filter((o) => !!o.value);
  }, [adminLocaleOptions]);

  const {
    data: review,
    isLoading: isLoadingReview,
    isFetching: isFetchingReview,
    error: reviewError,
  } = useGetReviewAdminQuery({ id: reviewId }, { skip: shouldSkipQuery });

  const [createReview, { isLoading: isCreating }] = useCreateReviewAdminMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewAdminMutation();

  const loading = isLoadingReview || isFetchingReview;
  const saving = isCreating || isUpdating;

  const handleCancel = () => {
    router.push('/admin/reviews');
  };

  const toIntOrUndefined = (val: string): number | undefined => {
    if (!val) return undefined;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleSubmit = async (values: ReviewFormValues) => {
    try {
      const rating = toIntOrUndefined(values.rating) ?? 5;
      const display_order = toIntOrUndefined(values.display_order) ?? 0;

      const localeValue = coerceLocale(values.locale, defaultLocaleFromDb) || undefined;

      const basePayload = {
        locale: localeValue,
        name: values.name.trim(),
        email: values.email.trim(),
        rating,
        comment: values.comment.trim(),
        is_active: values.is_active,
        is_approved: values.is_approved,
        display_order,
      };

      if (isCreateMode) {
        const created = await createReview(basePayload as any).unwrap();
        toast.success('Yorum başarıyla oluşturuldu.');

        const nextId = created?.id;
        if (nextId) {
          router.replace(`/admin/reviews/${encodeURIComponent(nextId)}`);
        } else {
          handleCancel();
        }
      } else {
        if (!review) {
          toast.error('Yorum verisi yüklenemedi.');
          return;
        }

        await updateReview({ id: review.id, patch: basePayload as any }).unwrap();
        toast.success('Yorum güncellendi.');
      }
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'İşlem sırasında bir hata oluştu.';
      toast.error(msg);
    }
  };

  const pageTitle = isCreateMode ? 'Yeni Yorum Oluştur' : review?.name || 'Yorum Düzenle';

  if (!isRouterReady) {
    return (
      <div className="container-fluid py-3">
        <div className="text-muted small">Yükleniyor...</div>
      </div>
    );
  }

  if (!isCreateMode && reviewError && !loading && !review) {
    return (
      <div className="container-fluid py-3">
        <h4 className="h5 mb-2">Yorum bulunamadı</h4>
        <p className="text-muted small mb-3">
          Bu id için kayıtlı bir yorum yok: <code className="ms-1">{idOrSlug}</code>
        </p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
          Listeye dön
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <h4 className="h5 mb-1">{pageTitle}</h4>
        <p className="text-muted small mb-0">
          Müşteri yorumunun metni, puanı ve onay durumunu buradan yönetebilirsin.
        </p>
      </div>

      <ReviewsForm
        mode={isCreateMode ? 'create' : 'edit'}
        initialData={!isCreateMode && review ? review : undefined}
        loading={loading}
        saving={saving}
        locales={locales}
        localesLoading={localesLoading}
        defaultLocale={defaultLocaleFromDb}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminReviewDetailPage;
