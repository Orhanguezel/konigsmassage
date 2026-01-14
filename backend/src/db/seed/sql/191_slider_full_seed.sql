-- =============================================================
-- FILE: 191_slider_full.sql (KÖNIGS MASSAGE — FINAL)
-- Slider – schema + seed + i18n (TR / EN / DE)
-- Idempotent seed
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- DROP & SCHEMA
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `slider_i18n`;
DROP TABLE IF EXISTS `slider`;

CREATE TABLE IF NOT EXISTS `slider` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`              CHAR(36)     NOT NULL,

  `image_url`         TEXT,
  `image_asset_id`    CHAR(36),

  `featured`          TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,

  `display_order`     INT UNSIGNED NOT NULL DEFAULT 0,

  `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_slider_uuid`        (`uuid`),
  KEY `idx_slider_active`              (`is_active`),
  KEY `idx_slider_order`               (`display_order`),
  KEY `idx_slider_image_asset`         (`image_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `slider_i18n` (
  `id`           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `slider_id`    INT UNSIGNED   NOT NULL,
  `locale`       VARCHAR(8)     NOT NULL,

  `name`         VARCHAR(255)   NOT NULL,
  `slug`         VARCHAR(255)   NOT NULL,
  `description`  TEXT,

  `alt`          VARCHAR(255),
  `button_text`  VARCHAR(100),
  `button_link`  VARCHAR(255),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_slider_i18n_slider_locale` (`slider_id`,`locale`),
  UNIQUE KEY `uniq_slider_i18n_slug_locale`   (`slug`,`locale`),
  KEY `idx_slider_i18n_locale`                (`locale`),

  CONSTRAINT `fk_slider_i18n_slider`
    FOREIGN KEY (`slider_id`) REFERENCES `slider` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- PARENT SEED (6 slides)
-- -------------------------------------------------------------
INSERT INTO `slider`
(`uuid`,`image_url`,`image_asset_id`,`featured`,`is_active`,`display_order`,`created_at`,`updated_at`)
VALUES
('aa990001-1111-4111-8111-aa9900000001','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866121/uploads/anastasia/gallery/14-1748866115117-20866348.webp',NULL,1,1,1,'2024-01-20 00:00:00.000','2024-01-20 00:00:00.000'),
('aa990002-1111-4111-8111-aa9900000002','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866951/uploads/anastasia/gallery/21-1748866946899-726331234.webp',NULL,0,1,2,'2024-01-21 00:00:00.000','2024-01-21 00:00:00.000'),
('aa990003-1111-4111-8111-aa9900000003','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866833/uploads/anastasia/gallery/10-1748866827290-437834578.webp',NULL,0,1,3,'2024-01-22 00:00:00.000','2024-01-22 00:00:00.000'),
('aa990004-1111-4111-8111-aa9900000004','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748867152/uploads/anastasia/gallery/37-1748867148559-823774231.webp',NULL,0,1,4,'2024-01-23 00:00:00.000','2024-01-23 00:00:00.000'),
('aa990005-1111-4111-8111-aa9900000005','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866951/uploads/anastasia/gallery/21-1748866946899-726331234.webp',NULL,0,1,5,'2024-01-24 00:00:00.000','2024-01-24 00:00:00.000'),
('aa990006-1111-4111-8111-aa9900000006','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866255/uploads/anastasia/gallery/47-1748866252901-503887675.webp',NULL,0,1,6,'2024-01-25 00:00:00.000','2024-01-25 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `image_url`      = VALUES(`image_url`),
  `image_asset_id` = VALUES(`image_asset_id`),
  `featured`       = VALUES(`featured`),
  `is_active`      = VALUES(`is_active`),
  `display_order`  = VALUES(`display_order`),
  `updated_at`     = VALUES(`updated_at`);

-- -------------------------------------------------------------
-- I18N — TR
-- -------------------------------------------------------------
INSERT INTO `slider_i18n`
(`slider_id`,`locale`,`name`,`slug`,`description`,`alt`,`button_text`,`button_link`)
VALUES
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990001-1111-4111-8111-aa9900000001'),
  'tr',
  'Evde Masaj ile Rahatlayın',
  'evde-masaj-ile-rahatlayin',
  'Konfor alanınızda, profesyonel dokunuşlarla yenilenin. Size uygun masaj türünü seçin ve randevunuzu oluşturun.',
  'Evde masaj hizmeti',
  'Randevu Al',
  '/appointment'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'tr',
  'İsveç (Klasik) Masajı',
  'isvec-klasik-masaji-slider',
  'Kasları gevşetmeye ve genel rahatlamaya odaklanan klasik uygulama. Evde sakin, ritmik dokunuşlar.',
  'İsveç masajı',
  'Detay',
  '/services/isvec-klasik-masaj'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'tr',
  'Derin Doku Masajı',
  'derin-doku-masaji-slider',
  'Yoğun gerginlik ve sertlik bölgelerine odaklanan daha derin basınçlı masaj. Özellikle sırt ve omuz hattında etkili.',
  'Derin doku masajı',
  'Detay',
  '/services/derin-doku-masaji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'tr',
  'Aromaterapi Masajı',
  'aromaterapi-masaji-slider',
  'Esansiyel yağlarla desteklenen, stres azaltmaya ve zihinsel rahatlamaya odaklanan yumuşak masaj.',
  'Aromaterapi masajı',
  'Detay',
  '/services/aromaterapi-masaji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'tr',
  'Spor Masajı',
  'spor-masaji-slider',
  'Aktivite öncesi/sonrası kasları destekleyen, dolaşımı artırmaya ve toparlanmayı hızlandırmaya yönelik uygulama.',
  'Spor masajı',
  'Detay',
  '/services/spor-masaji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'tr',
  'Size Uygun Seansı Planlayalım',
  'size-uygun-seansi-planlayalim',
  'Randevu oluşturmak veya soru sormak için bizimle iletişime geçin. Uygun saatleri birlikte planlayalım.',
  'Randevu ve iletişim',
  'İletişim',
  '/contact'
)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `slug`        = VALUES(`slug`),
  `description` = VALUES(`description`),
  `alt`         = VALUES(`alt`),
  `button_text` = VALUES(`button_text`),
  `button_link` = VALUES(`button_link`);

-- -------------------------------------------------------------
-- I18N — EN
-- -------------------------------------------------------------
INSERT INTO `slider_i18n`
(`slider_id`,`locale`,`name`,`slug`,`description`,`alt`,`button_text`,`button_link`)
VALUES
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990001-1111-4111-8111-aa9900000001'),
  'en',
  'Relax with At-Home Massage',
  'relax-with-at-home-massage',
  'Recharge in your comfort zone with professional care. Choose your massage type and book your appointment.',
  'At-home massage service',
  'Book Now',
  '/appointment'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'en',
  'Swedish (Classic) Massage',
  'swedish-classic-massage-slider',
  'A classic session focused on relaxation and muscle release, delivered with calm, rhythmic strokes at home.',
  'Swedish massage',
  'Details',
  '/services/swedish-classic-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'en',
  'Deep Tissue Massage',
  'deep-tissue-massage-slider',
  'A firmer-pressure massage targeting tight areas and stiffness—especially effective for back and shoulders.',
  'Deep tissue massage',
  'Details',
  '/services/deep-tissue-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'en',
  'Aromatherapy Massage',
  'aromatherapy-massage-slider',
  'A gentle session supported by selected essential oils, focused on relaxation and stress reduction.',
  'Aromatherapy massage',
  'Details',
  '/services/aromatherapy-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'en',
  'Sports Massage',
  'sports-massage-slider',
  'Supports muscles before/after activity and helps recovery with targeted techniques—delivered at home.',
  'Sports massage',
  'Details',
  '/services/sports-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'en',
  'Let’s Plan Your Session',
  'lets-plan-your-session',
  'For booking or questions, contact us. We’ll plan the best time together.',
  'Appointment and contact',
  'Contact',
  '/contact'
)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `slug`        = VALUES(`slug`),
  `description` = VALUES(`description`),
  `alt`         = VALUES(`alt`),
  `button_text` = VALUES(`button_text`),
  `button_link` = VALUES(`button_link`);

-- -------------------------------------------------------------
-- I18N — DE
-- -------------------------------------------------------------
INSERT INTO `slider_i18n`
(`slider_id`,`locale`,`name`,`slug`,`description`,`alt`,`button_text`,`button_link`)
VALUES
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990001-1111-4111-8111-aa9900000001'),
  'de',
  'Entspannen mit Hausmassage',
  'entspannen-mit-hausmassage',
  'Erholen Sie sich in Ihrer Komfortzone mit professioneller Betreuung. Wählen Sie Ihre Massageart und buchen Sie Ihren Termin.',
  'Hausmassage-Service',
  'Termin buchen',
  '/appointment'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'de',
  'Schwedische Massage',
  'schwedische-massage-slider',
  'Klassische Massage zur Entspannung und Lockerung der Muskulatur – ruhig und rhythmisch bei Ihnen zu Hause.',
  'Schwedische Massage',
  'Details',
  '/services/schwedische-klassische-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'de',
  'Tiefengewebs-Massage',
  'tiefengewebsmassage-slider',
  'Massage mit tieferem Druck gegen Verspannungen und verhärtete Bereiche – besonders Rücken und Schultern.',
  'Tiefengewebs-Massage',
  'Details',
  '/services/tiefengewebsmassage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'de',
  'Aromatherapie-Massage',
  'aromatherapie-massage-slider',
  'Sanfte Massage mit ätherischen Ölen – Fokus auf Entspannung und Stressreduktion.',
  'Aromatherapie-Massage',
  'Details',
  '/services/aromatherapie-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'de',
  'Sportmassage',
  'sportmassage-slider',
  'Unterstützt Muskulatur vor/nach Aktivität und fördert Regeneration – komfortabel bei Ihnen zu Hause.',
  'Sportmassage',
  'Details',
  '/services/sportmassage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'de',
  'Wir planen Ihren Termin',
  'wir-planen-ihren-termin',
  'Für Buchung oder Fragen kontaktieren Sie uns. Wir planen gemeinsam den passenden Zeitpunkt.',
  'Termin und Kontakt',
  'Kontakt',
  '/contact'
)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `slug`        = VALUES(`slug`),
  `description` = VALUES(`description`),
  `alt`         = VALUES(`alt`),
  `button_text` = VALUES(`button_text`),
  `button_link` = VALUES(`button_link`);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
