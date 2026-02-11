
// =============================================================
// FILE: src/app/(main)/admin/(admin)/pricing/[id]/page.tsx
// FINAL — Admin Pricing Detail Page
// ✅ Next.js 15 async params support
// =============================================================

import AdminPricingDetailClient from '../_components/admin-pricing-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // ✅ FIX: Await params (Next.js 15 requirement)
  const { id } = await params;
  
  return <AdminPricingDetailClient id={id} />;
}
