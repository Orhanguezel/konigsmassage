// =============================================================
// FILE: src/modules/audit/service.ts
// konigsmassage – Audit Service
//   - shouldSkipAuditLog()
//   - writeRequestAuditLog()
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/db/client';
import { auditRequestLogs } from './schema';
import { emitAppEvent } from '@/common/events/bus';

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

function normalizeGeo(req: FastifyRequest): { country: string | null; city: string | null } {
  const country = firstHeader(req, 'cf-ipcountry') || null;
  const city = firstHeader(req, 'x-geo-city') || null;
  return { country, city };
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
  const geo = normalizeGeo(req);

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
