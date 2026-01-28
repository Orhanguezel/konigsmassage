-- =============================================================
-- OPTIONAL: BLOG reviews seed (safe)
-- - If reviews tables are missing, skip without failing the seed run
-- =============================================================

SET @HAS_REVIEWS := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'reviews'
);

SET @HAS_REVIEW_I18N := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'review_i18n'
);

-- Blog page ids (must match your blog custom_pages seed)
SET @PAGE_BLOG_1 := '22222222-2222-3333-4444-555555555501';
SET @PAGE_BLOG_2 := '22222222-2222-3333-4444-555555555502';
SET @PAGE_BLOG_3 := '22222222-2222-3333-4444-555555555503';

-- Parent review ids (fixed)
SET @REV_BLOG_1 := '44440101-4444-4444-8444-444444440101';
SET @REV_BLOG_2 := '44440102-4444-4444-8444-444444440102';
SET @REV_BLOG_3 := '44440103-4444-4444-8444-444444440103';

-- ---------------------------
-- Insert parents (reviews)
-- ---------------------------
SET @SQL_REVIEWS := IF(@HAS_REVIEWS > 0,
"INSERT INTO `reviews`
  (`id`, `target_type`, `target_id`,
   `name`, `email`,
   `rating`, `is_active`, `is_approved`, `display_order`,
   `likes_count`, `dislikes_count`, `helpful_count`,
   `submitted_locale`,
   `created_at`, `updated_at`)
VALUES
  (@REV_BLOG_1, 'custom_page', @PAGE_BLOG_1, 'Merve K.',  'merve.k@example.com',  5, 1, 1, 210, 6, 0, 5, 'tr', NOW(3), NOW(3)),
  (@REV_BLOG_2, 'custom_page', @PAGE_BLOG_2, 'Daniel S.', 'daniel.s@example.com', 5, 1, 1, 220, 4, 0, 4, 'en', NOW(3), NOW(3)),
  (@REV_BLOG_3, 'custom_page', @PAGE_BLOG_3, 'Anna M.',   'anna.m@example.com',   4, 1, 1, 230, 2, 0, 2, 'de', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `target_type`      = VALUES(`target_type`),
  `target_id`        = VALUES(`target_id`),
  `name`             = VALUES(`name`),
  `email`            = VALUES(`email`),
  `rating`           = VALUES(`rating`),
  `is_active`        = VALUES(`is_active`),
  `is_approved`      = VALUES(`is_approved`),
  `display_order`    = VALUES(`display_order`),
  `likes_count`      = VALUES(`likes_count`),
  `dislikes_count`   = VALUES(`dislikes_count`),
  `helpful_count`    = VALUES(`helpful_count`),
  `submitted_locale` = VALUES(`submitted_locale`),
  `updated_at`       = VALUES(`updated_at`);",
"SELECT 'SKIP: reviews table missing' AS info;"
);

PREPARE stmt_reviews FROM @SQL_REVIEWS;
EXECUTE stmt_reviews;
DEALLOCATE PREPARE stmt_reviews;

-- ---------------------------
-- Insert i18n (review_i18n)
-- ---------------------------
SET @SQL_REVIEW_I18N := IF(@HAS_REVIEW_I18N > 0,
"INSERT INTO `review_i18n`
  (`id`, `review_id`, `locale`,
   `title`, `comment`, `admin_reply`,
   `created_at`, `updated_at`)
VALUES
  ('44440101-4444-4444-8444-444444441101', @REV_BLOG_1, 'tr',
   'Bağırsak sağlığı konusu çok iyi özetlenmiş',
   'Yazı hem anlaşılır hem de pratik. Su, lif ve fermente gıdalarla ilgili öneriler günlük rutine kolayca eklenebiliyor. “İkinci beyin” yaklaşımı özellikle dikkat çekici.',
   NULL, NOW(3), NOW(3)),
  ('44440101-4444-4444-8444-444444441102', @REV_BLOG_1, 'en',
   'Clear and practical gut health article',
   'Very easy to follow and actionable. The hydration, fiber and fermented foods tips are realistic for everyday life, and the “second brain” perspective is a great reminder.',
   NULL, NOW(3), NOW(3)),
  ('44440101-4444-4444-8444-444444441103', @REV_BLOG_1, 'de',
   'Sehr verständlich und alltagstauglich',
   'Der Beitrag ist klar strukturiert und praxisnah. Tipps zu Wasser, Ballaststoffen und fermentierten Lebensmitteln lassen sich gut in den Alltag integrieren; die „zweites Gehirn“-Perspektive ist ein guter Denkanstoß.',
   NULL, NOW(3), NOW(3)),

  ('44440102-4444-4444-8444-444444442201', @REV_BLOG_2, 'tr',
   'Kafeinsiz enerji için çok iyi öneriler',
   'Kahveye yüklenmeden enerji yükseltme fikri çok iyi anlatılmış. Uyku, sabah ışığı ve hareket önerileri basit ama etkili. Bitki çayı önerileri de yerinde.',
   NULL, NOW(3), NOW(3)),
  ('44440102-4444-4444-8444-444444442202', @REV_BLOG_2, 'en',
   'Helpful alternatives to caffeine',
   'Great suggestions without pushing stimulants. The focus on sleep rhythm, morning light and gentle movement feels sustainable, and the herbal tea ideas are a nice touch.',
   NULL, NOW(3), NOW(3)),
  ('44440102-4444-4444-8444-444444442203', @REV_BLOG_2, 'de',
   'Nachhaltige Energie ohne Koffein',
   'Sehr gute, realistische Empfehlungen. Schlafrhythmus, Morgenlicht und Bewegung sind sinnvoll erklärt, ohne „Wunderlösungen“. Die Hinweise zu Kräutertees passen ebenfalls gut.',
   NULL, NOW(3), NOW(3)),

  ('44440103-4444-4444-8444-444444443301', @REV_BLOG_3, 'tr',
   'Mevsimsel beslenme rehberi çok faydalı',
   'Mevsimlere göre neye ağırlık verileceği net. Özellikle yerel pazar ve “tabakta çeşit” vurgusu hoşuma gitti. Uygulaması kolay bir içerik.',
   NULL, NOW(3), NOW(3)),
  ('44440103-4444-4444-8444-444444443302', @REV_BLOG_3, 'en',
   'Great seasonal eating overview',
   'Simple, well structured and easy to apply. I like the practical season-by-season ideas and the emphasis on local markets and variety on the plate.',
   NULL, NOW(3), NOW(3)),
  ('44440103-4444-4444-8444-444444443303', @REV_BLOG_3, 'de',
   'Übersichtlich und praxisnah',
   'Der saisonale Überblick ist klar gegliedert und leicht umzusetzen. Besonders gut: die Ideen pro Jahreszeit sowie der Fokus auf Wochenmarkt, Vielfalt und einfache Anpassungen.',
   NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `title`       = VALUES(`title`),
  `comment`     = VALUES(`comment`),
  `admin_reply` = VALUES(`admin_reply`),
  `updated_at`  = VALUES(`updated_at`);",
"SELECT 'SKIP: review_i18n table missing' AS info;"
);

PREPARE stmt_review_i18n FROM @SQL_REVIEW_I18N;
EXECUTE stmt_review_i18n;
DEALLOCATE PREPARE stmt_review_i18n;
