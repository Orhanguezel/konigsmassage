-- =============================================================
-- FILE: 040.1_site_meta.sql  (FINAL / DRY OG IMAGE)
-- Königs Massage – Default Meta + Global SEO (NEW STANDARD)
--  - Fix SEO tool warnings:
--      * Meta title: avoid disallowed characters (avoid: | & " ' < > etc.)
--      * Meta description: keep <= ~160 chars
--  - Future-proof:
--      * seo + site_seo: global fallback => locale='*'
--      * localized overrides => locale IN ('tr','en','de')
--      * site_meta_default: '*' fallback + per-locale overrides
--  - DRY OG:
--      * site_settings(key='site_og_default_image', locale='*') -> $.url (or plain url)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- TABLE GUARD
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id`         CHAR(36)      NOT NULL,
  `key`        VARCHAR(100)  NOT NULL,
  `locale`     VARCHAR(8)    NOT NULL,
  `value`      TEXT          NOT NULL,
  `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_locale_uq` (`key`, `locale`),
  KEY `site_settings_key_idx` (`key`),
  KEY `site_settings_locale_idx` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Helpers — OG DEFAULT (single source)
-- -------------------------------------------------------------
SET @OG_DEFAULT := COALESCE(
  (
    SELECT COALESCE(
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`value`, '$.url')), ''),
      NULLIF(`value`, '')
    )
    FROM `site_settings`
    WHERE `key` = 'site_og_default_image'
      AND `locale` = '*'
    ORDER BY `updated_at` DESC
    LIMIT 1
  ),
  '/img/og-default.jpg'
);

-- -------------------------------------------------------------
-- Title policies:
-- - Avoid: | & " ' < > etc.
-- - Use: "–" as separator
-- - Keep defaults different from typical H1 strings to avoid "Title duplicates H1"
-- -------------------------------------------------------------

SET @SITE_NAME_GLOBAL := 'Königs Massage';

-- Keep these as "default meta titles" (NOT the home H1)
SET @TITLE_GLOBAL := 'Königs Massage – Massage und Wellness';

SET @BRAND_TR := 'Königs Massage – Masaj ve Wellness';
SET @BRAND_EN := 'Königs Massage – Massage and Wellness';
SET @BRAND_DE := 'Königs Massage – Massage und Wellness';

-- Descriptions (neutral; <= ~160 chars target)
SET @DESC_TR := 'Masaj ve wellness odakli icerikler. Blogda rahatlama, stres yonetimi, hareket ve beslenme uzerine pratik ipuclari ve rehberler.';
SET @DESC_EN := 'Massage and wellness focused content. Blog posts with practical tips on relaxation, stress management, mobility and nutrition.';
SET @DESC_DE := 'Inhalte zu Massage und Wellness. Blog mit praktischen Tipps zu Entspannung, Stressmanagement, Mobilität und Ernährung.';

SET @DESC_GLOBAL := 'Massage and wellness content with practical blog posts about relaxation, stress management, mobility and nutrition.';

SET @KW_GLOBAL := 'Koenigs Massage, massage, wellness, relaxation, stress management, mobility, nutrition, healthy lifestyle, blog';

-- =============================================================
-- GLOBAL SEO DEFAULTS (locale='*')
-- =============================================================

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='seo' AND `locale`='*' LIMIT 1), UUID()),
  'seo',
  '*',
  CAST(
    JSON_OBJECT(
      'site_name',      @SITE_NAME_GLOBAL,
      'title_default',  @TITLE_GLOBAL,
      'title_template', '%s – Königs Massage',
      'description',    @DESC_GLOBAL,
      'open_graph', JSON_OBJECT(
        'type',   'website',
        'images', JSON_ARRAY(@OG_DEFAULT)
      ),
      'twitter', JSON_OBJECT(
        'card',    'summary_large_image',
        'site',    '',
        'creator', ''
      ),
      'robots', JSON_OBJECT(
        'noindex', false,
        'index',   true,
        'follow',  true
      )
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_seo' AND `locale`='*' LIMIT 1), UUID()),
  'site_seo',
  '*',
  (SELECT `value` FROM `site_settings` WHERE `key`='seo' AND `locale`='*' LIMIT 1),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED SEO OVERRIDES (tr/en/de)
-- =============================================================

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='seo' AND `locale`='tr' LIMIT 1), UUID()),
  'seo',
  'tr',
  CAST(
    JSON_OBJECT(
      'site_name',      'Königs Massage',
      'title_default',  @BRAND_TR,
      'title_template', '%s – Königs Massage',
      'description',    @DESC_TR,
      'open_graph', JSON_OBJECT('type','website','images', JSON_ARRAY(@OG_DEFAULT)),
      'twitter',   JSON_OBJECT('card','summary_large_image','site','','creator',''),
      'robots',    JSON_OBJECT('noindex', false,'index', true,'follow', true)
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='seo' AND `locale`='en' LIMIT 1), UUID()),
  'seo',
  'en',
  CAST(
    JSON_OBJECT(
      'site_name',      'Königs Massage',
      'title_default',  @BRAND_EN,
      'title_template', '%s – Königs Massage',
      'description',    @DESC_EN,
      'open_graph', JSON_OBJECT('type','website','images', JSON_ARRAY(@OG_DEFAULT)),
      'twitter',   JSON_OBJECT('card','summary_large_image','site','','creator',''),
      'robots',    JSON_OBJECT('noindex', false,'index', true,'follow', true)
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='seo' AND `locale`='de' LIMIT 1), UUID()),
  'seo',
  'de',
  CAST(
    JSON_OBJECT(
      'site_name',      'Königs Massage',
      'title_default',  @BRAND_DE,
      'title_template', '%s – Königs Massage',
      'description',    @DESC_DE,
      'open_graph', JSON_OBJECT('type','website','images', JSON_ARRAY(@OG_DEFAULT)),
      'twitter',   JSON_OBJECT('card','summary_large_image','site','','creator',''),
      'robots',    JSON_OBJECT('noindex', false,'index', true,'follow', true)
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- site_seo overrides (copy from seo)
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_seo' AND `locale`='tr' LIMIT 1), UUID()),
  'site_seo',
  'tr',
  (SELECT `value` FROM `site_settings` WHERE `key`='seo' AND `locale`='tr' LIMIT 1),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_seo' AND `locale`='en' LIMIT 1), UUID()),
  'site_seo',
  'en',
  (SELECT `value` FROM `site_settings` WHERE `key`='seo' AND `locale`='en' LIMIT 1),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_seo' AND `locale`='de' LIMIT 1), UUID()),
  'site_seo',
  'de',
  (SELECT `value` FROM `site_settings` WHERE `key`='seo' AND `locale`='de' LIMIT 1),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- site_meta_default (fallback meta)
-- =============================================================

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_meta_default' AND `locale`='*' LIMIT 1), UUID()),
  'site_meta_default',
  '*',
  CAST(JSON_OBJECT(
    'title',       @TITLE_GLOBAL,
    'description', @DESC_GLOBAL,
    'keywords',    @KW_GLOBAL
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_meta_default' AND `locale`='tr' LIMIT 1), UUID()),
  'site_meta_default',
  'tr',
  CAST(JSON_OBJECT(
    'title',       @BRAND_TR,
    'description', @DESC_TR,
    'keywords',    'Koenigs Massage, masaj, wellness, rahatlama, stres yonetimi, mobilite, beslenme, saglikli yasam, blog'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_meta_default' AND `locale`='en' LIMIT 1), UUID()),
  'site_meta_default',
  'en',
  CAST(JSON_OBJECT(
    'title',       @BRAND_EN,
    'description', @DESC_EN,
    'keywords',    'Koenigs Massage, massage, wellness, relaxation, stress management, mobility, nutrition, healthy lifestyle, blog'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_meta_default' AND `locale`='de' LIMIT 1), UUID()),
  'site_meta_default',
  'de',
  CAST(JSON_OBJECT(
    'title',       @BRAND_DE,
    'description', @DESC_DE,
    'keywords',    'Koenigs Massage, Massage, Wellness, Entspannung, Stressmanagement, Mobilität, Ernährung, gesunder Lebensstil, Blog'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
