// =============================================================
// FILE: src/i18n/adminLocale.ts
// konigsmassage – Admin locale helpers (NO URL sync, NO prefix)
// - Admin tarafında locale URL'e yazılmaz.
// - API için güvenli locale seçer (db default > first option > 'tr').
// =============================================================

import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';

export function resolveAdminApiLocale(
  localeOptions?: Array<{ value: string } | { value: string; label?: string }> | null,
  defaultLocaleFromDb?: string | null,
  fallback = 'de',
): string {
  const set = new Set(
    (localeOptions ?? []).map((x: any) => localeShortClient(x?.value)).filter(Boolean),
  );

  const db = localeShortClient(defaultLocaleFromDb);
  if (db && set.has(db)) return db;

  const first = localeShortClient((localeOptions as any)?.[0]?.value);
  if (first && set.has(first)) return first;

  // localeOptions gelmemiş olabilir (ilk render), yine de stabil fallback
  return localeShortClientOr(fallback, fallback);
}
