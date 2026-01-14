-- =============================================================
-- 071_services_seed.sql (FINAL)
-- Home massage services — 6 types (TR + DE + EN)
-- Requires: 070_services.sql already applied
-- Idempotent: INSERT ... ON DUPLICATE KEY UPDATE
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- PARENT: services (non-i18n)
-- - category/sub_category YOK
-- - featured_image + image_url mirror
-- =============================================================

INSERT INTO `services`
(`id`, `type`, `featured`, `is_active`, `display_order`,
 `featured_image`, `image_url`, `image_asset_id`,
 `area`, `duration`, `maintenance`, `season`, `thickness`, `equipment`,
 `created_at`, `updated_at`)
VALUES
('90000000-0000-4000-8000-000000000001', 'other', 1, 1, 1,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp',
 NULL,
 'Tüm vücut', '60 dk', 'Haftada 1-2', 'Tüm yıl', 'Orta', 'Masaj yağı + havlu',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000002', 'other', 1, 1, 2,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870870/uploads/anastasia/service-images/47-1748870862808-617707981.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870870/uploads/anastasia/service-images/47-1748870862808-617707981.webp',
 NULL,
 'Sırt + omuz', '60 dk', 'Haftada 1', 'Tüm yıl', 'Sert', 'Masaj yağı + havlu',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000003', 'other', 0, 1, 3,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870873/uploads/anastasia/service-images/27-1748870868871-393082412.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870873/uploads/anastasia/service-images/27-1748870868871-393082412.webp',
 NULL,
 'Tüm vücut', '60 dk', 'İhtiyaca göre', 'Tüm yıl', 'Yumuşak', 'Aromaterapi yağları + havlu',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000004', 'other', 0, 1, 4,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870875/uploads/anastasia/service-images/23-1748870871149-393898680.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870875/uploads/anastasia/service-images/23-1748870871149-393898680.webp',
 NULL,
 'Ayak', '45 dk', 'Haftada 1', 'Tüm yıl', 'Orta', 'Krem + havlu',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000005', 'other', 0, 1, 5,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870453/uploads/anastasia/service-images/35-1748870449978-569571977.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870453/uploads/anastasia/service-images/35-1748870449978-569571977.webp',
 NULL,
 'Bacak + sırt', '60 dk', 'Antrenman sonrası', 'Tüm yıl', 'Orta/Sert', 'Masaj yağı + havlu',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000006', 'other', 0, 1, 6,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870469/uploads/anastasia/service-images/32-1748870457788-644704006.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870469/uploads/anastasia/service-images/32-1748870457788-644704006.webp',
 NULL,
 'Sırt + bel + bacak', '60 dk', 'İhtiyaca göre', 'Tüm yıl', 'Yumuşak', 'Yastık desteği + havlu',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `type`           = VALUES(`type`),
  `featured`       = VALUES(`featured`),
  `is_active`      = VALUES(`is_active`),
  `display_order`  = VALUES(`display_order`),
  `featured_image` = VALUES(`featured_image`),
  `image_url`      = VALUES(`image_url`),
  `image_asset_id` = VALUES(`image_asset_id`),
  `area`           = VALUES(`area`),
  `duration`       = VALUES(`duration`),
  `maintenance`    = VALUES(`maintenance`),
  `season`         = VALUES(`season`),
  `thickness`      = VALUES(`thickness`),
  `equipment`      = VALUES(`equipment`),
  `updated_at`     = VALUES(`updated_at`);

-- =============================================================
-- I18N: services_i18n (TR + DE + EN)
-- Note: slug lowercase + hyphen
-- =============================================================

INSERT INTO `services_i18n`
(`id`, `service_id`, `locale`,
 `slug`, `name`, `description`, `material`, `price`, `includes`, `warranty`, `image_alt`,
 `tags`, `meta_title`, `meta_description`, `meta_keywords`,
 `created_at`, `updated_at`)
VALUES

-- 1) Swedish / Klasik
('91000000-0000-4000-8000-000000000101', '90000000-0000-4000-8000-000000000001', 'tr',
 'isvec-klasik-masaj', 'İsveç (Klasik) Masajı',
 'Kasları gevşetmeye, dolaşımı desteklemeye ve genel rahatlamaya odaklanan klasik masaj. Ev ortamında sakin, ritmik dokunuşlarla uygulanır.',
 'Masaj yağı', '60 dk', 'Ön görüşme + klasik masaj + kısa esneme', '—',
 'İsveç masajı evde uygulama',
 'rahatlama,klasik,evde-masaj', 'İsveç (Klasik) Masajı | Evde Masaj',
 'Klasik İsveç masajı ile gevşeyin. Evde masaj hizmeti, sakin ve konforlu ortam.',
 'isvec,klasik,rahatlama,evde masaj',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000102', '90000000-0000-4000-8000-000000000001', 'de',
 'schwedische-klassische-massage', 'Schwedische (klassische) Massage',
 'Klassische Massage zur Lockerung der Muskulatur, Förderung der Durchblutung und Entspannung. Ruhige, rhythmische Griffe im häuslichen Umfeld.',
 'Massageöl', '60 Min.', 'Kurzes Vorgespräch + Massage + leichte Dehnung', '—',
 'Schwedische Massage zu Hause',
 'entspannung,klassisch,hausmassage', 'Schwedische Massage | Massage zu Hause',
 'Schwedische Massage für mehr Entspannung – komfortabel bei Ihnen zu Hause.',
 'schwedisch,klassisch,entspannung,massage zu hause',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000103', '90000000-0000-4000-8000-000000000001', 'en',
 'swedish-classic-massage', 'Swedish (Classic) Massage',
 'A classic massage focusing on relaxation, muscle release, and circulation support. Delivered with calm, rhythmic strokes in your home.',
 'Massage oil', '60 min', 'Brief consultation + massage + light stretching', '—',
 'Swedish massage at home',
 'relaxation,classic,home-massage', 'Swedish Massage | At-Home Massage',
 'Relax with a classic Swedish massage in the comfort of your home.',
 'swedish,classic,relaxation,at home massage',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 2) Deep tissue
('91000000-0000-4000-8000-000000000201', '90000000-0000-4000-8000-000000000002', 'tr',
 'derin-doku-masaji', 'Derin Doku Masajı',
 'Yoğun kas gerginliği ve sertlik bölgelerine odaklanan, daha derin basınçla uygulanan masaj. Özellikle sırt ve omuz hattında etkilidir.',
 'Masaj yağı', '60 dk', 'Ön değerlendirme + derin doku uygulaması', '—',
 'Derin doku masajı evde',
 'derin-doku,kas-gevsetme,evde-masaj', 'Derin Doku Masajı | Evde Masaj',
 'Sırt ve omuz gerginliğine yönelik derin doku masajı. Evde konforlu hizmet.',
 'derin doku,sirt,omuz,evde masaj',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000202', '90000000-0000-4000-8000-000000000002', 'de',
 'tiefengewebsmassage', 'Tiefengewebsmassage',
 'Massage mit tieferem Druck zur Behandlung von Verspannungen und verhärteten Bereichen – besonders im Rücken- und Schulterbereich.',
 'Massageöl', '60 Min.', 'Kurze Befundung + Tiefengewebsgriffe', '—',
 'Tiefengewebsmassage zu Hause',
 'tiefengewebe,verspannung,hausmassage', 'Tiefengewebsmassage | Massage zu Hause',
 'Gezielte Tiefengewebsmassage gegen Verspannungen – bequem bei Ihnen zu Hause.',
 'tiefengewebe,ruecken,schulter,massage zu hause',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000203', '90000000-0000-4000-8000-000000000002', 'en',
 'deep-tissue-massage', 'Deep Tissue Massage',
 'A firmer-pressure massage focusing on tight muscles and stiff areas, commonly targeting the back and shoulders.',
 'Massage oil', '60 min', 'Quick assessment + deep tissue work', '—',
 'Deep tissue massage at home',
 'deep-tissue,tension,home-massage', 'Deep Tissue Massage | At-Home Massage',
 'Targeted deep tissue massage for tension relief, delivered at home.',
 'deep tissue,back,shoulders,at home massage',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 3) Aromatherapy
('91000000-0000-4000-8000-000000000301', '90000000-0000-4000-8000-000000000003', 'tr',
 'aromaterapi-masaji', 'Aromaterapi Masajı',
 'Uygun esansiyel yağlarla desteklenen, zihinsel rahatlama ve stres azaltmaya odaklanan yumuşak bir masaj.',
 'Esansiyel yağlar', '60 dk', 'Yağ seçimi + aromaterapi masajı', '—',
 'Aromaterapi masajı evde',
 'aromaterapi,stres,rahatlama,evde-masaj', 'Aromaterapi Masajı | Evde Masaj',
 'Aromaterapi yağlarıyla stresinizi azaltın. Evde masaj hizmeti.',
 'aromaterapi,stres,rahatlama,evde masaj',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000302', '90000000-0000-4000-8000-000000000003', 'de',
 'aromatherapie-massage', 'Aromatherapie-Massage',
 'Sanfte Massage mit passenden ätherischen Ölen – fokus auf mentale Entspannung und Stressreduktion.',
 'Ätherische Öle', '60 Min.', 'Ölauswahl + Aromatherapie', '—',
 'Aromatherapie Massage zu Hause',
 'aroma,stress,entspannung,hausmassage', 'Aromatherapie-Massage | Massage zu Hause',
 'Stress reduzieren mit Aromatherapie – komfortabel bei Ihnen zu Hause.',
 'aromatherapie,stress,entspannung,massage zu hause',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000303', '90000000-0000-4000-8000-000000000003', 'en',
 'aromatherapy-massage', 'Aromatherapy Massage',
 'A gentle massage supported by selected essential oils, focused on relaxation and stress reduction.',
 'Essential oils', '60 min', 'Oil selection + aromatherapy session', '—',
 'Aromatherapy massage at home',
 'aromatherapy,stress,relaxation,home-massage', 'Aromatherapy Massage | At-Home Massage',
 'Reduce stress with aromatherapy oils, delivered in your home.',
 'aromatherapy,stress,relaxation,at home massage',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 4) Reflexology (feet)
('91000000-0000-4000-8000-000000000401', '90000000-0000-4000-8000-000000000004', 'tr',
 'refleksoloji-ayak-masaji', 'Refleksoloji (Ayak) Masajı',
 'Ayak tabanındaki refleks noktalarına odaklanan, rahatlama ve genel iyilik hâlini destekleyen uygulama.',
 'Krem', '45 dk', 'Kısa değerlendirme + refleks noktaları uygulaması', '—',
 'Ayak refleksoloji masajı',
 'refleksoloji,ayak,rahatlama,evde-masaj', 'Refleksoloji Ayak Masajı | Evde Masaj',
 'Ayak refleksoloji ile gevşeyin. Evde masaj hizmeti.',
 'refleksoloji,ayak masaji,evde masaj',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000402', '90000000-0000-4000-8000-000000000004', 'de',
 'reflexzonenmassage-fuss', 'Reflexzonenmassage (Fuß)',
 'Fokus auf Reflexpunkte an den Fußsohlen – unterstützt Entspannung und Wohlbefinden.',
 'Creme', '45 Min.', 'Kurzes Vorgespräch + Reflexzonen', '—',
 'Fuß-Reflexzonenmassage zu Hause',
 'reflexzonen,fuss,entspannung,hausmassage', 'Fuß-Reflexzonenmassage | Massage zu Hause',
 'Entspannen mit Reflexzonenmassage – bequem bei Ihnen zu Hause.',
 'reflexzonen,fussmassage,massage zu hause',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000403', '90000000-0000-4000-8000-000000000004', 'en',
 'reflexology-foot-massage', 'Reflexology (Foot) Massage',
 'A session focusing on reflex points on the feet, supporting relaxation and overall well-being.',
 'Cream', '45 min', 'Brief check-in + reflex point work', '—',
 'Foot reflexology at home',
 'reflexology,feet,relaxation,home-massage', 'Foot Reflexology | At-Home Massage',
 'Relax with reflexology in the comfort of your home.',
 'reflexology,foot massage,at home massage',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 5) Sports massage
('91000000-0000-4000-8000-000000000501', '90000000-0000-4000-8000-000000000005', 'tr',
 'spor-masaji', 'Spor Masajı',
 'Aktivite öncesi/sonrası kasları destekleyen, dolaşımı artırmaya ve toparlanmayı hızlandırmaya yönelik masaj.',
 'Masaj yağı', '60 dk', 'Bölgesel çalışma + toparlanma odaklı uygulama', '—',
 'Spor masajı evde',
 'spor,toparlanma,kas,evde-masaj', 'Spor Masajı | Evde Masaj',
 'Antrenman sonrası toparlanma için spor masajı. Evde masaj hizmeti.',
 'spor masaji,toparlanma,evde masaj',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000502', '90000000-0000-4000-8000-000000000005', 'de',
 'sportmassage', 'Sportmassage',
 'Massage zur Unterstützung der Muskulatur vor/nach Aktivität – fördert Durchblutung und Regeneration.',
 'Massageöl', '60 Min.', 'Fokusbereiche + Regenerationsgriffe', '—',
 'Sportmassage zu Hause',
 'sport,regeneration,muskeln,hausmassage', 'Sportmassage | Massage zu Hause',
 'Regeneration nach dem Training mit Sportmassage – bei Ihnen zu Hause.',
 'sportmassage,regeneration,massage zu hause',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000503', '90000000-0000-4000-8000-000000000005', 'en',
 'sports-massage', 'Sports Massage',
 'A massage that supports muscles before/after activity, helping circulation and recovery.',
 'Massage oil', '60 min', 'Targeted work + recovery-focused techniques', '—',
 'Sports massage at home',
 'sports,recovery,muscles,home-massage', 'Sports Massage | At-Home Massage',
 'Support recovery after training with an at-home sports massage.',
 'sports massage,recovery,at home massage',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 6) Pregnancy massage
('91000000-0000-4000-8000-000000000601', '90000000-0000-4000-8000-000000000006', 'tr',
 'gebelik-masaji', 'Gebelik Masajı',
 'Hamileliğe uygun, yumuşak ve güvenli tekniklerle bel/sırt ve bacaklarda rahatlama sağlamayı hedefleyen uygulama.',
 'Hipoalerjenik yağ', '60 dk', 'Konfor pozisyonlama + nazik uygulama', '—',
 'Gebelik masajı evde',
 'gebelik,rahatlama,yumusak,evde-masaj', 'Gebelik Masajı | Evde Masaj',
 'Hamileliğe uygun nazik masaj. Evde masaj hizmeti.',
 'gebelik masaji,hamile masaji,evde masaj',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000602', '90000000-0000-4000-8000-000000000006', 'de',
 'schwangerschaftsmassage', 'Schwangerschaftsmassage',
 'Sanfte, sichere Techniken – unterstützt Entlastung von Rücken/Beinen und fördert Wohlbefinden während der Schwangerschaft.',
 'Hypoallergenes Öl', '60 Min.', 'Bequeme Lagerung + sanfte Griffe', '—',
 'Schwangerschaftsmassage zu Hause',
 'schwangerschaft,sanft,entspannung,hausmassage', 'Schwangerschaftsmassage | Massage zu Hause',
 'Sanfte Massage in der Schwangerschaft – komfortabel bei Ihnen zu Hause.',
 'schwangerschaftsmassage,massage zu hause',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000603', '90000000-0000-4000-8000-000000000006', 'en',
 'pregnancy-massage', 'Pregnancy Massage',
 'A gentle, pregnancy-appropriate session using safe techniques to ease the back, hips, and legs.',
 'Hypoallergenic oil', '60 min', 'Comfort positioning + gentle techniques', '—',
 'Pregnancy massage at home',
 'pregnancy,gentle,relaxation,home-massage', 'Pregnancy Massage | At-Home Massage',
 'Gentle pregnancy massage delivered at home for comfort and relief.',
 'pregnancy massage,at home massage',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `slug`             = VALUES(`slug`),
  `name`             = VALUES(`name`),
  `description`      = VALUES(`description`),
  `material`         = VALUES(`material`),
  `price`            = VALUES(`price`),
  `includes`         = VALUES(`includes`),
  `warranty`         = VALUES(`warranty`),
  `image_alt`        = VALUES(`image_alt`),
  `tags`             = VALUES(`tags`),
  `meta_title`       = VALUES(`meta_title`),
  `meta_description` = VALUES(`meta_description`),
  `meta_keywords`    = VALUES(`meta_keywords`),
  `updated_at`       = VALUES(`updated_at`);

-- =============================================================
-- OPTIONAL: gallery images (1 image per service) + i18n
-- =============================================================

INSERT INTO `service_images`
(`id`, `service_id`, `image_asset_id`, `image_url`, `is_active`, `display_order`, `created_at`, `updated_at`)
VALUES
('92000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', NULL, 'https://picsum.photos/seed/swedish-gal/1200/800', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000002', NULL, 'https://picsum.photos/seed/deeptissue-gal/1200/800', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000003', NULL, 'https://picsum.photos/seed/aroma-gal/1200/800', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000004', '90000000-0000-4000-8000-000000000004', NULL, 'https://picsum.photos/seed/reflex-gal/1200/800', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000005', '90000000-0000-4000-8000-000000000005', NULL, 'https://picsum.photos/seed/sport-gal/1200/800', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000006', '90000000-0000-4000-8000-000000000006', NULL, 'https://picsum.photos/seed/pregnancy-gal/1200/800', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `image_asset_id` = VALUES(`image_asset_id`),
  `image_url`      = VALUES(`image_url`),
  `is_active`      = VALUES(`is_active`),
  `display_order`  = VALUES(`display_order`),
  `updated_at`     = VALUES(`updated_at`);

INSERT INTO `service_images_i18n`
(`id`, `image_id`, `locale`, `title`, `alt`, `caption`, `created_at`, `updated_at`)
VALUES
('93000000-0000-4000-8000-000000000101', '92000000-0000-4000-8000-000000000001', 'tr', 'İsveç Masajı', 'İsveç masajı görseli', 'Klasik rahatlama masajı', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000102', '92000000-0000-4000-8000-000000000001', 'de', 'Schwedische Massage', 'Bild: Schwedische Massage', 'Klassische Entspannung', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000103', '92000000-0000-4000-8000-000000000001', 'en', 'Swedish Massage', 'Swedish massage image', 'Classic relaxation', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000201', '92000000-0000-4000-8000-000000000002', 'tr', 'Derin Doku', 'Derin doku masajı görseli', 'Gerginlik odaklı uygulama', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000202', '92000000-0000-4000-8000-000000000002', 'de', 'Tiefengewebe', 'Bild: Tiefengewebsmassage', 'Gegen Verspannungen', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000203', '92000000-0000-4000-8000-000000000002', 'en', 'Deep Tissue', 'Deep tissue massage image', 'Tension-focused session', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000301', '92000000-0000-4000-8000-000000000003', 'tr', 'Aromaterapi', 'Aromaterapi masajı görseli', 'Esansiyel yağlarla rahatlama', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000302', '92000000-0000-4000-8000-000000000003', 'de', 'Aromatherapie', 'Bild: Aromatherapie', 'Mit ätherischen Ölen', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000303', '92000000-0000-4000-8000-000000000003', 'en', 'Aromatherapy', 'Aromatherapy massage image', 'Relaxation with essential oils', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000401', '92000000-0000-4000-8000-000000000004', 'tr', 'Refleksoloji', 'Ayak refleksoloji görseli', 'Ayak tabanı odaklı', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000402', '92000000-0000-4000-8000-000000000004', 'de', 'Reflexzonen', 'Bild: Fuß-Reflexzonen', 'Fußsohle im Fokus', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000403', '92000000-0000-4000-8000-000000000004', 'en', 'Reflexology', 'Foot reflexology image', 'Foot-focused session', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000501', '92000000-0000-4000-8000-000000000005', 'tr', 'Spor Masajı', 'Spor masajı görseli', 'Toparlanma odaklı', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000502', '92000000-0000-4000-8000-000000000005', 'de', 'Sportmassage', 'Bild: Sportmassage', 'Regeneration im Fokus', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000503', '92000000-0000-4000-8000-000000000005', 'en', 'Sports Massage', 'Sports massage image', 'Recovery-focused', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000601', '92000000-0000-4000-8000-000000000006', 'tr', 'Gebelik Masajı', 'Gebelik masajı görseli', 'Nazik ve konforlu', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000602', '92000000-0000-4000-8000-000000000006', 'de', 'Schwangerschaft', 'Bild: Schwangerschaftsmassage', 'Sanft und bequem', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000603', '92000000-0000-4000-8000-000000000006', 'en', 'Pregnancy Massage', 'Pregnancy massage image', 'Gentle and comfortable', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `alt`        = VALUES(`alt`),
  `caption`    = VALUES(`caption`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
