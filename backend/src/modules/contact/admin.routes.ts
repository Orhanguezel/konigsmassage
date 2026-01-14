// =============================================================
// FILE: src/modules/contact/admin.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listContactsAdmin,
  getContactAdmin,
  updateContactAdmin,
  removeContactAdmin,
} from "./admin.controller";

const BASE = "/contacts";

export async function registerContactsAdmin(app: FastifyInstance) {
  app.get(`${BASE}`,       { config: { auth: true } }, listContactsAdmin);
  app.get(`${BASE}/:id`,   { config: { auth: true } }, getContactAdmin);
  app.patch(`${BASE}/:id`, { config: { auth: true } }, updateContactAdmin);
  app.delete(`${BASE}/:id`,{ config: { auth: true } }, removeContactAdmin);
}
