-- =============================================================
-- 111_availability.seed.sql (FINAL — collation hardened, rerunnable)
-- Seed: working hours (weekly plan) + example daily slot overrides + reservations
--
-- Notes:
-- - Weekly plan is defined in resource_working_hours.
-- - Daily "sessions" are derived deterministically from working hours by app logic
--   (buildDailyPlanFromWorkingHours), and can be materialized into resource_slots
--   via generateMissingSlotsForDate(). This seed only inserts example overrides.
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

START TRANSACTION;

-- -------------------------------------------------------------
-- CONFIG (force vars to unicode collation)
-- -------------------------------------------------------------
SET @RES_A = CONVERT('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @RES_B = CONVERT('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- Example dates
SET @D1 = CONVERT('2026-01-20' USING utf8mb4) COLLATE utf8mb4_unicode_ci; -- Tue
SET @D2 = CONVERT('2026-01-22' USING utf8mb4) COLLATE utf8mb4_unicode_ci; -- Thu
SET @D3 = CONVERT('2026-01-25' USING utf8mb4) COLLATE utf8mb4_unicode_ci; -- Sun (no WH => no plan)

-- -------------------------------------------------------------
-- CLEANUP (safe rerun): remove rows for these resources only
-- Fix: enforce same collation on both sides
-- -------------------------------------------------------------
DELETE sr
FROM slot_reservations sr
JOIN resource_slots rs ON rs.id = sr.slot_id
WHERE (rs.resource_id COLLATE utf8mb4_unicode_ci) IN (@RES_A, @RES_B);

DELETE FROM resource_slots
WHERE (resource_id COLLATE utf8mb4_unicode_ci) IN (@RES_A, @RES_B);

DELETE FROM resource_working_hours
WHERE (resource_id COLLATE utf8mb4_unicode_ci) IN (@RES_A, @RES_B);

-- =============================================================
-- WEEKLY WORKING HOURS (weekly plan)
-- =============================================================

-- ---------------- Resource A ----------------
-- Mon..Fri split: 09-12, 13-18 (60+15, cap1)
-- Wed: 30+10
-- Sat: 10-14
-- Sun: off (no rows)
-- -------------------------------------------------------------

-- Monday (1)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a1111111-1111-4111-8111-111111111111', @RES_A, 1, '09:00:00','12:00:00', 60, 15, 1, 1),
('a1111111-1111-4111-8111-111111111112', @RES_A, 1, '13:00:00','18:00:00', 60, 15, 1, 1);

-- Tuesday (2)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a2222222-2222-4222-8222-222222222221', @RES_A, 2, '09:00:00','12:00:00', 60, 15, 1, 1),
('a2222222-2222-4222-8222-222222222222', @RES_A, 2, '13:00:00','18:00:00', 60, 15, 1, 1);

-- Wednesday (3) 30+10
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a3333333-3333-4333-8333-333333333331', @RES_A, 3, '09:00:00','12:00:00', 30, 10, 1, 1),
('a3333333-3333-4333-8333-333333333332', @RES_A, 3, '13:00:00','18:00:00', 30, 10, 1, 1);

-- Thursday (4)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a4444444-4444-4444-8444-444444444441', @RES_A, 4, '09:00:00','12:00:00', 60, 15, 1, 1),
('a4444444-4444-4444-8444-444444444442', @RES_A, 4, '13:00:00','18:00:00', 60, 15, 1, 1);

-- Friday (5)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a5555555-5555-4555-8555-555555555551', @RES_A, 5, '09:00:00','12:00:00', 60, 15, 1, 1),
('a5555555-5555-4555-8555-555555555552', @RES_A, 5, '13:00:00','18:00:00', 60, 15, 1, 1);

-- Saturday (6)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a6666666-6666-4666-8666-666666666661', @RES_A, 6, '10:00:00','14:00:00', 60, 15, 1, 1);

-- ---------------- Resource B ----------------
-- Tue..Sat 10-16 (45+15, cap2)
-- Mon/Sun off (no rows)
-- -------------------------------------------------------------

-- Tuesday (2)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b2222222-2222-4222-8222-222222222221', @RES_B, 2, '10:00:00','16:00:00', 45, 15, 2, 1);

-- Wednesday (3)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b3333333-3333-4333-8333-333333333331', @RES_B, 3, '10:00:00','16:00:00', 45, 15, 2, 1);

-- Thursday (4)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b4444444-4444-4444-8444-444444444441', @RES_B, 4, '10:00:00','16:00:00', 45, 15, 2, 1);

-- Friday (5)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b5555555-5555-4555-8555-555555555551', @RES_B, 5, '10:00:00','16:00:00', 45, 15, 2, 1);

-- Saturday (6)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b6666666-6666-4666-8666-666666666661', @RES_B, 6, '10:00:00','16:00:00', 45, 15, 2, 1);

-- =============================================================
-- DAILY SESSIONS (deterministic)
-- =============================================================
-- This system derives daily sessions from resource_working_hours and only stores
-- resource_slots as overrides (inactive/active/capacity changes) OR when you
-- choose to materialize them via generateMissingSlotsForDate().
--
-- If you want to pre-materialize slots for a date range in SQL, do it with your
-- backend generator (recommended). Here we only insert overrides as examples.

-- =============================================================
-- SLOT OVERRIDES (resource_slots)
-- =============================================================

-- Resource A @D1 (Tue) full day closed.
-- Tue plan for A is 60+15 starting 09:00..12:00 and 13:00..18:00
-- Slot times: 09:00, 10:15, 11:30, 13:00, 14:15, 15:30, 16:45
INSERT INTO resource_slots
(id, resource_id, slot_date, slot_time, capacity, is_active)
VALUES
('sa000001-0000-4000-8000-000000000001', @RES_A, @D1, '09:00:00', 1, 0),
('sa000001-0000-4000-8000-000000000002', @RES_A, @D1, '10:15:00', 1, 0),
('sa000001-0000-4000-8000-000000000003', @RES_A, @D1, '11:30:00', 1, 0),
('sa000001-0000-4000-8000-000000000004', @RES_A, @D1, '13:00:00', 1, 0),
('sa000001-0000-4000-8000-000000000005', @RES_A, @D1, '14:15:00', 1, 0),
('sa000001-0000-4000-8000-000000000006', @RES_A, @D1, '15:30:00', 1, 0),
('sa000001-0000-4000-8000-000000000007', @RES_A, @D1, '16:45:00', 1, 0)
ON DUPLICATE KEY UPDATE
  capacity = VALUES(capacity),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);

-- Resource A @D2 (Thu) single slot inactive (maintenance)
-- Thu plan for A includes 14:15 aligned (13:00 + 75 min steps)
INSERT INTO resource_slots
(id, resource_id, slot_date, slot_time, capacity, is_active)
VALUES
('sa000002-0000-4000-8000-000000000001', @RES_A, @D2, '14:15:00', 1, 0)
ON DUPLICATE KEY UPDATE
  capacity = VALUES(capacity),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);

-- Resource B @D2 (Thu) capacity up at 11:00
-- B plan is 45+15 starting 10:00 -> times: 10:00, 11:00, 12:00, 13:00, 14:00, 15:00
INSERT INTO resource_slots
(id, resource_id, slot_date, slot_time, capacity, is_active)
VALUES
('sb000001-0000-4000-8000-000000000001', @RES_B, @D2, '11:00:00', 3, 1)
ON DUPLICATE KEY UPDATE
  capacity = VALUES(capacity),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);

-- Optional: demonstrate a "Sunday exception" for A (even though Sun has no WH)
-- If Sun has no WH, deterministic plan is empty; inserting an override alone
-- is typically not useful unless you intentionally want ad-hoc slots.
-- (We leave it out to keep semantics clean.)

-- =============================================================
-- RESERVATIONS (slot_reservations)
-- =============================================================

-- Reservation row referencing slot override id
INSERT INTO slot_reservations
(id, slot_id, reserved_count)
VALUES
('r0000001-0000-4000-8000-000000000001', 'sb000001-0000-4000-8000-000000000001', 2)
ON DUPLICATE KEY UPDATE
  reserved_count = VALUES(reserved_count),
  updated_at = CURRENT_TIMESTAMP(3);

-- Keep explicit empty reservation row (optional)
INSERT INTO slot_reservations
(id, slot_id, reserved_count)
VALUES
('r0000002-0000-4000-8000-000000000002', 'sa000002-0000-4000-8000-000000000001', 0)
ON DUPLICATE KEY UPDATE
  reserved_count = VALUES(reserved_count),
  updated_at = CURRENT_TIMESTAMP(3);

COMMIT;
