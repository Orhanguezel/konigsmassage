// =============================================================
// FILE: src/app/(main)/admin/(admin)/footer-sections/[id]/page.tsx
// FINAL — Admin Footer Section Detail/Edit Page
// ✅ Next.js 15 async params support
// =============================================================

import AdminFooterSectionsDetailClient from '../_components/admin-footer-sections-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // ✅ FIX: Await params (Next.js 15 requirement)
  const { id } = await params;
  
  return <AdminFooterSectionsDetailClient id={id} />;
}