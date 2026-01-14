// =============================================================
// FILE: src/modules/siteSettings/seoSchema.ts
// (Optional compatibility) – images-only + legacy image normalize
// Prefer: seo.validation.ts as the single source.
// =============================================================

import { z } from 'zod';

const strLoose = z
  .union([z.string(), z.number(), z.boolean()])
  .transform((v) => String(v).trim())
  .optional();

const urlLike = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => !s || /^https?:\/\//i.test(s) || s.startsWith('/'), 'Invalid URL')
  .optional();

const robotsSchema = z
  .object({
    noindex: z.boolean().optional(),
    index: z.boolean().optional(),
    follow: z.boolean().optional(),
    noarchive: z.boolean().optional(),
    nosnippet: z.boolean().optional(),
    maxImagePreview: z.enum(['none', 'standard', 'large']).optional(),
    maxSnippet: z.number().int().min(-1).optional(),
    maxVideoPreview: z.number().int().min(-1).optional(),
  })
  .strict()
  .optional();

const openGraphSchema = z
  .object({
    type: z.enum(['website', 'article', 'product']).optional(),

    // legacy (accept) – will normalize into images[0]
    image: urlLike,

    // single source
    images: z
      .array(
        z
          .string()
          .transform((s) => s.trim())
          .refine((s) => s.length > 0)
          .refine((s) => /^https?:\/\//i.test(s) || s.startsWith('/'), 'Invalid URL'),
      )
      .optional(),
  })
  .strict()
  .optional();

const twitterSchema = z
  .object({
    card: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
    site: strLoose,
    creator: strLoose,
  })
  .strict()
  .optional();

export const seoSchema = z
  .object({
    title_default: strLoose,
    title_template: strLoose,
    description: strLoose,
    site_name: strLoose,

    open_graph: openGraphSchema,
    twitter: twitterSchema,
    robots: robotsSchema,

    knowledge_graph: z
      .object({
        org_name: strLoose,
        org_legal_name: strLoose,
        org_logo: urlLike,
        same_as: z.array(z.string().transform((s) => s.trim())).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type SeoObject = z.infer<typeof seoSchema>;

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
function cleanStr(v: any): string | undefined {
  const s = String(v ?? '').trim();
  return s ? s : undefined;
}
function cleanUrlArr(arr?: string[]) {
  if (!arr?.length) return undefined;
  const cleaned = arr.map((s) => String(s).trim()).filter(Boolean);
  const valid = cleaned.filter((s) => /^https?:\/\//i.test(s) || s.startsWith('/'));
  return valid.length ? uniq(valid) : undefined;
}

export function normalizeSeo(input: unknown): SeoObject {
  const parsed = seoSchema.safeParse(input);
  const raw = parsed.success ? parsed.data : ({} as SeoObject);

  const titleDefault = cleanStr(raw.title_default) ?? 'konigsmassage';
  const titleTemplate = cleanStr(raw.title_template) ?? '%s | konigsmassage';
  const description = cleanStr(raw.description) ?? '';
  const siteName = cleanStr(raw.site_name) ?? 'konigsmassage';

  const og = raw.open_graph ?? {};
  const ogType = (og.type ?? 'website') as 'website' | 'article' | 'product';

  // ✅ legacy image -> images[0], then single-source images only
  const legacyOne = cleanStr((og as any).image);
  const images = uniq([
    ...(legacyOne ? [legacyOne] : []),
    ...(cleanUrlArr((og as any).images) ?? []),
  ]);

  const tw = raw.twitter ?? {};
  const twitterCard = (tw.card ?? 'summary_large_image') as
    | 'summary'
    | 'summary_large_image'
    | 'app'
    | 'player';
  const twitterSite = cleanStr(tw.site);
  const twitterCreator = cleanStr(tw.creator);

  const rb = raw.robots ?? {};
  const noindex = rb.noindex === true;
  const index = noindex ? false : rb.index ?? true;
  const follow = noindex ? false : rb.follow ?? true;

  const out: SeoObject = {
    title_default: titleDefault,
    title_template: titleTemplate,
    description,
    site_name: siteName,

    open_graph: {
      type: ogType,
      ...(images.length ? { images } : {}),
      // image alanını output’ta BİLEREK üretmiyoruz (single-source)
    },

    twitter: {
      card: twitterCard,
      ...(twitterSite ? { site: twitterSite } : {}),
      ...(twitterCreator ? { creator: twitterCreator } : {}),
    },

    robots: {
      noindex: noindex || undefined,
      index,
      follow,
      ...(rb.noarchive != null ? { noarchive: !!rb.noarchive } : {}),
      ...(rb.nosnippet != null ? { nosnippet: !!rb.nosnippet } : {}),
      ...(rb.maxImagePreview ? { maxImagePreview: rb.maxImagePreview } : {}),
      ...(typeof rb.maxSnippet === 'number' ? { maxSnippet: rb.maxSnippet } : {}),
      ...(typeof rb.maxVideoPreview === 'number' ? { maxVideoPreview: rb.maxVideoPreview } : {}),
    },

    ...(raw.knowledge_graph
      ? {
          knowledge_graph: {
            ...(cleanStr(raw.knowledge_graph.org_name)
              ? { org_name: cleanStr(raw.knowledge_graph.org_name) }
              : {}),
            ...(cleanStr(raw.knowledge_graph.org_legal_name)
              ? { org_legal_name: cleanStr(raw.knowledge_graph.org_legal_name) }
              : {}),
            ...(cleanStr(raw.knowledge_graph.org_logo)
              ? { org_logo: cleanStr(raw.knowledge_graph.org_logo) }
              : {}),
            ...(raw.knowledge_graph.same_as?.length
              ? {
                  same_as: uniq(raw.knowledge_graph.same_as.map((x) => String(x).trim())).filter(
                    Boolean,
                  ),
                }
              : {}),
          },
        }
      : {}),
  };

  return out;
}
