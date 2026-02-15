// =============================================================
// FILE: src/modules/chat/admin.controller.ts
// =============================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  AiKnowledgeIdParamsSchema,
  CreateAiKnowledgeBodySchema,
  AdminReleaseToAiBodySchema,
  AdminSetAiProviderBodySchema,
  AdminTakeoverBodySchema,
  ListAiKnowledgeQuerySchema,
  ListMessagesQuerySchema,
  ListThreadsQuerySchema,
  PostMessageBodySchema,
  ThreadIdParamsSchema,
  UpdateAiKnowledgeBodySchema,
} from "./validation";
import { chatService } from "./service";

function setListHeaders(reply: FastifyReply, total: number, offset: number, limit: number) {
  reply.header("x-total-count", String(total));
  reply.header("content-range", `items ${offset}-${Math.max(offset, offset + limit - 1)}/${total}`);
}

function getAdmin(req: any) {
  const userId = req.user?.id ?? req.user?.sub;
  if (!userId) {
    const err: any = new Error("unauthorized");
    err.statusCode = 401;
    throw err;
  }
  const roleRaw = String(req.user.role ?? "").toLowerCase();
  const role = roleRaw === "admin" || roleRaw === "vendor" ? roleRaw : "buyer";
  return { id: String(userId), role } as { id: string; role: "admin" | "buyer" | "vendor" };
}

export function chatAdminController(app: any) {
  const svc = chatService(app);

  return {
    // GET /admin/chat/threads
    async adminListThreads(req: FastifyRequest, reply: FastifyReply) {
      const q = ListThreadsQuerySchema.parse((req as any).query ?? {});
      const { rows, total } = await svc.listThreadsForAdmin({
        limit: q.limit,
        offset: q.offset,
        context_type: q.context_type,
        context_id: q.context_id,
        handoff_mode: q.handoff_mode,
      });

      setListHeaders(reply, total, q.offset, q.limit);
      return { items: rows };
    },

    // GET /admin/chat/threads/:id/messages
    async adminListMessages(req: FastifyRequest, reply: FastifyReply) {
      const params = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const q = ListMessagesQuerySchema.parse((req as any).query ?? {});
      const before = q.before ? new Date(q.before) : undefined;

      // Admin bypass membership (policy): admin sees all
      const { rows, total } = await svc.repo.listMessages({
        thread_id: params.id,
        limit: q.limit,
        before,
      });

      setListHeaders(reply, total, 0, q.limit);
      return { items: [...rows].reverse() };
    },

    // POST /admin/chat/threads/:id/messages
    async adminPostMessage(req: FastifyRequest, _reply: FastifyReply) {
      const admin = getAdmin(req);
      const params = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = PostMessageBodySchema.parse((req as any).body ?? {});
      const msg = await svc.adminPostMessage(admin, params.id, body);
      return { message: msg };
    },

    // POST /admin/chat/threads/:id/takeover
    async adminTakeOverThread(req: FastifyRequest, _reply: FastifyReply) {
      const admin = getAdmin(req);
      const params = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = AdminTakeoverBodySchema.parse((req as any).body ?? {});

      const thread = await svc.adminTakeOverThread(admin, params.id, body.admin_user_id);
      return { thread };
    },

    // POST /admin/chat/threads/:id/release-to-ai
    async adminReleaseToAi(req: FastifyRequest, _reply: FastifyReply) {
      const admin = getAdmin(req);
      const params = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = AdminReleaseToAiBodySchema.parse((req as any).body ?? {});

      const thread = await svc.adminReleaseThreadToAi(admin, params.id, body.provider);
      return { thread };
    },

    // PATCH /admin/chat/threads/:id/ai-provider
    async adminSetAiProvider(req: FastifyRequest, _reply: FastifyReply) {
      const admin = getAdmin(req);
      const params = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = AdminSetAiProviderBodySchema.parse((req as any).body ?? {});

      const thread = await svc.adminSetAiProvider(admin, params.id, body.provider);
      return { thread };
    },

    // GET /admin/chat/knowledge
    async adminListAiKnowledge(req: FastifyRequest, reply: FastifyReply) {
      const admin = getAdmin(req);
      const q = ListAiKnowledgeQuerySchema.parse((req as any).query ?? {});
      const { rows, total } = await svc.listAiKnowledgeForAdmin(admin, {
        locale: q.locale,
        is_active: q.is_active as 0 | 1 | undefined,
        q: q.q,
        limit: q.limit,
        offset: q.offset,
      });
      setListHeaders(reply, total, q.offset, q.limit);
      return { items: rows };
    },

    // GET /admin/chat/knowledge/:id
    async adminGetAiKnowledge(req: FastifyRequest, reply: FastifyReply) {
      const admin = getAdmin(req);
      const params = AiKnowledgeIdParamsSchema.parse((req as any).params ?? {});
      const row = await svc.getAiKnowledgeByIdForAdmin(admin, params.id);
      if (!row) return reply.code(404).send({ error: { message: "not_found" } });
      return row;
    },

    // POST /admin/chat/knowledge
    async adminCreateAiKnowledge(req: FastifyRequest, reply: FastifyReply) {
      const admin = getAdmin(req);
      const body = CreateAiKnowledgeBodySchema.parse((req as any).body ?? {});
      const row = await svc.createAiKnowledgeForAdmin(admin, {
        locale: body.locale,
        title: body.title,
        content: body.content,
        tags: body.tags,
        priority: body.priority,
        is_active: body.is_active as 0 | 1,
      });
      return reply.code(201).send(row);
    },

    // PATCH /admin/chat/knowledge/:id
    async adminUpdateAiKnowledge(req: FastifyRequest, reply: FastifyReply) {
      const admin = getAdmin(req);
      const params = AiKnowledgeIdParamsSchema.parse((req as any).params ?? {});
      const body = UpdateAiKnowledgeBodySchema.parse((req as any).body ?? {});
      const row = await svc.updateAiKnowledgeForAdmin(admin, params.id, {
        locale: body.locale,
        title: body.title,
        content: body.content,
        tags: body.tags,
        priority: body.priority,
        is_active: body.is_active as 0 | 1 | undefined,
      });
      if (!row) return reply.code(404).send({ error: { message: "not_found" } });
      return row;
    },

    // DELETE /admin/chat/knowledge/:id
    async adminDeleteAiKnowledge(req: FastifyRequest, reply: FastifyReply) {
      const admin = getAdmin(req);
      const params = AiKnowledgeIdParamsSchema.parse((req as any).params ?? {});
      const affected = await svc.deleteAiKnowledgeForAdmin(admin, params.id);
      if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
      return reply.code(204).send();
    },
  };
}
