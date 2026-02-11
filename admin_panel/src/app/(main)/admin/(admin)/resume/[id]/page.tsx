// =============================================================
// FILE: src/app/(main)/admin/(admin)/resume/[id]/page.tsx
// FINAL — Admin Resume Detail Page
// =============================================================

import AdminResumeDetailClient from '../_components/admin-resume-detail-client';

export default function Page({ params }: { params: { id: string } }) {
  return <AdminResumeDetailClient id={params.id} />;
}
