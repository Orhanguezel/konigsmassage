// =============================================================
// FILE: src/components/admin/faqs/FaqsFormJsonSection.tsx
// konigsmassage – FAQ Form – JSON mod alanı
// =============================================================

'use client';

import React from 'react';
import { AdminJsonEditor } from '@/components/common/AdminJsonEditor';

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
    <AdminJsonEditor
      label="FAQ JSON (create/update payload)"
      value={jsonModel}
      onChange={onChangeJson}
      onErrorChange={onErrorChange}
      disabled={disabled}
      height={380}
      helperText={
        <>
          Bu JSON, <code>/admin/faqs</code> create / update isteklerine gönderilen payload ile
          uyumludur. Başlıca alanlar:
          <ul className="mb-0 mt-1">
            <li>
              <code>question</code>, <code>answer</code>, <code>slug</code>, <code>locale</code>
            </li>
            <li>
              <code>is_active</code>, <code>display_order</code>
            </li>
            <li>
              <code>category_id</code>, <code>sub_category_id</code> (opsiyonel)
            </li>
          </ul>
        </>
      }
    />
  );
};
