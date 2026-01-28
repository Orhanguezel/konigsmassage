-- =============================================================
-- 201_storage_assets_i18n.sql  (storage_assets_i18n)
--  - TR + EN + DE
--  - DE: TR kopyası (Almanca özel çeviri gelene kadar)
--  - SAFE re-runnable: ON DUPLICATE KEY UPDATE + NOT EXISTS copy
-- =============================================================

/* ================= TABLE ================= */
CREATE TABLE IF NOT EXISTS `storage_assets_i18n` (
  id          CHAR(36)     NOT NULL,
  asset_id    CHAR(36)     NOT NULL,
  locale      VARCHAR(10)  NOT NULL,

  title       VARCHAR(255)  DEFAULT NULL,
  alt         VARCHAR(255)  DEFAULT NULL,
  caption     VARCHAR(1000) DEFAULT NULL,
  description TEXT          DEFAULT NULL,

  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY ux_storage_assets_i18n_parent_locale (asset_id, locale),
  KEY idx_storage_assets_i18n_locale (locale),
  CONSTRAINT fk_storage_assets_i18n_asset
    FOREIGN KEY (asset_id) REFERENCES storage_assets(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ================= SEED ================= */

-- -------------------------------------------------------------
-- TR
-- -------------------------------------------------------------
INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_HERO_ID, 'tr', 'Hero', 'Hero', 'Öne çıkan görsel', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_REF1_ID, 'tr', 'Ref1', 'Ref1', 'Öne çıkan görsel', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_REF2_ID, 'tr', 'Ref2', 'Ref2', 'Öne çıkan görsel', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_G1A_ID, 'tr', 'Galeri1A', 'Galeri 1A', 'Galeri görseli', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_G1B_ID, 'tr', 'Galeri1B', 'Galeri 1B', 'Galeri görseli', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_G2A_ID, 'tr', 'Galeri2A', 'Galeri 2A', 'Galeri görseli', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

-- -------------------------------------------------------------
-- EN
-- -------------------------------------------------------------
INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_HERO_ID, 'en', 'Hero', 'Hero', 'Featured image', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_REF1_ID, 'en', 'Ref1', 'Ref1', 'Featured image', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_REF2_ID, 'en', 'Ref2', 'Ref2', 'Featured image', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_G1A_ID, 'en', 'Gallery1A', 'Gallery 1A', 'Gallery image', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_G1B_ID, 'en', 'Gallery1B', 'Gallery 1B', 'Gallery image', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_G2A_ID, 'en', 'Gallery2A', 'Gallery 2A', 'Gallery image', NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

-- -------------------------------------------------------------
-- TR → DE otomatik kopya (Almanca özel çeviri gelene kadar)
--  - Sadece DE kaydı yoksa ekler
--  - Var olan DE'leri ezmez (bilerek)
-- -------------------------------------------------------------
INSERT INTO storage_assets_i18n (id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
SELECT UUID(), s.asset_id, 'de', s.title, s.alt, s.caption, s.description, NOW(3), NOW(3)
FROM storage_assets_i18n s
WHERE s.locale='tr'
  AND NOT EXISTS (
    SELECT 1
    FROM storage_assets_i18n t
    WHERE t.asset_id = s.asset_id
      AND t.locale = 'de'
  );
