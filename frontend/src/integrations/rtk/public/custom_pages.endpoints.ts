// =============================================================
// FILE: src/integrations/rtk/endpoints/custom_pages.endpoints.ts
// konigsmassage – Custom Pages Public RTK Endpoints (FINAL)
// Backend: src/modules/customPages/router.ts
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ApiCustomPage,
  CustomPageDto,
  CustomPageListPublicQueryParams,
} from '@/integrations/types';
import { mapApiCustomPageToDto } from '@/integrations/types';

const cleanParams = (
  params?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined => {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v))) {
      continue;
    }
    if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') out[k] = v;
    else out[k] = String(v);
  }
  return Object.keys(out).length ? out : undefined;
};

const getTotalFromHeaders = (headers: Headers | undefined, fallbackLength: number): number => {
  const headerValue = headers?.get('x-total-count') ?? headers?.get('X-Total-Count');
  if (!headerValue) return fallbackLength;
  const n = Number(headerValue);
  return Number.isFinite(n) && n >= 0 ? n : fallbackLength;
};

const normalizeList = (raw: unknown): ApiCustomPage[] => {
  if (Array.isArray(raw)) return raw as ApiCustomPage[];
  const anyRaw: any = raw as any;
  if (anyRaw && Array.isArray(anyRaw.items)) return anyRaw.items as ApiCustomPage[];
  return [];
};

export type CustomPageBySlugArgs = {
  slug: string;
  locale?: string;
  default_locale?: string;
};

export const customPagesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCustomPagesPublic: build.query<
      { items: CustomPageDto[]; total: number },
      CustomPageListPublicQueryParams | void
    >({
      query: (params) => ({
        url: '/custom_pages',
        method: 'GET',
        params: cleanParams(params as any),
      }),
      transformResponse: (response: unknown, meta) => {
        const rows = normalizeList(response);
        const total = getTotalFromHeaders(meta?.response?.headers, rows.length);
        return { items: rows.map(mapApiCustomPageToDto), total };
      },
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((p) => ({ type: 'CustomPage' as const, id: p.id })),
              { type: 'CustomPage' as const, id: 'PUBLIC_LIST' },
            ]
          : [{ type: 'CustomPage' as const, id: 'PUBLIC_LIST' }],
    }),

    getCustomPagePublic: build.query<
      CustomPageDto,
      { id: string; locale?: string; default_locale?: string }
    >({
      query: ({ id, locale, default_locale }) => ({
        url: `/custom_pages/${encodeURIComponent(id)}`,
        method: 'GET',
        params: cleanParams({ locale, default_locale }),
      }),
      transformResponse: (response: ApiCustomPage) => mapApiCustomPageToDto(response),
      providesTags: (_result, _error, { id }) => [{ type: 'CustomPage' as const, id }],
    }),

    getCustomPageBySlugPublic: build.query<CustomPageDto, CustomPageBySlugArgs>({
      query: ({ slug, locale, default_locale }) => ({
        url: `/custom_pages/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        params: cleanParams({ locale, default_locale }),
      }),
      transformResponse: (response: ApiCustomPage) => mapApiCustomPageToDto(response),
      providesTags: (_result, _error, args) => [{ type: 'CustomPageSlug' as const, id: args.slug }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCustomPagesPublicQuery,
  useGetCustomPagePublicQuery,
  useGetCustomPageBySlugPublicQuery,
} = customPagesPublicApi;
