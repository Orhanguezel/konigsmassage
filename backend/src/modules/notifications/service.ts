// ===================================================================
// FILE: src/modules/notifications/service.ts
// ===================================================================

import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import {
  notifications,
  type NotificationInsert,
  type NotificationRow,
  type NotificationType,
} from "./schema";

export async function createUserNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}): Promise<NotificationRow> {
  const insert: NotificationInsert = {
    id: randomUUID(),
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "system",
    is_read: false,
    created_at: new Date(),
  };

  await db.insert(notifications).values(insert);

  const [row] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, insert.id))
    .limit(1);

  return row as NotificationRow;
}
