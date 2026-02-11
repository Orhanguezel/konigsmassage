'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/_components/SliderFormHeader.tsx
// Slider Form Header (shadcn/tailwind)
// =============================================================

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type SliderFormHeaderProps = {
  mode: 'create' | 'edit';
  title?: string;
  loading?: boolean;
  saving?: boolean;
  onBack?: () => void;
  onSave?: () => void;
};

export function SliderFormHeader({
  mode,
  title,
  loading,
  saving,
  onBack,
  onSave,
}: SliderFormHeaderProps) {
  const t = useAdminT();
  const mainTitle = title || (mode === 'create' ? t('admin.slider.formHeader.createTitle') : t('admin.slider.formHeader.editTitle'));

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{mainTitle}</CardTitle>
            <CardDescription>
              {t('admin.slider.formHeader.description')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {loading ? <Badge variant="secondary">{t('admin.slider.formHeader.loading')}</Badge> : null}
            {saving ? <Badge variant="secondary">{t('admin.slider.formHeader.saving')}</Badge> : null}

            {onBack ? (
              <Button variant="outline" onClick={onBack} disabled={!!loading || !!saving}>
                {t('admin.slider.formHeader.backButton')}
              </Button>
            ) : null}

            {onSave ? (
              <Button onClick={onSave} disabled={!!loading || !!saving}>
                {mode === 'create' ? t('admin.slider.formHeader.createButton') : t('admin.slider.formHeader.saveButton')}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent />
    </Card>
  );
}
