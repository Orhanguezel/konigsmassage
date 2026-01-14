// =============================================================
// FILE: src/modules/_shared/availability.ts
// FINAL — Availability module types
// =============================================================

import type { Hm} from '@/modules/_shared';

export type Dow = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AvailabilityExistsResult =
  | {
      exists: true;
      slot_id: string;
      is_active: 0 | 1;
      capacity: number;
      reserved_count: number;
      available: boolean;
    }
  | {
      exists: false;
      // derived from working-hours if any match exists
      is_active: 0 | 1; // if WH says active+aligned => 1 else 0
      capacity: number | null;
      reserved_count: 0;
      available: boolean;
    };

export type ReserveResult =
  | { ok: true; slot_id: string; capacity: number }
  | { ok: false; reason: 'slot_not_available' | 'invalid_slot' | 'invalid_input' };

export type ReleaseResult =
  | { ok: true; slot_id: string; reserved_count: number }
  | { ok: false; reason: 'invalid_slot' | 'invalid_input' };

export type MoveResult =
  | { ok: true; to_slot_id: string; capacity: number }
  | { ok: false; reason: 'slot_not_available' | 'invalid_slot' | 'invalid_input' };

export type WorkingHourRowDTO = {
  id: string;
  resource_id: string;
  dow: Dow;
  start_time: string; // "HH:mm:00" from DB
  end_time: string; // "HH:mm:00"
  slot_minutes: number;
  break_minutes: number;
  capacity: number;
  is_active: 0 | 1;
  created_at: any;
  updated_at: any;
};

export type SlotRowDTO = {
  id: string;
  slot_time: string; // "HH:mm:00"
  capacity: number;
  is_active: 0 | 1;
  reserved_count: number;
};

export type PlannedSlotDTO = {
  time: Hm; // "HH:mm"
  // derived from WH window
  wh_id: string;
  wh_start_time: string; // "HH:mm:00"
  wh_end_time: string; // "HH:mm:00"
  slot_minutes: number;
  break_minutes: number;

  // merged override (if exists)
  slot_id: string | null;
  is_active: 0 | 1;
  capacity: number;
  reserved_count: number;

  available: boolean;
};
