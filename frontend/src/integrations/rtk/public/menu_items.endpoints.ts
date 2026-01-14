// =============================================================
// FILE: src/integrations/rtk/endpoints/menu_items.endpoints.ts
// konigsmassage – Public Menu Items RTK endpoints
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  PublicMenuItemDto,
  PublicMenuItemListQueryParams,
  MenuItemListResponse,
} from '@/integrations/types';

type MetaWithHeaders = {
  response?: {
    headers?: {
      get: (name: string) => string | null;
    };
  };
};

const parseTotalFromMeta = (dataLength: number, meta?: MetaWithHeaders | unknown): number => {
  const m = meta as MetaWithHeaders | undefined;
  const raw = m?.response?.headers?.get('x-total-count');
  if (!raw) return dataLength;
  const n = Number(raw);
  return Number.isFinite(n) ? n : dataLength;
};

export const menuItemsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // LIST – GET /menu_items
    listMenuItems: build.query<
      MenuItemListResponse<PublicMenuItemDto>,
      PublicMenuItemListQueryParams | void
    >({
      query: (params?: PublicMenuItemListQueryParams) => ({
        url: '/menu_items',
        method: 'GET',
        params,
      }),
      transformResponse: (data: PublicMenuItemDto[], meta?: MetaWithHeaders) => {
        const total = parseTotalFromMeta(data?.length ?? 0, meta);
        return {
          items: data ?? [],
          total,
        };
      },
      providesTags: (result) =>
        result?.items
          ? [
              { type: 'MenuItemPublic' as const, id: 'LIST' },
              ...result.items.map((m) => ({
                type: 'MenuItemPublic' as const,
                id: m.id,
              })),
            ]
          : [{ type: 'MenuItemPublic' as const, id: 'LIST' }],
    }),

    // GET by id – GET /menu_items/:id
    // locale destekli: arg.id + arg.locale
    getMenuItem: build.query<PublicMenuItemDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/menu_items/${encodeURIComponent(id)}`,
        method: 'GET',
        params: locale ? { locale } : undefined,
      }),
      providesTags: (_r, _e, arg) => [{ type: 'MenuItemPublic' as const, id: arg.id }],
    }),
  }),
  overrideExisting: false,
});

export const { useListMenuItemsQuery, useGetMenuItemQuery } = menuItemsApi;
