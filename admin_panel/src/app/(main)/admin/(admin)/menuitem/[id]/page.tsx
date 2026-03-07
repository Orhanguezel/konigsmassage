// =============================================================
// FILE: src/app/(main)/admin/(admin)/menuitem/[id]/page.tsx
// FINAL — Admin Menu Item Detail/Edit Page
// =============================================================

import AdminMenuItemDetailClient from '../_components/admin-menuitem-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminMenuItemDetailClient id={id} />;
}
