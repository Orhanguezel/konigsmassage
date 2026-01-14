// =============================================================
// FILE: src/modules/userRoles/controller.ts
// =============================================================

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, asc, desc, eq } from "drizzle-orm";
import { userRoles } from "./schema";
import {
  userRoleListQuerySchema,
  createUserRoleSchema,
} from "./validation";

/* ------------------------- LIST ------------------------- */

export const listUserRoles: RouteHandler = async (req, reply) => {
  // Query’yi Zod ile parse et
  const q = userRoleListQuerySchema.parse(req.query ?? {});

  const conds: unknown[] = [];
  if (q.user_id) conds.push(eq(userRoles.user_id, q.user_id));
  if (q.role) conds.push(eq(userRoles.role, q.role));

  let qb = db.select().from(userRoles).$dynamic();

  if (conds.length === 1) {
    qb = qb.where(conds[0] as any);
  } else if (conds.length > 1) {
    qb = qb.where(and(...(conds as any)));
  }

  const dirFn = q.direction === "desc" ? desc : asc;
  qb = qb.orderBy(dirFn(userRoles.created_at));

  const limit = q.limit ?? 50;
  const offset = q.offset ?? 0;

  qb = qb.limit(limit).offset(offset);

  const rows = await qb;
  return reply.send(rows);
};

/* ------------------------- CREATE ------------------------- */

export const createUserRole: RouteHandler = async (req, reply) => {
  try {
    const body = createUserRoleSchema.parse(req.body ?? {});

    const id = randomUUID();

    await db.insert(userRoles).values({
      id,
      user_id: body.user_id,
      role: body.role,
    });

    const [row] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.id, id))
      .limit(1);

    return reply.code(201).send(row);
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return reply
        .code(409)
        .send({ error: { message: "user_role_already_exists" } });
    }
    req.log?.error?.(err, "create_user_role_failed");
    return reply
      .code(500)
      .send({ error: { message: "create_user_role_failed" } });
  }
};

/* ------------------------- DELETE ------------------------- */

export const deleteUserRole: RouteHandler = async (req, reply) => {
  const { id } = (req.params ?? {}) as { id?: string };

  if (!id) {
    return reply
      .code(400)
      .send({ error: { message: "id_required" } });
  }

  const res = await db.delete(userRoles).where(eq(userRoles.id, id));
  const affected =
    (res as any)?.affectedRows != null ? Number((res as any).affectedRows) : 0;

  if (!affected) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }

  return reply.code(204).send();
};
