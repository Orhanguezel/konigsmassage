// src/integrations/core/types.ts

export type UserRole = import("@/integrations/types").UserRoleName;

// FE User tipini, users.ts içindeki ile aynı yap:
export type User = import("@/integrations/types").User;

export type UserMetadata =
  | {
      full_name?: string | null;
      name?: string | null;
      [k: string]: unknown;
    }
  | null;

export type Session = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
  tokenType?: "bearer";
  user: User;
};

export type ResultError = { message: string; status?: number; raw?: unknown };
export type FetchResult<T = unknown> = {
  data: T | null;
  error: ResultError | null;
};
