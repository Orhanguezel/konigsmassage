-- =============================================================
-- 200_storage_assets.sql  (storage_assets)
-- =============================================================

/* ================= TABLE ================= */
CREATE TABLE IF NOT EXISTS `storage_assets` (
  id                       CHAR(36)      NOT NULL,
  user_id                  CHAR(36)      DEFAULT NULL,

  `name`                   VARCHAR(255)  NOT NULL,
  bucket                   VARCHAR(64)   NOT NULL,
  `path`                   VARCHAR(512)  NOT NULL,
  folder                   VARCHAR(255)  DEFAULT NULL,

  mime                     VARCHAR(127)  NOT NULL,
  size                     BIGINT UNSIGNED NOT NULL,

  width                    INT UNSIGNED  DEFAULT NULL,
  height                   INT UNSIGNED  DEFAULT NULL,

  url                      TEXT          DEFAULT NULL,
  hash                     VARCHAR(64)   DEFAULT NULL,

  provider                 VARCHAR(16)   NOT NULL DEFAULT 'cloudinary',
  provider_public_id       VARCHAR(255)  DEFAULT NULL,
  provider_resource_type   VARCHAR(16)   DEFAULT NULL,
  provider_format          VARCHAR(32)   DEFAULT NULL,
  provider_version         INT UNSIGNED  DEFAULT NULL,
  etag                     VARCHAR(64)   DEFAULT NULL,

  metadata                 JSON          DEFAULT NULL,

  created_at               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY uniq_bucket_path (bucket, `path`),
  KEY idx_storage_bucket (bucket),
  KEY idx_storage_folder (folder),
  KEY idx_storage_created (created_at),
  KEY idx_provider_pubid (provider_public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ================= SEED: ASSETS (deterministik anahtar: bucket+path) ================= */

-- Ortak demo URL (Unsplash)
SET @DEMO_IMG_URL := 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=1200&h=600&q=80';

-- hero
SET @ASSET_HERO_ID := (SELECT id FROM storage_assets WHERE bucket='public' AND `path`='references/hero.jpg' LIMIT 1);
SET @ASSET_HERO_ID := COALESCE(@ASSET_HERO_ID, UUID());
INSERT INTO storage_assets
(id, user_id, `name`, bucket, `path`, folder, mime, size, width, height, url, hash,
 provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
VALUES
(@ASSET_HERO_ID, NULL, 'hero.jpg', 'public', 'references/hero.jpg', 'references',
 'image/jpeg', 245120, NULL, NULL,
 @DEMO_IMG_URL, NULL,
 'cloudinary', NULL, 'image', 'jpg', 1, NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 mime=VALUES(mime),
 size=VALUES(size),
 url=VALUES(url),
 provider_format=VALUES(provider_format),
 updated_at=VALUES(updated_at);

-- ref1
SET @ASSET_REF1_ID := (SELECT id FROM storage_assets WHERE bucket='public' AND `path`='references/ref1.jpg' LIMIT 1);
SET @ASSET_REF1_ID := COALESCE(@ASSET_REF1_ID, UUID());
INSERT INTO storage_assets
(id, user_id, `name`, bucket, `path`, folder, mime, size, width, height, url, hash,
 provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
VALUES
(@ASSET_REF1_ID, NULL, 'ref1.jpg', 'public', 'references/ref1.jpg', 'references',
 'image/jpeg', 180300, NULL, NULL,
 @DEMO_IMG_URL, NULL,
 'cloudinary', NULL, 'image', 'jpg', 1, NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 mime=VALUES(mime),
 size=VALUES(size),
 url=VALUES(url),
 provider_format=VALUES(provider_format),
 updated_at=VALUES(updated_at);

-- ref2
SET @ASSET_REF2_ID := (SELECT id FROM storage_assets WHERE bucket='public' AND `path`='references/ref2.jpg' LIMIT 1);
SET @ASSET_REF2_ID := COALESCE(@ASSET_REF2_ID, UUID());
INSERT INTO storage_assets
(id, user_id, `name`, bucket, `path`, folder, mime, size, width, height, url, hash,
 provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
VALUES
(@ASSET_REF2_ID, NULL, 'ref2.jpg', 'public', 'references/ref2.jpg', 'references',
 'image/jpeg', 171550, NULL, NULL,
 @DEMO_IMG_URL, NULL,
 'cloudinary', NULL, 'image', 'jpg', 1, NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 mime=VALUES(mime),
 size=VALUES(size),
 url=VALUES(url),
 provider_format=VALUES(provider_format),
 updated_at=VALUES(updated_at);

-- gallery 1A
SET @ASSET_G1A_ID := (SELECT id FROM storage_assets WHERE bucket='public' AND `path`='references/g1a.jpg' LIMIT 1);
SET @ASSET_G1A_ID := COALESCE(@ASSET_G1A_ID, UUID());
INSERT INTO storage_assets
(id, user_id, `name`, bucket, `path`, folder, mime, size, width, height, url, hash,
 provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
VALUES
(@ASSET_G1A_ID, NULL, 'g1a.jpg', 'public', 'references/g1a.jpg', 'references',
 'image/jpeg', 200000, NULL, NULL,
 @DEMO_IMG_URL, NULL,
 'cloudinary', NULL, 'image', 'jpg', 1, NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 mime=VALUES(mime),
 size=VALUES(size),
 url=VALUES(url),
 provider_format=VALUES(provider_format),
 updated_at=VALUES(updated_at);

-- gallery 1B
SET @ASSET_G1B_ID := (SELECT id FROM storage_assets WHERE bucket='public' AND `path`='references/g1b.jpg' LIMIT 1);
SET @ASSET_G1B_ID := COALESCE(@ASSET_G1B_ID, UUID());
INSERT INTO storage_assets
(id, user_id, `name`, bucket, `path`, folder, mime, size, width, height, url, hash,
 provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
VALUES
(@ASSET_G1B_ID, NULL, 'g1b.jpg', 'public', 'references/g1b.jpg', 'references',
 'image/jpeg', 210000, NULL, NULL,
 @DEMO_IMG_URL, NULL,
 'cloudinary', NULL, 'image', 'jpg', 1, NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 mime=VALUES(mime),
 size=VALUES(size),
 url=VALUES(url),
 provider_format=VALUES(provider_format),
 updated_at=VALUES(updated_at);

-- gallery 2A
SET @ASSET_G2A_ID := (SELECT id FROM storage_assets WHERE bucket='public' AND `path`='references/g2a.jpg' LIMIT 1);
SET @ASSET_G2A_ID := COALESCE(@ASSET_G2A_ID, UUID());
INSERT INTO storage_assets
(id, user_id, `name`, bucket, `path`, folder, mime, size, width, height, url, hash,
 provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
VALUES
(@ASSET_G2A_ID, NULL, 'g2a.jpg', 'public', 'references/g2a.jpg', 'references',
 'image/jpeg', 205000, NULL, NULL,
 @DEMO_IMG_URL, NULL,
 'cloudinary', NULL, 'image', 'jpg', 1, NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 mime=VALUES(mime),
 size=VALUES(size),
 url=VALUES(url),
 provider_format=VALUES(provider_format),
 updated_at=VALUES(updated_at);

