// =============================================================
// FILE: src/modules/storage/_util.ts
// =============================================================

import { env } from "@/core/env";

const encSeg = (s: string) => encodeURIComponent(s);
const encPath = (p: string) => p.split("/").map(encSeg).join("/");
const decPath = (p: string) => decodeURIComponent(p);

export type Cfg = {
  /** site_settings.storage_cdn_public_base */
  cdnPublicBase?: string | null;
  /** site_settings.storage_public_api_base */
  publicApiBase?: string | null;
};

/**
 * Public URL üretimi (merkezi):
 *
 *  1) providerUrl (Cloudinary secure_url / local URL) varsa onu kullan
 *  2) cfg.cdnPublicBase → env.STORAGE_CDN_PUBLIC_BASE
 *  3) cfg.publicApiBase → env.STORAGE_PUBLIC_API_BASE
 *  4) fallback: /storage/:bucket/:path
 */
export function buildPublicUrl(
  bucket: string,
  path: string,
  providerUrl?: string | null,
  cfg?: Cfg | null,
): string {
  // 1) Provider URL'yi olduğu gibi kullan
  if (providerUrl) return providerUrl;

  // 2) CDN base (önce site_settings, sonra env)
  const cdnBaseRaw =
    (cfg?.cdnPublicBase ?? env.STORAGE_CDN_PUBLIC_BASE ?? "").replace(
      /\/+$/,
      "",
    );

  if (cdnBaseRaw) {
    return `${cdnBaseRaw}/${encSeg(bucket)}/${encPath(path)}`;
  }

  // 3) API base (önce site_settings, sonra env)
  const apiBaseRaw =
    (cfg?.publicApiBase ?? env.STORAGE_PUBLIC_API_BASE ?? "").replace(
      /\/+$/,
      "",
    );

  if (apiBaseRaw) {
    return `${apiBaseRaw}/storage/${encSeg(bucket)}/${encPath(path)}`;
  }

  // 4) En son çare: relative path
  return `/storage/${encSeg(bucket)}/${encPath(path)}`;
}

/** Eski imzayla geri uyumlu helper (cfg opsiyonel) */
export function publicUrlOf(
  bucket: string,
  path: string,
  providerUrl?: string | null,
  cfg?: Cfg | null,
): string {
  return buildPublicUrl(bucket, path, providerUrl, cfg);
}

/** Asset objesi için kısa helper */
export function publicUrlForAsset(
  asset: { bucket: string; path: string; url?: string | null },
  cfg?: Cfg | null,
): string {
  return buildPublicUrl(asset.bucket, asset.path, asset.url ?? null, cfg);
}

/** Baştaki slash'ları sil */
export const stripLeadingSlashes = (s: string) => s.replace(/^\/+/, "");

/** Folder normalize (baş/son slash temizle, double slash düzelt, max 255) */
export const normalizeFolder = (s?: string | null) => {
  if (!s) return null;
  let f = s
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
  return f.length ? f.slice(0, 255) : null;
};

/** Bucket + raw path → normalized path */
export function normalizePath(bucket: string, raw: string): string {
  let p = stripLeadingSlashes(raw).replace(/\/{2,}/g, "/");
  if (p.startsWith(bucket + "/")) p = p.slice(bucket.length + 1);
  return p;
}

/** Query string boolean parser (1/true/yes/on) */
export function toBool(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.toLowerCase();
  return ["1", "true", "yes", "on"].includes(s);
}

/** NULL/undefined alanları objeden at (INSERT/PATCH için) */
export const omitNullish = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;

export function chunk<T>(arr: T[], size = 100) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    out.push(arr.slice(i, i + size));
  return out;
}

// (İleride istersen kullanırsın diye export ediyorum)
export { decPath };
