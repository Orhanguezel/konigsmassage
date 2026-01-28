-- =============================================================
-- 049_site_settings_ui_hero.sql (FINAL — Königs Massage)
-- koenigsmassage – UI Hero (site_settings.ui_hero)
--  - Key: ui_hero
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_hero',
  'tr',
  CAST(JSON_OBJECT(
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Masaj & Wellness',

    'ui_hero_title_fallback',
      'Kendinize zaman ayırın — profesyonel masaj ile yenilenin',
    'ui_hero_desc_fallback',
      'Kişiye özel masaj seçenekleriyle rahatlayın. Terapist seçin, uygun günü ve saati belirleyin, randevu talebinizi kolayca gönderin.',

    'ui_hero_cta', 'Randevu Al',

    'ui_hero_prev', 'Önceki slayt',
    'ui_hero_next', 'Sonraki slayt'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_hero',
  'en',
  CAST(JSON_OBJECT(
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Massage & Wellness',

    'ui_hero_title_fallback',
      'Make time for yourself — renew with professional massage',
    'ui_hero_desc_fallback',
      'Relax with tailored massage options. Choose a therapist, pick a suitable date and time, and submit your appointment request easily.',

    'ui_hero_cta', 'Book Appointment',

    'ui_hero_prev', 'Previous slide',
    'ui_hero_next', 'Next slide'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_hero',
  'de',
  CAST(JSON_OBJECT(
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Massage & Wellness',

    'ui_hero_title_fallback',
      'Zeit für sich — mit professioneller Massage neue Energie tanken',
    'ui_hero_desc_fallback',
      'Entspannen Sie mit individuell abgestimmten Massagen. Wählen Sie einen Therapeuten, Datum und Uhrzeit und senden Sie Ihre Terminanfrage ganz einfach.',

    'ui_hero_cta', 'Termin buchen',

    'ui_hero_prev', 'Vorherige Folie',
    'ui_hero_next', 'Nächste Folie'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
