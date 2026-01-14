// =============================================================
// FILE: src/modules/contact/controller.ts (PUBLIC)
// FINAL — Contact public controller (templated mailer i18n)
// - Uses sendTemplatedEmail (mailer.ts) instead of calling render directly
// - locale/defaultLocale resolved from req headers/pipeline
// - Best-effort emails (never fail the public request)
// =============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { ContactCreateSchema } from './validation';
import { repoCreateContact } from './repository';
import type { ContactView } from './schema';

import { sendTemplatedEmail } from '@/modules/email-templates/mailer';
import { getSmtpSettings } from '@/modules/siteSettings/service';

type CreateReq = FastifyRequest<{ Body: unknown }>;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeText(v: unknown) {
  return String(v ?? '').trim();
}

/**
 * Contact form gönderildiğinde:
 * 1) Admin'e template tabanlı mail (contact_admin_notification)
 * 2) Kullanıcıya otomatik cevap (contact_user_autoreply)
 */
async function sendContactEmails(args: {
  contact: ContactView;
  locale?: string | null;
  defaultLocale?: string | null;
}) {
  const { contact, locale = null, defaultLocale = null } = args;

  // Admin maili nereye gidecek?
  const smtpCfg = await getSmtpSettings();
  const adminTo =
    safeText((smtpCfg as any)?.fromEmail) || safeText((smtpCfg as any)?.username) || contact.email; // son çare: kullanıcıya da gitsin

  // ---------------------------
  // 1) Admin Notification
  // ---------------------------
  const adminParams = {
    name: escapeHtml(contact.name),
    email: escapeHtml(contact.email),
    phone: escapeHtml(contact.phone),
    subject: escapeHtml(contact.subject),
    message: escapeHtml(contact.message),
    ip: contact.ip ? escapeHtml(contact.ip) : '',
    user_agent: contact.user_agent ? escapeHtml(contact.user_agent) : '',
  };

  await sendTemplatedEmail({
    to: adminTo,
    key: 'contact_admin_notification',
    locale,
    defaultLocale,
    params: adminParams,
    allowMissing: false,
  });

  // ---------------------------
  // 2) User Auto-reply
  // ---------------------------
  const userParams = {
    name: escapeHtml(contact.name),
    subject: escapeHtml(contact.subject),
  };

  await sendTemplatedEmail({
    to: contact.email,
    key: 'contact_user_autoreply',
    locale,
    defaultLocale,
    params: userParams,
    allowMissing: false,
  });
}

export async function createContactPublic(req: CreateReq, reply: FastifyReply) {
  const parsed = ContactCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'INVALID_BODY', details: parsed.error.flatten() });
  }

  // Basit honeypot: website doluysa drop et
  if (parsed.data.website && String(parsed.data.website).trim().length > 0) {
    return reply.code(200).send({ ok: true }); // sessiz discard
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.socket as any)?.remoteAddress ||
    null;

  const ua = (req.headers['user-agent'] as string) || null;

  const created = await repoCreateContact({
    ...parsed.data,
    ip,
    user_agent: ua,
  });

  // Locale pipeline (metahub pattern) + header fallback
  const locale = ((req as any).locale ?? (req.headers['x-locale'] as any) ?? null) as string | null;

  const defaultLocale = ((req as any).defaultLocale ??
    (req.headers['x-default-locale'] as any) ??
    null) as string | null;

  // Mail gönder; hata olursa logla ama kullanıcıya hata gösterme
  try {
    await sendContactEmails({ contact: created, locale, defaultLocale });
  } catch (err: any) {
    req.log?.error?.({ err }, 'contact_email_send_failed');
  }

  return reply.code(201).send(created);
}
