-- =============================================================
-- FILE: 191_slider_full.sql (KÖNIG ENERGETIK — FINAL)
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
('aa990005-1111-4111-8111-aa9900000005','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1800&q=80',NULL,0,1,5,'2024-01-24 00:00:00.000','2024-01-24 00:00:00.000'),
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
  'Enerjetik Rahatlama Masajı',
  'enerjetik-rahatlama-masaji-slider',
  'Bonn’da enerjetik masaj: sakin bir atmosfer, net sınırlar ve derin gevşemeye alan açan bilinçli dokunuş.',
  'Enerjetik rahatlama masajı',
  'Detay',
  '/services/bonn-enerjetik-masaj'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'tr',
  'Thai Yoga Masajı',
  'thai-yoga-masaji-slider',
  'Esneme, basınç ve akışkan hareketlerle bedenin açılmasına ve rahatlamaya destek olan bütüncül bir seans.',
  'Thai Yoga masajı',
  'Detay',
  '/services/thai-yoga-masaj'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'tr',
  'Sırt & Boyun Rahatlatma',
  'sirt-boyun-rahatlatma-slider',
  'Günlük stres ve yük birikiminde sırt-boyun hattına odaklanan, nefes ve ritimle desteklenen rahatlatıcı bir uygulama.',
  'Sırt ve boyun rahatlatma',
  'Detay',
  '/services/sirt-boyun-rahatlama'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'tr',
  'Aroma Enerji Masajı',
  'aroma-enerji-masaji-slider',
  'Seçilmiş aromalar ve yumuşak dokunuşlarla sakinleşmeye, bedeni “yavaşlatmaya” ve iç huzura alan açan bir seans.',
  'Aroma enerji masajı',
  'Detay',
  '/services/aroma-enerji-masaji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'tr',
  'Ayak Refleks & Enerji Noktaları',
  'ayak-refleks-enerji-slider',
  'Ayaklarda refleks bölgeleri ve enerji noktalarıyla, bedenin genel gevşemesini ve farkındalığı destekleyen sakin bir uygulama.',
  'Ayak refleks ve enerji noktaları',
  'Detay',
  '/services/ayak-refleks-enerji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'tr',
  'Sezgisel Enerjetik Seans',
  'sezgisel-enerjetik-seans-slider',
  'O gün nasıl hissettiğine göre şekillenen, sakin ve net sınırlar içinde ilerleyen sezgisel bir enerjetik çalışma.',
  'Sezgisel enerjetik seans',
  'Detay',
  '/services/sezgisel-enerjetik-seans'
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
  'Energetic Relaxation Massage',
  'energetic-relaxation-massage-slider',
  'Energetic massage sessions in Bonn with mindful touch, clear boundaries, and space for deep relaxation.',
  'Energetic relaxation massage',
  'Details',
  '/services/energetic-massage-bonn'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'en',
  'Thai Yoga Massage',
  'thai-yoga-massage-slider',
  'A holistic session blending stretching, pressure, and flowing movement to support openness and ease in the body.',
  'Thai yoga massage',
  'Details',
  '/services/thai-yoga-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'en',
  'Back & Neck Release',
  'back-neck-release-slider',
  'A calming, breath-supported session focused on the back and neck area to ease everyday tension.',
  'Back and neck release',
  'Details',
  '/services/back-neck-release'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'en',
  'Aroma Energy Massage',
  'aroma-energy-massage-slider',
  'A gentle session supported by selected aromas, inviting calm, softness, and a slower inner rhythm.',
  'Aroma energy massage',
  'Details',
  '/services/aroma-energy-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'en',
  'Foot Reflex & Energy Points',
  'foot-reflex-energy-slider',
  'A calm, grounding treatment focusing on reflex zones and energy points to support overall relaxation and body awareness.',
  'Foot reflex and energy points',
  'Details',
  '/services/foot-reflex-energy'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'en',
  'Intuitive Energetic Session',
  'intuitive-energetic-session-slider',
  'An intuitive energetic session shaped by how you feel today—held in a respectful, clearly bounded space.',
  'Intuitive energetic session',
  'Details',
  '/services/intuitive-energetic-session'
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
  'Energetische Entspannungsmassage',
  'energetische-entspannungsmassage-slider',
  'Energetische Massage in Bonn – achtsame Berührung, klare Grenzen und ein ruhiger Raum zum Ankommen und Loslassen.',
  'Energetische Entspannungsmassage',
  'Details',
  '/services/energetische-massage-bonn'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'de',
  'Thai Yoga Massage',
  'thai-yoga-massage-slider',
  'Eine ganzheitliche Sitzung mit Dehnungen, Druck und fließenden Bewegungen – für mehr Weite und Leichtigkeit.',
  'Thai Yoga Massage',
  'Details',
  '/services/thai-yoga-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'de',
  'Rücken & Nacken Release',
  'ruecken-nacken-release-slider',
  'Beruhigende Anwendung mit Fokus auf Rücken- und Nackenbereich – unterstützt durch Atmung und ruhigen Rhythmus.',
  'Rücken und Nacken Release',
  'Details',
  '/services/ruecken-nacken-release'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'de',
  'Aroma-Energie Massage',
  'aroma-energie-massage-slider',
  'Sanfte Berührung, unterstützt durch ausgewählte Aromen – für Ruhe, Weichheit und einen langsameren inneren Rhythmus.',
  'Aroma-Energie Massage',
  'Details',
  '/services/aroma-energie-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'de',
  'Fußreflex & Energiepunkte',
  'fussreflex-energie-slider',
  'Ruhige, erdende Behandlung mit Fokus auf Reflexzonen und Energiepunkte – unterstützt Entspannung und Körperwahrnehmung.',
  'Fußreflex und Energiepunkte',
  'Details',
  '/services/fussreflex-energie'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'de',
  'Intuitive Energetik Session',
  'intuitive-energetik-session-slider',
  'Intuitive energetische Sitzung – individuell nach Ihrem Tagesgefühl, achtsam und klar abgegrenzt.',
  'Intuitive Energetik Session',
  'Details',
  '/services/intuitive-energetik-session'
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
