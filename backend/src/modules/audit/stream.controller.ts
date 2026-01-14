// =============================================================
// FILE: src/modules/audit/stream.controller.ts
// konigsmassage – Audit Realtime Stream Controller (SSE)
//   - handleAuditStreamSse()
//   - bus subscribe + persist + broadcast
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/db/client';
import { auditEvents } from './audit_events.schema';
import { bus, type AppEvent } from '@/common/events/bus';

type SseClient = { id: string; reply: FastifyReply };

const clients = new Set<SseClient>();
let subscribed = false;

function sseWrite(reply: FastifyReply, event: string, data: unknown) {
  reply.raw.write(`event: ${event}\n`);
  reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcast(event: string, data: unknown) {
  for (const c of clients) {
    try {
      sseWrite(c.reply, event, data);
    } catch {
      // ignore; disconnect cleanup handles removal
    }
  }
}

function safeJsonStringify(v: unknown) {
  try {
    return JSON.stringify(v ?? null);
  } catch {
    return JSON.stringify({ _error: 'meta_not_serializable' });
  }
}

async function persistAuditEvent(evt: AppEvent) {
  await db.insert(auditEvents).values({
    ts: new Date(evt.ts) as any,
    level: String(evt.level || 'info'),
    topic: String(evt.topic || 'app.event'),
    message: evt.message ?? null,

    actor_user_id: (evt as any).actor_user_id ?? null,
    ip: (evt as any).ip ?? null,

    entity_type: evt.entity?.type ?? null,
    entity_id: (evt.entity?.id ?? null) as any,

    meta_json: evt.meta ? safeJsonStringify(evt.meta) : null,
  } as any);
}

function ensureBusSubscribed() {
  if (subscribed) return;
  subscribed = true;

  bus.on('app.event', async (evt) => {
    // 1) persist (best-effort)
    try {
      await persistAuditEvent(evt);
    } catch (err) {
      broadcast('app.event', {
        id: `${Date.now()}`,
        ts: new Date().toISOString(),
        level: 'warn',
        topic: 'audit.stream.persist_failed',
        message: 'audit_event_persist_failed',
        meta: { err: String((err as any)?.message ?? err) },
      } satisfies Partial<AppEvent>);
    }

    // 2) stream
    broadcast('app.event', evt);
  });
}

/**
 * GET /api/admin/audit/stream  (SSE)
 * NOTE: Route tarafında preHandler (auth+admin) zorunlu.
 */
export async function handleAuditStreamSse(req: FastifyRequest, reply: FastifyReply) {
  ensureBusSubscribed();

  // SSE headers
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const client: SseClient = { id: String((req as any).id ?? Date.now()), reply };
  clients.add(client);

  // hello
  sseWrite(reply, 'hello', {
    ts: new Date().toISOString(),
    ok: true,
    clients: clients.size,
  });

  // keep-alive ping
  const t = setInterval(() => {
    try {
      sseWrite(reply, 'ping', { ts: new Date().toISOString() });
    } catch {
      // ignore
    }
  }, 15_000);

  const cleanup = () => {
    clearInterval(t);
    clients.delete(client);
  };

  req.raw.on('close', cleanup);
  req.raw.on('end', cleanup);

  return reply; // keep open
}
