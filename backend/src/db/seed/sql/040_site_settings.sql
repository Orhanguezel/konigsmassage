-- =============================================================
-- FILE: 040_site_settings.sql (koenigsmassage) – MULTI-LOCALE (Dynamic) [FINAL]
--  - app_locales + default_locale => locale='*'
--  - localized settings => locale in ('tr','en','de')
--  - cookie_consent => LOCALIZED (tr/en/de)
--  - booking admin notifications => GLOBAL (booking_admin_emails, booking_admin_notification_enabled)
--  - SECURITY: no secrets in seed (smtp_password, cloudinary_api_secret placeholder)
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
  UUID(),
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
(UUID(), 'default_locale', '*', 'de', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Public Base URL (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'public_base_url', '*', 'https://www.koenigsmassage.com', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Booking Admin Notification (locale='*')  ✅ REQUIRED FOR ADMIN EMAILS
-- - booking_admin_emails: JSON array of recipients
-- - booking_admin_notification_enabled: "true"/"false"
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'booking_admin_notification_enabled',
  '*',
  'true',
  NOW(3),
  NOW(3)
),
(
  UUID(),
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
  UUID(),
  'site_title',
  'tr',
  'Königs Massage',
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_info',
  'tr',
  CAST(JSON_OBJECT(
    'companyName','Königs Massage',
    'phones',JSON_ARRAY('+49 000 0000000'),
    'email','info@koenigsmassage.com',
    'address','Almanya (mobil hizmet) — Evde/yerinde masaj hizmeti',
    'addressSecondary','',
    'whatsappNumber','+49 000 0000000',
    'website','https://www.koenigsmassage.com',
    'notes','Randevu ve sorularınız için e-posta veya WhatsApp üzerinden ulaşabilirsiniz.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
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
  UUID(),
  'company_profile',
  'tr',
  CAST(JSON_OBJECT(
    'headline','Evde Masaj ile Daha İyi Hisset',
    'subline','Kişiye özel masaj seansları ve sağlıklı yaşam önerileri: stres yönetimi, kas gevşetme, hareket ve beslenme.',
    'body','Königs Massage, evde/yerinde masaj hizmeti sunan kişisel bir sağlık ve yaşam platformudur. Amacım; doğru dokunuş, düzenli hareket ve dengeli beslenme ile bedeninizi rahatlatmak ve günlük yaşam kalitenizi artırmaktır. Blog bölümünde masajın faydaları, duruş ve esneme, stres yönetimi ve beslenme üzerine pratik içerikler paylaşıyorum.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
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
  UUID(),
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
  UUID(),
  'site_title',
  'en',
  'Königs Massage',
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_info',
  'en',
  CAST(JSON_OBJECT(
    'companyName','Königs Massage',
    'phones',JSON_ARRAY('+49 000 0000000'),
    'email','info@koenigsmassage.com',
    'address','Germany (mobile service) — in-home / on-site massage',
    'addressSecondary','',
    'whatsappNumber','+49 000 0000000',
    'website','https://www.koenigsmassage.com',
    'notes','For bookings and questions, contact via email or WhatsApp.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
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
  UUID(),
  'company_profile',
  'en',
  CAST(JSON_OBJECT(
    'headline','Feel Better with In-Home Massage',
    'subline','Personalized massage sessions and wellness tips: stress relief, muscle recovery, mobility and nutrition.',
    'body','Königs Massage is a personal wellness platform offering in-home / on-site massage services. My goal is to help you feel better through mindful touch, regular movement and balanced nutrition. In the blog, you will find practical content about the benefits of massage, posture and stretching, stress management and nutrition.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
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
  UUID(),
  'site_title',
  'de',
  'Königs Massage',
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_info',
  'de',
  CAST(JSON_OBJECT(
    'companyName','Königs Massage',
    'phones',JSON_ARRAY('+49 000 0000000'),
    'email','info@koenigsmassage.com',
    'address','Deutschland (mobiler Service) — Massage bei Ihnen zu Hause / vor Ort',
    'addressSecondary','',
    'whatsappNumber','+49 000 0000000',
    'website','https://www.koenigsmassage.com',
    'notes','Für Termine und Fragen kontaktieren Sie mich per E-Mail oder WhatsApp.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
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
  UUID(),
  'company_profile',
  'de',
  CAST(JSON_OBJECT(
    'headline','Besser fühlen mit Massage zu Hause',
    'subline','Individuelle Massagen und Wellness-Tipps: Stressabbau, Muskelentspannung, Mobilität und Ernährung.',
    'body','Königs Massage ist eine persönliche Gesundheits- und Lifestyle-Seite mit mobilem Massageangebot. Mein Ziel ist es, Sie durch gezielte Massage, regelmäßige Bewegung und ausgewogene Ernährung im Alltag zu unterstützen. Im Blog finden Sie praktische Beiträge über die Wirkung von Massage, Haltung und Dehnung, Stressmanagement und Ernährung.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
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
(UUID(), 'storage_driver',             '*', 'cloudinary',                       NOW(3), NOW(3)),
(UUID(), 'storage_local_root',         '*', '/var/www/koenigsmassage/uploads',   NOW(3), NOW(3)),
(UUID(), 'storage_local_base_url',     '*', '/uploads',                         NOW(3), NOW(3)),
(UUID(), 'cloudinary_cloud_name',      '*', 'dbozv7wqd',                         NOW(3), NOW(3)),
(UUID(), 'cloudinary_api_key',         '*', '644676135993432',                   NOW(3), NOW(3)),
(UUID(), 'cloudinary_api_secret',      '*', 'change-me-in-admin',                NOW(3), NOW(3)),
(UUID(), 'cloudinary_folder',          '*', 'uploads/koenigsmassage',             NOW(3), NOW(3)),
(UUID(), 'cloudinary_unsigned_preset', '*', 'koenigsmassage_unsigned',            NOW(3), NOW(3)),
(UUID(), 'storage_cdn_public_base',    '*', 'https://res.cloudinary.com',        NOW(3), NOW(3)),
(UUID(), 'storage_public_api_base',    '*', 'https://www.koenigsmassage.com/api',  NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: SMTP (locale='*')  (placeholders; set real values via Admin)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'smtp_host',       '*', 'smtp.example.com',        NOW(3), NOW(3)),
(UUID(), 'smtp_port',       '*', '465',                     NOW(3), NOW(3)),
(UUID(), 'smtp_username',   '*', 'no-reply@koenigsmassage.com', NOW(3), NOW(3)),
(UUID(), 'smtp_password',   '*', 'change-me-in-admin',      NOW(3), NOW(3)),
(UUID(), 'smtp_from_email', '*', 'no-reply@koenigsmassage.com', NOW(3), NOW(3)),
(UUID(), 'smtp_from_name',  '*', 'Königs Massage',          NOW(3), NOW(3)),
(UUID(), 'smtp_ssl',        '*', 'true',                    NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Google OAuth (locale='*')  (optional; placeholders)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'google_client_id',     '*', 'change-me-in-admin', NOW(3), NOW(3)),
(UUID(), 'google_client_secret', '*', 'change-me-in-admin', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: GTM + GA4 (locale='*')  (optional; placeholders)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'gtm_container_id',   '*', '', NOW(3), NOW(3)),
(UUID(), 'ga4_measurement_id', '*', '', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Site Media (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'site_logo',
  '*',
  CAST(
    JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
      'width',120,
      'height',120,
      'alt','Königs Massage Logo'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_logo_dark',
  '*',
  CAST(
    JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
      'width',120,
      'height',120,
      'alt','Königs Massage Logo (Dark)'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_logo_light',
  '*',
  CAST(
    JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
      'width',120,
      'height',120,
      'alt','Königs Massage Logo (Light)'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_favicon',
  '*',
  CAST(
    JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768222395/site-media/favicon.png',
      'alt','Königs Massage Favicon'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_apple_touch_icon',
  '*',
  CAST(
    JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
      'alt','Königs Massage Apple Touch Icon'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_app_icon_512',
  '*',
  CAST(
    JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png',
      'alt','Königs Massage App Icon (512x512)'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_og_default_image',
  '*',
  CAST(
    JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768222471/site-media/about.png',
      'width',1200,
      'height',630,
      'alt','Königs Massage – In-Home Massage & Wellness'
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: Cookie Consent Config (tr/en/de)
-- consent_version değişince tekrar onay al
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'cookie_consent',
  'tr',
  CAST(
    JSON_OBJECT(
      'consent_version', 1,
      'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
      'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
      'texts', JSON_OBJECT(
        'title', 'Çerez Tercihleri',
        'description', 'Sitemizin doğru çalışmasını sağlamak ve isteğe bağlı analiz yapmak için çerezler kullanıyoruz. Tercihlerinizi yönetebilirsiniz.'
      )
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'cookie_consent',
  'en',
  CAST(
    JSON_OBJECT(
      'consent_version', 1,
      'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
      'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
      'texts', JSON_OBJECT(
        'title', 'Cookie Preferences',
        'description', 'We use cookies to ensure the site works properly and to optionally analyze traffic. You can manage your preferences.'
      )
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'cookie_consent',
  'de',
  CAST(
    JSON_OBJECT(
      'consent_version', 1,
      'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
      'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
      'texts', JSON_OBJECT(
        'title', 'Cookie-Einstellungen',
        'description', 'Wir verwenden Cookies, um die Website korrekt zu betreiben und optional den Traffic zu analysieren. Sie können Ihre Einstellungen verwalten.'
      )
    ) AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
