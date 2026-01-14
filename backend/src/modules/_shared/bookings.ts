// =============================================================
// FILE: src/modules/bookings/types.ts
// FINAL — Bookings module types (NO booking_i18n)
// =============================================================

import type { Id36, LocaleCode, Ymd, Hm } from '@/modules/_shared';

export type BookingStatus =
  | 'new'
  | 'confirmed'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type BookingMerged = {
  // bookings
  id: Id36;

  name: string;
  email: string;
  phone: string;

  locale: LocaleCode;
  customer_message: string | null;

  service_id: Id36 | null;
  resource_id: Id36;

  slot_id: Id36 | null;

  appointment_date: Ymd;
  appointment_time: Hm | null;

  status: BookingStatus | string;
  is_read: 0 | 1;

  admin_note: string | null;
  decided_at: any;
  decided_by: string | null;
  decision_note: string | null;

  email_last_sent_at: any;
  email_last_template_key: string | null;
  email_last_to: string | null;
  email_last_subject: string | null;
  email_last_error: string | null;

  created_at: any;
  updated_at: any;

  // joins
  resource_title: string | null;
  service_title: string | null;
};

export type BookingListFilters = {
  q?: string;
  status?: string;
  is_read?: unknown;

  appointment_date?: string;
  appointment_time?: string;

  service_id?: string;
  resource_id?: string;

  locale?: string; // used for service_title i18n
};

export type ListOptions = { limit?: number; offset?: number };

export type SlotKey = { resource_id: string; dateYmd: string; timeHm: string };

export type SlotAvailability =
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
      available: false;
      capacity: null;
      reserved_count: 0;
    };
