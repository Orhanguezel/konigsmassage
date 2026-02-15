// =============================================================
// FILE: src/modules/bookings/controller.ts
// FINAL — Public bookings controller (MAIL HARDENED)
// Fixes:
//  - Template param mismatch: send BOTH message + customer_message (+ service_slug)
//  - Treat "not sent" (null result) as error even with allowMissing
//  - Track admin mail result too
// =============================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

import { publicCreateBookingSchema } from './validation';
import { createBookingPublic, getBookingMergedById } from './repository';

import { sendTemplatedEmail } from '@/modules/email-templates/mailer';
import { createUserNotification } from '@/modules/notifications/service';
import { telegramNotify } from '@/modules/telegram/telegram.notifier';

import { db } from '@/db/client';
import { siteSettings } from '@/modules/siteSettings/schema';
import { bookings as bookingsTable } from './schema';

const safeText = (v: unknown) => String(v ?? '').trim();
const now = () => new Date();

async function getSettingValue(key: string): Promise<string | null> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  const val = row?.value == null ? null : String(row.value).trim();
  return val ? val : null;
}

async function getSiteName(): Promise<string> {
  return (
    (await getSettingValue('site_title')) ||
    (await getSettingValue('footer_company_name')) ||
    'Königs Massage'
  );
}

async function getAdminBookingEmail(): Promise<string | null> {
  return (
    (await getSettingValue('booking_admin_email')) ||
    (await getSettingValue('contact_receiver_email')) ||
    (await getSettingValue('footer_company_email')) ||
    null
  );
}

async function getBookingAdminUserId(): Promise<string | null> {
  const v = await getSettingValue('booking_admin_user_id');
  const s = (v ?? '').trim();
  return s && s.length === 36 ? s : null;
}

async function updateEmailTracking(args: {
  bookingId: string;
  to: string;
  templateKey: string;
  subject?: string | null;
  error?: string | null;
}) {
  await db
    .update(bookingsTable)
    .set({
      email_last_sent_at: args.error ? null : now(),
      email_last_template_key: args.templateKey,
      email_last_to: args.to,
      email_last_subject: args.subject ?? null,
      email_last_error: args.error ?? null,
      updated_at: now(),
    } as any)
    .where(eq(bookingsTable.id, args.bookingId));
}

function asEmailError(e: any) {
  const msg = String(e?.message || e?.code || 'mail_failed');
  return msg.length > 2000 ? msg.slice(0, 2000) : msg;
}

/** PUBLIC: POST /bookings */
export const createBookingPublicHandler: RouteHandler = async (req, reply) => {
  try {
    const input = publicCreateBookingSchema.parse(req.body ?? {});
    const id = randomUUID();

    const locale = safeText(input.locale) || 'de';

    const created = await createBookingPublic({
      booking: {
        id,
        name: safeText(input.name),
        email: safeText(input.email),
        phone: safeText(input.phone),
        locale,

        customer_message: input.customer_message ? safeText(input.customer_message) : null,

        service_id: input.service_id ? safeText(input.service_id) : null,
        resource_id: safeText(input.resource_id),

        appointment_date: safeText(input.appointment_date),
        appointment_time: safeText(input.appointment_time),

        status: 'new',
        is_read: 0,

        created_at: now(),
        updated_at: now(),
      } as any,
    });

    const merged = await getBookingMergedById({ id: created.id, locale });

    const siteName = await getSiteName();
    const adminTo = await getAdminBookingEmail();
    const adminUserId = await getBookingAdminUserId();

    const msg = created.customer_message ?? '';

    // IMPORTANT: these param keys cover your seed variables AND older templates
    const mailParams = {
      site_name: siteName,

      booking_id: created.id,
      customer_name: created.name,
      customer_email: created.email,
      customer_phone: created.phone,

      appointment_date: created.appointment_date,
      appointment_time: created.appointment_time ?? '',

      // service fields (seed expects title+slug)
      service_title: merged?.service_title ?? '',
      service_slug: (merged as any)?.service_slug ?? '',

      // some templates may show resource title
      resource_title: merged?.resource_title ?? '',

      // message keys (support both placeholders)
      message: msg,
      customer_message: msg,

      status: created.status,
    };

    // ---------------- customer mail (best-effort but tracked) ----------------
    try {
      const rendered = await sendTemplatedEmail({
        to: created.email,
        key: 'booking_created_customer',
        locale,
        defaultLocale: 'de',
        params: mailParams,
        allowMissing: true,
      });

      // If mailer returns null/undefined => treat as failure (usually missing template or SMTP disabled)
      if (!rendered) {
        const err = 'mail_not_sent_or_template_missing';
        req.log.error(
          { err, key: 'booking_created_customer', to: created.email },
          'booking mail not sent',
        );
        await updateEmailTracking({
          bookingId: created.id,
          to: created.email,
          templateKey: 'booking_created_customer',
          subject: null,
          error: err,
        });
      } else {
        await updateEmailTracking({
          bookingId: created.id,
          to: created.email,
          templateKey: 'booking_created_customer',
          subject: (rendered as any)?.subject ?? null,
          error: null,
        });
      }
    } catch (e: any) {
      const err = asEmailError(e);
      req.log.error(
        { err, key: 'booking_created_customer', to: created.email },
        'booking customer mail failed',
      );
      await updateEmailTracking({
        bookingId: created.id,
        to: created.email,
        templateKey: 'booking_created_customer',
        subject: null,
        error: err,
      });
    }

    // ---------------- admin mail (best-effort + tracked) ----------------
    if (adminTo) {
      try {
        const rendered = await sendTemplatedEmail({
          to: adminTo,
          key: 'booking_created_admin',
          locale,
          defaultLocale: 'de',
          params: mailParams,
          allowMissing: true,
        });

        if (!rendered) {
          const err = 'admin_mail_not_sent_or_template_missing';
          req.log.error(
            { err, key: 'booking_created_admin', to: adminTo },
            'booking admin mail not sent',
          );
          await updateEmailTracking({
            bookingId: created.id,
            to: adminTo,
            templateKey: 'booking_created_admin',
            subject: null,
            error: err,
          });
        } else {
          await updateEmailTracking({
            bookingId: created.id,
            to: adminTo,
            templateKey: 'booking_created_admin',
            subject: (rendered as any)?.subject ?? null,
            error: null,
          });
        }
      } catch (e: any) {
        const err = asEmailError(e);
        req.log.error(
          { err, key: 'booking_created_admin', to: adminTo },
          'booking admin mail failed',
        );
        await updateEmailTracking({
          bookingId: created.id,
          to: adminTo,
          templateKey: 'booking_created_admin',
          subject: null,
          error: err,
        });
      }
    }

    // ---------------- admin notification (best-effort) ----------------
    if (adminUserId) {
      try {
        await createUserNotification({
          userId: adminUserId,
          type: 'custom',
          title: 'Yeni rezervasyon talebi',
          message: `Yeni rezervasyon: ${created.name} • ${created.appointment_date} ${
            created.appointment_time ?? ''
          }${merged?.service_title ? ' • ' + merged.service_title : ''}`,
        });
      } catch {
        // ignore
      }
    }

    // ---------------- telegram notification (best-effort) ----------------
    try {
      await telegramNotify({
        event: 'new_booking',
        locale,
        data: {
          booking_id: created.id,
          customer_name: created.name,
          customer_email: created.email,
          customer_phone: created.phone ?? '',
          appointment_date: created.appointment_date,
          appointment_time: created.appointment_time ?? '',
          service_title: merged?.service_title ?? '',
          resource_title: merged?.resource_title ?? '',
          customer_message: msg,
          locale,
        },
      });
    } catch {
      // ignore — telegramNotify already catches internally
    }

    return reply.code(201).send({ ok: true, id: created.id, status: created.status });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (String(e?.code || e?.message) === 'slot_not_available') {
      return reply.code(409).send({ error: { message: 'slot_not_available' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_create_failed' } });
  }
};
