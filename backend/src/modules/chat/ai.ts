// =============================================================
// FILE: src/modules/chat/ai.ts
// Multi-provider AI chat (DB settings + env var fallback)
// König Energetik
// =============================================================

import { getChatAiSettings, type ChatAiSettings } from "@/modules/siteSettings/service";

export type AiProvider = "openai" | "anthropic" | "grok";

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiReplyResult = {
  text: string;
  provider: AiProvider;
  model: string;
};

type GenerateArgs = {
  preferredProvider?: "auto" | AiProvider;
  systemPrompt: string;
  messages: AiChatMessage[];
};

// ─── Settings cache (60 s TTL) ──────────────────────────────

let _cache: { settings: ChatAiSettings; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function loadSettings(): Promise<ChatAiSettings> {
  const now = Date.now();
  if (_cache && now - _cache.ts < CACHE_TTL_MS) return _cache.settings;

  try {
    const settings = await getChatAiSettings();
    _cache = { settings, ts: now };
    return settings;
  } catch {
    // DB unavailable → return empty, env vars will be used as fallback
    return {
      enabled: true,
      providerOrder: "",
      systemPrompt: null,
      appointmentUrl: null,
      groqApiKey: null,
      groqModel: null,
      groqApiBase: null,
      xaiApiKey: null,
      xaiModel: null,
      xaiApiBase: null,
      openaiApiKey: null,
      openaiModel: null,
      openaiApiBase: null,
      anthropicApiKey: null,
      anthropicModel: null,
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function getEnv(name: string): string {
  return (process.env[name] || "").trim();
}

/** DB value → env var fallback → default */
function pick(db: string | null | undefined, envName: string, fallback = ""): string {
  if (db) return db;
  const e = getEnv(envName);
  return e || fallback;
}

function resolveProviderOrder(
  settings: ChatAiSettings,
  preferredProvider?: "auto" | AiProvider,
): AiProvider[] {
  const defaultOrder = ["openai", "anthropic", "grok"] as AiProvider[];

  const orderStr = settings.providerOrder || getEnv("AI_PROVIDER_ORDER");
  const configured = orderStr
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v): v is AiProvider => v === "openai" || v === "anthropic" || v === "grok");

  const base = configured.length ? configured : defaultOrder;
  if (!preferredProvider || preferredProvider === "auto") return [...new Set(base)];
  return [preferredProvider, ...base.filter((p) => p !== preferredProvider)];
}

// ─── API callers ─────────────────────────────────────────────

async function callOpenAiLike(args: {
  apiBase: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: AiChatMessage[];
}): Promise<string | null> {
  if (!args.apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${args.apiBase.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify({
        model: args.model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: "system", content: args.systemPrompt },
          ...args.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") return null;
    const clean = text.trim();
    return clean || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function callAnthropic(args: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: AiChatMessage[];
}): Promise<string | null> {
  if (!args.apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": args.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: args.model,
        max_tokens: 500,
        system: args.systemPrompt,
        messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const text = data?.content?.find?.((c: any) => c?.type === "text")?.text;
    if (typeof text !== "string") return null;
    const clean = text.trim();
    return clean || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Main entry ──────────────────────────────────────────────

export async function generateAiSupportReply(args: GenerateArgs): Promise<AiReplyResult | null> {
  const settings = await loadSettings();
  const order = resolveProviderOrder(settings, args.preferredProvider);

  for (const provider of order) {
    if (provider === "openai") {
      const apiKey = pick(settings.openaiApiKey, "OPENAI_API_KEY");
      const model = pick(settings.openaiModel, "OPENAI_MODEL", "gpt-4o-mini");
      const apiBase = pick(settings.openaiApiBase, "OPENAI_API_BASE", "https://api.openai.com/v1");

      const text = await callOpenAiLike({
        apiBase,
        apiKey,
        model,
        systemPrompt: args.systemPrompt,
        messages: args.messages,
      });
      if (text) return { text, provider, model };
      continue;
    }

    if (provider === "anthropic") {
      const apiKey = pick(settings.anthropicApiKey, "ANTHROPIC_API_KEY");
      const model = pick(settings.anthropicModel, "ANTHROPIC_MODEL", "claude-3-5-haiku-latest");

      const text = await callAnthropic({
        apiKey,
        model,
        systemPrompt: args.systemPrompt,
        messages: args.messages,
      });
      if (text) return { text, provider, model };
      continue;
    }

    // provider === "grok" → try Groq first, then xAI
    const groqApiKey = pick(settings.groqApiKey, "GROQ_API_KEY");
    if (groqApiKey) {
      const groqModel = pick(settings.groqModel, "GROQ_MODEL", "llama-3.3-70b-versatile");
      const groqBase = pick(settings.groqApiBase, "GROQ_API_BASE", "https://api.groq.com/openai/v1");

      const text = await callOpenAiLike({
        apiBase: groqBase,
        apiKey: groqApiKey,
        model: groqModel,
        systemPrompt: args.systemPrompt,
        messages: args.messages,
      });
      if (text) return { text, provider, model: groqModel };
    }

    const xaiApiKey = pick(settings.xaiApiKey, "XAI_API_KEY") || getEnv("GROK_API_KEY");
    const xaiModel = pick(settings.xaiModel, "XAI_MODEL") || getEnv("GROK_MODEL") || "grok-2-latest";
    const xaiBase = pick(settings.xaiApiBase, "XAI_API_BASE", "https://api.x.ai/v1");

    const text = await callOpenAiLike({
      apiBase: xaiBase,
      apiKey: xaiApiKey,
      model: xaiModel,
      systemPrompt: args.systemPrompt,
      messages: args.messages,
    });
    if (text) return { text, provider, model: xaiModel };
  }

  return null;
}
