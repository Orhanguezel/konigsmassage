// =============================================================
// FILE: src/pages/admin/footer-sections/new.tsx
// konigsmassage – Yeni Footer Section Oluşturma Sayfası
// =============================================================

'use client';

import React from 'react';
import { useRouter } from 'next/router';

import FooterSectionsFormPage from '@/components/admin/footer-sections/FooterSectionsFormPage';

const toShortLocale = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const AdminFooterSectionsCreatePage: React.FC = () => {
  const router = useRouter();

  const handleDone = () => {
    const q = router.query.locale;
    const qLocale = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : '';
    const loc = toShortLocale(qLocale);
    const qs = loc ? `?locale=${encodeURIComponent(loc)}` : '';
    router.push(`/admin/footer-sections${qs}`);
  };

  return <FooterSectionsFormPage mode="create" onDone={handleDone} />;
};

export default AdminFooterSectionsCreatePage;
