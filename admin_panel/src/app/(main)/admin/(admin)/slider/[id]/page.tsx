// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/[id]/page.tsx
// Admin Slider – Detail/Edit (SERVER) — FIX sync dynamic params
// =============================================================

import AdminSliderDetailClient from '../_components/admin-slider-detail-client';

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AdminSliderDetailClient mode="edit" id={id} />;
}
