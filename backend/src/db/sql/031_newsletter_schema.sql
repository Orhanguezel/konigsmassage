-- 031_newsletter_schema.sql
-- @vps/shared-backend/modules/newsletter bu tabloyu bekliyor. Konigsmassage
-- seed'inde hic olusturulmuyordu, bu yuzden /admin/newsletter 500 veriyordu.
-- Tanim guezelwebdesign'daki calisan tablo ile birebir hizalidir.
CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id`               CHAR(36)      NOT NULL,
  `email`            VARCHAR(255)  NOT NULL,
  `is_verified`      TINYINT(1)    NOT NULL DEFAULT 0,
  `locale`           VARCHAR(10)   DEFAULT NULL,
  `meta`             LONGTEXT      NOT NULL,
  `unsubscribed_at`  DATETIME(3)   DEFAULT NULL,
  `created_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_newsletter_email` (`email`),
  KEY `newsletter_verified_idx` (`is_verified`),
  KEY `newsletter_locale_idx` (`locale`),
  KEY `newsletter_unsub_idx` (`unsubscribed_at`),
  KEY `newsletter_created_idx` (`created_at`),
  KEY `newsletter_updated_idx` (`updated_at`),
  CONSTRAINT `chk_newsletter_meta_json` CHECK (json_valid(`meta`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
