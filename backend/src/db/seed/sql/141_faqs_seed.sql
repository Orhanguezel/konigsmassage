-- =============================================================
-- 141_faqs_seed.sql (FINAL)
-- Home Massage – Multilingual FAQs seed (faqs + faqs_i18n)
-- ✅ 140_faqs.sql şema mevcut olmalı (DROP/CREATE yok)
-- ✅ TR + EN + DE
-- ✅ NO category fields
-- ✅ faqs_i18n.id: CHAR(36) uyumlu STABIL UUID
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- SEED: PARENT (faqs)
-- =============================================================
INSERT INTO `faqs`
(`id`,                                `is_active`, `display_order`, `created_at`,                `updated_at`)
VALUES
('11111111-1111-1111-1111-111111111111', 1, 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('22222222-2222-2222-2222-222222222222', 1, 2, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('33333333-3333-3333-3333-333333333333', 1, 3, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('44444444-4444-4444-4444-444444444444', 1, 4, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('55555555-5555-5555-5555-555555555555', 1, 5, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('66666666-6666-6666-6666-666666666666', 1, 6, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('77777777-7777-7777-7777-777777777777', 1, 7, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('88888888-8888-8888-8888-888888888888', 1, 8, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `is_active`     = VALUES(`is_active`),
  `display_order` = VALUES(`display_order`),
  `updated_at`    = VALUES(`updated_at`);

-- =============================================================
-- SEED: I18N (faqs_i18n) – TR + EN + DE
-- Unique: (faq_id, locale)
-- id: CHAR(36) stabil UUID (1..24)
-- =============================================================
INSERT INTO `faqs_i18n`
(`id`, `faq_id`, `locale`, `question`, `answer`, `slug`, `created_at`, `updated_at`)
VALUES

-- =============================================================
-- 1) Hizmet nasıl işliyor?
-- =============================================================
('00000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','tr',
'Evde masaj hizmeti nasıl işliyor?',
'Randevu oluşturduktan sonra adres ve tercih ettiğiniz saat teyit edilir. Seans günü yanımda masaj yağı ve gerekli ekipmanlarla gelirim; uygun bir alan hazırlamanız yeterlidir (yaklaşık 2–3 m²). Seans öncesinde kısa bir ihtiyaç değerlendirmesi yapar, ardından planlanan masaj uygulamasına geçerim.',
'evde-masaj-hizmeti-nasil-isliyor',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','en',
'How does the at-home massage service work?',
'After you book, we confirm your address and preferred time. On the day of the session I arrive with oils and the necessary equipment; you only need to prepare a comfortable area (around 2–3 m²). We do a short needs assessment first, then proceed with the planned massage.',
'how-does-at-home-massage-work',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','de',
'Wie läuft eine Massage bei Ihnen zu Hause ab?',
'Nach der Buchung bestätige ich Adresse und Wunschzeit. Am Termin komme ich mit Ölen und dem notwendigen Equipment; Sie benötigen lediglich einen angenehmen Platz (ca. 2–3 m²). Vor Beginn klären wir kurz Ihre Bedürfnisse, danach startet die vereinbarte Massage.',
'wie-laeuft-massage-zu-hause-ab',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 2) Hangi masaj türleri var?
-- =============================================================
('00000000-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','tr',
'Hangi masaj türlerini uyguluyorsunuz?',
'Klasik rahatlatıcı masaj, spor masajı, boyun-sırt odaklı masaj ve fasya/derin doku odaklı uygulamalar yapıyorum. Seans içeriğini; ağrı, gerginlik, duruş ve günlük stres düzeyinize göre kişiselleştiriyorum.',
'hangi-masaj-turleri-var',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000005','22222222-2222-2222-2222-222222222222','en',
'What types of massage do you offer?',
'I offer classic relaxation massage, sports massage, neck-and-back focused sessions, and fascia/deep-tissue oriented techniques. The session is tailored to your pain points, tension areas, posture, and overall stress level.',
'what-types-of-massage-do-you-offer',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000006','22222222-2222-2222-2222-222222222222','de',
'Welche Massagearten bieten Sie an?',
'Ich biete klassische Entspannungsmassage, Sportmassage, Nacken-/Rückenfokus sowie Faszien- bzw. Deep-Tissue-orientierte Techniken an. Die Behandlung passe ich individuell an Beschwerden, Verspannungen, Haltung und Stressniveau an.',
'welche-massagearten-bieten-sie-an',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 3) Seans süresi ve içerik
-- =============================================================
('00000000-0000-0000-0000-000000000007','33333333-3333-3333-3333-333333333333','tr',
'Seans süresi ne kadar ve neleri kapsıyor?',
'Genellikle 60 veya 90 dakikalık seanslar öneriyorum. Süreye kısa bir değerlendirme, masaj uygulaması ve seans sonunda su tüketimi/ev egzersizi gibi basit öneriler dahildir. Hedef; hem anlık rahatlama hem de gerginliğin tekrarını azaltmaktır.',
'seans-suresi-ne-kadar',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000008','33333333-3333-3333-3333-333333333333','en',
'How long is a session and what does it include?',
'I typically recommend 60 or 90-minute sessions. The time includes a brief assessment, the massage itself, and simple aftercare tips such as hydration and easy home stretches. The goal is both immediate relief and reducing recurring tension.',
'how-long-is-a-session',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000009','33333333-3333-3333-3333-333333333333','de',
'Wie lange dauert eine Sitzung und was ist enthalten?',
'Üblich sind 60 oder 90 Minuten. Enthalten sind eine kurze Einschätzung, die Massage sowie einfache Empfehlungen für danach (z. B. trinken, leichte Dehnübungen). Ziel ist schnelle Entlastung und weniger wiederkehrende Verspannungen.',
'wie-lange-dauert-eine-sitzung',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 4) Öncesinde nasıl hazırlanmalı?
-- =============================================================
('00000000-0000-0000-0000-000000000010','44444444-4444-4444-4444-444444444444','tr',
'Masaj öncesinde nasıl hazırlanmalıyım?',
'Rahat kıyafetler tercih edin ve masajdan hemen önce ağır yemek yememeye çalışın. Oda ısısının uygun olması ve sessiz bir alan hazırlamanız yeterlidir. Varsa ağrınız, sakatlığınız veya hassasiyetinizle ilgili bilgileri seans öncesinde paylaşmanız önemli.',
'masaj-oncesi-nasil-hazirlanmali',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000011','44444444-4444-4444-4444-444444444444','en',
'How should I prepare before the massage?',
'Wear comfortable clothing and avoid a heavy meal right before the session. A quiet space with a comfortable room temperature is enough. Please share any injuries, sensitivities, or pain areas before we begin.',
'how-to-prepare-before-massage',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000012','44444444-4444-4444-4444-444444444444','de',
'Wie bereite ich mich auf die Massage vor?',
'Tragen Sie bequeme Kleidung und vermeiden Sie direkt vorher eine schwere Mahlzeit. Ein ruhiger Platz mit angenehmer Raumtemperatur genügt. Bitte informieren Sie mich vor Beginn über Verletzungen, Beschwerden oder besondere Empfindlichkeiten.',
'wie-vorbereiten-vor-der-massage',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 5) Hijyen ve güvenlik
-- =============================================================
('00000000-0000-0000-0000-000000000013','55555555-5555-5555-5555-555555555555','tr',
'Hijyen ve güvenlik konusunda hangi önlemler alınıyor?',
'Seanslarda temiz tekstil ürünleri kullanılır ve ekipmanlar her randevudan sonra dezenfekte edilir. Kullanılan ürünler cilt dostu seçilir. Kendinizi rahat hissetmeniz için seans öncesinde tüm sorularınızı yanıtlar, uygulamayı onayınızla başlatırım.',
'hijyen-ve-guvenlik-onlemleri',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000014','55555555-5555-5555-5555-555555555555','en',
'What hygiene and safety measures do you follow?',
'I use clean textiles and disinfect equipment after every appointment. Products are chosen to be skin-friendly. To ensure you feel comfortable, I answer your questions first and start only with your consent.',
'hygiene-and-safety-measures',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000015','55555555-5555-5555-5555-555555555555','de',
'Welche Hygiene- und Sicherheitsmaßnahmen werden eingehalten?',
'Ich verwende saubere Textilien und desinfiziere das Equipment nach jedem Termin. Die Produkte sind hautfreundlich ausgewählt. Damit Sie sich wohlfühlen, klären wir vorab alle Fragen und ich beginne erst mit Ihrem Einverständnis.',
'hygiene-und-sicherheit',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 6) Kimler için uygun değildir?
-- =============================================================
('00000000-0000-0000-0000-000000000016','66666666-6666-6666-6666-666666666666','tr',
'Masaj kimler için uygun değildir?',
'Ateşli hastalık, akut enfeksiyon, ciddi damar rahatsızlığı, pıhtı riski, kontrolsüz tansiyon gibi durumlarda masaj önerilmez. Hamilelik, yeni ameliyat, fıtık veya kronik rahatsızlık gibi durumlarda mutlaka önceden bilgi verin; gerekirse doktor onayıyla ilerlenir veya seans ertelenir.',
'masaj-kimler-icin-uygun-degildir',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000017','66666666-6666-6666-6666-666666666666','en',
'Who should not get a massage?',
'Massage is generally not recommended in cases such as fever, acute infection, serious vascular conditions, clot risk, or uncontrolled blood pressure. Please inform me in advance about pregnancy, recent surgery, herniation, or chronic conditions; we may proceed only with medical approval or reschedule.',
'who-should-not-get-a-massage',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000018','66666666-6666-6666-6666-666666666666','de',
'Für wen ist Massage nicht geeignet?',
'Bei Fieber, akuten Infektionen, schweren Gefäßerkrankungen, Thromboserisiko oder unkontrolliertem Blutdruck ist Massage in der Regel nicht empfohlen. Bitte informieren Sie mich vorab über Schwangerschaft, Operationen, Bandscheibenvorfälle oder chronische Beschwerden; ggf. nur mit ärztlicher Freigabe oder Terminverschiebung.',
'fuer-wen-ist-massage-nicht-geeignet',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 7) Ödeme ve fiyatlandırma
-- =============================================================
('00000000-0000-0000-0000-000000000019','77777777-7777-7777-7777-777777777777','tr',
'Ödeme ve fiyatlandırma nasıl oluyor?',
'Fiyat; seans süresi (60/90 dk) ve adres mesafesine göre belirlenir. Randevu onayı sonrası net fiyatı iletirim. Ödeme yöntemleri (nakit/IBAN vb.) hizmet sayfanızdaki bilgilere göre güncellenebilir.',
'odeme-ve-fiyatlandirma',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000020','77777777-7777-7777-7777-777777777777','en',
'How do pricing and payments work?',
'Pricing depends on session duration (60/90 min) and travel distance. After confirming your appointment, I share the final price. Payment methods (cash/bank transfer, etc.) can be updated based on the information on your service page.',
'pricing-and-payments',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000021','77777777-7777-7777-7777-777777777777','de',
'Wie funktionieren Preise und Bezahlung?',
'Der Preis richtet sich nach Dauer (60/90 Min.) und Anfahrtsweg. Nach der Terminbestätigung teile ich den Endpreis mit. Zahlungsarten (Bar/Überweisung etc.) können gemäß Ihrer Leistungsseite aktualisiert werden.',
'preise-und-bezahlung',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 8) İptal ve erteleme
-- =============================================================
('00000000-0000-0000-0000-000000000022','88888888-8888-8888-8888-888888888888','tr',
'Randevu iptali veya erteleme nasıl yapılır?',
'Plan değiştiyse mümkün olan en erken zamanda haber vermeniz yeterli. Aynı gün değişikliklerde müsaitliğe göre yeni saat planlanır. Düzenli bir akış için iptal/erteleme politikanızı hizmet sayfanızda netleştirmeniz önerilir.',
'randevu-iptali-ve-erteleme',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000023','88888888-8888-8888-8888-888888888888','en',
'How can I cancel or reschedule my appointment?',
'If your plans change, please let me know as early as possible. Same-day changes depend on availability. For a smooth process, it is recommended to clearly state your cancellation/rescheduling policy on your service page.',
'cancel-or-reschedule-appointment',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000024','88888888-8888-8888-8888-888888888888','de',
'Wie kann ich einen Termin absagen oder verschieben?',
'Wenn sich Ihre Planung ändert, geben Sie bitte so früh wie möglich Bescheid. Änderungen am selben Tag sind abhängig von der Verfügbarkeit. Für einen reibungslosen Ablauf empfiehlt es sich, Ihre Storno-/Umbuchungsregeln auf der Leistungsseite klar zu kommunizieren.',
'termin-absagen-oder-verschieben',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000')

ON DUPLICATE KEY UPDATE
  `question`   = VALUES(`question`),
  `answer`     = VALUES(`answer`),
  `slug`       = VALUES(`slug`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
