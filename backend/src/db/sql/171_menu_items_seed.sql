-- ============================================================
-- FILE: 171_menu_items_seed.sql (KÖNIG ENERGETIK — FINAL)
-- menu_items + menu_items_i18n (tr, en, de)
-- Header: Home, About (submenu: About + FAQs), Treatments (6), Blog, Appointment
-- Footer: Quick Access, Treatments (6), Legal, Social
-- Standard:
--  ✅ NO SET @... constants
--  ✅ menu_items_i18n.id => UUID() (CHAR(36))
--  ✅ UPSERT relies on UNIQUE(menu_item_id, locale)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- ============================================================
-- 0) OPTIONAL CLEANUP (removes CONTACT items by fixed IDs)
--    If you don't want deletions, remove this whole block.
-- ============================================================
DELETE FROM menu_items_i18n
WHERE menu_item_id IN (
  '455c6ddf-658b-4c0f-8a9e-0b104708dd07', -- HEADER Contact (old)
  'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1117'  -- FOOTER Contact (old)
);

DELETE FROM menu_items
WHERE id IN (
  '455c6ddf-658b-4c0f-8a9e-0b104708dd07', -- HEADER Contact (old)
  'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1117'  -- FOOTER Contact (old)
);

-- ============================================================
-- 1) PARENT (menu_items)
-- ============================================================
INSERT INTO `menu_items`
(`id`, `parent_id`, `location`, `section_id`, `type`, `page_id`, `icon`, `order_num`, `is_active`)
VALUES
-- ------------------------
-- HEADER ROOT (NO CONTACT)
-- ------------------------
('fe8120b3-919a-49b8-8035-df6fd2a2433f', NULL, 'header', NULL, 'custom', NULL, NULL, 0, 1), -- Home
('25740da6-c0f2-4c1d-b131-998018699bfd', NULL, 'header', NULL, 'custom', NULL, NULL, 1, 1), -- About
('c47a1c3f-cea1-4780-9381-77336bc8ac59', NULL, 'header', NULL, 'custom', NULL, NULL, 2, 1), -- Treatments (label)
('555c6ddf-658b-4c0f-8a9e-0b104708dd01', NULL, 'header', NULL, 'custom', NULL, NULL, 3, 1), -- Blog (HEADER) ✅ new id
('8a2a7c1a-1111-4a11-8a11-8a2a7c1a0001', NULL, 'header', NULL, 'custom', NULL, NULL, 4, 1), -- Appointment

-- ------------------------
-- ABOUT SUBMENUS (About + FAQs)
-- ------------------------
('aaaa1111-2222-3333-4444-555555555555', '25740da6-c0f2-4c1d-b131-998018699bfd', 'header', NULL, 'custom', NULL, NULL, 0, 1), -- About
('aaaa1111-2222-3333-4444-999999999999', '25740da6-c0f2-4c1d-b131-998018699bfd', 'header', NULL, 'custom', NULL, NULL, 1, 1), -- FAQs

-- ------------------------
-- MASSAGE TYPES SUBMENUS (6 items)
-- ------------------------
('5a000001-1111-4111-8111-5a0000000001', 'c47a1c3f-cea1-4780-9381-77336bc8ac59', 'header', NULL, 'custom', NULL, NULL, 0, 1),
('5a000002-1111-4111-8111-5a0000000002', 'c47a1c3f-cea1-4780-9381-77336bc8ac59', 'header', NULL, 'custom', NULL, NULL, 1, 1),
('5a000003-1111-4111-8111-5a0000000003', 'c47a1c3f-cea1-4780-9381-77336bc8ac59', 'header', NULL, 'custom', NULL, NULL, 2, 1),
('5a000004-1111-4111-8111-5a0000000004', 'c47a1c3f-cea1-4780-9381-77336bc8ac59', 'header', NULL, 'custom', NULL, NULL, 3, 1),
('5a000005-1111-4111-8111-5a0000000005', 'c47a1c3f-cea1-4780-9381-77336bc8ac59', 'header', NULL, 'custom', NULL, NULL, 4, 1),
('5a000006-1111-4111-8111-5a0000000006', 'c47a1c3f-cea1-4780-9381-77336bc8ac59', 'header', NULL, 'custom', NULL, NULL, 5, 1),

-- ------------------------
-- FOOTER: QUICK ACCESS
-- section_id = Quick Access (5958...)
-- ------------------------
('6a4f6b37-ed99-4d98-8c54-d658096aacde', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 0, 1), -- FAQs
('b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1111', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 1, 1), -- About
('8a2a7c1a-1111-4a11-8a11-8a2a7c1a0002', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 2, 1), -- Appointment
('555c6ddf-658b-4c0f-8a9e-0b104708dd02', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 3, 1), -- Blog (FOOTER) ✅ new id
('b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1112', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 4, 1), -- Contact ✅ footer only

-- ------------------------
-- FOOTER: MASSAGE TYPES (6 links)
-- section_id = Treatments (a0e2...)
-- ------------------------
('c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111101', NULL, 'footer', 'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10', 'custom', NULL, NULL, 0, 1),
('c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111102', NULL, 'footer', 'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10', 'custom', NULL, NULL, 1, 1),
('c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111103', NULL, 'footer', 'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10', 'custom', NULL, NULL, 2, 1),
('c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111104', NULL, 'footer', 'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10', 'custom', NULL, NULL, 3, 1),
('c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111105', NULL, 'footer', 'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10', 'custom', NULL, NULL, 4, 1),
('c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111106', NULL, 'footer', 'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10', 'custom', NULL, NULL, 5, 1),

-- ------------------------
-- FOOTER: LEGAL
-- section_id = Legal (f942...)
-- ------------------------
('71c28444-7b6e-47ae-92be-f59206a1b820', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 0, 1), -- Privacy Policy
('24c49639-01d0-4274-8fb9-c31ed64d0726', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 1, 1), -- Terms

-- ------------------------
-- FOOTER: SOCIAL
-- section_id = Social (b3b7...)
-- ------------------------
('a9b1c2d3-e4f5-4a66-8b11-111111111111', NULL, 'footer', 'b3b7e7b2-7d75-4c5f-9b9d-8f0d3c1a0d77', 'custom', NULL, 'instagram', 0, 1),
('a9b1c2d3-e4f5-4a66-8b11-333333333333', NULL, 'footer', 'b3b7e7b2-7d75-4c5f-9b9d-8f0d3c1a0d77', 'custom', NULL, 'youtube', 1, 1)
ON DUPLICATE KEY UPDATE
  `parent_id`  = VALUES(`parent_id`),
  `location`   = VALUES(`location`),
  `section_id` = VALUES(`section_id`),
  `type`       = VALUES(`type`),
  `page_id`    = VALUES(`page_id`),
  `icon`       = VALUES(`icon`),
  `order_num`  = VALUES(`order_num`),
  `is_active`  = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- ============================================================
-- 2) I18N (tr)
-- ============================================================
INSERT INTO `menu_items_i18n`
(`id`, `menu_item_id`, `locale`, `title`, `url`, `created_at`, `updated_at`)
VALUES
-- HEADER ROOT
(UUID(),'fe8120b3-919a-49b8-8035-df6fd2a2433f','tr','Anasayfa','/','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'25740da6-c0f2-4c1d-b131-998018699bfd','tr','Hakkımızda','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c47a1c3f-cea1-4780-9381-77336bc8ac59','tr','Masaj Çeşitleri','/services','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd01','tr','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0001','tr','Randevu','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- ABOUT SUBMENU
(UUID(),'aaaa1111-2222-3333-4444-555555555555','tr','Hakkımızda','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'aaaa1111-2222-3333-4444-999999999999','tr','Sıkça Sorulan Sorular','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- TREATMENTS SUBMENU (TR)
(UUID(),'5a000001-1111-4111-8111-5a0000000001','tr','Enerjetik Rahatlama Masajı','/services/bonn-enerjetik-masaj','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000002-1111-4111-8111-5a0000000002','tr','Thai Yoga Masajı','/services/thai-yoga-masaj','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000003-1111-4111-8111-5a0000000003','tr','Sırt & Boyun Rahatlatma','/services/sirt-boyun-rahatlama','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000004-1111-4111-8111-5a0000000004','tr','Aroma Enerji Masajı','/services/aroma-enerji-masaji','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000005-1111-4111-8111-5a0000000005','tr','Ayak Refleks & Enerji Noktaları','/services/ayak-refleks-enerji','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000006-1111-4111-8111-5a0000000006','tr','Sezgisel Enerjetik Seans','/services/sezgisel-enerjetik-seans','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: QUICK ACCESS (TR)
(UUID(),'6a4f6b37-ed99-4d98-8c54-d658096aacde','tr','SSS','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1111','tr','Hakkımızda','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0002','tr','Randevu','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd02','tr','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1112','tr','İletişim','/contact','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: TREATMENTS (TR)
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111101','tr','Enerjetik Rahatlama Masajı','/services/bonn-enerjetik-masaj','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111102','tr','Thai Yoga Masajı','/services/thai-yoga-masaj','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111103','tr','Sırt & Boyun Rahatlatma','/services/sirt-boyun-rahatlama','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111104','tr','Aroma Enerji Masajı','/services/aroma-enerji-masaji','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111105','tr','Ayak Refleks & Enerji Noktaları','/services/ayak-refleks-enerji','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111106','tr','Sezgisel Enerjetik Seans','/services/sezgisel-enerjetik-seans','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: LEGAL (TR)
(UUID(),'71c28444-7b6e-47ae-92be-f59206a1b820','tr','Gizlilik Politikası','/privacy-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'24c49639-01d0-4274-8fb9-c31ed64d0726','tr','Kullanım Koşulları','/terms','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: SOCIAL (TR)
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-111111111111','tr','Instagram','https://www.instagram.com/koenigsmassage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-333333333333','tr','YouTube','https://www.youtube.com/@koenigsmassage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `url`        = VALUES(`url`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- ============================================================
-- 3) I18N (en)
-- ============================================================
INSERT INTO `menu_items_i18n`
(`id`, `menu_item_id`, `locale`, `title`, `url`, `created_at`, `updated_at`)
VALUES
-- HEADER ROOT
(UUID(),'fe8120b3-919a-49b8-8035-df6fd2a2433f','en','Home','/','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'25740da6-c0f2-4c1d-b131-998018699bfd','en','About','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c47a1c3f-cea1-4780-9381-77336bc8ac59','en','Treatments','/services','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd01','en','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0001','en','Appointment','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- ABOUT SUBMENU
(UUID(),'aaaa1111-2222-3333-4444-555555555555','en','About','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'aaaa1111-2222-3333-4444-999999999999','en','FAQs','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- TREATMENTS SUBMENU (EN)
(UUID(),'5a000001-1111-4111-8111-5a0000000001','en','Energetic Relaxation Massage','/services/energetic-massage-bonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000002-1111-4111-8111-5a0000000002','en','Thai Yoga Massage','/services/thai-yoga-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000003-1111-4111-8111-5a0000000003','en','Back & Neck Release','/services/back-neck-release','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000004-1111-4111-8111-5a0000000004','en','Aroma Energy Massage','/services/aroma-energy-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000005-1111-4111-8111-5a0000000005','en','Foot Reflex & Energy Points','/services/foot-reflex-energy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000006-1111-4111-8111-5a0000000006','en','Intuitive Energetic Session','/services/intuitive-energetic-session','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: QUICK ACCESS (EN)
(UUID(),'6a4f6b37-ed99-4d98-8c54-d658096aacde','en','FAQs','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1111','en','About','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0002','en','Appointment','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd02','en','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1112','en','Contact','/contact','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: TREATMENTS (EN)
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111101','en','Energetic Relaxation Massage','/services/energetic-massage-bonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111102','en','Thai Yoga Massage','/services/thai-yoga-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111103','en','Back & Neck Release','/services/back-neck-release','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111104','en','Aroma Energy Massage','/services/aroma-energy-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111105','en','Foot Reflex & Energy Points','/services/foot-reflex-energy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111106','en','Intuitive Energetic Session','/services/intuitive-energetic-session','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: LEGAL (EN)
(UUID(),'71c28444-7b6e-47ae-92be-f59206a1b820','en','Privacy Policy','/privacy-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'24c49639-01d0-4274-8fb9-c31ed64d0726','en','Terms of Use','/terms','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: SOCIAL (EN)
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-111111111111','en','Instagram','https://www.instagram.com/koenigsmassage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-333333333333','en','YouTube','https://www.youtube.com/@koenigsmassage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `url`        = VALUES(`url`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- ============================================================
-- 4) I18N (de)
-- ============================================================
INSERT INTO `menu_items_i18n`
(`id`, `menu_item_id`, `locale`, `title`, `url`, `created_at`, `updated_at`)
VALUES
-- HEADER ROOT
(UUID(),'fe8120b3-919a-49b8-8035-df6fd2a2433f','de','Startseite','/','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'25740da6-c0f2-4c1d-b131-998018699bfd','de','Über uns','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c47a1c3f-cea1-4780-9381-77336bc8ac59','de','Behandlungen','/services','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd01','de','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0001','de','Termin','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- ABOUT SUBMENU
(UUID(),'aaaa1111-2222-3333-4444-555555555555','de','Über uns','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'aaaa1111-2222-3333-4444-999999999999','de','FAQ','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- TREATMENTS SUBMENU (DE)
(UUID(),'5a000001-1111-4111-8111-5a0000000001','de','Energetische Entspannungsmassage','/services/energetische-massage-bonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000002-1111-4111-8111-5a0000000002','de','Thai Yoga Massage','/services/thai-yoga-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000003-1111-4111-8111-5a0000000003','de','Rücken & Nacken Release','/services/ruecken-nacken-release','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000004-1111-4111-8111-5a0000000004','de','Aroma-Energie Massage','/services/aroma-energie-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000005-1111-4111-8111-5a0000000005','de','Fußreflex & Energiepunkte','/services/fussreflex-energie','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'5a000006-1111-4111-8111-5a0000000006','de','Intuitive Energetik Session','/services/intuitive-energetik-session','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: QUICK ACCESS (DE)
(UUID(),'6a4f6b37-ed99-4d98-8c54-d658096aacde','de','FAQ','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1111','de','Über uns','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0002','de','Termin','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd02','de','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1112','de','Kontakt','/contact','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: TREATMENTS (DE)
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111101','de','Energetische Entspannungsmassage','/services/energetische-massage-bonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111102','de','Thai Yoga Massage','/services/thai-yoga-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111103','de','Rücken & Nacken Release','/services/ruecken-nacken-release','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111104','de','Aroma-Energie Massage','/services/aroma-energie-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111105','de','Fußreflex & Energiepunkte','/services/fussreflex-energie','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111106','de','Intuitive Energetik Session','/services/intuitive-energetik-session','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: LEGAL (DE)
(UUID(),'71c28444-7b6e-47ae-92be-f59206a1b820','de','Datenschutzerklärung','/privacy-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'24c49639-01d0-4274-8fb9-c31ed64d0726','de','Nutzungsbedingungen','/terms','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: SOCIAL (DE)
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-111111111111','de','Instagram','https://www.instagram.com/koenigsmassage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-333333333333','de','YouTube','https://www.youtube.com/@koenigsmassage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `url`        = VALUES(`url`),
  `updated_at` = CURRENT_TIMESTAMP(3);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
