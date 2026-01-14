// =============================================================
// FILE: src/integrations/rtk/endpoints/sliders.endpoints.ts
// FIXED – Public Slider endpoints
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';

import type {
  ApiSliderPublic,
  SliderPublicDto,
  SliderPublicListQueryParams,
  SliderPublicDetailQuery,
} from '@/integrations/types';
import { normalizeSliderPublic } from '@/integrations/types';

const cleanParams = (
  params?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined => {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v)))
      continue;

    out[k] =
      typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string' ? v : String(v);
  }

  return Object.keys(out).length ? out : undefined;
};

export const slidersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSliders: build.query<SliderPublicDto[], SliderPublicListQueryParams | void>({
      query: (params) => ({
        url: '/sliders',
        method: 'GET',
        params: cleanParams(params as Record<string, unknown>),
      }),
      transformResponse: (response: ApiSliderPublic[]) =>
        Array.isArray(response) ? response.map(normalizeSliderPublic) : [],
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((r) => ({
                type: 'Sliders' as const,
                id: r.id,
              })),
              { type: 'Sliders' as const, id: 'LIST_PUBLIC' },
            ]
          : [{ type: 'Sliders' as const, id: 'LIST_PUBLIC' }],
    }),

    getSliderPublic: build.query<SliderPublicDto, SliderPublicDetailQuery>({
      query: ({ slug, locale }) => ({
        url: `/sliders/${encodeURIComponent(slug)}`,
        method: 'GET',
        params: cleanParams(locale ? { locale } : undefined),
      }),
      transformResponse: normalizeSliderPublic,
      providesTags: (res) =>
        res
          ? [{ type: 'Sliders' as const, id: res.id }]
          : [{ type: 'Sliders' as const, id: 'DETAIL_PUBLIC' }],
    }),
  }),
  overrideExisting: false,
});

export const { useListSlidersQuery, useGetSliderPublicQuery } = slidersApi;
