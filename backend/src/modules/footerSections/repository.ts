// ===================================================================
// FILE: src/modules/footerSections/repository.ts
// ===================================================================

import { randomUUID } from "crypto";
import { db } from "@/db/client";
import {
  footerSections,
  footerSectionsI18n,
  type NewFooterSectionRow,
  type NewFooterSectionI18nRow,
} from "./schema";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import type { FooterSectionListQuery } from "./validation";

type Sortable = "created_at" | "updated_at" | "display_order";

export type FooterSectionListParams = FooterSectionListQuery & {
  locale: string;        // requested locale (normalized)
  defaultLocale: string; // DB default_locale (normalized)
};

const to01 = (v: FooterSectionListQuery["is_active"]): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === "1" || v === "true") return 1;
  if (v === false || v === 0 || v === "0" || v === "false") return 0;
  return undefined;
};

const parseOrder = (
  orderParam?: string,
  sort?: Sortable,
  ord?: "asc" | "desc",
): { col: Sortable; dir: "asc" | "desc" } | null => {
  if (orderParam) {
    const m = orderParam.match(/^([a-zA-Z0-9_]+)\.(asc|desc)$/);
    const col = m?.[1] as Sortable | undefined;
    const dir = m?.[2] as "asc" | "desc" | undefined;
    if (col && dir && (col === "created_at" || col === "updated_at" || col === "display_order")) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

export type FooterSectionMerged = {
  id: string;
  is_active: 0 | 1;
  display_order: number;
  created_at: string | Date;
  updated_at: string | Date;
  title: string | null;
  slug: string | null;
  description: string | null;
  locale_resolved: string | null;
};

function baseSelect(i18nReq: any, i18nDef: any) {
  return {
    id: footerSections.id,
    is_active: footerSections.is_active,
    display_order: footerSections.display_order,
    created_at: footerSections.created_at,
    updated_at: footerSections.updated_at,

    title: sql<string>`COALESCE(${i18nReq.title}, ${i18nDef.title})`.as("title"),
    slug: sql<string>`COALESCE(${i18nReq.slug}, ${i18nDef.slug})`.as("slug"),
    description: sql<string>`COALESCE(${i18nReq.description}, ${i18nDef.description})`.as("description"),

    locale_resolved: sql<string>`
      CASE
        WHEN ${i18nReq.id} IS NOT NULL THEN ${i18nReq.locale}
        ELSE ${i18nDef.locale}
      END
    `.as("locale_resolved"),
  };
}

export async function listFooterSections(params: FooterSectionListParams) {
  const i18nReq = alias(footerSectionsI18n, "fs_req");
  const i18nDef = alias(footerSectionsI18n, "fs_def");

  const filters: SQL[] = [];

  const active = to01(params.is_active);
  if (active !== undefined) filters.push(eq(footerSections.is_active, active));

  if (params.slug && params.slug.trim()) {
    const v = params.slug.trim();
    filters.push(sql`COALESCE(${i18nReq.slug}, ${i18nDef.slug}) = ${v}`);
  }

  if (params.q && params.q.trim()) {
    const s = `%${params.q.trim()}%`;
    filters.push(sql`(
      COALESCE(${i18nReq.title}, ${i18nDef.title}) LIKE ${s}
      OR COALESCE(${i18nReq.slug}, ${i18nDef.slug}) LIKE ${s}
      OR COALESCE(${i18nReq.description}, ${i18nDef.description}) LIKE ${s}
    )`);
  }

  const whereExpr: SQL | undefined = filters.length ? (and(...filters) as SQL) : undefined;

  const ord = parseOrder(params.order, params.sort as Sortable | undefined, params.orderDir);
  const orderBy =
    ord != null
      ? ord.dir === "asc"
        ? asc(footerSections[ord.col])
        : desc(footerSections[ord.col])
      : asc(footerSections.display_order);

  const take = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  let query = db
    .select(baseSelect(i18nReq, i18nDef))
    .from(footerSections)
    .leftJoin(
      i18nReq,
      and(eq(i18nReq.section_id, footerSections.id), eq(i18nReq.locale, params.locale)),
    )
    .leftJoin(
      i18nDef,
      and(eq(i18nDef.section_id, footerSections.id), eq(i18nDef.locale, params.defaultLocale)),
    )
    .$dynamic();

  if (whereExpr) query = query.where(whereExpr as any);

  const rows = await query.orderBy(orderBy).limit(take).offset(skip);

  let countQuery = db
    .select({ c: sql<number>`COUNT(1)` })
    .from(footerSections)
    .leftJoin(
      i18nReq,
      and(eq(i18nReq.section_id, footerSections.id), eq(i18nReq.locale, params.locale)),
    )
    .leftJoin(
      i18nDef,
      and(eq(i18nDef.section_id, footerSections.id), eq(i18nDef.locale, params.defaultLocale)),
    )
    .$dynamic();

  if (whereExpr) countQuery = countQuery.where(whereExpr as any);

  const cnt = await countQuery;
  const total = cnt[0]?.c ?? 0;

  return { items: rows as unknown as FooterSectionMerged[], total };
}

export async function getFooterSectionMergedById(locale: string, defaultLocale: string, id: string) {
  const i18nReq = alias(footerSectionsI18n, "fs_req");
  const i18nDef = alias(footerSectionsI18n, "fs_def");

  const rows = await db
    .select(baseSelect(i18nReq, i18nDef))
    .from(footerSections)
    .leftJoin(
      i18nReq,
      and(eq(i18nReq.section_id, footerSections.id), eq(i18nReq.locale, locale)),
    )
    .leftJoin(
      i18nDef,
      and(eq(i18nDef.section_id, footerSections.id), eq(i18nDef.locale, defaultLocale)),
    )
    .where(eq(footerSections.id, id))
    .limit(1);

  return (rows[0] ?? null) as unknown as FooterSectionMerged | null;
}

export async function getFooterSectionMergedBySlug(locale: string, defaultLocale: string, slug: string) {
  const i18nReq = alias(footerSectionsI18n, "fs_req");
  const i18nDef = alias(footerSectionsI18n, "fs_def");

  const rows = await db
    .select(baseSelect(i18nReq, i18nDef))
    .from(footerSections)
    .leftJoin(
      i18nReq,
      and(eq(i18nReq.section_id, footerSections.id), eq(i18nReq.locale, locale)),
    )
    .leftJoin(
      i18nDef,
      and(eq(i18nDef.section_id, footerSections.id), eq(i18nDef.locale, defaultLocale)),
    )
    .where(
      sql`(
        ${i18nReq.id} IS NOT NULL AND ${i18nReq.slug} = ${slug}
      ) OR (
        ${i18nReq.id} IS NULL AND ${i18nDef.slug} = ${slug}
      )`,
    )
    .limit(1);

  return (rows[0] ?? null) as unknown as FooterSectionMerged | null;
}

/* ----------------- Admin write helpers ----------------- */

export async function createFooterSectionParent(values: NewFooterSectionRow) {
  await db.insert(footerSections).values(values);
  return values.id;
}

export async function updateFooterSectionParent(id: string, patch: Partial<NewFooterSectionRow>) {
  await db
    .update(footerSections)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(footerSections.id, id));
}

export async function deleteFooterSectionParent(id: string) {
  const res = await db.delete(footerSections).where(eq(footerSections.id, id)).execute();
  const affected = (res as any)?.affectedRows != null ? Number((res as any).affectedRows) : 0;
  return affected;
}

export async function upsertFooterSectionI18n(
  sectionId: string,
  locale: string,
  data: Partial<Pick<NewFooterSectionI18nRow, "title" | "slug" | "description">> & { id?: string },
) {
  const insertVals: NewFooterSectionI18nRow = {
    id: data.id ?? randomUUID(),
    section_id: sectionId,
    locale,
    title: data.title ?? "",
    slug: data.slug ?? "",
    description: typeof data.description === "undefined" ? (null as any) : data.description ?? null,
    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  if (typeof data.title !== "undefined") setObj.title = data.title;
  if (typeof data.slug !== "undefined") setObj.slug = data.slug;
  if (typeof data.description !== "undefined") setObj.description = data.description ?? null;

  setObj.updated_at = new Date();

  // sadece updated_at varsa boşuna yazma
  if (Object.keys(setObj).length === 1) return;

  await db
    .insert(footerSectionsI18n)
    .values(insertVals)
    .onDuplicateKeyUpdate({ set: setObj });
}

export async function getFooterSectionI18nRow(sectionId: string, locale: string) {
  const rows = await db
    .select()
    .from(footerSectionsI18n)
    .where(and(eq(footerSectionsI18n.section_id, sectionId), eq(footerSectionsI18n.locale, locale)))
    .limit(1);

  return rows[0] ?? null;
}
