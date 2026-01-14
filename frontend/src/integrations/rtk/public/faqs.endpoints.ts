// =============================================================
// FILE: src/integrations/rtk/endpoints/faqs.endpoints.ts
// Public (auth'suz) FAQ endpoint'leri – locale header destekli
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { FaqDto, FaqListQueryParams } from '@/integrations/types';

// RTK query paramlarını temizlemek için (admin pattern'i gibi)
const cleanParams = (params?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!params) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
};

// Locale varsa header'a bas
const makeLocaleHeaders = (locale?: string) =>
  locale
    ? {
        'x-locale': locale,
        'Accept-Language': locale,
      }
    : undefined;

type FaqListWithLocale = FaqListQueryParams & { locale?: string };

export const faqsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /faqs – liste (public) */
    listFaqs: builder.query<FaqDto[], FaqListWithLocale | void>({
      query: (params) => {
        const p = (params || {}) as FaqListWithLocale;
        const { locale, ...rest } = p;

        return {
          url: '/faqs',
          method: 'GET',
          // backend schema sadece is_active, sort, orderDir, limit vs.
          // kabul ediyorsa sorun çıkmasın diye locale'i param'dan çıkarıyoruz
          params: cleanParams(rest),
          headers: makeLocaleHeaders(locale),
        };
      },
    }),

    /** GET /faqs/:id – tek kayıt (public) */
    getFaq: builder.query<FaqDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/faqs/${id}`,
        method: 'GET',
        headers: makeLocaleHeaders(locale),
      }),
    }),

    /** GET /faqs/by-slug/:slug – slug ile tek kayıt (public) */
    getFaqBySlug: builder.query<FaqDto, { slug: string; locale?: string }>({
      query: ({ slug, locale }) => ({
        url: `/faqs/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        headers: makeLocaleHeaders(locale),
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useListFaqsQuery, useGetFaqQuery, useGetFaqBySlugQuery } = faqsApi;
