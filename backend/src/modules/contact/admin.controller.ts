// =============================================================
// FILE: src/modules/contact/admin.controller.ts
// =============================================================
import type { FastifyRequest, FastifyReply } from "fastify";
import {
  ContactListParamsSchema,
  ContactUpdateSchema,
} from "./validation";
import {
  repoListContacts,
  repoGetContactById,
  repoUpdateContact,
  repoDeleteContact,
} from "./repository";

type ListReq = FastifyRequest<{ Querystring: unknown }>;
type GetReq = FastifyRequest<{ Params: { id: string } }>;
type UpdateReq = FastifyRequest<{ Params: { id: string }; Body: unknown }>;
type DeleteReq = FastifyRequest<{ Params: { id: string } }>;

export async function listContactsAdmin(req: ListReq, reply: FastifyReply) {
  const parsed = ContactListParamsSchema.safeParse(req.query);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: "INVALID_QUERY", details: parsed.error.flatten() });
  }

  const list = await repoListContacts(parsed.data);
  return reply.send(list);
}

export async function getContactAdmin(req: GetReq, reply: FastifyReply) {
  const row = await repoGetContactById(req.params.id);
  if (!row) return reply.code(404).send({ error: "NOT_FOUND" });
  return reply.send(row);
}

export async function updateContactAdmin(
  req: UpdateReq,
  reply: FastifyReply,
) {
  const parsed = ContactUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: "INVALID_BODY", details: parsed.error.flatten() });
  }

  const updated = await repoUpdateContact(req.params.id, parsed.data);
  if (!updated) return reply.code(404).send({ error: "NOT_FOUND" });
  return reply.send(updated);
}

export async function removeContactAdmin(req: DeleteReq, reply: FastifyReply) {
  const ok = await repoDeleteContact(req.params.id);
  return reply.send({ ok });
}
