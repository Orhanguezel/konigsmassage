// =============================================================
// FILE: src/components/admin/faqs/FaqsFormJsonSection.tsx
// guezelwebdesign – FAQ Form – JSON mod alanı (theme-safe, no shadcn/bootstrap)
// =============================================================

'use client';

import React from 'react';
import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';

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
  return (
    <div className="rounded-lg border bg-card p-3">
      <AdminJsonEditor
        label="FAQ JSON (create/update payload)"
        value={jsonModel}
        onChange={onChangeJson}
        onErrorChange={onErrorChange}
        disabled={disabled}
        height={380}
        helperText={
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>
              Bu JSON, <code>/admin/faqs</code> create / update isteklerine gönderilen payload ile
              uyumludur.
            </div>
            <div>
              Başlıca alanlar:
              <ul className="mb-0 mt-1 list-disc pl-5">
                <li>
                  <code>question</code>, <code>answer</code>, <code>slug</code>, <code>locale</code>
                </li>
                <li>
                  <code>is_active</code>, <code>display_order</code>
                </li>
              </ul>
            </div>
            <div>
              Not: JSON modunda <code>locale</code> göndermezsen, seçili locale (form üstünden)
              kullanılır.
            </div>
          </div>
        }
      />
    </div>
  );
};
