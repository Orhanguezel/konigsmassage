// ===================================================================
// FILE: src/modules/telegram/validation.ts
// Telegram validation schemas (Königs Massage booking events)
// ===================================================================

import { z } from 'zod';

/* ---------------- manual send ---------------- */

export const TelegramSendBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
  type: z.string().trim().max(100).optional(),
  chat_id: z.string().trim().max(64).optional(),
  bot_token: z.string().trim().min(1).optional(),
});

export type TelegramSendBody = z.infer<typeof TelegramSendBodySchema>;

/* ---------------- event dispatcher ---------------- */

const baseEvent = z.object({
  chat_id: z.string().trim().max(64).optional(),
});

const eventNewBooking = baseEvent.extend({
  event: z.literal('new_booking'),
  data: z.object({
    booking_id: z.string().trim().min(1),
    customer_name: z.string().trim().min(1),
    customer_email: z.string().trim().min(1),
    customer_phone: z.string().trim().optional(),
    appointment_date: z.string().trim().min(1),
    appointment_time: z.string().trim().optional(),
    service_title: z.string().trim().optional(),
    resource_title: z.string().trim().optional(),
    customer_message: z.string().trim().optional(),
    locale: z.string().trim().optional(),
  }),
});

const eventBookingConfirmed = baseEvent.extend({
  event: z.literal('booking_confirmed'),
  data: z.object({
    booking_id: z.string().trim().min(1),
    customer_name: z.string().trim().min(1),
    customer_email: z.string().trim().min(1),
    appointment_date: z.string().trim().min(1),
    appointment_time: z.string().trim().optional(),
    service_title: z.string().trim().optional(),
    resource_title: z.string().trim().optional(),
    decision_note: z.string().trim().optional(),
    locale: z.string().trim().optional(),
  }),
});

const eventBookingRejected = baseEvent.extend({
  event: z.literal('booking_rejected'),
  data: z.object({
    booking_id: z.string().trim().min(1),
    customer_name: z.string().trim().min(1),
    customer_email: z.string().trim().min(1),
    appointment_date: z.string().trim().min(1),
    appointment_time: z.string().trim().optional(),
    service_title: z.string().trim().optional(),
    resource_title: z.string().trim().optional(),
    decision_note: z.string().trim().optional(),
    locale: z.string().trim().optional(),
  }),
});

const eventBookingCancelled = baseEvent.extend({
  event: z.literal('booking_cancelled'),
  data: z.object({
    booking_id: z.string().trim().min(1),
    customer_name: z.string().trim().min(1),
    customer_email: z.string().trim().min(1),
    appointment_date: z.string().trim().min(1),
    appointment_time: z.string().trim().optional(),
    service_title: z.string().trim().optional(),
    resource_title: z.string().trim().optional(),
    decision_note: z.string().trim().optional(),
    locale: z.string().trim().optional(),
  }),
});

const eventBookingStatusChanged = baseEvent.extend({
  event: z.literal('booking_status_changed'),
  data: z.object({
    booking_id: z.string().trim().min(1),
    customer_name: z.string().trim().min(1),
    customer_email: z.string().trim().min(1),
    appointment_date: z.string().trim().min(1),
    appointment_time: z.string().trim().optional(),
    service_title: z.string().trim().optional(),
    resource_title: z.string().trim().optional(),
    status_before: z.string().trim().min(1),
    status_after: z.string().trim().min(1),
    decision_note: z.string().trim().optional(),
    locale: z.string().trim().optional(),
  }),
});

const eventNewContact = baseEvent.extend({
  event: z.literal('new_contact'),
  data: z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().min(1),
    phone: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    message: z.string().trim().min(1),
  }),
});

export const TelegramEventBodySchema = z.discriminatedUnion('event', [
  eventNewBooking,
  eventBookingConfirmed,
  eventBookingRejected,
  eventBookingCancelled,
  eventBookingStatusChanged,
  eventNewContact,
]);

export type TelegramEventBody = z.infer<typeof TelegramEventBodySchema>;

/* ---------------- test ---------------- */

export const TelegramTestBodySchema = z.object({
  chat_id: z.string().trim().max(64).optional(),
});
export type TelegramTestBody = z.infer<typeof TelegramTestBodySchema>;

/* ---------------- inbound list ---------------- */

export const TelegramInboundListQuerySchema = z.object({
  chat_id: z.string().trim().max(64).optional(),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().trim().max(500).optional(),
});
export type TelegramInboundListQuery = z.infer<typeof TelegramInboundListQuerySchema>;

/* ---------------- autoreply ---------------- */

export const TelegramAutoReplyUpdateBodySchema = z.object({
  enabled: z.boolean().optional(),
  template: z.string().trim().min(1).max(4000).optional(),
});
export type TelegramAutoReplyUpdateBody = z.infer<typeof TelegramAutoReplyUpdateBodySchema>;

/* ---------------- webhook ---------------- */

export const TelegramWebhookBodySchema = z
  .object({
    update_id: z.number().int(),
    message: z
      .object({
        message_id: z.number().int().optional(),
        date: z.number().int().optional(),
        text: z.string().optional(),
        from: z
          .object({
            id: z.union([z.number().int(), z.string()]).optional(),
            is_bot: z.boolean().optional(),
            username: z.string().optional(),
            first_name: z.string().optional(),
            last_name: z.string().optional(),
          })
          .optional(),
        chat: z
          .object({
            id: z.union([z.number().int(), z.string()]),
            type: z.string().optional(),
            title: z.string().optional(),
            username: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

export type TelegramWebhookBody = z.infer<typeof TelegramWebhookBodySchema>;
