-- =============================================================
-- 049-1.4_site_settings_ui_legal_notice.sql  [FINAL]
-- ui_legal_notice (Legal Notice / Impressum page UI strings) — Königs Massage (DE/EN/TR)
--  - Key: ui_legal_notice
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE
--  - NO ALTER / NO PATCH
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- ui_legal_notice (TR/EN/DE)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES
(
  UUID(),
  'ui_legal_notice',
  'tr',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_legal_notice_page_title',        'Yasal Bilgilendirme',
      'ui_legal_notice_fallback_title',    'Yasal Bilgilendirme',

      -- Empty states
      'ui_legal_notice_empty',             'Yasal bilgilendirme içeriği bulunamadı.',
      'ui_legal_notice_empty_text',        'Yasal bilgilendirme içeriği yakında yayınlanacaktır.',

      -- SEO (pages/legal-notice.tsx)
      'ui_legal_notice_page_description',
        'Königs Massage yasal bilgilendirme: sorumluluk reddi, harici bağlantılar, telif hakları ve sorumluluk sınırları.',
      'ui_legal_notice_meta_title',        'Yasal Bilgilendirme | Königs Massage',
      'ui_legal_notice_meta_description',
        'Königs Massage yasal bilgilendirme: sorumluluk reddi, harici bağlantılar, telif hakları ve sorumluluk sınırları.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_legal_notice',
  'en',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_legal_notice_page_title',        'Legal Notice (Imprint)',
      'ui_legal_notice_fallback_title',    'Legal Notice (Imprint)',

      -- Empty states
      'ui_legal_notice_empty',             'Legal notice content not found.',
      'ui_legal_notice_empty_text',        'The legal notice (imprint) will be published here soon.',

      -- SEO
      'ui_legal_notice_page_description',
        'Königs Massage legal notice (imprint): provider information, disclaimers, external links, copyright, and limitation of liability (Germany).',
      'ui_legal_notice_meta_title',        'Legal Notice (Imprint) | Königs Massage',
      'ui_legal_notice_meta_description',
        'Königs Massage legal notice (imprint): provider information, disclaimers, external links, copyright, and limitation of liability (Germany).'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_legal_notice',
  'de',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_legal_notice_page_title',        'Impressum',
      'ui_legal_notice_fallback_title',    'Impressum',

      -- Empty states
      'ui_legal_notice_empty',             'Impressum nicht gefunden.',
      'ui_legal_notice_empty_text',        'Das Impressum wird hier in Kürze veröffentlicht.',

      -- SEO
      'ui_legal_notice_page_description',
        'Königs Massage Impressum: Anbieterkennzeichnung nach deutschem Recht, Haftungsausschluss, externe Links, Urheberrecht und Haftungsbeschränkung.',
      'ui_legal_notice_meta_title',        'Impressum | Königs Massage',
      'ui_legal_notice_meta_description',
        'Königs Massage Impressum: Anbieterkennzeichnung nach deutschem Recht, Haftungsausschluss, externe Links, Urheberrecht und Haftungsbeschränkung.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
