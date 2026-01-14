// =============================================================
// FILE: src/modules/contact/repository.ts
// =============================================================
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import {
  contact_messages,
  type ContactView,
  type ContactInsert,
} from "./schema";
import {
  and,
  asc,
  desc,
  eq,
  sql,
  type SQL,
} from "drizzle-orm";
import type {
  ContactCreateInput,
  ContactListParams,
  ContactUpdateInput,
} from "./validation";

function safeOrderBy(col?: string) {
  switch (col) {
    case "created_at":
    case "updated_at":
    case "status":
    case "name":
      return col;
    default:
      return "created_at";
  }
}

export async function repoCreateContact(
  body: ContactCreateInput & { ip?: string | null; user_agent?: string | null },
): Promise<ContactView> {
  const id = randomUUID();

  const insert: ContactInsert = {
    id,
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    subject: body.subject.trim(),
    message: body.message,
    status: "new",
    is_resolved: false,
    admin_note: null,
    ip: body.ip ?? null,
    user_agent: body.user_agent ?? null,
    website: body.website ?? null,
    // created_at / updated_at DB default
  };

  await db.insert(contact_messages).values(insert);

  const [row] = await db
    .select()
    .from(contact_messages)
    .where(eq(contact_messages.id, id))
    .limit(1);

  return row as ContactView;
}

export async function repoGetContactById(id: string): Promise<ContactView | null> {
  const [row] = await db
    .select()
    .from(contact_messages)
    .where(eq(contact_messages.id, id))
    .limit(1);

  return (row ?? null) as ContactView | null;
}

export async function repoListContacts(
  params: ContactListParams,
): Promise<ContactView[]> {
  const {
    search,
    status,
    resolved,
    limit = 50,
    offset = 0,
    orderBy,
    order = "desc",
  } = params;

  const filters: SQL[] = [];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    filters.push(
      sql`
        (
          ${contact_messages.name}    LIKE ${q}
          OR ${contact_messages.email}   LIKE ${q}
          OR ${contact_messages.phone}   LIKE ${q}
          OR ${contact_messages.subject} LIKE ${q}
          OR ${contact_messages.message} LIKE ${q}
        )
      `,
    );
  }

  if (status) {
    filters.push(eq(contact_messages.status, status));
  }

  if (typeof resolved === "boolean") {
    filters.push(eq(contact_messages.is_resolved, resolved));
  }

  const whereExpr: SQL | undefined =
    filters.length > 0 ? (and(...filters) as SQL) : undefined;

  const orderCol = safeOrderBy(orderBy);
  const orderDir = order?.toLowerCase() === "asc" ? "asc" : "desc";

  const orderExpr =
    orderCol === "created_at"
      ? orderDir === "asc"
        ? asc(contact_messages.created_at)
        : desc(contact_messages.created_at)
      : orderCol === "updated_at"
      ? orderDir === "asc"
        ? asc(contact_messages.updated_at)
        : desc(contact_messages.updated_at)
      : orderCol === "status"
      ? orderDir === "asc"
        ? asc(contact_messages.status)
        : desc(contact_messages.status)
      : orderDir === "asc"
      ? asc(contact_messages.name)
      : desc(contact_messages.name);

  const baseQuery = db
    .select()
    .from(contact_messages);

  const rows = await (whereExpr ? baseQuery.where(whereExpr) : baseQuery)
    .orderBy(orderExpr)
    .limit(Number(limit))
    .offset(Number(offset));

  return rows as ContactView[];
}

export async function repoUpdateContact(
  id: string,
  body: ContactUpdateInput,
): Promise<ContactView | null> {
  const patch: Partial<ContactInsert> = {};

  if (body.status) {
    patch.status = body.status;
  }
  if (typeof body.is_resolved === "boolean") {
    patch.is_resolved = body.is_resolved;
  }
  if (typeof body.admin_note !== "undefined") {
    patch.admin_note = body.admin_note ?? null;
  }

  if (Object.keys(patch).length === 0) {
    // hiçbir alan yok → mevcut kaydı döndür
    return repoGetContactById(id);
  }

  await db
    .update(contact_messages)
    .set({
      ...patch,
      updated_at: new Date() as any,
    })
    .where(eq(contact_messages.id, id));

  return repoGetContactById(id);
}

export async function repoDeleteContact(id: string): Promise<boolean> {
  const res = await db
    .delete(contact_messages)
    .where(eq(contact_messages.id, id))
    .execute();

  const affected =
    (res as any)?.affectedRows != null
      ? Number((res as any).affectedRows)
      : 0;

  return affected > 0;
}
