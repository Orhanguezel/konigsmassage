// src/modules/wallet/validation.ts
import { z } from "zod";

export const walletDepositCreateSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive").max(100000),
  currency: z.string().trim().min(3).max(10).default("EUR"),
  payment_method: z.enum(["paypal", "bank_transfer"]),
  description: z.string().optional(),
  return_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  bank_transfer_reference: z.string().max(255).optional(),
});

export const walletDepositCaptureSchema = z.object({
  paypal_order_id: z.string().min(3).max(128),
});

export const adminAdjustSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  purpose: z.string().min(1),
  description: z.string().optional(),
  payment_status: z.enum(["pending", "completed", "failed", "refunded"]).default("completed"),
});

export const adminStatusSchema = z.object({
  status: z.enum(["active", "suspended", "closed"]),
});

export const adminTransactionStatusSchema = z.object({
  payment_status: z.enum(["pending", "completed", "failed", "refunded"]),
});

export const adminDepositListQuerySchema = z.object({
  payment_status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
  payment_method: z.enum(["paypal", "bank_transfer", "admin_manual"]).optional(),
  user_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminRejectDepositSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});
