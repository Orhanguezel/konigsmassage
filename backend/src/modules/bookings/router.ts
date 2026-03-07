// =============================================================
// FILE: src/modules/bookings/router.ts
// FINAL — Public booking routes
// =============================================================

import type { FastifyInstance } from 'fastify';
import { createBookingPublicHandler } from './controller';
import { getBookingPaymentInfo, payBooking, captureBookingPaypal } from './payment.controller';
import { requireAuth } from '@/common/middleware/auth';

export async function registerBookings(app: FastifyInstance) {
  const BASE = '/bookings';
  app.post(BASE, createBookingPublicHandler);

  // Booking payment endpoints
  app.get(`${BASE}/:id/payment-info`, getBookingPaymentInfo);
  app.post(`${BASE}/:id/pay`, { preHandler: [requireAuth] }, payBooking);
  app.post(`${BASE}/:id/paypal/capture`, { preHandler: [requireAuth] }, captureBookingPaypal);
}
