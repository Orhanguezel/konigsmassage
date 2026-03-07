// =============================================================
// FILE: src/app/(main)/admin/(admin)/offers/[id]/page.tsx
// FINAL — Admin Offer Detail Page
// =============================================================

import AdminOfferDetailClient from '../_components/admin-offer-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOfferDetailClient id={id} />;
}
