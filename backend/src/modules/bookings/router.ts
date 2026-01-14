// =============================================================
// FILE: src/modules/bookings/router.ts
// FINAL — Public booking routes
// =============================================================

import type { FastifyInstance } from 'fastify';
import { createBookingPublicHandler } from './controller';

export async function registerBookings(app: FastifyInstance) {
  const BASE = '/bookings';
  app.post(BASE, createBookingPublicHandler);
}
