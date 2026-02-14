// =============================================================
// FILE: src/app/(main)/admin/(admin)/availability/[id]/page.tsx
// FINAL — Admin Availability Detail (App Router)
// Route: /admin/availability/:id  (id: "new" | UUID)
// =============================================================

import AdminAvailabilityDetailClient from '../_components/admin-availability-detail-client';

type Params = { id: string };

// Next.js bazı sürümlerde params'ı Promise olarak verir (sync-dynamic-apis hatası)
export default async function Page({ params }: { params: Promise<Params> | Params }) {
  const p = (await params) as Params;
  return <AdminAvailabilityDetailClient id={p.id} />;
}
