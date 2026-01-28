-- =============================================================
-- 049-92_site_settings_ui_appointment.sql (FINAL)
-- ui_appointment: Public appointment page + availability + weekly plan + admin WH labels
--  - Key: ui_appointment
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert-safe: requires UNIQUE(`key`,`locale`)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES

/* ================= TR (FINAL) ================= */
(
  UUID(),
  'ui_appointment',
  'tr',
  CAST(JSON_OBJECT(
    'ui_appointment_page_title',         'Randevu Al',
    'ui_appointment_page_lead',          'Terapist seçin, tarih ve saat belirleyin, ardından formu gönderin.',
    'ui_appointment_meta_title',         'Randevu Al | Königs Massage',
    'ui_appointment_meta_description',   'Königs Massage üzerinden online randevu talebi oluşturun.',
    'ui_appointment_og_image',           '',

    'ui_appointment_subprefix',          'Königs Massage',
    'ui_appointment_sublabel',           'Randevu',

    'ui_appointment_left_title',         'Randevu Talebi',
    'ui_appointment_left_tagline',       'Size en uygun terapisti, tarihi ve saati seçin.',
    'ui_appointment_open_calendar',      'Takvimi aç',

    'ui_appointment_resource_label',     'Terapist',
    'ui_appointment_date_label',         'Tarih',
    'ui_appointment_customer_label',     'İletişim Bilgileri',
    'ui_appointment_slots_title',        'Uygun Seanslar',
    'ui_appointment_form_title',         'Randevu Talebi',

    'ui_appointment_name',               'Ad Soyad',
    'ui_appointment_phone',              'Telefon',
    'ui_appointment_email',              'E-posta',
    'ui_appointment_time',               'Saat',

    'ui_appointment_btn_submit',         'Randevu Talebini Gönder',
    'ui_appointment_btn_loading',        'Gönderiliyor...',
    'ui_appointment_refresh',            'Yenile',

    'ui_appointment_error_generic',      'Bir hata oluştu. Lütfen tekrar deneyin.',
    'ui_appointment_err_resource',       'Lütfen bir terapist seçin.',
    'ui_appointment_err_date',           'Lütfen geçerli bir tarih seçin.',
    'ui_appointment_err_name',           'Lütfen adınızı girin.',
    'ui_appointment_err_email',          'Lütfen geçerli bir e-posta adresi girin.',
    'ui_appointment_err_phone',          'Lütfen telefon numaranızı girin.',
    'ui_appointment_err_time',           'Lütfen bir saat seçin.',
    'ui_appointment_err_not_available',  'Seçilen saat şu an uygun değil.',

    'ui_appointment_success',            'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.',

    'ui_appointment_resource_loading',   'Terapistler yükleniyor...',
    'ui_appointment_resource_placeholder','Terapist seçin',
    'ui_appointment_resource_error',     'Terapistler yüklenemedi.',
    'ui_appointment_resource_empty',     'Şu an uygun terapist bulunmuyor. Lütfen daha sonra tekrar deneyin.',
    'ui_appointment_single_therapist',   'Terapist otomatik seçildi.',

    'ui_appointment_daily_pick_date',    'Lütfen önce bir tarih seçin.',
    'ui_appointment_slots_loading',      'Saatler yükleniyor...',
    'ui_appointment_slots_error',        'Saatler yüklenemedi.',
    'ui_appointment_slots_empty',        'Bu tarih için uygun saat bulunamadı.',
    'ui_appointment_slot_status_available','Uygun',

    'ui_appointment_avail_checking',     'Uygunluk kontrol ediliyor...',
    'ui_appointment_avail_ok',           'Uygun',
    'ui_appointment_avail_full',         'Dolu veya pasif',

    'ui_appointment_therapist_available','Uygun',
    'ui_appointment_therapist_full',     'Dolu',
    'ui_appointment_therapist_closed',   'Kapalı',
    'ui_appointment_therapist_unknown',  'Bilinmiyor',

    'ui_appointment_weekly_title',        'Haftalık Plan',
    'ui_appointment_weekly_pick_therapist','Haftalık planı görmek için terapist seçin.',
    'ui_appointment_weekly_wh_loading',   'Yükleniyor...',
    'ui_appointment_weekly_wh_error',     'Çalışma saatleri yüklenemedi.',

    'ui_dow_1', 'Pazartesi',
    'ui_dow_2', 'Salı',
    'ui_dow_3', 'Çarşamba',
    'ui_dow_4', 'Perşembe',
    'ui_dow_5', 'Cuma',
    'ui_dow_6', 'Cumartesi',
    'ui_dow_7', 'Pazar',

    'ui_admin_wh_title',          'Haftalık Çalışma Saatleri',
    'ui_admin_wh_desc',           'Bu aralıklar, günlük seans üretiminin kaynağıdır.',
    'ui_admin_loading',           'Yükleniyor...',
    'ui_admin_refresh',           'Yenile',

    'ui_admin_col_day',           'Gün',
    'ui_admin_col_start',         'Başlangıç',
    'ui_admin_col_end',           'Bitiş',
    'ui_admin_col_session',       'Seans (dk)',
    'ui_admin_col_break',         'Ara (dk)',
    'ui_admin_col_capacity',      'Kapasite',
    'ui_admin_col_active',        'Aktif',
    'ui_admin_col_actions',       'İşlemler',

    'ui_admin_wh_empty',          'Henüz çalışma saati aralığı yok.',
    'ui_admin_wh_add_title',      'Yeni Çalışma Saati Aralığı Ekle',

    'ui_admin_btn_edit',          'Düzenle',
    'ui_admin_btn_save',          'Kaydet',
    'ui_admin_btn_delete',        'Sil',
    'ui_admin_btn_add',           'Ekle',

    'ui_admin_wh_edit_day_hint',  'Bu gün için günlük seansları düzenle',

    'ui_admin_wh_added',          'Çalışma saati aralığı eklendi.',
    'ui_admin_wh_updated',        'Çalışma saati aralığı güncellendi.',
    'ui_admin_wh_deleted',        'Çalışma saati aralığı silindi.',

    'ui_admin_wh_add_failed',     'Çalışma saati aralığı eklenemedi.',
    'ui_admin_wh_update_failed',  'Çalışma saati aralığı güncellenemedi.',
    'ui_admin_wh_delete_failed',  'Çalışma saati aralığı silinemedi.',

    'ui_admin_wh_err_range',      'Geçersiz başlangıç/bitiş saati. (Bitiş, başlangıçtan sonra olmalı)',
    'ui_admin_wh_err_invalid_range','Geçersiz saat aralığı.',
    'ui_admin_wh_delete_confirm', 'Bu çalışma saati aralığını silmek üzeresiniz. Devam edilsin mi?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),

/* ================= EN (FULL) ================= */
(
  UUID(),
  'ui_appointment',
  'en',
  CAST(JSON_OBJECT(
    'ui_appointment_page_title',        'Book Appointment',
    'ui_appointment_page_lead',         'Select a therapist, choose a date and time, then submit the form.',
    'ui_appointment_meta_title',        'Book Appointment',
    'ui_appointment_meta_description',  'Book an appointment at Königs Massage.',
    'ui_appointment_og_image',          '',

    'ui_appointment_subprefix',         'Königs Massage',
    'ui_appointment_sublabel',          'Appointment',

    'ui_appointment_left_title',        'Book Appointment',
    'ui_appointment_left_tagline',      'Choose the therapist, date and time that suits you best.',
    'ui_appointment_open_calendar',     'Open calendar',

    'ui_appointment_resource_label',    'Therapist',
    'ui_appointment_date_label',        'Date',
    'ui_appointment_customer_label',    'Contact Information',
    'ui_appointment_slots_title',       'Available Sessions',
    'ui_appointment_form_title',        'Appointment Request',

    'ui_appointment_name',              'Full Name',
    'ui_appointment_phone',             'Phone',
    'ui_appointment_email',             'Email',
    'ui_appointment_time',              'Time',

    'ui_appointment_btn_submit',        'Submit Appointment Request',
    'ui_appointment_btn_loading',       'Submitting...',
    'ui_appointment_refresh',           'Refresh',

    'ui_appointment_error_generic',     'Something went wrong. Please try again.',
    'ui_appointment_err_resource',      'Please select a therapist.',
    'ui_appointment_err_date',          'Please select a valid date.',
    'ui_appointment_err_name',          'Please enter your name.',
    'ui_appointment_err_email',         'Please enter a valid email address.',
    'ui_appointment_err_phone',         'Please enter your phone number.',
    'ui_appointment_err_time',          'Please select a time.',
    'ui_appointment_err_not_available', 'The selected time is not available right now.',

    'ui_appointment_success',           'Your request has been received. We will contact you shortly.',

    'ui_appointment_resource_loading',  'Loading therapists...',
    'ui_appointment_resource_placeholder','Select therapist',
    'ui_appointment_resource_error',    'Therapists could not be loaded.',
    'ui_appointment_resource_empty',    'No therapists available right now. Please try again later.',
    'ui_appointment_single_therapist',  'Therapist has been selected automatically.',

    'ui_appointment_daily_pick_date',   'Please select a date first.',
    'ui_appointment_slots_loading',     'Loading times...',
    'ui_appointment_slots_error',       'Times could not be loaded.',
    'ui_appointment_slots_empty',       'No available time found for this date.',
    'ui_appointment_slot_status_available','Available',

    'ui_appointment_avail_checking',    'Checking availability...',
    'ui_appointment_avail_ok',          'Available',
    'ui_appointment_avail_full',        'Full or inactive',

    'ui_appointment_therapist_available','Available',
    'ui_appointment_therapist_full',     'Full',
    'ui_appointment_therapist_closed',   'Closed',
    'ui_appointment_therapist_unknown',  'Unknown',

    'ui_appointment_weekly_title',       'Weekly Schedule',
    'ui_appointment_weekly_pick_therapist','Select a therapist to view the weekly schedule.',
    'ui_appointment_weekly_wh_loading',  'Loading...',
    'ui_appointment_weekly_wh_error',    'Working hours could not be loaded.',

    'ui_dow_1', 'Monday',
    'ui_dow_2', 'Tuesday',
    'ui_dow_3', 'Wednesday',
    'ui_dow_4', 'Thursday',
    'ui_dow_5', 'Friday',
    'ui_dow_6', 'Saturday',
    'ui_dow_7', 'Sunday',

    'ui_admin_wh_title',         'Weekly Working Hours',
    'ui_admin_wh_desc',          'These ranges are the source for daily session generation.',
    'ui_admin_loading',          'Loading...',
    'ui_admin_refresh',          'Refresh',

    'ui_admin_col_day',          'Day',
    'ui_admin_col_start',        'Start',
    'ui_admin_col_end',          'End',
    'ui_admin_col_session',      'Session (min)',
    'ui_admin_col_break',        'Break (min)',
    'ui_admin_col_capacity',     'Capacity',
    'ui_admin_col_active',       'Active',
    'ui_admin_col_actions',      'Actions',

    'ui_admin_wh_empty',         'No working hour range yet.',
    'ui_admin_wh_add_title',     'Add New Working Hour Range',

    'ui_admin_btn_edit',         'Edit',
    'ui_admin_btn_save',         'Save',
    'ui_admin_btn_delete',       'Delete',
    'ui_admin_btn_add',          'Add',

    'ui_admin_wh_edit_day_hint', 'Edit daily sessions for this day',

    'ui_admin_wh_added',         'Working hour range added.',
    'ui_admin_wh_updated',       'Working hour range updated.',
    'ui_admin_wh_deleted',       'Working hour range deleted.',

    'ui_admin_wh_add_failed',    'Could not add working hour range.',
    'ui_admin_wh_update_failed', 'Could not update working hour range.',
    'ui_admin_wh_delete_failed', 'Could not delete working hour range.',

    'ui_admin_wh_err_range',     'Invalid start/end time. (End must be after start)',
    'ui_admin_wh_err_invalid_range','Invalid time range.',
    'ui_admin_wh_delete_confirm','You are about to delete this working hour range. Continue?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),

/* ================= DE (FULL) ================= */
(
  UUID(),
  'ui_appointment',
  'de',
  CAST(JSON_OBJECT(
    'ui_appointment_page_title',        'Termin buchen',
    'ui_appointment_page_lead',         'Therapeut auswählen, Datum und Uhrzeit festlegen und Formular senden.',
    'ui_appointment_meta_title',        'Termin buchen',
    'ui_appointment_meta_description',  'Online Termin bei Königs Massage buchen.',
    'ui_appointment_og_image',          '',

    'ui_appointment_subprefix',         'Königs Massage',
    'ui_appointment_sublabel',          'Termin',

    'ui_appointment_left_title',        'Termin buchen',
    'ui_appointment_left_tagline',      'Wählen Sie Therapeut, Datum und Uhrzeit, die am besten passen.',
    'ui_appointment_open_calendar',     'Kalender öffnen',

    'ui_appointment_resource_label',    'Therapeut',
    'ui_appointment_date_label',        'Datum',
    'ui_appointment_customer_label',    'Kontaktdaten',
    'ui_appointment_slots_title',       'Freie Termine',
    'ui_appointment_form_title',        'Terminanfrage',

    'ui_appointment_name',              'Name',
    'ui_appointment_phone',             'Telefon',
    'ui_appointment_email',             'E-Mail',
    'ui_appointment_time',              'Uhrzeit',

    'ui_appointment_btn_submit',        'Terminanfrage senden',
    'ui_appointment_btn_loading',       'Wird gesendet...',
    'ui_appointment_refresh',           'Aktualisieren',

    'ui_appointment_error_generic',     'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',
    'ui_appointment_err_resource',      'Bitte einen Therapeuten auswählen.',
    'ui_appointment_err_date',          'Bitte ein gültiges Datum auswählen.',
    'ui_appointment_err_name',          'Bitte Ihren Namen eingeben.',
    'ui_appointment_err_email',         'Bitte eine gültige E-Mail-Adresse eingeben.',
    'ui_appointment_err_phone',         'Bitte Ihre Telefonnummer eingeben.',
    'ui_appointment_err_time',          'Bitte eine Uhrzeit auswählen.',
    'ui_appointment_err_not_available', 'Die gewählte Uhrzeit ist aktuell nicht verfügbar.',

    'ui_appointment_success',           'Ihre Anfrage wurde erhalten. Wir melden uns in Kürze.',

    'ui_appointment_resource_loading',  'Therapeuten werden geladen...',
    'ui_appointment_resource_placeholder','Therapeut auswählen',
    'ui_appointment_resource_error',    'Therapeuten konnten nicht geladen werden.',
    'ui_appointment_resource_empty',    'Derzeit sind keine Therapeuten verfügbar. Bitte später erneut versuchen.',
    'ui_appointment_single_therapist',  'Therapeut wurde automatisch ausgewählt.',

    'ui_appointment_daily_pick_date',   'Bitte zuerst ein Datum auswählen.',
    'ui_appointment_slots_loading',     'Uhrzeiten werden geladen...',
    'ui_appointment_slots_error',       'Uhrzeiten konnten nicht geladen werden.',
    'ui_appointment_slots_empty',       'Für dieses Datum sind keine freien Zeiten verfügbar.',
    'ui_appointment_slot_status_available','Verfügbar',

    'ui_appointment_avail_checking',    'Verfügbarkeit wird geprüft...',
    'ui_appointment_avail_ok',          'Verfügbar',
    'ui_appointment_avail_full',        'Ausgebucht oder inaktiv',

    'ui_appointment_therapist_available','Verfügbar',
    'ui_appointment_therapist_full',     'Ausgebucht',
    'ui_appointment_therapist_closed',   'Geschlossen',
    'ui_appointment_therapist_unknown',  'Unbekannt',

    'ui_appointment_weekly_title',       'Wöchentlicher Plan',
    'ui_appointment_weekly_pick_therapist','Wählen Sie einen Therapeuten, um den Wochenplan zu sehen.',
    'ui_appointment_weekly_wh_loading',  'Wird geladen...',
    'ui_appointment_weekly_wh_error',    'Arbeitszeiten konnten nicht geladen werden.',

    'ui_dow_1', 'Montag',
    'ui_dow_2', 'Dienstag',
    'ui_dow_3', 'Mittwoch',
    'ui_dow_4', 'Donnerstag',
    'ui_dow_5', 'Freitag',
    'ui_dow_6', 'Samstag',
    'ui_dow_7', 'Sonntag',

    'ui_admin_wh_title',         'Wöchentliche Arbeitszeiten',
    'ui_admin_wh_desc',          'Diese Bereiche sind die Grundlage für die tägliche Sitzungs-Erzeugung.',
    'ui_admin_loading',          'Wird geladen...',
    'ui_admin_refresh',          'Aktualisieren',

    'ui_admin_col_day',          'Tag',
    'ui_admin_col_start',        'Start',
    'ui_admin_col_end',          'Ende',
    'ui_admin_col_session',      'Sitzung (Min)',
    'ui_admin_col_break',        'Pause (Min)',
    'ui_admin_col_capacity',     'Kapazität',
    'ui_admin_col_active',       'Aktiv',
    'ui_admin_col_actions',      'Aktionen',

    'ui_admin_wh_empty',         'Noch keine Arbeitszeit-Spanne vorhanden.',
    'ui_admin_wh_add_title',     'Neue Arbeitszeit-Spanne hinzufügen',

    'ui_admin_btn_edit',         'Bearbeiten',
    'ui_admin_btn_save',         'Speichern',
    'ui_admin_btn_delete',       'Löschen',
    'ui_admin_btn_add',          'Hinzufügen',

    'ui_admin_wh_edit_day_hint', 'Tägliche Sitzungen für diesen Tag bearbeiten',

    'ui_admin_wh_added',         'Arbeitszeit-Spanne hinzugefügt.',
    'ui_admin_wh_updated',       'Arbeitszeit-Spanne aktualisiert.',
    'ui_admin_wh_deleted',       'Arbeitszeit-Spanne gelöscht.',

    'ui_admin_wh_add_failed',    'Arbeitszeit-Spanne konnte nicht hinzugefügt werden.',
    'ui_admin_wh_update_failed', 'Arbeitszeit-Spanne konnte nicht aktualisiert werden.',
    'ui_admin_wh_delete_failed', 'Arbeitszeit-Spanne konnte nicht gelöscht werden.',

    'ui_admin_wh_err_range',     'Ungültige Start-/Endzeit. (Ende muss nach Start liegen)',
    'ui_admin_wh_err_invalid_range','Ungültiger Zeitbereich.',
    'ui_admin_wh_delete_confirm','Sie sind dabei, diese Arbeitszeit-Spanne zu löschen. Fortfahren?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
