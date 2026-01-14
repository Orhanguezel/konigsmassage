// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/footer_sections_admin.endpoints.ts
// konigsmassage – Admin Footer Sections RTK endpoints (FIXED)
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ApiFooterSection,
  FooterSectionDto,
  FooterSectionListQueryParams,
  FooterSectionListResult,
  FooterSectionCreatePayload,
  FooterSectionUpdatePayload,
} from '@/integrations/types';

const asStr = (v: unknown): string => (typeof v === 'string' ? v : String(v ?? ''));
const isTrue = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';
const toNum = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

const normalizeFooterSection = (r: ApiFooterSection): FooterSectionDto => ({
  id: asStr((r as any).id),
  is_active: isTrue((r as any).is_active),
  display_order: toNum((r as any).display_order, 0),
  created_at: asStr((r as any).created_at),
  updated_at: asStr((r as any).updated_at),
  title: (r as any).title ?? '',
  slug: (r as any).slug ?? '',
  description: (r as any).description ?? null,
  locale: ((r as any).locale_resolved ?? (r as any).locale ?? null) as any,
});

function stableKey(params?: FooterSectionListQueryParams | void) {
  if (!params) return 'list:{}';
  const p = params as FooterSectionListQueryParams;

  const locale = (p as any).locale ?? '';
  const q = (p as any).q ?? '';
  const sort = (p as any).sort ?? '';
  const orderDir = (p as any).orderDir ?? '';
  const limit = typeof (p as any).limit === 'number' ? String((p as any).limit) : '';
  const offset = typeof (p as any).offset === 'number' ? String((p as any).offset) : '';

  return `list:{locale=${locale}|q=${q}|sort=${sort}|orderDir=${orderDir}|limit=${limit}|offset=${offset}}`;
}

export type GetFooterSectionAdminArg = {
  id: string;
  locale?: string; // optional
};

export const footerSectionsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listFooterSectionsAdmin: build.query<
      FooterSectionListResult,
      FooterSectionListQueryParams | void
    >({
      query: (params?: FooterSectionListQueryParams) => ({
        url: '/admin/footer_sections',
        method: 'GET',
        params,
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${stableKey(queryArgs as any)}`,
      forceRefetch: ({ currentArg, previousArg }) =>
        stableKey(currentArg as any) !== stableKey(previousArg as any),
      transformResponse: (response: ApiFooterSection[], meta): FooterSectionListResult => {
        const items = (response || []).map(normalizeFooterSection);
        const header = meta?.response?.headers.get('x-total-count');
        const total = header != null ? Number(header) || items.length : items.length;
        return { items, total };
      },
      providesTags: (result, _err, arg) => {
        const loc = (arg as any)?.locale ?? '';
        return result?.items?.length
          ? [
              ...result.items.map((x) => ({ type: 'FooterSections' as const, id: x.id })),
              { type: 'FooterSections' as const, id: `LIST:${loc}` },
            ]
          : [{ type: 'FooterSections' as const, id: `LIST:${loc}` }];
      },
    }),

    /**
     * ✅ FIXED: GET /admin/footer_sections/:id (locale aware)
     * supports: /admin/footer_sections/:id?locale=tr
     */
    getFooterSectionAdmin: build.query<FooterSectionDto, GetFooterSectionAdminArg>({
      query: ({ id, locale }) => ({
        url: `/admin/footer_sections/${encodeURIComponent(id)}`,
        method: 'GET',
        params: locale ? { locale } : undefined,
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
      providesTags: (_r, _e, arg) => [{ type: 'FooterSections', id: String(arg.id) }],
    }),

    getFooterSectionBySlugAdmin: build.query<FooterSectionDto, string>({
      query: (slug) => ({
        url: `/admin/footer_sections/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
      providesTags: (_r, _e, slug) => [{ type: 'FooterSectionsBySlug', id: slug }],
    }),

    createFooterSectionAdmin: build.mutation<FooterSectionDto, FooterSectionCreatePayload>({
      query: (body) => ({
        url: '/admin/footer_sections',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'FooterSections', id: `LIST:${(arg as any)?.locale ?? ''}` },
        { type: 'FooterSections', id: 'LIST:' },
      ],
    }),

    updateFooterSectionAdmin: build.mutation<
      FooterSectionDto,
      { id: string; data: FooterSectionUpdatePayload }
    >({
      query: ({ id, data }) => ({
        url: `/admin/footer_sections/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
      invalidatesTags: (_r, _e, arg) => {
        const loc = (arg as any)?.data?.locale ?? '';
        return [
          { type: 'FooterSections', id: arg.id },
          { type: 'FooterSections', id: `LIST:${loc}` },
          { type: 'FooterSections', id: 'LIST:' },
        ];
      },
    }),

    deleteFooterSectionAdmin: build.mutation<void, string>({
      query: (id) => ({
        url: `/admin/footer_sections/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'FooterSections', id },
        { type: 'FooterSections', id: 'LIST:' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListFooterSectionsAdminQuery,

  // ✅ now object arg
  useGetFooterSectionAdminQuery,
  useLazyGetFooterSectionAdminQuery,

  useGetFooterSectionBySlugAdminQuery,
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
} = footerSectionsAdminApi;
