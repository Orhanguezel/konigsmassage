// =============================================================
// FILE: src/pages/admin/faqs/new.tsx
// konigsmassage – Yeni FAQ Oluşturma Sayfası
// - locale: query.locale > router.locale > DB default (FaqsFormPage okuyorsa)
// =============================================================

'use client';

import React from 'react';
import { useRouter } from 'next/router';

import FaqsFormPage from '@/components/admin/faqs/FaqsFormPage';

const AdminFaqsCreatePage: React.FC = () => {
  const router = useRouter();

  const handleDone = () => {
    // eğer ?locale= ile geldiyse listeye de aynı locale ile dön
    const q = router.query.locale;
    const qLocale = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : '';
    const qs = qLocale ? `?locale=${encodeURIComponent(String(qLocale).toLowerCase())}` : '';
    router.push(`/admin/faqs${qs}`);
  };

  return <FaqsFormPage mode="create" onDone={handleDone} />;
};

export default AdminFaqsCreatePage;
