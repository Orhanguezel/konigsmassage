// =============================================================
// FILE: src/components/admin/custompage/CustomPageSidebarColumn.tsx
// FINAL — Sidebar: tags, content-image insertion, SEO
// - ✅ Category/SubCategory REMOVED
// - ✅ Cover/Gallery yok (CustomPageFormImageColumn tek kaynak)
// =============================================================

'use client';

import React from 'react';
import { AdminImageUploadField } from '@/components/common/AdminImageUploadField';
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
  const blockCls = 'mb-2 mb-lg-3';

  return (
    <>
      {/* Etiketler */}
      <div className={blockCls}>
        <label className="form-label small mb-1">Etiketler (Tags)</label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="ör: konigsmassage,su sogutma,kule,blog"
          value={values.tags}
          onChange={(e) => setValues((prev) => ({ ...prev, tags: e.target.value }))}
          disabled={disabled}
        />
      </div>

      {/* İçerik görsel boyutu */}
      <div className={blockCls}>
        <label className="form-label small mb-1">İçerik Görsel Boyutu</label>
        <select
          className="form-select form-select-sm"
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

      {/* İçerik görselleri */}
      <div className={blockCls}>
        <AdminImageUploadField
          label="İçerik Görselleri (Yükle)"
          helperText={<>Yüklenen görsel içerik alanının sonuna blok olarak eklenir.</>}
          bucket="public"
          folder="custom_pages/content"
          metadata={{
            ...(imageMetadata || {}),
            section: 'content',
          }}
          multiple
          value={contentImagePreview}
          onChange={(url) => handleAddContentImage(url)}
          disabled={disabled}
          openLibraryHref="/admin/storage"
        />
      </div>

      {/* Serbest URL */}
      <div className={blockCls}>
        <label className="form-label small mb-1">Serbest URL ile İçerik Görseli</label>
        <input
          type="url"
          className="form-control form-control-sm mb-2"
          placeholder="https://... (görsel URL'i)"
          value={manualImageUrl}
          onChange={(e) => setManualImageUrl(e.target.value)}
          disabled={disabled}
        />
        <input
          type="text"
          className="form-control form-control-sm mb-2"
          placeholder="Alt metin (opsiyonel)"
          value={manualImageAlt}
          onChange={(e) => setManualImageAlt(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleAddManualImage}
          disabled={disabled}
        >
          Serbest URL&apos;yi İçeriğe Ekle
        </button>
      </div>

      {/* SEO */}
      <div className={blockCls}>
        <label className="form-label small mb-1">Meta Title</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={values.meta_title}
          onChange={(e) => setValues((prev) => ({ ...prev, meta_title: e.target.value }))}
          disabled={disabled}
        />
      </div>

      <div className="mb-0">
        <label className="form-label small mb-1">Meta Description</label>
        <textarea
          className="form-control form-control-sm"
          rows={3}
          value={values.meta_description}
          onChange={(e) => setValues((prev) => ({ ...prev, meta_description: e.target.value }))}
          disabled={disabled}
        />
      </div>
    </>
  );
};
