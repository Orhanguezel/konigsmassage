// =============================================================
// FILE: src/integrations/rtk/endpoints/footer_sections.endpoints.ts
// konigsmassage – Public Footer Sections RTK endpoints
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ApiFooterSection,
  FooterSectionDto,
  FooterSectionListQueryParams,
} from '@/integrations/types';

const asStr = (v: unknown): string => (typeof v === 'string' ? v : String(v ?? ''));

const isTrue = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

/**
 * Backend'den gelen merged row'u frontend DTO'ya çevir
 */
const normalizeFooterSection = (r: ApiFooterSection): FooterSectionDto => ({
  id: asStr(r.id),
  is_active: isTrue(r.is_active),
  display_order: typeof r.display_order === 'number' ? r.display_order : 0,
  created_at: asStr(r.created_at),
  updated_at: asStr(r.updated_at),
  title: r.title ?? '',
  slug: r.slug ?? '',
  description: r.description ?? null,
  locale: r.locale_resolved ?? null,
});

export const footerSectionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /footer_sections
     * Query: FooterSectionListQueryParams
     * Body: FooterSectionDto[]
     */
    listFooterSections: build.query<FooterSectionDto[], FooterSectionListQueryParams | void>({
      query: (params?: FooterSectionListQueryParams) => ({
        url: '/footer_sections',
        method: 'GET',
        params,
      }),
      transformResponse: (response: ApiFooterSection[]) =>
        (response || []).map(normalizeFooterSection),
    }),

    /**
     * GET /footer_sections/:id
     */
    getFooterSection: build.query<FooterSectionDto, string>({
      query: (id) => ({
        url: `/footer_sections/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
    }),

    /**
     * GET /footer_sections/by-slug/:slug
     */
    getFooterSectionBySlug: build.query<FooterSectionDto, string>({
      query: (slug) => ({
        url: `/footer_sections/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListFooterSectionsQuery,
  useGetFooterSectionQuery,
  useGetFooterSectionBySlugQuery,
} = footerSectionsApi;
