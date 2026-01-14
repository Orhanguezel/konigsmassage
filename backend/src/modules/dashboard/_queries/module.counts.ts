// ===================================================================
// FILE: src/modules/dashboard/_queries/module.counts.ts
// FINAL — Counts for all imported modules
// ===================================================================

import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

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
  ]);

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
    .where(
      sql`(
        (${(contact_messages as any).is_read} = 0)
        OR (${(contact_messages as any).read_at} IS NULL)
      )`,
    )
    .limit(1);

  return Number(row?.c ?? 0) || 0;
}
