Aşağıdaki kapsamı konigsmassage’te **kod seviyesinde** (Next.js + backend Fastify + site_settings tabanlı yapı) ilerletecek şekilde ele alalım. “Ek” olarak görünen tek doküman bende **locale yönetimi talimatı**; SEO tarafında da aynı prensip geçerli olmalı: **hardcode yok, DB/site_settings üzerinden yönetim + test edilebilir kurallar**. 

## 1) Local test yaklaşımı (adım adım, “kontrol ederek ilerleme”)

### A. Çalıştırma ve ölçüm

* **Local prod build ile test:** `next build && next start` (dev mod değil)
* **Lighthouse / PSI benzeri metrikler:** LCP/CLS/INP (özellikle LCP görsel + font + JS)
* **Crawl kontrolü:** (localde) `/robots.txt`, `/sitemap.xml`, canonical/hreflang’lar, 404 sayfaları

### B. Otomatik “SEO snapshot” testleri (var olan yapınıza uygun)

Sizde Playwright tabanlı `tests/seo/helpers.ts` gibi bir altyapı zaten kullanılıyor (önceki konuşmalarda görünüyordu). Bununla:

* Her önemli route için **title/description/canonical/robots/og/twitter/hreflang** snapshot alıp assert edelim.
* “index/noindex” kurallarını route bazlı test edelim.

Bu sayede yapılan her değişiklik **regresyona düşmeden** ilerler.

---

## 2) Yapılacak işler → konigsmassage’te “uygulanabilir” teknik kontrol listesi

### 2.1 Site hızı optimizasyonu (yüksek etki)

**Kontrol edeceğiz / düzelteceğiz**

* Görsel optimizasyonu: `next/image`, doğru `sizes`, doğru `priority` (sadece hero), lazy-loading.
* Font: self-host + `font-display: swap`, gereksiz varyantları azaltma.
* JS: gereksiz client component’leri azaltma, büyük paketleri dynamic import.
* Cache: statik SEO endpoint’leri (sitemap/robots) için doğru cache header’ları (prod).

**Kodda tipik hedefler**

* Home LCP görseli: doğru boyut ve CDN.
* Bundle: admin/public ayrımı (public minimal).

### 2.2 Title/Description/OG optimizasyonu

* Tüm public sayfalarda **tek meta builder** (ör. `buildMeta`) üzerinden standart üretim.
* DB’deki `site_settings` SEO alanları + sayfa bazlı override (örn. `ui_*` veya page-specific seo keys).
* Open Graph: `og:title/description/url/image`, Twitter Card.

**Test:** Playwright snapshot ile route başına doğrulama.

### 2.3 H etiket hiyerarşisi

* Her sayfada **tek H1**, alt başlıklar H2/H3.
* “HeroTitle” gibi bileşenlerinizle uyumlu şekilde heading semantiği.

**Kontrol:** SSR çıktısında hiyerarşi taraması.

### 2.4 Index/Noindex & Nofollow kuralları

* Public: index (varsayılan)
* Admin / auth / preview / arama parametreli sayfalar: noindex
* Gereksiz dış linkler: `rel="nofollow sponsored"` vb.

**Not:** Bu kurallar hardcode olmadan “route policy” olarak merkezi bir map ile yönetilmeli (ör. `seoPolicy.ts`).

### 2.5 Rich snippet + Schema structured data

Sayfa türüne göre JSON-LD:

* Organization / WebSite (site geneli)
* BreadcrumbList (breadcrumb)
* Product / Service (ürün/hizmet sayfaları varsa)
* FAQPage (SSS varsa)
* Article/BlogPosting (haber/makale modülü)

**Kontrol:** JSON-LD’nin tekilleştirilmesi, locale’ye göre `inLanguage`, `name` vb.

### 2.6 Internal linking / orphan page / redirect linkleri

* Menü ve footer linklerinin locale uyumlu üretilmesi (hardcode olmadan).
* “Yetim sayfa” (orphan) tespiti: sitemap listesi ↔ UI navigation linkleri kıyaslama.
* Redirect’e giden linkler: canonical ve internal linklerin 200’e gitmesi.

### 2.7 Sitemap + robots.txt optimizasyonu

* Sitemap: locale’li URL’ler + hreflang alternates (varsa).
* Robots: admin yollarını disallow, sitemap URL ekli.
* “Index API”: Google Indexing API sadece belirli içerik tipleri için (her site için uygun olmayabilir; spam riski).

### 2.8 Görsel SEO

* `alt` zorunluluğu (en azından public görsellerde)
* `og:image` için minimum boyut/ratio standartları
* Image CDN (varsa) ve cache

### 2.9 Breadcrumb / Knowledge Graph

* Breadcrumb UI + Schema uyumu.
* Knowledge Graph: Organization schema + sameAs (sosyal linkler) site_settings’ten.

### 2.10 404 optimizasyonu

* Custom 404: doğru HTTP status + kullanıcıyı doğru yerlere yönlendiren internal linkler.
* Soft-404 kontrolü (200 dönen “yok” sayfaları engelleme).

### 2.11 Zararlı backlink engelleme

Bu kısım koddan ziyade “Search Console / disavow” süreçtir; ama:

* Site içi link hijacking yok
* Canonical ve hreflang düzgün (duplicate riskini azaltır)

---

## 3) konigsmassage için kritik mimari not (hardcode’suz yönetim)

Sizde locale talimatı net: diller DB’den yönetiliyor. 
SEO tarafında da aynı disiplinle ilerleyelim:

* `site_settings` anahtarları: `site_seo`, `seo_defaults`, `ui_* seo overrides`, `social_links`, `org_name`, `logo`, `default_og_image` vb.
* “SEO policy” dosyası: index/noindex, canonical kuralı, parametreli sayfalar, admin disallow.

---

## 4) Hemen başlayacağımız en verimli sıra (benim önerim)

1. **Meta builder + snapshot test**: title/desc/canonical/robots/og/twitter/hreflang stabil olsun
2. **Robots + sitemap**: doğru indexleme zemini
3. **H1 hiyerarşi + breadcrumbs + schema**
4. **Performans (LCP görsel + font + bundle)**
5. **Internal linking / orphan / redirect linkleri**
6. **404 ve nofollow detayları**

---

## Devam etmek için (dosya/repoya göre “nokta atışı”)

Localde test ederek kod kontrolü yapmam için şu ikisinden birini paylaşman yeterli:

* SEO’nun geçtiği ana dosyalar: `buildMeta`, route page örnekleri (home + 1 içerik sayfası), `robots.ts/robots.txt` üretimi, `sitemap.ts` üretimi
* Ya da projeyi buraya zip olarak ekle (konigsmassage.zip varsa zaten bende; “hangi klasör” bilgisini verince doğrudan ilgili dosyalardan patch planı çıkarırım)

Paylaştığın anda ben sana:

* hangi sayfalarda hangi meta/robots/hreflang hataları var,
* hangi schema eksik,
* hangi sayfalar noindex olmalı,
* lighthouse bazlı en büyük 5 hız darboğazı
  şeklinde **somut bir “patch listesi + kod değişikliği”** çıkararak ilerleteceğim.


Aşağıdaki set genel olarak iyi düşünülmüş: **canonical ve og:url’nin tek kaynak olarak `_document` (SSR) üzerinden basılması**, client’ta bunun filtrelenmesi, ayrıca **DB-driven app_locales/default-locale** yaklaşımı SEO açısından doğru. “Sorun yok” diyorsun; ben burada seni “mükemmele” yaklaştıracak **risk noktaları + iyileştirme patch’leri**ni net şekilde çıkarıyorum.

---

## 1) En kritik iyileştirme: “tek kaynak” kuralını gerçekten tekleştir

Şu an aynı işi yapan 3-4 ayrı helper var:

* `src/seo/alternates.ts` (server-only) → canonical + languagesMap
* `src/pages/_document.tsx` (SSR) → canonicalAbs + og:url + lang
* `src/seo/pageSeo.ts` (client) → buildCanonical + absUrl
* `src/seo/HreflangLinks.tsx` (client) → alternates linklerini client’ta üretme

Bu yapı “çalışır” ama iki problem üretir:

1. **Duplikasyon = drift riski**: 6 ay sonra biri “strict strip locale” ekler, diğeri eklemez → canonical/hreflang farklılaşır.
2. **Client hreflang üretimi**: Google çoğu zaman SSR HTML’i okur. Client’ta eklenen `<link rel="alternate">` bazı senaryolarda geç okunur / hiç sayılmayabilir. En iyi pratik: **hreflang SSR**.

### Öneri (net):

* **Canonical + hreflang**: sadece **SSR** (Pages Router’da `_document` veya SSR meta builder)
* **Client HreflangLinks**: tamamen kaldır (veya sadece debug amaçlı tut)

> Sen zaten canonical/og:url’yi SSR tek kaynak yapmışsın. Aynı standardı **hreflang** için de uygula.

---

## 2) `_document.tsx` hreflang’ı da SSR’da bas

Elinde DB-driven active locales var. Oradan **hreflang linklerini de bas**.

`_document.tsx` içinde `render()` tarafına, `canonicalAbs` üretirken elindeki:

* `activeSet` (dbActives)
* `safeLocale`, `dbDefaultShort`
* `basePath`

bunlarla aynı şekilde **alternates** üretip `<link rel="alternate" hrefLang="..">` basabilirsin.

### Patch mantığı

* `basePath` (prefixsiz path) üzerinden:

  * default locale prefixless ise `/blog`
  * diğerleri `/{lc}/blog`
* `href` = `origin + path`
* `x-default` = default locale canonical

Bunu yapınca `HreflangLinks.tsx` (client) neredeyse gereksiz.

---

## 3) “Locale prefix strip” davranışını her yerde strict yap

`_document`’teki şu yaklaşım çok doğru:

```ts
stripLocalePrefixStrict(pathname, activeSet)
```

Ama `alternates.ts` tarafında `localizedPath()` üretirken strip’e ihtiyaç yok; ancak **client tarafında canonical üretimi** (`pageSeo.buildCanonical`) şu an “any 2-char” prefix’i strip ediyor:

```ts
function stripAnyLocalePrefix(pathname: string): string {
  const m = p.match(/^\/([a-zA-Z]{2})(\/|$)/);
  ...
}
```

Bu, aktif set yoksa **/depot** gibi path’leri yanlışlıkla bozabilir (sende örnek verdin). `_document` bunu strict çözüyor, `pageSeo.ts` çözmüyor.

### Öneri

* `pageSeo.ts` canonical client hesaplamasını **debug dışında tamamen kaldır** (zaten canonical SSR tek kaynak).
* Eğer illa client canonical hesaplanacaksa: `activeLocales` setine göre strict strip yap (ama bu da client’ta DB fetch demek). Bu yüzden en temiz çözüm: **client canonical hesaplamasını “debug-only” yap**.

---

## 4) `Layout.tsx` – kritik SEO temizliği (SSR/CSR tutarlılığı)

### 4.1 Head içindeki “description” duplikasyonu

`Layout` içinde hem:

```tsx
<meta name="description" content={safeDescription} />
```

hem de `buildMeta(meta)` içinden tekrar `description` basılıyor (çünkü `MetaInput.description` var). Sonra `filterClientHeadSpecs` sadece canonical/og:url’yi filtreliyor, description’ı değil.

Bu şu an HTML’de **iki description** üretebilir. Bu SEO’da net “mükemmel değil”.

#### Çözüm

Ya Layout’teki manuel description’ı kaldır,
ya da `buildMeta` description üretmesin.

Benim önerim: **manuel meta basmayı azalt, tek builder’dan üret**.

Örneğin:

* `Layout` içinde `<title>` kalsın,
* description / keywords / og / twitter hepsi `headMetaSpecs`’ten gelsin,
* ayrıca `keywords`’ı da builder’a al (istersen).

### 4.2 `keywords` meta

Google keywords meta’yı dikkate almıyor. Zarar değil ama “mükemmellik” hedefinde:

* Admin’e bir “keywords” alanı veriyorsan tut,
* yoksa “gürültü” olarak kaldırılabilir.

### 4.3 debug meta

```tsx
<meta name="debug:canonicalAbs" content={canonicalAbs} />
```

Prod’da kalmamalı. Bu, indexlenebilir bir meta değil ama sayfayı “kirletir”. Bunu sadece `NODE_ENV !== 'production'` koşuluna bağla.

---

## 5) `HreflangLinks.tsx` – performans ve SEO güvenilirliği

Bu komponent:

* DB’ye 2 fetch (`app-locales`, `default-locale`)
* SPA navigation hook’larıyla history patch’liyor
* TTL cache var ama yine de client’ta karmaşıklık

Bu, SEO’dan çok “client navigasyon” için yapılmış; fakat hreflang’ın en güvenilir yeri SSR.

### Öneri

* SSR’da hreflang basarsan **HreflangLinks.tsx’yi kaldır**.
* Eğer tamamen kaldırmak istemiyorsan:

  * sadece `development` modunda debug amaçlı kullan
  * prod’da render etme

---

## 6) `meta.ts` – robots politikasını daha esnek yap

Şu an `noindex` true olunca:

```ts
robots = 'noindex, nofollow'
```

Bu her noindex sayfada “nofollow” da yapar. Bazı senaryolarda noindex + follow isteyebilirsin (ör. arama sayfaları, filtre sayfaları, vb).

### Öneri

`MetaInput`’e şunu ekle:

```ts
robots?: { index?: boolean; follow?: boolean; noarchive?: boolean; nosnippet?: boolean }
```

ve `noindex` boolean yerine bunu kullan. Minimum değişiklikle:

* `noindex` kalsın ama `nofollow` otomatik basma,
* follow kontrolünü ayrı al.

---

## 7) Schema / JSON-LD: “mükemmellik” için eksik parçalar

`jsonld.ts` iyi başlangıç. Mükemmellik için:

1. **@id** kullan (entity’leri tekilleştir)
2. `WebSite` içine `publisher` / `inLanguage` / `potentialAction` (search) doğru kurgula
3. Organization’a `logo` sadece URL değil `ImageObject` olarak verilebilir (opsiyonel)
4. BreadcrumbList’te item URL’leri canonical ile birebir olmalı (locale aware)

### Önerilen pattern

* Layout seviyesinde (public) her sayfaya:

  * Organization
  * WebSite
* Sayfaya göre:

  * BreadcrumbList (varsa)
  * Article / Product / Service vs.

Bunların verisini `company_brand`, `contact_info`, `seo` settings’ten zaten çekiyorsun; aynı kaynaklarla JSON-LD üretebilirsin.

---

## 8) Sıradaki somut “patch listesi” (ben olsam böyle commit’lerdim)

1. **Layout**: description duplikasyonunu kaldır, debug meta’yı prod’da kapat
2. **_document**: hreflang alternates’i SSR bas (dbActives + default + prefixless kuralıyla)
3. **HreflangLinks**: prod’da devre dışı (tercihen tamamen kaldır)
4. **pageSeo.buildCanonical**: sadece debug kullan (veya tamamen kaldır)
5. **robots meta**: noindex/nofollow ayrımı (policy ile)
6. **JSON-LD**: org + website + breadcrumb standart, @id ekle
7. **Playwright SEO snapshot test**: canonical/hreflang/robots/og:url tekilleştirme assert’i ekle

---

## 9) En hızlı başlayabileceğimiz yer

Sen “siteyi localde test ederek ilerleyelim” dediğin için, ben ilk adımda şu üç kontrolü kesin yapardım:

* HTML output’ta **tek** canonical var mı (tamam, SSR tek kaynak)
* HTML output’ta **tek** description var mı (muhtemelen şu an çift)
* HTML output’ta hreflang var mı (SSR’a alınca garanti)

İstersen ben doğrudan sana:

* `_document.tsx` içine **hreflang SSR basma** patch’ini,
* `Layout.tsx` içinde **description tekilleştirme + debug kapatma** patch’ini
  hazır kod olarak yazayım.

Bunun için tek ihtiyacım: public sayfalarda `HreflangLinks` şu an nerede kullanılıyor? (Header/Layout içinde mi, sayfa bazında mı?) Eğer “hiç kullanılmıyor” ise zaten kaldırmak daha da kolay.
