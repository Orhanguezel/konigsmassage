// =============================================================
// FILE: src/common/events/bus.ts
// FIX: minor hardening (max listeners) + safer emit typing
// =============================================================

import { EventEmitter } from 'node:events';

export type AppEventLevel = 'debug' | 'info' | 'warn' | 'error';

export type AppEvent = {
  id: string;
  ts: string; // ISO
  level: AppEventLevel;
  topic: string;
  message?: string | null;

  actor_user_id?: string | null;
  ip?: string | null;

  entity?: { type: string; id?: string | number | null } | null;
  meta?: Record<string, unknown> | null;
};

type AppEventBusEvents = {
  'app.event': (evt: AppEvent) => void;
};

class TypedEventBus extends EventEmitter {
  emit<K extends keyof AppEventBusEvents>(
    eventName: K,
    ...args: Parameters<AppEventBusEvents[K]>
  ): boolean {
    return super.emit(eventName as string, ...(args as any));
  }

  on<K extends keyof AppEventBusEvents>(eventName: K, listener: AppEventBusEvents[K]): this {
    super.on(eventName as string, listener as any);
    return this;
  }

  off<K extends keyof AppEventBusEvents>(eventName: K, listener: AppEventBusEvents[K]): this {
    super.off(eventName as string, listener as any);
    return this;
  }
}

export const bus = new TypedEventBus();
// Long-running processes: avoid memory leak warnings if many SSE clients subscribe indirectly
bus.setMaxListeners(50);

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function onAppEvent(fn: (evt: AppEvent) => void) {
  bus.on('app.event', fn);
  return () => bus.off('app.event', fn);
}

export function emitAppEvent(input: Omit<AppEvent, 'id' | 'ts'> & { id?: string; ts?: string }) {
  const evt: AppEvent = {
    id: input.id ?? genId(),
    ts: input.ts ?? new Date().toISOString(),
    level: input.level,
    topic: input.topic,
    message: input.message ?? null,
    actor_user_id: input.actor_user_id ?? null,
    ip: input.ip ?? null,
    entity: input.entity ?? null,
    meta: input.meta ?? null,
  };

  bus.emit('app.event', evt);
  return evt;
}
