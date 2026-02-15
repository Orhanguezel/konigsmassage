// =============================================================
// FILE: src/modules/dashboard/service.ts
// Knowledge-context builder for AI chat (König Energetik)
// Searches: services, custom pages, chat_ai_knowledge
// =============================================================

import { and, eq, like, or } from "drizzle-orm";
import { db } from "@/db/client";
import { services, servicesI18n } from "@/modules/services/schema";
import { customPages, customPagesI18n } from "@/modules/customPages/schema";
import { chat_ai_knowledge } from "@/modules/chat/schema";

export type DashboardKnowledgeContext = {
  text: string;
  sourcesCount: number;
};

// ─── Stop words (DE / TR / EN) ─────────────────────────────

const STOP_WORDS = new Set([
  // DE
  "und", "oder", "mit", "für", "aber", "das", "die", "der", "ein", "eine",
  "ist", "sind", "von", "den", "dem", "des", "was", "wie", "wir", "ich",
  "sie", "haben", "kann", "nicht", "auch", "noch", "nur", "sehr",
  // TR
  "ve", "veya", "ile", "icin", "için", "ama", "fakat", "bu", "su", "şu",
  "bir", "iki", "hangi", "nedir", "nasil", "nasıl", "bilgi", "istiyorum",
  "lütfen",
  // EN
  "the", "and", "for", "about", "how", "what", "why", "please", "can",
  "this", "that", "with", "from",
]);

// ─── Query expansions (massage domain) ─────────────────────

const QUERY_EXPANSIONS: Record<string, string[]> = {
  // DE → cross-lang
  massage: ["masaj", "treatment"],
  massagen: ["masaj", "treatment", "massage"],
  termin: ["booking", "randevu", "appointment"],
  buchung: ["booking", "randevu", "reservation"],
  preis: ["price", "fiyat", "cost"],
  preise: ["price", "fiyat", "cost", "pricing"],
  gutschein: ["voucher", "hediye", "gift"],
  geschenk: ["gift", "hediye", "gutschein"],
  stornierung: ["cancellation", "iptal", "cancel"],
  stornieren: ["cancellation", "iptal", "cancel"],
  öffnungszeiten: ["hours", "saatler", "opening"],
  verfügbarkeit: ["availability", "müsaitlik"],
  entspannung: ["relaxation", "rahatlama"],
  rücken: ["back", "sırt"],
  // TR → cross-lang
  masaj: ["massage", "treatment"],
  randevu: ["termin", "booking", "appointment"],
  fiyat: ["price", "preis", "cost"],
  fiyatlandirma: ["price", "pricing", "preis"],
  fiyatlandırma: ["price", "pricing", "preis"],
  iptal: ["cancellation", "stornierung", "cancel"],
  hediye: ["gift", "gutschein", "voucher"],
  çalışma: ["hours", "öffnungszeiten", "opening"],
  hizmet: ["service", "dienstleistung"],
  hizmetler: ["services", "dienstleistungen"],
  sırt: ["back", "rücken"],
  boyun: ["neck", "nacken"],
  // EN → cross-lang
  booking: ["termin", "buchung", "randevu"],
  appointment: ["termin", "randevu"],
  cancel: ["stornierung", "iptal"],
  price: ["preis", "fiyat"],
  gift: ["gutschein", "hediye"],
  voucher: ["gutschein", "hediye"],
  relaxation: ["entspannung", "rahatlama"],
};

// ─── Helpers ────────────────────────────────────────────────

function tokenize(input: string): string[] {
  const raw = (input || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const out = new Set<string>();
  for (const tok of raw) {
    if (tok.length < 3) continue;
    if (STOP_WORDS.has(tok)) continue;
    out.add(tok);
    const expansions = QUERY_EXPANSIONS[tok] ?? [];
    for (const e of expansions) out.add(e);
  }

  return [...out].slice(0, 10);
}

function truncate(v: unknown, n: number): string {
  const s = String(v ?? "").trim().replace(/\s+/g, " ");
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}...`;
}

function stripHtml(v: string): string {
  return v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractCustomPageText(content: unknown): string {
  const raw = String(content ?? "").trim();
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as any;
    if (parsed && typeof parsed === "object") {
      const html = typeof parsed.html === "string" ? parsed.html : "";
      if (html) return stripHtml(html);
    }
  } catch {
    // fallback below
  }

  return stripHtml(raw);
}

// ─── Main builder ───────────────────────────────────────────

export async function buildDashboardKnowledgeContext(
  userText: string,
  locale = "de",
): Promise<DashboardKnowledgeContext> {
  const tokens = tokenize(userText);
  if (!tokens.length) return { text: "", sourcesCount: 0 };

  const serviceConds = tokens.flatMap((t) => [
    like(servicesI18n.name, `%${t}%`),
    like(servicesI18n.slug, `%${t}%`),
    like(servicesI18n.description, `%${t}%`),
  ]);

  const policyConds = tokens.flatMap((t) => [
    like(customPagesI18n.title, `%${t}%`),
    like(customPagesI18n.slug, `%${t}%`),
    like(customPagesI18n.summary, `%${t}%`),
  ]);

  const knowledgeConds = tokens.flatMap((t) => [
    like(chat_ai_knowledge.title, `%${t}%`),
    like(chat_ai_knowledge.content, `%${t}%`),
    like(chat_ai_knowledge.tags, `%${t}%`),
  ]);

  const [serviceRows, policyRows, knowledgeRows] = await Promise.all([
    db
      .select({
        id: services.id,
        is_active: services.is_active,
        type: services.type,
        duration: services.duration,
        locale: servicesI18n.locale,
        name: servicesI18n.name,
        slug: servicesI18n.slug,
        description: servicesI18n.description,
        price: servicesI18n.price,
        includes: servicesI18n.includes,
      })
      .from(services)
      .innerJoin(servicesI18n, eq(servicesI18n.service_id, services.id))
      .where(and(eq(services.is_active, 1 as any), or(...serviceConds)))
      .limit(8),

    db
      .select({
        id: customPages.id,
        is_published: customPages.is_published,
        module_key: customPages.module_key,
        locale: customPagesI18n.locale,
        title: customPagesI18n.title,
        slug: customPagesI18n.slug,
        summary: customPagesI18n.summary,
        content: customPagesI18n.content,
      })
      .from(customPages)
      .innerJoin(customPagesI18n, eq(customPagesI18n.page_id, customPages.id))
      .where(and(eq(customPages.is_published, 1 as any), or(...policyConds)))
      .limit(5),

    db
      .select({
        id: chat_ai_knowledge.id,
        locale: chat_ai_knowledge.locale,
        title: chat_ai_knowledge.title,
        content: chat_ai_knowledge.content,
        tags: chat_ai_knowledge.tags,
        priority: chat_ai_knowledge.priority,
      })
      .from(chat_ai_knowledge)
      .where(
        and(
          eq(chat_ai_knowledge.is_active, 1 as any),
          eq(chat_ai_knowledge.locale, locale.toLowerCase()),
          or(...knowledgeConds),
        ),
      )
      .limit(10),
  ]);

  const lines: string[] = [];

  if (serviceRows.length) {
    lines.push("[SERVICES]");
    for (const s of serviceRows) {
      lines.push(
        `- ${truncate(s.name, 90)} | type=${s.type} | duration=${s.duration ?? "?"} | locale=${s.locale} | slug=${s.slug}`,
      );
      if (s.includes) lines.push(`  includes: ${truncate(s.includes, 180)}`);
      if (s.description) lines.push(`  desc: ${truncate(s.description, 220)}`);
    }
  }

  if (policyRows.length) {
    lines.push("[POLICIES/PAGES]");
    for (const p of policyRows) {
      const summary = p.summary || extractCustomPageText(p.content);
      lines.push(
        `- ${truncate(p.title, 90)} | module=${p.module_key} | locale=${p.locale} | slug=${p.slug}`,
      );
      if (summary) lines.push(`  summary: ${truncate(summary, 240)}`);
    }
  }

  if (knowledgeRows.length) {
    lines.push("[ADMIN_KNOWLEDGE]");
    for (const k of knowledgeRows) {
      lines.push(
        `- ${truncate(k.title, 120)} | locale=${k.locale} | priority=${k.priority}`,
      );
      lines.push(`  note: ${truncate(stripHtml(String(k.content ?? "")), 280)}`);
      if (k.tags) lines.push(`  tags: ${truncate(k.tags, 140)}`);
    }
  }

  return {
    text: lines.join("\n"),
    sourcesCount: serviceRows.length + policyRows.length + knowledgeRows.length,
  };
}
