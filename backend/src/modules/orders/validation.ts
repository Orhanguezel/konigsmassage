// src/modules/orders/validation.ts
import { z } from "zod";

const id36 = z.string().length(36);

export const addressCreateSchema = z.object({
  title:        z.string().min(1).max(255),
  full_name:    z.string().min(1).max(255),
  phone:        z.string().min(1).max(50),
  email:        z.string().email().optional().nullish(),
  address_line: z.string().min(1),
  city:         z.string().min(1).max(128),
  district:     z.string().min(1).max(128),
  postal_code:  z.string().max(32).optional().nullish(),
  is_default:   z.coerce.number().int().min(0).max(1).optional(),
});

export const orderItemSchema = z.object({
  item_type:   z.string().max(50).default("service"),  // service | gutschein | other
  item_ref_id: id36.optional().nullish(),               // generische Referenz
  title:       z.string().min(1).max(255),
  price:       z.coerce.number().positive().multipleOf(0.01),
  quantity:    z.coerce.number().int().positive().default(1),
  currency:    z.string().max(10).optional(),
});

export const orderCreateSchema = z.object({
  shipping_address_id:  id36.optional().nullish(),
  billing_address_id:   id36.optional().nullish(),
  payment_gateway_slug: z.string().min(1),
  currency:             z.string().max(10).default("EUR"),
  order_notes:          z.string().optional().nullish(),
  items:                z.array(orderItemSchema).min(1),
});

export const paymentSessionSchema = z.object({
  order_id: id36,
});
