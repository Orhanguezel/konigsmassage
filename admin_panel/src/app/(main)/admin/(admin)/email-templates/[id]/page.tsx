// =============================================================
// FILE: src/app/(main)/admin/(admin)/email-templates/[id]/page.tsx
// FINAL — Admin Email Template Detail/Edit Page
// =============================================================

import AdminEmailTemplatesDetailClient from './admin-email-templates-detail-client';

export default function Page({ params }: { params: { id: string } }) {
  return <AdminEmailTemplatesDetailClient id={params.id} />;
}
