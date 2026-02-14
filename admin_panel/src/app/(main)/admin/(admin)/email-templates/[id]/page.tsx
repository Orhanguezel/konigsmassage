// =============================================================
// FILE: src/app/(main)/admin/(admin)/email-templates/[id]/page.tsx
// FINAL — Admin Email Template Detail/Edit Page
// =============================================================

import AdminEmailTemplatesDetailClient from "./admin-email-templates-detail-client";

type PageParams = { id: string };

export default async function Page({ params }: { params: PageParams | Promise<PageParams> }) {
  const { id } = await params;
  return <AdminEmailTemplatesDetailClient id={id} />;
}
