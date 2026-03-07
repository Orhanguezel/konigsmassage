// =============================================================
// FILE: src/integrations/shared/gutschein.ts
// Gutschein (Gift Card) types + normalizers
// =============================================================

export type GutscheinStatus = 'pending' | 'active' | 'redeemed' | 'expired' | 'cancelled';
export type GutscheinPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type GutscheinProductDto = {
  id: string;
  name: string;
  value: string;
  currency: string;
  validity_days: number;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type GutscheinDto = {
  id: string;
  code: string;
  product_id: string | null;
  product_name: string | null;
  value: string;
  currency: string;
  status: GutscheinStatus;
  purchaser_name: string | null;
  purchaser_email: string | null;
  purchaser_user_id: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  personal_message: string | null;
  redeemed_at: string | null;
  redeemed_by_user_id: string | null;
  issued_at: string | null;
  expires_at: string | null;
  payment_status: GutscheinPaymentStatus;
  order_ref: string | null;
  is_admin_created: boolean;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type GutscheinProductListResp = {
  data: GutscheinProductDto[];
  total: number;
  page: number;
  limit: number;
};

export type GutscheinListResp = {
  data: GutscheinDto[];
  total: number;
  page: number;
  limit: number;
};

export type GutscheinListQuery = {
  status?: GutscheinStatus;
  payment_status?: GutscheinPaymentStatus;
  q?: string;
  page?: number;
  limit?: number;
};

export type GutscheinProductCreateBody = {
  name: string;
  value: number;
  currency?: string;
  validity_days: number;
  description?: string;
  is_active?: boolean;
  display_order?: number;
};

export type GutscheinProductUpdateBody = {
  name?: string;
  value?: number;
  currency?: string;
  validity_days?: number;
  description?: string;
  is_active?: boolean;
  display_order?: number;
};

export type GutscheinAdminCreateBody = {
  product_id?: string;
  value: number;
  currency?: string;
  validity_days?: number;
  purchaser_name: string;
  purchaser_email: string;
  recipient_name?: string;
  recipient_email?: string;
  personal_message?: string;
  status?: GutscheinStatus;
  admin_note?: string;
};

export type GutscheinAdminUpdateBody = {
  status?: GutscheinStatus;
  admin_note?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  expires_at?: string | null;
};

// ----- Normalizers -----

function toStr(v: unknown): string {
  return String(v ?? '').trim();
}
function toNullableStr(v: unknown): string | null {
  const s = toStr(v);
  return s || null;
}
function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  const s = toStr(v).toLowerCase();
  return ['1', 'true', 'yes'].includes(s);
}
function toGutscheinStatus(v: unknown): GutscheinStatus {
  const s = toStr(v);
  if (['pending', 'active', 'redeemed', 'expired', 'cancelled'].includes(s))
    return s as GutscheinStatus;
  return 'pending';
}
function toGutscheinPayStatus(v: unknown): GutscheinPaymentStatus {
  const s = toStr(v);
  if (['pending', 'paid', 'failed', 'refunded'].includes(s)) return s as GutscheinPaymentStatus;
  return 'pending';
}

export function normalizeGutscheinProduct(raw: unknown): GutscheinProductDto {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    value: toStr(r.value || '0.00') || '0.00',
    currency: toStr(r.currency || 'EUR') || 'EUR',
    validity_days: toNum(r.validity_days, 365),
    description: toNullableStr(r.description),
    is_active: toBool(r.is_active),
    display_order: toNum(r.display_order, 0),
    created_at: toNullableStr(r.created_at),
    updated_at: toNullableStr(r.updated_at),
  };
}

export function normalizeGutschein(raw: unknown): GutscheinDto {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toStr(r.id),
    code: toStr(r.code),
    product_id: toNullableStr(r.product_id),
    product_name: toNullableStr(r.product_name),
    value: toStr(r.value || '0.00') || '0.00',
    currency: toStr(r.currency || 'EUR') || 'EUR',
    status: toGutscheinStatus(r.status),
    purchaser_name: toNullableStr(r.purchaser_name),
    purchaser_email: toNullableStr(r.purchaser_email),
    purchaser_user_id: toNullableStr(r.purchaser_user_id),
    recipient_name: toNullableStr(r.recipient_name),
    recipient_email: toNullableStr(r.recipient_email),
    personal_message: toNullableStr(r.personal_message),
    redeemed_at: toNullableStr(r.redeemed_at),
    redeemed_by_user_id: toNullableStr(r.redeemed_by_user_id),
    issued_at: toNullableStr(r.issued_at),
    expires_at: toNullableStr(r.expires_at),
    payment_status: toGutscheinPayStatus(r.payment_status),
    order_ref: toNullableStr(r.order_ref),
    is_admin_created: toBool(r.is_admin_created),
    note: toNullableStr(r.admin_note ?? r.note),
    created_at: toNullableStr(r.created_at),
    updated_at: toNullableStr(r.updated_at),
  };
}

export function normalizeGutscheinProductListResp(raw: unknown): GutscheinProductListResp {
  const r = (raw ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(normalizeGutscheinProduct) : [];
  return {
    data,
    total: toNum(r.total, data.length),
    page: toNum(r.page, 1),
    limit: toNum(r.limit, data.length || 20),
  };
}

export function normalizeGutscheinListResp(raw: unknown): GutscheinListResp {
  const r = (raw ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(normalizeGutschein) : [];
  return {
    data,
    total: toNum(r.total, data.length),
    page: toNum(r.page, 1),
    limit: toNum(r.limit, data.length || 20),
  };
}
