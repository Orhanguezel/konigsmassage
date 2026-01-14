-- =============================================================
-- FILE: 051_custom_pages_about.seed.sql (FINAL / FULL)
-- Königs Massage — Kurumsal Sayfalar (About / Hakkımda / Über mich)
-- ✅ module_key PARENT: custom_pages.module_key = 'about'
-- ✅ NO categories + sub_categories
-- ✅ images + storage_image_ids JSON-string güvenli yazılır
-- ✅ TR / EN / DE içerik
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- SABİT SAYFA ID (custom_pages.id)
-- -------------------------------------------------------------
SET @PAGE_ABOUT := '11111111-2222-3333-4444-555555555573';

-- -------------------------------------------------------------
-- PARENT MODULE KEY
-- -------------------------------------------------------------
SET @MODULE_KEY := 'about';

-- -------------------------------------------------------------
-- GÖRSEL URL’LERİ (Senin örnek URL’in)
-- -------------------------------------------------------------
SET @IMG_ABOUT_MAIN :=
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1768222471/site-media/about.png';

-- İstersen ek görsel koy:
-- SET @IMG_ABOUT_2 := 'https://images.unsplash.com/photo-...';
-- SET @IMG_ABOUT_3 := 'https://images.unsplash.com/photo-...';

SET @IMAGES_JSON := JSON_ARRAY(@IMG_ABOUT_MAIN);
SET @STORAGE_IMAGE_IDS_JSON := JSON_ARRAY();

-- -------------------------------------------------------------
-- PARENT UPSERT (custom_pages)
-- -------------------------------------------------------------
INSERT INTO `custom_pages`
  (`id`,
   `module_key`,
   `is_published`,
   `display_order`,
   `order_num`,
   `featured_image`,
   `featured_image_asset_id`,
   `image_url`,
   `storage_asset_id`,
   `images`,
   `storage_image_ids`,
   `created_at`,
   `updated_at`)
VALUES
  (
    @PAGE_ABOUT,
    @MODULE_KEY,
    1,
    10,
    10,
    @IMG_ABOUT_MAIN,
    NULL,
    @IMG_ABOUT_MAIN,
    NULL,
    CAST(@IMAGES_JSON AS CHAR),
    CAST(@STORAGE_IMAGE_IDS_JSON AS CHAR),
    NOW(3),
    NOW(3)
  )
ON DUPLICATE KEY UPDATE
  `module_key`               = VALUES(`module_key`),
  `is_published`             = VALUES(`is_published`),
  `display_order`            = VALUES(`display_order`),
  `order_num`                = VALUES(`order_num`),
  `featured_image`           = VALUES(`featured_image`),
  `featured_image_asset_id`  = VALUES(`featured_image_asset_id`),
  `image_url`                = VALUES(`image_url`),
  `storage_asset_id`         = VALUES(`storage_asset_id`),
  `images`                   = VALUES(`images`),
  `storage_image_ids`        = VALUES(`storage_image_ids`),
  `updated_at`               = VALUES(`updated_at`);

-- -------------------------------------------------------------
-- I18N UPSERT – TR / EN / DE
-- -------------------------------------------------------------
INSERT INTO `custom_pages_i18n`
  (`id`,
   `page_id`,
   `locale`,
   `title`,
   `slug`,
   `content`,
   `summary`,
   `featured_image_alt`,
   `meta_title`,
   `meta_description`,
   `tags`,
   `created_at`,
   `updated_at`)
VALUES

-- =========================
-- TR — Hakkımda
-- =========================
(
  UUID(),
  @PAGE_ABOUT,
  'tr',
  'Königs Massage — Hakkımda',
  'hakkimda',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Merhaba, ben Anastasia</h2>',
      '<p>Bonn’da, <strong>Königs Massage</strong> çatısı altında klasik masaj, spor masajı ve fasya terapisi odaklı seanslar sunuyorum. ',
      'Her seansı, kişinin ihtiyacına göre planlıyor; bedenin rahatlamasını ve hareket kabiliyetinin desteklenmesini hedefliyorum.</p>',

      '<h3>Yaklaşımım</h3>',
      '<p>Masajı yalnızca kısa süreli gevşeme olarak değil; stresin azalması, kas gerginliğinin hafiflemesi ve genel iyilik halinin güçlenmesi için ',
      'bütüncül bir bakım olarak görüyorum. Seans öncesinde kısa bir değerlendirme yapar, hedefinizi netleştirir ve buna göre uygulamayı şekillendiririm.</p>',

      '<h3>Hijyen ve konfor</h3>',
      '<p>Benim için <strong>üst düzey hijyen</strong>, güven ve konfor vazgeçilmezdir. Seans ortamı düzenli olarak hazırlanır; ',
      'kullanılan materyaller her randevuda titizlikle yenilenir.</p>',

      '<h3>Doğal yaşam ve beslenme</h3>',
      '<p>Doğal yaşam ve sağlıklı beslenme konularına da ilgi duyuyorum. Dilerseniz seans sonrası basit ve uygulanabilir önerileri paylaşabilir, ',
      'günlük rutininizi destekleyecek küçük dokunuşlar üzerine konuşabiliriz.</p>',

      '<p><strong>Kendinize iyi bakmak</strong>, biraz nefes almak ve bedeninizi yeniden dengelemek istediğinizde; ',
      'sizi Königs Massage’ta memnuniyetle ağırlamak isterim.</p>'
    )
  ),
  'Bonn’da klasik ve spor masajı ile fasya terapisi odaklı, kişiye özel ve hijyen standartları yüksek seanslar.',
  'Königs Massage Bonn — masaj terapisi',
  'Königs Massage | Hakkımda',
  'Bonn’da Königs Massage: klasik masaj, spor masajı ve fasya terapisi odaklı kişiye özel seanslar. Hijyen, konfor ve bütüncül yaklaşım.',
  'konigs massage,bonn,masaj,klasik masaj,spor masaji,fasya terapisi,hijyen,kisiye ozel',
  NOW(3),
  NOW(3)
),

-- =========================
-- EN — About
-- =========================
(
  UUID(),
  @PAGE_ABOUT,
  'en',
  'Königs Massage — About',
  'about',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Hello, I’m Anastasia</h2>',
      '<p>Based in Bonn, I welcome you to <strong>Königs Massage</strong> for sessions focused on classic massage, sports massage, and fascia therapy. ',
      'Each appointment is tailored to your needs, with the goal of supporting relaxation, mobility, and overall well-being.</p>',

      '<h3>My approach</h3>',
      '<p>I see massage not only as short-term relaxation, but as a mindful form of self-care that can help reduce stress, ease muscular tension, ',
      'and support long-term comfort. Before each session, we do a brief check-in to understand your goals and adapt the treatment accordingly.</p>',

      '<h3>Hygiene and comfort</h3>',
      '<p><strong>High hygiene standards</strong>, trust, and comfort are essential. The space is prepared carefully and materials are refreshed for every visit.</p>',

      '<h3>Natural living & nutrition</h3>',
      '<p>I also enjoy sharing practical insights on natural living and healthy nutrition—simple, realistic ideas that can support your day-to-day routine, ',
      'if you would like.</p>',

      '<p>If you are looking to <strong>reset your body and mind</strong>, breathe, and take good care of yourself, I will be happy to welcome you at Königs Massage.</p>'
    )
  ),
  'Massage therapist in Bonn offering tailored sessions in classic massage, sports massage, and fascia therapy with a strong focus on hygiene and comfort.',
  'Königs Massage Bonn — massage therapy',
  'Königs Massage | About',
  'Königs Massage in Bonn: tailored sessions in classic massage, sports massage, and fascia therapy. A holistic approach with high hygiene standards.',
  'konigs massage,bonn,massage,classic massage,sports massage,fascia therapy,hygiene,personalized',
  NOW(3),
  NOW(3)
),

-- =========================
-- DE — Über mich
-- =========================
(
  UUID(),
  @PAGE_ABOUT,
  'de',
  'Königs Massage — Über mich',
  'ueber-mich',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Hallo, ich bin Anastasia</h2>',
      '<p>In Bonn begrüße ich Sie bei <strong>Königs Massage</strong> zu Behandlungen mit Fokus auf klassische Massage, Sportmassage und Faszientherapie. ',
      'Jede Sitzung wird individuell auf Ihre Bedürfnisse abgestimmt – mit dem Ziel, Entspannung, Beweglichkeit und Wohlbefinden zu fördern.</p>',

      '<h3>Mein Ansatz</h3>',
      '<p>Massage ist für mich mehr als kurzfristige Entspannung: Sie ist eine bewusste Form der Selbstfürsorge, die Stress reduzieren, Muskelverspannungen lösen ',
      'und das Körpergefühl nachhaltig unterstützen kann. Vor jeder Behandlung klären wir in einem kurzen Gespräch Ihre Ziele und passen die Anwendung daran an.</p>',

      '<h3>Hygiene und Wohlfühlatmosphäre</h3>',
      '<p><strong>Höchste Hygienestandards</strong>, Vertrauen und Komfort sind für mich selbstverständlich. Der Raum wird sorgfältig vorbereitet, ',
      'Materialien werden für jeden Termin frisch bereitgestellt.</p>',

      '<h3>Natürlich leben & gesund essen</h3>',
      '<p>Auf Wunsch teile ich gern praktische Impulse zu natürlicher Lebensweise und gesunder Ernährung – unkompliziert, alltagstauglich und unterstützend.</p>',

      '<p>Wenn Sie <strong>Körper und Geist</strong> zur Ruhe bringen, durchatmen und sich etwas Gutes tun möchten, freue ich mich, Sie bei Königs Massage willkommen zu heißen.</p>'
    )
  ),
  'Masseurin in Bonn: individuelle Behandlungen in klassischer Massage, Sportmassage und Faszientherapie – mit Fokus auf Hygiene, Vertrauen und Wohlbefinden.',
  'Königs Massage Bonn — Massage & Faszientherapie',
  'Königs Massage | Über mich',
  'Königs Massage in Bonn: klassische Massage, Sportmassage und Faszientherapie. Individuell abgestimmt, ganzheitlich und mit hohen Hygienestandards.',
  'koenigs massage,bonn,massage,klassische massage,sportmassage,faszientherapie,hygiene,individuell',
  NOW(3),
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
