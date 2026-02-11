// =============================================================
// FILE: src/integrations/rtk/endpoints/auth.endpoints.ts
// konigsmassage public auth RTK endpoints (Next.js uyumlu)
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import type { User as AuthUser, UserRoleName } from '@/integrations/types';

/* -----------------------------
 * Request/Response Types
 * ----------------------------- */

type LoginBody = {
  grant_type: 'password';
  email: string;
  password: string;
};

/**
 * Backend validation (signupBody) ile uyumlu:
 * - email, password zorunlu
 * - full_name, phone opsiyonel
 * - options.emailRedirectTo / options.data.full_name / options.data.phone opsiyonel
 */
export type SignUpBody = {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  options?: {
    emailRedirectTo?: string;
    data?: {
      full_name?: string;
      phone?: string;
      [k: string]: unknown;
    };
  };
};

/**
 * /auth/token ve /auth/signup cevap tipleri
 * (backend tarafında controller'ların döndürdüğü shape'i
 * buna göre tasarlıyoruz)
 */
export type TokenResp = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: 'bearer';
  user: AuthUser;
};

/** /auth/user cevabı (şeklen { user } döndürmesini bekliyoruz) */
export type UserResp = {
  user: AuthUser;
};

/** /auth/status cevabı */
export type StatusResp = {
  authenticated: boolean;
  is_admin: boolean;
  user?: {
    id: string;
    email: string | null;
    role: UserRoleName;
  };
};

/* -----------------------------
 * Password reset types
 * ----------------------------- */

export type PasswordResetRequestBody = {
  email: string;
};

export type PasswordResetRequestResp = {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
};

export type PasswordResetConfirmBody = {
  token: string;
  password: string;
};

export type PasswordResetConfirmResp = {
  success: boolean;
  message?: string;
  error?: string;
};

/* -----------------------------
 * Update (profil/hesap)
 * Backend validation: updateBody { email?, password? }
 * ----------------------------- */

export type UpdateUserBody = {
  email?: string;
  password?: string;
};

const BASE = '/auth';

/* -----------------------------
 * Public/Auth Endpoints
 * ----------------------------- */

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /auth/token  (password grant) */
    token: b.mutation<TokenResp, { email: string; password: string }>({
      query: ({ email, password }): FetchArgs => ({
        url: `${BASE}/token`,
        method: 'POST',
        body: {
          grant_type: 'password',
          email,
          password,
        } satisfies LoginBody,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/signup */
    signUp: b.mutation<TokenResp, SignUpBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/signup`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/token/refresh */
    refresh: b.mutation<{ access_token: string; token_type: 'bearer' }, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/token/refresh`,
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    /** GET /auth/user (me) */
    me: b.query<UserResp, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/user`,
        method: 'GET',
      }),
      providesTags: ['Auth', 'User'],
    }),

    /** GET /auth/status */
    status: b.query<StatusResp, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/status`,
        method: 'GET',
      }),
      providesTags: ['Auth', 'User'],
    }),

    /** POST /auth/logout */
    logout: b.mutation<void, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/logout`,
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/google  (ID token ile sign in) */
    signInWithGoogle: b.mutation<TokenResp, { idToken: string }>({
      query: ({ idToken }): FetchArgs => ({
        url: `${BASE}/google`,
        method: 'POST',
        body: { id_token: idToken },
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/google/start (redirect url üretimi) */
    googleStart: b.mutation<{ url: string }, { redirectTo?: string }>({
      query: ({ redirectTo }): FetchArgs => ({
        url: `${BASE}/google/start`,
        method: 'POST',
        body: { redirectTo },
      }),
    }),

    /** PUT /auth/user  (şu an sadece email + password) */
    updateUser: b.mutation<UserResp, UpdateUserBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/user`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User', 'Auth'],
    }),

    /** POST /auth/password-reset/request  (şifremi unuttum) */
    requestPasswordReset: b.mutation<PasswordResetRequestResp, PasswordResetRequestBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/password-reset/request`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /auth/password-reset/confirm  (yeni şifre kaydet) */
    confirmPasswordReset: b.mutation<PasswordResetConfirmResp, PasswordResetConfirmBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/password-reset/confirm`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useTokenMutation,
  useSignUpMutation,
  useRefreshMutation,
  useMeQuery,
  useStatusQuery,
  useLazyStatusQuery,
  useLogoutMutation,
  useSignInWithGoogleMutation,
  useGoogleStartMutation,
  useUpdateUserMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
} = authApi;

// Kısa alias’lar
export const useLoginMutation = useTokenMutation;
export const useSignupMutation = useSignUpMutation;
export const useGetSessionQuery = useMeQuery;
export const useOauthStartMutation = useGoogleStartMutation;
