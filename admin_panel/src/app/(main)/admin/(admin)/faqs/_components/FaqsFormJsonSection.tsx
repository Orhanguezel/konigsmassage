// =============================================================
// FILE: src/components/admin/faqs/FaqsFormJsonSection.tsx
// guezelwebdesign – FAQ Form – JSON mod alanı (theme-safe, no shadcn/bootstrap)
// =============================================================

'use client';

import React from 'react';
import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type FaqsFormJsonSectionProps = {
  jsonModel: any;
  disabled: boolean;
  onChangeJson: (json: any) => void;
  onErrorChange: (err: string | null) => void;
};

export const FaqsFormJsonSection: React.FC<FaqsFormJsonSectionProps> = ({
  jsonModel,
  disabled,
  onChangeJson,
  onErrorChange,
}) => {
  const t = useAdminT('admin.faqs');

  return (
    <div className="rounded-lg border bg-card p-3">
      <AdminJsonEditor
        label={t('jsonEditor.label')}
        value={jsonModel}
        onChange={onChangeJson}
        onErrorChange={onErrorChange}
        disabled={disabled}
        height={380}
        helperText={
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>{t('jsonEditor.help.intro')}</div>
            <div>
              {t('jsonEditor.help.mainFields')}
              <ul className="mb-0 mt-1 list-disc pl-5">
                <li>
                  <code>question</code>, <code>answer</code>, <code>slug</code>, <code>locale</code>
                </li>
                <li>
                  <code>is_active</code>, <code>display_order</code>
                </li>
              </ul>
            </div>
            <div>{t('jsonEditor.help.localeNote')}</div>
          </div>
        }
      />
    </div>
  );
};
