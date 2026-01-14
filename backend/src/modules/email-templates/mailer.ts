// =============================================================
// FILE: src/modules/email-templates/mailer.ts
// FINAL — templated mail sender (i18n + strict/allowMissing)
// - locale/defaultLocale: opts -> params -> null
// - renderEmailTemplateByKey signature: (key, params, { locale, defaultLocale, allowMissing })
// =============================================================

import { renderEmailTemplateByKey } from './service';
import { sendMail } from '@/modules/mail/service';

export interface SendTemplatedEmailOptions {
  to: string;
  key: string; // template_key
  locale?: string | null;
  defaultLocale?: string | null;
  params?: Record<string, unknown>;
  /**
   * true ise missing_variables olsa bile mail gönderilir.
   * false ise (default) eksik variable varsa error fırlatılır.
   */
  allowMissing?: boolean;
}

function pickLocale(opts: SendTemplatedEmailOptions) {
  const p = opts.params ?? {};
  const loc = (opts.locale ?? (p as any).locale ?? null) as string | null;
  const def = (opts.defaultLocale ?? (p as any).default_locale ?? null) as string | null;
  return { locale: loc, defaultLocale: def };
}

/**
 * 1) email_templates + email_templates_i18n tablosundan uygun kaydı bulur
 * 2) subject + body render eder
 * 3) sendMail ile gönderir
 */
export async function sendTemplatedEmail(opts: SendTemplatedEmailOptions) {
  const { key, to, params = {}, allowMissing = false } = opts;
  const { locale, defaultLocale } = pickLocale(opts);

  const rendered = await renderEmailTemplateByKey(key, params, {
    locale,
    defaultLocale,
    allowMissing,
  });

  if (!rendered) {
    const err: any = new Error(`email_template_not_found:${key}`);
    err.code = 'email_template_not_found';
    throw err;
  }

  // renderEmailTemplateByKey allowMissing:false iken zaten throw ediyor olabilir.
  // Yine de backward-compatible kontrol:
  if (!allowMissing && rendered.missing_variables.length > 0) {
    const err: any = new Error(
      `email_template_missing_params:${key}:${rendered.missing_variables.join(',')}`,
    );
    err.code = 'email_template_missing_params';
    err.template_key = key;
    err.missing_variables = rendered.missing_variables;
    throw err;
  }

  await sendMail({
    to,
    subject: rendered.subject,
    html: rendered.html,
  });

  return rendered;
}
