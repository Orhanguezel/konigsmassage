// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/users_admin.endpoints.ts
// konigsmassage – Admin Users RTK endpoints
// (GET /admin/users vb. – admin.controller ile uyumlu)
// =============================================================

import type { FetchArgs } from '@reduxjs/toolkit/query';
import { baseApi } from '@/integrations/rtk/baseApi';

import type {
  AdminUserDto,
  AdminUserListQueryParams,
  AdminUserUpdatePayload,
  AdminUserSetActivePayload,
  AdminUserSetRolesPayload,
  AdminUserSetPasswordPayload,
  AdminOkResponse,
} from '@/integrations/types';

const BASE = '/admin/users';

export const adminUsersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /* --------------------------------------------------------- */
    /* LIST – GET /admin/users                                   */
    /* --------------------------------------------------------- */
    listUsersAdmin: b.query<AdminUserDto[], AdminUserListQueryParams | void>({
      query: (params): FetchArgs => ({
        url: BASE,
        method: 'GET',
        // undefined ise boş obje gönder
        params: params ?? {},
      }),
      providesTags: ['AdminUsers'],
    }),

    /* --------------------------------------------------------- */
    /* GET – GET /admin/users/:id                                */
    /* --------------------------------------------------------- */
    getUserAdmin: b.query<AdminUserDto, string>({
      query: (id): FetchArgs => ({
        url: `${BASE}/${id}`,
        method: 'GET',
      }),
      providesTags: ['AdminUsers'],
    }),

    /* --------------------------------------------------------- */
    /* UPDATE – PATCH /admin/users/:id                           */
    /* --------------------------------------------------------- */
    updateUserAdmin: b.mutation<AdminUserDto, { id: string; patch: AdminUserUpdatePayload }>({
      query: ({ id, patch }): FetchArgs => ({
        url: `${BASE}/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    /* --------------------------------------------------------- */
    /* SET ACTIVE – POST /admin/users/:id/active                 */
    /* --------------------------------------------------------- */
    setUserActiveAdmin: b.mutation<
      AdminOkResponse,
      { id: string; body: AdminUserSetActivePayload }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${id}/active`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    /* --------------------------------------------------------- */
    /* SET ROLES – POST /admin/users/:id/roles                   */
    /* --------------------------------------------------------- */
    setUserRolesAdmin: b.mutation<AdminOkResponse, { id: string; body: AdminUserSetRolesPayload }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${id}/roles`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    /* --------------------------------------------------------- */
    /* SET PASSWORD – POST /admin/users/:id/password             */
    /* --------------------------------------------------------- */
    setUserPasswordAdmin: b.mutation<
      AdminOkResponse,
      { id: string; body: AdminUserSetPasswordPayload }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${id}/password`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    /* --------------------------------------------------------- */
    /* REMOVE – DELETE /admin/users/:id                          */
    /* --------------------------------------------------------- */
    removeUserAdmin: b.mutation<AdminOkResponse, string>({
      query: (id): FetchArgs => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListUsersAdminQuery,
  useGetUserAdminQuery,
  useUpdateUserAdminMutation,
  useSetUserActiveAdminMutation,
  useSetUserRolesAdminMutation,
  useSetUserPasswordAdminMutation,
  useRemoveUserAdminMutation,
} = adminUsersApi;
