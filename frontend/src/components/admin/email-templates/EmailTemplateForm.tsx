// ===================================================================
// FILE: src/components/admin/email-templates/EmailTemplateForm.tsx
// Email Templates – Form Gövdesi (isim, subject, RichContentEditor)
// ===================================================================

'use client';

import React from 'react';
import type { EmailTemplateFormValues } from './EmailTemplateFormPage';
import RichContentEditor from '@/components/common/RichContentEditor';

interface EmailTemplateFormProps {
  values: EmailTemplateFormValues;
  onChange: (patch: Partial<EmailTemplateFormValues>) => void;
  disabled?: boolean;
}

export const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
  values,
  onChange,
  disabled = false,
}) => {
  const handleChange =
    (field: keyof EmailTemplateFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        [field]: e.target.value,
      } as Partial<EmailTemplateFormValues>);
    };

  const handleContentChange = (html: string) => {
    onChange({ content: html });
  };

  return (
    <div className="card">
      <div className="card-body p-3">
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label small">Şablon İsmi (template_name)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={values.template_name}
              onChange={handleChange('template_name')}
              placeholder="Örn: Password Reset, Contact Admin Notification"
              disabled={disabled}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small">Konu (subject)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={values.subject}
              onChange={handleChange('subject')}
              placeholder="Örn: Şifre Sıfırlama Talebi - {{site_name}}"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="mt-3">
          <RichContentEditor
            label="İçerik (HTML content)"
            value={values.content}
            onChange={handleContentChange}
            height="320px"
            disabled={disabled}
          />
          <div className="form-text small">
            HTML içeriğinde <code>{'{{variable}}'}</code> şeklinde placeholder kullanabilirsin. Örn:{' '}
            <code>{'Merhaba {{name}}, şifrenizi sıfırlamak için aşağıdaki linki kullanın.'}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
