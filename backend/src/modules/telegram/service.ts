// ===================================================================
// FILE: src/modules/telegram/service.ts
// Telegram module services (admin tools + inbound webhook)
// ===================================================================

import { randomUUID } from 'crypto';
import { telegramNotify, telegramSendRaw } from './telegram.notifier';
import { TelegramAdminRepo } from './repository';
import type {
  TelegramSendBody,
  TelegramEventBody,
  TelegramWebhookBody,
} from './validation';

function toSafeString(v: unknown): string {
  return String(v ?? '').trim();
}

function toChatId(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return toSafeString(v);
}

function toBoolInt(v: unknown): number {
  return v === true ? 1 : 0;
}

/**
 * Generic message send (no template selection).
 */
export async function sendTelegramGeneric(input: TelegramSendBody) {
  await telegramNotify({
    title: input.title,
    message: input.message,
    type: input.type,
    chatId: input.chat_id,
    botToken: input.bot_token, // manual override
    createdAt: new Date(),
  });

  return { ok: true };
}

/**
 * Template-based event send (site_settings templates + flags).
 */
export async function sendTelegramEvent(input: TelegramEventBody) {
  await telegramNotify({
    event: input.event as any,
    chatId: input.chat_id,
    data: input.data ?? {},
  });

  return { ok: true };
}

/**
 * Simple test message to confirm bot token + chat_id works.
 */
export async function sendTelegramTest(chatId?: string) {
  await telegramNotify({
    title: 'Telegram Test',
    message: 'Telegram bildirim testi başarılı.',
    chatId,
    createdAt: new Date(),
  });

  return { ok: true };
}

/**
 * Stores inbound updates and optionally sends a simple auto-reply.
 */
export async function processTelegramWebhook(update: TelegramWebhookBody) {
  const msg = update.message;
  const chatId = toChatId(msg?.chat?.id);

  // Persist only message updates with chat_id.
  if (msg && chatId) {
    await TelegramAdminRepo.insertInbound({
      id: randomUUID(),
      update_id: Number(update.update_id),
      message_id: typeof msg.message_id === 'number' ? msg.message_id : null,
      chat_id: chatId,
      chat_type: toSafeString(msg.chat?.type) || null,
      chat_title: toSafeString(msg.chat?.title) || null,
      chat_username: toSafeString(msg.chat?.username) || null,
      from_id: toChatId(msg.from?.id) || null,
      from_username: toSafeString(msg.from?.username) || null,
      from_first_name: toSafeString(msg.from?.first_name) || null,
      from_last_name: toSafeString(msg.from?.last_name) || null,
      from_is_bot: toBoolInt(msg.from?.is_bot),
      text: typeof msg.text === 'string' ? msg.text : null,
      raw: JSON.stringify(update),
      telegram_date: typeof msg.date === 'number' ? msg.date : null,
      created_at: new Date(),
    } as any);

    const autoReply = await TelegramAdminRepo.getAutoReply();
    const isUserText = !msg.from?.is_bot && typeof msg.text === 'string' && msg.text.trim().length > 0;

    if (autoReply.enabled && isUserText) {
      await telegramSendRaw({
        chatId,
        text: autoReply.template,
      });
    }
  }

  return { ok: true };
}
