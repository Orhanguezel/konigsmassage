// =============================================================
// FILE: src/modules/resources/validation.ts
// FINAL — LOCKED — Resources validation
// =============================================================

import { z } from 'zod';
import { resourceTypeEnum, uuid36Schema, safeTrim} from '@/modules/_shared';



export const resourceTypeSchema = z.enum(resourceTypeEnum);

export const capacitySchema = z.coerce.number().int().min(1).max(50); // pratik limit; gerekirse artırırız

export const adminListResourcesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  type: resourceTypeSchema.optional(),
  is_active: z.union([z.boolean(), z.number(), z.string()]).optional(),
  external_ref_id: uuid36Schema.optional(),

  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),

  sort: z.enum(['created_at', 'updated_at', 'title', 'type', 'capacity']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type AdminListResourcesQuery = z.infer<typeof adminListResourcesQuerySchema>;

export const adminCreateResourceBodySchema = z.object({
  type: resourceTypeSchema.optional(),
  title: z
    .string()
    .trim()
    .min(1)
    .max(190)
    .transform((v) => safeTrim(v)),

  capacity: capacitySchema.optional(), // default repository/controller tarafında 1

  external_ref_id: uuid36Schema.optional().nullable(),
  is_active: z.union([z.boolean(), z.number(), z.string()]).optional(),
});

export type AdminCreateResourceBody = z.infer<typeof adminCreateResourceBodySchema>;

export const adminUpdateResourceBodySchema = z
  .object({
    type: resourceTypeSchema.optional().nullable(),
    title: z.string().trim().min(1).max(190).optional().nullable(),

    capacity: capacitySchema.optional().nullable(),

    external_ref_id: uuid36Schema.optional().nullable(),
    is_active: z.union([z.boolean(), z.number(), z.string()]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No-op body' });

export type AdminUpdateResourceBody = z.infer<typeof adminUpdateResourceBodySchema>;

export const publicListResourcesQuerySchema = z.object({
  type: resourceTypeSchema.optional(),
});
