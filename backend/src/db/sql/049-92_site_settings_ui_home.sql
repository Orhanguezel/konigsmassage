-- =============================================================
-- FILE: 049-92_site_settings_ui_home.sql (FINAL — KÖNIG ENERGETIK)
--  - FIX 1093: no SELECT from site_settings inside INSERT
--  - Adds ui_home_meta_title / ui_home_meta_description
--  - Prevents Title == H1
--  - Removes "&" from meta titles
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings`
  (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'ui_home',
  'tr',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'KÖNIG ENERGETIK – Bonn’da Enerjetik Masaj',
    'ui_home_meta_title', 'KÖNIG ENERGETIK – Bonn’da Enerjetik Masaj',
    'ui_home_meta_description', 'Bonn’da enerjetik masaj seansları ve blog yazıları: rahatlama, beden farkındalığı, nefes ve günlük hayatta denge.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_home',
  'en',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'KÖNIG ENERGETIK – Energetic Massage in Bonn',
    'ui_home_meta_title', 'KÖNIG ENERGETIK – Energetic Massage in Bonn',
    'ui_home_meta_description', 'Energetic massage sessions in Bonn and blog posts on relaxation, body awareness, breath, and everyday balance.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_home',
  'de',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'KÖNIG ENERGETIK – Energetische Massage in Bonn',
    'ui_home_meta_title', 'KÖNIG ENERGETIK – Energetische Massage in Bonn',
    'ui_home_meta_description', 'Energetische Massage in Bonn und Blogbeiträge zu Entspannung, Körperwahrnehmung, Atmung und Balance im Alltag.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
