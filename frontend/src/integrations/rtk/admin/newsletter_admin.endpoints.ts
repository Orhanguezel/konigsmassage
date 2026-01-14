// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/newsletter_admin.endpoints.ts
// Admin Newsletter: liste / get / update / delete
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  NewsletterAdminDto,
  NewsletterListQueryParams,
  NewsletterAdminUpdatePayload,
} from '@/integrations/types';

export const newsletterAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /admin/newsletter
     */
    listNewsletterAdmin: build.query<NewsletterAdminDto[], NewsletterListQueryParams | void>({
      query: (params?: NewsletterListQueryParams) => ({
        url: '/admin/newsletter',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((row) => ({
                type: 'Newsletter' as const,
                id: row.id,
              })),
              { type: 'Newsletter' as const, id: 'LIST' },
            ]
          : [{ type: 'Newsletter' as const, id: 'LIST' }],
    }),

    /**
     * GET /admin/newsletter/:id
     */
    getNewsletterAdmin: build.query<NewsletterAdminDto, string>({
      query: (id) => ({
        url: `/admin/newsletter/${id}`,
        method: 'GET',
      }),
      providesTags: (_res, _err, id) => [{ type: 'Newsletter' as const, id }],
    }),

    /**
     * PATCH /admin/newsletter/:id
     */
    updateNewsletterAdmin: build.mutation<
      NewsletterAdminDto,
      { id: string; patch: NewsletterAdminUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/newsletter/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Newsletter' as const, id },
        { type: 'Newsletter' as const, id: 'LIST' },
      ],
    }),

    /**
     * DELETE /admin/newsletter/:id
     * Backend 204 No Content dönüyor → result: void
     */
    deleteNewsletterAdmin: build.mutation<void, string>({
      query: (id) => ({
        url: `/admin/newsletter/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Newsletter' as const, id },
        { type: 'Newsletter' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListNewsletterAdminQuery,
  useGetNewsletterAdminQuery,
  useUpdateNewsletterAdminMutation,
  useDeleteNewsletterAdminMutation,
} = newsletterAdminApi;
