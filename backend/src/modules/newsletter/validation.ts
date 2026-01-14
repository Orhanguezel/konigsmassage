// ===================================================================
// FILE: src/modules/newsletter/validation.ts
// ===================================================================

import { z } from 'zod';
import { LOCALES } from '@/core/i18n';

// Bool-like pattern (konigsmassage)
export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

// Çoklu dil desteği
const LOCALE_ENUM = z.enum(LOCALES as [string, ...string[]]);

/**
 * PUBLIC: Subscribe
 */
export const newsletterSubscribeSchema = z.object({
  email: z.string().email().max(255),
  locale: LOCALE_ENUM.optional(), // body'den gelirse header'dan önce
  // İleride ekstra alan eklemek istersen (ör. "source", "tags") buraya ekleyebilirsin.
  meta: z.record(z.any()).optional(),
});

/**
 * PUBLIC: Unsubscribe
 */
export const newsletterUnsubscribeSchema = z.object({
  email: z.string().email().max(255),
});

/**
 * ADMIN: List query
 */
export const newsletterListQuerySchema = z.object({
  q: z.string().optional(), // email search
  email: z.string().email().max(255).optional(),
  verified: boolLike.optional(), // is_verified
  subscribed: boolLike.optional(), // unsubscribed_at NULL / NOT NULL
  locale: LOCALE_ENUM.optional(),

  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  orderBy: z.enum(['created_at', 'updated_at', 'email', 'verified', 'locale']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

/**
 * ADMIN: Update
 */
export const newsletterAdminUpdateSchema = z.object({
  verified: boolLike.optional(),
  subscribed: boolLike.optional(), // true → aktif, false → unsubscribed_at now
  locale: LOCALE_ENUM.optional(),
  meta: z.record(z.any()).nullable().optional(),
});

// ---------- Types ----------

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
export type NewsletterUnsubscribeInput = z.infer<typeof newsletterUnsubscribeSchema>;
export type NewsletterListQuery = z.infer<typeof newsletterListQuerySchema>;
export type NewsletterAdminUpdateInput = z.infer<typeof newsletterAdminUpdateSchema>;
