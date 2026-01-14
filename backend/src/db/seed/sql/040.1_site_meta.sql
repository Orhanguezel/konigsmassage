-- =============================================================
-- FILE: 040.1_site_meta.sql  (FINAL / DRY OG IMAGE)
-- Königs Massage – Default Meta + Global SEO (NEW STANDARD)
--
-- Goals:
--   - Fix SEO tool warnings:
--       * Meta title: avoid disallowed characters (avoid: | & " ' < > etc.)
--       * Meta description: keep <= ~160 chars
--   - Future-proof:
--       * seo + site_seo: global fallback => locale='*'
--       * seo + site_seo: localized overrides => locale IN ('tr','en','de')
--       * site_meta_default: add '*' fallback + per-locale overrides
--   - DRY:
--       * OG default image URL single source:
--         site_settings(key='site_og_default_image', locale='*')
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
-- Helpers
-- -------------------------------------------------------------
-- OG DEFAULT:
-- 1) First try site_og_default_image (locale='*') JSON -> $.url
-- 2) If not JSON, use value as plain URL
-- 3) If missing/empty, fallback to '/img/og-default.jpg'
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
-- - Use: "–" as separator, and "and/und/ve" instead of "&"
-- -------------------------------------------------------------

-- Brand per-locale (human, simple)
SET @BRAND_TR := 'Königs Massage – Evde Masaj ve Saglikli Yasam';
SET @BRAND_EN := 'Königs Massage – In Home Massage and Wellness';
SET @BRAND_DE := 'Königs Massage – Mobile Massage und Wellness';

-- Site name (short, used in structured data + defaults)
SET @SITE_NAME_GLOBAL := 'Königs Massage';

-- Global default title (must NOT be a single word)
SET @TITLE_GLOBAL := 'Königs Massage – Mobile Massage and Wellness';

-- Concise descriptions (target: ~150-160 chars)
SET @DESC_TR := 'Evde ve yerinde masaj hizmeti. Rahatlama, kas gevsetme ve stres azaltma. Blogda beslenme ve saglikli yasam uzerine pratik ipuclari.';
SET @DESC_EN := 'In-home and on-site massage service. Relaxation, muscle relief and stress reduction. Blog posts on nutrition and healthy lifestyle with practical tips.';
SET @DESC_DE := 'Mobile Massage bei Ihnen zu Hause. Entspannung, Muskellockerung und Stressabbau. Blog mit Tipps zu Ernaehrung und gesundem Lebensstil.';

-- Global concise description (neutral)
SET @DESC_GLOBAL := 'Mobile massage services and wellness content, including practical blog posts about nutrition and healthy lifestyle.';

-- Global keywords (neutral, not spammy)
SET @KW_GLOBAL := 'Koenigs Massage, mobile massage, in home massage, wellness, relaxation, stress relief, nutrition, healthy lifestyle, blog';

-- =============================================================
-- GLOBAL SEO DEFAULTS (locale='*')  --> neutral fallback
-- OG image: @OG_DEFAULT (single source)
-- =============================================================

-- PRIMARY: seo (GLOBAL DEFAULT)
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE(
    (SELECT `id` FROM `site_settings` WHERE `key`='seo' AND `locale`='*' LIMIT 1),
    UUID()
  ),
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

-- FALLBACK: site_seo (GLOBAL DEFAULT)
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE(
    (SELECT `id` FROM `site_settings` WHERE `key`='site_seo' AND `locale`='*' LIMIT 1),
    UUID()
  ),
  'site_seo',
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

-- =============================================================
-- LOCALIZED SEO OVERRIDES (tr/en/de)
-- OG image uses @OG_DEFAULT (single source)
-- =============================================================

-- seo overrides
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

-- site_seo overrides (fallback) – keep identical to seo (copy)
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
-- site_meta_default
-- - Add '*' fallback so new locales won't break
-- - Keep per-locale overrides for tr/en/de
-- =============================================================

-- '*' fallback (neutral)
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_meta_default' AND `locale`='*' LIMIT 1), UUID()),
  'site_meta_default',
  '*',
  CAST(
    JSON_OBJECT(
      'title',       @TITLE_GLOBAL,
      'description', @DESC_GLOBAL,
      'keywords',    @KW_GLOBAL
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- tr/en/de overrides
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_meta_default' AND `locale`='tr' LIMIT 1), UUID()),
  'site_meta_default',
  'tr',
  CAST(
    JSON_OBJECT(
      'title',       @BRAND_TR,
      'description', @DESC_TR,
      'keywords',    'Koenigs Massage, evde masaj, mobil masaj, rahatlama, stres azaltma, kas gevsetme, wellness, beslenme, saglikli yasam, blog'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_meta_default' AND `locale`='en' LIMIT 1), UUID()),
  'site_meta_default',
  'en',
  CAST(
    JSON_OBJECT(
      'title',       @BRAND_EN,
      'description', @DESC_EN,
      'keywords',    'Koenigs Massage, mobile massage, in home massage, wellness, relaxation, stress relief, muscle relief, nutrition, healthy lifestyle, blog'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_meta_default' AND `locale`='de' LIMIT 1), UUID()),
  'site_meta_default',
  'de',
  CAST(
    JSON_OBJECT(
      'title',       @BRAND_DE,
      'description', @DESC_DE,
      'keywords',    'Koenigs Massage, mobile Massage, Massage zu Hause, Wellness, Entspannung, Stressabbau, Muskellockerung, Ernaehrung, gesunder Lebensstil, Blog'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
