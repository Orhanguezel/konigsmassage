// =============================================================
// FILE: src/modules/bookings/validation.ts
// FINAL — Bookings validation (NO i18n, locale only)
// =============================================================

import { z } from 'zod';
import { boolLike } from '@/modules/_shared/common';
import { bookingStatusEnum, safeTrim, uuid36Schema } from '@/modules/_shared';

export const LOCALE_SCHEMA = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-zA-Z]{2,3}([_-][a-zA-Z0-9]{2,8})?$/, 'invalid_locale')
  .transform((v) => safeTrim(v));


export const dateYmdSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'appointment_date must be YYYY-MM-DD')
  .transform(safeTrim);

export const timeHmSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'appointment_time must be HH:mm')
  .transform(safeTrim);

export const bookingStatusSchema = z.enum(bookingStatusEnum as unknown as [string, ...string[]]);

export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export function to01(v: unknown): 0 | 1 | undefined {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
}

export const listBookingsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.string().trim().optional(),
  is_read: boolLike.optional(),

  appointment_date: dateYmdSchema.optional(),
  appointment_time: timeHmSchema.optional(),

  service_id: uuid36Schema.optional(),
  resource_id: uuid36Schema.optional(),

  locale: LOCALE_SCHEMA.optional(),

  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const nonEmptyTrimmed = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((v) => safeTrim(v));

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(190)
  .transform((v) => safeTrim(v));
const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .transform((v) => safeTrim(v));

/** PUBLIC create: always reserves slot (status=new) */
export const publicCreateBookingSchema = z.object({
  locale: LOCALE_SCHEMA.optional(),

  name: nonEmptyTrimmed(2, 120),
  email: emailSchema,
  phone: phoneSchema,

  appointment_date: dateYmdSchema,
  appointment_time: timeHmSchema,

  resource_id: uuid36Schema,

  service_id: uuid36Schema.optional(),
  customer_message: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => safeTrim(v)),
});

export type PublicCreateBookingBody = z.infer<typeof publicCreateBookingSchema>;

/** ADMIN create */
export const adminCreateBookingSchema = publicCreateBookingSchema.extend({
  status: bookingStatusSchema.optional(),
  is_read: boolLike.optional(),
  admin_note: z
    .string()
    .trim()
    .max(8000)
    .optional()
    .transform((v) => safeTrim(v)),
});

export type AdminCreateBookingBody = z.infer<typeof adminCreateBookingSchema>;

export const adminUpdateBookingSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(190).optional(),
    phone: z.string().trim().min(7).max(32).optional(),

    locale: LOCALE_SCHEMA.optional(),

    customer_message: z.string().trim().max(4000).optional().nullable(),

    service_id: uuid36Schema.optional().nullable(),
    resource_id: uuid36Schema.optional().nullable(),

    appointment_date: dateYmdSchema.optional(),
    appointment_time: timeHmSchema.optional().nullable(),

    status: bookingStatusSchema.optional(),
    is_read: boolLike.optional(),

    admin_note: z.string().trim().max(8000).optional().nullable(),
    decision_note: z.string().trim().max(8000).optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No-op body' });

export type AdminUpdateBookingBody = z.infer<typeof adminUpdateBookingSchema>;

/** Capacity is held for these statuses */
export function isActiveForCapacity(status: string | null | undefined) {
  return status === 'new' || status === 'confirmed';
}

export const adminDecisionSchema = z
  .object({
    // template dili için opsiyonel override (istersen kullanırsın)
    locale: LOCALE_SCHEMA.optional(),

    decision_note: z
      .string()
      .trim()
      .max(8000)
      .optional()
      .transform((v) => safeTrim(v)),
  })
  .optional()
  .default({});

