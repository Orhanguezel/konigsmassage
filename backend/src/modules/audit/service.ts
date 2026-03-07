// =============================================================
// FILE: src/modules/audit/service.ts
// konigsmassage – Audit Service
//   - shouldSkipAuditLog()
//   - writeRequestAuditLog()
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/db/client';
import { auditAuthEvents, auditRequestLogs } from './schema';
import { emitAppEvent } from '@/common/events/bus';
import geoip from 'geoip-lite';
import type { AuditAuthEvent } from './validation';

const BODY_SNAPSHOT_MAX_CHARS = 4000;
const REDACT_KEYS = new Set([
  'password',
  'password_confirmation',
  'current_password',
  'new_password',
  'confirm_password',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'authorization',
  'cookie',
  'secret',
  'client_secret',
  'api_secret',
  'smtp_password',
  'paypal_client_secret',
  'telegram_bot_token',
  'reset_token',
]);

/* -------------------- helper: headers -------------------- */
function firstHeader(req: FastifyRequest, name: string): string {
  const v = (req.headers as any)?.[name.toLowerCase()];
  if (Array.isArray(v)) return String(v[0] ?? '').trim();
  return String(v ?? '').trim();
}

function parseFirstIpFromXff(xff: string): string {
  return (
    xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)[0] || ''
  );
}

/* -------------------- shouldSkip -------------------- */
export function shouldSkipAuditLog(req: FastifyRequest): boolean {
  const method = String(req.method || '').toUpperCase();
  if (method === 'OPTIONS') return true;

  const rawUrl = String((req.raw as any)?.url ?? (req as any).url ?? '');
  const path = (rawUrl.split('?')[0] || '/').trim();

  // gürültü azaltma
  if (path === '/api/health' || path === '/health') return true;
  if (path.startsWith('/uploads/')) return true;

  // istersen audit stream’i loglama (loop önler)
  if (path.startsWith('/api/admin/audit/stream')) return true;

  return false;
}

/* -------------------- normalize -------------------- */
function normalizeClientIp(req: FastifyRequest): string {
  const cf = firstHeader(req, 'cf-connecting-ip');
  if (cf) return cf;

  const xReal = firstHeader(req, 'x-real-ip');
  if (xReal) return xReal;

  const xff = firstHeader(req, 'x-forwarded-for');
  if (xff) {
    const ip = parseFirstIpFromXff(xff);
    if (ip) return ip;
  }

  return String((req.ip as any) || (req.socket as any)?.remoteAddress || '').trim();
}

function normalizeUrlAndPath(req: FastifyRequest): { url: string; path: string } {
  const rawUrl = String((req.raw as any)?.url ?? (req as any).url ?? '').trim() || '/';
  const path = rawUrl.split('?')[0] || '/';
  return { url: rawUrl, path };
}

function normalizeUserContext(req: FastifyRequest): { userId: string | null; isAdmin: number } {
  const u: any =
    (req as any).user ??
    (req as any).auth?.user ??
    (req as any).requestContext?.get?.('user') ??
    null;

  const userId = u?.id ? String(u.id) : null;

  let isAdmin = 0;
  if (u) {
    if (u.is_admin === true || u.is_admin === 1 || u.is_admin === '1') isAdmin = 1;
    const role = String(u.role ?? '');
    if (role === 'admin') isAdmin = 1;
    const roles = Array.isArray(u.roles) ? u.roles.map(String) : [];
    if (roles.includes('admin')) isAdmin = 1;
  }

  return { userId, isAdmin };
}

function normalizeUserAgent(req: FastifyRequest): string | null {
  const ua = firstHeader(req, 'user-agent');
  return ua ? ua : null;
}

function normalizeReferer(req: FastifyRequest): string | null {
  const ref = firstHeader(req, 'referer');
  return ref ? ref : null;
}

function normalizeGeo(req: FastifyRequest, ip: string): { country: string | null; city: string | null } {
  // 1. CDN header'larından oku (Cloudflare vb.)
  const cfCountry = firstHeader(req, 'cf-ipcountry') || null;
  const cfCity = firstHeader(req, 'x-geo-city') || null;
  if (cfCountry) return { country: cfCountry, city: cfCity };

  // 2. Header yoksa geoip-lite ile IP lookup yap
  const isLocal =
    !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');

  if (!isLocal) {
    const geo = geoip.lookup(ip);
    if (geo) {
      return { country: geo.country || null, city: geo.city || null };
    }
  }

  // 3. Yerel/özel IP ise "LOCAL" işaretle
  if (isLocal) return { country: 'LOCAL', city: null };

  return { country: null, city: null };
}

function isMultipartLike(req: FastifyRequest): boolean {
  const ct = firstHeader(req, 'content-type').toLowerCase();
  return ct.includes('multipart/form-data') || ct.includes('application/octet-stream');
}

function redactValue(input: unknown, depth = 0): unknown {
  if (depth > 5) return '[depth_limit]';
  if (input == null) return input;

  if (Array.isArray(input)) {
    return input.slice(0, 20).map((v) => redactValue(v, depth + 1));
  }

  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>).slice(0, 50)) {
      const key = String(k).toLowerCase();
      out[k] = REDACT_KEYS.has(key) || key.includes('password') || key.includes('token') || key.includes('secret')
        ? '[redacted]'
        : redactValue(v, depth + 1);
    }
    return out;
  }

  if (typeof input === 'string') {
    return input.length > 500 ? `${input.slice(0, 500)}…` : input;
  }

  return input;
}

function normalizeBodySnapshot(req: FastifyRequest): string | null {
  const method = String(req.method || '').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;
  if (isMultipartLike(req)) return '[multipart omitted]';

  const body = (req as any).body;
  if (typeof body === 'undefined') return null;
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return null;
    return trimmed.length > BODY_SNAPSHOT_MAX_CHARS
      ? `${trimmed.slice(0, BODY_SNAPSHOT_MAX_CHARS)}…`
      : trimmed;
  }

  try {
    const redacted = redactValue(body);
    const json = JSON.stringify(redacted, null, 2);
    return json.length > BODY_SNAPSHOT_MAX_CHARS
      ? `${json.slice(0, BODY_SNAPSHOT_MAX_CHARS)}…`
      : json;
  } catch {
    return '[unserializable body]';
  }
}

/* -------------------- writer -------------------- */
export async function writeRequestAuditLog(args: {
  req: FastifyRequest;
  reply: FastifyReply;
  reqId: string;
  responseTimeMs: number;
}) {
  const { req, reply } = args;

  const { url, path } = normalizeUrlAndPath(req);
  const ip = normalizeClientIp(req);
  const { userId, isAdmin } = normalizeUserContext(req);

  const statusCode =
    typeof (reply as any).statusCode === 'number'
      ? (reply as any).statusCode
      : Number((reply as any).raw?.statusCode ?? 0);

  const ua = normalizeUserAgent(req);
  const referer = normalizeReferer(req);
  const bodySnapshot = normalizeBodySnapshot(req);
  const geo = normalizeGeo(req, ip);

  await db.insert(auditRequestLogs).values({
    req_id: String(args.reqId || ''),
    method: String(req.method || '').toUpperCase(),
    url,
    path,
    status_code: Number(statusCode || 0),
    response_time_ms: Math.max(0, Math.round(Number(args.responseTimeMs || 0))),
    ip,
    user_agent: ua,
    referer,
    body_snapshot: bodySnapshot,
    user_id: userId,
    is_admin: isAdmin,
    country: geo.country,
    city: geo.city,
    created_at: new Date() as any,
  } as any);

  // ✅ realtime (SSE) için event yayınla
  emitAppEvent({
    level: Number(statusCode) >= 500 ? 'error' : Number(statusCode) >= 400 ? 'warn' : 'info',
    topic: 'audit.request.logged',
    message: 'request_logged',
    meta: {
      method: String(req.method || '').toUpperCase(),
      path,
      status_code: Number(statusCode || 0),
      ip,
      response_time_ms: Math.max(0, Math.round(Number(args.responseTimeMs || 0))),
      user_id: userId,
      is_admin: isAdmin,
    },
    entity: null,
  });
}

export async function writeAuthAuditEvent(args: {
  req: FastifyRequest;
  event: AuditAuthEvent;
  userId?: string | null;
  email?: string | null;
}) {
  const { req, event } = args;
  const ip = normalizeClientIp(req);
  const ua = normalizeUserAgent(req);
  const geo = normalizeGeo(req, ip);

  await db.insert(auditAuthEvents).values({
    event,
    user_id: args.userId ? String(args.userId) : null,
    email: args.email ? String(args.email) : null,
    ip,
    user_agent: ua,
    country: geo.country,
    city: geo.city,
    created_at: new Date() as any,
  } as any);

  emitAppEvent({
    level: event === 'login_failed' ? 'warn' : 'info',
    topic: `auth.${event}`,
    message: event,
    actor_user_id: args.userId ? String(args.userId) : null,
    ip,
    meta: {
      event,
      email: args.email ? String(args.email) : null,
      country: geo.country,
      city: geo.city,
    },
    entity: null,
  });
}
