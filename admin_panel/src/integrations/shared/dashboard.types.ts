// =============================================================
// FILE: src/integrations/shared/dashboard.types.ts
// FINAL — Dashboard Analytics Types (admin)
// =============================================================

export type DashboardRangeKey = '7d' | '30d' | '90d';
export type DashboardTrendBucket = 'day' | 'week';

export type AdminDashboardAnalyticsQuery = {
  range?: DashboardRangeKey;
};

export interface DashboardAnalyticsDto {
  range: DashboardRangeKey;
  from: string; // ISO
  to: string; // ISO
  meta: {
    bucket: DashboardTrendBucket;
  };

  totals: {
    delivered_orders: number;
    total_units_delivered: number;
    total_incentives: number;
  };

  drivers: Array<{
    driver_id: string;
    driver_name: string;
    delivered_orders: number;
    units_delivered: number;
    incentives: number;
  }>;

  sellers: Array<{
    seller_id: string;
    seller_name: string;
    delivered_orders: number;
    units_delivered: number;
    incentives: number;
  }>;

  product_mix: Array<{
    product_id: string;
    product_title: string;
    units_delivered: number;
  }>;

  species_mix: Array<{
    species: string;
    units_delivered: number;
  }>;

  trend: Array<{
    bucket: string; // YYYY-MM-DD | YYYY-Wxx
    delivered_orders: number;
    units_delivered: number;
    incentives: number;
  }>;
}

export interface DashboardCountItemDto {
  key: string;
  label: string;
  count: number;
}

export type DashboardSummaryItem = DashboardCountItemDto;

export type DashboardSummary = {
  items: DashboardCountItemDto[];
};

export interface DashboardRecentOrderDto {
  order_id: string;
  order_number: string;
  driver_name: string;
  seller_name: string;
  total_units: number;
  total_incentive: number;
  delivered_at: string; // ISO
}

const DASHBOARD_KEY_MAP: Record<string, string> = {
  menuitem: 'menu_items',
  slider: 'sliders',
  pricing_plans: 'pricing',
  skillCounters: 'skills',
  brandLogos: 'brands',
};

function toCountItem(raw: any): DashboardCountItemDto {
  const rawKey = String(raw?.key ?? '').trim();
  const key = DASHBOARD_KEY_MAP[rawKey] ?? rawKey;
  const label = String(raw?.label ?? '').trim();
  const countNum = Number(raw?.count ?? 0);
  return {
    key,
    label: label || key,
    count: Number.isFinite(countNum) ? countNum : 0,
  };
}

export function normalizeDashboardSummary(res: unknown): DashboardSummary {
  const r = (res ?? {}) as any;
  const itemsRaw = Array.isArray(r) ? r : Array.isArray(r?.items) ? r.items : [];
  const items = itemsRaw.map(toCountItem).filter((x: DashboardCountItemDto) => x.key.length > 0);
  return { items };
}
