// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/services_admin.endpoints.ts
// konigsmassage – Admin Services RTK Endpoints (NO CATEGORY)
// - listServicesAdmin returns ServiceListResult { items, total }
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ApiServiceAdmin,
  ApiServiceImage,
  ServiceDto,
  ServiceImageDto,
  ServiceListAdminQueryParams,
  ServiceListResult,
  ServiceCreatePayload,
  ServiceUpdatePayload,
  ServiceImageCreatePayload,
  ServiceImageUpdatePayload,
} from '@/integrations/types';

import { normalizeService, normalizeServiceImage } from '@/integrations/types';


export const servicesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---------------------------------------------------------
    // GET /admin/services (x-total-count header)
    // ---------------------------------------------------------
    listServicesAdmin: build.query<ServiceListResult, ServiceListAdminQueryParams | void>({
      query: (params) => ({
        url: '/admin/services',
        method: 'GET',
        params: params ?? {},
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceAdmin[], meta) => {
        const items = Array.isArray(response) ? response.map(normalizeService) : [];

        const totalHeader = meta?.response?.headers.get('x-total-count');
        const totalFromHeader = totalHeader ? Number(totalHeader) : Number.NaN;
        const total = Number.isFinite(totalFromHeader) ? totalFromHeader : items.length;

        return { items, total };
      },
    }),

    // ---------------------------------------------------------
    // GET /admin/services/:id
    // ---------------------------------------------------------
    getServiceAdmin: build.query<ServiceDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/admin/services/${encodeURIComponent(id)}`,
        method: 'GET',
        credentials: 'include',
        params: locale ? { locale } : undefined,
      }),
      transformResponse: (resp: ApiServiceAdmin) => normalizeService(resp),
    }),

    // ---------------------------------------------------------
    // GET /admin/services/by-slug/:slug
    // ---------------------------------------------------------
    getServiceBySlugAdmin: build.query<ServiceDto, string>({
      query: (slug) => ({
        url: `/admin/services/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        credentials: 'include',
      }),
      transformResponse: (resp: ApiServiceAdmin) => normalizeService(resp),
    }),

    // ---------------------------------------------------------
    // POST /admin/services
    // ---------------------------------------------------------
    createServiceAdmin: build.mutation<ServiceDto, ServiceCreatePayload>({
      query: (body) => ({
        url: '/admin/services',
        method: 'POST',
        body,
        credentials: 'include',
      }),
      transformResponse: (resp: ApiServiceAdmin) => normalizeService(resp),
    }),

    // ---------------------------------------------------------
    // PATCH /admin/services/:id
    // ---------------------------------------------------------
    updateServiceAdmin: build.mutation<ServiceDto, { id: string; patch: ServiceUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/services/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      transformResponse: (resp: ApiServiceAdmin) => normalizeService(resp),
    }),

    // ---------------------------------------------------------
    // DELETE /admin/services/:id
    // ---------------------------------------------------------
    deleteServiceAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/services/${encodeURIComponent(id)}`,
        method: 'DELETE',
        credentials: 'include',
      }),
    }),

    // ---------------------------------------------------------
    // REORDER: POST /admin/services/reorder
    // ---------------------------------------------------------
    reorderServicesAdmin: build.mutation<void, { items: { id: string; display_order: number }[] }>({
      query: (body) => ({
        url: '/admin/services/reorder',
        method: 'POST',
        body,
        credentials: 'include',
      }),
    }),

    // ---------------------------------------------------------
    // GALLERY – LIST
    // ---------------------------------------------------------
    listServiceImagesAdmin: build.query<ServiceImageDto[], string>({
      query: (serviceId) => ({
        url: `/admin/services/${encodeURIComponent(serviceId)}/images`,
        method: 'GET',
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
    }),

    // ---------------------------------------------------------
    // GALLERY – CREATE (returns list)
    // ---------------------------------------------------------
    createServiceImageAdmin: build.mutation<
      ServiceImageDto[],
      { serviceId: string; payload: ServiceImageCreatePayload }
    >({
      query: ({ serviceId, payload }) => ({
        url: `/admin/services/${encodeURIComponent(serviceId)}/images`,
        method: 'POST',
        body: payload,
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
    }),

    // ---------------------------------------------------------
    // GALLERY – UPDATE (returns list)
    // ---------------------------------------------------------
    updateServiceImageAdmin: build.mutation<
      ServiceImageDto[],
      { serviceId: string; imageId: string; patch: ServiceImageUpdatePayload }
    >({
      query: ({ serviceId, imageId, patch }) => ({
        url: `/admin/services/${encodeURIComponent(serviceId)}/images/${encodeURIComponent(
          imageId,
        )}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
    }),

    // ---------------------------------------------------------
    // GALLERY – DELETE (returns list)
    // ---------------------------------------------------------
    deleteServiceImageAdmin: build.mutation<
      ServiceImageDto[],
      { serviceId: string; imageId: string }
    >({
      query: ({ serviceId, imageId }) => ({
        url: `/admin/services/${encodeURIComponent(serviceId)}/images/${encodeURIComponent(
          imageId,
        )}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListServicesAdminQuery,
  useLazyListServicesAdminQuery,
  useGetServiceAdminQuery,
  useGetServiceBySlugAdminQuery,
  useCreateServiceAdminMutation,
  useUpdateServiceAdminMutation,
  useDeleteServiceAdminMutation,
  useReorderServicesAdminMutation,
  useListServiceImagesAdminQuery,
  useCreateServiceImageAdminMutation,
  useUpdateServiceImageAdminMutation,
  useDeleteServiceImageAdminMutation,
} = servicesAdminApi;
