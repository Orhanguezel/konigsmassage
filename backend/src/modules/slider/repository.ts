// =============================================================
// FILE: src/modules/slider/repository.ts
// Slider – parent + i18n repository (core/i18n fallback aware) [FINAL]
// =============================================================
import { db } from '@/db/client';
import { and, asc, desc, eq, like, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { slider, sliderI18n, type SliderRow, type SliderI18nRow } from './schema';
import { storageAssets } from '@/modules/storage/schema';
import type {
  AdminListQuery,
  CreateBody,
  PublicListQuery,
  UpdateBody,
  SetImageBody,
} from './validation';
import { randomUUID } from 'crypto';
import { getStorageSettings } from '@/modules/siteSettings/service';

export type RowWithAsset = {
  sl: SliderRow;
  // COALESCE edilmiş “resolved i18n”
  i18n: {
    locale: string;
    name: string;
    slug: string;
    description: string | null;
    alt: string | null;
    buttonText: string | null;
    buttonLink: string | null;
  };
  asset_url: string | null;
};

function toBoolNum(v: boolean) {
  return v ? 1 : 0;
}

const ORDER = {
  display_order: slider.display_order,
  // resolved name üzerinden sort etmek için SQL alias kullanacağız
  name: sql<string>`COALESCE(${sql.raw('si_req.name')}, ${sql.raw('si_def.name')})`,
  created_at: slider.created_at,
  updated_at: slider.updated_at,
} as const;

function orderExpr(sort: keyof typeof ORDER, dir: 'asc' | 'desc') {
  const col = ORDER[sort] ?? ORDER.display_order;
  return dir === 'asc' ? asc(col as any) : desc(col as any);
}

type StorageBases = {
  cdnPublicBase?: string | null;
  publicApiBase?: string | null;
};

/** Provider URL varsa onu, yoksa site_settings + env'e göre /storage/:bucket/:path */
function publicUrlOf(
  bucket?: string | null,
  path?: string | null,
  providerUrl?: string | null,
  bases?: StorageBases,
) {
  if (providerUrl) return providerUrl;
  if (!bucket || !path) return null;

  const encSeg = (s: string) => encodeURIComponent(s);
  const encPath = path
    .split('/')
    .map((segment) => encSeg(segment))
    .join('/');

  const cdnBase = (bases?.cdnPublicBase || '').replace(/\/+$/, '');
  const apiBase = (bases?.publicApiBase || '').replace(/\/+$/, '');

  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath}`;
  if (apiBase) return `${apiBase}/storage/${encSeg(bucket)}/${encPath}`;

  return `/storage/${encSeg(bucket)}/${encPath}`;
}

async function getBases(): Promise<StorageBases> {
  const storage = await getStorageSettings();
  return {
    cdnPublicBase: storage.cdnPublicBase,
    publicApiBase: storage.publicApiBase,
  };
}

function mapRow(r: any, bases: StorageBases): RowWithAsset {
  return {
    sl: r.sl,
    i18n: {
      locale: r.locale_resolved,
      name: r.name_resolved,
      slug: r.slug_resolved,
      description: r.description_resolved ?? null,
      alt: r.alt_resolved ?? null,
      buttonText: r.button_text_resolved ?? null,
      buttonLink: r.button_link_resolved ?? null,
    },
    asset_url:
      publicUrlOf(r.asset_bucket, r.asset_path, r.asset_url0, bases) ?? r.sl.image_url ?? null,
  };
}

/* ===================== PUBLIC ===================== */

export async function repoListPublic(
  q: PublicListQuery & { locale: string; default_locale: string },
) {
  const bases = await getBases();

  const iReq = alias(sliderI18n, 'si_req');
  const iDef = alias(sliderI18n, 'si_def');

  const conds: SQL[] = [eq(slider.is_active, 1 as const)];

  // optional q
  if (q.q && q.q.trim()) {
    const s = `%${q.q.trim()}%`;
    conds.push(sql`( COALESCE(${iReq.name}, ${iDef.name}) LIKE ${s} )`);
  }

  const rows = await db
    .select({
      sl: slider,

      name_resolved: sql<string>`COALESCE(${iReq.name}, ${iDef.name})`,
      slug_resolved: sql<string>`COALESCE(${iReq.slug}, ${iDef.slug})`,
      description_resolved: sql<string>`COALESCE(${iReq.description}, ${iDef.description})`,
      alt_resolved: sql<string>`COALESCE(${iReq.alt}, ${iDef.alt})`,
      button_text_resolved: sql<string>`COALESCE(${iReq.buttonText}, ${iDef.buttonText})`,
      button_link_resolved: sql<string>`COALESCE(${iReq.buttonLink}, ${iDef.buttonLink})`,
      locale_resolved: sql<string>`
        CASE WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale} ELSE ${iDef.locale} END
      `,

      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
      asset_url0: storageAssets.url,
    })
    .from(slider)
    .leftJoin(iReq, and(eq(iReq.sliderId, slider.id), eq(iReq.locale, q.locale)))
    .leftJoin(iDef, and(eq(iDef.sliderId, slider.id), eq(iDef.locale, q.default_locale)))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(and(...conds))
    // resolved name/order + deterministic
    .orderBy(
      orderExpr(q.sort, q.order),
      desc(slider.featured),
      asc(slider.display_order),
      asc(slider.id),
    )
    .limit(q.limit)
    .offset(q.offset);

  // ✅ Eğer ne req ne def i18n yoksa bu kayıt “çözümlenemez”; listeye sokmayalım.
  return rows
    .filter((r: any) => r.name_resolved != null && String(r.name_resolved).trim())
    .map((r) => mapRow(r, bases));
}

/**
 * Public get by slug:
 *  - slug aramasını önce requested locale’de dener
 *  - bulunamazsa default_locale’de dener
 */
export async function repoGetBySlug(
  slugStr: string,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  const bases = await getBases();

  // 1) requested locale
  const rows1 = await db
    .select({
      sl: slider,
      name_resolved: sliderI18n.name,
      slug_resolved: sliderI18n.slug,
      description_resolved: sliderI18n.description,
      alt_resolved: sliderI18n.alt,
      button_text_resolved: sliderI18n.buttonText,
      button_link_resolved: sliderI18n.buttonLink,
      locale_resolved: sliderI18n.locale,

      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
      asset_url0: storageAssets.url,
    })
    .from(sliderI18n)
    .innerJoin(slider, eq(sliderI18n.sliderId, slider.id))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(
      and(
        eq(sliderI18n.slug, slugStr),
        eq(sliderI18n.locale, locale),
        eq(slider.is_active, 1 as const),
      ),
    )
    .limit(1);

  if (rows1.length) return mapRow(rows1[0], bases);

  // 2) default locale fallback
  const rows2 = await db
    .select({
      sl: slider,
      name_resolved: sliderI18n.name,
      slug_resolved: sliderI18n.slug,
      description_resolved: sliderI18n.description,
      alt_resolved: sliderI18n.alt,
      button_text_resolved: sliderI18n.buttonText,
      button_link_resolved: sliderI18n.buttonLink,
      locale_resolved: sliderI18n.locale,

      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
      asset_url0: storageAssets.url,
    })
    .from(sliderI18n)
    .innerJoin(slider, eq(sliderI18n.sliderId, slider.id))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(
      and(
        eq(sliderI18n.slug, slugStr),
        eq(sliderI18n.locale, defaultLocale),
        eq(slider.is_active, 1 as const),
      ),
    )
    .limit(1);

  if (!rows2.length) return null;
  return mapRow(rows2[0], bases);
}

/* ===================== ADMIN ===================== */

export async function repoListAdmin(
  q: AdminListQuery & { locale: string; default_locale: string },
): Promise<RowWithAsset[]> {
  const bases = await getBases();

  const iReq = alias(sliderI18n, 'si_req');
  const iDef = alias(sliderI18n, 'si_def');

  const conds: SQL[] = [];

  if (typeof q.is_active === 'boolean') {
    conds.push(eq(slider.is_active, toBoolNum(q.is_active) as any));
  }

  if (q.q && q.q.trim()) {
    const s = `%${q.q.trim()}%`;
    conds.push(sql`( COALESCE(${iReq.name}, ${iDef.name}) LIKE ${s} )`);
  }

  const whereExpr: SQL = conds.length ? (and(...conds) as SQL) : sql`1=1`;

  const rows = await db
    .select({
      sl: slider,

      name_resolved: sql<string>`COALESCE(${iReq.name}, ${iDef.name})`,
      slug_resolved: sql<string>`COALESCE(${iReq.slug}, ${iDef.slug})`,
      description_resolved: sql<string>`COALESCE(${iReq.description}, ${iDef.description})`,
      alt_resolved: sql<string>`COALESCE(${iReq.alt}, ${iDef.alt})`,
      button_text_resolved: sql<string>`COALESCE(${iReq.buttonText}, ${iDef.buttonText})`,
      button_link_resolved: sql<string>`COALESCE(${iReq.buttonLink}, ${iDef.buttonLink})`,
      locale_resolved: sql<string>`
        CASE WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale} ELSE ${iDef.locale} END
      `,

      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
      asset_url0: storageAssets.url,
    })
    .from(slider)
    .leftJoin(iReq, and(eq(iReq.sliderId, slider.id), eq(iReq.locale, q.locale)))
    .leftJoin(iDef, and(eq(iDef.sliderId, slider.id), eq(iDef.locale, q.default_locale)))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(whereExpr)
    .orderBy(
      orderExpr(q.sort, q.order),
      desc(slider.featured),
      asc(slider.display_order),
      asc(slider.id),
    )
    .limit(q.limit)
    .offset(q.offset);

  return rows
    .filter((r: any) => r.name_resolved != null && String(r.name_resolved).trim())
    .map((r) => mapRow(r, bases));
}

/** Admin detail: id + resolved locale fallback */
export async function repoGetById(
  id: number,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  const bases = await getBases();

  const iReq = alias(sliderI18n, 'si_req');
  const iDef = alias(sliderI18n, 'si_def');

  const rows = await db
    .select({
      sl: slider,

      name_resolved: sql<string>`COALESCE(${iReq.name}, ${iDef.name})`,
      slug_resolved: sql<string>`COALESCE(${iReq.slug}, ${iDef.slug})`,
      description_resolved: sql<string>`COALESCE(${iReq.description}, ${iDef.description})`,
      alt_resolved: sql<string>`COALESCE(${iReq.alt}, ${iDef.alt})`,
      button_text_resolved: sql<string>`COALESCE(${iReq.buttonText}, ${iDef.buttonText})`,
      button_link_resolved: sql<string>`COALESCE(${iReq.buttonLink}, ${iDef.buttonLink})`,
      locale_resolved: sql<string>`
        CASE WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale} ELSE ${iDef.locale} END
      `,

      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
      asset_url0: storageAssets.url,
    })
    .from(slider)
    .leftJoin(iReq, and(eq(iReq.sliderId, slider.id), eq(iReq.locale, locale)))
    .leftJoin(iDef, and(eq(iDef.sliderId, slider.id), eq(iDef.locale, defaultLocale)))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(eq(slider.id, id))
    .limit(1);

  if (!rows.length) return null;
  const r = rows[0];

  if (!r.name_resolved) return null;
  return mapRow(r, bases);
}

/** Create: parent + requested locale i18n */
export async function repoCreate(b: CreateBody, locale: string): Promise<RowWithAsset> {
  const bases = await getBases();

  const nowMaxOrder = await db
    .select({
      maxOrder: sql<number>`COALESCE(MAX(${slider.display_order}), 0)`,
    })
    .from(slider);

  const baseSlug = (
    b.slug ||
    b.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  ).slice(0, 255);

  const uuidVal = randomUUID();

  await db.insert(slider).values({
    uuid: uuidVal,
    image_url: b.image_url ?? null,
    image_asset_id: b.image_asset_id ?? null,
    featured: b.featured ? 1 : 0,
    is_active: b.is_active ? 1 : 0,
    display_order: b.display_order ?? (nowMaxOrder[0]?.maxOrder ?? 0) + 1,
  } as any);

  const [baseRow] = await db.select().from(slider).where(eq(slider.uuid, uuidVal)).limit(1);
  if (!baseRow) throw new Error('slider_create_parent_failed');

  await db.insert(sliderI18n).values({
    sliderId: baseRow.id,
    locale,
    name: b.name,
    slug: baseSlug,
    description: b.description ?? null,
    alt: b.alt ?? null,
    buttonText: b.buttonText ?? null,
    buttonLink: b.buttonLink ?? null,
  } as any);

  // read back with fallback = same locale
  const row = await repoGetById(baseRow.id, locale, locale);
  if (!row) throw new Error('create_failed');

  // asset_url already mapped
  return {
    ...row,
    asset_url: row.asset_url ?? (baseRow.image_url as any) ?? null,
  };
}

/** Update: parent + i18n upsert for locale */
export async function repoUpdate(
  id: number,
  b: UpdateBody,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  // parent
  const parentSet: Record<string, unknown> = {
    updated_at: sql`CURRENT_TIMESTAMP(3)`,
  };

  if (b.image_url !== undefined) parentSet.image_url = b.image_url ?? null;
  if (b.image_asset_id !== undefined) parentSet.image_asset_id = b.image_asset_id ?? null;
  if (b.featured !== undefined) parentSet.featured = b.featured ? 1 : 0;
  if (b.is_active !== undefined) parentSet.is_active = b.is_active ? 1 : 0;
  if (b.display_order !== undefined) parentSet.display_order = b.display_order;

  if (Object.keys(parentSet).length > 1) {
    await db
      .update(slider)
      .set(parentSet as any)
      .where(eq(slider.id, id));
  }

  // i18n upsert
  const i18nSet: Record<string, unknown> = {};
  if (b.name !== undefined) i18nSet.name = b.name;
  if (b.slug !== undefined) i18nSet.slug = b.slug;
  if (b.description !== undefined) i18nSet.description = b.description ?? null;
  if (b.alt !== undefined) i18nSet.alt = b.alt ?? null;
  if (b.buttonText !== undefined) i18nSet.buttonText = b.buttonText ?? null;
  if (b.buttonLink !== undefined) i18nSet.buttonLink = b.buttonLink ?? null;

  if (Object.keys(i18nSet).length) {
    const [existing] = await db
      .select({ id: sliderI18n.id })
      .from(sliderI18n)
      .where(and(eq(sliderI18n.sliderId, id), eq(sliderI18n.locale, locale)))
      .limit(1);

    if (existing) {
      await db
        .update(sliderI18n)
        .set(i18nSet as any)
        .where(eq(sliderI18n.id, existing.id));
    } else {
      // yeni locale satırı: name zorunlu kabul edelim (boş gelirse fallback)
      const name = typeof b.name === 'string' && b.name.trim() ? b.name.trim() : `Slide ${id}`;
      const baseSlug = (
        b.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      ).slice(0, 255);

      await db.insert(sliderI18n).values({
        sliderId: id,
        locale,
        name,
        slug: baseSlug || `slider-${id}-${locale}`,
        description: b.description ?? null,
        alt: b.alt ?? null,
        buttonText: b.buttonText ?? null,
        buttonLink: b.buttonLink ?? null,
      } as any);
    }
  }

  return repoGetById(id, locale, defaultLocale);
}

export async function repoDelete(id: number): Promise<void> {
  await db.delete(sliderI18n).where(eq(sliderI18n.sliderId, id));
  await db.delete(slider).where(eq(slider.id, id));
}

export async function repoReorder(ids: number[]): Promise<void> {
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(slider)
      .set({
        display_order: i + 1,
        updated_at: sql`CURRENT_TIMESTAMP(3)`,
      } as any)
      .where(eq(slider.id, ids[i]));
  }
}

export async function repoSetStatus(
  id: number,
  isActive: boolean,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  await db
    .update(slider)
    .set({
      is_active: isActive ? 1 : 0,
      updated_at: sql`CURRENT_TIMESTAMP(3)`,
    } as any)
    .where(eq(slider.id, id));

  return repoGetById(id, locale, defaultLocale);
}

/**
 * ✅ asset_id veya asset_ids destekler.
 * - asset_ids verilirse ilk valid asset kapak yapılır
 * - null/undefined => temizle
 */
export async function repoSetImage(
  id: number,
  body: SetImageBody,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  const bases = await getBases();

  const pick =
    (Array.isArray(body.asset_ids) ? body.asset_ids.find((x) => !!x) : undefined) ||
    (body.asset_id ?? null);

  const assetId = pick || null;

  if (!assetId) {
    await db
      .update(slider)
      .set({
        image_url: null,
        image_asset_id: null,
        updated_at: sql`CURRENT_TIMESTAMP(3)`,
      } as any)
      .where(eq(slider.id, id));

    return repoGetById(id, locale, defaultLocale);
  }

  const [asset] = await db
    .select({
      bucket: storageAssets.bucket,
      path: storageAssets.path,
      url: storageAssets.url,
    })
    .from(storageAssets)
    .where(eq(storageAssets.id, assetId))
    .limit(1);

  if (!asset) return null;

  const url = publicUrlOf(asset.bucket, asset.path, asset.url ?? null, bases);

  await db
    .update(slider)
    .set({
      image_url: url,
      image_asset_id: assetId,
      updated_at: sql`CURRENT_TIMESTAMP(3)`,
    } as any)
    .where(eq(slider.id, id));

  return repoGetById(id, locale, defaultLocale);
}
