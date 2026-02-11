// src/modules/services/repository.ts
// =============================================================
// FINAL — Services repository (NO category/sub_category)
// - i18n: coalesce (req > default)
// - locales: DB-backed (site_settings) for replicate/apply_all_locales
// =============================================================

import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import {
  services,
  servicesI18n,
  serviceImages,
  serviceImagesI18n,
  type NewServiceRow,
  type NewServiceI18nRow,
  type NewServiceImageRow,
  type NewServiceImageI18nRow,
} from './schema';

import { storageAssets } from '@/modules/storage/schema';
import { publicUrlOf } from '@/modules/storage/_util';

// ✅ Dinamik locale listesi / default locale DB’den
import { getAppLocales } from '@/modules/siteSettings/service';

/* ----------------------- types ----------------------- */

type Sortable = 'created_at' | 'updated_at' | 'display_order';
export type LocaleCode = string;

export type ServiceMerged = {
  id: string;
  type: string;

  featured: 0 | 1;
  is_active: 0 | 1;
  display_order: number;

  featured_image: string | null;
  image_url: string | null;
  image_asset_id: string | null;

  // technical fields (non-i18n)
  area: string | null;
  duration: string | null;
  maintenance: string | null;
  season: string | null;
  thickness: string | null;
  equipment: string | null;

  created_at: string | Date;
  updated_at: string | Date;

  // i18n coalesced
  slug: string | null;
  name: string | null;
  description: string | null;
  material: string | null;
  price: string | null;
  includes: string | null;
  warranty: string | null;
  image_alt: string | null;

  tags: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  locale_resolved: string | null;
};

export type ServiceImageMerged = {
  id: string;
  service_id: string;
  image_asset_id: string | null;
  image_url: string | null;
  is_active: 0 | 1;
  display_order: number;
  created_at: string | Date;
  updated_at: string | Date;

  // i18n
  title: string | null;
  alt: string | null;
  caption: string | null;
  locale_resolved: string | null;
};

/* ----------------------- helpers ----------------------- */

type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | undefined;

const to01 = (v: unknown): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
};

const parseOrder = (
  orderParam?: string,
  sort?: Sortable,
  ord?: 'asc' | 'desc',
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

function baseSelect(iReq: any, iDef: any) {
  return {
    id: services.id,
    type: services.type,

    featured: services.featured,
    is_active: services.is_active,
    display_order: services.display_order,

    featured_image: services.featured_image,
    image_url: services.image_url,
    image_asset_id: services.image_asset_id,

    area: sql<string>`COALESCE(${iReq.area}, ${iDef.area}, ${services.area})`.as('area'),
    duration: sql<string>`COALESCE(${iReq.duration}, ${iDef.duration}, ${services.duration})`.as(
      'duration',
    ),
    maintenance: sql<string>`COALESCE(${iReq.maintenance}, ${iDef.maintenance}, ${services.maintenance})`.as(
      'maintenance',
    ),
    season: sql<string>`COALESCE(${iReq.season}, ${iDef.season}, ${services.season})`.as('season'),
    thickness: sql<string>`COALESCE(${iReq.thickness}, ${iDef.thickness}, ${services.thickness})`.as(
      'thickness',
    ),
    equipment: sql<string>`COALESCE(${iReq.equipment}, ${iDef.equipment}, ${services.equipment})`.as(
      'equipment',
    ),

    created_at: services.created_at,
    updated_at: services.updated_at,

    slug: sql<string>`COALESCE(${iReq.slug}, ${iDef.slug})`.as('slug'),
    name: sql<string>`COALESCE(${iReq.name}, ${iDef.name})`.as('name'),
    description: sql<string>`COALESCE(${iReq.description}, ${iDef.description})`.as('description'),
    material: sql<string>`COALESCE(${iReq.material}, ${iDef.material})`.as('material'),
    price: sql<string>`COALESCE(${iReq.price}, ${iDef.price})`.as('price'),
    includes: sql<string>`COALESCE(${iReq.includes}, ${iDef.includes})`.as('includes'),
    warranty: sql<string>`COALESCE(${iReq.warranty}, ${iDef.warranty})`.as('warranty'),
    image_alt: sql<string>`COALESCE(${iReq.image_alt}, ${iDef.image_alt})`.as('image_alt'),

    tags: sql<string>`COALESCE(${iReq.tags}, ${iDef.tags})`.as('tags'),
    meta_title: sql<string>`COALESCE(${iReq.meta_title}, ${iDef.meta_title})`.as('meta_title'),
    meta_description: sql<string>`COALESCE(${iReq.meta_description}, ${iDef.meta_description})`.as(
      'meta_description',
    ),
    meta_keywords: sql<string>`COALESCE(${iReq.meta_keywords}, ${iDef.meta_keywords})`.as(
      'meta_keywords',
    ),

    locale_resolved: sql<string>`
      CASE WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale} ELSE ${iDef.locale} END
    `.as('locale_resolved'),
  };
}

function imgSelect(iReq: any, iDef: any, sa: any) {
  return {
    id: serviceImages.id,
    service_id: serviceImages.service_id,
    image_asset_id: serviceImages.image_asset_id,
    image_url: serviceImages.image_url,
    is_active: serviceImages.is_active,
    display_order: serviceImages.display_order,
    created_at: serviceImages.created_at,
    updated_at: serviceImages.updated_at,

    title: sql<string>`COALESCE(${iReq.title}, ${iDef.title})`.as('title'),
    alt: sql<string>`COALESCE(${iReq.alt}, ${iDef.alt})`.as('alt'),
    caption: sql<string>`COALESCE(${iReq.caption}, ${iDef.caption})`.as('caption'),
    locale_resolved: sql<string>`
      CASE WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale} ELSE ${iDef.locale} END
    `.as('locale_resolved'),

    img_bucket: sa.bucket,
    img_path: sa.path,
    img_url: sa.url,
  };
}

/* ----------------------- list / get ----------------------- */

export async function listServices(params: {
  locale: LocaleCode;
  defaultLocale: LocaleCode;
  orderParam?: string;
  sort?: Sortable;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  q?: string;
  type?: string;
  featured?: BoolLike;
  is_active?: BoolLike;
}) {
  const iReq = alias(servicesI18n, 'si_req');
  const iDef = alias(servicesI18n, 'si_def');

  const filters: SQL[] = [];

  const featured = to01(params.featured);
  const active = to01(params.is_active);

  if (featured !== undefined) filters.push(eq(services.featured, featured));
  if (active !== undefined) filters.push(eq(services.is_active, active));
  if (params.type) filters.push(eq(services.type, params.type));

  if (params.q && params.q.trim()) {
    const s = `%${params.q.trim()}%`;
    filters.push(sql`
      (
        COALESCE(${iReq.name}, ${iDef.name}) LIKE ${s}
        OR COALESCE(${iReq.slug}, ${iDef.slug}) LIKE ${s}
        OR COALESCE(${iReq.material}, ${iDef.material}) LIKE ${s}
        OR COALESCE(${iReq.description}, ${iDef.description}) LIKE ${s}
        OR COALESCE(${iReq.tags}, ${iDef.tags}) LIKE ${s}
      )
    `);
  }

  const whereExpr: SQL = filters.length > 0 ? (and(...filters) as SQL) : sql`1=1`;

  const ord = parseOrder(params.orderParam, params.sort, params.order);
  const orderBy = ord
    ? ord.dir === 'asc'
      ? asc(services[ord.col])
      : desc(services[ord.col])
    : asc(services.display_order);

  const take = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  const rows = await db
    .select(baseSelect(iReq, iDef))
    .from(services)
    .leftJoin(iReq, and(eq(iReq.service_id, services.id), eq(iReq.locale, params.locale)))
    .leftJoin(iDef, and(eq(iDef.service_id, services.id), eq(iDef.locale, params.defaultLocale)))
    .where(whereExpr)
    .orderBy(orderBy)
    .limit(take)
    .offset(skip);

  const cnt = await db
    .select({ c: sql<number>`COUNT(1)` })
    .from(services)
    .leftJoin(iReq, and(eq(iReq.service_id, services.id), eq(iReq.locale, params.locale)))
    .leftJoin(iDef, and(eq(iDef.service_id, services.id), eq(iDef.locale, params.defaultLocale)))
    .where(whereExpr);

  const total = cnt[0]?.c ?? 0;
  return { items: rows as unknown as ServiceMerged[], total };
}

export async function getServiceMergedById(
  locale: LocaleCode,
  defaultLocale: LocaleCode,
  id: string,
) {
  const iReq = alias(servicesI18n, 'si_req');
  const iDef = alias(servicesI18n, 'si_def');

  const rows = await db
    .select(baseSelect(iReq, iDef))
    .from(services)
    .leftJoin(iReq, and(eq(iReq.service_id, services.id), eq(iReq.locale, locale)))
    .leftJoin(iDef, and(eq(iDef.service_id, services.id), eq(iDef.locale, defaultLocale)))
    .where(eq(services.id, id))
    .limit(1);

  return (rows[0] ?? null) as unknown as ServiceMerged | null;
}

export async function getServiceMergedBySlug(
  locale: LocaleCode,
  defaultLocale: LocaleCode,
  slug: string,
) {
  // 1) Find service_id by slug in any locale, preferring:
  //    requested locale > default locale > anything else.
  const match = await db
    .select({ service_id: servicesI18n.service_id })
    .from(servicesI18n)
    .where(eq(servicesI18n.slug, slug))
    .orderBy(
      sql<number>`
        CASE
          WHEN ${servicesI18n.locale} = ${locale} THEN 0
          WHEN ${servicesI18n.locale} = ${defaultLocale} THEN 1
          ELSE 2
        END
      `,
      asc(servicesI18n.locale),
    )
    .limit(1);

  const serviceId = (match[0] as any)?.service_id as string | undefined;
  if (!serviceId) return null;

  // 2) Fetch merged row for the resolved service_id using locale fallbacks.
  return await getServiceMergedById(locale, defaultLocale, serviceId);
}

/* ----------------------- create/update/delete ----------------------- */

export async function createServiceParent(values: NewServiceRow) {
  await db.insert(services).values(values);
  return values.id;
}

export async function upsertServiceI18n(
  serviceId: string,
  locale: LocaleCode,
  data: Partial<
    Omit<NewServiceI18nRow, 'id' | 'service_id' | 'locale' | 'created_at' | 'updated_at'>
  > & {
    id?: string;
  },
) {
  const insertVals: NewServiceI18nRow = {
    id: data.id ?? randomUUID(),
    service_id: serviceId,
    locale,
    slug: typeof data.slug === 'string' ? data.slug : '',
    name: typeof data.name === 'string' ? data.name : '',

    description: typeof data.description === 'string' ? data.description : null,
    material: typeof data.material === 'string' ? data.material : null,
    price: typeof data.price === 'string' ? data.price : null,
    includes: typeof data.includes === 'string' ? data.includes : null,
    warranty: typeof data.warranty === 'string' ? data.warranty : null,
    image_alt: typeof data.image_alt === 'string' ? data.image_alt : null,

    area: typeof data.area === 'string' ? data.area : null,
    duration: typeof data.duration === 'string' ? data.duration : null,
    maintenance: typeof data.maintenance === 'string' ? data.maintenance : null,
    season: typeof data.season === 'string' ? data.season : null,
    thickness: typeof data.thickness === 'string' ? data.thickness : null,
    equipment: typeof data.equipment === 'string' ? data.equipment : null,

    tags: typeof data.tags === 'string' ? data.tags : null,
    meta_title: typeof data.meta_title === 'string' ? data.meta_title : null,
    meta_description: typeof data.meta_description === 'string' ? data.meta_description : null,
    meta_keywords: typeof data.meta_keywords === 'string' ? data.meta_keywords : null,

    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  for (const k of [
    'slug',
    'name',
    'description',
    'material',
    'price',
    'includes',
    'warranty',
    'image_alt',
    'area',
    'duration',
    'maintenance',
    'season',
    'thickness',
    'equipment',
    'tags',
    'meta_title',
    'meta_description',
    'meta_keywords',
  ] as const) {
    if (typeof (data as any)[k] !== 'undefined') (setObj as any)[k] = (data as any)[k];
  }
  setObj.updated_at = new Date();

  if (Object.keys(setObj).length === 1) return;

  await db.insert(servicesI18n).values(insertVals).onDuplicateKeyUpdate({ set: setObj });
}

export async function upsertServiceI18nAllLocales(
  serviceId: string,
  data: Partial<
    Omit<NewServiceI18nRow, 'id' | 'service_id' | 'locale' | 'created_at' | 'updated_at'>
  >,
) {
  const locales = await getAppLocales(null);
  for (const L of locales) {
    await upsertServiceI18n(serviceId, L, data);
  }
}

export async function updateServiceParent(id: string, patch: Partial<NewServiceRow>) {
  await db
    .update(services)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(services.id, id));
}

export async function deleteServiceParent(id: string) {
  const res = await db.delete(services).where(eq(services.id, id)).execute();
  const affected =
    typeof (res as any)?.affectedRows === 'number' ? Number((res as any).affectedRows) : 0;
  return affected;
}

/* ----------------------- images ----------------------- */

export async function listServiceImages(params: {
  serviceId: string;
  locale: LocaleCode;
  defaultLocale: LocaleCode;
  onlyActive?: boolean;
}) {
  const iReq = alias(serviceImagesI18n, 'simg_req');
  const iDef = alias(serviceImagesI18n, 'simg_def');
  const saImg = alias(storageAssets, 'sa_img');

  const where =
    params.onlyActive === true
      ? and(eq(serviceImages.service_id, params.serviceId), eq(serviceImages.is_active, 1))
      : and(eq(serviceImages.service_id, params.serviceId), sql`1=1`);

  const rows = await db
    .select(imgSelect(iReq, iDef, saImg))
    .from(serviceImages)
    .leftJoin(iReq, and(eq(iReq.image_id, serviceImages.id), eq(iReq.locale, params.locale)))
    .leftJoin(iDef, and(eq(iDef.image_id, serviceImages.id), eq(iDef.locale, params.defaultLocale)))
    .leftJoin(saImg, eq(saImg.id, serviceImages.image_asset_id))
    .where(where)
    .orderBy(asc(serviceImages.display_order), asc(serviceImages.created_at));

  return (rows as any[]).map(
    (r): ServiceImageMerged => ({
      id: r.id,
      service_id: r.service_id,
      image_asset_id: r.image_asset_id ?? null,
      image_url:
        r.image_url ||
        (r.img_bucket && r.img_path
          ? publicUrlOf(r.img_bucket as string, r.img_path as string, r.img_url as string | null)
          : null),
      is_active: r.is_active,
      display_order: r.display_order,
      created_at: r.created_at,
      updated_at: r.updated_at,
      title: r.title ?? null,
      alt: r.alt ?? null,
      caption: r.caption ?? null,
      locale_resolved: r.locale_resolved ?? null,
    }),
  );
}

export async function createServiceImage(values: NewServiceImageRow) {
  await db.insert(serviceImages).values(values);
  return values.id;
}

export async function upsertServiceImageI18n(
  imageId: string,
  locale: LocaleCode,
  data: Partial<
    Omit<NewServiceImageI18nRow, 'id' | 'image_id' | 'locale' | 'created_at' | 'updated_at'>
  > & {
    id?: string;
  },
) {
  const insertVals: NewServiceImageI18nRow = {
    id: data.id ?? randomUUID(),
    image_id: imageId,
    locale,
    title: typeof data.title === 'string' ? data.title : (null as any),
    alt: typeof data.alt === 'string' ? data.alt : (null as any),
    caption: typeof data.caption === 'string' ? data.caption : (null as any),
    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  for (const k of ['title', 'alt', 'caption'] as const) {
    if (typeof (data as any)[k] !== 'undefined') (setObj as any)[k] = (data as any)[k];
  }
  setObj.updated_at = new Date();

  if (Object.keys(setObj).length === 1) return;

  await db.insert(serviceImagesI18n).values(insertVals).onDuplicateKeyUpdate({ set: setObj });
}

export async function upsertServiceImageI18nAllLocales(
  imageId: string,
  data: Partial<
    Omit<NewServiceImageI18nRow, 'id' | 'image_id' | 'locale' | 'created_at' | 'updated_at'>
  >,
) {
  const locales = await getAppLocales(null);
  for (const L of locales) {
    await upsertServiceImageI18n(imageId, L, data);
  }
}

export async function updateServiceImage(id: string, patch: Partial<NewServiceImageRow>) {
  await db
    .update(serviceImages)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(serviceImages.id, id));
}

export async function deleteServiceImage(id: string) {
  const res = await db.delete(serviceImages).where(eq(serviceImages.id, id)).execute();
  const affected =
    typeof (res as any)?.affectedRows === 'number' ? Number((res as any).affectedRows) : 0;
  return affected;
}

export async function reorderServices(items: { id: string; display_order: number }[]) {
  if (!items || !items.length) return;

  const now = new Date() as any;

  await db.transaction(async (tx) => {
    for (const it of items) {
      if (!it.id || typeof it.display_order !== 'number') continue;
      await tx
        .update(services)
        .set({ display_order: it.display_order, updated_at: now })
        .where(eq(services.id, it.id));
    }
  });
}
