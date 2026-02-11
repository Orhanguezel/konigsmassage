-- =============================================================
-- 049_site_settings_ui_hero.sql (FINAL — KÖNIG ENERGETIK)
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
    'ui_hero_variant', 'v3',
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Bonn’da Enerjetik Masaj',

    'ui_hero_title_fallback',
      'Kendinize alan açın — enerjetik dokunuşla derin gevşeme',
    'ui_hero_desc_fallback',
      'Sakin bir atmosferde, net sınırlar içinde ilerleyen kişiye özel seanslar. Uygun günü ve saati seçin, randevu talebinizi kolayca gönderin.',

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
    'ui_hero_variant', 'v3',
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Energetic Massage in Bonn',

    'ui_hero_title_fallback',
      'Make space for yourself — deep relaxation with mindful touch',
    'ui_hero_desc_fallback',
      'Individual sessions in a calm atmosphere, held within clear boundaries. Choose a date and time and submit your appointment request easily.',

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
    'ui_hero_variant', 'v3',
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Energetische Massage in Bonn',

    'ui_hero_title_fallback',
      'Zeit für sich — tiefe Entspannung durch achtsame Berührung',
    'ui_hero_desc_fallback',
      'Individuelle Sitzungen in ruhiger Atmosphäre, achtsam und klar abgegrenzt. Datum und Uhrzeit wählen und Terminanfrage einfach senden.',

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
