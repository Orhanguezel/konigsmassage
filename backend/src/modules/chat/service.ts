// =============================================================
// FILE: src/modules/chat/service.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import type WebSocket from "ws";
import { randomUUID } from "crypto";
import { chatRepo } from "./repository";
import type { ChatRole } from "./validation";
import { generateAiSupportReply } from "./ai";
import { db as drizzleDb } from "@/db/client";
import { buildKnowledgeContext } from "./knowledge";
import { t } from "@/core/locale-strings";

type AuthedUser = {
  id: string;
  role: "admin" | "buyer" | "vendor";
};

type WsConn = {
  ws: WebSocket;
  user: AuthedUser;
  thread_id: string;
  tokens: number;
  lastRefillMs: number;
};

const TOKEN_BUCKET_CAP = 10; // 10 messages burst
const TOKEN_REFILL_PER_SEC = 5; // 5 msg / sec
const AI_ASSISTANT_USER_ID = "00000000-0000-0000-0000-00000000a11f";

function refill(conn: WsConn, nowMs: number) {
  const elapsed = Math.max(0, nowMs - conn.lastRefillMs) / 1000;
  const add = elapsed * TOKEN_REFILL_PER_SEC;
  conn.tokens = Math.min(TOKEN_BUCKET_CAP, conn.tokens + add);
  conn.lastRefillMs = nowMs;
}

function roleToChatRole(r: AuthedUser["role"]): ChatRole {
  if (r === "admin") return "admin";
  if (r === "vendor") return "vendor";
  return "buyer";
}

function isEnabled(v: string | undefined, fallback: boolean): boolean {
  if (!v) return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function normalizeLocaleForUrl(v: string | undefined): "tr" | "en" | "de" {
  const s = String(v || "").toLowerCase();
  if (s.startsWith("en")) return "en";
  if (s.startsWith("de")) return "de";
  return "de";
}

function getAppointmentUrl(locale: string) {
  const loc = normalizeLocaleForUrl(locale);
  const explicit = String(process.env.AI_SUPPORT_OFFER_URL || "").trim();
  if (explicit) {
    if (explicit.includes("{locale}")) return explicit.replaceAll("{locale}", loc);
    return explicit;
  }
  const frontend = String(process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "");
  if (!frontend) return "";
  return `${frontend}/${loc}/appointment`;
}

function isPriceIntent(text: string) {
  const s = text.toLowerCase();
  return /\b(fiyat|ucret|ücret|ne kadar|price|cost|pricing)\b/.test(s);
}

function isAffirmative(text: string) {
  const s = text.toLowerCase().trim();
  return /^(evet|olur|tamam|yes|ok|sure|tabii|tabi)\b/.test(s);
}

function askedAppointmentRedirect(text: string) {
  const s = text.toLowerCase();
  return /randevu sayfasına yönlendirebilirim|randevu sayfasina yonlendirebilirim|booking page|appointment page|terminbuchung/.test(s);
}

function buildPricePolicyPrompt(locale: string) {
  return t(locale, "chat.price_policy");
}

function buildAppointmentLinkReply(locale: string, appointmentUrl: string) {
  if (appointmentUrl) {
    return t(locale, "chat.appointment_with_url", { url: appointmentUrl });
  }
  return t(locale, "chat.appointment_without_url");
}

function getSupportSystemPrompt(knowledgeText: string, sourcesCount: number) {
  const fromEnv = (process.env.AI_SUPPORT_SYSTEM_PROMPT || "").trim();
  const base = fromEnv || [
    "You are an AI customer support assistant for König Energetik, a massage and wellness studio.",
    "Always provide short, practical, safe support answers in the same language as the user.",
    "If uncertainty is high, ask a clarifying question.",
    "If the issue is operationally risky or urgent, suggest escalating to a human admin."
  ].join(" ");

  const groundingRules = [
    "Use ONLY the factual data provided in [KNOWLEDGE_CONTEXT] for product/service/policy claims.",
    "If [KNOWLEDGE_CONTEXT] is empty or insufficient, explicitly say the data is not available and ask a follow-up question.",
    "Do NOT invent model names, prices, technical specs, warranty, policy text, or legal details.",
    "Never share numeric product/service prices in chat.",
    "For any pricing question, say pricing cannot be shared in this channel and suggest visiting the website.",
    "Do not expose internal price status tokens (for example: quote_required, not_public, null, or system flags).",
    "When the customer wants to book, ask consent then redirect to the appointment/booking page. Never mention 'offer' or 'teklif' — this is a massage studio, not a shop.",
    "Answer in the same language the user writes in (German, Turkish, or English).",
  ].join(" ");

  return [
    base,
    groundingRules,
    `[KNOWLEDGE_SOURCE_COUNT]=${sourcesCount}`,
    "[KNOWLEDGE_CONTEXT]",
    knowledgeText || "(empty)",
    "[/KNOWLEDGE_CONTEXT]",
  ].join("\n");
}

export function chatService(app: FastifyInstance) {
  const cacheKey = "__chatServiceSingleton";
  const existing = (app as any)[cacheKey];
  if (existing) return existing;

  const repo = chatRepo(drizzleDb as any);

  // In-memory WS registry (MVP). Later: Redis pub/sub.
  const connsByThread = new Map<string, Set<WsConn>>();
  const aiQueueByThread = new Map<string, { running: boolean; dirty: boolean }>();

  function addConn(c: WsConn) {
    const set = connsByThread.get(c.thread_id) ?? new Set<WsConn>();
    set.add(c);
    connsByThread.set(c.thread_id, set);
  }

  function removeConn(c: WsConn) {
    const set = connsByThread.get(c.thread_id);
    if (!set) return;
    set.delete(c);
    if (set.size === 0) connsByThread.delete(c.thread_id);
  }

  function broadcastThreadEvent(thread_id: string, payload: Record<string, unknown>) {
    const set = connsByThread.get(thread_id);
    if (!set?.size) return;

    const raw = JSON.stringify(payload);
    for (const c of set) {
      if (c.ws.readyState === (c.ws as any).OPEN) c.ws.send(raw);
    }
  }

  function broadcastMessage(msg: {
    id: string;
    thread_id: string;
    sender_user_id: string;
    text: string;
    client_id: string | null;
    created_at: Date;
  }) {
    broadcastThreadEvent(msg.thread_id, {
      type: "message",
      message: {
        id: msg.id,
        thread_id: msg.thread_id,
        sender_user_id: msg.sender_user_id,
        text: msg.text,
        client_id: msg.client_id,
        created_at: msg.created_at.toISOString(),
      },
    });
  }

  async function assertMember(thread_id: string, user_id: string) {
    const ok = await repo.isParticipant(thread_id, user_id);
    if (ok) return;

    // Auto-recover: thread creator gets re-added as participant
    const thread = await repo.getThreadById(thread_id);
    if (thread && thread.created_by_user_id === user_id) {
      await repo.upsertParticipant({
        id: randomUUID(),
        thread_id,
        user_id,
        role: "buyer",
        joined_at: new Date(),
        last_read_at: null,
      });
      return;
    }

    const err: any = new Error("forbidden_thread_membership");
    err.statusCode = 403;
    throw err;
  }

  async function getRequiredThread(thread_id: string) {
    const thread = await repo.getThreadById(thread_id);
    if (!thread) {
      const err: any = new Error("thread_not_found");
      err.statusCode = 404;
      throw err;
    }
    return thread;
  }

  async function insertMessage(args: {
    thread_id: string;
    sender_user_id: string;
    text: string;
    client_id?: string | null;
    created_at?: Date;
  }) {
    const now = args.created_at ?? new Date();
    const msg = {
      id: randomUUID(),
      thread_id: args.thread_id,
      sender_user_id: args.sender_user_id,
      client_id: args.client_id ?? null,
      text: args.text,
      created_at: now,
    };

    await repo.insertMessage(msg);
    await repo.touchThreadUpdatedAt(args.thread_id, now);
    broadcastMessage(msg);

    return msg;
  }

  async function postMessageInternal(
    user: AuthedUser,
    thread_id: string,
    body: { text: string; client_id?: string },
  ) {
    await assertMember(thread_id, user.id);

    const inserted = await insertMessage({
      thread_id,
      sender_user_id: user.id,
      text: body.text,
      client_id: body.client_id ?? null,
    });

    return inserted;
  }

  async function generateAiReplyForThread(thread_id: string) {
    const aiEnabled = isEnabled(process.env.AI_SUPPORT_ENABLED, true);
    if (!aiEnabled) return;

    const thread = await repo.getThreadById(thread_id);
    if (!thread) return;

    const handoff = (thread.handoff_mode as "ai" | "admin" | null) ?? "ai";
    if (handoff === "admin") return;

    const participants = await repo.listParticipants(thread_id);
    const participantsByUser = new Map(participants.map((p) => [p.user_id, p.role]));
    const history = await repo.listRecentMessagesForAi(thread_id, 20);

    const aiMessages = history
      .map((m) => {
        if (m.sender_user_id === AI_ASSISTANT_USER_ID) {
          return { role: "assistant" as const, content: m.text };
        }
        const senderRole = participantsByUser.get(m.sender_user_id);
        const role = senderRole === "admin" ? ("assistant" as const) : ("user" as const);
        return { role, content: m.text };
      })
      .filter((m) => m.content.trim().length > 0);

    if (!aiMessages.length) return;

    const preferred =
      ((thread.ai_provider_preference as any) === "openai" ||
      (thread.ai_provider_preference as any) === "anthropic" ||
      (thread.ai_provider_preference as any) === "grok"
        ? (thread.ai_provider_preference as "openai" | "anthropic" | "grok")
        : "auto") as "auto" | "openai" | "anthropic" | "grok";

    const lastUserPrompt =
      [...history]
        .reverse()
        .find((m) => m.sender_user_id !== AI_ASSISTANT_USER_ID)?.text ?? "";

    const preferredLocale = String(thread.preferred_locale || "de").toLowerCase();
    const appointmentUrl = getAppointmentUrl(preferredLocale);
    const lastAssistantText =
      [...history]
        .reverse()
        .find((m) => m.sender_user_id === AI_ASSISTANT_USER_ID)?.text ?? "";

    if (isPriceIntent(lastUserPrompt)) {
      await insertMessage({
        thread_id,
        sender_user_id: AI_ASSISTANT_USER_ID,
        text: buildPricePolicyPrompt(preferredLocale),
        client_id: null,
      });
      return;
    }

    if (isAffirmative(lastUserPrompt) && askedAppointmentRedirect(lastAssistantText)) {
      await insertMessage({
        thread_id,
        sender_user_id: AI_ASSISTANT_USER_ID,
        text: buildAppointmentLinkReply(preferredLocale, appointmentUrl),
        client_id: null,
      });
      return;
    }

    const knowledge = await buildKnowledgeContext(lastUserPrompt, preferredLocale);
    const aiResult = await generateAiSupportReply({
      preferredProvider: preferred,
      systemPrompt: getSupportSystemPrompt(knowledge.text, knowledge.sourcesCount),
      messages: aiMessages,
    });

    if (!aiResult?.text) return;

    await insertMessage({
      thread_id,
      sender_user_id: AI_ASSISTANT_USER_ID,
      text: aiResult.text,
      client_id: null,
    });

    broadcastThreadEvent(thread_id, {
      type: "ai_meta",
      provider: aiResult.provider,
      model: aiResult.model,
      thread_id,
    });
  }

  function enqueueAiReply(thread_id: string) {
    const state = aiQueueByThread.get(thread_id) ?? { running: false, dirty: false };
    state.dirty = true;
    aiQueueByThread.set(thread_id, state);

    if (state.running) return;

    void (async () => {
      const local = aiQueueByThread.get(thread_id);
      if (!local) return;
      local.running = true;

      while (local.dirty) {
        local.dirty = false;
        try {
          await generateAiReplyForThread(thread_id);
        } catch (err) {
          app.log?.error?.({ err, thread_id }, "chat_ai_reply_failed");
        }
      }

      local.running = false;
      if (!local.dirty) aiQueueByThread.delete(thread_id);
    })();
  }

  async function assertAdmin(user: AuthedUser) {
    if (user.role === "admin") return;
    const err: any = new Error("forbidden_admin_only");
    err.statusCode = 403;
    throw err;
  }

  const service = {
    repo,

    async getOrCreateThread(args: {
      context_type: "job" | "request";
      context_id: string;
      preferred_locale?: string;
      created_by: AuthedUser;
    }) {
      const existing = await repo.getThreadByContext({
        context_type: args.context_type,
        context_id: args.context_id,
      });

      if (existing) {
        if (!existing.preferred_locale && args.preferred_locale) {
          await repo.updateThreadRouting(existing.id, {
            preferred_locale: args.preferred_locale,
            updated_at: new Date(),
          });
        }
        await repo.upsertParticipant({
          id: randomUUID(),
          thread_id: existing.id,
          user_id: args.created_by.id,
          role: roleToChatRole(args.created_by.role),
          joined_at: new Date(),
          last_read_at: null,
        });
        return existing;
      }

      const now = new Date();
      const thread = {
        id: randomUUID(),
        context_type: args.context_type,
        context_id: args.context_id,
        handoff_mode: "ai",
        ai_provider_preference: "auto",
        preferred_locale: args.preferred_locale || "de",
        assigned_admin_user_id: null,
        created_by_user_id: args.created_by.id,
        created_at: now,
        updated_at: now,
      };

      await repo.insertThread(thread);

      await repo.upsertParticipant({
        id: randomUUID(),
        thread_id: thread.id,
        user_id: args.created_by.id,
        role: roleToChatRole(args.created_by.role),
        joined_at: now,
        last_read_at: null,
      });

      return thread;
    },

    async listThreadsForUser(
      user: AuthedUser,
      q: { limit: number; offset: number; context_type?: string; context_id?: string },
    ) {
      return repo.listThreadsForUser({
        user_id: user.id,
        limit: q.limit,
        offset: q.offset,
        context_type: q.context_type,
        context_id: q.context_id,
      });
    },

    async listThreadsForAdmin(q: {
      limit: number;
      offset: number;
      context_type?: string;
      context_id?: string;
      handoff_mode?: "ai" | "admin";
    }) {
      return repo.listThreadsAdmin(q);
    },

    async listMessages(
      user: AuthedUser,
      thread_id: string,
      q: { limit: number; before?: Date },
    ) {
      await assertMember(thread_id, user.id);
      return repo.listMessages({ thread_id, limit: q.limit, before: q.before });
    },

    async postMessage(
      user: AuthedUser,
      thread_id: string,
      body: { text: string; client_id?: string },
    ) {
      const inserted = await postMessageInternal(user, thread_id, body);
      if (user.role !== "admin") enqueueAiReply(thread_id);
      return inserted;
    },

    async requestAdminHandoff(user: AuthedUser, thread_id: string, note?: string) {
      await assertMember(thread_id, user.id);
      await getRequiredThread(thread_id);

      await repo.updateThreadRouting(thread_id, {
        handoff_mode: "admin",
        assigned_admin_user_id: null,
        updated_at: new Date(),
      });

      if (note?.trim()) {
        await insertMessage({
          thread_id,
          sender_user_id: user.id,
          text: `[ADMIN_REQUEST_NOTE] ${note.trim()}`,
          client_id: null,
        });
      }

      const thread = await repo.getThreadById(thread_id);
      broadcastThreadEvent(thread_id, {
        type: "handoff_requested",
        thread_id,
        requested_by_user_id: user.id,
      });
      return thread;
    },

    async adminPostMessage(
      user: AuthedUser,
      thread_id: string,
      body: { text: string; client_id?: string },
    ) {
      await assertAdmin(user);
      await getRequiredThread(thread_id);

      // Ensure admin is a participant
      const isMember = await repo.isParticipant(thread_id, user.id);
      if (!isMember) {
        await repo.upsertParticipant({
          id: randomUUID(),
          thread_id,
          user_id: user.id,
          role: "admin",
          joined_at: new Date(),
          last_read_at: null,
        });
      }

      return insertMessage({
        thread_id,
        sender_user_id: user.id,
        text: body.text,
        client_id: body.client_id ?? null,
      });
    },

    async adminTakeOverThread(user: AuthedUser, thread_id: string, admin_user_id?: string) {
      await assertAdmin(user);
      await getRequiredThread(thread_id);

      const ownerAdminId = admin_user_id ?? user.id;
      await repo.upsertParticipant({
        id: randomUUID(),
        thread_id,
        user_id: ownerAdminId,
        role: "admin",
        joined_at: new Date(),
        last_read_at: null,
      });

      await repo.updateThreadRouting(thread_id, {
        handoff_mode: "admin",
        assigned_admin_user_id: ownerAdminId,
        updated_at: new Date(),
      });

      const thread = await repo.getThreadById(thread_id);
      return thread;
    },

    async adminReleaseThreadToAi(
      user: AuthedUser,
      thread_id: string,
      provider?: "auto" | "openai" | "anthropic" | "grok",
    ) {
      await assertAdmin(user);
      await getRequiredThread(thread_id);

      await repo.updateThreadRouting(thread_id, {
        handoff_mode: "ai",
        assigned_admin_user_id: null,
        ai_provider_preference: provider,
        updated_at: new Date(),
      });

      enqueueAiReply(thread_id);
      return repo.getThreadById(thread_id);
    },

    async adminSetAiProvider(
      user: AuthedUser,
      thread_id: string,
      provider: "auto" | "openai" | "anthropic" | "grok",
    ) {
      await assertAdmin(user);
      await getRequiredThread(thread_id);

      await repo.updateThreadRouting(thread_id, {
        ai_provider_preference: provider,
        updated_at: new Date(),
      });

      return repo.getThreadById(thread_id);
    },

    async listAiKnowledgeForAdmin(
      user: AuthedUser,
      q: { locale?: string; is_active?: 0 | 1; q?: string; limit: number; offset: number },
    ) {
      await assertAdmin(user);
      return repo.listAiKnowledge(q);
    },

    async getAiKnowledgeByIdForAdmin(user: AuthedUser, id: string) {
      await assertAdmin(user);
      return repo.getAiKnowledgeById(id);
    },

    async createAiKnowledgeForAdmin(
      user: AuthedUser,
      body: {
        locale: string;
        title: string;
        content: string;
        tags?: string | null;
        priority: number;
        is_active: 0 | 1;
      },
    ) {
      await assertAdmin(user);
      const now = new Date();
      const row = {
        id: randomUUID(),
        locale: body.locale.toLowerCase(),
        title: body.title.trim(),
        content: body.content.trim(),
        tags: body.tags?.trim() || null,
        priority: body.priority,
        is_active: body.is_active,
        created_at: now,
        updated_at: now,
      };
      await repo.createAiKnowledge(row);
      return repo.getAiKnowledgeById(row.id);
    },

    async updateAiKnowledgeForAdmin(
      user: AuthedUser,
      id: string,
      body: {
        locale?: string;
        title?: string;
        content?: string;
        tags?: string | null;
        priority?: number;
        is_active?: 0 | 1;
      },
    ) {
      await assertAdmin(user);
      await repo.updateAiKnowledge(id, {
        locale: body.locale?.toLowerCase(),
        title: body.title?.trim(),
        content: body.content?.trim(),
        tags: typeof body.tags === "undefined" ? undefined : (body.tags?.trim() || null),
        priority: body.priority,
        is_active: body.is_active,
        updated_at: new Date(),
      });
      return repo.getAiKnowledgeById(id);
    },

    async deleteAiKnowledgeForAdmin(user: AuthedUser, id: string) {
      await assertAdmin(user);
      return repo.deleteAiKnowledge(id);
    },

    async handleWsConnection(ws: WebSocket, user: AuthedUser, thread_id: string) {
      await assertMember(thread_id, user.id);

      const conn: WsConn = {
        ws,
        user,
        thread_id,
        tokens: TOKEN_BUCKET_CAP,
        lastRefillMs: Date.now(),
      };

      addConn(conn);

      ws.on("close", () => removeConn(conn));
      ws.on("error", () => removeConn(conn));

      ws.send(JSON.stringify({ type: "hello", thread_id }));

      ws.on("message", async (buf) => {
        const nowMs = Date.now();
        refill(conn, nowMs);

        if (conn.tokens < 1) {
          ws.send(JSON.stringify({ type: "error", code: "rate_limited" }));
          return;
        }
        conn.tokens -= 1;

        let raw: any;
        try {
          raw = JSON.parse(buf.toString());
        } catch {
          ws.send(JSON.stringify({ type: "error", code: "invalid_json" }));
          return;
        }

        if (
          raw?.type !== "message" ||
          typeof raw?.text !== "string" ||
          typeof raw?.client_id !== "string"
        ) {
          ws.send(JSON.stringify({ type: "error", code: "invalid_message_shape" }));
          return;
        }

        const text = String(raw.text).trim();
        if (!text || text.length > 2000) {
          ws.send(JSON.stringify({ type: "error", code: "invalid_text" }));
          return;
        }

        try {
          const inserted = await service.postMessage(user, thread_id, {
            text,
            client_id: raw.client_id,
          });

          ws.send(
            JSON.stringify({
              type: "ack",
              client_id: raw.client_id,
              message_id: inserted.id,
              created_at: inserted.created_at.toISOString(),
            }),
          );
        } catch (e: any) {
          ws.send(JSON.stringify({ type: "error", code: e?.message ?? "server_error" }));
        }
      });
    },
  };

  (app as any)[cacheKey] = service;
  return service;
}
