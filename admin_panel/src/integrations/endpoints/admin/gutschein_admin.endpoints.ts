// =============================================================
// FILE: src/integrations/endpoints/admin/gutschein_admin.endpoints.ts
// Gutschein (Gift Card) Admin RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  GutscheinProductListResp,
  GutscheinProductDto,
  GutscheinListResp,
  GutscheinDto,
  GutscheinListQuery,
  GutscheinProductCreateBody,
  GutscheinProductUpdateBody,
  GutscheinAdminCreateBody,
  GutscheinAdminUpdateBody,
} from '@/integrations/shared';
import {
  normalizeGutscheinProductListResp,
  normalizeGutscheinProduct,
  normalizeGutscheinListResp,
  normalizeGutschein,
} from '@/integrations/shared';

const BASE_PRODUCTS = '/admin/gutschein-products';
const BASE_GUTSCHEINS = '/admin/gutscheins';

export const gutscheinAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ===== Products =====

    listGutscheinProductsAdmin: b.query<GutscheinProductListResp, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: BASE_PRODUCTS,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown) => normalizeGutscheinProductListResp(res),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((x) => ({ type: 'GutscheinProducts' as const, id: x.id })),
              { type: 'GutscheinProducts' as const, id: 'LIST' },
            ]
          : [{ type: 'GutscheinProducts' as const, id: 'LIST' }],
    }),

    getGutscheinProductAdmin: b.query<GutscheinProductDto, { id: string }>({
      query: ({ id }) => ({ url: `${BASE_PRODUCTS}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown) => normalizeGutscheinProduct(res),
      providesTags: (_r, _e, arg) => [{ type: 'GutscheinProducts' as const, id: arg.id }],
    }),

    createGutscheinProductAdmin: b.mutation<GutscheinProductDto, GutscheinProductCreateBody>({
      query: (body) => ({ url: BASE_PRODUCTS, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeGutscheinProduct(res),
      invalidatesTags: [{ type: 'GutscheinProducts' as const, id: 'LIST' }],
    }),

    updateGutscheinProductAdmin: b.mutation<GutscheinProductDto, { id: string; body: GutscheinProductUpdateBody }>({
      query: ({ id, body }) => ({
        url: `${BASE_PRODUCTS}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown) => normalizeGutscheinProduct(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'GutscheinProducts' as const, id: arg.id },
        { type: 'GutscheinProducts' as const, id: 'LIST' },
      ],
    }),

    // ===== Gutscheins =====

    listGutscheinsAdmin: b.query<GutscheinListResp, GutscheinListQuery | void>({
      query: (params) => ({
        url: BASE_GUTSCHEINS,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown) => normalizeGutscheinListResp(res),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((x) => ({ type: 'Gutscheins' as const, id: x.id })),
              { type: 'Gutscheins' as const, id: 'LIST' },
            ]
          : [{ type: 'Gutscheins' as const, id: 'LIST' }],
    }),

    getGutscheinAdmin: b.query<GutscheinDto, { id: string }>({
      query: ({ id }) => ({ url: `${BASE_GUTSCHEINS}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown) => normalizeGutschein(res),
      providesTags: (_r, _e, arg) => [{ type: 'Gutscheins' as const, id: arg.id }],
    }),

    createGutscheinAdmin: b.mutation<GutscheinDto, GutscheinAdminCreateBody>({
      query: (body) => ({ url: BASE_GUTSCHEINS, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeGutschein((res as any)?.gutschein ?? res),
      invalidatesTags: [{ type: 'Gutscheins' as const, id: 'LIST' }],
    }),

    updateGutscheinAdmin: b.mutation<GutscheinDto, { id: string; body: GutscheinAdminUpdateBody }>({
      query: ({ id, body }) => ({
        url: `${BASE_GUTSCHEINS}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown) => normalizeGutschein(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Gutscheins' as const, id: arg.id },
        { type: 'Gutscheins' as const, id: 'LIST' },
      ],
    }),

    cancelGutscheinAdmin: b.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE_GUTSCHEINS}/${encodeURIComponent(id)}/cancel`,
        method: 'POST',
      }),
      transformResponse: (res: unknown) => ({ success: (res as any)?.success === true || true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Gutscheins' as const, id: arg.id },
        { type: 'Gutscheins' as const, id: 'LIST' },
      ],
    }),

    activateGutscheinAdmin: b.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE_GUTSCHEINS}/${encodeURIComponent(id)}/activate`,
        method: 'POST',
      }),
      transformResponse: (res: unknown) => ({ success: (res as any)?.success === true || true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Gutscheins' as const, id: arg.id },
        { type: 'Gutscheins' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListGutscheinProductsAdminQuery,
  useGetGutscheinProductAdminQuery,
  useCreateGutscheinProductAdminMutation,
  useUpdateGutscheinProductAdminMutation,
  useListGutscheinsAdminQuery,
  useGetGutscheinAdminQuery,
  useCreateGutscheinAdminMutation,
  useUpdateGutscheinAdminMutation,
  useCancelGutscheinAdminMutation,
  useActivateGutscheinAdminMutation,
} = gutscheinAdminApi;
