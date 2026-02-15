// src/modules/_shared/locale.ts

import {
  LOCALES,
  normalizeLocale,
  ensureLocalesLoadedFromSettings,
  isSupported,
  getRuntimeDefaultLocale,
} from '@/core/i18n';

export type LocaleQueryLike = { locale?: string; default_locale?: string };
export type ResolvedLocales = { locale: string; def: string };

function normalizeLooseLocale(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return normalizeLocale(s) || s.toLowerCase();
}

function pickSafeDefault(): string {
  const base = normalizeLocale(getRuntimeDefaultLocale()) || getRuntimeDefaultLocale() || 'de';
  if (LOCALES.includes(base)) return base;
  return LOCALES[0] || 'de';
}

export async function resolveRequestLocales(req: any, query?: LocaleQueryLike): Promise<ResolvedLocales> {
  await ensureLocalesLoadedFromSettings();

  const q = query ?? ((req.query ?? {}) as LocaleQueryLike);
  const reqRaw = normalizeLooseLocale(q.locale) ?? normalizeLooseLocale(req.locale);
  const defRawFromQuery = normalizeLooseLocale(q.default_locale);

  const safeDefault = pickSafeDefault();
  const safeLocale = reqRaw && isSupported(reqRaw) ? reqRaw : safeDefault;
  const safeDef = defRawFromQuery && isSupported(defRawFromQuery) ? defRawFromQuery : safeDefault;

  return { locale: safeLocale, def: safeDef };
}
