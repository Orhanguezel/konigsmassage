// =============================================================
// FILE: src/app/(main)/admin/(admin)/custompage/[id]/page.tsx
// FINAL — Admin Custom Page Detail (App Router)
// Route: /admin/custompage/:id  (id: "new" | UUID)
// =============================================================

import AdminCustomPageDetailClient from '../admin-custom-pages-detail-client';

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const p = await params;
  return <AdminCustomPageDetailClient id={p.id} />;
}
