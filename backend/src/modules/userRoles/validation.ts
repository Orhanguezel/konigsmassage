// =============================================================
// FILE: src/modules/userRoles/validation.ts
// =============================================================

import { z } from "zod";

export const roleEnum = z.enum(["admin", "moderator", "user"]);
export type RoleName = z.infer<typeof roleEnum>;

export const userRoleListQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  role: roleEnum.optional(),
  order: z.literal("created_at").optional(),
  direction: z.enum(["asc", "desc"]).optional(),
  limit: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(50),
  offset: z
    .coerce
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .default(0),
});

export const createUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: roleEnum,
});

export type UserRoleListQuery = z.infer<typeof userRoleListQuerySchema>;
export type CreateUserRoleInput = z.infer<typeof createUserRoleSchema>;
