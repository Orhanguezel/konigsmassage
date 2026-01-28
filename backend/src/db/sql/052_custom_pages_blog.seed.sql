-- =============================================================
-- FILE: 052_custom_pages_blog.seed.sql (FINAL / FULL / NO DROP)
-- Königs Massage — Blog (3 posts) — module_key='blog'
-- ✅ custom_pages: module_key only in parent
-- ✅ custom_pages_i18n: module_key YOK
-- ✅ TR / EN / DE
-- ✅ content: LONGTEXT JSON-string {"html":"..."}
-- ✅ images/storage_image_ids: LONGTEXT JSON-string
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- COMMON
-- -------------------------------------------------------------
SET @MODULE_KEY := 'blog';
SET @EMPTY_ARR := '[]';

-- =============================================================
-- BLOG POST #1 — Colon cleansing / gut health
-- =============================================================
SET @PAGE_BLOG_1 := '22222222-2222-3333-4444-555555555501';
SET @IMG_BLOG_1  := 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1754079840/uploads/anastasia/blog-images/chatgpt-image-1-aau-2025-222332-1754079838699-746555796.webp';
SET @IMAGES_1 := CONCAT('["', REPLACE(@IMG_BLOG_1, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_1,@MODULE_KEY,1,110,110,
 @IMG_BLOG_1,NULL,
 @IMG_BLOG_1,NULL,
 @IMAGES_1,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

-- I18N — BLOG #1 (TR/EN/DE)
INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_1,
  'tr',
  'Kolon Temizliği: Bağırsak Sağlığının ve İkinci Beynin Önemi',
  'kolon-temizligi-bagirsak-sagligi',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Bağırsak Sağlığı ve “İkinci Beyin”</h2>',
      '<p>Bağırsaklarımız çoğu zaman “vücudun ikinci beyni” olarak anılır. Çünkü sindirim dışında; bağışıklık, enerji düzeyi, ruh hâli ve cilt sağlığı gibi birçok alanı etkileyen karmaşık bir denge sistemine sahiptir.</p>',

      '<h3>Asidik beslenme ve yük birikimi</h3>',
      '<p>Zaman içinde bağırsaklarda çeşitli toksinler birikebilir. Şeker, beyaz un, ultra işlenmiş ürünler ve gazlı içecekler gibi asidik beslenme alışkanlıkları bu dengenin bozulmasına katkı sağlayabilir.</p>',

      '<h3>Doğal destek önerileri</h3>',
      '<ol>',
      '<li><strong>Su:</strong> Gün içinde yeterli su tüketimi sindirimi ve atılımı destekler.</li>',
      '<li><strong>Ilık limonlu su:</strong> Sabah rutininize ekleyebileceğiniz basit bir alışkanlıktır.</li>',
      '<li><strong>Lif:</strong> Yeşil yapraklı sebzeler, kök sebzeler ve lifli meyveler bağırsak hareketlerini destekler.</li>',
      '<li><strong>Chia / keten tohumu:</strong> Lif ve faydalı yağlar bakımından zengindir.</li>',
      '<li><strong>Fermente gıdalar:</strong> Örn. lahana turşusu, kombucha gibi probiyotik kaynaklar.</li>',
      '<li><strong>Bitki çayları:</strong> Nane, rezene, papatya, zencefil gibi seçenekler rahatlatıcı olabilir.</li>',
      '</ol>',

      '<h3>Kaçınılması önerilenler</h3>',
      '<p>Rafine şeker, beyaz un ürünleri, işlenmiş gıdalar, gazlı içecekler ve kızartmalar bağırsak dengesini olumsuz etkileyebilir.</p>',

      '<p><strong>Not:</strong> Bu yazı bilgilendirme amaçlıdır. Sağlık durumunuz veya özel bir diyet planınız varsa profesyonel görüş almanız önerilir.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Bağırsak sağlığı; sindirim, bağışıklık ve ruh hâli üzerinde belirleyicidir. Doğal yöntemlerle bağırsak dengesini desteklemek uzun vadeli iyilik hâline katkı sağlar.',
  'Bağırsak sağlığı ve kolon temizliği',
  'Kolon Temizliği ve Bağırsak Sağlığı | Königs Massage',
  'Bağırsak sağlığının bağışıklık ve ruh hâliyle ilişkisi; su, lif, fermente gıdalar ve doğal alışkanlıklarla destek önerileri.',
  'bagirsak sagligi,kolon,detoks,lif,fermente,probiyotik,dogal yasam',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_1,
  'en',
  'Colon Cleansing: The Importance of Gut Health and the Second Brain',
  'colon-cleansing-gut-health',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Gut Health and the “Second Brain”</h2>',
      '<p>The gut is often called the “second brain” because it influences far more than digestion. It plays a role in immunity, energy levels, mood, and even skin health.</p>',

      '<h3>Acid-forming habits and burden build-up</h3>',
      '<p>Over time, a modern diet heavy in sugar, white flour, ultra-processed foods, and soft drinks may disrupt gut balance and contribute to unnecessary burden.</p>',

      '<h3>Natural ways to support your gut</h3>',
      '<ol>',
      '<li><strong>Water:</strong> Consistent hydration supports digestion and elimination.</li>',
      '<li><strong>Warm lemon water:</strong> A simple morning routine many people enjoy.</li>',
      '<li><strong>Fiber:</strong> Leafy greens, root vegetables, and fiber-rich fruits support regularity.</li>',
      '<li><strong>Chia / flax:</strong> Rich in fiber and beneficial fats.</li>',
      '<li><strong>Fermented foods:</strong> Such as sauerkraut or kombucha as probiotic sources.</li>',
      '<li><strong>Herbal teas:</strong> Mint, fennel, chamomile, and ginger can be soothing.</li>',
      '</ol>',

      '<h3>Common foods to limit</h3>',
      '<p>Refined sugar, white flour products, processed foods, sodas, and deep-fried items may negatively affect gut balance.</p>',

      '<p><strong>Note:</strong> This article is for informational purposes only. If you have a medical condition or follow a specific diet, consult a qualified professional.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Gut health impacts digestion, immunity, and mental well-being. Practical, natural habits—hydration, fiber, fermented foods—can support long-term wellness.',
  'Gut health and colon support',
  'Colon Cleansing & Gut Health | Königs Massage',
  'A practical overview of gut health: hydration, fiber, fermented foods, and natural routines that support balance and long-term well-being.',
  'gut health,colon,fiber,fermented foods,probiotics,natural wellness',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_1,
  'de',
  'Darmreinigung: Die Bedeutung der Darmgesundheit und des zweiten Gehirns',
  'darmreinigung-darmgesundheit',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Darmgesundheit und das „zweite Gehirn“</h2>',
      '<p>Der Darm wird häufig als „zweites Gehirn“ bezeichnet, weil er weit mehr als nur die Verdauung beeinflusst. Er spielt eine Rolle für Immunsystem, Energie, Stimmung und sogar die Haut.</p>',

      '<h3>Säurebildende Gewohnheiten und Belastung</h3>',
      '<p>Eine Ernährung mit viel Zucker, Weißmehl, stark verarbeiteten Lebensmitteln und Softdrinks kann das Gleichgewicht im Darm ungünstig beeinflussen.</p>',

      '<h3>Natürliche Unterstützung im Alltag</h3>',
      '<ol>',
      '<li><strong>Wasser:</strong> Ausreichend trinken unterstützt Verdauung und Ausscheidung.</li>',
      '<li><strong>Warmes Zitronenwasser:</strong> Eine einfache Morgenroutine.</li>',
      '<li><strong>Ballaststoffe:</strong> Blattgemüse, Wurzelgemüse und ballaststoffreiches Obst fördern die Darmbewegung.</li>',
      '<li><strong>Chia / Leinsamen:</strong> Reich an Ballaststoffen und gesunden Fetten.</li>',
      '<li><strong>Fermentiertes:</strong> Zum Beispiel Sauerkraut oder Kombucha als natürliche Probiotika.</li>',
      '<li><strong>Kräutertees:</strong> Minze, Fenchel, Kamille und Ingwer können wohltuend sein.</li>',
      '</ol>',

      '<h3>Was man häufig reduzieren sollte</h3>',
      '<p>Raffinierter Zucker, Weißmehlprodukte, hoch verarbeitete Lebensmittel, Softdrinks und Frittiertes können die Darmbalance belasten.</p>',

      '<p><strong>Hinweis:</strong> Dieser Beitrag dient der Information. Bei Beschwerden oder besonderen Ernährungsformen bitte medizinischen Rat einholen.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Der Darm beeinflusst Verdauung, Immunabwehr und Wohlbefinden. Mit Wasser, Ballaststoffen und fermentierten Lebensmitteln lässt sich die Darmbalance natürlich unterstützen.',
  'Darmgesundheit & natürliche Unterstützung',
  'Darmreinigung & Darmgesundheit | Königs Massage',
  'Darmgesundheit im Überblick: praktische Routinen wie Wasser, Ballaststoffe und fermentierte Lebensmittel zur Unterstützung der Balance und des Wohlbefindens.',
  'darmgesundheit,darmreinigung,ballaststoffe,fermentiert,probiotika,natuerlich',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

-- =============================================================
-- BLOG POST #2 — Natural energy boosters (caffeine-free)
-- =============================================================
SET @PAGE_BLOG_2 := '22222222-2222-3333-4444-555555555502';
SET @IMG_BLOG_2  := 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1754082397/uploads/anastasia/blog-images/9-1754082394528-976665892.webp';
SET @IMAGES_2 := CONCAT('["', REPLACE(@IMG_BLOG_2, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_2,@MODULE_KEY,1,120,120,
 @IMG_BLOG_2,NULL,
 @IMG_BLOG_2,NULL,
 @IMAGES_2,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_2,
  'tr',
  'Doğal Enerji Artırıcılar: Kimyasal ve Kafeinsiz Çözümler',
  'dogal-enerji-artiricilar-kafeinsiz-cozumler',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Doğal Enerji: Gün Boyu Zinde Kalmanın Yolları</h2>',
      '<p>Kahve ve şeker kısa süreli bir yükseliş sağlayabilir; ancak çoğu zaman sonrasında daha belirgin bir yorgunluk bırakır. Sürdürülebilir enerji için temel, doğal alışkanlıklardır.</p>',

      '<h3>Günlük rutinde etkili adımlar</h3>',
      '<ul>',
      '<li><strong>Uyku düzeni:</strong> Aynı saatlerde yatıp kalkmak biyolojik ritmi dengeler.</li>',
      '<li><strong>Sabah ışığı:</strong> Güneş ışığı güne zinde başlamayı destekler.</li>',
      '<li><strong>Dengeli beslenme:</strong> Tam tahıl, sebze, meyve ve sağlıklı yağlar gün boyu stabil enerji sağlar.</li>',
      '<li><strong>Hareket:</strong> Kısa yürüyüş, yoga veya esneme oksijenlenmeyi artırır.</li>',
      '<li><strong>Nefes:</strong> Basit nefes egzersizleri zihinsel berraklığı güçlendirebilir.</li>',
      '</ul>',

      '<h3>Doğal destekler</h3>',
      '<p>Kafeinsiz bitki çayları (zencefil, rooibos, nane) ve dengeli bir su tüketimi, gün içinde canlılık hissini artırmaya yardımcı olabilir.</p>',

      '<p><strong>Not:</strong> Bitkisel takviye veya adaptogen kullanımını düşünüyorsanız sağlık profesyoneline danışmanız önerilir.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Kimyasal veya kafein bağımlılığı olmadan; uyku, beslenme, hareket, nefes ve doğal desteklerle enerji seviyesini artırmanın pratik yolları.',
  'Doğal enerji ve zindelik',
  'Doğal Enerji Artırıcılar | Königs Massage',
  'Uyku düzeni, sabah ışığı, dengeli beslenme, hareket ve nefes pratikleriyle kafeinsiz sürdürülebilir enerji yaklaşımları.',
  'enerji,zindelik,uyku,nefes,beslenme,yuruyus,bitki cayi,kafeinsiz',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_2,
  'en',
  'Natural Energy Boosters: Chemical and Caffeine-Free Solutions',
  'natural-energy-boosters-caffeine-free',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Natural Energy: Staying Vibrant All Day</h2>',
      '<p>Coffee and sugar can provide a short lift, but often come with an energy crash. Sustainable energy is built on simple, consistent habits.</p>',

      '<h3>High-impact daily steps</h3>',
      '<ul>',
      '<li><strong>Sleep routine:</strong> Consistent sleep/wake times support your natural rhythm.</li>',
      '<li><strong>Morning light:</strong> Sunlight helps you feel awake and aligned.</li>',
      '<li><strong>Balanced meals:</strong> Whole grains, vegetables, fruits, and healthy fats support steady energy.</li>',
      '<li><strong>Movement:</strong> A short walk, yoga, or stretching boosts oxygen flow.</li>',
      '<li><strong>Breathing:</strong> Simple breathing practices can improve mental clarity.</li>',
      '</ul>',

      '<h3>Gentle natural supports</h3>',
      '<p>Caffeine-free herbal teas (ginger, rooibos, mint) and consistent hydration can help you feel more energized throughout the day.</p>',

      '<p><strong>Note:</strong> If you consider herbal supplements or adaptogens, consult a qualified health professional.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'No chemicals, no caffeine dependency: practical routines—sleep, nutrition, movement, breathing, and gentle herbal options—to support stable daily energy.',
  'Natural energy and vitality',
  'Natural Energy Boosters | Königs Massage',
  'Sustainable, caffeine-free energy approaches: sleep rhythm, morning light, balanced nutrition, movement, and breathing practices for everyday vitality.',
  'energy,vitality,sleep,breathing,nutrition,movement,herbal tea,caffeine-free',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_2,
  'de',
  'Natürliche Energiebooster: Chemie- und Koffeinfreie Lösungen',
  'natuerliche-energiebooster-koffeinfrei',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Natürliche Energie: Den ganzen Tag leistungsfähig</h2>',
      '<p>Kaffee und Zucker wirken oft nur kurzfristig und führen anschließend zu einem Energieabfall. Nachhaltige Energie entsteht durch einfache, konsequente Gewohnheiten.</p>',

      '<h3>Wirksame Schritte im Alltag</h3>',
      '<ul>',
      '<li><strong>Schlafroutine:</strong> Feste Zeiten stabilisieren den Biorhythmus.</li>',
      '<li><strong>Morgenlicht:</strong> Tageslicht hilft beim Wachwerden und Ausrichten.</li>',
      '<li><strong>Ausgewogene Mahlzeiten:</strong> Vollkorn, Gemüse, Obst und gesunde Fette geben gleichmäßige Energie.</li>',
      '<li><strong>Bewegung:</strong> Spaziergang, Yoga oder Dehnen verbessern die Sauerstoffversorgung.</li>',
      '<li><strong>Atmung:</strong> Atemübungen können Klarheit und Fokus fördern.</li>',
      '</ul>',

      '<h3>Sanfte natürliche Unterstützung</h3>',
      '<p>Koffeinfreie Kräutertees (Ingwer, Rooibos, Minze) und ausreichendes Trinken unterstützen das Vitalitätsgefühl über den Tag.</p>',

      '<p><strong>Hinweis:</strong> Bei Nahrungsergänzung oder Adaptogenen bitte vorher medizinischen Rat einholen.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Ohne Chemie und Koffein: Schlaf, Ernährung, Bewegung, Atmung und sanfte Kräuteroptionen als praktische Wege zu stabiler Tagesenergie.',
  'Natürliche Energie und Vitalität',
  'Natürliche Energiebooster | Königs Massage',
  'Koffeinfreie, nachhaltige Energie im Alltag: Schlafrhythmus, Morgenlicht, ausgewogene Ernährung, Bewegung und Atemroutinen.',
  'energie,vitalitaet,schlaf,atmung,ernaehrung,bewegung,kraeutertee,koffeinfrei',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

-- =============================================================
-- BLOG POST #3 — Seasonal nutrition
-- =============================================================
SET @PAGE_BLOG_3 := '22222222-2222-3333-4444-555555555503';
SET @IMG_BLOG_3  := 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1754082437/uploads/anastasia/blog-images/8-1754082432377-633729971.webp';
SET @IMAGES_3 := CONCAT('["', REPLACE(@IMG_BLOG_3, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_3,@MODULE_KEY,1,130,130,
 @IMG_BLOG_3,NULL,
 @IMG_BLOG_3,NULL,
 @IMAGES_3,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_3,
  'tr',
  'Mevsimsel Beslenme: Doğanın Ritimleriyle Sağlıklı Kalmak',
  'mevsimsel-beslenme-doganin-ritmiyle-saglikli-kalmak',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Mevsimsel Beslenme Neden Önemli?</h2>',
      '<p>Mevsimlere göre beslenmek; taze, besleyici ve vücudun ihtiyaçlarına daha uygun ürünleri seçmek anlamına gelir. Bu yaklaşım sağlığı destekler, çevresel etkiyi azaltır ve çoğu zaman daha ekonomiktir.</p>',

      '<h3>Mevsimlere göre pratik öneriler</h3>',
      '<ul>',
      '<li><strong>İlkbahar:</strong> Yeşillikler ve daha hafif öğünler.</li>',
      '<li><strong>Yaz:</strong> Su oranı yüksek sebze-meyveler ve ferah tarifler.</li>',
      '<li><strong>Sonbahar:</strong> Kök sebzeler, baklagiller ve bağışıklık odaklı seçimler.</li>',
      '<li><strong>Kış:</strong> Sıcak çorbalar, lahana grubu sebzeler ve narenciye.</li>',
      '</ul>',

      '<h3>Uygulama ipuçları</h3>',
      '<p>Yerel pazarları takip edin, tabağınıza renk ve çeşit katın ve tariflerinizi mevsime göre güncelleyin.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Mevsimsel beslenme; tazelik, besin değeri, çevre ve bütçe açısından avantaj sağlar. Mevsime uygun seçimlerle sağlıklı dengeyi destekleyin.',
  'Mevsimsel beslenme ve sağlık',
  'Mevsimsel Beslenme | Königs Massage',
  'Mevsimlere göre beslenmenin faydaları ve pratik ipuçları: yerel ürünler, dengeli seçimler ve doğanın ritmiyle uyum.',
  'mevsimsel beslenme,saglik,yerel urunler,bagisiklik,sebze,meyve',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_3,
  'en',
  'Seasonal Nutrition: Staying Healthy in Tune with Nature’s Rhythms',
  'seasonal-nutrition-natures-rhythms',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Why Eating Seasonally Matters</h2>',
      '<p>Seasonal nutrition means choosing fresher, more nourishing foods that align with the body’s needs throughout the year. It supports health, reduces environmental impact, and is often more budget-friendly.</p>',

      '<h3>Practical seasonal ideas</h3>',
      '<ul>',
      '<li><strong>Spring:</strong> Fresh greens and lighter meals.</li>',
      '<li><strong>Summer:</strong> Water-rich produce and refreshing recipes.</li>',
      '<li><strong>Autumn:</strong> Root vegetables, legumes, and immune-supporting choices.</li>',
      '<li><strong>Winter:</strong> Warm soups, cruciferous vegetables, and citrus fruits.</li>',
      '</ul>',

      '<h3>How to apply it</h3>',
      '<p>Visit local markets, add variety and color to your plate, and adjust recipes based on the season.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Seasonal eating supports freshness, nutrients, and sustainability. Use simple seasonal choices to stay balanced and healthy year-round.',
  'Seasonal eating and health',
  'Seasonal Nutrition | Königs Massage',
  'Benefits and practical tips for seasonal nutrition: local produce, balanced choices, and staying aligned with nature’s yearly rhythm.',
  'seasonal nutrition,health,local produce,immunity,vegetables,fruit',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_3,
  'de',
  'Saisonale Ernährung: Mit dem Rhythmus der Natur gesund bleiben',
  'saisonale-ernaehrung-rhythmus-der-natur',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Warum saisonale Ernährung sinnvoll ist</h2>',
      '<p>Saisonal zu essen bedeutet, frische und nährstoffreiche Lebensmittel zu wählen, die zu Jahreszeit und Körperbedürfnissen passen. Das unterstützt die Gesundheit, schont die Umwelt und ist oft auch günstiger.</p>',

      '<h3>Praktische Ideen nach Jahreszeit</h3>',
      '<ul>',
      '<li><strong>Frühling:</strong> Frische Kräuter und leichte Mahlzeiten.</li>',
      '<li><strong>Sommer:</strong> Wasserreiches Obst und Gemüse, erfrischende Rezepte.</li>',
      '<li><strong>Herbst:</strong> Wurzelgemüse, Hülsenfrüchte und immunstärkende Auswahl.</li>',
      '<li><strong>Winter:</strong> Warme Suppen, Kohlgemüse und Zitrusfrüchte.</li>',
      '</ul>',

      '<h3>So gelingt die Umsetzung</h3>',
      '<p>Wochenmärkte nutzen, mehr Farbe und Vielfalt auf den Teller bringen und Rezepte saisonal anpassen.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Saisonal essen bedeutet mehr Frische und Nährstoffe – und oft weniger Umweltbelastung. Mit einfachen saisonalen Entscheidungen bleiben Sie das ganze Jahr im Gleichgewicht.',
  'Saisonale Ernährung und Gesundheit',
  'Saisonale Ernährung | Königs Massage',
  'Saisonale Ernährung: Vorteile und praktische Tipps für lokale Produkte, ausgewogene Auswahl und ein gesundes Jahr im Rhythmus der Natur.',
  'saisonal,ernaehrung,gesundheit,wochenmarkt,immunsystem,gemuese,obst',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
