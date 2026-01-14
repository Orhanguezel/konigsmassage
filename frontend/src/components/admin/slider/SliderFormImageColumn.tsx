// =============================================================
// FILE: src/components/admin/slider/SliderFormImageColumn.tsx
// konigsmassage – Slider Form Sağ Kolon (Storage + Preview)
// =============================================================

'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { AdminImageUploadField } from '@/components/common/AdminImageUploadField';

export type SliderImageMetadata = {
  module_key?: string;
  locale?: string;
  slider_slug?: string;
  slider_id?: string;
};

export type SliderFormImageColumnProps = {
  metadata?: SliderImageMetadata;
  imageUrl: string;
  disabled?: boolean;
  onImageUrlChange: (url: string) => void;
};

export const SliderFormImageColumn: React.FC<SliderFormImageColumnProps> = ({
  metadata,
  imageUrl,
  disabled,
  onImageUrlChange,
}) => {
  const router = useRouter();

  const effectiveMeta: Record<string, string> | undefined = (() => {
    const base: SliderImageMetadata = {
      module_key: metadata?.module_key ?? 'slider',
      locale: metadata?.locale,
      slider_slug: metadata?.slider_slug,
      slider_id: metadata?.slider_id,
    };

    const entries = Object.entries(base).filter(
      ([, v]) => v !== undefined && v !== null && String(v).length > 0,
    );
    if (!entries.length) return undefined;

    return Object.fromEntries(entries.map(([k, v]) => [k, String(v)]));
  })();

  return (
    <AdminImageUploadField
      label="Slider Görseli"
      helperText={
        <>
          Storage modülü üzerinden slider için bir görsel yükleyebilirsin. Yüklenen görselin
          URL&apos;i sol taraftaki <strong>Görsel URL (image_url)</strong> alanına otomatik yazılır
          (ve JSON modele de yansır).
        </>
      }
      bucket="public"
      folder="slider" // Eğer storage tarafında "sliders" ise burada "sliders" yap
      metadata={effectiveMeta}
      value={imageUrl}
      onChange={onImageUrlChange}
      disabled={disabled}
      openLibraryHref="/admin/storage"
      onOpenLibraryClick={() => router.push('/admin/storage')}
    />
  );
};
