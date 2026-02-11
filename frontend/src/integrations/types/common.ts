// =============================================================
// FILE: src/integrations/db/types/common.ts
// =============================================================

/** Genel satır tipi */
export type UnknownRow = Record<string, unknown>;

export type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false';

export type SortDirection = 'asc' | 'desc';

export function safeStr(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

export function titleFromSlug(slug: unknown, fallback: string): string {
  const s = safeStr(slug);
  if (!s) return fallback;

  const lastSegment = s
    .split('/')
    .map((x) => x.trim())
    .filter(Boolean)
    .pop();

  if (!lastSegment) return fallback;

  let decoded = lastSegment;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch {
    // ignore decode errors
  }

  const words = decoded
    .replace(/[_\s]+/g, '-')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return words || fallback;
}

export const downgradeH1ToH2 = (rawHtml: string) =>
  String(rawHtml || '')
    .replace(/<h1(\s|>)/gi, '<h2$1')
    .replace(/<\/h1>/gi, '</h2>');

export function safeJson<T>(v: any, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === 'object') return v as T;
  if (typeof v !== 'string') return fallback;

  const s = v.trim();
  if (!s) return fallback;

  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}



export function extractHtmlFromAny(page: any): string {
  if (!page) return '';

  const ch = safeStr(page?.content_html);
  if (ch) return ch;

  const c = page?.content ?? page?.content_json ?? page?.contentJson;
  if (!c) return '';

  if (typeof c === 'object') return safeStr((c as any)?.html);

  if (typeof c === 'string') {
    const s = c.trim();
    if (!s) return '';

    if (s.startsWith('{') || s.startsWith('[')) {
      const obj = safeJson<any>(s, null);
      const h = safeStr(obj?.html);
      if (h) return h;
    }
    return s;
  }

  return '';
}

export function isRemoteUrl(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  return /^https?:\/\//i.test(src) || /^\/\//.test(src);
}
