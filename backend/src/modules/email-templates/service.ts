// =============================================================
// FILE: src/modules/email-templates/service.ts
// FINAL — render by key (i18n) with robust fallback (DETERMINISTIC)
// - locale fallback: requested -> fallbackLocale -> any available (MIN(locale))
// - allowMissing: caller decides strictness
// =============================================================

import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db/client';
import { emailTemplates, emailTemplatesI18n, type EmailTemplateRow } from './schema';
import { extractVariablesFromText, parseVariablesColumn, renderTextWithParams } from './utils';
import { DEFAULT_LOCALE } from '@/core/i18n';

export interface RenderedEmailTemplate {
  template: EmailTemplateRow;
  template_name: string;
  subject: string;
  html: string;
  required_variables: string[];
  missing_variables: string[];
  locale_resolved: string | null;
}

export type RenderEmailOptions = {
  locale?: string | null;
  defaultLocale?: string | null;
  allowMissing?: boolean; // default: false
};

function safeTrim(v: unknown) {
  return String(v ?? '').trim();
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

export async function renderEmailTemplateByKey(
  key: string,
  params: Record<string, unknown> = {},
  opts: RenderEmailOptions = {},
): Promise<RenderedEmailTemplate | null> {
  const iReq = alias(emailTemplatesI18n, 'eti_req');
  const iDef = alias(emailTemplatesI18n, 'eti_def');
  const iAny = alias(emailTemplatesI18n, 'eti_any');

  const requestedLocale = safeTrim(opts.locale) || '';
  const fallbackLocale = safeTrim(opts.defaultLocale) || DEFAULT_LOCALE;
  const allowMissing = opts.allowMissing === true;

  // Deterministic "any" locale: MIN(locale) per template_id
  const anyLocaleSub = sql<string>`
    (
      SELECT MIN(x.locale)
      FROM ${emailTemplatesI18n} x
      WHERE x.template_id = ${emailTemplates.id}
    )
  `;

  const rows = await db
    .select({
      template: emailTemplates,

      template_name: sql<string>`
        COALESCE(
          ${requestedLocale ? iReq.template_name : sql`NULL`},
          ${iDef.template_name},
          ${iAny.template_name}
        )
      `.as('template_name'),

      subject: sql<string>`
        COALESCE(
          ${requestedLocale ? iReq.subject : sql`NULL`},
          ${iDef.subject},
          ${iAny.subject}
        )
      `.as('subject'),

      content: sql<string>`
        COALESCE(
          ${requestedLocale ? iReq.content : sql`NULL`},
          ${iDef.content},
          ${iAny.content}
        )
      `.as('content'),

      locale_resolved: sql<string>`
        CASE
          WHEN ${requestedLocale ? iReq.id : sql`NULL`} IS NOT NULL THEN ${iReq.locale}
          WHEN ${iDef.id} IS NOT NULL THEN ${iDef.locale}
          ELSE ${iAny.locale}
        END
      `.as('locale_resolved'),
    })
    .from(emailTemplates)
    // requested
    .leftJoin(
      iReq,
      requestedLocale
        ? and(eq(iReq.template_id, emailTemplates.id), eq(iReq.locale, requestedLocale))
        : sql`FALSE`,
    )
    // fallback
    .leftJoin(iDef, and(eq(iDef.template_id, emailTemplates.id), eq(iDef.locale, fallbackLocale)))
    // any: deterministically pick MIN(locale)
    .leftJoin(iAny, and(eq(iAny.template_id, emailTemplates.id), eq(iAny.locale, anyLocaleSub)))
    .where(and(eq(emailTemplates.template_key, key), eq(emailTemplates.is_active, 1)))
    .limit(1);

  if (!rows.length) return null;

  const row: any = rows[0];
  const template = row.template as EmailTemplateRow;

  const templateNameTpl: string = row.template_name ?? '';
  const subjectTpl: string = row.subject ?? '';
  const contentTpl: string = row.content ?? '';
  const localeResolved: string | null = row.locale_resolved ?? null;

  const subject = renderTextWithParams(subjectTpl, params);
  const html = renderTextWithParams(contentTpl, params);

  const requiredFromCol = parseVariablesColumn(template.variables as any) ?? [];
  const requiredFromBody = extractVariablesFromText(subjectTpl + '\n' + contentTpl) ?? [];
  const required = uniq([...requiredFromCol, ...requiredFromBody]).filter(Boolean);

  // İstersen strict yap:
  // const missing = required.filter((k) => params[k] === undefined || params[k] === null);
  const missing = required.filter((k) => !(k in (params || {})));

  if (!allowMissing && missing.length) {
    const err: any = new Error(`email_template_missing_vars:${key}`);
    err.code = 'email_template_missing_vars';
    err.template_key = key;
    err.missing_variables = missing;
    throw err;
  }

  return {
    template,
    template_name: templateNameTpl,
    subject,
    html,
    required_variables: required,
    missing_variables: missing,
    locale_resolved: localeResolved,
  };
}
