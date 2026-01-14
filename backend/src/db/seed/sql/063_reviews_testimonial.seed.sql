-- =============================================================
-- OPTIONAL: TESTIMONIAL reviews seed (safe)
-- - If reviews tables are missing, skip without failing the seed run
-- - target_type: 'testimonial'
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- ---------------------------
-- Table guards
-- ---------------------------
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

-- ---------------------------
-- Testimonial target ids (define your own)
-- Option A: single bucket id (recommended for homepage slider):
-- ---------------------------
SET @TESTIMONIAL_BUCKET := 'konigsmassage';

-- ---------------------------
-- Parent review ids (fixed)
-- 1 parent = 3 locale i18n
-- ---------------------------
SET @REV_TEST_1 := '55550101-5555-4444-8555-555555550101';
SET @REV_TEST_2 := '55550102-5555-4444-8555-555555550102';
SET @REV_TEST_3 := '55550103-5555-4444-8555-555555550103';

-- ---------------------------
-- Insert parents (reviews)
-- ---------------------------
SET @SQL_REVIEWS := IF(@HAS_REVIEWS > 0,
'INSERT INTO `reviews`
  (`id`, `target_type`, `target_id`,
   `name`, `email`,
   `rating`, `is_active`, `is_approved`, `display_order`,
   `likes_count`, `dislikes_count`, `helpful_count`,
   `submitted_locale`,
   `created_at`, `updated_at`)
VALUES
  (@REV_TEST_1, ''testimonial'', @TESTIMONIAL_BUCKET, ''Ayşe T.'',   ''ayse.t@example.com'',   5, 1, 1, 10,  8, 0, 7, ''tr'', NOW(3), NOW(3)),
  (@REV_TEST_2, ''testimonial'', @TESTIMONIAL_BUCKET, ''Michael R.'',''michael.r@example.com'',5, 1, 1, 20,  5, 0, 5, ''en'', NOW(3), NOW(3)),
  (@REV_TEST_3, ''testimonial'', @TESTIMONIAL_BUCKET, ''Laura K.'',  ''laura.k@example.com'',  5, 1, 1, 30,  4, 0, 4, ''de'', NOW(3), NOW(3))
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
  `updated_at`       = VALUES(`updated_at`);',
'SELECT ''SKIP: reviews table missing'' AS info;'
);

PREPARE stmt_reviews FROM @SQL_REVIEWS;
EXECUTE stmt_reviews;
DEALLOCATE PREPARE stmt_reviews;

-- ---------------------------
-- Insert i18n (review_i18n)
-- ---------------------------
SET @SQL_REVIEW_I18N := IF(@HAS_REVIEW_I18N > 0,
'INSERT INTO `review_i18n`
  (`id`, `review_id`, `locale`,
   `title`, `comment`, `admin_reply`,
   `created_at`, `updated_at`)
VALUES
  -- TESTIMONIAL #1 (TR)
  (''55550101-5555-4444-8555-555555551101'', @REV_TEST_1, ''tr'',
   ''Gerçekten fark ettiren bir deneyim'',
   ''Seans sonrası omuz ve boyun gerginliğim belirgin şekilde azaldı. Ortam çok temiz, yaklaşım profesyonel ve rahatlatıcıydı.'',
   NULL, NOW(3), NOW(3)),
  (''55550101-5555-4444-8555-555555551102'', @REV_TEST_1, ''en'',
   ''A noticeably better feeling'',
   ''After the session, my shoulder and neck tension eased significantly. Clean space, professional approach, and a very calming experience.'',
   NULL, NOW(3), NOW(3)),
  (''55550101-5555-4444-8555-555555551103'', @REV_TEST_1, ''de'',
   ''Spürbar besser nach der Behandlung'',
   ''Nach der Sitzung waren Schulter- und Nackenverspannungen deutlich reduziert. Sehr sauber, professionell und insgesamt sehr entspannend.'',
   NULL, NOW(3), NOW(3)),

  -- TESTIMONIAL #2
  (''55550102-5555-4444-8555-555555552201'', @REV_TEST_2, ''tr'',
   ''Spor sonrası toparlanmaya destek oldu'',
   ''Yoğun antrenman döneminde kas sertliği için gittim. Uygulama hedefe yönelikti; ertesi gün hareket kabiliyetim daha iyiydi.'',
   NULL, NOW(3), NOW(3)),
  (''55550102-5555-4444-8555-555555552202'', @REV_TEST_2, ''en'',
   ''Helped my recovery after training'',
   ''I went in due to muscle tightness during an intense training block. The treatment was focused and I felt more mobile the next day.'',
   NULL, NOW(3), NOW(3)),
  (''55550102-5555-4444-8555-555555552203'', @REV_TEST_2, ''de'',
   ''Sehr gut zur Regeneration'',
   ''Wegen Muskelhärte in einer intensiven Trainingsphase. Die Behandlung war zielgerichtet und am nächsten Tag fühlte ich mich beweglicher.'',
   NULL, NOW(3), NOW(3)),

  -- TESTIMONIAL #3
  (''55550103-5555-4444-8555-555555553301'', @REV_TEST_3, ''tr'',
   ''Hijyen ve konfor üst seviyede'',
   ''Her şey çok düzenliydi; iletişim net, uygulama nazik ama etkili. Kendimi güvende ve rahat hissettim.'',
   NULL, NOW(3), NOW(3)),
  (''55550103-5555-4444-8555-555555553302'', @REV_TEST_3, ''en'',
   ''High standards of hygiene and comfort'',
   ''Everything was well prepared; communication was clear, and the treatment was gentle but effective. I felt safe and comfortable.'',
   NULL, NOW(3), NOW(3)),
  (''55550103-5555-4444-8555-555555553303'', @REV_TEST_3, ''de'',
   ''Hygiene und Wohlbefinden auf hohem Niveau'',
   ''Alles war sehr gut vorbereitet; klare Kommunikation und eine sanfte, aber wirksame Behandlung. Ich habe mich sicher und wohl gefühlt.'',
   NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `title`       = VALUES(`title`),
  `comment`     = VALUES(`comment`),
  `admin_reply` = VALUES(`admin_reply`),
  `updated_at`  = VALUES(`updated_at`);',
'SELECT ''SKIP: review_i18n table missing'' AS info;'
);

PREPARE stmt_review_i18n FROM @SQL_REVIEW_I18N;
EXECUTE stmt_review_i18n;
DEALLOCATE PREPARE stmt_review_i18n;

COMMIT;
