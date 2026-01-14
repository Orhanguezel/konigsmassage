-- =============================================================
-- 049-92_site_settings_ui_home.sql (FINAL — Königs Massage)
-- koenigsmassage – UI Home (site_settings.ui_home)
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_home',
  'tr',
  CAST(
    JSON_OBJECT(
      'ui_home_h1', 'Königs Massage – Profesyonel Masaj ve Terapi Hizmetleri'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_home',
  'en',
  CAST(
    JSON_OBJECT(
      'ui_home_h1', 'Königs Massage – Professional Massage & Therapy Services'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_home',
  'de',
  CAST(
    JSON_OBJECT(
      'ui_home_h1', 'Königs Massage – Professionelle Massage- & Therapieangebote'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
