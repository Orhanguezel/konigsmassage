// =============================================================
// FILE: src/app/(main)/admin/(admin)/offers/[id]/page.tsx
// FINAL — Admin Offer Detail Page
// =============================================================

import AdminOfferDetailClient from '../_components/admin-offer-detail-client';

export default function Page({ params }: { params: { id: string } }) {
  return <AdminOfferDetailClient id={params.id} />;
}
