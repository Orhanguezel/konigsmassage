-- =============================================================
-- 116_resources.seed.sql (FINAL — collation hardened, rerunnable)
-- Seed: resources (incl. capacity)
-- - User-bound resources: title from users.full_name (auto refresh on rerun)
-- - Non-user resources: fixed literal title
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

START TRANSACTION;

-- -------------------------------------------------------------
-- Stable resource IDs (must match availability seed)
-- Force vars to unicode collation to avoid mix with legacy tables
-- -------------------------------------------------------------
SET @RES_A      = CONVERT('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @RES_B      = CONVERT('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

SET @RES_ROOM1  = CONVERT('cccccccc-cccc-4ccc-8ccc-cccccccccccc' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @RES_TABLE1 = CONVERT('dddddddd-dddd-4ddd-8ddd-dddddddddddd' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @RES_STAFF1 = CONVERT('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @RES_DOC1   = CONVERT('ffffffff-ffff-4fff-8fff-ffffffffffff' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- Example inactive resource
SET @RES_INACTIVE = CONVERT('99999999-9999-4999-8999-999999999999' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Users (from 002_auth_seed.sql) — force unicode collation
-- -------------------------------------------------------------
SET @U_MEHMET = CONVERT('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @U_NURI   = CONVERT('19a2bc26-63d1-43ad-ab56-d7f3c3719a34' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @U_MELIH1 = CONVERT('7129bc31-88dc-42da-ab80-415a21f2ea9a' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 1) User-bound resources (title from users.full_name)
-- IMPORTANT: fix collation on u.id side as well
-- -------------------------------------------------------------

/* Therapist A -> Mehmet */
INSERT INTO `resources` (`id`,`type`,`title`,`capacity`,`external_ref_id`,`is_active`)
SELECT
  @RES_A AS id,
  'therapist' AS type,
  TRIM(u.full_name) AS title,
  1 AS capacity,
  u.id AS external_ref_id,
  1 AS is_active
FROM users u
WHERE (u.id COLLATE utf8mb4_unicode_ci) = @U_MEHMET
LIMIT 1
ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `capacity` = VALUES(`capacity`),
  `external_ref_id` = VALUES(`external_ref_id`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP(3);

/* Therapist B -> Melih Keçeci (choose one) */
INSERT INTO `resources` (`id`,`type`,`title`,`capacity`,`external_ref_id`,`is_active`)
SELECT
  @RES_B AS id,
  'therapist' AS type,
  TRIM(u.full_name) AS title,
  1 AS capacity,
  u.id AS external_ref_id,
  1 AS is_active
FROM users u
WHERE (u.id COLLATE utf8mb4_unicode_ci) = @U_MELIH1
LIMIT 1
ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `capacity` = VALUES(`capacity`),
  `external_ref_id` = VALUES(`external_ref_id`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP(3);

/* Doctor -> Nuri */
INSERT INTO `resources` (`id`,`type`,`title`,`capacity`,`external_ref_id`,`is_active`)
SELECT
  @RES_DOC1 AS id,
  'doctor' AS type,
  TRIM(u.full_name) AS title,
  1 AS capacity,
  u.id AS external_ref_id,
  1 AS is_active
FROM users u
WHERE (u.id COLLATE utf8mb4_unicode_ci) = @U_NURI
LIMIT 1
ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `capacity` = VALUES(`capacity`),
  `external_ref_id` = VALUES(`external_ref_id`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- -------------------------------------------------------------
-- 2) Non-user resources (fixed titles)
-- -------------------------------------------------------------
INSERT INTO `resources` (`id`,`type`,`title`,`capacity`,`external_ref_id`,`is_active`)
VALUES
  (@RES_ROOM1,  'room',  'Room 1',    1, NULL, 1),
  (@RES_TABLE1, 'table', 'Table 1',   1, NULL, 1),
  (@RES_STAFF1, 'staff', 'Reception', 1, NULL, 1)
ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `capacity` = VALUES(`capacity`),
  `external_ref_id` = VALUES(`external_ref_id`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- -------------------------------------------------------------
-- 3) Optional inactive example
-- -------------------------------------------------------------
INSERT INTO `resources` (`id`,`type`,`title`,`capacity`,`external_ref_id`,`is_active`)
VALUES
  (@RES_INACTIVE, 'other', 'Temporary Resource (inactive)', 1, NULL, 0)
ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `capacity` = VALUES(`capacity`),
  `external_ref_id` = VALUES(`external_ref_id`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP(3);

COMMIT;
