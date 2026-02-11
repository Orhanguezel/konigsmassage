// =============================================================
// FILE: src/app/(main)/admin/(admin)/faqs/[id]/page.tsx
// FINAL — Admin FAQ Detail (App Router)
// Route: /admin/faqs/:id  (id: "new" | UUID)
// =============================================================

import AdminFaqsDetailClient from '../admin-faqs-detail-client';

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> | Params }) {
  const p = (await params) as Params;
  return <AdminFaqsDetailClient id={p.id} />;
}
