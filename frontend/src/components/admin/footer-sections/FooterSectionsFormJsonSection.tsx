// =============================================================
// FILE: src/components/admin/footer-sections/FooterSectionsFormJsonSection.tsx
// konigsmassage – Footer Sections Form – JSON mod alanı
// =============================================================

'use client';

import React from 'react';
import { AdminJsonEditor } from '@/components/common/AdminJsonEditor';

export type FooterSectionsFormJsonSectionProps = {
  jsonModel: any;
  disabled: boolean;
  onChangeJson: (json: any) => void;
  onErrorChange: (err: string | null) => void;
};

export const FooterSectionsFormJsonSection: React.FC<FooterSectionsFormJsonSectionProps> = ({
  jsonModel,
  disabled,
  onChangeJson,
  onErrorChange,
}) => {
  return (
    <AdminJsonEditor
      label="Footer Section JSON (create/update payload)"
      value={jsonModel}
      onChange={onChangeJson}
      onErrorChange={onErrorChange}
      disabled={disabled}
      height={420}
      helperText={
        <>
          Bu JSON, <code>/admin/footer-sections</code> create / update isteklerine gönderilen
          payload ile uyumludur. Başlıca alanlar:
          <ul className="mb-0 mt-1">
            <li>
              <code>title</code>, <code>slug</code>, <code>description</code>, <code>locale</code>
            </li>
            <li>
              <code>is_active</code>, <code>display_order</code>
            </li>
            <li>
              <code>meta</code> (opsiyonel)
            </li>
          </ul>
        </>
      }
    />
  );
};
