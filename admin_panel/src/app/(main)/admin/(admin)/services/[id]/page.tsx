// =============================================================
// FILE: src/app/(main)/admin/(admin)/services/[id]/page.tsx
// FINAL — Admin Services Detail (App Router wrapper)
// =============================================================

import AdminServiceDetailClient from '../_components/admin-services-detail-client';

export default async function AdminServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminServiceDetailClient id={id} />;
}
