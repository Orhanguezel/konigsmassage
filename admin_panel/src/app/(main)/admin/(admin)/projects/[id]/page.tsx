// =============================================================
// FILE: src/app/(main)/admin/(admin)/projects/[id]/page.tsx
// FINAL — Admin Project Detail Page
// =============================================================

import AdminProjectDetailClient from '../_components/admin-project-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProjectDetailClient id={id} />;
}
