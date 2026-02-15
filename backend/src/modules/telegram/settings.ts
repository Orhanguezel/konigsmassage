// ===================================================================
// FILE: src/modules/telegram/settings.ts
// Telegram settings loader from site_settings (multi-language support)
// ===================================================================

import { and, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { siteSettings } from '@/modules/siteSettings/schema';

export type TelegramEvent =
  | 'new_booking'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'booking_status_changed'
  | 'new_contact';

type TelegramSettings = {
  enabled: boolean;
  webhookEnabled: boolean;
  botToken: string;
  defaultChatId: string | null;
  legacyChatId: string | null;
  notificationLocale: string;
  events: Partial<Record<TelegramEvent, boolean>>;
  templates: Partial<Record<TelegramEvent, string>>;
};

const GLOBAL_LOCALE = '*';

/** DB values are JSON.stringify'd — unwrap JSON primitives to plain strings. */
function parseDbValue(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : raw;
  } catch {
    return raw;
  }
}

function toBool(v: string | null | undefined, fallback = false): boolean {
  if (v == null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (!s) return fallback;
  return ['1', 'true', 'yes', 'on', 'y'].includes(s);
}

function toText(v: string | null | undefined): string {
  return String(v ?? '').trim();
}

export async function getSiteSettingsMap(keys: readonly string[]): Promise<Map<string, string>> {
  if (!keys.length) return new Map();

  const rows = await db
    .select({ key: siteSettings.key, locale: siteSettings.locale, value: siteSettings.value })
    .from(siteSettings)
    .where(and(inArray(siteSettings.key, keys as string[]), inArray(siteSettings.locale, [GLOBAL_LOCALE])));

  const out = new Map<string, string>();
  for (const k of keys) {
    const hit = rows.find((r) => r.key === k && r.locale === GLOBAL_LOCALE);
    if (hit) out.set(k, parseDbValue(String(hit.value ?? '')));
  }
  return out;
}

/**
 * Locale-aware settings map: önce locale-specific, fallback global
 */
async function getSiteSettingsMapWithLocale(
  keys: readonly string[],
  locale: string,
): Promise<Map<string, string>> {
  if (!keys.length) return new Map();

  const locales = locale !== GLOBAL_LOCALE ? [GLOBAL_LOCALE, locale] : [GLOBAL_LOCALE];

  const rows = await db
    .select({ key: siteSettings.key, locale: siteSettings.locale, value: siteSettings.value })
    .from(siteSettings)
    .where(and(inArray(siteSettings.key, keys as string[]), inArray(siteSettings.locale, locales)));

  const out = new Map<string, string>();
  for (const k of keys) {
    // Prefer locale-specific, fallback to global
    const localeHit = rows.find((r) => r.key === k && r.locale === locale);
    const globalHit = rows.find((r) => r.key === k && r.locale === GLOBAL_LOCALE);
    const hit = localeHit ?? globalHit;
    if (hit) out.set(k, parseDbValue(String(hit.value ?? '')));
  }
  return out;
}

export async function getTelegramSettings(locale?: string): Promise<TelegramSettings> {
  const events: TelegramEvent[] = [
    'new_booking',
    'booking_confirmed',
    'booking_rejected',
    'booking_cancelled',
    'booking_status_changed',
    'new_contact',
  ];

  const eventEnableKeys = events.flatMap((e) => [
    `telegram_event_${e}_enabled`,
    `telegram_${e}_enabled`,
  ]);
  const templateKeys = events.flatMap((e) => [`telegram_template_${e}`, `telegram_${e}_template`]);

  const baseKeys = [
    'telegram_notifications_enabled',
    'telegram_enabled',
    'telegram_webhook_enabled',
    'telegram_bot_token',
    'telegram_default_chat_id',
    'telegram_chat_id',
    'telegram_notification_locale',
  ];

  const allKeys = [...baseKeys, ...eventEnableKeys, ...templateKeys];

  // Template'ler locale-aware, diğerleri global
  const notifLocale = locale || 'de';
  const map = await getSiteSettingsMapWithLocale(allKeys, notifLocale);

  const enabled =
    toBool(map.get('telegram_notifications_enabled'), false) ||
    toBool(map.get('telegram_enabled'), false);

  const webhookEnabled = toBool(map.get('telegram_webhook_enabled'), true);
  const botToken = toText(map.get('telegram_bot_token'));
  const defaultChatId = toText(map.get('telegram_default_chat_id')) || null;
  const legacyChatId = toText(map.get('telegram_chat_id')) || null;
  const notificationLocale = toText(map.get('telegram_notification_locale')) || 'de';

  const eventMap: Partial<Record<TelegramEvent, boolean>> = {};
  const templates: Partial<Record<TelegramEvent, string>> = {};

  for (const event of events) {
    const enabledRaw =
      map.get(`telegram_event_${event}_enabled`) ?? map.get(`telegram_${event}_enabled`) ?? null;
    if (enabledRaw != null) eventMap[event] = toBool(enabledRaw, true);

    const templateRaw =
      map.get(`telegram_template_${event}`) ?? map.get(`telegram_${event}_template`) ?? null;
    const tpl = toText(templateRaw);
    if (tpl) templates[event] = tpl;
  }

  return {
    enabled,
    webhookEnabled,
    botToken,
    defaultChatId,
    legacyChatId,
    notificationLocale,
    events: eventMap,
    templates,
  };
}
