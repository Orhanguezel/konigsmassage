-- =============================================================
-- 043_site_settings_ui_common.sql  (Common UI strings)
--  - ui_banner (breadcrumb)
--  - ui_contact (contact form + SEO)
--  - contact_map (map config)
--  - Localized: tr / en / de
--  - Extendable: clone from tr as bootstrap (collation-safe)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =============================================================
-- ui_banner : breadcrumb vb. ortak UI metinleri
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_banner',
  'tr',
  CAST(
    JSON_OBJECT(
      'ui_breadcrumb_home', 'Ana Sayfa'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_banner',
  'en',
  CAST(
    JSON_OBJECT(
      'ui_breadcrumb_home', 'Home'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_banner',
  'de',
  CAST(
    JSON_OBJECT(
      'ui_breadcrumb_home', 'Startseite'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
-- =============================================================
-- ui_contact : Contact page UI + SEO strings (FULL)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_contact',
  'tr',
  CAST(
    JSON_OBJECT(
      'ui_contact_page_title',               'İletişim',

      'ui_contact_subprefix',                'İletişime',
      'ui_contact_sublabel',                 'geçin',
      'ui_contact_title_left',               'Konuşalım',
      'ui_contact_tagline',                  '2009''dan beri işletmeleri büyütüyoruz, sizin için de yapalım!',

      'ui_contact_quick_email_placeholder',  'E-posta adresiniz',
      'ui_contact_quick_email_aria',         'E-postayı forma aktar',

      'ui_contact_form_title',               'Danışmanlık talebi oluşturun',
      'ui_contact_first_name',               'Adınız*',
      'ui_contact_last_name',                'Soyadınız',
      'ui_contact_company',                  'Firma adı',
      'ui_contact_website',                  'Web sitesi',
      'ui_contact_phone',                    'Telefon numarası',
      'ui_contact_email',                    'E-posta*',

      'ui_contact_select_label',             'Hizmet türünü seçin',
      'ui_contact_service_cooling_towers',   'Soğutma Kuleleri',
      'ui_contact_service_maintenance',      'Bakım',
      'ui_contact_service_modernization',    'Modernizasyon',
      'ui_contact_service_other',            'Diğer',

      'ui_contact_terms_prefix',             'Şunları kabul ediyorum:',
      'ui_contact_terms',                    'Şartlar',
      'ui_contact_conditions',               'Koşullar',

      'ui_contact_subject_base',             'Danışmanlık Talebi',
      'ui_contact_message_footer',           'İletişim formundan gönderildi.',

      'ui_contact_submit',                   'Talebi Gönder',
      'ui_contact_sending',                  'Gönderiliyor...',
      'ui_contact_success',                  'Teşekkürler! Mesajınız başarılı şekilde iletildi.',
      'ui_contact_error_generic',            'Gönderim başarısız oldu. Lütfen tekrar deneyin.',

      'ui_contact_map_title',                'Konum',

      'ui_contact_meta_title',               'konigsmassage İletişim | Bize Ulaşın',
      'ui_contact_meta_description',         'konigsmassage su soğutma çözümleri hakkında bilgi almak için bizimle iletişime geçin.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_contact',
  'en',
  CAST(
    JSON_OBJECT(
      'ui_contact_page_title',               'Contact',

      'ui_contact_subprefix',                'Get',
      'ui_contact_sublabel',                 'in touch',
      'ui_contact_title_left',               'Let''s Talk',
      'ui_contact_tagline',                  'We''ve been growing businesses since 2009, let us do it for you!',

      'ui_contact_quick_email_placeholder',  'Your email address',
      'ui_contact_quick_email_aria',         'Fill email',

      'ui_contact_form_title',               'Request a Consultation',
      'ui_contact_first_name',               'First Name*',
      'ui_contact_last_name',                'Last Name',
      'ui_contact_company',                  'Company Name',
      'ui_contact_website',                  'Website',
      'ui_contact_phone',                    'Phone Number',
      'ui_contact_email',                    'Email*',

      'ui_contact_select_label',             'Select a service',
      'ui_contact_service_cooling_towers',   'Cooling Towers',
      'ui_contact_service_maintenance',      'Maintenance',
      'ui_contact_service_modernization',    'Modernization',
      'ui_contact_service_other',            'Other',

      'ui_contact_terms_prefix',             'I agree to the:',
      'ui_contact_terms',                    'Terms',
      'ui_contact_conditions',               'Conditions',

      'ui_contact_subject_base',             'Consultation Request',
      'ui_contact_message_footer',           'Sent from contact form.',

      'ui_contact_submit',                   'Send Request',
      'ui_contact_sending',                  'Sending...',
      'ui_contact_success',                  'Thanks! Your message has been sent.',
      'ui_contact_error_generic',            'Failed to send. Please try again.',

      'ui_contact_map_title',                'Location',

      'ui_contact_meta_title',               'Contact konigsmassage | Get in Touch',
      'ui_contact_meta_description',         'Contact konigsmassage for industrial cooling tower solutions and technical support.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_contact',
  'de',
  CAST(
    JSON_OBJECT(
      'ui_contact_page_title',               'Kontakt',

      'ui_contact_subprefix',                'Kontakt',
      'ui_contact_sublabel',                 'aufnehmen',
      'ui_contact_title_left',               'Lassen Sie uns sprechen',
      'ui_contact_tagline',                  'Seit 2009 unterstützen wir Unternehmen beim Wachstum – gerne auch Ihres.',

      'ui_contact_quick_email_placeholder',  'Ihre E-Mail-Adresse',
      'ui_contact_quick_email_aria',         'E-Mail übernehmen',

      'ui_contact_form_title',               'Beratungsanfrage senden',
      'ui_contact_first_name',               'Vorname*',
      'ui_contact_last_name',                'Nachname',
      'ui_contact_company',                  'Firmenname',
      'ui_contact_website',                  'Webseite',
      'ui_contact_phone',                    'Telefonnummer',
      'ui_contact_email',                    'E-Mail*',

      'ui_contact_select_label',             'Wählen Sie eine Leistung',
      'ui_contact_service_cooling_towers',   'Kühltürme',
      'ui_contact_service_maintenance',      'Wartung',
      'ui_contact_service_modernization',    'Modernisierung',
      'ui_contact_service_other',            'Sonstiges',

      'ui_contact_terms_prefix',             'Ich akzeptiere:',
      'ui_contact_terms',                    'Bedingungen',
      'ui_contact_conditions',               'Konditionen',

      'ui_contact_subject_base',             'Beratungsanfrage',
      'ui_contact_message_footer',           'Über das Kontaktformular gesendet.',

      'ui_contact_submit',                   'Anfrage senden',
      'ui_contact_sending',                  'Wird gesendet...',
      'ui_contact_success',                  'Danke! Ihre Nachricht wurde gesendet.',
      'ui_contact_error_generic',            'Senden fehlgeschlagen. Bitte erneut versuchen.',

      'ui_contact_map_title',                'Standort',

      'ui_contact_meta_title',               'konigsmassage Kontakt | Kontaktieren Sie uns',
      'ui_contact_meta_description',         'Kontaktieren Sie konigsmassage für industrielle Kühlturmlösungen und technischen Support.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);


-- =============================================================
-- contact_map : Map config (iframe embed_url recommended)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'contact_map',
  'tr',
  CAST(
    JSON_OBJECT(
      'title',     'Konum',
      'height',    420,
      'query',     'konigsmassage',
      'embed_url', ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_map',
  'en',
  CAST(
    JSON_OBJECT(
      'title',     'Location',
      'height',    420,
      'query',     'konigsmassage',
      'embed_url', ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_map',
  'de',
  CAST(
    JSON_OBJECT(
      'title',     'Standort',
      'height',    420,
      'query',     'konigsmassage',
      'embed_url', ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);