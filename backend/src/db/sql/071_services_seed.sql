-- =============================================================
-- 071_services_seed.sql (KÖNIGSMASSAGE)
-- Single-service seed
-- - Keeps only one public service:
--   Energetische Entspannungsmassage
-- - Requires: 070_services.sql already applied
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- Clear service-local tables so removed service variants disappear completely.
DELETE FROM `service_images_i18n`;
DELETE FROM `service_images`;
DELETE FROM `services_i18n`;
DELETE FROM `services`;

INSERT INTO `services`
(`id`, `type`, `featured`, `is_active`, `display_order`,
 `featured_image`, `image_url`, `image_asset_id`,
 `area`, `duration`, `maintenance`, `season`, `thickness`, `equipment`,
 `created_at`, `updated_at`)
VALUES
(
  '90000000-0000-4000-8000-000000000001',
  'massage',
  1,
  1,
  1,
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp',
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp',
  NULL,
  'Ganzkoerper',
  'Mindestens 120 Min.',
  'Individuell',
  'Ganzjaehrig',
  NULL,
  'Massageoel, Handtuecher, geschuetzter Raum, achtsame Begleitung',
  '2024-01-01 00:00:00.000',
  '2024-01-01 00:00:00.000'
)
ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `featured` = VALUES(`featured`),
  `is_active` = VALUES(`is_active`),
  `display_order` = VALUES(`display_order`),
  `featured_image` = VALUES(`featured_image`),
  `image_url` = VALUES(`image_url`),
  `image_asset_id` = VALUES(`image_asset_id`),
  `area` = VALUES(`area`),
  `duration` = VALUES(`duration`),
  `maintenance` = VALUES(`maintenance`),
  `season` = VALUES(`season`),
  `thickness` = VALUES(`thickness`),
  `equipment` = VALUES(`equipment`),
  `updated_at` = VALUES(`updated_at`);

INSERT INTO `services_i18n`
(`id`, `service_id`, `locale`,
 `slug`, `name`, `description`, `material`, `price`, `price_numeric`, `includes`, `warranty`, `image_alt`,
 `area`, `duration`, `maintenance`, `season`, `thickness`, `equipment`,
 `tags`, `meta_title`, `meta_description`, `meta_keywords`,
 `created_at`, `updated_at`)
VALUES
(
  '91000000-0000-4000-8000-000000000101',
  '90000000-0000-4000-8000-000000000001',
  'de',
  'energetische-entspannungsmassage',
  'Energetische Entspannungsmassage',
  'In ruhiger Atmosphaere lade ich Sie zu einer energetischen Entspannungsmassage mit geschlossenen Augen ein. Durch achtsame Beruehrungen, bewusste Praesenz und einen geschuetzten Raum darf tiefe Entspannung entstehen.' '\n\n'
  'Der Fokus richtet sich nach innen: Sie duerfen loslassen, ohne leisten zu muessen. Die Aufmerksamkeit liegt auf Atmung, Koerperwahrnehmung und dem Fluss der Energie im Koerper.' '\n\n'
  'Jede Sitzung ist individuell, respektvoll und klar abgegrenzt. Vor der Behandlung findet ein kurzes Gespraech statt, nur mit vorherigem Einverstaendnis.' '\n\n'
  'Waehrend der Massage arbeite ich haeufig ebenfalls mit geschlossenen Augen. Mit einer inneren Haltung von Dankbarkeit und einer stillen Visualisierung von Licht und Liebe kann sich die innere Frequenz beruhigen. So spuere ich Muskeln und feine Spannungen oft noch genauer und kann Impulse setzen, die den Energiefluss unterstuetzen.' '\n\n'
  'Diese Massage kann unterstuetzen:' '\n'
  '- Koerperwahrnehmung' '\n'
  '- Innere Ruhe und Balance' '\n'
  '- Achtsamkeit in klaren Grenzen' '\n\n'
  'Ein Raum fuer Entspannung, nicht fuer Erwartungen.' '\n\n'
  '## Dauer & Terminvereinbarung' '\n\n'
  'Da jede Seele wundervoll und einzigartig ist, braucht auch jeder Koerper unterschiedliche Zeiten fuer das Ankommen und die Entspannung. Meistens spuere und hoere ich das durch einen tiefen Atemzug, ab da beginnt eigentlich meine punktuelle Massage.' '\n\n'
  'Bitte planen Sie mindestens zwei Stunden ein, da ich keinen Stress mag und mich individuell entscheide, auch etwas mehr Zeit zu investieren. Termin nach Vereinbarung.',
  'Massageoel (optional)',
  '80 EUR',
  80.00,
  'Kurzes Vorgespraech, individuelle Massage, Zeit zum Ankommen und Nachspueren',
  'Termin nach Vereinbarung. Bitte mindestens zwei Stunden einplanen.',
  'Energetische Entspannungsmassage in ruhiger Atmosphaere',
  'Ganzkoerper',
  'Mindestens 120 Min.',
  'Individuell',
  'Ganzjaehrig',
  NULL,
  'Massageoel, Handtuecher, geschuetzter Raum, achtsame Begleitung',
  'energetische entspannungsmassage,energetische massage,bonn,achtsamkeit,ruhe,balance',
  'Energetische Entspannungsmassage | Koenigsmassage Bonn',
  'Energetische Entspannungsmassage in Bonn. Achtsame Beruehrung, tiefe Entspannung, klare Grenzen und individuelle Zeit zum Ankommen.',
  'energetische entspannungsmassage bonn,energetische massage bonn,koenigsmassage bonn,achtsame massage bonn',
  '2024-01-01 00:00:00.000',
  '2024-01-01 00:00:00.000'
)
ON DUPLICATE KEY UPDATE
  `slug` = VALUES(`slug`),
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `material` = VALUES(`material`),
  `price` = VALUES(`price`),
  `price_numeric` = VALUES(`price_numeric`),
  `includes` = VALUES(`includes`),
  `warranty` = VALUES(`warranty`),
  `image_alt` = VALUES(`image_alt`),
  `area` = VALUES(`area`),
  `duration` = VALUES(`duration`),
  `maintenance` = VALUES(`maintenance`),
  `season` = VALUES(`season`),
  `thickness` = VALUES(`thickness`),
  `equipment` = VALUES(`equipment`),
  `tags` = VALUES(`tags`),
  `meta_title` = VALUES(`meta_title`),
  `meta_description` = VALUES(`meta_description`),
  `meta_keywords` = VALUES(`meta_keywords`),
  `updated_at` = VALUES(`updated_at`);

-- TR locale
INSERT INTO `services_i18n`
(`id`, `service_id`, `locale`,
 `slug`, `name`, `description`, `material`, `price`, `price_numeric`, `includes`, `warranty`, `image_alt`,
 `area`, `duration`, `maintenance`, `season`, `thickness`, `equipment`,
 `tags`, `meta_title`, `meta_description`, `meta_keywords`,
 `created_at`, `updated_at`)
VALUES
(
  '91000000-0000-4000-8000-000000000102',
  '90000000-0000-4000-8000-000000000001',
  'tr',
  'enerjetik-rahatlama-masaji',
  'Enerjetik Rahatlama Masaji',
  'Sakin bir atmosferde, gozlerim kapali olarak sunulan enerjetik bir rahatlama masajina sizi davet ediyorum. Bilingli dokunuslar, bilingli varlik ve korunmus bir alanda derin rahatlama olusabilir.' '\n\n'
  'Odak noktasi icte: birakabilirsiniz, bir sey basarmak zorunda kalmadan. Dikkat nefese, beden algisina ve bedendeki enerji akisina yoneliktir.' '\n\n'
  'Her seans bireysel, saygili ve net sinirlara sahiptir. Tedaviden once kisa bir gorusme yapilir, sadece onceden onay ile.' '\n\n'
  'Masaj sirasinda ben de siklikla gozlerimi kapali calisiyorum. Sukran iceren bir ic tutumla ve sessiz bir isik ve sevgi gorsellestirmesiyle ic frekans sakinlesebilir. Boylece kaslari ve ince gerilimleri daha hassas hissedebilir ve enerji akisini destekleyen impulslar verebilirim.' '\n\n'
  'Bu masaj destekleyebilir:' '\n'
  '- Beden farkindaliginizi' '\n'
  '- Ic huzur ve dengenizi' '\n'
  '- Net sinirlarda farkindalik' '\n\n'
  'Rahatlama icin bir alan, beklentiler icin degil.' '\n\n'
  '## Sure & Randevu' '\n\n'
  'Her ruh essiz oldugu icin, her beden de varmak ve rahatlamak icin farkli zamanlara ihtiyac duyar. Genellikle derin bir nefesle bunu hissederim, o andan itibaren noktasal masajim baslar.' '\n\n'
  'Lutfen en az iki saat ayirin, stresi sevmiyorum ve bireysel olarak biraz daha fazla zaman yatirmaya karar verebilirim. Randevu ile.',
  'Masaj yagi (opsiyonel)',
  '80 EUR',
  80.00,
  'Kisa on gorusme, bireysel masaj, varis ve sonrasinda hissetme zamani',
  'Randevu ile. Lutfen en az iki saat ayirin.',
  'Sakin atmosferde enerjetik rahatlama masaji',
  'Tum vucut',
  'En az 120 dk.',
  'Bireysel',
  'Tum yil',
  NULL,
  'Masaj yagi, havlular, korunmus alan, bilingli eslik',
  'enerjetik rahatlama masaji,enerjetik masaj,bonn,farkindalik,huzur,denge',
  'Enerjetik Rahatlama Masaji | Koenigsmassage Bonn',
  'Bonn da enerjetik rahatlama masaji. Bilingli dokunma, derin rahatlama, net sinirlar ve varmak icin bireysel zaman.',
  'enerjetik rahatlama masaji bonn,enerjetik masaj bonn,koenigsmassage bonn,bilingli masaj bonn',
  '2024-01-01 00:00:00.000',
  '2024-01-01 00:00:00.000'
)
ON DUPLICATE KEY UPDATE
  `slug` = VALUES(`slug`),
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `material` = VALUES(`material`),
  `price` = VALUES(`price`),
  `price_numeric` = VALUES(`price_numeric`),
  `includes` = VALUES(`includes`),
  `warranty` = VALUES(`warranty`),
  `image_alt` = VALUES(`image_alt`),
  `area` = VALUES(`area`),
  `duration` = VALUES(`duration`),
  `maintenance` = VALUES(`maintenance`),
  `season` = VALUES(`season`),
  `thickness` = VALUES(`thickness`),
  `equipment` = VALUES(`equipment`),
  `tags` = VALUES(`tags`),
  `meta_title` = VALUES(`meta_title`),
  `meta_description` = VALUES(`meta_description`),
  `meta_keywords` = VALUES(`meta_keywords`),
  `updated_at` = VALUES(`updated_at`);

-- EN locale
INSERT INTO `services_i18n`
(`id`, `service_id`, `locale`,
 `slug`, `name`, `description`, `material`, `price`, `price_numeric`, `includes`, `warranty`, `image_alt`,
 `area`, `duration`, `maintenance`, `season`, `thickness`, `equipment`,
 `tags`, `meta_title`, `meta_description`, `meta_keywords`,
 `created_at`, `updated_at`)
VALUES
(
  '91000000-0000-4000-8000-000000000103',
  '90000000-0000-4000-8000-000000000001',
  'en',
  'energetic-relaxation-massage',
  'Energetic Relaxation Massage',
  'In a calm atmosphere, I invite you to an energetic relaxation massage with closed eyes. Through mindful touch, conscious presence and a protected space, deep relaxation can arise.' '\n\n'
  'The focus is directed inward: you may let go, without having to perform. Attention is on breathing, body awareness and the flow of energy in the body.' '\n\n'
  'Each session is individual, respectful and clearly bounded. A short conversation takes place before the treatment, only with prior consent.' '\n\n'
  'During the massage, I also frequently work with my eyes closed. With an inner attitude of gratitude and a quiet visualization of light and love, the inner frequency can calm down. This way I sense muscles and subtle tensions even more precisely and can set impulses that support the energy flow.' '\n\n'
  'This massage can support:' '\n'
  '- Body awareness' '\n'
  '- Inner peace and balance' '\n'
  '- Mindfulness within clear boundaries' '\n\n'
  'A space for relaxation, not for expectations.' '\n\n'
  '## Duration & Appointment' '\n\n'
  'Since every soul is wonderful and unique, every body also needs different times for arriving and relaxing. Usually I sense this through a deep breath, from that point my targeted massage actually begins.' '\n\n'
  'Please allow at least two hours, as I do not like stress and may individually decide to invest a bit more time. By appointment.',
  'Massage oil (optional)',
  '80 EUR',
  80.00,
  'Short preliminary conversation, individual massage, time to arrive and feel afterwards',
  'By appointment. Please allow at least two hours.',
  'Energetic relaxation massage in calm atmosphere',
  'Full body',
  'At least 120 min.',
  'Individual',
  'Year-round',
  NULL,
  'Massage oil, towels, protected space, mindful accompaniment',
  'energetic relaxation massage,energetic massage,bonn,mindfulness,peace,balance',
  'Energetic Relaxation Massage | Koenigsmassage Bonn',
  'Energetic relaxation massage in Bonn. Mindful touch, deep relaxation, clear boundaries and individual time to arrive.',
  'energetic relaxation massage bonn,energetic massage bonn,koenigsmassage bonn,mindful massage bonn',
  '2024-01-01 00:00:00.000',
  '2024-01-01 00:00:00.000'
)
ON DUPLICATE KEY UPDATE
  `slug` = VALUES(`slug`),
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `material` = VALUES(`material`),
  `price` = VALUES(`price`),
  `price_numeric` = VALUES(`price_numeric`),
  `includes` = VALUES(`includes`),
  `warranty` = VALUES(`warranty`),
  `image_alt` = VALUES(`image_alt`),
  `area` = VALUES(`area`),
  `duration` = VALUES(`duration`),
  `maintenance` = VALUES(`maintenance`),
  `season` = VALUES(`season`),
  `thickness` = VALUES(`thickness`),
  `equipment` = VALUES(`equipment`),
  `tags` = VALUES(`tags`),
  `meta_title` = VALUES(`meta_title`),
  `meta_description` = VALUES(`meta_description`),
  `meta_keywords` = VALUES(`meta_keywords`),
  `updated_at` = VALUES(`updated_at`);

INSERT INTO `service_images`
(`id`, `service_id`, `image_asset_id`, `image_url`, `is_active`, `display_order`, `created_at`, `updated_at`)
VALUES
(
  '92000000-0000-4000-8000-000000000001',
  '90000000-0000-4000-8000-000000000001',
  NULL,
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1748870864/uploads/anastasia/service-images/50-1748870861414-723178027.webp',
  1,
  0,
  '2024-01-01 00:00:00.000',
  '2024-01-01 00:00:00.000'
)
ON DUPLICATE KEY UPDATE
  `image_asset_id` = VALUES(`image_asset_id`),
  `image_url` = VALUES(`image_url`),
  `is_active` = VALUES(`is_active`),
  `display_order` = VALUES(`display_order`),
  `updated_at` = VALUES(`updated_at`);

INSERT INTO `service_images_i18n`
(`id`, `image_id`, `locale`, `title`, `alt`, `caption`, `created_at`, `updated_at`)
VALUES
(
  '93000000-0000-4000-8000-000000000101',
  '92000000-0000-4000-8000-000000000001',
  'de',
  'Energetische Entspannungsmassage',
  'Energetische Entspannungsmassage in ruhiger Atmosphaere',
  'Achtsame Beruehrung, innere Ruhe und Zeit zum Ankommen.',
  '2024-01-01 00:00:00.000',
  '2024-01-01 00:00:00.000'
)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `alt` = VALUES(`alt`),
  `caption` = VALUES(`caption`),
  `updated_at` = VALUES(`updated_at`);

INSERT INTO `service_images_i18n`
(`id`, `image_id`, `locale`, `title`, `alt`, `caption`, `created_at`, `updated_at`)
VALUES
(
  '93000000-0000-4000-8000-000000000102',
  '92000000-0000-4000-8000-000000000001',
  'tr',
  'Enerjetik Rahatlama Masaji',
  'Sakin atmosferde enerjetik rahatlama masaji',
  'Bilingli dokunma, ic huzur ve varmak icin zaman.',
  '2024-01-01 00:00:00.000',
  '2024-01-01 00:00:00.000'
),
(
  '93000000-0000-4000-8000-000000000103',
  '92000000-0000-4000-8000-000000000001',
  'en',
  'Energetic Relaxation Massage',
  'Energetic relaxation massage in calm atmosphere',
  'Mindful touch, inner peace and time to arrive.',
  '2024-01-01 00:00:00.000',
  '2024-01-01 00:00:00.000'
)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `alt` = VALUES(`alt`),
  `caption` = VALUES(`caption`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
