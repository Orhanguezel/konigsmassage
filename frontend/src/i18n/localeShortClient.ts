// =============================================================
// FILE: src/i18n/localeShortClient.ts
// konigsmassage – Locale normalize helper (CLIENT SAFE, NO HOOKS)
// - NO toShortLocale
// - Uses normLocaleTag
// =============================================================

import { normLocaleTag } from '@/i18n/localeUtils';

const safeStr = (v: unknown) => String(v ?? '').trim();

export function localeShortClient(v: unknown): string {
  const raw = safeStr(v);
  if (!raw) return '';
  return normLocaleTag(raw) || '';
}

export function localeShortClientOr(v: unknown, fallback = 'de'): string {
  return localeShortClient(v) || fallback;
}
