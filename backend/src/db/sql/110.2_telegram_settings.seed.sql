-- ===================================================================
-- FILE: 110.2_telegram_settings.seed.sql
-- Telegram notification settings + multi-language templates
-- Königs Massage — de (primary), tr, en
-- ===================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Core settings (global, locale='*') ─────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
  (UUID(), 'telegram_enabled',                '*', '1',       NOW(3), NOW(3)),
  (UUID(), 'telegram_notifications_enabled',  '*', '1',       NOW(3), NOW(3)),
  (UUID(), 'telegram_webhook_enabled',        '*', '1',       NOW(3), NOW(3)),
  (UUID(), 'telegram_notification_locale',    '*', 'de',      NOW(3), NOW(3)),
  (UUID(), 'telegram_autoreply_enabled',      '*', '1',       NOW(3), NOW(3)),
  (UUID(), 'telegram_autoreply_mode',         '*', 'simple',  NOW(3), NOW(3)),
  (UUID(), 'telegram_autoreply_template',     '*', 'Vielen Dank für Ihre Nachricht. Wir melden uns so schnell wie möglich bei Ihnen.', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Per-event enable flags (global) ────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
  (UUID(), 'telegram_event_new_booking_enabled',            '*', '1', NOW(3), NOW(3)),
  (UUID(), 'telegram_event_booking_confirmed_enabled',      '*', '1', NOW(3), NOW(3)),
  (UUID(), 'telegram_event_booking_rejected_enabled',       '*', '1', NOW(3), NOW(3)),
  (UUID(), 'telegram_event_booking_cancelled_enabled',      '*', '1', NOW(3), NOW(3)),
  (UUID(), 'telegram_event_booking_status_changed_enabled', '*', '1', NOW(3), NOW(3)),
  (UUID(), 'telegram_event_new_contact_enabled',            '*', '1', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Templates: DEUTSCH (de) ────────────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
(
  UUID(),
  'telegram_template_new_booking', 'de',
  '📅 *Neue Terminanfrage*\n\n👤 Kunde: {{customer_name}}\n📧 E-Mail: {{customer_email}}\n📱 Telefon: {{customer_phone}}\n📆 Datum: {{appointment_date}}\n🕐 Uhrzeit: {{appointment_time}}\n💆 Service: {{service_title}}\n🏠 Raum/Therapeut: {{resource_title}}\n💬 Nachricht: {{customer_message}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_confirmed', 'de',
  '✅ *Termin bestätigt*\n\n👤 Kunde: {{customer_name}}\n📆 Datum: {{appointment_date}}\n🕐 Uhrzeit: {{appointment_time}}\n💆 Service: {{service_title}}\n📝 Notiz: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_rejected', 'de',
  '❌ *Termin abgelehnt*\n\n👤 Kunde: {{customer_name}}\n📆 Datum: {{appointment_date}}\n🕐 Uhrzeit: {{appointment_time}}\n💆 Service: {{service_title}}\n📝 Grund: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_cancelled', 'de',
  '🚫 *Termin storniert*\n\n👤 Kunde: {{customer_name}}\n📆 Datum: {{appointment_date}}\n🕐 Uhrzeit: {{appointment_time}}\n💆 Service: {{service_title}}\n📝 Grund: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_status_changed', 'de',
  '🔄 *Terminstatus geändert*\n\n👤 Kunde: {{customer_name}}\n📆 Datum: {{appointment_date}}\n🕐 Uhrzeit: {{appointment_time}}\n💆 Service: {{service_title}}\n📊 Status: {{status_before}} → {{status_after}}\n📝 Notiz: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_new_contact', 'de',
  '📩 *Neue Kontaktnachricht*\n\n👤 Name: {{name}}\n📧 E-Mail: {{email}}\n📱 Telefon: {{phone}}\n📋 Betreff: {{subject}}\n💬 Nachricht: {{message}}',
  NOW(3), NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Templates: TÜRKÇE (tr) ─────────────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
(
  UUID(),
  'telegram_template_new_booking', 'tr',
  '📅 *Yeni Randevu Talebi*\n\n👤 Müşteri: {{customer_name}}\n📧 E-posta: {{customer_email}}\n📱 Telefon: {{customer_phone}}\n📆 Tarih: {{appointment_date}}\n🕐 Saat: {{appointment_time}}\n💆 Hizmet: {{service_title}}\n🏠 Oda/Terapist: {{resource_title}}\n💬 Mesaj: {{customer_message}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_confirmed', 'tr',
  '✅ *Randevu Onaylandı*\n\n👤 Müşteri: {{customer_name}}\n📆 Tarih: {{appointment_date}}\n🕐 Saat: {{appointment_time}}\n💆 Hizmet: {{service_title}}\n📝 Not: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_rejected', 'tr',
  '❌ *Randevu Reddedildi*\n\n👤 Müşteri: {{customer_name}}\n📆 Tarih: {{appointment_date}}\n🕐 Saat: {{appointment_time}}\n💆 Hizmet: {{service_title}}\n📝 Sebep: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_cancelled', 'tr',
  '🚫 *Randevu İptal Edildi*\n\n👤 Müşteri: {{customer_name}}\n📆 Tarih: {{appointment_date}}\n🕐 Saat: {{appointment_time}}\n💆 Hizmet: {{service_title}}\n📝 Sebep: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_status_changed', 'tr',
  '🔄 *Randevu Durumu Değişti*\n\n👤 Müşteri: {{customer_name}}\n📆 Tarih: {{appointment_date}}\n🕐 Saat: {{appointment_time}}\n💆 Hizmet: {{service_title}}\n📊 Durum: {{status_before}} → {{status_after}}\n📝 Not: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_new_contact', 'tr',
  '📩 *Yeni İletişim Mesajı*\n\n👤 Ad: {{name}}\n📧 E-posta: {{email}}\n📱 Telefon: {{phone}}\n📋 Konu: {{subject}}\n💬 Mesaj: {{message}}',
  NOW(3), NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Templates: ENGLISH (en) ────────────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
(
  UUID(),
  'telegram_template_new_booking', 'en',
  '📅 *New Booking Request*\n\n👤 Customer: {{customer_name}}\n📧 Email: {{customer_email}}\n📱 Phone: {{customer_phone}}\n📆 Date: {{appointment_date}}\n🕐 Time: {{appointment_time}}\n💆 Service: {{service_title}}\n🏠 Room/Therapist: {{resource_title}}\n💬 Message: {{customer_message}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_confirmed', 'en',
  '✅ *Booking Confirmed*\n\n👤 Customer: {{customer_name}}\n📆 Date: {{appointment_date}}\n🕐 Time: {{appointment_time}}\n💆 Service: {{service_title}}\n📝 Note: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_rejected', 'en',
  '❌ *Booking Rejected*\n\n👤 Customer: {{customer_name}}\n📆 Date: {{appointment_date}}\n🕐 Time: {{appointment_time}}\n💆 Service: {{service_title}}\n📝 Reason: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_cancelled', 'en',
  '🚫 *Booking Cancelled*\n\n👤 Customer: {{customer_name}}\n📆 Date: {{appointment_date}}\n🕐 Time: {{appointment_time}}\n💆 Service: {{service_title}}\n📝 Reason: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_booking_status_changed', 'en',
  '🔄 *Booking Status Changed*\n\n👤 Customer: {{customer_name}}\n📆 Date: {{appointment_date}}\n🕐 Time: {{appointment_time}}\n💆 Service: {{service_title}}\n📊 Status: {{status_before}} → {{status_after}}\n📝 Note: {{decision_note}}',
  NOW(3), NOW(3)
),
(
  UUID(),
  'telegram_template_new_contact', 'en',
  '📩 *New Contact Message*\n\n👤 Name: {{name}}\n📧 Email: {{email}}\n📱 Phone: {{phone}}\n📋 Subject: {{subject}}\n💬 Message: {{message}}',
  NOW(3), NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
