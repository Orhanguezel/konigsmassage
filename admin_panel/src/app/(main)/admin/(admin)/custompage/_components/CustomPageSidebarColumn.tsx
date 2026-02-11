// =============================================================
// FILE: src/app/(main)/admin/(admin)/custompage/_components/CustomPageSidebarColumn.tsx
// FINAL — Sidebar: tags, content-image insertion, SEO
// - ✅ Uses AdminImageUploadField (new path)
// - ✅ No category/subcategory
// =============================================================

'use client';

import React from 'react';

import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import type { ContentImageSize, CustomPageFormValues } from './CustomPageForm';

type Props = {
  values: CustomPageFormValues;
  disabled: boolean;

  imageMetadata: Record<string, string | number | boolean>;

  contentImageSize: ContentImageSize;
  setContentImageSize: (s: ContentImageSize) => void;
  contentImagePreview: string;
  handleAddContentImage: (url: string, alt?: string) => void;

  manualImageUrl: string;
  manualImageAlt: string;
  setManualImageUrl: (v: string) => void;
  setManualImageAlt: (v: string) => void;
  handleAddManualImage: () => void;

  setValues: React.Dispatch<React.SetStateAction<CustomPageFormValues>>;
};

export const CustomPageSidebarColumn: React.FC<Props> = ({
  values,
  disabled,
  imageMetadata,
  contentImageSize,
  setContentImageSize,
  contentImagePreview,
  handleAddContentImage,
  manualImageUrl,
  manualImageAlt,
  setManualImageUrl,
  setManualImageAlt,
  handleAddManualImage,
  setValues,
}) => {
  const t = useAdminT();
  return (
    <div className="rounded-lg border bg-card p-3 space-y-4">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">{t('admin.customPage.form.tags')}</label>
        <input
          type="text"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="ör: guezelwebdesign, kampanya, blog"
          value={values.tags}
          onChange={(e) => setValues((prev) => ({ ...prev, tags: e.target.value }))}
          disabled={disabled}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">{t('admin.customPage.form.imageSize')}</label>
        <select
          className="w-full rounded-md border bg-background px-2 py-2 text-sm"
          value={contentImageSize}
          onChange={(e) => setContentImageSize(e.target.value as ContentImageSize)}
          disabled={disabled}
        >
          <option value="sm">Küçük (1/2)</option>
          <option value="md">Orta (3/4)</option>
          <option value="lg">Büyük (varsayılan)</option>
          <option value="full">Tam genişlik</option>
        </select>
      </div>

      <AdminImageUploadField
        label={t('admin.customPage.form.content') + ' ' + t('admin.common.upload')}
        helperText={<>Yüklenen görsel içerik alanının sonuna blok olarak eklenir.</>}
        bucket="public"
        folder="custom_pages/content"
        metadata={{ ...(imageMetadata || {}), section: 'content' }}
        multiple
        value={contentImagePreview}
        onChange={(url) => handleAddContentImage(url)}
        disabled={disabled}
        openLibraryHref="/admin/storage"
      />

      <div className="space-y-2">
        <label className="block text-xs text-muted-foreground">
          {t('admin.customPage.form.manualUrl')}
        </label>
        <input
          type="url"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="https://... (görsel URL'i)"
          value={manualImageUrl}
          onChange={(e) => setManualImageUrl(e.target.value)}
          disabled={disabled}
        />
        <input
          type="text"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Alt metin (opsiyonel)"
          value={manualImageAlt}
          onChange={(e) => setManualImageAlt(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-xs disabled:opacity-60"
          onClick={handleAddManualImage}
          disabled={disabled}
        >
          Serbest URL&apos;yi İçeriğe Ekle
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Meta Title</label>
        <input
          type="text"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={values.meta_title}
          onChange={(e) => setValues((prev) => ({ ...prev, meta_title: e.target.value }))}
          disabled={disabled}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Meta Description</label>
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          rows={3}
          value={values.meta_description}
          onChange={(e) => setValues((prev) => ({ ...prev, meta_description: e.target.value }))}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
