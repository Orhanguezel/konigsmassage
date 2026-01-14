// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/audit_admin.endpoints.ts
// konigsmassage – Admin Audit (RTK Query)
// FIX:
//  - List endpoints return { items, total }
//  - Daily endpoint returns { days, ...meta }
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  AuditAuthEventDto,
  AuditAuthEventsListQueryParams,
  AuditMetricsDailyQueryParams,
  AuditRequestLogDto,
  AuditRequestLogsListQueryParams,
} from '@/integrations/types';

const BASE = 'admin/audit';

export type AuditListResponse<T> = { items: T[]; total: number };

export type AuditDailyRowDto = {
  date: string;
  requests: number;
  unique_ips: number;
  errors: number;
};

export type AuditMetricsDailyResponseDto = {
  days: AuditDailyRowDto[];
  from?: string;
  to?: string;
  only_admin?: boolean;
  path_prefix?: string;
};

function coerceList<T>(raw: any): AuditListResponse<T> {
  if (!raw) return { items: [], total: 0 };
  if (Array.isArray(raw)) return { items: raw as T[], total: raw.length };
  if (Array.isArray(raw.items)) {
    const total = Number.isFinite(Number(raw.total)) ? Number(raw.total) : raw.items.length;
    return { items: raw.items as T[], total };
  }
  if (Array.isArray(raw.data)) {
    const total = Number.isFinite(Number(raw.total)) ? Number(raw.total) : raw.data.length;
    return { items: raw.data as T[], total };
  }
  return { items: [], total: 0 };
}

function coerceDaily(raw: any): AuditMetricsDailyResponseDto {
  if (!raw) return { days: [] };
  if (Array.isArray(raw)) return { days: raw };
  if (Array.isArray(raw.days)) return raw as AuditMetricsDailyResponseDto;
  if (Array.isArray(raw.items)) return { ...raw, days: raw.items };
  if (Array.isArray(raw.data)) return { ...raw, days: raw.data };
  return { days: [] };
}

export const auditAdminApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listAuditRequestLogsAdmin: build.query<
      AuditListResponse<AuditRequestLogDto>,
      AuditRequestLogsListQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}/request-logs`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceList<AuditRequestLogDto>(raw),
      providesTags: [{ type: 'AuditRequestLog' as const, id: 'LIST' }],
    }),

    listAuditAuthEventsAdmin: build.query<
      AuditListResponse<AuditAuthEventDto>,
      AuditAuthEventsListQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}/auth-events`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceList<AuditAuthEventDto>(raw),
      providesTags: [{ type: 'AuditAuthEvent' as const, id: 'LIST' }],
    }),

    getAuditMetricsDailyAdmin: build.query<
      AuditMetricsDailyResponseDto,
      AuditMetricsDailyQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}/metrics/daily`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceDaily(raw),
      providesTags: [{ type: 'AuditMetric' as const, id: 'DAILY' }],
    }),
  }),
});

export const {
  useListAuditRequestLogsAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useGetAuditMetricsDailyAdminQuery,
} = auditAdminApi;
