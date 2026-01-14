// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/site_settings_admin.endpoints.ts
// konigsmassage – Admin Site Settings RTK (aligned with BE routes)
//  - Base: /site-settings (hyphen)
//  - Legacy: /site_settings (underscore) exists in BE, but FE uses BASE.
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  SiteSettingRow,
  SettingValue,
  AppLocaleMeta,
  DefaultLocaleMeta,
} from '@/integrations/types';

/** PUBLIC ile çakışmasın diye */
export type AdminSiteSetting = SiteSettingRow;

export type ListParams = {
  q?: string;
  keys?: string[]; // FE array, BE expects comma-separated string
  prefix?: string;
  limit?: number;
  offset?: number;
  sort?: 'key' | 'updated_at' | 'created_at';
  order?: 'asc' | 'desc';
  locale?: string; // 'de' | 'en' | '*' | undefined
};

export type UpsertSettingBody = {
  key: string;
  value: SettingValue;
};

export type BulkUpsertBody = { items: UpsertSettingBody[] };

// ✅ Backend base path (admin.routes.ts)
const BASE = '/admin/site-settings';

const norm = (s: SiteSettingRow): AdminSiteSetting => s;

/* ------------------ deterministic cache key ------------------ */
function stableListKey(arg?: ListParams | void) {
  if (!arg) return 'list:{}';

  const keys = arg.keys?.length ? [...arg.keys].sort().join(',') : '';
  const locale = arg.locale ?? '';
  const q = arg.q ?? '';
  const prefix = arg.prefix ?? '';
  const limit = typeof arg.limit === 'number' ? String(arg.limit) : '';
  const offset = typeof arg.offset === 'number' ? String(arg.offset) : '';
  const sort = arg.sort ?? '';
  const order = arg.order ?? '';

  return `list:{locale=${locale}|q=${q}|prefix=${prefix}|keys=${keys}|limit=${limit}|offset=${offset}|sort=${sort}|order=${order}}`;
}

function toCombinedOrder(sort?: ListParams['sort'], order?: ListParams['order']) {
  if (sort && order) return `${sort}.${order}`;
  if (sort) return `${sort}.asc`;
  if (order) return `key.${order}`;
  return undefined;
}

function parseAppLocalesMeta(res: unknown): AppLocaleMeta[] {
  if (!Array.isArray(res)) return [];
  return (res as any[])
    .map((x) => {
      if (!x) return null;
      const code = String(x.code ?? x.value ?? '').trim();
      if (!code) return null;

      const label = typeof x.label === 'string' ? x.label.trim() : undefined;
      const is_default = x.is_default === true;
      const is_active = x.is_active !== false;

      return { code, label, is_default, is_active } as AppLocaleMeta;
    })
    .filter(Boolean) as AppLocaleMeta[];
}

/* ------------------ API ------------------ */

export const siteSettingsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /site-settings/list?keys=a,b&locale=tr&q=...&prefix=...&order=key.asc&limit=...&offset=...
    listSiteSettingsAdmin: b.query<AdminSiteSetting[], ListParams | void>({
      query: (params) => {
        if (!params) return { url: `${BASE}/list` };

        const { keys, sort, order, locale, ...rest } = params;

        const keysParam = keys?.length ? keys.join(',') : undefined;
        const combinedOrder = toCombinedOrder(sort, order);

        return {
          url: `${BASE}/list`,
          params: {
            ...rest,
            ...(keysParam ? { keys: keysParam } : {}),
            ...(combinedOrder ? { order: combinedOrder } : {}),
            ...(locale ? { locale } : {}),
          },
        };
      },

      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${stableListKey(queryArgs)}`,

      forceRefetch: ({ currentArg, previousArg }) =>
        stableListKey(currentArg as any) !== stableListKey(previousArg as any),

      transformResponse: (res: unknown): AdminSiteSetting[] =>
        Array.isArray(res) ? (res as SiteSettingRow[]).map(norm) : [],

      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((s) => ({
                type: 'SiteSettings' as const,
                id: `${s.key}:${s.locale ?? ''}`,
              })),
              { type: 'SiteSettings' as const, id: 'LIST' },
            ]
          : [{ type: 'SiteSettings' as const, id: 'LIST' }],

      keepUnusedDataFor: 10,
    }),

    // GET /site-settings/:key?locale=tr|en|*
    getSiteSettingAdminByKey: b.query<AdminSiteSetting | null, { key: string; locale?: string }>({
      query: ({ key, locale }) => ({
        url: `${BASE}/${encodeURIComponent(key)}`,
        params: locale ? { locale } : undefined,
      }),
      transformResponse: (res: unknown): AdminSiteSetting | null => {
        if (!res || typeof res !== 'object') return null;
        const r = res as any;
        if (!r.key) return null;

        // BE: adminGetSiteSettingByKey -> { key, value, locale }
        // UI row gibi bekliyorsa minimal normalize:
        return norm({
          id: r.id ?? undefined,
          key: String(r.key),
          locale: typeof r.locale === 'string' ? r.locale : undefined,
          value: r.value as SettingValue,
          created_at: typeof r.created_at === 'string' ? r.created_at : undefined,
          updated_at: typeof r.updated_at === 'string' ? r.updated_at : undefined,
        });
      },
      providesTags: (_r, _e, arg) => [
        { type: 'SiteSettings', id: `${arg.key}:${arg.locale ?? ''}` },
      ],
    }),

    // POST /site-settings
    createSiteSettingAdmin: b.mutation<AdminSiteSetting, UpsertSettingBody>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown): AdminSiteSetting => norm(res as SiteSettingRow),
      invalidatesTags: [{ type: 'SiteSettings', id: 'LIST' }],
    }),

    // PUT /site-settings/:key?locale=tr|en|*
    updateSiteSettingAdmin: b.mutation<
      { ok: true },
      { key: string; value: SettingValue; locale?: string }
    >({
      query: ({ key, value, locale }) => ({
        url: `${BASE}/${encodeURIComponent(key)}`,
        method: 'PUT',
        body: { value },
        params: locale ? { locale } : undefined,
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'SiteSettings', id: `${arg.key}:${arg.locale ?? ''}` },
        { type: 'SiteSettings', id: 'LIST' },
      ],
    }),

    // DELETE /site-settings/:key?locale=tr|en|*
    deleteSiteSettingAdmin: b.mutation<{ ok: true }, { key: string; locale?: string }>({
      query: ({ key, locale }) => ({
        url: `${BASE}/${encodeURIComponent(key)}`,
        method: 'DELETE',
        params: locale ? { locale } : undefined,
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'SiteSettings', id: `${arg.key}:${arg.locale ?? ''}` },
        { type: 'SiteSettings', id: 'LIST' },
      ],
    }),

    // POST /site-settings/bulk-upsert
    bulkUpsertSiteSettingsAdmin: b.mutation<{ ok: true }, BulkUpsertBody>({
      query: (body) => ({ url: `${BASE}/bulk-upsert`, method: 'POST', body }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [
        { type: 'SiteSettingsBulk', id: 'LIST' },
        { type: 'SiteSettings', id: 'LIST' },
      ],
    }),

    // DELETE /site-settings (query ile)
    deleteManySiteSettingsAdmin: b.mutation<
      { ok: true },
      {
        prefix?: string;
        locale?: string;
        key?: string;
        key_in?: string;
        keys?: string[]; // convenience -> key_in
        'key!'?: string;
        key_ne?: string;
        'id!'?: string;
        id_ne?: string;
      }
    >({
      query: (arg) => {
        const params: Record<string, string> = {};
        if (arg.prefix) params.prefix = String(arg.prefix);
        if (arg.locale) params.locale = String(arg.locale);
        if (arg.key) params.key = String(arg.key);

        const keyNe = (arg as any)['key!'] ?? arg.key_ne;
        if (keyNe) params['key!'] = String(keyNe);

        const idNe = (arg as any)['id!'] ?? arg.id_ne;
        if (idNe) params['id!'] = String(idNe);

        const keyIn = arg.key_in ?? (arg.keys?.length ? arg.keys.join(',') : undefined);
        if (keyIn) params.key_in = String(keyIn);

        return { url: BASE, method: 'DELETE', params };
      },
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'SiteSettings', id: 'LIST' }],
    }),

    // GET /site-settings/app-locales
    getAppLocalesAdmin: b.query<AppLocaleMeta[], void>({
      query: () => ({ url: `${BASE}/app-locales` }),
      transformResponse: (res: unknown) => parseAppLocalesMeta(res),
      providesTags: [{ type: 'SiteSettings', id: 'META:APP_LOCALES' }],
      keepUnusedDataFor: 300,
    }),

    // GET /site-settings/default-locale
    getDefaultLocaleAdmin: b.query<DefaultLocaleMeta, void>({
      query: () => ({ url: `${BASE}/default-locale` }),
      transformResponse: (res: unknown): DefaultLocaleMeta => {
        if (typeof res === 'string') return res.trim().toLowerCase() || null;
        if (res == null) return null;

        if (typeof res === 'object' && (res as any).value) {
          const v = (res as any).value;
          if (typeof v === 'string') return v.trim().toLowerCase() || null;
        }
        return null;
      },
      providesTags: [{ type: 'SiteSettings', id: 'META:DEFAULT_LOCALE' }],
      keepUnusedDataFor: 300,
    }),

    // GET /site-settings?locale=...
    getSettingsAggregateAdmin: b.query<
      { contact_info: any; socials: any; businessHours: any[] },
      { locale?: string } | void
    >({
      query: (arg) => ({
        url: BASE,
        params: arg?.locale ? { locale: arg.locale } : undefined,
      }),
      providesTags: [{ type: 'SiteSettings', id: 'AGGREGATE' }],
      keepUnusedDataFor: 60,
    }),

    // PUT /site-settings?locale=...
    upsertSettingsAggregateAdmin: b.mutation<
      { ok: true },
      { locale?: string; contact_info?: any; socials?: any; businessHours?: any[] }
    >({
      query: (body) => {
        const { locale, ...payload } = body ?? {};
        return {
          url: BASE,
          method: 'PUT',
          params: locale ? { locale } : undefined,
          body: payload,
        };
      },
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [
        { type: 'SiteSettings', id: 'AGGREGATE' },
        { type: 'SiteSettings', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSiteSettingsAdminQuery,
  useGetSiteSettingAdminByKeyQuery,
  useCreateSiteSettingAdminMutation,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
  useBulkUpsertSiteSettingsAdminMutation,
  useDeleteManySiteSettingsAdminMutation,
  useGetAppLocalesAdminQuery,
  useGetDefaultLocaleAdminQuery,
  useGetSettingsAggregateAdminQuery,
  useUpsertSettingsAggregateAdminMutation,
} = siteSettingsAdminApi;
