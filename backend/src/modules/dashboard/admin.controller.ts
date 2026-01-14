// ===================================================================
// FILE: src/modules/dashboard/admin.controller.ts
// FINAL — Königsmassage Admin Dashboard Analytics (Orchestrator)
// ===================================================================

import type { RouteHandler } from 'fastify';

import type { DashboardAnalyticsDto } from '../_shared';
import { parseRange, computeWindow } from '../_shared';

import {
  getBookingTotals,
  getBookingTrend,
  getBookingAggByResource,
} from './_queries/bookings.analytics';
import { getSlotsTotals, getSlotsAggByResource } from './_queries/availability.analytics';
import { getModuleCounts, getUnreadContactCount } from './_queries/module.counts';
import { getResourceNameMap } from './_queries/resources.lookup';

function safeText(v: unknown, fb = '—') {
  const s = String(v ?? '').trim();
  return s ? s : fb;
}

export const getDashboardAnalyticsAdmin: RouteHandler = async (req, reply) => {
  const range = parseRange((req.query as any)?.range);
  const { fromYmd, toYmdExclusive, bucket } = computeWindow(range);

  try {
    // 1) bookings
    const bookingTotals = await getBookingTotals(fromYmd, toYmdExclusive);
    const trend = await getBookingTrend(fromYmd, toYmdExclusive, bucket);
    const bookingAggByResource = await getBookingAggByResource(fromYmd, toYmdExclusive);

    // 2) slots
    const slotTotals = await getSlotsTotals(fromYmd, toYmdExclusive);

    // 3) module counts
    const moduleCounts = await getModuleCounts();
    const contact_messages_unread = await getUnreadContactCount();

    // 4) breakdown resources
    const resourceIds = Array.from(
      new Set(bookingAggByResource.map((r) => String(r.resource_id || '').trim()).filter(Boolean)),
    );

    const resourceNameMap = await getResourceNameMap(resourceIds);
    const slotAggMap = await getSlotsAggByResource(fromYmd, toYmdExclusive, resourceIds);

    const resources = bookingAggByResource
      .filter((r) => String(r.resource_id || '').trim())
      .map((r) => {
        const id = String(r.resource_id);
        const slotStats = slotAggMap.get(id) ?? { slots_total: 0, slots_reserved: 0 };

        return {
          resource_id: id,
          resource_name: safeText(resourceNameMap.get(id), '—'),
          bookings_total: r.bookings_total,
          bookings_new: r.bookings_new,
          bookings_confirmed: r.bookings_confirmed,
          bookings_completed: r.bookings_completed,
          bookings_cancelled: r.bookings_cancelled,
          slots_total: slotStats.slots_total,
          slots_reserved: slotStats.slots_reserved,
        };
      })
      .sort((a, b) => b.bookings_total - a.bookings_total);

    const payload: DashboardAnalyticsDto = {
      range,
      fromYmd,
      toYmdExclusive,
      meta: { bucket },

      totals: {
        ...bookingTotals,
        ...slotTotals,

        ...moduleCounts,
        contact_messages_unread,
        contact_messages_total: moduleCounts.contact_messages_total,
      },

      resources,
      trend,
    };

    return reply.send(payload);
  } catch (err) {
    req.log.error({ err }, 'dashboard_analytics_failed');
    return reply.code(500).send({ error: { message: 'dashboard_analytics_failed' } });
  }
};
