// =============================================================
// FILE: src/integrations/rtk/endpoints/availability.endpoints.ts
// FINAL — Public Availability endpoints
//  - /availability/slots
//  - /availability (final check)
//  - /availability/working-hours
//  - /availability/weekly-plan
//  + (NEW) listAvailabilitySlotsByResourcesPublic (fan-out, no manual fetch)
// =============================================================

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { baseApi } from '@/integrations/rtk/baseApi';

import type {
  AvailabilityGetQuery,
  AvailabilitySlotsQuery,
  ResourceSlotDto,
  SlotAvailabilityDto,
  WeeklyPlanDayDto,
  WeeklyPlanQuery,
  PublicWorkingHoursQuery,
  ResourceWorkingHourDto,

  // ✅ type-safe query for the new endpoint
  UUID36,
  Ymd,
} from '@/integrations/types';

const BASE = '/availability';

/* -------------------- NEW: multi-resource query types -------------------- */

export type AvailabilitySlotsByResourcesQuery = {
  resource_ids: UUID36[];
  date: Ymd; // YYYY-MM-DD
};

export type AvailabilitySlotsByResourcesResult = Record<UUID36, ResourceSlotDto[]>;

/* -------------------- small type guards -------------------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isUuid36(v: unknown): v is UUID36 {
  return typeof v === 'string' && v.length === 36;
}

function isYmd(v: unknown): v is Ymd {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function asSlotArray(v: unknown): ResourceSlotDto[] {
  return Array.isArray(v) ? (v as ResourceSlotDto[]) : [];
}

const EMPTY_SLOTS: ResourceSlotDto[] = [];


/**
 * RTK baseQuery result is typically:
 *  - { data: unknown } or { error: FetchBaseQueryError }
 * But baseQuery is typed loosely in queryFn, so we safely narrow.
 */
type BaseQueryOk = { data: unknown };
type BaseQueryErr = { error: FetchBaseQueryError | unknown };
type BaseQueryResult = BaseQueryOk | BaseQueryErr;

function parseBaseQueryResult(x: unknown): BaseQueryResult | null {
  if (!isRecord(x)) return null;
  if ('error' in x) return { error: (x as Record<string, unknown>).error };
  if ('data' in x) return { data: (x as Record<string, unknown>).data };
  return null;
}

export const availabilityPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** PUBLIC — GET /availability/slots?resource_id=...&date=YYYY-MM-DD */
    listAvailabilitySlotsPublic: build.query<ResourceSlotDto[], AvailabilitySlotsQuery>({
      query: (params) => ({
        url: `${BASE}/slots`,
        method: 'GET',
        params,
      }),
      providesTags: (result, _error, arg) => {
        const key = `PUBSLOTS:${arg.resource_id}:${arg.date}`;
        if (!result || !Array.isArray(result)) {
          return [{ type: 'AvailabilitySlots' as const, id: key }];
        }
        return [
          ...result.map((s, idx) => ({
            type: 'AvailabilitySlots' as const,
            id: String((s as any)?.id ?? `${key}:ROW:${idx}`),
          })),
          { type: 'AvailabilitySlots' as const, id: key },
        ];
      },
    }),

    /**
     * PUBLIC (NEW) — Fan-out slots for multiple resources (no manual fetch in UI)
     * Returns: { [resource_id]: ResourceSlotDto[] }
     *
     * Internally calls:
     *   GET /availability/slots?resource_id=RID&date=YYYY-MM-DD
     * for each RID via baseQuery (✅ single-arg call, per your baseApi signature)
     */
    listAvailabilitySlotsByResourcesPublic: build.query<
      AvailabilitySlotsByResourcesResult,
      AvailabilitySlotsByResourcesQuery
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        // sanitize inputs strictly by your app types
        const ids: UUID36[] = Array.isArray(arg?.resource_ids)
          ? arg.resource_ids.filter(isUuid36)
          : [];

        const date: Ymd | null = isYmd(arg?.date) ? (arg.date as Ymd) : null;

        if (!ids.length || !date) {
          return { data: {} as AvailabilitySlotsByResourcesResult };
        }

        const pairs = await Promise.all(
          ids.map(async (rid): Promise<readonly [UUID36, ResourceSlotDto[]]> => {
            const raw = await baseQuery({
              url: `${BASE}/slots`,
              method: 'GET',
              params: { resource_id: rid, date },
            });

            const res = parseBaseQueryResult(raw);
            if (!res) return [rid, EMPTY_SLOTS] as const;

            if ('error' in res && res.error) {
              return [rid, EMPTY_SLOTS] as const;
            }

            return [rid, asSlotArray((res as BaseQueryOk).data)] as const;
          }),
        );


        const map: AvailabilitySlotsByResourcesResult = {} as AvailabilitySlotsByResourcesResult;
        for (const [rid, arr] of pairs) {
          map[rid] = arr;
        }

        return { data: map };
      },

      providesTags: (_res, _err, arg) => {
        const ids: UUID36[] = Array.isArray(arg?.resource_ids)
          ? arg.resource_ids.filter(isUuid36)
          : [];

        const dateStr = isYmd(arg?.date) ? String(arg.date) : '';
        const rootKey = `PUBSLOTS:MULTI:${dateStr}`;

        return [
          { type: 'AvailabilitySlots' as const, id: rootKey },
          ...ids.map((rid) => ({
            type: 'AvailabilitySlots' as const,
            id: `PUBSLOTS:${rid}:${dateStr}`,
          })),
        ];
      },
    }),

    /** PUBLIC — GET /availability/working-hours?resource_id=... */
    listResourceWorkingHoursPublic: build.query<ResourceWorkingHourDto[], PublicWorkingHoursQuery>({
      query: (params) => ({
        url: `${BASE}/working-hours`,
        method: 'GET',
        params,
      }),
      providesTags: (_res, _err, arg) => [
        { type: 'AvailabilityWH' as const, id: `PUBWH:${arg.resource_id}` },
      ],
    }),

    /** PUBLIC — GET /availability/weekly-plan?resource_id=...&type=therapist */
    getWeeklyPlanPublic: build.query<WeeklyPlanDayDto[], WeeklyPlanQuery>({
      query: (params) => ({
        url: `${BASE}/weekly-plan`,
        method: 'GET',
        params,
      }),
      providesTags: (_res, _err, arg) => [
        { type: 'WeeklyPlan' as const, id: `PUBWEEK:${arg.resource_id}:${arg.type ?? ''}` },
      ],
    }),

    /** PUBLIC — GET /availability?resource_id=...&date=...&time=HH:mm */
    getAvailabilityPublic: build.query<SlotAvailabilityDto, AvailabilityGetQuery>({
      query: (params) => ({
        url: `${BASE}`,
        method: 'GET',
        params,
      }),
      providesTags: (_result, _error, arg) => [
        {
          type: 'AvailabilityCheck' as const,
          id: `PUBCHK:${arg.resource_id}:${arg.date}:${arg.time}`,
        },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAvailabilitySlotsPublicQuery,
  useListAvailabilitySlotsByResourcesPublicQuery,
  useGetAvailabilityPublicQuery,
  useListResourceWorkingHoursPublicQuery,
  useGetWeeklyPlanPublicQuery,
} = availabilityPublicApi;
