// =============================================================
// FILE: src/integrations/rtk/endpoints/services.public.endpoints.ts
// konigsmassage – Public Services (Hizmetler) RTK Endpoints (NO CATEGORY)
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ApiServiceBase,
  ApiServicePublic,
  ApiServiceImage,
  ServiceDto,
  ServiceImageDto,
  ServiceListPublicQueryParams,
  ServiceListResult,
} from '@/integrations/types';

const normalizeService = (
  row: ApiServiceBase & { featured_image_url?: string | null },
): ServiceDto => ({
  id: row.id,
  type: row.type,

  featured: row.featured === 1,
  is_active: row.is_active === 1,
  display_order: row.display_order,

  featured_image: row.featured_image,
  image_url: row.image_url,
  image_asset_id: row.image_asset_id,

  featured_image_url:
    typeof row.featured_image_url !== 'undefined' ? row.featured_image_url : undefined,

  // tip spesifik non-i18n alanlar
  area: row.area,
  duration: row.duration,
  maintenance: row.maintenance,
  season: row.season,
  equipment: row.equipment,

  created_at: row.created_at,
  updated_at: row.updated_at,

  // i18n coalesced alanlar
  slug: row.slug,
  name: row.name,
  description: row.description,
  material: row.material,
  price: row.price,
  includes: row.includes,
  warranty: row.warranty,
  image_alt: row.image_alt,

  // SEO + tags
  tags: row.tags,
  meta_title: row.meta_title,
  meta_description: row.meta_description,
  meta_keywords: row.meta_keywords,

  locale_resolved: row.locale_resolved,
});

const normalizeServiceImage = (row: ApiServiceImage): ServiceImageDto => ({
  id: row.id,
  service_id: row.service_id,
  image_asset_id: row.image_asset_id,
  image_url: row.image_url,
  is_active: row.is_active === 1,
  display_order: row.display_order,
  created_at: row.created_at,
  updated_at: row.updated_at,
  title: row.title,
  alt: row.alt,
  caption: row.caption,
  locale_resolved: row.locale_resolved,
});

export const servicesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ---------------------------------------------------------
     * GET /services
     * Public liste – x-total-count header'ı ile toplam
     * --------------------------------------------------------- */
    listServicesPublic: build.query<ServiceListResult, ServiceListPublicQueryParams | void>({
      query: (params?: ServiceListPublicQueryParams) => ({
        url: '/services',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (response: ApiServicePublic[], meta) => {
        const items = Array.isArray(response) ? response.map((row) => normalizeService(row)) : [];

        const totalHeader = meta?.response?.headers.get('x-total-count');
        const totalFromHeader = totalHeader ? Number(totalHeader) : Number.NaN;
        const total = Number.isFinite(totalFromHeader) ? totalFromHeader : items.length;

        return { items, total };
      },
    }),

    /* ---------------------------------------------------------
     * GET /services/:id
     * --------------------------------------------------------- */
    getServiceByIdPublic: build.query<
      ServiceDto,
      { id: string; locale?: string; default_locale?: string }
    >({
      query: ({ id, locale, default_locale }) => ({
        url: `/services/${encodeURIComponent(id)}`,
        method: 'GET',
        params: { locale, default_locale },
      }),
      transformResponse: (resp: ApiServicePublic) => normalizeService(resp),
    }),

    /* ---------------------------------------------------------
     * GET /services/by-slug/:slug
     * --------------------------------------------------------- */
    getServiceBySlugPublic: build.query<
      ServiceDto,
      { slug: string; locale?: string; default_locale?: string }
    >({
      query: ({ slug, locale, default_locale }) => ({
        url: `/services/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        params: { locale, default_locale },
      }),
      transformResponse: (resp: ApiServicePublic) => normalizeService(resp),
    }),

    /* ---------------------------------------------------------
     * GET /services/:id/images
     * --------------------------------------------------------- */
    listServiceImagesPublic: build.query<
      ServiceImageDto[],
      { serviceId: string; locale?: string; default_locale?: string }
    >({
      query: ({ serviceId, locale, default_locale }) => ({
        url: `/services/${encodeURIComponent(serviceId)}/images`,
        method: 'GET',
        params: { locale, default_locale },
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map((row) => normalizeServiceImage(row)) : [],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListServicesPublicQuery,
  useGetServiceByIdPublicQuery,
  useGetServiceBySlugPublicQuery,
  useListServiceImagesPublicQuery,
} = servicesPublicApi;
