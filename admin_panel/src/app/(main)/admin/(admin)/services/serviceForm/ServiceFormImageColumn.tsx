'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/services/_components/serviceForm/ServiceFormImageColumn.tsx
// guezelwebdesign – Services Form Right Column (FINAL)
// - App Router: next/navigation
// - Canonical cover: services.image_url (+ legacy featured_image mirror)
// - Gallery state: instant UI update
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import type { ServiceImageDto, ServiceImageCreatePayload } from '@/integrations/shared';

import {
  useListServiceImagesAdminQuery,
  useCreateServiceImageAdminMutation,
  useDeleteServiceImageAdminMutation,
  useUpdateServiceAdminMutation,
} from '@/integrations/hooks';

type Props = {
  serviceId?: string;
  locale: string;
  disabled: boolean;
  metadata?: Record<string, string | number | boolean>;

  featuredImageValue: string;

  onFeaturedImageChange: (url: string) => void;
  onGalleryChange?: (items: ServiceImageDto[]) => void;
};

const norm = (v: unknown) => String(v ?? '').trim();

const sortImages = (items: ServiceImageDto[]) =>
  [...items].sort((a: any, b: any) => {
    const ao = Number(a?.display_order ?? 0);
    const bo = Number(b?.display_order ?? 0);
    if (ao !== bo) return ao - bo;

    const ac = String(a?.created_at ?? '');
    const bc = String(b?.created_at ?? '');
    if (ac < bc) return -1;
    if (ac > bc) return 1;
    return 0;
  });

const uniq = (arr: string[]) => {
  const out: string[] = [];
  const set = new Set<string>();
  for (const x of arr) {
    const v = norm(x);
    if (!v) continue;
    if (set.has(v)) continue;
    set.add(v);
    out.push(v);
  }
  return out;
};

export const ServiceFormImageColumn: React.FC<Props> = ({
  serviceId,
  locale,
  disabled,
  metadata,
  featuredImageValue,
  onFeaturedImageChange,
  onGalleryChange,
}) => {
  const router = useRouter();
  const t = useAdminT();

  const {
    data: imageItemsRaw,
    isLoading: imagesLoading,
    isFetching: imagesFetching,
    refetch,
  } = useListServiceImagesAdminQuery(serviceId as string, { skip: !serviceId });

  const imageItems = React.useMemo(
    () => sortImages((imageItemsRaw ?? []) as ServiceImageDto[]),
    [imageItemsRaw],
  );

  const [createImage, { isLoading: isCreating }] = useCreateServiceImageAdminMutation();
  const [deleteImage, { isLoading: isDeleting }] = useDeleteServiceImageAdminMutation();
  const [updateService, { isLoading: isUpdatingService }] = useUpdateServiceAdminMutation();

  const serverGalleryUrls = React.useMemo(
    () => (imageItems ?? []).map((x) => norm((x as any)?.image_url)).filter(Boolean),
    [imageItems],
  );

  const [uiGalleryUrls, setUiGalleryUrls] = React.useState<string[]>(serverGalleryUrls);

  React.useEffect(() => {
    setUiGalleryUrls(serverGalleryUrls);
  }, [serverGalleryUrls]);

  const uploadingDisabled =
    disabled || imagesLoading || imagesFetching || isCreating || isDeleting || isUpdatingService;

  const existsInPool = (urlRaw: string) => {
    const u = norm(urlRaw);
    if (!u) return false;
    return (imageItems ?? []).some((x) => norm((x as any)?.image_url) === u);
  };

  const upsertOne = async (urlRaw: string) => {
    if (!serviceId) return null;
    const url = norm(urlRaw);
    if (!url) return null;

    if (existsInPool(url)) return (imageItems ?? null) as any;

    const payload: ServiceImageCreatePayload = {
      image_url: url,
      image_asset_id: null,
      is_active: true,
      display_order: undefined,
      title: null,
      alt: null,
      caption: null,
      locale,
      replicate_all_locales: true,
    };

    const list = await createImage({ serviceId, payload } as any).unwrap();
    return list as ServiceImageDto[];
  };

  const removeByUrl = async (urlRaw: string) => {
    if (!serviceId) return;

    const url = norm(urlRaw);
    if (!url) return;

    const row = (imageItems ?? []).find((x: any) => norm(x?.image_url) === url);
    if (!row) return;

    const next = await deleteImage({ serviceId, imageId: (row as any).id } as any).unwrap();
    onGalleryChange?.(next as ServiceImageDto[]);
    return next as ServiceImageDto[];
  };

  const persistCover = async (urlRaw: string) => {
    if (!serviceId) return;

    const url = norm(urlRaw);
    if (!url) return;

    const patch = { image_url: url, featured_image: url };

    const tries = [
      () => updateService({ id: serviceId, patch } as any).unwrap(),
      () => updateService({ serviceId, patch } as any).unwrap(),
      () => updateService({ id: serviceId, payload: patch } as any).unwrap(),
      () => updateService({ serviceId, payload: patch } as any).unwrap(),
      () => updateService({ id: serviceId, data: patch } as any).unwrap(),
      () => updateService({ serviceId, data: patch } as any).unwrap(),
    ];

    let lastErr: any = null;
    for (const fn of tries) {
      try {
        await fn();
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  };

  const setCoverUI = (urlRaw: string) => {
    onFeaturedImageChange(norm(urlRaw));
  };

  const handleSelectAsCover = (urlRaw: string) => {
    const url = norm(urlRaw);
    if (!url) return;

    setCoverUI(url);
    setUiGalleryUrls((prev) => uniq([url, ...(prev ?? [])]));

    if (!serviceId) return;

    void (async () => {
      try {
        const list = await upsertOne(url);
        if (list) onGalleryChange?.(list);

        await persistCover(url);
        await refetch();

        toast.success(t('admin.services.formImage.coverSaved'));
      } catch (err: any) {
        const msg =
          err?.data?.error?.message ||
          err?.data?.message ||
          err?.message ||
          t('admin.services.formImage.coverSaveError');
        toast.error(msg);
      }
    })();
  };

  const handleCoverChange = (urlRaw: string) => {
    const url = norm(urlRaw);

    setCoverUI(url);

    if (!serviceId || !url) return;

    setUiGalleryUrls((prev) => uniq([url, ...(prev ?? [])]));

    void (async () => {
      try {
        const list = await upsertOne(url);
        if (list) onGalleryChange?.(list);

        await persistCover(url);
        await refetch();

        toast.success(t('admin.services.formImage.coverSaved'));
      } catch (err: any) {
        const msg =
          err?.data?.error?.message ||
          err?.data?.message ||
          err?.message ||
          t('admin.services.formImage.coverSaveError');
        toast.error(msg);
      }
    })();
  };

  const handleGalleryUrlsChange = (nextUrlsRaw: string[]) => {
    if (!serviceId) return;

    const nextUrls = uniq((nextUrlsRaw ?? []).map((u) => norm(u)));

    setUiGalleryUrls(nextUrls);

    const prevSet = new Set(serverGalleryUrls);
    const nextSet = new Set(nextUrls);

    const added = nextUrls.filter((u) => !prevSet.has(u));
    const removed = serverGalleryUrls.filter((u) => !nextSet.has(u));

    const coverUrl = norm(featuredImageValue);
    const removedSafe = removed.filter((u) => u !== coverUrl);

    if (removed.length > 0 && removedSafe.length !== removed.length) {
      setUiGalleryUrls((prev) => uniq([coverUrl, ...(prev ?? [])]));
      toast.error(t('admin.services.formImage.coverDeleteError'));
    }

    if (added.length > 0) {
      void (async () => {
        try {
          let lastList: ServiceImageDto[] | null = null;
          for (const url of added) {
            const list = await upsertOne(url);
            if (list) lastList = list;
          }
          if (lastList) onGalleryChange?.(lastList);
          await refetch();
        } catch (err: any) {
          const msg =
            err?.data?.error?.message ||
            err?.data?.message ||
            err?.message ||
            t('admin.services.formImage.galleryAddError');
          toast.error(msg);
          await refetch();
        }
      })();
    }

    if (removedSafe.length > 0) {
      void (async () => {
        try {
          for (const url of removedSafe) {
            await removeByUrl(url);
          }
          await refetch();
        } catch (err: any) {
          const msg =
            err?.data?.error?.message ||
            err?.data?.message ||
            err?.message ||
            t('admin.services.formImage.galleryDeleteError');
          toast.error(msg);
          await refetch();
        }
      })();
    }
  };

  const cover = norm(featuredImageValue);

  return (
    <div className="space-y-3">
      <AdminImageUploadField
        label={t('admin.services.formImage.coverLabel')}
        helperText={
          <>
            {t('admin.services.formImage.coverHelperPrefix')} <code>services.image_url</code> {t('admin.services.formImage.coverHelperField')}{' '}
            {t('admin.services.formImage.coverHelperSuffix')}
          </>
        }
        bucket="public"
        folder="services/cover"
        metadata={{ ...(metadata || {}), section: 'cover' }}
        value={cover}
        onChange={handleCoverChange}
        disabled={disabled}
        openLibraryHref="/admin/storage"
        onOpenLibraryClick={() => router.push('/admin/storage')}
      />

      {serviceId ? (
        <AdminImageUploadField
          label={t('admin.services.formImage.galleryLabel')}
          helperText={
            <>
              {t('admin.services.formImage.galleryHelperPrefix')} (<code>service_images</code>).{' '}
              {t('admin.services.formImage.galleryHelperSuffix')}
            </>
          }
          bucket="public"
          folder="services/gallery"
          metadata={{ ...(metadata || {}), section: 'gallery' }}
          multiple
          values={uiGalleryUrls}
          onChangeMultiple={handleGalleryUrlsChange}
          onSelectAsCover={handleSelectAsCover}
          coverValue={cover}
          disabled={uploadingDisabled}
          openLibraryHref="/admin/storage"
          onOpenLibraryClick={() => router.push('/admin/storage')}
        />
      ) : (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          {t('admin.services.formImage.galleryPlaceholder')}
        </div>
      )}
    </div>
  );
};
