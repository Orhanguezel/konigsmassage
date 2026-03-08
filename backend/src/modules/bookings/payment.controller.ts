// =============================================================
// FILE: src/modules/bookings/payment.controller.ts
// Booking payment endpoints — wallet + PayPal
// =============================================================

import type { RouteHandler } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { bookings } from './schema';
import { servicesI18n } from '@/modules/services/schema';
import { gutscheins } from '@/modules/gutschein/schema';
import { spendFromWallet, getOrCreateWallet } from '@/modules/wallet/service';
import { createPaypalOrder, capturePaypalOrder } from '@/modules/wallet/paypal.service';
import type { PaypalCredentials } from '@/modules/wallet/paypal.service';
import { getPaymentConfig } from '@/modules/siteSettings/service';
import { siteSettings } from '@/modules/siteSettings/schema';
import { env } from '@/core/env';

const safeStr = (v: unknown) => String(v ?? '').trim();

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  return { id: safeStr(u?.id ?? u?.sub) };
}

async function isPaymentEnabled(): Promise<boolean> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, 'booking_payment_enabled'))
    .limit(1);
  const s = safeStr(row?.value).replace(/"/g, '').toLowerCase();
  return s === 'true' || s === '1';
}

/** GET /bookings/:id/payment-info — no auth, matched by email */
export const getBookingPaymentInfo: RouteHandler = async (req, reply) => {
  const id = safeStr((req.params as any)?.id);
  if (!id || id.length !== 36) return reply.code(400).send({ error: 'invalid_id' });

  const enabled = await isPaymentEnabled();
  if (!enabled) return reply.code(400).send({ error: 'booking_payment_disabled' });

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) return reply.code(404).send({ error: 'booking_not_found' });
  if (booking.status !== 'confirmed') return reply.code(400).send({ error: 'booking_not_confirmed' });
  if (booking.payment_status === 'paid') return reply.code(400).send({ error: 'already_paid' });

  // Get service price
  const locale = booking.locale || 'de';
  const [svc] = booking.service_id
    ? await db
        .select({ price: servicesI18n.price, price_numeric: servicesI18n.price_numeric, name: servicesI18n.name })
        .from(servicesI18n)
        .where(and(eq(servicesI18n.service_id, booking.service_id), eq(servicesI18n.locale, locale)))
        .limit(1)
    : [null as any];

  // Fallback to 'de' locale if no price found
  let servicePrice = svc?.price_numeric ? Number(svc.price_numeric) : 0;
  let serviceName = svc?.name || '';
  let priceDisplay = svc?.price || '';

  if (!servicePrice && booking.service_id) {
    const [svcDe] = await db
      .select({ price: servicesI18n.price, price_numeric: servicesI18n.price_numeric, name: servicesI18n.name })
      .from(servicesI18n)
      .where(and(eq(servicesI18n.service_id, booking.service_id), eq(servicesI18n.locale, 'de')))
      .limit(1);
    if (svcDe) {
      servicePrice = svcDe.price_numeric ? Number(svcDe.price_numeric) : 0;
      serviceName = svcDe.name || serviceName;
      priceDisplay = svcDe.price || priceDisplay;
    }
  }

  if (!servicePrice) return reply.code(400).send({ error: 'service_price_not_available' });

  // Get payment methods
  const cfg = await getPaymentConfig();

  return reply.send({
    booking_id: booking.id,
    customer_name: booking.name,
    customer_email: booking.email,
    appointment_date: booking.appointment_date,
    appointment_time: booking.appointment_time,
    service_name: serviceName,
    price: servicePrice,
    price_display: priceDisplay,
    currency: 'EUR',
    payment_status: booking.payment_status,
    gutschein_applicable: true,
    payment_methods: {
      wallet: true,
      paypal: cfg.paypal.enabled,
    },
  });
};

/** POST /bookings/:id/pay — auth required */
export const payBooking: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: 'unauthorized' });

  const bookingId = safeStr((req.params as any)?.id);
  if (!bookingId || bookingId.length !== 36) return reply.code(400).send({ error: 'invalid_id' });

  const enabled = await isPaymentEnabled();
  if (!enabled) return reply.code(400).send({ error: 'booking_payment_disabled' });

  const body = req.body as {
    payment_method: 'wallet' | 'paypal' | 'gutschein';
    gutschein_code?: string;
    return_url?: string;
    cancel_url?: string;
  } | undefined;
  const method = safeStr(body?.payment_method);
  if (method !== 'wallet' && method !== 'paypal' && method !== 'gutschein') {
    return reply.code(400).send({ error: 'invalid_payment_method' });
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return reply.code(404).send({ error: 'booking_not_found' });
  if (booking.status !== 'confirmed') return reply.code(400).send({ error: 'booking_not_confirmed' });
  if (booking.payment_status === 'paid') return reply.code(400).send({ error: 'already_paid' });

  // Get service price
  const locale = booking.locale || 'de';
  let servicePrice = 0;

  if (booking.service_id) {
    const [svc] = await db
      .select({ price_numeric: servicesI18n.price_numeric })
      .from(servicesI18n)
      .where(and(eq(servicesI18n.service_id, booking.service_id), eq(servicesI18n.locale, locale)))
      .limit(1);
    servicePrice = svc?.price_numeric ? Number(svc.price_numeric) : 0;

    if (!servicePrice) {
      const [svcDe] = await db
        .select({ price_numeric: servicesI18n.price_numeric })
        .from(servicesI18n)
        .where(and(eq(servicesI18n.service_id, booking.service_id), eq(servicesI18n.locale, 'de')))
        .limit(1);
      servicePrice = svcDe?.price_numeric ? Number(svcDe.price_numeric) : 0;
    }
  }

  if (!servicePrice) return reply.code(400).send({ error: 'service_price_not_available' });

  // --- Gutschein validation (for gutschein-only or combined payment) ---
  const gutscheinCode = safeStr(body?.gutschein_code).toUpperCase();
  let gutscheinRow: any = null;
  let gutscheinDiscount = 0;

  if (gutscheinCode) {
    const [row] = await db
      .select()
      .from(gutscheins)
      .where(eq(gutscheins.code, gutscheinCode))
      .limit(1);

    if (!row) return reply.code(400).send({ error: 'gutschein_not_found' });
    if (row.status !== 'active') return reply.code(400).send({ error: 'gutschein_not_redeemable', status: row.status });
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      await db.update(gutscheins).set({ status: 'expired' } as any).where(eq(gutscheins.id, row.id));
      return reply.code(400).send({ error: 'gutschein_expired' });
    }

    gutscheinRow = row;
    gutscheinDiscount = Math.min(Number(row.value), servicePrice);
  }

  // --- GUTSCHEIN-ONLY PAYMENT (covers full price) ---
  if (method === 'gutschein') {
    if (!gutscheinRow) return reply.code(400).send({ error: 'gutschein_code_required' });
    if (gutscheinDiscount < servicePrice) {
      return reply.code(400).send({
        error: 'gutschein_insufficient',
        gutschein_value: Number(gutscheinRow.value),
        remaining: servicePrice - gutscheinDiscount,
      });
    }

    // Redeem gutschein
    await db.update(gutscheins).set({
      status: 'redeemed',
      redeemed_at: new Date(),
      redeemed_by_user_id: userId,
      redeemed_booking_id: bookingId,
    } as any).where(eq(gutscheins.id, gutscheinRow.id));

    // Mark booking as paid
    await db
      .update(bookings)
      .set({ payment_status: 'paid', updated_at: new Date() } as any)
      .where(eq(bookings.id, bookingId));

    return reply.send({
      success: true,
      payment_method: 'gutschein',
      booking_id: bookingId,
      amount: servicePrice,
      currency: 'EUR',
      gutschein_applied: {
        code: gutscheinRow.code,
        value: gutscheinDiscount,
      },
    });
  }

  // For wallet/paypal with gutschein: calculate final amount after discount
  const finalAmount = servicePrice - gutscheinDiscount;

  // --- WALLET PAYMENT ---
  if (method === 'wallet') {
    const result = await spendFromWallet({
      userId,
      amount: finalAmount,
      currency: 'EUR',
      purpose: 'booking_payment',
      description: `Booking payment: ${bookingId}${gutscheinCode ? ` (Gutschein: ${gutscheinCode})` : ''}`,
      transactionRef: bookingId,
    });

    if (!result.ok) {
      return reply.code(400).send({ error: result.reason });
    }

    // Redeem gutschein if used
    if (gutscheinRow) {
      await db.update(gutscheins).set({
        status: 'redeemed',
        redeemed_at: new Date(),
        redeemed_by_user_id: userId,
        redeemed_booking_id: bookingId,
      } as any).where(eq(gutscheins.id, gutscheinRow.id));
    }

    // Mark booking as paid
    await db
      .update(bookings)
      .set({ payment_status: 'paid', updated_at: new Date() } as any)
      .where(eq(bookings.id, bookingId));

    return reply.send({
      success: true,
      payment_method: 'wallet',
      booking_id: bookingId,
      amount: finalAmount,
      currency: 'EUR',
      transaction_id: result.tx?.id,
      gutschein_applied: gutscheinRow ? { code: gutscheinRow.code, value: gutscheinDiscount } : undefined,
    });
  }

  // --- PAYPAL PAYMENT ---
  const cfg = await getPaymentConfig();
  if (!cfg.paypal.enabled) return reply.code(400).send({ error: 'paypal_not_configured' });

  // Redeem gutschein before PayPal redirect (will be fully committed on capture)
  if (gutscheinRow) {
    await db.update(gutscheins).set({
      status: 'redeemed',
      redeemed_at: new Date(),
      redeemed_by_user_id: userId,
      redeemed_booking_id: bookingId,
    } as any).where(eq(gutscheins.id, gutscheinRow.id));
  }

  const frontendUrl = (env.FRONTEND_URL || 'https://energetische-massage-bonn.de').replace(/\/+$/, '');
  const returnUrl = safeStr(body?.return_url) || `${frontendUrl}/${locale}/booking-payment/${bookingId}?paypal=capture`;
  const cancelUrl = safeStr(body?.cancel_url) || `${frontendUrl}/${locale}/booking-payment/${bookingId}?paypal=cancel`;

  const ppCredentials: PaypalCredentials = {
    clientId: cfg.paypal.clientId!,
    clientSecret: cfg.paypal.clientSecret!,
    baseUrl: cfg.paypal.baseUrl,
  };

  try {
    const pp = await createPaypalOrder({
      amount: finalAmount.toFixed(2),
      currency: 'EUR',
      referenceId: bookingId,
      customId: `booking:${bookingId}`,
      description: `Booking payment`,
      returnUrl,
      cancelUrl,
    }, ppCredentials);

    // Set payment_status to pending
    await db
      .update(bookings)
      .set({ payment_status: 'unpaid', updated_at: new Date() } as any)
      .where(eq(bookings.id, bookingId));

    return reply.send({
      success: true,
      payment_method: 'paypal',
      booking_id: bookingId,
      amount: finalAmount,
      currency: 'EUR',
      paypal: {
        order_id: pp.orderId,
        approve_url: pp.approveUrl,
      },
      gutschein_applied: gutscheinRow ? { code: gutscheinRow.code, value: gutscheinDiscount } : undefined,
    });
  } catch (err: any) {
    req.log.error(err, 'paypal_create_booking_payment_failed');
    return reply.code(500).send({ error: 'paypal_create_failed' });
  }
};

/** POST /bookings/:id/paypal/capture — auth required */
export const captureBookingPaypal: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: 'unauthorized' });

  const bookingId = safeStr((req.params as any)?.id);
  if (!bookingId || bookingId.length !== 36) return reply.code(400).send({ error: 'invalid_id' });

  const body = req.body as { paypal_order_id: string } | undefined;
  const paypalOrderId = safeStr(body?.paypal_order_id);
  if (!paypalOrderId) return reply.code(400).send({ error: 'paypal_order_id_required' });

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return reply.code(404).send({ error: 'booking_not_found' });
  if (booking.payment_status === 'paid') {
    return reply.send({ success: true, already_paid: true, booking_id: bookingId });
  }

  const cfg = await getPaymentConfig();
  if (!cfg.paypal.enabled) return reply.code(400).send({ error: 'paypal_not_configured' });

  const ppCredentials: PaypalCredentials = {
    clientId: cfg.paypal.clientId!,
    clientSecret: cfg.paypal.clientSecret!,
    baseUrl: cfg.paypal.baseUrl,
  };

  try {
    const cap = await capturePaypalOrder(paypalOrderId, ppCredentials);

    if (cap.captureStatus !== 'COMPLETED') {
      await db
        .update(bookings)
        .set({ payment_status: 'failed', updated_at: new Date() } as any)
        .where(eq(bookings.id, bookingId));
      return reply.code(400).send({ error: 'paypal_capture_not_completed', capture_status: cap.captureStatus });
    }

    // Mark booking as paid
    await db
      .update(bookings)
      .set({ payment_status: 'paid', updated_at: new Date() } as any)
      .where(eq(bookings.id, bookingId));

    return reply.send({
      success: true,
      booking_id: bookingId,
      amount: cap.amount,
      currency: cap.currency,
      capture_id: cap.captureId,
    });
  } catch (err: any) {
    req.log.error(err, 'paypal_capture_booking_failed');
    return reply.code(500).send({ error: 'paypal_capture_failed' });
  }
};
