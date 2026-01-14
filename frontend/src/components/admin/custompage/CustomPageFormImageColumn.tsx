// =============================================================
// FILE: src/components/admin/custompage/CustomPageFormImageColumn.tsx
// konigsmassage – Custom Pages Form – Sağ kolon (Kapak + Galeri)
// - ✅ Multi upload + "Kapak" seçimi
// - ✅ No styled-jsx / No inline styles
// =============================================================

'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { AdminImageUploadField } from '@/components/common/AdminImageUploadField';

export type CustomPageFormImageColumnProps = {
  metadata?: Record<string, string | number | boolean>;

  disabled: boolean;

  /** Cover (custom_pages.featured_image) */
  featuredImageValue: string;
  onFeaturedImageChange: (url: string) => void;

  /** Gallery (custom_pages.images) */
  galleryUrls?: string[];
  onGalleryUrlsChange?: (urls: string[]) => void;

  /** Optional: "set as cover" from gallery */
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

  return (
    <div className="d-flex flex-column gap-3">
      {/* COVER */}
      <AdminImageUploadField
        label="Öne Çıkan Görsel (Kapak)"
        helperText={
          <>
            Bu sayfa için bir <strong>kapak/öne çıkan</strong> görsel yükleyebilirsin. Seçim{' '}
            <code>custom_pages.featured_image</code> alanına yazılır.
          </>
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

      {/* GALLERY */}
      {onGalleryUrlsChange && (
        <AdminImageUploadField
          label="Galeri Görselleri"
          helperText={
            <>
              Birden fazla görsel yükleyip sayfaya galeri tanımlayabilirsin. Galerideki{' '}
              <strong>Kapak</strong> butonu ile seçilen görseli kapak olarak atayabilirsin.
            </>
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
      )}
    </div>
  );
};
