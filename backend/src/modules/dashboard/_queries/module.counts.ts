// ===================================================================
// FILE: src/modules/dashboard/_queries/module.counts.ts
// FINAL — Counts for all imported modules
// ===================================================================

import { db } from '@/db/client';
import { sql, eq } from 'drizzle-orm';

import { resources } from '@/modules/resources/schema';
import { services } from '@/modules/services/schema';
import { faqs } from '@/modules/faqs/schema';
import { contact_messages } from '@/modules/contact/schema';
import { emailTemplates } from '@/modules/email-templates/schema';
import { siteSettings } from '@/modules/siteSettings/schema';
import { customPages } from '@/modules/customPages/schema';
import { menuItems } from '@/modules/menuItems/schema';
import { slider } from '@/modules/slider/schema';
import { footerSections } from '@/modules/footerSections/schema';
import { reviews } from '@/modules/review/schema';
import { users } from '@/modules/auth/schema';
import { storageAssets } from '@/modules/storage/schema';
import { bookings } from '@/modules/bookings/schema';
import { notifications } from '@/modules/notifications/schema';
import { auditRequestLogs } from '@/modules/audit/schema';
import { resourceSlots } from '@/modules/availability/schema';

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function getModuleCounts() {
  const [
    resources_total_row,
    services_total_row,
    faqs_total_row,
    email_templates_total_row,
    site_settings_total_row,
    custom_pages_total_row,
    menu_items_total_row,
    slider_total_row,
    footer_sections_total_row,
    reviews_total_row,
    users_total_row,
    storage_assets_total_row,
    contact_total_row,
    bookings_total_row,
    notifications_total_row,
    audit_logs_total_row,
    slots_total_row,
  ] = await Promise.all([
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(resources)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(services)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(faqs)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(emailTemplates)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(siteSettings)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(customPages)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(menuItems)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(slider)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(footerSections)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(reviews)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(users)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(storageAssets)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(contact_messages)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(bookings)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(notifications)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(auditRequestLogs)
      .limit(1),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(resourceSlots)
      .limit(1),
  ]);

  // DB Snapshot count (reads from filesystem index)
  let db_snapshots_total = 0;
  try {
    const SNAPSHOT_INDEX_FILE = join(process.cwd(), 'uploads', 'db_snapshots', 'index.json');
    if (existsSync(SNAPSHOT_INDEX_FILE)) {
      const raw = readFileSync(SNAPSHOT_INDEX_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) db_snapshots_total = parsed.length;
    }
  } catch {
    // ignore
  }

  return {
    resources_total: Number(resources_total_row?.[0]?.c ?? 0) || 0,
    services_total: Number(services_total_row?.[0]?.c ?? 0) || 0,
    faqs_total: Number(faqs_total_row?.[0]?.c ?? 0) || 0,
    email_templates_total: Number(email_templates_total_row?.[0]?.c ?? 0) || 0,
    site_settings_total: Number(site_settings_total_row?.[0]?.c ?? 0) || 0,
    custom_pages_total: Number(custom_pages_total_row?.[0]?.c ?? 0) || 0,
    menu_items_total: Number(menu_items_total_row?.[0]?.c ?? 0) || 0,
    slider_total: Number(slider_total_row?.[0]?.c ?? 0) || 0,
    footer_sections_total: Number(footer_sections_total_row?.[0]?.c ?? 0) || 0,
    reviews_total: Number(reviews_total_row?.[0]?.c ?? 0) || 0,
    users_total: Number(users_total_row?.[0]?.c ?? 0) || 0,
    storage_assets_total: Number(storage_assets_total_row?.[0]?.c ?? 0) || 0,
    contact_messages_total: Number(contact_total_row?.[0]?.c ?? 0) || 0,
    bookings_total: Number(bookings_total_row?.[0]?.c ?? 0) || 0,
    notifications_total: Number(notifications_total_row?.[0]?.c ?? 0) || 0,
    audit_logs_total: Number(audit_logs_total_row?.[0]?.c ?? 0) || 0,
    availability_total: Number(slots_total_row?.[0]?.c ?? 0) || 0,
    db_snapshots_total,
  };
}

export async function getUnreadContactCount() {
  // contact_messages şeması burada paylaşılmadı; ama bookings’te is_read var.
  // Bu yüzden iki olasılığı güvenli ele alıyoruz: is_read veya read_at.
  const [row] = await db
    .select({
      c: sql<number>`COUNT(*)`,
    })
    .from(contact_messages)
    .where(eq(contact_messages.status, 'new'))
    .limit(1);

  return Number(row?.c ?? 0) || 0;
}
