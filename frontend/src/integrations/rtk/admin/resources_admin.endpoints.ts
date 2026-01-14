// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/resources_admin.endpoints.ts
// FINAL — Admin resources – CRUD
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ResourceAdminListItemDto,
  ResourceRowDto,
  ResourcesAdminListQueryParams,
  ResourceAdminCreatePayload,
  ResourceAdminUpdatePayload,
} from '@/integrations/types/resources.types';

const BASE = '/admin/resources';

export const resourcesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * LIST (admin) – GET /admin/resources
     */
    listResourcesAdmin: build.query<
      ResourceAdminListItemDto[],
      ResourcesAdminListQueryParams | void
    >({
      query: (params?: ResourcesAdminListQueryParams) => ({
        url: `${BASE}`,
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'Resources' as const, id: r.id })),
              { type: 'Resources' as const, id: 'LIST' },
            ]
          : [{ type: 'Resources' as const, id: 'LIST' }],
    }),

    /**
     * GET BY ID (admin) – GET /admin/resources/:id
     */
    getResourceAdmin: build.query<ResourceRowDto, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Resources' as const, id }],
    }),

    /**
     * CREATE (admin) – POST /admin/resources
     */
    createResourceAdmin: build.mutation<ResourceRowDto | null, ResourceAdminCreatePayload>({
      query: (body) => ({
        url: `${BASE}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) => [
        { type: 'Resources' as const, id: 'LIST' },
        { type: 'Resources' as const, id: 'PUBLIC_LIST' },
        ...(result?.id ? [{ type: 'Resources' as const, id: result.id }] : []),
      ],
    }),

    /**
     * UPDATE (admin) – PATCH /admin/resources/:id
     */
    updateResourceAdmin: build.mutation<
      ResourceRowDto | null,
      { id: string; patch: ResourceAdminUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `${BASE}/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Resources' as const, id: arg.id },
        { type: 'Resources' as const, id: 'LIST' },
        { type: 'Resources' as const, id: 'PUBLIC_LIST' },
      ],
    }),

    /**
     * DELETE (admin) – DELETE /admin/resources/:id
     */
    deleteResourceAdmin: build.mutation<void, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Resources' as const, id },
        { type: 'Resources' as const, id: 'LIST' },
        { type: 'Resources' as const, id: 'PUBLIC_LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListResourcesAdminQuery,
  useGetResourceAdminQuery,
  useCreateResourceAdminMutation,
  useUpdateResourceAdminMutation,
  useDeleteResourceAdminMutation,
} = resourcesAdminApi;
