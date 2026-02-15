// =============================================================
// FILE: src/app/(main)/admin/(admin)/custompage/_components/CustomPageFormImageColumn.tsx
// FINAL — Cover + Gallery (multi) + "set as cover"
// - ✅ App Router: next/navigation
// - ✅ uses AdminImageUploadField (new path)
// - ✅ no inline styles
// =============================================================

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type CustomPageFormImageColumnProps = {
  metadata?: Record<string, string | number | boolean>;
  disabled: boolean;

  featuredImageValue: string;
  onFeaturedImageChange: (url: string) => void;

  galleryUrls?: string[];
  onGalleryUrlsChange?: (urls: string[]) => void;

  onSelectAsCover?: (url: string) => void;
};

export const CustomPageFormImageColumn: React.FC<CustomPageFormImageColumnProps> = ({
  metadata,
  disabled,
  featuredImageValue,
  onFeaturedImageChange,
  galleryUrls,
  onGalleryUrlsChange,
  onSelectAsCover,
}) => {
  const router = useRouter();
  const t = useAdminT();

  return (
    <div className="space-y-4">
      <AdminImageUploadField
        label={t('admin.customPage.form.featuredImage')}
        helperText={
          <>{t('admin.customPage.form.coverHelperText')}</>
        }
        bucket="public"
        folder="custom_pages/cover"
        metadata={{ ...(metadata || {}), section: 'cover' }}
        value={featuredImageValue}
        onChange={(url) => onFeaturedImageChange(url)}
        disabled={disabled}
        openLibraryHref="/admin/storage"
        onOpenLibraryClick={() => router.push('/admin/storage')}
      />

      {onGalleryUrlsChange ? (
        <AdminImageUploadField
          label={t('admin.customPage.form.gallery')}
          helperText={
            <>{t('admin.customPage.form.galleryHelperText')}</>
          }
          bucket="public"
          folder="custom_pages/gallery"
          metadata={{ ...(metadata || {}), section: 'gallery' }}
          multiple
          values={galleryUrls ?? []}
          onChangeMultiple={onGalleryUrlsChange}
          onSelectAsCover={(url) =>
            onSelectAsCover ? onSelectAsCover(url) : onFeaturedImageChange(url)
          }
          coverValue={featuredImageValue}
          disabled={disabled}
          openLibraryHref="/admin/storage"
          onOpenLibraryClick={() => router.push('/admin/storage')}
        />
      ) : null}
    </div>
  );
};
