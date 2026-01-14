// ===================================================================
// FILE: src/modules/mail/service.ts
// FINAL — SMTP mail service + template helpers (i18n opts compatible)
// ===================================================================

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { z } from 'zod';

import {
  sendMailSchema,
  type SendMailInput,
  orderCreatedMailSchema,
  type OrderCreatedMailInput,
} from './validation';
import { getSmtpSettings, type SmtpSettings } from '@/modules/siteSettings/service';

import { renderEmailTemplateByKey } from '@/modules/email-templates/service';
import { emitAppEvent } from '@/common/events/bus';

import { db } from '@/db/client';
import { siteSettings } from '@/modules/siteSettings/schema';
import { eq } from 'drizzle-orm';

let cachedTransporter: Transporter | null = null;
let cachedSignature: string | null = null;

type ResolvedSmtpConfig = SmtpSettings & {
  host: string;
  port: number;
  secure: boolean;
  username?: string | null;
  password?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
};

function buildSignature(cfg: {
  host?: string;
  port?: number;
  username?: string | null;
  secure?: boolean;
}) {
  return [cfg.host ?? '', cfg.port ?? '', cfg.username ?? '', cfg.secure ? '1' : '0'].join('|');
}

async function resolveSmtpConfig(): Promise<ResolvedSmtpConfig> {
  const dbCfg = await getSmtpSettings();

  const host = (dbCfg.host ?? '').trim();
  if (!host) throw new Error('smtp_host_not_configured');

  let port: number;
  if (typeof dbCfg.port === 'number' && dbCfg.port > 0) port = dbCfg.port;
  else port = 587;

  let secure: boolean;
  if (typeof dbCfg.secure === 'boolean') secure = dbCfg.secure;
  else secure = port === 465;

  const username = dbCfg.username ?? null;
  const password = dbCfg.password ?? null;
  const fromEmail = dbCfg.fromEmail ?? null;
  const fromName = dbCfg.fromName ?? null;

  return { ...dbCfg, host, port, secure, username, password, fromEmail, fromName };
}

/* ==================================================================
   SITE NAME HELPER
   ================================================================== */

let cachedSiteName: string | null = null;
let cachedSiteNameLoadedAt: number | null = null;

async function getSiteNameFromSettings(): Promise<string> {
  const now = Date.now();
  if (cachedSiteName && cachedSiteNameLoadedAt && now - cachedSiteNameLoadedAt < 5 * 60_000) {
    return cachedSiteName;
  }

  const [titleRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, 'site_title'))
    .limit(1);

  if (titleRow?.value) {
    cachedSiteName = String(titleRow.value);
    cachedSiteNameLoadedAt = now;
    return cachedSiteName;
  }

  const [companyRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, 'footer_company_name'))
    .limit(1);

  if (companyRow?.value) {
    cachedSiteName = String(companyRow.value);
    cachedSiteNameLoadedAt = now;
    return cachedSiteName;
  }

  cachedSiteName = 'Site';
  cachedSiteNameLoadedAt = now;
  return cachedSiteName;
}

async function enrichParamsWithSiteName(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (Object.prototype.hasOwnProperty.call(params, 'site_name')) return params;
  const siteName = await getSiteNameFromSettings();
  return { ...params, site_name: siteName };
}

/* ==================================================================
   SMTP TRANSPORTER
   ================================================================== */

async function getTransporter(): Promise<Transporter> {
  const cfg = await resolveSmtpConfig();

  const signature = buildSignature({
    host: cfg.host,
    port: cfg.port,
    username: cfg.username ?? undefined,
    secure: cfg.secure,
  });

  if (cachedTransporter && cachedSignature === signature) return cachedTransporter;

  const auth =
    cfg.username && cfg.password
      ? {
          user: cfg.username,
          pass: cfg.password,
        }
      : undefined;

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth,
  });

  cachedTransporter = transporter;
  cachedSignature = signature;

  return transporter;
}

/* ==================================================================
   LOW-LEVEL SENDER
   ================================================================== */

export async function sendMail(input: SendMailInput) {
  return sendMailRaw(input);
}

export async function sendMailRaw(input: SendMailInput) {
  const data = sendMailSchema.parse(input);

  const smtpCfg = await resolveSmtpConfig();
  const fromEmail = smtpCfg.fromEmail || smtpCfg.username || 'no-reply@example.com';
  const from = smtpCfg.fromName && fromEmail ? `${smtpCfg.fromName} <${fromEmail}>` : fromEmail;

  const transporter = await getTransporter();

  try {
    const info = await transporter.sendMail({
      from,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    });

    emitAppEvent({
      level: 'info',
      topic: 'mail.sent',
      message: 'mail_sent',
      meta: {
        to: data.to,
        subject: data.subject,
        smtp_host: smtpCfg.host,
        smtp_port: smtpCfg.port,
        secure: smtpCfg.secure,
        messageId: (info as any)?.messageId ?? null,
        accepted: (info as any)?.accepted ?? null,
        rejected: (info as any)?.rejected ?? null,
      },
      entity: null,
    });

    return info;
  } catch (err: any) {
    emitAppEvent({
      level: 'error',
      topic: 'mail.failed',
      message: 'mail_send_failed',
      meta: {
        to: data.to,
        subject: data.subject,
        smtp_host: smtpCfg.host,
        smtp_port: smtpCfg.port,
        secure: smtpCfg.secure,
        error: String(err?.message ?? err),
      },
      entity: null,
    });
    throw err;
  }
}

/* ==================================================================
   TEMPLATE HELPERS (use renderEmailTemplateByKey with opts object)
   ================================================================== */

function pickDefaultLocale(inputLocale?: string | null) {
  // burada sadece pass-through yapıyoruz; gerçek fallback renderEmailTemplateByKey içinde
  return inputLocale ?? null;
}

/* ------------------ ORDER RECEIVED (order_received) ------------------ */

export async function sendOrderCreatedMail(input: OrderCreatedMailInput) {
  const data = orderCreatedMailSchema.parse(input);

  const baseParams: Record<string, unknown> = {
    customer_name: data.customer_name,
    order_number: data.order_number,
    final_amount: data.final_amount,
    status: data.status,
    site_name: data.site_name,
    // locale passthrough (istersen)
    locale: data.locale,
  };

  const params = await enrichParamsWithSiteName(baseParams);

  const rendered = await renderEmailTemplateByKey('order_received', params, {
    locale: pickDefaultLocale(data.locale ?? null),
    defaultLocale: null,
    allowMissing: false,
  });

  if (!rendered) {
    throw new Error('email_template_not_found:order_received');
  }

  await sendMail({
    to: data.to,
    subject: rendered.subject,
    html: rendered.html,
  });

  return rendered;
}

/* ------------------ DEPOSIT SUCCESS (deposit_success) ------------------ */

const depositSuccessMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  amount: z.union([z.string(), z.number()]),
  new_balance: z.union([z.string(), z.number()]),
  site_name: z.string().optional(),
  locale: z.string().optional(),
  default_locale: z.string().optional(),
});

export type DepositSuccessMailInput = z.infer<typeof depositSuccessMailSchema>;

export async function sendDepositSuccessMail(input: DepositSuccessMailInput) {
  const data = depositSuccessMailSchema.parse(input);

  const amountStr = typeof data.amount === 'number' ? data.amount.toFixed(2) : String(data.amount);
  const newBalanceStr =
    typeof data.new_balance === 'number' ? data.new_balance.toFixed(2) : String(data.new_balance);

  const baseParams: Record<string, unknown> = {
    user_name: data.user_name,
    amount: amountStr,
    new_balance: newBalanceStr,
    site_name: data.site_name,
    locale: data.locale,
    default_locale: data.default_locale,
  };

  const params = await enrichParamsWithSiteName(baseParams);

  const rendered = await renderEmailTemplateByKey('deposit_success', params, {
    locale: data.locale ?? null,
    defaultLocale: data.default_locale ?? null,
    allowMissing: false,
  });

  if (!rendered) throw new Error('email_template_not_found:deposit_success');

  await sendMail({
    to: data.to,
    subject: rendered.subject,
    html: rendered.html,
  });

  return rendered;
}

/* ------------------ PASSWORD RESET (password_reset) ------------------ */

const passwordResetMailSchema = z.object({
  to: z.string().email(),
  reset_link: z.string().min(1),
  site_name: z.string().optional(),
  locale: z.string().optional(),
  default_locale: z.string().optional(),
});

export type PasswordResetMailInput = z.infer<typeof passwordResetMailSchema>;

export async function sendPasswordResetMail(input: PasswordResetMailInput) {
  const data = passwordResetMailSchema.parse(input);

  const baseParams: Record<string, unknown> = {
    reset_link: data.reset_link,
    site_name: data.site_name,
    locale: data.locale,
    default_locale: data.default_locale,
  };

  const params = await enrichParamsWithSiteName(baseParams);

  const rendered = await renderEmailTemplateByKey('password_reset', params, {
    locale: data.locale ?? null,
    defaultLocale: data.default_locale ?? null,
    allowMissing: false,
  });

  if (!rendered) throw new Error('email_template_not_found:password_reset');

  await sendMail({
    to: data.to,
    subject: rendered.subject,
    html: rendered.html,
  });

  return rendered;
}

/* ------------------ TICKET REPLIED (ticket_replied) ------------------ */

const ticketRepliedMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  ticket_id: z.string(),
  ticket_subject: z.string(),
  reply_message: z.string(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
  default_locale: z.string().optional(),
});

export type TicketRepliedMailInput = z.infer<typeof ticketRepliedMailSchema>;

export async function sendTicketRepliedMail(input: TicketRepliedMailInput) {
  const data = ticketRepliedMailSchema.parse(input);

  const baseParams: Record<string, unknown> = {
    user_name: data.user_name,
    ticket_id: data.ticket_id,
    ticket_subject: data.ticket_subject,
    reply_message: data.reply_message,
    site_name: data.site_name,
    locale: data.locale,
    default_locale: data.default_locale,
  };

  const params = await enrichParamsWithSiteName(baseParams);

  const rendered = await renderEmailTemplateByKey('ticket_replied', params, {
    locale: data.locale ?? null,
    defaultLocale: data.default_locale ?? null,
    allowMissing: false,
  });

  if (!rendered) throw new Error('email_template_not_found:ticket_replied');

  await sendMail({
    to: data.to,
    subject: rendered.subject,
    html: rendered.html,
  });

  return rendered;
}

/* ------------------ WELCOME (welcome) ------------------ */

const welcomeMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  user_email: z.string().email(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
  default_locale: z.string().optional(),
});

export type WelcomeMailInput = z.infer<typeof welcomeMailSchema>;

export async function sendWelcomeMail(input: WelcomeMailInput) {
  const data = welcomeMailSchema.parse(input);

  const baseParams: Record<string, unknown> = {
    user_name: data.user_name,
    user_email: data.user_email,
    site_name: data.site_name,
    locale: data.locale,
    default_locale: data.default_locale,
  };

  const params = await enrichParamsWithSiteName(baseParams);

  const rendered = await renderEmailTemplateByKey('welcome', params, {
    locale: data.locale ?? null,
    defaultLocale: data.default_locale ?? null,
    allowMissing: false,
  });

  if (!rendered) throw new Error('email_template_not_found:welcome');

  await sendMail({
    to: data.to,
    subject: rendered.subject,
    html: rendered.html,
  });

  return rendered;
}

/* ------------------ PASSWORD CHANGED (password_changed) ------------------ */

const passwordChangedMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string().optional(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
  default_locale: z.string().optional(),
});

export type PasswordChangedMailInput = z.infer<typeof passwordChangedMailSchema>;

export async function sendPasswordChangedMail(input: PasswordChangedMailInput) {
  const data = passwordChangedMailSchema.parse(input);

  const baseParams: Record<string, unknown> = {
    user_name: data.user_name ?? 'Kullanıcımız',
    site_name: data.site_name,
    locale: data.locale,
    default_locale: data.default_locale,
  };

  const params = await enrichParamsWithSiteName(baseParams);

  const rendered = await renderEmailTemplateByKey('password_changed', params, {
    locale: data.locale ?? null,
    defaultLocale: data.default_locale ?? null,
    allowMissing: false,
  });

  if (!rendered) throw new Error('email_template_not_found:password_changed');

  await sendMail({
    to: data.to,
    subject: rendered.subject,
    html: rendered.html,
  });

  return rendered;
}
