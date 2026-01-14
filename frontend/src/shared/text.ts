// src/lib/shared/text.ts
import type { SupportedLocale } from "@/types/common";

export function stripHtml(x = ""): string {
  return x.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
export function excerpt(x = "", max = 220): string {
  const t = stripHtml(x);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = cut.lastIndexOf(" ");
  return (last > 40 ? cut.slice(0, last) : cut) + "…";
}

export function pickML(tf: any, l: SupportedLocale): string {
  if (!tf) return "";
  if (typeof tf === "string") return tf.trim();
  const cand =
    tf?.[l] ||
    tf?.en ||
    tf?.tr ||
    (Object.values(tf || {}).find((x: any) => typeof x === "string" && x.trim()) as string) ||
    "";
  return (cand || "").toString().trim();
}

/** 🔒 Çok dilli alan için KATI seçim (fallback yok) */
export function pickStrict(tf: any, l: SupportedLocale): string {
  if (!tf) return "";
  if (typeof tf === "string") return tf.trim(); // backend tek dilli döndüyse kabul et
  const v = (tf as Record<string, unknown>)[l];
  return typeof v === "string" ? v.trim() : "";
}
