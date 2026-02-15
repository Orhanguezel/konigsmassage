import { z } from 'zod';
import { normalizeLocale } from '@/core/i18n';
import { parseJsonArrayString } from './json';

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

export type BooleanLike = z.infer<typeof boolLike>;

export const LOCALE_LIKE = z
  .string()
  .trim()
  .min(1)
  .transform((s) => normalizeLocale(s) || s.toLowerCase());

export const UUID36 = z.string().length(36);

export const URL2000 = z.string().trim().max(2000).url('Geçersiz URL');

export const SLUG = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug sadece küçük harf, rakam ve tire içermelidir')
  .trim();

export const UrlArrayLike = z
  .union([z.array(URL2000), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return parseJsonArrayString(val);
    return null;
  })
  .refine((v) => v === null || Array.isArray(v), 'Format geçersiz (array veya JSON string olmalı)');

export const UuidArrayLike = z
  .union([z.array(UUID36), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return parseJsonArrayString(val);
    return null;
  })
  .refine((v) => v === null || Array.isArray(v), 'Format geçersiz (array veya JSON string olmalı)');
