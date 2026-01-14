// ===================================================================
// FILE: src/modules/faqs/repository.ts
// FINAL — NO category/sub_category
// - locale coalesce: requested > default
// ===================================================================

import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { faqs, faqsI18n, type NewFaqRow, type NewFaqI18nRow } from './schema';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

type Sortable = 'created_at' | 'updated_at' | 'display_order';

export type ListParams = {
  orderParam?: string; // "created_at.asc"
  sort?: Sortable;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;

  is_active?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  q?: string;
  slug?: string;

  locale: string;
  defaultLocale: string;
};

const to01 = (v: ListParams['is_active']): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
};

const parseOrder = (
  orderParam?: string,
  sort?: ListParams['sort'],
  ord?: ListParams['order'],
): { col: Sortable; dir: 'asc' | 'desc' } | null => {
  if (orderParam) {
    const m = orderParam.match(/^([a-zA-Z0-9_]+)\.(asc|desc)$/);
    const col = m?.[1] as Sortable | undefined;
    const dir = m?.[2] as 'asc' | 'desc' | undefined;
    if (col && dir && (col === 'created_at' || col === 'updated_at' || col === 'display_order')) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

export type FaqMerged = {
  id: string;
  is_active: 0 | 1;
  display_order: number;
  created_at: string | Date;
  updated_at: string | Date;

  question: string | null;
  answer: string | null;
  slug: string | null;
  locale_resolved: string | null;
};

function baseSelect(i18nReq: any, i18nDef: any) {
  return {
    id: faqs.id,
    is_active: faqs.is_active,
    display_order: faqs.display_order,
    created_at: faqs.created_at,
    updated_at: faqs.updated_at,

    question: sql<string>`COALESCE(${i18nReq.question}, ${i18nDef.question})`.as('question'),
    answer: sql<string>`COALESCE(${i18nReq.answer}, ${i18nDef.answer})`.as('answer'),
    slug: sql<string>`COALESCE(${i18nReq.slug}, ${i18nDef.slug})`.as('slug'),
    locale_resolved: sql<string>`
      CASE
        WHEN ${i18nReq.id} IS NOT NULL THEN ${i18nReq.locale}
        ELSE ${i18nDef.locale}
      END
    `.as('locale_resolved'),
  };
}

export async function listFaqs(params: ListParams) {
  const i18nReq = alias(faqsI18n, 'fi_req');
  const i18nDef = alias(faqsI18n, 'fi_def');

  const filters: SQL[] = [];

  const active = to01(params.is_active);
  if (active !== undefined) filters.push(eq(faqs.is_active, active));

  if (params.slug && params.slug.trim()) {
    const v = params.slug.trim();
    filters.push(sql`(${i18nReq.slug} = ${v} OR ${i18nDef.slug} = ${v})`);
  }

  if (params.q && params.q.trim()) {
    const s = `%${params.q.trim()}%`;
    filters.push(sql`(
      COALESCE(${i18nReq.question}, ${i18nDef.question}) LIKE ${s}
      OR COALESCE(${i18nReq.slug}, ${i18nDef.slug}) LIKE ${s}
      OR COALESCE(${i18nReq.answer}, ${i18nDef.answer}) LIKE ${s}
    )`);
  }

  const whereExpr = filters.length ? (and(...filters) as SQL) : undefined;

  const ord = parseOrder(params.orderParam, params.sort, params.order);
  const orderBy =
    ord != null
      ? (() => {
          const col = faqs[ord.col] as any;
          return ord.dir === 'asc' ? asc(col) : desc(col);
        })()
      : asc(faqs.display_order);

  const take = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  const baseQuery = db
    .select(baseSelect(i18nReq, i18nDef))
    .from(faqs)
    .leftJoin(i18nReq, and(eq(i18nReq.faq_id, faqs.id), eq(i18nReq.locale, params.locale)))
    .leftJoin(i18nDef, and(eq(i18nDef.faq_id, faqs.id), eq(i18nDef.locale, params.defaultLocale)));

  const rowsRaw = whereExpr
    ? await baseQuery.where(whereExpr).orderBy(orderBy).limit(take).offset(skip)
    : await baseQuery.orderBy(orderBy).limit(take).offset(skip);

  const countBase = db
    .select({ c: sql<number>`COUNT(1)` })
    .from(faqs)
    .leftJoin(i18nReq, and(eq(i18nReq.faq_id, faqs.id), eq(i18nReq.locale, params.locale)))
    .leftJoin(i18nDef, and(eq(i18nDef.faq_id, faqs.id), eq(i18nDef.locale, params.defaultLocale)));

  const cnt = whereExpr ? await countBase.where(whereExpr) : await countBase;
  const total = cnt[0]?.c ?? 0;

  return { items: rowsRaw as unknown as FaqMerged[], total };
}

export async function getFaqMergedById(locale: string, defaultLocale: string, id: string) {
  const i18nReq = alias(faqsI18n, 'fi_req');
  const i18nDef = alias(faqsI18n, 'fi_def');

  const rows = await db
    .select(baseSelect(i18nReq, i18nDef))
    .from(faqs)
    .leftJoin(i18nReq, and(eq(i18nReq.faq_id, faqs.id), eq(i18nReq.locale, locale)))
    .leftJoin(i18nDef, and(eq(i18nDef.faq_id, faqs.id), eq(i18nDef.locale, defaultLocale)))
    .where(eq(faqs.id, id))
    .limit(1);

  return (rows[0] ?? null) as unknown as FaqMerged | null;
}

export async function getFaqMergedBySlug(locale: string, defaultLocale: string, slug: string) {
  const i18nReq = alias(faqsI18n, 'fi_req');
  const i18nDef = alias(faqsI18n, 'fi_def');

  const slugTrimmed = slug.trim();

  const rows = await db
    .select(baseSelect(i18nReq, i18nDef))
    .from(faqs)
    .leftJoin(i18nReq, and(eq(i18nReq.faq_id, faqs.id), eq(i18nReq.locale, locale)))
    .leftJoin(i18nDef, and(eq(i18nDef.faq_id, faqs.id), eq(i18nDef.locale, defaultLocale)))
    .where(sql`(${i18nReq.slug} = ${slugTrimmed} OR ${i18nDef.slug} = ${slugTrimmed})`)
    .limit(1);

  return (rows[0] ?? null) as unknown as FaqMerged | null;
}

/* ----------------- Admin write helpers ----------------- */

export async function createFaqParent(values: NewFaqRow) {
  await db.insert(faqs).values(values);
  return values.id;
}

export async function upsertFaqI18n(
  faqId: string,
  locale: string,
  data: Partial<Pick<NewFaqI18nRow, 'question' | 'answer' | 'slug'> & { id?: string }>,
) {
  const loc = String(locale ?? '').toLowerCase();

  const insertVals: NewFaqI18nRow = {
    id: data.id ?? randomUUID(),
    faq_id: faqId,
    locale: loc,
    question: data.question ?? '',
    answer: data.answer ?? '',
    slug: data.slug ?? '',
    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  if (typeof data.question !== 'undefined') setObj.question = data.question;
  if (typeof data.answer !== 'undefined') setObj.answer = data.answer;
  if (typeof data.slug !== 'undefined') setObj.slug = data.slug;

  if (Object.keys(setObj).length === 0) return;

  setObj.updated_at = new Date();

  await db.insert(faqsI18n).values(insertVals).onDuplicateKeyUpdate({ set: setObj });
}

export async function updateFaqParent(id: string, patch: Partial<NewFaqRow>) {
  await db
    .update(faqs)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(faqs.id, id));
}

export async function deleteFaqParent(id: string) {
  const res = await db.delete(faqs).where(eq(faqs.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === 'number'
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}

export async function getFaqI18nRow(faqId: string, locale: string) {
  const loc = String(locale ?? '').toLowerCase();
  const rows = await db
    .select()
    .from(faqsI18n)
    .where(and(eq(faqsI18n.faq_id, faqId), eq(faqsI18n.locale, loc)))
    .limit(1);
  return rows[0] ?? null;
}
