-- =============================================================
-- FILE: 049-92_site_settings_ui_home.sql (FINAL — Königs Massage)
-- Add ui_home_meta_title/ui_home_meta_description to prevent Title == H1
-- Also remove "&" from meta title strings
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  COALESCE((SELECT `id` FROM site_settings WHERE `key`='ui_home' AND `locale`='tr' LIMIT 1), UUID()),
  'ui_home',
  'tr',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'Königs Massage – Profesyonel Masaj ve Terapi Hizmetleri',
    'ui_home_meta_title', 'Königs Massage – Masaj ve Wellness',
    'ui_home_meta_description', 'Masaj ve wellness odakli icerikler. Rahatlama, stres yonetimi, hareket ve beslenme uzerine pratik blog yazilari.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3), NOW(3)
),
(
  COALESCE((SELECT `id` FROM site_settings WHERE `key`='ui_home' AND `locale`='en' LIMIT 1), UUID()),
  'ui_home',
  'en',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'Königs Massage – Professional Massage and Therapy Services',
    'ui_home_meta_title', 'Königs Massage – Massage and Wellness',
    'ui_home_meta_description', 'Massage and wellness focused content with practical blog posts on relaxation, stress management, mobility and nutrition.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3), NOW(3)
),
(
  COALESCE((SELECT `id` FROM site_settings WHERE `key`='ui_home' AND `locale`='de' LIMIT 1), UUID()),
  'ui_home',
  'de',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'Königs Massage – Professionelle Massage- und Therapieangebote',
    'ui_home_meta_title', 'Königs Massage – Massage und Wellness',
    'ui_home_meta_description', 'Inhalte zu Massage und Wellness. Praktische Blogbeiträge zu Entspannung, Stressmanagement, Mobilität und Ernährung.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3), NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
