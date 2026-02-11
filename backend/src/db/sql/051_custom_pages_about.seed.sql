-- =============================================================
-- FILE: 051_custom_pages_about.seed.sql (FINAL / FULL)
-- KÖNIG ENERGETIK — Kurumsal Sayfalar (About / Hakkımda / Über mich)
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

-- Ek görseller (seyahatler / atmosfer) — random/stok olabilir
SET @IMG_ABOUT_2 := 'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1600&q=80';
SET @IMG_ABOUT_3 := 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80';
SET @IMG_ABOUT_4 := 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80';

SET @IMAGES_JSON := JSON_ARRAY(@IMG_ABOUT_MAIN, @IMG_ABOUT_2, @IMG_ABOUT_3, @IMG_ABOUT_4);
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
  'Hakkımda',
  'hakkimda',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Merhaba, ben Anastasia König</h2>',
      '<p>Bonn’da <strong>KÖNIG ENERGETIK</strong> ile; sakin bir atmosferde, dikkatli dokunuş ve bilinçli varlıkla yürüyen <strong>enerjetik masaj</strong> seansları sunuyorum. ',
      'Her seans kişiye özeldir; amaç “yetişmek” değil, içe dönmek ve rahatlamaya alan açmaktır.</p>',

      '<h3>Masaj yaklaşımım</h3>',
      '<p>Seanslarda çoğu zaman gözlerim kapalı çalışırım. Böylece bedeni daha derinden hissedebilir, nefesin ritmini, kaslardaki gerilimi ve sinir sisteminin verdiği ince sinyalleri daha net takip edebilirim. ',
      'Seansın başlangıcında şükran (gratitude) ile iç frekansı yumuşatır; güvenli bir alanda sakinleşmeye eşlik ederim.</p>',

      '<h3>Yolculuklar & eğitimler</h3>',
      '<p>Tayland başta olmak üzere farklı ülkelerde edindiğim masaj tekniklerini, yıllar içinde geliştirdiğim sezgisel yaklaşım ile birleştiriyorum. ',
      'Her uygulama “bir protokol” değil; o gün bedeninin ve zihninin ihtiyaç duyduğu şeye saygılı bir cevap olarak şekillenir.</p>',

      '<h3>Sınırlar, güven ve hijyen</h3>',
      '<p>Seanslar <strong>net sınırlar</strong> içinde yürür: saygılı, açık iletişimli ve güven odaklı. Ortam her randevu öncesi özenle hazırlanır; hijyen benim için temel bir değerdir.</p>',

      '<h3>Randevu</h3>',
      '<ul>',
      '<li>Terminler randevu ile.</li>',
      '<li>Yalnızca kısa bir ön görüşme ve karşılıklı onay ile.</li>',
      '</ul>',

      '<p><em>Not:</em> Seanslar tıbbi tanı/tedavi yerine geçmez; amaç rahatlama ve beden farkındalığını desteklemektir.</p>'
    )
  ),
  'Bonn’da enerjetik masaj: bilinçli dokunuş, net sınırlar ve sakin bir atmosferde derin gevşeme için kişiye özel seanslar.',
  'Anastasia König — KÖNIG ENERGETIK',
  'KÖNIG ENERGETIK | Hakkımda',
  'Bonn’da enerjetik masaj seansları: sakin atmosfer, bilinçli dokunuş, güvenli alan ve net sınırlar. Randevu ön görüşme ile planlanır.',
  'koenig energetik,bonn,enerjetik masaj,anastasia koenig,rahatlama,beden farkindaligi,thai masaj,sezgisel seans',
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
  'About',
  'about',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Hello, I’m Anastasia König</h2>',
      '<p>In Bonn, I welcome you to <strong>KÖNIG ENERGETIK</strong> for <strong>energetic massage</strong> sessions in a calm, protected atmosphere. ',
      'The focus is inward: you can arrive, let go, and rest—without having to perform.</p>',

      '<h3>How I work</h3>',
      '<p>During the massage I often keep my eyes closed. It helps me stay deeply present and sense subtle tension patterns, breath rhythm, and the nervous system’s signals. ',
      'I begin with gratitude to soften the inner frequency and create a quiet, grounded space.</p>',

      '<h3>Travel & training</h3>',
      '<p>Techniques learned in Thailand and other countries flow into my work. Over time, they have merged with an intuitive approach—always respectful, and always individual.</p>',

      '<h3>Boundaries, trust, and hygiene</h3>',
      '<p>Sessions are held within <strong>clear boundaries</strong>, with open communication and a strong focus on safety and respect. The space is prepared carefully for each appointment.</p>',

      '<h3>Appointments</h3>',
      '<ul>',
      '<li>By arrangement.</li>',
      '<li>Only after a short pre-chat and consent.</li>',
      '</ul>',

      '<p><em>Note:</em> Sessions are not a substitute for medical diagnosis or treatment. The intention is relaxation and supporting body awareness.</p>'
    )
  ),
  'Energetic massage sessions in Bonn with mindful touch, clear boundaries, and a calm atmosphere. Appointments by arrangement after a short pre-chat.',
  'Anastasia König — KÖNIG ENERGETIK',
  'KÖNIG ENERGETIK | About',
  'Energetic massage in Bonn: mindful touch, clear boundaries, and a safe, calm space. Sessions are individual and arranged after a short conversation.',
  'koenig energetik,bonn,energetic massage,anastasia koenig,relaxation,body awareness,thai yoga massage,intuitive session',
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
  'Über mich',
  'ueber-mich',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Hallo, ich bin Anastasia König</h2>',
      '<p>In Bonn lade ich Sie bei <strong>KÖNIG ENERGETIK</strong> zu <strong>energetischen Massagen</strong> in ruhiger Atmosphäre ein. ',
      'Der Fokus richtet sich nach innen: ankommen, loslassen, zur Ruhe finden – ohne Erwartungen.</p>',

      '<h3>Meine Arbeitsweise</h3>',
      '<p>Während der Behandlung arbeite ich häufig mit geschlossenen Augen. Das unterstützt mich dabei, präsenter zu bleiben und feine Spannungsmuster, Atmung und Signale des Nervensystems bewusst wahrzunehmen. ',
      'Ich beginne mit Dankbarkeit, um einen klaren, warmen Raum für Entspannung zu öffnen.</p>',

      '<h3>Reisen & Ausbildung</h3>',
      '<p>Techniken, die ich u. a. in Thailand und auf meinen Reisen gelernt habe, fließen in meine Arbeit ein. Über die Jahre hat sich daraus eine intuitive, achtsame Praxis entwickelt – immer individuell und respektvoll.</p>',

      '<h3>Klare Grenzen, Vertrauen und Hygiene</h3>',
      '<p>Mir sind <strong>klare Grenzen</strong>, Sicherheit und ein wertschätzender Umgang sehr wichtig. Der Raum wird sorgfältig vorbereitet; Hygiene ist selbstverständlich.</p>',

      '<h3>Termin</h3>',
      '<ul>',
      '<li>Nach Vereinbarung.</li>',
      '<li>Nur nach kurzem Vorgespräch und Einverständnis.</li>',
      '</ul>',

      '<p><em>Hinweis:</em> Die Sitzungen ersetzen keine medizinische Diagnose oder Behandlung. Im Mittelpunkt stehen Entspannung und Körperwahrnehmung.</p>'
    )
  ),
  'Energetische Massage in Bonn: achtsame Berührung, klare Grenzen und ruhige Atmosphäre. Termine nach Vereinbarung nach kurzem Vorgespräch.',
  'Anastasia König — KÖNIG ENERGETIK',
  'KÖNIG ENERGETIK | Über mich',
  'Energetische Massage in Bonn: achtsame Berührung, klare Grenzen und ein sicherer Raum. Individuelle Sitzungen nach Vereinbarung.',
  'koenig energetik,bonn,energetische massage,anastasia koenig,entspannung,koerperwahrnehmung,thai yoga massage,intuitiv',
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
