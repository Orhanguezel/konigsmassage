// =============================================================
// FILE: src/app/(main)/admin/(admin)/menuitem/[id]/page.tsx
// FINAL — Admin Menu Item Detail/Edit Page
// =============================================================

import AdminMenuItemDetailClient from '../_components/admin-menuitem-detail-client';

export default function Page({ params }: { params: { id: string } }) {
  return <AdminMenuItemDetailClient id={params.id} />;
}
