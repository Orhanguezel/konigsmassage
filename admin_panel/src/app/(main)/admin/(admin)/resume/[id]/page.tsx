// =============================================================
// FILE: src/app/(main)/admin/(admin)/resume/[id]/page.tsx
// FINAL — Admin Resume Detail Page
// =============================================================

import AdminResumeDetailClient from '../_components/admin-resume-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminResumeDetailClient id={id} />;
}
