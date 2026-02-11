'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/_components/SliderFormJsonSection.tsx
// Slider JSON section (AdminJsonEditor standard path)
// =============================================================

import * as React from 'react';

import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export function SliderFormJsonSection<T extends Record<string, any>>(props: {
  value: T;
  disabled?: boolean;
  onChange: (next: T) => void;
}) {
  const t = useAdminT();

  return (
    <AdminJsonEditor
      value={props.value}
      disabled={!!props.disabled}
      onChange={(next) => props.onChange(next as T)}
      label={t('admin.slider.formJson.label')}
      helperText={t('admin.slider.formJson.helperText')}
    />
  );
}
