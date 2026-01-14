// =============================================================
// FILE: src/pages/admin/email-templates/new.tsx
// konigsmassage – Admin Email Template Oluşturma Sayfası
// - Dynamic locale (DB) handled inside EmailTemplateFormPage
// =============================================================

'use client';

import React from 'react';
import { EmailTemplateFormPage } from '@/components/admin/email-templates/EmailTemplateFormPage';

const EmailTemplateNewPage: React.FC = () => {
  return <EmailTemplateFormPage mode="create" />;
};

export default EmailTemplateNewPage;
