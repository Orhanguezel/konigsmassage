-- =============================================================
-- FILE: 040_site_settings.sql (koenigsmassage) – MULTI-LOCALE (Dynamic) [FINAL]
--  - app_locales + default_locale => locale='*'
--  - localized settings => locale in ('tr','en','de')
--  - cookie_consent => LOCALIZED (tr/en/de)
--  - booking admin notifications => GLOBAL (booking_admin_emails, booking_admin_notification_enabled)
--  - SECURITY: no secrets in seed (smtp_password, cloudinary_api_secret placeholder)
--  - RERUNNABLE: deterministic upsert via (key, locale) id reuse
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- =============================================================
-- TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id`         CHAR(36)      NOT NULL,
  `key`        VARCHAR(100)  NOT NULL,
  `locale`     VARCHAR(8)    NOT NULL,
  `value`      TEXT          NOT NULL,
  `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_locale_uq` (`key`, `locale`),
  KEY `site_settings_key_idx` (`key`),
  KEY `site_settings_locale_idx` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- GLOBAL: app_locales (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='app_locales' AND `locale`='*' LIMIT 1), UUID()),
  'app_locales',
  '*',
  CAST(
    JSON_ARRAY(
      JSON_OBJECT('code','de','label','Deutsch','is_default', TRUE,  'is_active', TRUE),
      JSON_OBJECT('code','en','label','English','is_default', FALSE, 'is_active', TRUE),
      JSON_OBJECT('code','tr','label','Türkçe','is_default', FALSE, 'is_active', TRUE)
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: default_locale (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='default_locale' AND `locale`='*' LIMIT 1), UUID()),
  'default_locale',
  '*',
  'de',
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Public Base URL (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='public_base_url' AND `locale`='*' LIMIT 1), UUID()),
  'public_base_url',
  '*',
  'https://www.koenigsmassage.com',
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Booking Admin Notification (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='booking_admin_notification_enabled' AND `locale`='*' LIMIT 1), UUID()),
  'booking_admin_notification_enabled',
  '*',
  'true',
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='booking_admin_emails' AND `locale`='*' LIMIT 1), UUID()),
  'booking_admin_emails',
  '*',
  CAST(JSON_ARRAY('info@koenigsmassage.com') AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: TR içerik ayarları
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_title' AND `locale`='tr' LIMIT 1), UUID()),
  'site_title',
  'tr',
  'Königs Massage',
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='contact_info' AND `locale`='tr' LIMIT 1), UUID()),
  'contact_info',
  'tr',
  CAST(JSON_OBJECT(
    'companyName','Königs Massage',
    'phones',JSON_ARRAY('+49 176 41107158'),
    'email','info@koenigsmassage.com',
    'address','Bonn — randevu ile',
    'addressSecondary','',
    'whatsappNumber','+49 176 41107158',
    'website','https://www.koenigsmassage.com',
    'notes','Randevu ve sorularınız için e-posta veya WhatsApp üzerinden ulaşabilirsiniz.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='socials' AND `locale`='tr' LIMIT 1), UUID()),
  'socials',
  'tr',
  CAST(JSON_OBJECT(
    'instagram','https://instagram.com/koenigsmassage',
    'facebook','',
    'youtube','',
    'linkedin','',
    'x','',
    'tiktok',''
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='company_profile' AND `locale`='tr' LIMIT 1), UUID()),
  'company_profile',
  'tr',
  CAST(JSON_OBJECT(
    'headline','Masaj ve Wellness ile Daha Iyi Hisset',
    'subline','Kişiye özel seanslar ve blog içerikleri: rahatlama, stres yönetimi, hareket ve beslenme.',
    'body','Königs Massage, masaj ve wellness odaklı bir randevu ve içerik platformudur. Amacımız; iyi hissetmenize yardımcı olacak bir deneyim sunmak ve blog bölümünde rahatlama, duruş-esneme, stres yönetimi ve beslenme üzerine pratik içerikler paylaşmaktır.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='company_brand' AND `locale`='tr' LIMIT 1), UUID()),
  'company_brand',
  'tr',
  CAST(JSON_OBJECT(
    'name','Königs Massage',
    'shortName','Königs',
    'website','https://www.koenigsmassage.com',
    'logo',JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
      'width',120,
      'height',120,
      'alt','Königs Massage Logo'
    ),
    'images',JSON_ARRAY(
      JSON_OBJECT('type','logo','url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png')
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='catalog_admin_user_ids' AND `locale`='tr' LIMIT 1), UUID()),
  'catalog_admin_user_ids',
  'tr',
  CAST(JSON_ARRAY() AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: EN içerik ayarları
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_title' AND `locale`='en' LIMIT 1), UUID()),
  'site_title',
  'en',
  'Königs Massage',
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='contact_info' AND `locale`='en' LIMIT 1), UUID()),
  'contact_info',
  'en',
  CAST(JSON_OBJECT(
    'companyName','Königs Massage',
    'phones',JSON_ARRAY('+49 176 41107158'),
    'email','info@koenigsmassage.com',
    'address','Bonn — by appointment',
    'addressSecondary','',
    'whatsappNumber','+49 176 41107158',
    'website','https://www.koenigsmassage.com',
    'notes','For bookings and questions, contact via email or WhatsApp.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='socials' AND `locale`='en' LIMIT 1), UUID()),
  'socials',
  'en',
  CAST(JSON_OBJECT(
    'instagram','https://instagram.com/koenigsmassage',
    'facebook','',
    'youtube','',
    'linkedin','',
    'x','',
    'tiktok',''
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='company_profile' AND `locale`='en' LIMIT 1), UUID()),
  'company_profile',
  'en',
  CAST(JSON_OBJECT(
    'headline','Feel Better with Massage and Wellness',
    'subline','Personalized sessions and blog content: relaxation, stress management, mobility and nutrition.',
    'body','Königs Massage is a massage and wellness booking and content platform. Our goal is to offer a great experience and share practical blog content about relaxation, posture and stretching, stress management and nutrition.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='company_brand' AND `locale`='en' LIMIT 1), UUID()),
  'company_brand',
  'en',
  CAST(JSON_OBJECT(
    'name','Königs Massage',
    'shortName','Königs',
    'website','https://www.koenigsmassage.com',
    'logo',JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
      'width',120,
      'height',120,
      'alt','Königs Massage Logo'
    ),
    'images',JSON_ARRAY(
      JSON_OBJECT('type','logo','url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png')
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: DE içerik ayarları
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_title' AND `locale`='de' LIMIT 1), UUID()),
  'site_title',
  'de',
  'Königs Massage',
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='contact_info' AND `locale`='de' LIMIT 1), UUID()),
  'contact_info',
  'de',
  CAST(JSON_OBJECT(
    'companyName','Königs Massage',
    'phones',JSON_ARRAY('+49 176 41107158'),
    'email','info@koenigsmassage.com',
    'address','Bonn — nach Terminvereinbarung',
    'addressSecondary','',
    'whatsappNumber','+49 176 41107158',
    'website','https://www.koenigsmassage.com',
    'notes','Für Termine und Fragen kontaktieren Sie mich per E-Mail oder WhatsApp.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='socials' AND `locale`='de' LIMIT 1), UUID()),
  'socials',
  'de',
  CAST(JSON_OBJECT(
    'instagram','https://instagram.com/koenigsmassage',
    'facebook','',
    'youtube','',
    'linkedin','',
    'x','',
    'tiktok',''
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='company_profile' AND `locale`='de' LIMIT 1), UUID()),
  'company_profile',
  'de',
  CAST(JSON_OBJECT(
    'headline','Besser fühlen mit Massage und Wellness',
    'subline','Individuelle Termine und Blog-Inhalte: Entspannung, Stressmanagement, Mobilität und Ernährung.',
    'body','Königs Massage ist eine Plattform für Massage und Wellness mit Termin- und Content-Bereich. Ziel ist ein gutes Erlebnis sowie praktische Blogbeiträge zu Entspannung, Haltung und Dehnung, Stressmanagement und Ernährung.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='company_brand' AND `locale`='de' LIMIT 1), UUID()),
  'company_brand',
  'de',
  CAST(JSON_OBJECT(
    'name','Königs Massage',
    'shortName','Königs',
    'website','https://www.koenigsmassage.com',
    'logo',JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
      'width',120,
      'height',120,
      'alt','Königs Massage Logo'
    ),
    'images',JSON_ARRAY(
      JSON_OBJECT('type','logo','url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png')
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Storage (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='storage_driver' AND `locale`='*' LIMIT 1), UUID()), 'storage_driver', '*', 'cloudinary', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='storage_local_root' AND `locale`='*' LIMIT 1), UUID()), 'storage_local_root', '*', '/var/www/koenigsmassage/uploads', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='storage_local_base_url' AND `locale`='*' LIMIT 1), UUID()), 'storage_local_base_url', '*', '/uploads', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='cloudinary_cloud_name' AND `locale`='*' LIMIT 1), UUID()), 'cloudinary_cloud_name', '*', 'dbozv7wqd', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='cloudinary_api_key' AND `locale`='*' LIMIT 1), UUID()), 'cloudinary_api_key', '*', '644676135993432', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='cloudinary_api_secret' AND `locale`='*' LIMIT 1), UUID()), 'cloudinary_api_secret', '*', 'change-me-in-admin', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='cloudinary_folder' AND `locale`='*' LIMIT 1), UUID()), 'cloudinary_folder', '*', 'uploads/koenigsmassage', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='cloudinary_unsigned_preset' AND `locale`='*' LIMIT 1), UUID()), 'cloudinary_unsigned_preset', '*', 'koenigsmassage_unsigned', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='storage_cdn_public_base' AND `locale`='*' LIMIT 1), UUID()), 'storage_cdn_public_base', '*', 'https://res.cloudinary.com', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='storage_public_api_base' AND `locale`='*' LIMIT 1), UUID()), 'storage_public_api_base', '*', 'https://www.koenigsmassage.com/api', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: SMTP (locale='*')  (placeholders; set real values via Admin)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='smtp_host' AND `locale`='*' LIMIT 1), UUID()), 'smtp_host', '*', 'smtp.example.com', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='smtp_port' AND `locale`='*' LIMIT 1), UUID()), 'smtp_port', '*', '465', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='smtp_username' AND `locale`='*' LIMIT 1), UUID()), 'smtp_username', '*', 'no-reply@koenigsmassage.com', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='smtp_password' AND `locale`='*' LIMIT 1), UUID()), 'smtp_password', '*', 'change-me-in-admin', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='smtp_from_email' AND `locale`='*' LIMIT 1), UUID()), 'smtp_from_email', '*', 'no-reply@koenigsmassage.com', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='smtp_from_name' AND `locale`='*' LIMIT 1), UUID()), 'smtp_from_name', '*', 'Königs Massage', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='smtp_ssl' AND `locale`='*' LIMIT 1), UUID()), 'smtp_ssl', '*', 'true', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Google OAuth (locale='*')  (optional; placeholders)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='google_client_id' AND `locale`='*' LIMIT 1), UUID()), 'google_client_id', '*', 'change-me-in-admin', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='google_client_secret' AND `locale`='*' LIMIT 1), UUID()), 'google_client_secret', '*', 'change-me-in-admin', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: GTM + GA4 (locale='*')  (optional; placeholders)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='gtm_container_id' AND `locale`='*' LIMIT 1), UUID()), 'gtm_container_id', '*', '', NOW(3), NOW(3)),
(COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='ga4_measurement_id' AND `locale`='*' LIMIT 1), UUID()), 'ga4_measurement_id', '*', '', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Site Media (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_logo' AND `locale`='*' LIMIT 1), UUID()),
  'site_logo',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
    'width',120,
    'height',120,
    'alt','Königs Massage Logo'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_logo_dark' AND `locale`='*' LIMIT 1), UUID()),
  'site_logo_dark',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
    'width',120,
    'height',120,
    'alt','Königs Massage Logo (Dark)'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_logo_light' AND `locale`='*' LIMIT 1), UUID()),
  'site_logo_light',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
    'width',120,
    'height',120,
    'alt','Königs Massage Logo (Light)'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_favicon' AND `locale`='*' LIMIT 1), UUID()),
  'site_favicon',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768222395/site-media/favicon.png',
    'alt','Königs Massage Favicon'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_apple_touch_icon' AND `locale`='*' LIMIT 1), UUID()),
  'site_apple_touch_icon',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
    'alt','Königs Massage Apple Touch Icon'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_app_icon_512' AND `locale`='*' LIMIT 1), UUID()),
  'site_app_icon_512',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
    'alt','Königs Massage App Icon (512x512)'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='site_og_default_image' AND `locale`='*' LIMIT 1), UUID()),
  'site_og_default_image',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768222471/site-media/about.png',
    'width',1200,
    'height',630,
    'alt','Königs Massage – Massage and Wellness'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: Cookie Consent Config (tr/en/de)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='cookie_consent' AND `locale`='tr' LIMIT 1), UUID()),
  'cookie_consent',
  'tr',
  CAST(JSON_OBJECT(
    'consent_version', 1,
    'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
    'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
    'texts', JSON_OBJECT(
      'title', 'Çerez Tercihleri',
      'description', 'Sitenin doğru çalışması için gerekli çerezleri ve isteğe bağlı analiz çerezlerini kullanırız. Tercihlerinizi yönetebilirsiniz.'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='cookie_consent' AND `locale`='en' LIMIT 1), UUID()),
  'cookie_consent',
  'en',
  CAST(JSON_OBJECT(
    'consent_version', 1,
    'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
    'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
    'texts', JSON_OBJECT(
      'title', 'Cookie Preferences',
      'description', 'We use necessary cookies to run the site and optional analytics cookies to understand traffic. You can manage your preferences.'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  COALESCE((SELECT `id` FROM `site_settings` WHERE `key`='cookie_consent' AND `locale`='de' LIMIT 1), UUID()),
  'cookie_consent',
  'de',
  CAST(JSON_OBJECT(
    'consent_version', 1,
    'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
    'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
    'texts', JSON_OBJECT(
      'title', 'Cookie-Einstellungen',
      'description', 'Wir verwenden notwendige Cookies für den Betrieb der Website und optionale Analyse-Cookies, um den Traffic besser zu verstehen. Sie können Ihre Einstellungen verwalten.'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
