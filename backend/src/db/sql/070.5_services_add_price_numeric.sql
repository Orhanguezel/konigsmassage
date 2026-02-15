-- =============================================================
-- 072_services_add_price_numeric.sql
-- Adds price_numeric field to services_i18n for GA4 conversion tracking
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- Add price_numeric column to services_i18n
ALTER TABLE `services_i18n`
  ADD COLUMN `price_numeric` DECIMAL(10,2) DEFAULT NULL AFTER `price`;

COMMIT;
