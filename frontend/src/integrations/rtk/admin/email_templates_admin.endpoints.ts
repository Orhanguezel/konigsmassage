// ===================================================================
// FILE: src/integrations/rtk/endpoints/admin/email_templates_admin.endpoints.ts
// Email Templates – ADMIN RTK endpoints (/admin/email_templates…)
// ===================================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  EmailTemplateAdminListItemDto,
  EmailTemplateAdminDetailDto,
  EmailTemplateAdminListQueryParams,
  EmailTemplateAdminCreatePayload,
  EmailTemplateAdminUpdateArgs,
} from '@/integrations/types';

type WithLocale<T> = T & { locale?: string | null };

/**
 * Query paramlarından undefined / null / "" değerleri temizler
 */
const cleanParams = (params?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!params) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
};

/**
 * Locale varsa hem x-locale hem Accept-Language header'ını set et.
 */
const makeLocaleHeaders = (locale?: string | null) =>
  locale
    ? {
        'x-locale': locale,
        'Accept-Language': locale,
      }
    : undefined;

export const emailTemplatesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /admin/email_templates
     * Query: { q?, locale?, is_active? }
     * Backend: listEmailTemplatesAdmin
     */
    listEmailTemplatesAdmin: build.query<
      EmailTemplateAdminListItemDto[],
      WithLocale<EmailTemplateAdminListQueryParams> | void
    >({
      query: (params) => {
        const p = (params || {}) as WithLocale<EmailTemplateAdminListQueryParams>;
        const { locale, ...rest } = p;

        return {
          url: '/admin/email_templates',
          method: 'GET',
          params: cleanParams({ ...rest, locale }),
          headers: makeLocaleHeaders(locale),
        };
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'EmailTemplate' as const, id: 'LIST' },
              ...result.map((r) => ({
                type: 'EmailTemplate' as const,
                id: r.id,
              })),
            ]
          : [{ type: 'EmailTemplate' as const, id: 'LIST' }],
    }),

    /**
     * GET /admin/email_templates/:id
     * Detail: parent + translations[]
     * Backend: getEmailTemplateAdmin
     * (backend tüm dilleri döndürüyor, burada locale'e gerek yok)
     */
    getEmailTemplateAdmin: build.query<EmailTemplateAdminDetailDto, string>({
      query: (id) => ({
        url: `/admin/email_templates/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _err, id) => [{ type: 'EmailTemplate' as const, id }],
    }),

    /**
     * POST /admin/email_templates
     * Body: EmailTemplateAdminCreatePayload
     * Backend: createEmailTemplateAdmin
     */
    createEmailTemplateAdmin: build.mutation<
      EmailTemplateAdminDetailDto,
      EmailTemplateAdminCreatePayload
    >({
      query: (body) => ({
        url: '/admin/email_templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'EmailTemplate' as const, id: 'LIST' }],
    }),

    /**
     * PATCH /admin/email_templates/:id
     * Body: EmailTemplateAdminUpdatePayload
     * Backend: updateEmailTemplateAdmin
     */
    updateEmailTemplateAdmin: build.mutation<
      EmailTemplateAdminDetailDto,
      EmailTemplateAdminUpdateArgs
    >({
      query: ({ id, patch }) => ({
        url: `/admin/email_templates/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'EmailTemplate' as const, id: 'LIST' },
              { type: 'EmailTemplate' as const, id: result.id },
            ]
          : [{ type: 'EmailTemplate' as const, id: 'LIST' }],
    }),

    /**
     * DELETE /admin/email_templates/:id
     * 204 No Content
     * Backend: deleteEmailTemplateAdmin
     */
    deleteEmailTemplateAdmin: build.mutation<void, string>({
      query: (id) => ({
        url: `/admin/email_templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'EmailTemplate' as const, id: 'LIST' },
        { type: 'EmailTemplate' as const, id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListEmailTemplatesAdminQuery,
  useLazyListEmailTemplatesAdminQuery,
  useGetEmailTemplateAdminQuery,
  useLazyGetEmailTemplateAdminQuery,
  useCreateEmailTemplateAdminMutation,
  useUpdateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
} = emailTemplatesAdminApi;
