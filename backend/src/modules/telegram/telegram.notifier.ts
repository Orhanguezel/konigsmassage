// ===================================================================
// FILE: src/modules/telegram/telegram.notifier.ts
// Telegram notifier — multi-language booking templates
// ===================================================================

import { getTelegramSettings, type TelegramEvent } from '@vps/shared-backend/modules/telegram/settings';

type TelegramNotifyInput =
  | {
      event: TelegramEvent;
      chatId?: string;
      data: Record<string, unknown>;
      locale?: string;
    }
  | {
      title: string;
      message: string;
      type?: string;
      createdAt?: Date;
      chatId?: string;
      botToken?: string;
    };

const escapeTelegramMarkdown = (text: string): string => {
  return text.replace(/([\\_*`\[\]])/g, '\\$1');
};

const renderTemplate = (tpl: string, data: Record<string, unknown>): string => {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const v = (data as Record<string, unknown>)[key];
    if (v === null || typeof v === 'undefined') return '';
    if (v instanceof Date) return escapeTelegramMarkdown(v.toISOString());
    return escapeTelegramMarkdown(String(v));
  });
};

const defaultFallbackMessage = (input: { title: string; message: string }): string => {
  const title = escapeTelegramMarkdown(input.title);
  const message = escapeTelegramMarkdown(input.message);
  return `🔔 *${title}*\n\n${message}`;
};

// ─── Default templates per locale ───────────────────────────────────

const DEFAULT_TEMPLATES: Record<string, Partial<Record<TelegramEvent, string>>> = {
  de: {
    new_booking:
      '📅 *Neue Terminanfrage*\n\n' +
      '👤 Kunde: {{customer_name}}\n' +
      '📧 E-Mail: {{customer_email}}\n' +
      '📱 Telefon: {{customer_phone}}\n' +
      '📆 Datum: {{appointment_date}}\n' +
      '🕐 Uhrzeit: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '🏠 Raum/Therapeut: {{resource_title}}\n' +
      '💬 Nachricht: {{customer_message}}',
    booking_confirmed:
      '✅ *Termin bestätigt*\n\n' +
      '👤 Kunde: {{customer_name}}\n' +
      '📆 Datum: {{appointment_date}}\n' +
      '🕐 Uhrzeit: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '📝 Notiz: {{decision_note}}',
    booking_rejected:
      '❌ *Termin abgelehnt*\n\n' +
      '👤 Kunde: {{customer_name}}\n' +
      '📆 Datum: {{appointment_date}}\n' +
      '🕐 Uhrzeit: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '📝 Grund: {{decision_note}}',
    booking_cancelled:
      '🚫 *Termin storniert*\n\n' +
      '👤 Kunde: {{customer_name}}\n' +
      '📆 Datum: {{appointment_date}}\n' +
      '🕐 Uhrzeit: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '📝 Grund: {{decision_note}}',
    booking_status_changed:
      '🔄 *Terminstatus geändert*\n\n' +
      '👤 Kunde: {{customer_name}}\n' +
      '📆 Datum: {{appointment_date}}\n' +
      '🕐 Uhrzeit: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '📊 Status: {{status_before}} → {{status_after}}\n' +
      '📝 Notiz: {{decision_note}}',
    new_contact:
      '📩 *Neue Kontaktnachricht*\n\n' +
      '👤 Name: {{name}}\n' +
      '📧 E-Mail: {{email}}\n' +
      '📱 Telefon: {{phone}}\n' +
      '📋 Betreff: {{subject}}\n' +
      '💬 Nachricht: {{message}}',
  },
  tr: {
    new_booking:
      '📅 *Yeni Randevu Talebi*\n\n' +
      '👤 Müşteri: {{customer_name}}\n' +
      '📧 E-posta: {{customer_email}}\n' +
      '📱 Telefon: {{customer_phone}}\n' +
      '📆 Tarih: {{appointment_date}}\n' +
      '🕐 Saat: {{appointment_time}}\n' +
      '💆 Hizmet: {{service_title}}\n' +
      '🏠 Oda/Terapist: {{resource_title}}\n' +
      '💬 Mesaj: {{customer_message}}',
    booking_confirmed:
      '✅ *Randevu Onaylandı*\n\n' +
      '👤 Müşteri: {{customer_name}}\n' +
      '📆 Tarih: {{appointment_date}}\n' +
      '🕐 Saat: {{appointment_time}}\n' +
      '💆 Hizmet: {{service_title}}\n' +
      '📝 Not: {{decision_note}}',
    booking_rejected:
      '❌ *Randevu Reddedildi*\n\n' +
      '👤 Müşteri: {{customer_name}}\n' +
      '📆 Tarih: {{appointment_date}}\n' +
      '🕐 Saat: {{appointment_time}}\n' +
      '💆 Hizmet: {{service_title}}\n' +
      '📝 Sebep: {{decision_note}}',
    booking_cancelled:
      '🚫 *Randevu İptal Edildi*\n\n' +
      '👤 Müşteri: {{customer_name}}\n' +
      '📆 Tarih: {{appointment_date}}\n' +
      '🕐 Saat: {{appointment_time}}\n' +
      '💆 Hizmet: {{service_title}}\n' +
      '📝 Sebep: {{decision_note}}',
    booking_status_changed:
      '🔄 *Randevu Durumu Değişti*\n\n' +
      '👤 Müşteri: {{customer_name}}\n' +
      '📆 Tarih: {{appointment_date}}\n' +
      '🕐 Saat: {{appointment_time}}\n' +
      '💆 Hizmet: {{service_title}}\n' +
      '📊 Durum: {{status_before}} → {{status_after}}\n' +
      '📝 Not: {{decision_note}}',
    new_contact:
      '📩 *Yeni İletişim Mesajı*\n\n' +
      '👤 Ad: {{name}}\n' +
      '📧 E-posta: {{email}}\n' +
      '📱 Telefon: {{phone}}\n' +
      '📋 Konu: {{subject}}\n' +
      '💬 Mesaj: {{message}}',
  },
  en: {
    new_booking:
      '📅 *New Booking Request*\n\n' +
      '👤 Customer: {{customer_name}}\n' +
      '📧 Email: {{customer_email}}\n' +
      '📱 Phone: {{customer_phone}}\n' +
      '📆 Date: {{appointment_date}}\n' +
      '🕐 Time: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '🏠 Room/Therapist: {{resource_title}}\n' +
      '💬 Message: {{customer_message}}',
    booking_confirmed:
      '✅ *Booking Confirmed*\n\n' +
      '👤 Customer: {{customer_name}}\n' +
      '📆 Date: {{appointment_date}}\n' +
      '🕐 Time: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '📝 Note: {{decision_note}}',
    booking_rejected:
      '❌ *Booking Rejected*\n\n' +
      '👤 Customer: {{customer_name}}\n' +
      '📆 Date: {{appointment_date}}\n' +
      '🕐 Time: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '📝 Reason: {{decision_note}}',
    booking_cancelled:
      '🚫 *Booking Cancelled*\n\n' +
      '👤 Customer: {{customer_name}}\n' +
      '📆 Date: {{appointment_date}}\n' +
      '🕐 Time: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '📝 Reason: {{decision_note}}',
    booking_status_changed:
      '🔄 *Booking Status Changed*\n\n' +
      '👤 Customer: {{customer_name}}\n' +
      '📆 Date: {{appointment_date}}\n' +
      '🕐 Time: {{appointment_time}}\n' +
      '💆 Service: {{service_title}}\n' +
      '📊 Status: {{status_before}} → {{status_after}}\n' +
      '📝 Note: {{decision_note}}',
    new_contact:
      '📩 *New Contact Message*\n\n' +
      '👤 Name: {{name}}\n' +
      '📧 Email: {{email}}\n' +
      '📱 Phone: {{phone}}\n' +
      '📋 Subject: {{subject}}\n' +
      '💬 Message: {{message}}',
  },
};

function getDefaultTemplate(event: TelegramEvent, locale: string): string {
  const langTemplates = DEFAULT_TEMPLATES[locale] ?? DEFAULT_TEMPLATES['de'];
  return langTemplates[event] ?? `🔔 *${event}*\n\n{{message}}`;
}

// ─── Core send ──────────────────────────────────────────────────────

async function sendTelegramMessage(opts: {
  botToken: string;
  chatId: string;
  text: string;
}): Promise<void> {
  const url = `https://api.telegram.org/bot${opts.botToken}/sendMessage`;

  const payload = {
    chat_id: opts.chatId,
    text: opts.text,
    parse_mode: 'Markdown' as const,
    disable_web_page_preview: true,
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`telegram_send_failed status=${r.status} body=${body}`);
  }
}

function isEventAllowed(
  events: Partial<Record<TelegramEvent, boolean>> | undefined,
  event: TelegramEvent,
): boolean {
  if (!events) return true;
  const v = events[event];
  if (typeof v === 'boolean') return v;
  return true;
}

/**
 * RAW send for webhook replies / inbound messaging.
 */
export async function telegramSendRaw(input: { chatId: string; text: string }): Promise<void> {
  try {
    const cfg = await getTelegramSettings();
    if (!cfg.webhookEnabled) return;
    if (!cfg.botToken) return;

    const safeText = escapeTelegramMarkdown(String(input.text ?? ''));

    await sendTelegramMessage({
      botToken: cfg.botToken,
      chatId: input.chatId,
      text: safeText,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('telegram_send_raw_failed', err);
    return;
  }
}

/**
 * Event-based or generic Telegram notification.
 * locale param determines template language (de/tr/en).
 */
export async function telegramNotify(input: TelegramNotifyInput): Promise<void> {
  try {
    const locale = 'event' in input ? String(input.locale || input.data?.locale || '') : '';
    const cfg = await getTelegramSettings();

    if (!cfg.enabled) return;
    if (!cfg.botToken) return;

    // 1) Event template path
    if ('event' in input) {
      const event: TelegramEvent = input.event;

      if (!isEventAllowed(cfg.events, event)) return;

      const chatId = input.chatId ?? cfg.defaultChatId ?? cfg.legacyChatId;
      if (!chatId) return;

      // Priority: site_settings template > hardcoded default
      const savedTpl = (cfg.templates?.[event] ?? '').trim();
      const effectiveLocale = locale || 'de';
      const tpl = savedTpl || getDefaultTemplate(event, effectiveLocale);

      const text = renderTemplate(tpl, input.data);

      await sendTelegramMessage({
        botToken: cfg.botToken,
        chatId,
        text,
      });

      return;
    }

    // 2) Generic path
    const chatId = input.chatId ?? cfg.defaultChatId ?? cfg.legacyChatId;
    if (!chatId) return;

    // Allow overriding bot token for testing
    const token = ('botToken' in input ? input.botToken : undefined) || cfg.botToken;
    if (!token) return;

    const text = defaultFallbackMessage({
      title: input.title,
      message: input.message,
    });

    await sendTelegramMessage({
      botToken: token,
      chatId,
      text,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('telegram_notify_failed', err);
    throw err; // Re-throw to allow API error response
  }
}
