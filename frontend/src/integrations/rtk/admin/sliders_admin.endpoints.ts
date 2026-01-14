// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/sliders_admin.endpoints.ts
// FIXED – Fully locale-aware (BaseID + locale)
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';

import type {
  ApiSliderAdmin,
  SliderAdminDto,
  SliderAdminListQueryParams,
  SliderCreatePayload,
  SliderUpdatePayload,
  SliderReorderPayload,
  SliderSetStatusPayload,
  SliderSetImagePayload,
} from '@/integrations/types';
import { normalizeSliderAdmin } from '@/integrations/types';

const cleanParams = (
  params?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined => {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v))) {
      continue;
    }
    out[k] =
      typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string' ? v : String(v);
  }

  return Object.keys(out).length ? out : undefined;
};

export const slidersAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSlidersAdmin: build.query<SliderAdminDto[], SliderAdminListQueryParams | void>({
      query: (params) => ({
        url: '/admin/sliders',
        method: 'GET',
        params: cleanParams(params as Record<string, unknown>),
      }),
      transformResponse: (response: ApiSliderAdmin[]) =>
        Array.isArray(response) ? response.map(normalizeSliderAdmin) : [],
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((r) => ({
                type: 'Sliders' as const,
                id: r.id,
              })),
              { type: 'Sliders' as const, id: 'LIST' },
            ]
          : [{ type: 'Sliders' as const, id: 'LIST' }],
    }),

    getSliderAdmin: build.query<SliderAdminDto, { id: number | string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/admin/sliders/${encodeURIComponent(id)}`,
        method: 'GET',
        params: cleanParams(locale ? { locale } : undefined),
      }),
      transformResponse: normalizeSliderAdmin,
      providesTags: (_res, _err, arg) => [{ type: 'Sliders' as const, id: String(arg.id) }],
    }),

    createSliderAdmin: build.mutation<SliderAdminDto, SliderCreatePayload>({
      query: (body) => ({
        url: '/admin/sliders',
        method: 'POST',
        body,
      }),
      transformResponse: normalizeSliderAdmin,
      invalidatesTags: [{ type: 'Sliders' as const, id: 'LIST' }],
    }),

    updateSliderAdmin: build.mutation<
      SliderAdminDto,
      { id: number | string; patch: SliderUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/sliders/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: normalizeSliderAdmin,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Sliders' as const, id: String(arg.id) },
        { type: 'Sliders' as const, id: 'LIST' },
      ],
    }),

    deleteSliderAdmin: build.mutation<void, number | string>({
      query: (id) => ({
        url: `/admin/sliders/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Sliders' as const, id: String(id) },
        { type: 'Sliders' as const, id: 'LIST' },
      ],
    }),

    reorderSlidersAdmin: build.mutation<{ ok: boolean }, SliderReorderPayload>({
      query: (body) => ({
        url: '/admin/sliders/reorder',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Sliders' as const, id: 'LIST' }],
    }),

    setSliderStatusAdmin: build.mutation<
      SliderAdminDto,
      { id: number | string; payload: SliderSetStatusPayload }
    >({
      query: ({ id, payload }) => ({
        url: `/admin/sliders/${encodeURIComponent(id)}/status`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: normalizeSliderAdmin,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Sliders' as const, id: String(arg.id) },
        { type: 'Sliders' as const, id: 'LIST' },
      ],
    }),

    setSliderImageAdmin: build.mutation<
      SliderAdminDto,
      { id: number | string; payload: SliderSetImagePayload }
    >({
      query: ({ id, payload }) => ({
        url: `/admin/sliders/${encodeURIComponent(id)}/image`,
        method: 'PATCH',
        body: payload,
      }),
      transformResponse: normalizeSliderAdmin,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Sliders' as const, id: String(arg.id) },
        { type: 'Sliders' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListSlidersAdminQuery,
  useLazyListSlidersAdminQuery,
  useGetSliderAdminQuery,
  useLazyGetSliderAdminQuery,
  useCreateSliderAdminMutation,
  useUpdateSliderAdminMutation,
  useDeleteSliderAdminMutation,
  useReorderSlidersAdminMutation,
  useSetSliderStatusAdminMutation,
  useSetSliderImageAdminMutation,
} = slidersAdminApi;
