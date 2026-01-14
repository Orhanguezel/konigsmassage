-- =============================================================
-- FILE: 049-1_site_settings_ui_about.sql (Königs Massage – About UI) [FINAL / CLEAN]
-- site_settings.key = 'ui_about'
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE (assumes UNIQUE(key, locale))
--  - NO arrays, NO what/why/goal, NO bullets
--  - Matches keys used by:
--    - src/pages/about.tsx
--    - src/components/containers/about/AboutSection.tsx
--    - src/components/containers/about/AboutPageContent.tsx
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES

-- =============================================================
-- TR (Hakkımda)
-- =============================================================
(
  UUID(),
  'ui_about',
  'tr',
  CAST(
    JSON_OBJECT(
      -- Banner / Header
      'ui_about_page_title',        'Hakkımda',
      'ui_about_subprefix',         'Königs Massage',
      'ui_about_sublabel',          'Hakkımda',
      'ui_about_page_lead',
        'Bonn’da klasik masaj, spor masajı ve fasya terapisi odaklı, kişiye özel seanslar.',

      -- SEO (pages/about.tsx)
      'ui_about_meta_title',        'Hakkımda | Königs Massage',
      'ui_about_meta_description',
        'Königs Massage hakkında: Bonn’da klasik masaj, spor masajı ve fasya terapisi odaklı kişiye özel seanslar. Hijyen, konfor ve bütüncül yaklaşım.',
      'ui_about_page_description',
        'Königs Massage hakkında bilgi: seans yaklaşımı, hijyen ve kişiye özel masaj uygulamaları.',
      'ui_about_og_image',          '',

      -- AboutSection CTA
      'ui_about_view_all',          'Tümünü Gör',
      'ui_about_read_more',         'Devamı',

      -- About page content states (AboutPageContent.tsx + AboutSection.tsx)
      'ui_about_fallback_title',    'Königs Massage',
      'ui_about_empty',             'Hakkımda içeriği bulunamadı.',
      'ui_about_error',             'İçerik yüklenemedi.',
      'ui_about_empty_text',
        'Hakkımda içeriği yakında burada yayınlanacaktır.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),

-- =============================================================
-- EN (About)
-- =============================================================
(
  UUID(),
  'ui_about',
  'en',
  CAST(
    JSON_OBJECT(
      -- Banner / Header
      'ui_about_page_title',        'About',
      'ui_about_subprefix',         'Königs Massage',
      'ui_about_sublabel',          'About',
      'ui_about_page_lead',
        'Personalized sessions in Bonn focused on classic massage, sports massage, and fascia therapy.',

      -- SEO
      'ui_about_meta_title',        'About | Königs Massage',
      'ui_about_meta_description',
        'About Königs Massage: tailored sessions in Bonn focused on classic massage, sports massage, and fascia therapy, with high hygiene standards.',
      'ui_about_page_description',
        'About Königs Massage: approach, hygiene, and personalized massage sessions in Bonn.',
      'ui_about_og_image',          '',

      -- AboutSection CTA
      'ui_about_view_all',          'View all',
      'ui_about_read_more',         'Read more',

      -- Content states
      'ui_about_fallback_title',    'Königs Massage',
      'ui_about_empty',             'About content not found.',
      'ui_about_error',             'Failed to load content.',
      'ui_about_empty_text',
        'About content will be published here soon.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),

-- =============================================================
-- DE (Über mich)
-- =============================================================
(
  UUID(),
  'ui_about',
  'de',
  CAST(
    JSON_OBJECT(
      -- Banner / Header
      'ui_about_page_title',        'Über mich',
      'ui_about_subprefix',         'Königs Massage',
      'ui_about_sublabel',          'Über mich',
      'ui_about_page_lead',
        'Individuelle Behandlungen in Bonn mit Fokus auf klassische Massage, Sportmassage und Faszientherapie.',

      -- SEO
      'ui_about_meta_title',        'Über mich | Königs Massage',
      'ui_about_meta_description',
        'Über Königs Massage: individuelle Behandlungen in Bonn – klassische Massage, Sportmassage und Faszientherapie – mit hohen Hygienestandards.',
      'ui_about_page_description',
        'Über Königs Massage: Ansatz, Hygiene und individuell abgestimmte Massagen in Bonn.',
      'ui_about_og_image',          '',

      -- AboutSection CTA
      'ui_about_view_all',          'Alle anzeigen',
      'ui_about_read_more',         'Mehr lesen',

      -- Content states
      'ui_about_fallback_title',    'Königs Massage',
      'ui_about_empty',             'Über-mich-Inhalt nicht gefunden.',
      'ui_about_error',             'Inhalt konnte nicht geladen werden.',
      'ui_about_empty_text',
        'Der Über-mich-Inhalt wird bald hier veröffentlicht.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = CURRENT_TIMESTAMP(3);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
