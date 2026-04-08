# GEO Audit Checklist — Energetische Massage Bonn

**Kaynak:** GEO-AUDIT-REPORT-energetische-massage-bonn.md (07.04.2026)
**Mevcut Skor:** 32/100 — KRiTiK
**Not:** Tek masaj turu: Energetische Entspannungsmassage. Farkli masaj turleri yok.

---

## FAZA 1 — KRiTiK / HEMEN (Hafta 1-2)

### 1.1 Dil Karisimi Duzeltme (i18n)

- [x] **Hero H1/desc/CTA fallback Turkce** — `frontend/src/layout/banner/Hero.tsx`
  - DUZELTILDI: Locale-aware fallback objesi eklendi (DE/EN/TR ayri)
  - Artik slider verisi bos geldiginde dogru dilde fallback devreye girer

- [x] **Root layout html lang sabit "de"** — `frontend/src/app/layout.tsx`
  - DUZELTILDI: `resolveHtmlLang()` ile URL'den locale cekilip `<html lang={lang}>` dinamik yapildi

### 1.2 JSON-LD Schema Ekleme

- [x] **LocalBusiness / HealthAndBeautyBusiness schema** — `frontend/src/seo/jsonld.ts`
  - DUZELTILDI: `localBusiness()` fonksiyonu eklendi (address, phone, geo, founder, service, areaServed)

- [x] **Homepage'e JSON-LD graph inject et** — `frontend/src/app/[locale]/layout.tsx`
  - DUZELTILDI: Organization + WebSite + LocalBusiness graph tum sayfalara inject edildi

- [x] **FAQ sayfasinda FAQPage schema** — `frontend/src/components/containers/faqs/FaqsPageContent.tsx`
  - DUZELTILDI: `faqPage()` fonksiyonu eklendi, FAQ verisi yuklenince JSON-LD otomatik render

- [ ] **Service sayfasinda Service schema** ekle
  - Tek masaj turu oldugu icin LocalBusiness icindeki `makesOffer.itemOffered` zaten kapsadi
  - Opsiyonel: `/services/[slug]` sayfasina detayli Service schema eklenebilir

### 1.3 Iletisim Bilgileri

- [ ] **Footer'da fiziksel adres, telefon, calisma saatleri** kontrol et
  - Footer component DB'den cekiyor (`contact_info` key) — telefon ve email mevcut
  - DB'de adres: "Bonn — nach Terminvereinbarung" (sokak adresi yok)
  - Tam adres eklenmeli (cadde, posta kodu) — `040_site_settings.sql` guncelle

### 1.4 Meta Description Uzunlugu

- [x] **Meta description uzatildi** (tum diller 150-160 karakter)
  - `049-92_site_settings_ui_home.sql` — DE/TR/EN guncellendi
  - `serverMetadata.ts` fallback'ler guncellendi
  - DE: "Energetische Massage in Bonn von Anastasia König — achtsame Berührung, tiefe Entspannung und Körperwahrnehmung. Termine nach Vereinbarung. Jetzt buchen!" (155 kar.)

---

## FAZA 2 — KISA VADELI (Hafta 3-6)

### 2.1 AI Gorunurluk

- [x] **`frontend/public/llms.txt` olusturuldu**
  - Isletme adi, konum, hizmet, iletisim, degerler, sayfa linkleri

- [x] **robots.txt AI crawler kurallari eklendi** — `frontend/src/app/robots.ts`
  - GPTBot, ClaudeBot, PerplexityBot, Google-Extended icin acik `Allow`
  - Bytespider (TikTok) icin `Disallow`

### 2.2 Ana Sayfa Icerik Genisletme

- [x] **Ana sayfa icerik genisletildi** — `HomeIntroSection` component eklendi
  - `frontend/src/components/containers/home/HomeIntroSection.tsx` (YENi)
  - `HomeContent.tsx`'e Hero'dan sonra eklendi
  - 3 dilde (DE/EN/TR) fallback icerikleri: tanim, yaklasiM, faydalar listesi, CTA
  - DB-driven: `ui_home_intro` section key'i ile override edilebilir
  - ~350 kelime ek icerik (toplam ~450+ kelime ana sayfada)

### 2.3 Blog Icerigi

- [x] **Blog seed'leri zaten mevcut** — `052_custom_pages_blog.seed.sql` (6 makale, 3 dil)
  - Raporda "bos" denmesi seed'in calistirilmamis olmasindan kaynakli olabilir
  - VPS'te `bun run db:seed --only=052` ile aktif edilmeli

### 2.4 FAQ Icerigi

- [x] **FAQ seed verileri mevcut ve aktif** — 8 soru, `is_active=1`, 3 dil
- [x] **FAQ 10 soruya cikarildi** — 2 ek soru eklendi:
  - "Enerjetik masaj nedir?" / "Was ist energetische Massage?"
  - "Masaj hediye edebilir miyim?" / "Kann ich eine Massage-Sitzung verschenken?"

### 2.5 Google Arac Kurulumu

- [ ] **Google Search Console** kur ve dogrula
- [ ] **Google Analytics 4 / GTM** aktif mi kontrol et

---

## FAZA 3 — TEKNIK IYILESTIRMELER (Hafta 3-6)

### 3.1 Guvenlik Basliklari (Nginx)

- [x] **Nginx config dosyalari olusturuldu** — `nginx/security-headers.conf`
  - HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP
  - VPS'te uygulamak icin: `include /etc/nginx/snippets/security-headers.conf;`

- [ ] **VPS'te uygula** — config dosyasini VPS'e kopyala ve Nginx reload et

### 3.2 E-posta Guvenligi (DNS)

- [ ] **SPF** — `~all` → `-all` (hardfail) yap
- [ ] **DMARC** — `p=none` → `p=quarantine` veya `p=reject` yap
- [ ] **DKIM** — DKIM kaydini aktiflestir

### 3.3 Performans

- [x] **Nginx performans config olusturuldu** — `nginx/performance.conf`
  - Brotli + Gzip, static asset caching (365d immutable), uploads caching
  - VPS'te uygulamak icin: `include /etc/nginx/snippets/performance.conf;`

- [ ] **VPS'te uygula** — config dosyasini VPS'e kopyala ve Nginx reload et

---

## FAZA 4 — MARKA OTORITESI (Ay 2-3)

### 4.1 Dis Platformlar (Kod Disi)

- [ ] **Google Isletme Profili (GBP)** olustur ve dogrula
- [ ] **Instagram** isletme profili olustur
- [ ] **Facebook** isletme sayfasi olustur
- [ ] **Jameda** kaydi olustur
- [ ] **ProvenExpert** kaydi olustur

### 4.2 Sosyal Medya Baglantilari

- [ ] **DB'ye sosyal medya linkleri ekle** — `site_settings` tablosunda `social_links` key
  - JSON-LD `sameAs` alani icin kullanilacak

### 4.3 Musteri Degerlendirmeleri

- [ ] **Reviews modulu aktif mi** kontrol et
- [ ] **Ornek degerlendirmeler** seed olarak ekle
- [ ] **AggregateRating schema** ekle

### 4.4 SERP Optimizasyonu

- [ ] **Title tag** optimize et — "Energetische Massage Bonn | Anastasia Konig"

---

## FAZA 5 — UZUN VADELI (Ay 4-6)

- [ ] Haftalik blog yazilari icin icerik takvimi
- [ ] Yerel dizinlerden backlink olusturma
- [ ] YouTube video icerikleri
- [ ] Konuk yazarlik

---

## TAMAMLANAN ISLER OZETI

| Degisiklik | Dosya |
|-----------|-------|
| Hero fallback locale-aware | `frontend/src/layout/banner/Hero.tsx` |
| HTML lang dinamik | `frontend/src/app/layout.tsx` |
| localBusiness() + faqPage() fonksiyonlari | `frontend/src/seo/jsonld.ts` |
| JSON-LD graph (Org + WebSite + LocalBusiness) | `frontend/src/app/[locale]/layout.tsx` |
| FAQPage JSON-LD | `frontend/src/components/containers/faqs/FaqsPageContent.tsx` |
| llms.txt | `frontend/public/llms.txt` |
| robots.txt AI crawler kurallari | `frontend/src/app/robots.ts` |
| Meta description uzatma (seed) | `backend/src/db/sql/049-92_site_settings_ui_home.sql` |
| Meta description uzatma (fallback) | `frontend/src/seo/serverMetadata.ts` |
| Ana sayfa icerik genisletme | `frontend/src/components/containers/home/HomeIntroSection.tsx` (YENi) |
| HomeContent'e intro section ekleme | `frontend/src/components/containers/home/HomeContent.tsx` |
| FAQ 2 ek soru (10 toplam) | `backend/src/db/sql/141_faqs_seed.sql` |
| Nginx guvenlik basliklari config | `nginx/security-headers.conf` (YENi) |
| Nginx performans config | `nginx/performance.conf` (YENi) |

## MEVCUT OLUMLU DURUMLAR (Duzeltme Gerektirmeyen)

| Ozellik | Durum |
|---------|-------|
| SSR (Server-Side Rendering) | Aktif |
| HTTPS/SSL + HTTP/2 | Aktif |
| Canonical URL + Hreflang | Dogru |
| Sitemap (33 URL + lastmod + hreflang) | Dogru |
| WebP gorsel formati | Aktif |
| Gzip sikistirma | Aktif |
| TTFB 0.46s | Kabul edilebilir |
| OG tags | Dogru |
| FAQ seed verileri (8 soru, 3 dil) | Mevcut |
| Hero slider icerigi (6 slide, 3 dil) | Mevcut |
| Footer iletisim (DB-driven) | Mevcut |

---

**Tahmini Yeni Skor:** ~58-63/100 (Faza 1-3 tamamlanan islerle)
**Sonraki Hedef:** VPS deploy + GBP + sosyal medya ile 70-75/100
