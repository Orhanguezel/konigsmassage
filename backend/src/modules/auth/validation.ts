// =============================================================
// FILE: src/modules/auth/validation.ts
// =============================================================

import { z } from "zod";

export const signupBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),

  // Top-level opsiyonel alanlar:
  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(6).max(50).optional(),

  // Supabase benzeri payload uyumu:
  options: z
    .object({
      emailRedirectTo: z.string().url().optional(),
      data: z
        .object({
          full_name: z.string().trim().min(2).max(100).optional(),
          phone: z.string().trim().min(6).max(50).optional(),
        })
        .partial()
        .optional(),
    })
    .optional(),
});

export const tokenBody = z.object({
  grant_type: z.literal("password"),
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateBody = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const googleBody = z.object({
  id_token: z.string().min(10),
});


/** Admin list query */
export const adminUserListQuery = z.object({
  q: z.string().optional(),
  role: z.enum(["admin", "moderator", "user"]).optional(),
  is_active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
  sort: z.enum(["created_at", "email", "last_login_at"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const adminUpdateUserBody = z
  .object({
    full_name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(6).max(50).optional(),
    email: z.string().email().optional(),
    is_active: z
      .union([z.boolean(), z.number().int().min(0).max(1)])
      .optional(),
  })
  .strict();

export const adminSetActiveBody = z.object({
  is_active: z.union([z.boolean(), z.number().int().min(0).max(1)]),
});

export const adminSetRolesBody = z.object({
  roles: z.array(z.enum(["admin", "moderator", "user"])).default([]),
});

export const adminSetPasswordBody = z.object({
  password: z.string().min(8).max(200),
});

/** Legacy schemas (kept for compatibility if needed, otherwise deprecate/remove) */
export const adminRoleBody = z
  .object({
    user_id: z.string().uuid().optional(),
    email: z.string().email().optional(),
    role: z.enum(["admin", "moderator", "user"]),
  })
  .refine((v) => v.user_id || v.email, {
    message: "user_id_or_email_required",
  });

export const adminMakeByEmailBody = z.object({
  email: z.string().email(),
});
