// =============================================================
// FILE: src/pages/admin/storage/[slug].tsx
// konigsmassage – Admin Storage Klasör Bazlı Sayfa (yalın)
// =============================================================

import React, { useMemo } from 'react';
import { useRouter } from 'next/router';

import StorageAdminPage from '@/components/admin/storage/StorageAdminPage';

export default function AdminStorageSlugPage() {
  const router = useRouter();
  const rawSlug = router.query.slug;

  const folder = useMemo(() => {
    if (typeof rawSlug === 'string') return decodeURIComponent(rawSlug);
    if (Array.isArray(rawSlug)) return decodeURIComponent(rawSlug.join('/'));
    return '';
  }, [rawSlug]);

  return <StorageAdminPage initialFolder={folder} />;
}
