// =============================================================
// FILE: src/modules/chat/validation.ts
// =============================================================

import { z } from "zod";

export const ChatContextTypeEnum = z.enum(["job", "request"]);
export type ChatContextType = z.infer<typeof ChatContextTypeEnum>;

export const ChatRoleEnum = z.enum(["buyer", "vendor", "admin"]);
export type ChatRole = z.infer<typeof ChatRoleEnum>;

export const ChatHandoffModeEnum = z.enum(["ai", "admin"]);
export type ChatHandoffMode = z.infer<typeof ChatHandoffModeEnum>;

export const ChatAiProviderEnum = z.enum(["auto", "openai", "anthropic", "grok"]);
export type ChatAiProvider = z.infer<typeof ChatAiProviderEnum>;

export const ThreadIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const CreateOrGetThreadBodySchema = z.object({
  context_type: ChatContextTypeEnum,
  context_id: z.string().uuid(),
});

export const ListThreadsQuerySchema = z.object({
  context_type: ChatContextTypeEnum.optional(),
  context_id: z.string().uuid().optional(),
  handoff_mode: ChatHandoffModeEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ListMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  // "before" pagination (created_at or message_id) MVP: created_at ISO
  before: z.string().datetime().optional(),
});

export const PostMessageBodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
  client_id: z.string().trim().min(8).max(64).optional(),
});

export const RequestAdminHandoffBodySchema = z.object({
  note: z.string().trim().min(1).max(500).optional(),
});

export const WsQuerySchema = z.object({
  thread_id: z.string().uuid(),
});

export const AdminTakeoverBodySchema = z.object({
  admin_user_id: z.string().uuid().optional(),
});

export const AdminReleaseToAiBodySchema = z.object({
  provider: ChatAiProviderEnum.optional(),
});

export const AdminSetAiProviderBodySchema = z.object({
  provider: ChatAiProviderEnum,
});

export const AiKnowledgeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const ListAiKnowledgeQuerySchema = z.object({
  locale: z.string().trim().min(2).max(10).optional(),
  is_active: z.coerce.number().int().min(0).max(1).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const CreateAiKnowledgeBodySchema = z.object({
  locale: z.string().trim().min(2).max(10),
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(10).max(4000),
  tags: z.string().trim().max(500).optional().nullable(),
  priority: z.coerce.number().int().min(0).max(1000).default(100),
  is_active: z.coerce.number().int().min(0).max(1).default(1),
});

export const UpdateAiKnowledgeBodySchema = z.object({
  locale: z.string().trim().min(2).max(10).optional(),
  title: z.string().trim().min(3).max(160).optional(),
  content: z.string().trim().min(10).max(4000).optional(),
  tags: z.string().trim().max(500).optional().nullable(),
  priority: z.coerce.number().int().min(0).max(1000).optional(),
  is_active: z.coerce.number().int().min(0).max(1).optional(),
});

// WS message protocol
export const WsClientMessageSchema = z.object({
  type: z.literal("message"),
  text: z.string().trim().min(1).max(2000),
  client_id: z.string().trim().min(8).max(64),
});

export type WsClientMessage = z.infer<typeof WsClientMessageSchema>;
