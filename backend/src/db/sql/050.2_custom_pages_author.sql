-- =============================================================
-- FILE: 050.2_custom_pages_author.sql
-- custom_pages.author_id kolonunu ekler (idempotent)
--
-- Neden: @vps/shared-backend customPages repository'si her listede
-- custom_pages.author_id -> users -> profiles join'i yapiyor.
-- Kolon yoksa MySQL 1054 (Unknown column) firlatiyor ve
-- GET /api/v1/custom-pages 500 donuyor.
--
-- Canonical tanim 050_custom_pages_schema.sql icindedir; bu dosya
-- sadece onceden olusturulmus (VPS dahil) veritabanlarini tamamlar.
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET @has_author_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'custom_pages'
    AND COLUMN_NAME = 'author_id'
);

SET @sql_add_author_col := IF(
  @has_author_col = 0,
  'ALTER TABLE `custom_pages` ADD COLUMN `author_id` CHAR(36) DEFAULT NULL AFTER `order_num`',
  'SELECT 1'
);
PREPARE stmt_add_author_col FROM @sql_add_author_col;
EXECUTE stmt_add_author_col;
DEALLOCATE PREPARE stmt_add_author_col;

SET @has_author_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'custom_pages'
    AND INDEX_NAME = 'custom_pages_author_idx'
);

SET @sql_add_author_idx := IF(
  @has_author_idx = 0,
  'ALTER TABLE `custom_pages` ADD INDEX `custom_pages_author_idx` (`author_id`)',
  'SELECT 1'
);
PREPARE stmt_add_author_idx FROM @sql_add_author_idx;
EXECUTE stmt_add_author_idx;
DEALLOCATE PREPARE stmt_add_author_idx;
