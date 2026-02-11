'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/_components/SliderFormImageColumn.tsx
// FINAL — Accepts `locale` prop (so TS2322 won't happen)
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type SliderImageMetadata = Record<string, string | number | boolean | null | undefined>;

export type SliderFormImageColumnProps = {
  metadata?: SliderImageMetadata;

  /** optional: passed by parent */
  locale?: string;

  value: {
    image_url: string;
    alt: string;
  };

  disabled?: boolean;
  onChange: (patch: Partial<{ image_url: string; alt: string }>) => void;

  folder?: string;
};

const norm = (v: unknown) => String(v ?? '').trim();
const normLocale = (v: unknown) => norm(v).toLowerCase();

const toMeta = (meta?: SliderImageMetadata): Record<string, string> | undefined => {
  if (!meta) return undefined;
  const entries = Object.entries(meta)
    .map(([k, v]) => [k, String(v ?? '').trim()] as const)
    .filter(([k, v]) => !!k && !!v);
  return entries.length ? Object.fromEntries(entries) : undefined;
};

export function SliderFormImageColumn({
  metadata,
  locale,
  value,
  disabled,
  onChange,
  folder,
}: SliderFormImageColumnProps) {
  const router = useRouter();
  const t = useAdminT();

  const effectiveMeta = React.useMemo(() => {
    const base: SliderImageMetadata = {
      module_key: 'slider',
      ...(metadata || {}),
      ...(locale ? { locale: normLocale(locale) } : {}),
    };
    return toMeta(base);
  }, [metadata, locale]);

  const imageUrl = norm(value?.image_url);
  const alt = norm(value?.alt);

  return (
    <div className="space-y-3">
      <AdminImageUploadField
        label={t('admin.slider.formImage.imageLabel')}
        helperText={
          <>
            {t('admin.slider.formImage.imageHelp')}
          </>
        }
        bucket="public"
        folder={folder || 'slider'}
        metadata={effectiveMeta}
        value={imageUrl}
        onChange={(url) => onChange({ image_url: norm(url) })}
        disabled={!!disabled}
        openLibraryHref="/admin/storage"
        onOpenLibraryClick={() => router.push('/admin/storage')}
      />

      <div className="space-y-2">
        <div className="text-sm font-medium">{t('admin.slider.formImage.altLabel')}</div>
        <input
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          disabled={!!disabled}
          placeholder={t('admin.slider.formImage.altPlaceholder')}
        />
        <p className="text-xs text-muted-foreground">
          {t('admin.slider.formImage.altHelp')}
        </p>
      </div>
    </div>
  );
}
