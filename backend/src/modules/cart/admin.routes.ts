// src/modules/cart/admin.routes.ts
import type { FastifyInstance } from "fastify";
import {
  listCartItems,
  getCartItemById,
  deleteCartItem,
} from "./controller";

const BASE_PATH = "/cart_items";

export async function registerCartAdmin(app: FastifyInstance) {
  // Admin can list all cart items, filter by user, or delete
  app.get(`${BASE_PATH}`, listCartItems);
  app.get(`${BASE_PATH}/:id`, getCartItemById);
  app.delete(`${BASE_PATH}/:id`, deleteCartItem);
}
