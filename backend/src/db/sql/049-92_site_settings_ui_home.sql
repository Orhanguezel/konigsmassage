-- =============================================================
-- FILE: 049-92_site_settings_ui_home.sql (FINAL — Königs Massage)
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
    'ui_home_h1', 'Königs Massage – Profesyonel Masaj ve Terapi Hizmetleri',
    'ui_home_meta_title', 'Königs Massage – Masaj ve Wellness',
    'ui_home_meta_description', 'Masaj ve wellness odakli icerikler. Rahatlama, stres yonetimi, hareket ve beslenme uzerine pratik blog yazilari.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_home',
  'en',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'Königs Massage – Professional Massage and Therapy Services',
    'ui_home_meta_title', 'Königs Massage – Massage and Wellness',
    'ui_home_meta_description', 'Massage and wellness focused content with practical blog posts on relaxation, stress management, mobility and nutrition.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_home',
  'de',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'Königs Massage – Professionelle Massage- und Therapieangebote',
    'ui_home_meta_title', 'Königs Massage – Massage und Wellness',
    'ui_home_meta_description', 'Inhalte zu Massage und Wellness. Praktische Blogbeiträge zu Entspannung, Stressmanagement, Mobilität und Ernährung.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
