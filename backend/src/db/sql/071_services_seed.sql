-- =============================================================
-- 071_services_seed.sql (KÖNIG ENERGETIK)
-- Services seed — Energetische Massage in Bonn (TR + DE + EN)
-- Requires: 070_services.sql already applied
-- Idempotent: INSERT ... ON DUPLICATE KEY UPDATE
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- PARENT: services (non-i18n)
-- Note: area/duration/etc are currently rendered without i18n in FE,
-- so we keep them consistent (German).
-- =============================================================

INSERT INTO `services`
(`id`, `type`, `featured`, `is_active`, `display_order`,
 `featured_image`, `image_url`, `image_asset_id`,
 `area`, `duration`, `maintenance`, `season`, `thickness`, `equipment`,
 `created_at`, `updated_at`)
VALUES
('90000000-0000-4000-8000-000000000001', 'massage', 1, 1, 1,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp',
 NULL,
 'Ganzkörper', '60–90 Min.', 'Nach Bedarf', 'Ganzjährig', NULL, 'Massageöl, Handtücher, ruhige Musik (optional)',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000002', 'massage', 0, 1, 2,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870870/uploads/anastasia/service-images/47-1748870862808-617707981.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870870/uploads/anastasia/service-images/47-1748870862808-617707981.webp',
 NULL,
 'Ganzkörper + Dehnung', '90 Min.', 'Nach Bedarf', 'Ganzjährig', NULL, 'Bequeme Kleidung, Matte, Kissen',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000003', 'massage', 0, 1, 3,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870873/uploads/anastasia/service-images/27-1748870868871-393082412.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870873/uploads/anastasia/service-images/27-1748870868871-393082412.webp',
 NULL,
 'Rücken + Nacken + Schultern', '45–60 Min.', 'Wöchentlich / nach Bedarf', 'Ganzjährig', NULL, 'Massageöl, Handtücher',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000004', 'massage', 0, 1, 4,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870875/uploads/anastasia/service-images/23-1748870871149-393898680.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870875/uploads/anastasia/service-images/23-1748870871149-393898680.webp',
 NULL,
 'Ganzkörper (sanft)', '60 Min.', 'Nach Bedarf', 'Ganzjährig', NULL, 'Aromaöle (optional), Handtücher',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000005', 'massage', 0, 1, 5,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870453/uploads/anastasia/service-images/35-1748870449978-569571977.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870453/uploads/anastasia/service-images/35-1748870449978-569571977.webp',
 NULL,
 'Füße + Unterschenkel', '45 Min.', 'Nach Bedarf', 'Ganzjährig', NULL, 'Creme, Handtücher',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('90000000-0000-4000-8000-000000000006', 'massage', 0, 1, 6,
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870469/uploads/anastasia/service-images/32-1748870457788-644704006.webp',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870469/uploads/anastasia/service-images/32-1748870457788-644704006.webp',
 NULL,
 'Ganzkörper (intuitiv)', '75–90 Min.', 'Nach Bedarf', 'Ganzjährig', NULL, 'Massageöl, Handtücher, Atem-/Achtsamkeitsimpulse (optional)',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `type`           = VALUES(`type`),
  `featured`       = VALUES(`featured`),
  `is_active`      = VALUES(`is_active`),
  `display_order`  = VALUES(`display_order`),
  `featured_image` = VALUES(`featured_image`),
  `image_url`      = VALUES(`image_url`),
  `image_asset_id` = VALUES(`image_asset_id`),
  `area`           = VALUES(`area`),
  `duration`       = VALUES(`duration`),
  `maintenance`    = VALUES(`maintenance`),
  `season`         = VALUES(`season`),
  `thickness`      = VALUES(`thickness`),
  `equipment`      = VALUES(`equipment`),
  `updated_at`     = VALUES(`updated_at`);

-- =============================================================
-- I18N: services_i18n (TR + DE + EN)
-- Note: slug lowercase + hyphen, unique per locale
-- =============================================================

INSERT INTO `services_i18n`
(`id`, `service_id`, `locale`,
 `slug`, `name`, `description`, `material`, `price`, `includes`, `warranty`, `image_alt`,
 `area`, `duration`, `maintenance`, `season`, `thickness`, `equipment`,
 `tags`, `meta_title`, `meta_description`, `meta_keywords`,
 `created_at`, `updated_at`)
VALUES

-- 1) Energetische Massage (core)
('91000000-0000-4000-8000-000000000101', '90000000-0000-4000-8000-000000000001', 'de',
 'energetische-massage-bonn', 'Energetische Entspannungsmassage',
 'In ruhiger Atmosphäre lade ich Sie zu einer energetischen Entspannungsmassage mit geschlossenen Augen ein. Durch achtsame Berührungen, bewusste Präsenz und einen geschützten Raum darf tiefe Entspannung entstehen.\n\nDer Fokus richtet sich nach innen: Sie dürfen loslassen, ohne leisten zu müssen. Die Aufmerksamkeit liegt auf Atmung, Körperwahrnehmung und dem Fluss der Energie im Körper.\n\nJede Sitzung ist individuell, respektvoll und klar abgegrenzt. Vor der Behandlung findet ein kurzes Gespräch statt – nur mit vorherigem Einverständnis.\n\nWährend der Massage arbeite ich häufig ebenfalls mit geschlossenen Augen. Mit einer inneren Haltung von Dankbarkeit und einer stillen Visualisierung von Licht und Liebe kann sich die innere Frequenz beruhigen. So spüre ich Muskeln und feine Spannungen oft noch genauer und kann Impulse setzen, die den Energiefluss unterstützen.\n\nDiese Massage kann unterstützen:\n- Körperwahrnehmung\n- Innere Ruhe und Balance\n- Achtsamkeit in klaren Grenzen\n\nEin Raum für Entspannung – nicht für Erwartungen. Termin nach Vereinbarung.',
 'Massageöl (optional)', '60–90 Min.', 'Vorgespräch + Massage (Augen geschlossen) + Nachruhe', '—',
 'Energetische Entspannungsmassage in Bonn',
 'Ganzkörper', '60–90 Min.', 'Nach Bedarf', 'Ganzjährig', NULL,
 'Massageöl, Handtücher, ruhige Musik (optional)',
 'energetisch,entspannungsmassage,bonn,achtsamkeit,energiearbeit', 'Energetische Entspannungsmassage in Bonn | KÖNIG ENERGETIK',
 'KÖNIG ENERGETIK – Energetische Entspannungsmassage in Bonn. Ankommen bei dir selbst: achtsam, intuitiv, tief entspannend.',
 'energetische entspannungsmassage bonn,energetische massage bonn,anastasia könig,könig energetik,massage bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000102', '90000000-0000-4000-8000-000000000001', 'en',
 'energetic-massage-bonn', 'Energetic Relaxation Massage',
 'In a calm atmosphere, I invite you to an energetic relaxation massage with closed eyes. Through mindful touch, grounded presence, and a protected space, deep relaxation can unfold.\n\nThe focus turns inward: you can let go—without having to perform. Attention rests on breath, body awareness, and the flow of energy within the body.\n\nEach session is individual, respectful, and clearly bounded. A brief conversation takes place beforehand—only with your prior consent.\n\nDuring the massage, I often keep my eyes closed as well. With an inner attitude of gratitude and a quiet visualization of light and love, the nervous system can settle. This helps me sense muscular tension more precisely and offer impulses that can support the body’s energy flow.\n\nThis massage may support:\n- Body awareness\n- Inner calm and balance\n- Mindfulness within clear boundaries\n\nA space for relaxation—not for expectations. Appointments by arrangement.',
 'Massage oil (optional)', '60–90 min', 'Check-in + closed-eye massage + quiet finish', '—',
 'Energetic relaxation massage in Bonn',
 'Full body', '60–90 min', 'As needed', 'Year-round', NULL,
 'Massage oil, towels, calm music (optional)',
 'energetic,relaxation,massage,bonn,mindful,energy', 'Energetic Relaxation Massage in Bonn | KÖNIG ENERGETIK',
 'KÖNIG ENERGETIK – Energetic relaxation massage in Bonn. Arrive back to yourself: mindful, intuitive, deeply relaxing.',
 'energetic relaxation massage bonn,energetic massage bonn,anastasia könig,könig energetik,massage bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000103', '90000000-0000-4000-8000-000000000001', 'tr',
 'bonn-enerjetik-masaj', 'Enerjetik Rahatlama Masajı',
 'Sakin bir atmosferde, gözler kapalı yapılan enerjetik rahatlama masajına davetlisiniz. Dikkatli dokunuş, anda kalma ve güvenli bir alanla derin bir gevşeme hâli desteklenir.\n\nOdak içe döner: hiçbir şey “başarmadan” bırakabilirsiniz. Nefes, beden farkındalığı ve beden içindeki enerji akışı seansın merkezindedir.\n\nHer seans kişiye özeldir; saygılıdır ve sınırları nettir. Uygulama öncesi kısa bir görüşme yapılır ve yalnızca onayınızla ilerlenir.\n\nMasaj sırasında ben de çoğu zaman gözlerimi kapatırım. Şükran hâliyle ve ışık-sevgi gibi sakinleştirici imgelerle çalışmak, bedendeki gerginlikleri daha iyi hissetmeme ve enerji akışını destekleyen dokunuşlar sunmama yardımcı olur.\n\nBu masaj şunları destekleyebilir:\n- Beden farkındalığı\n- İçsel sakinlik ve denge\n- Net sınırlar içinde farkındalık\n\nBeklentiler için değil; dinlenmek için bir alan. Termin randevu ile.',
 'Masaj yağı (opsiyonel)', '60–90 dk', 'Ön görüşme + gözler kapalı seans + dinlenme', '—',
 'Bonn’da enerjetik rahatlama masajı',
 'Tüm vücut', '60–90 dk', 'İhtiyaca göre', 'Tüm yıl', NULL,
 'Masaj yağı, havlu, sakin müzik (opsiyonel)',
 'enerjetik,rahatlama,masaj,bonn,nefes,farkindalik', 'Bonn’da Enerjetik Rahatlama Masajı | KÖNIG ENERGETIK',
 'KÖNIG ENERGETIK – Bonn’da enerjetik rahatlama masajı. Kendine dönmek için: nazik, sezgisel, derin rahatlatıcı.',
 'bonn enerjetik rahatlama masaji,bonn enerjetik masaj,anastasia könig,könig energetik,masaj bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 2) Thai Yoga Massage (Thailand-inspired)
('91000000-0000-4000-8000-000000000201', '90000000-0000-4000-8000-000000000002', 'de',
 'thai-yoga-massage', 'Thai Yoga Massage',
 'Eine dynamische, zugleich wohltuende Behandlung mit passiven Dehnungen, Druckpunkten und fließenden Übergängen. Die Thai Yoga Massage bringt Weite in den Körper, unterstützt Beweglichkeit und schenkt ein tiefes Gefühl von Klarheit und Leichtigkeit. Inspiriert von Techniken, die Anastasia König in Thailand praktisch erlernt und weiterentwickelt hat.',
 NULL, '90 Min.', 'Ankommen + Thai-Techniken (Dehnung/Druck) + Nachruhe', '—',
 'Thai Yoga Massage in Bonn',
 'Ganzkörper + Dehnung', '90 Min.', 'Nach Bedarf', 'Ganzjährig', NULL,
 'Bequeme Kleidung, Matte, Kissen',
 'thai,yoga,massage,bonn,dehnung,beweglichkeit', 'Thai Yoga Massage in Bonn | KÖNIG ENERGETIK',
 'Thai Yoga Massage in Bonn: Dehnung, Druckpunkte und fließende Übergänge – achtsam, kraftvoll, zentrierend.',
 'thai yoga massage bonn,thai massage bonn,dehnung,massage bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000202', '90000000-0000-4000-8000-000000000002', 'en',
 'thai-yoga-massage', 'Thai Yoga Massage',
 'A dynamic yet grounding session with passive stretches, acupressure points, and flowing transitions. Thai Yoga Massage can create space in the body, support mobility, and leave you feeling clear and light. Inspired by techniques Anastasia König learned and refined through hands-on training in Thailand.',
 NULL, '90 min', 'Arrival + Thai techniques (stretch/pressure) + quiet finish', '—',
 'Thai Yoga Massage in Bonn',
 'Full body + stretch', '90 min', 'As needed', 'Year-round', NULL,
 'Comfortable clothing, mat, pillow',
 'thai,yoga,massage,bonn,stretch,mobility', 'Thai Yoga Massage in Bonn | KÖNIG ENERGETIK',
 'Thai Yoga Massage in Bonn: stretches, acupressure, and flow – mindful, powerful, centering.',
 'thai yoga massage bonn,thai massage bonn,stretching,massage bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000203', '90000000-0000-4000-8000-000000000002', 'tr',
 'thai-yoga-masaj', 'Thai Yoga Masajı',
 'Pasif esnetmeler, baskı noktaları ve akışkan geçişlerle ilerleyen, dinamik ama dengeleyici bir seans. Thai Yoga masajı bedende alan açar, hareket kabiliyetini destekler ve zihne ferahlık verir. Anastasia König’in Tayland’da edindiği uygulamalı eğitimlerden ilham alır.',
 NULL, '90 dk', 'Karşılama + Thai teknikleri (esneme/baskı) + dinlenme', '—',
 'Bonn’da Thai Yoga masajı',
 'Tüm vücut + esneme', '90 dk', 'İhtiyaca göre', 'Tüm yıl', NULL,
 'Rahat kıyafet, mat, yastık',
 'thai,yoga,masaj,bonn,esneme,rahatlama', 'Bonn’da Thai Yoga Masajı | KÖNIG ENERGETIK',
 'Thai Yoga masajı: esneme, baskı ve akış – dikkatli, güçlü ve merkezleyici bir deneyim.',
 'thai yoga masaj bonn,thai masaj bonn,esneme,masaj bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 3) Rücken & Nacken Release
('91000000-0000-4000-8000-000000000301', '90000000-0000-4000-8000-000000000003', 'de',
 'ruecken-nacken-release', 'Rücken & Nacken Release',
 'Gezielte Arbeit an Rücken, Nacken und Schultern – dort, wo sich Alltag, Bildschirmzeit und Verantwortung oft ablagern. Mit ruhigem Druck, bewusster Atmung und fein abgestimmten Griffen entsteht wieder Raum. Ideal, wenn der Kopf voll ist und der Körper nach Entlastung ruft.',
 'Massageöl', '45–60 Min.', 'Kurzes Vorgespräch + Fokusbehandlung + Nachruhe', '—',
 'Rücken- und Nackenmassage in Bonn',
 'Rücken + Nacken + Schultern', '45–60 Min.', 'Wöchentlich / nach Bedarf', 'Ganzjährig', NULL,
 'Massageöl, Handtücher',
 'ruecken,nacken,schultern,bonn,entspannung', 'Rücken & Nacken Release | KÖNIG ENERGETIK Bonn',
 'Rücken- und Nackenbehandlung in Bonn – gezielt, achtsam, wohltuend. Für neue Weite und Ruhe.',
 'rücken nacken massage bonn,schultern verspannt,massage bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000302', '90000000-0000-4000-8000-000000000003', 'en',
 'back-neck-release', 'Back & Neck Release',
 'Focused work for back, neck, and shoulders – where daily stress and screen time often settle. With steady pressure, guided breathing, and carefully chosen techniques, your body can feel spacious again. Ideal when your mind feels busy and your body asks for relief.',
 'Massage oil', '45–60 min', 'Check-in + focused session + quiet finish', '—',
 'Back and neck massage in Bonn',
 'Back + neck + shoulders', '45–60 min', 'Weekly / as needed', 'Year-round', NULL,
 'Massage oil, towels',
 'back,neck,shoulders,bonn,relief,relaxation', 'Back & Neck Release | KÖNIG ENERGETIK Bonn',
 'Back and neck session in Bonn – focused, mindful, deeply soothing. Create space and calm.',
 'back neck massage bonn,shoulder tension,massage bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000303', '90000000-0000-4000-8000-000000000003', 'tr',
 'sirt-boyun-rahatlama', 'Sırt & Boyun Rahatlatma',
 'Sırt, boyun ve omuzlara odaklanan, günlük stresin biriktiği alanları yumuşatan bir seans. Dengeli baskı, nefes farkındalığı ve özenle seçilmiş tekniklerle beden yeniden genişler. Zihnin dolu olduğu günlerde özellikle iyi gelir.',
 'Masaj yağı', '45–60 dk', 'Kısa değerlendirme + odak masaj + dinlenme', '—',
 'Bonn’da sırt ve boyun masajı',
 'Sırt + boyun + omuzlar', '45–60 dk', 'Haftalık / ihtiyaca göre', 'Tüm yıl', NULL,
 'Masaj yağı, havlu',
 'sirt,boyun,omuz,bonn,rahatlama', 'Sırt & Boyun Rahatlatma | KÖNIG ENERGETIK Bonn',
 'Bonn’da sırt ve boyun odaklı masaj – dikkatli, dengeli ve huzur verici. Yeni bir ferahlık için.',
 'sırt boyun masaj bonn,omuz gerginliği,masaj bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 4) Aroma-Energie Massage
('91000000-0000-4000-8000-000000000401', '90000000-0000-4000-8000-000000000004', 'de',
 'aroma-energie-massage', 'Aroma-Energie Massage',
 'Sanfte Massage in Verbindung mit ausgewählten Düften. Wenn der Tag laut war, wird es hier leise: Berührung und Aroma begleiten Sie zurück in einen Zustand von Ruhe, Wärme und innerer Präsenz. Die Öle werden – wenn gewünscht – passend zu Ihrer Stimmung ausgewählt.',
 'Ätherische Öle (optional)', '60 Min.', 'Ankommen + sanfte Massage + Nachruhe', '—',
 'Aroma Massage in Bonn',
 'Ganzkörper (sanft)', '60 Min.', 'Nach Bedarf', 'Ganzjährig', NULL,
 'Aromaöle (optional), Handtücher',
 'aroma,energie,massage,bonn,ruhe,stress', 'Aroma-Energie Massage | KÖNIG ENERGETIK Bonn',
 'Aroma-Energie Massage in Bonn – sanft, duftend, tief entspannend. Für Ruhe und innere Weite.',
 'aroma massage bonn,ätherische öle,massage bonn,entspannung',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000402', '90000000-0000-4000-8000-000000000004', 'en',
 'aroma-energy-massage', 'Aroma Energy Massage',
 'A gentle massage supported by selected aromas. When the day has been loud, this is where it becomes quiet: touch and scent guide you back to warmth, calm, and inner presence. Oils can be chosen to match your mood if you wish.',
 'Essential oils (optional)', '60 min', 'Arrival + gentle massage + quiet finish', '—',
 'Aroma massage in Bonn',
 'Full body (gentle)', '60 min', 'As needed', 'Year-round', NULL,
 'Aroma oils (optional), towels',
 'aroma,energy,massage,bonn,calm,stress', 'Aroma Energy Massage | KÖNIG ENERGETIK Bonn',
 'Aroma energy massage in Bonn – gentle, fragrant, deeply relaxing. For calm and spaciousness.',
 'aroma massage bonn,essential oils,massage bonn,relaxation',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000403', '90000000-0000-4000-8000-000000000004', 'tr',
 'aroma-enerji-masaji', 'Aroma Enerji Masajı',
 'Seçilmiş aromalarla desteklenen yumuşak bir masaj. Gün gürültülü geçtiyse, burada sessizlik başlar: dokunuş ve koku, bedeni sıcaklığa ve zihni dinginliğe taşır. Dilerseniz yağlar o anki ruh hâlinize göre seçilir.',
 'Esansiyel yağlar (opsiyonel)', '60 dk', 'Karşılama + nazik masaj + dinlenme', '—',
 'Bonn’da aroma masajı',
 'Tüm vücut (nazik)', '60 dk', 'İhtiyaca göre', 'Tüm yıl', NULL,
 'Aroma yağları (opsiyonel), havlu',
 'aroma,enerji,masaj,bonn,stres,rahatlama', 'Aroma Enerji Masajı | KÖNIG ENERGETIK Bonn',
 'Bonn’da aroma enerji masajı – yumuşak, huzurlu ve derin rahatlatıcı. İçsel ferahlık için.',
 'aroma masaj bonn,esansiyel yağlar,masaj bonn,rahatlama',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 5) Fußreflex & Energiepunkte
('91000000-0000-4000-8000-000000000501', '90000000-0000-4000-8000-000000000005', 'de',
 'fussreflex-energie', 'Fußreflex & Energiepunkte',
 'Eine bodenständige Behandlung für Füße und Unterschenkel. Mit Druckpunkten, langsamen Ausstreichungen und wohltuender Ruhe entsteht ein Gefühl von Erdung. Ideal, wenn Sie viel stehen, viel denken oder einfach wieder bei sich ankommen möchten.',
 'Creme', '45 Min.', 'Kurzes Ankommen + Fuß-/Unterschenkelarbeit + Nachruhe', '—',
 'Fußreflexmassage in Bonn',
 'Füße + Unterschenkel', '45 Min.', 'Nach Bedarf', 'Ganzjährig', NULL,
 'Creme, Handtücher',
 'fuss,reflex,erdung,bonn,entspannung', 'Fußreflex & Energiepunkte | KÖNIG ENERGETIK Bonn',
 'Fußreflex und Energiepunkte in Bonn – beruhigend, erdend, wohltuend. Für neue Stabilität.',
 'fußreflex bonn,fußmassage bonn,massage bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000502', '90000000-0000-4000-8000-000000000005', 'en',
 'foot-reflex-energy', 'Foot Reflex & Energy Points',
 'A grounding session for feet and lower legs. With pressure points, slow strokes, and quiet presence, the body can feel steady again. Great if you stand a lot, think a lot, or simply want to come back to yourself.',
 'Cream', '45 min', 'Arrival + foot/lower-leg work + quiet finish', '—',
 'Foot reflex massage in Bonn',
 'Feet + lower legs', '45 min', 'As needed', 'Year-round', NULL,
 'Cream, towels',
 'feet,reflex,grounding,bonn,relaxation', 'Foot Reflex & Energy Points | KÖNIG ENERGETIK Bonn',
 'Foot reflex and energy points in Bonn – calming, grounding, deeply soothing. For steadiness.',
 'foot reflex bonn,foot massage bonn,massage bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000503', '90000000-0000-4000-8000-000000000005', 'tr',
 'ayak-refleks-enerji', 'Ayak Refleks & Enerji Noktaları',
 'Ayaklar ve alt bacaklar için topraklayıcı bir seans. Baskı noktaları, yavaş dokunuşlar ve sakin bir ritimle beden yeniden dengelenir. Çok ayakta kalan, çok düşünen veya sadece kendine dönmek isteyenler için idealdir.',
 'Krem', '45 dk', 'Karşılama + ayak/alt bacak çalışması + dinlenme', '—',
 'Bonn’da ayak refleks masajı',
 'Ayaklar + alt bacak', '45 dk', 'İhtiyaca göre', 'Tüm yıl', NULL,
 'Krem, havlu',
 'ayak,refleks,topraklanma,bonn,rahatlama', 'Ayak Refleks & Enerji Noktaları | KÖNIG ENERGETIK Bonn',
 'Bonn’da ayak refleks ve enerji noktaları – sakin, topraklayıcı, iyi hissettiren bir deneyim.',
 'ayak refleks bonn,ayak masaj bonn,masaj bonn',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- 6) Intuitive Energetik Session
('91000000-0000-4000-8000-000000000601', '90000000-0000-4000-8000-000000000006', 'de',
 'intuitive-energetik-session', 'Intuitive Energetik Session',
 'Eine besonders feinfühlige Behandlung, die sich an Ihrem momentanen Zustand orientiert. Anastasia König arbeitet aufmerksam mit dem, was sich zeigt – im Körper, in der Atmung, im Nervensystem. Berührung wird hier zur Sprache: klar, warm, respektvoll. Für Menschen, die nicht nur Entspannung suchen, sondern ein tiefes Ankommen.',
 'Massageöl', '75–90 Min.', 'Ankommen + intuitive Behandlung + Nachruhe', '—',
 'Intuitive Energiearbeit in Bonn',
 'Ganzkörper (intuitiv)', '75–90 Min.', 'Nach Bedarf', 'Ganzjährig', NULL,
 'Massageöl, Handtücher, Atem-/Achtsamkeitsimpulse (optional)',
 'intuitiv,energetik,bonn,beruehrung,achtsamkeit', 'Intuitive Energetik Session | KÖNIG ENERGETIK Bonn',
 'Intuitive Energetik Session in Bonn – achtsam, tief, mit Herz. Für ein Ankommen im Körper.',
 'energiearbeit bonn,intuitive massage,anastasia könig,könig energetik',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000602', '90000000-0000-4000-8000-000000000006', 'en',
 'intuitive-energetic-session', 'Intuitive Energetic Session',
 'A highly sensitive session shaped around how you feel today. Anastasia König works with attentive presence, listening to the body, the breath, and the nervous system. Touch becomes a language here: clear, warm, respectful. For those seeking not only relaxation, but a deeper sense of arrival.',
 'Massage oil', '75–90 min', 'Arrival + intuitive session + quiet finish', '—',
 'Intuitive energy work in Bonn',
 'Full body (intuitive)', '75–90 min', 'As needed', 'Year-round', NULL,
 'Massage oil, towels, breath/mindfulness cues (optional)',
 'intuitive,energy,bonn,touch,mindful', 'Intuitive Energetic Session | KÖNIG ENERGETIK Bonn',
 'Intuitive energetic session in Bonn – mindful, deep, heart-led. A way back into the body.',
 'energy work bonn,intuitive massage,anastasia könig,könig energetik',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('91000000-0000-4000-8000-000000000603', '90000000-0000-4000-8000-000000000006', 'tr',
 'sezgisel-enerjetik-seans', 'Sezgisel Enerjetik Seans',
 'O gün nasıl hissediyorsanız, seans da oradan başlar. Anastasia König; bedenin sinyallerini, nefesi ve sinir sistemini dikkatle dinleyerek çalışır. Dokunuş burada bir dile dönüşür: net, sıcak ve saygılı. Sadece gevşemek değil, daha derinden “yerleşmek” isteyenler için.',
 'Masaj yağı', '75–90 dk', 'Karşılama + sezgisel seans + dinlenme', '—',
 'Bonn’da sezgisel enerji çalışması',
 'Tüm vücut (sezgisel)', '75–90 dk', 'İhtiyaca göre', 'Tüm yıl', NULL,
 'Masaj yağı, havlu, nefes/farkındalık yönlendirmeleri (opsiyonel)',
 'sezgisel,enerjetik,bonn,dokunus,rahatlama', 'Sezgisel Enerjetik Seans | KÖNIG ENERGETIK Bonn',
 'Bonn’da sezgisel enerjetik seans – dikkatli, derin ve kalpten. Bedene dönüş için.',
 'enerji çalışması bonn,sezgisel masaj,anastasia könig,könig energetik',
 '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `slug`             = VALUES(`slug`),
  `name`             = VALUES(`name`),
  `description`      = VALUES(`description`),
  `material`         = VALUES(`material`),
  `price`            = VALUES(`price`),
  `includes`         = VALUES(`includes`),
  `warranty`         = VALUES(`warranty`),
  `image_alt`        = VALUES(`image_alt`),
  `area`             = VALUES(`area`),
  `duration`         = VALUES(`duration`),
  `maintenance`      = VALUES(`maintenance`),
  `season`           = VALUES(`season`),
  `thickness`        = VALUES(`thickness`),
  `equipment`        = VALUES(`equipment`),
  `tags`             = VALUES(`tags`),
  `meta_title`       = VALUES(`meta_title`),
  `meta_description` = VALUES(`meta_description`),
  `meta_keywords`    = VALUES(`meta_keywords`),
  `updated_at`       = VALUES(`updated_at`);

-- =============================================================
-- OPTIONAL: gallery images (1 image per service) + i18n
-- We re-use the featured image URLs for consistency.
-- =============================================================

INSERT INTO `service_images`
(`id`, `service_id`, `image_asset_id`, `image_url`, `is_active`, `display_order`, `created_at`, `updated_at`)
VALUES
('92000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', NULL, 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000002', NULL, 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870870/uploads/anastasia/service-images/47-1748870862808-617707981.webp', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000003', NULL, 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870873/uploads/anastasia/service-images/27-1748870868871-393082412.webp', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000004', '90000000-0000-4000-8000-000000000004', NULL, 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870875/uploads/anastasia/service-images/23-1748870871149-393898680.webp', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000005', '90000000-0000-4000-8000-000000000005', NULL, 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870453/uploads/anastasia/service-images/35-1748870449978-569571977.webp', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('92000000-0000-4000-8000-000000000006', '90000000-0000-4000-8000-000000000006', NULL, 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870469/uploads/anastasia/service-images/32-1748870457788-644704006.webp', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `image_asset_id` = VALUES(`image_asset_id`),
  `image_url`      = VALUES(`image_url`),
  `is_active`      = VALUES(`is_active`),
  `display_order`  = VALUES(`display_order`),
  `updated_at`     = VALUES(`updated_at`);

INSERT INTO `service_images_i18n`
(`id`, `image_id`, `locale`, `title`, `alt`, `caption`, `created_at`, `updated_at`)
VALUES
('93000000-0000-4000-8000-000000000101', '92000000-0000-4000-8000-000000000001', 'de', 'Energetische Massage', 'Energetische Massage in Bonn', 'Wohltuende Berührung mit Herz', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000102', '92000000-0000-4000-8000-000000000001', 'en', 'Energetic Massage', 'Energetic massage in Bonn', 'Soothing touch with heart', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000103', '92000000-0000-4000-8000-000000000001', 'tr', 'Enerjetik Masaj', 'Bonn’da enerjetik masaj', 'Kalpten gelen şefkatli dokunuş', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000201', '92000000-0000-4000-8000-000000000002', 'de', 'Thai Yoga Massage', 'Thai Yoga Massage in Bonn', 'Dehnung, Druckpunkte, fließender Rhythmus', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000202', '92000000-0000-4000-8000-000000000002', 'en', 'Thai Yoga Massage', 'Thai yoga massage in Bonn', 'Stretch, acupressure, and flow', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000203', '92000000-0000-4000-8000-000000000002', 'tr', 'Thai Yoga Masajı', 'Bonn’da Thai Yoga masajı', 'Esneme, baskı ve akış', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000301', '92000000-0000-4000-8000-000000000003', 'de', 'Rücken & Nacken Release', 'Rücken- und Nackenmassage in Bonn', 'Gezielt lösen, ruhig werden', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000302', '92000000-0000-4000-8000-000000000003', 'en', 'Back & Neck Release', 'Back and neck massage in Bonn', 'Focused relief and calm', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000303', '92000000-0000-4000-8000-000000000003', 'tr', 'Sırt & Boyun Rahatlatma', 'Bonn’da sırt ve boyun masajı', 'Gerginliği yumuşatan odak seans', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000401', '92000000-0000-4000-8000-000000000004', 'de', 'Aroma-Energie Massage', 'Aroma Massage in Bonn', 'Duft und Berührung in Harmonie', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000402', '92000000-0000-4000-8000-000000000004', 'en', 'Aroma Energy Massage', 'Aroma massage in Bonn', 'Scent and touch in harmony', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000403', '92000000-0000-4000-8000-000000000004', 'tr', 'Aroma Enerji Masajı', 'Bonn’da aroma masajı', 'Koku ve dokunuşun dengesi', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000501', '92000000-0000-4000-8000-000000000005', 'de', 'Fußreflex & Energiepunkte', 'Fußreflexmassage in Bonn', 'Erdung über die Füße', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000502', '92000000-0000-4000-8000-000000000005', 'en', 'Foot Reflex & Energy Points', 'Foot reflex massage in Bonn', 'Grounding through the feet', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000503', '92000000-0000-4000-8000-000000000005', 'tr', 'Ayak Refleks & Enerji Noktaları', 'Bonn’da ayak refleks masajı', 'Ayaklardan topraklanma', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

('93000000-0000-4000-8000-000000000601', '92000000-0000-4000-8000-000000000006', 'de', 'Intuitive Energetik Session', 'Intuitive Energiearbeit in Bonn', 'Feinfühlig, klar, tief', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000602', '92000000-0000-4000-8000-000000000006', 'en', 'Intuitive Energetic Session', 'Intuitive energy work in Bonn', 'Sensitive, clear, deep', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('93000000-0000-4000-8000-000000000603', '92000000-0000-4000-8000-000000000006', 'tr', 'Sezgisel Enerjetik Seans', 'Bonn’da sezgisel enerji çalışması', 'Duyarlı, net, derin', '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `alt`        = VALUES(`alt`),
  `caption`    = VALUES(`caption`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
