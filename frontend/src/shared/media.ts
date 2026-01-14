// src/lib/shared/media.ts
export type FitMode = "fill" | "fit";

/** Cloudinary (veya düz URL) için güvenli src üretir */
export function toCdnSrc(
  url?: string | null,
  w = 720,
  h = 520,
  mode: FitMode = "fill"
): string {
  const s = (url || "").trim();
  if (!s) return "";
  if (s.startsWith("https://res.cloudinary.com/")) {
    const sep = s.includes("?") ? "&" : "?";
    const c = mode === "fill" ? "c_fill" : "c_fit";
    return `${s}${sep}f_auto,q_auto:eco,w=${w},h=${h},${c}`;
  }
  return s;
}

export function toAvatarSrc(
  img?: string | { url?: string; webp?: string; thumbnail?: string } | null,
  w = 96,
  h = 96
): string {
  const base =
    (typeof img === "string" ? img : img?.webp || img?.url || img?.thumbnail || "")?.trim() || "";
  if (!base) return "";
  if (base.startsWith("https://res.cloudinary.com/")) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}f_auto,q_auto:eco,w=${w},h=${h},c_fill,g_face`;
  }
  return base;
}
