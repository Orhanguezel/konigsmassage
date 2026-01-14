// =============================================================
// FILE: src/modules/audit/stream.routes.ts
// konigsmassage – Audit Stream Routes (SSE)
//   - Mounted under /api/admin
//   - Final URL:
//       GET /api/admin/audit/stream
// =============================================================

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { db } from '@/db/client';
import { auditEvents } from './audit_events.schema';
import { bus, type AppEvent } from '@/common/events/bus';

import { requireAuth as requireAuthMw } from '@/common/middleware/auth';
import { requireAdmin as requireAdminMw } from '@/common/middleware/roles';

const BASE = '/audit';

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
      // ignore
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

    actor_user_id: evt.actor_user_id ?? null,
    ip: evt.ip ?? null,

    entity_type: evt.entity?.type ?? null,
    entity_id: (evt.entity?.id ?? null) as any,

    meta_json: evt.meta ? safeJsonStringify(evt.meta) : null,
  } as any);
}

function ensureBusSubscribed() {
  if (subscribed) return;
  subscribed = true;

  bus.on('app.event', async (evt) => {
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

    broadcast('app.event', evt);
  });
}

export async function registerAuditStream(app: FastifyInstance) {
  const requireAuth = (app as any).requireAuth as
    | ((req: FastifyRequest, reply: FastifyReply) => Promise<void>)
    | undefined;

  const requireAdmin = (app as any).requireAdmin as
    | ((req: FastifyRequest, reply: FastifyReply) => Promise<void>)
    | undefined;

  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    if (typeof requireAuth === 'function') {
      await requireAuth(req, reply);
      if (reply.sent) return;
    } else {
      await requireAuthMw(req, reply);
      if (reply.sent) return;
    }

    if (typeof requireAdmin === 'function') {
      await requireAdmin(req, reply);
    } else {
      await requireAdminMw(req, reply);
    }
  };

  const ph = { preHandler: adminGuard, config: { auth: true, admin: true } };

  app.get(`${BASE}/stream`, ph, async (req, reply) => {
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

    sseWrite(reply, 'hello', {
      ts: new Date().toISOString(),
      ok: true,
      clients: clients.size,
    });

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
  });
}
