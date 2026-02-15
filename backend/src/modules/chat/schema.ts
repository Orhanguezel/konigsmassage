// =============================================================
// FILE: src/modules/chat/schema.ts
// Projewin – Chat Schema (threads/participants/messages)
// Fastify + Drizzle (MySQL)
// =============================================================

import {
  mysqlTable,
  varchar,
  text,
  tinyint,
  int,
  datetime,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const chat_threads = mysqlTable(
  "chat_threads",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    context_type: varchar("context_type", { length: 20 }).notNull(), // job | request
    context_id: varchar("context_id", { length: 36 }).notNull(),
    handoff_mode: varchar("handoff_mode", { length: 20 }).notNull().default("ai"), // ai | admin
    ai_provider_preference: varchar("ai_provider_preference", { length: 20 })
      .notNull()
      .default("auto"), // auto | openai | anthropic | grok
    preferred_locale: varchar("preferred_locale", { length: 10 }).notNull().default("tr"),
    assigned_admin_user_id: varchar("assigned_admin_user_id", { length: 36 }),

    created_by_user_id: varchar("created_by_user_id", { length: 36 }),
    created_at: datetime("created_at", { mode: "date" }).notNull(),
    updated_at: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => ({
    uq_ctx: uniqueIndex("uq_chat_threads_ctx").on(t.context_type, t.context_id),
    ix_ctx: index("ix_chat_threads_ctx").on(t.context_type, t.context_id),
    ix_updated: index("ix_chat_threads_updated").on(t.updated_at),
  }),
);

export const chat_ai_knowledge = mysqlTable(
  "chat_ai_knowledge",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    locale: varchar("locale", { length: 10 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    content: text("content").notNull(),
    tags: varchar("tags", { length: 500 }),
    is_active: tinyint("is_active").notNull().default(1),
    priority: int("priority").notNull().default(100),
    created_at: datetime("created_at", { mode: "date" }).notNull(),
    updated_at: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => ({
    ix_locale_active_priority: index("ix_chat_ai_knowledge_locale_active_priority").on(
      t.locale,
      t.is_active,
      t.priority,
    ),
    ix_updated: index("ix_chat_ai_knowledge_updated").on(t.updated_at),
  }),
);

export const chat_participants = mysqlTable(
  "chat_participants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    thread_id: varchar("thread_id", { length: 36 }).notNull(),
    user_id: varchar("user_id", { length: 36 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(), // buyer|vendor|admin

    joined_at: datetime("joined_at", { mode: "date" }).notNull(),
    last_read_at: datetime("last_read_at", { mode: "date" }),
  },
  (t) => ({
    uq_thread_user: uniqueIndex("uq_chat_participants_thread_user").on(
      t.thread_id,
      t.user_id,
    ),
    ix_thread: index("ix_chat_participants_thread").on(t.thread_id),
    ix_user: index("ix_chat_participants_user").on(t.user_id),
  }),
);

export const chat_messages = mysqlTable(
  "chat_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    thread_id: varchar("thread_id", { length: 36 }).notNull(),
    sender_user_id: varchar("sender_user_id", { length: 36 }).notNull(),

    client_id: varchar("client_id", { length: 64 }), // FE optimistic ack map
    text: text("text").notNull(),

    created_at: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => ({
    ix_thread_time: index("ix_chat_messages_thread_time").on(
      t.thread_id,
      t.created_at,
    ),
    ix_sender_time: index("ix_chat_messages_sender_time").on(
      t.sender_user_id,
      t.created_at,
    ),
  }),
);

export type ChatThread = typeof chat_threads.$inferSelect;
export type ChatParticipant = typeof chat_participants.$inferSelect;
export type ChatMessage = typeof chat_messages.$inferSelect;
export type ChatAiKnowledge = typeof chat_ai_knowledge.$inferSelect;

export type ChatThreadInsert = typeof chat_threads.$inferInsert;
export type ChatParticipantInsert = typeof chat_participants.$inferInsert;
export type ChatMessageInsert = typeof chat_messages.$inferInsert;
export type ChatAiKnowledgeInsert = typeof chat_ai_knowledge.$inferInsert;
