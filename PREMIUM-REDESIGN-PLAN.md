# Premium Redesign Plan — Energetische Massage Bonn

**Tarih:** 2026-04-08
**Referans:** index.html (dark+gold premium template)
**Hedef:** Mevcut Next.js frontend'i premium seviyeye cikarmak

---

## TEMEL KURALLAR

1. **Tek masaj turu:** Energetische Entspannungsmassage — baska masaj turu YOK
2. **Fiyat yazilmayacak** — ne kartlarda ne de sayfalarda
3. **Evlere masaj** — "Hausbesuch" vurgusu her yerde olmali
4. **Logo ve resimler degismeyecek** — mevcut Cloudinary/uploads resimleri korunacak
5. **Linkler degismeyecek** — URL yapisi ayni
6. **Backend ayni** — yeni icerik gerekirse seed SQL ile eklenecek
7. **Admin panelden yonetilebilir** — mumkun oldugunca DB-driven (site_settings, ui_* keys)
8. **Dark theme default** — light theme opsiyonel (theme toggle ile)

---

## RENK PALETI

### Dark Theme (Default)
```css
--gold: #C9A96E          /* Ana aksan */
--gold-light: #DFC9A0    /* Acik altin */
--gold-dark: #A88B4A     /* Koyu altin */
--bg-deep: #0C0B09       /* En koyu arka plan */
--bg-dark: #141210        /* Section arka plan (alternatif) */
--bg-card: #1A1815        /* Kart arka plani */
--bg-card-hover: #211F1A  /* Kart hover */
--text-primary: #F5F0E8   /* Ana metin (krem) */
--text-secondary: #A09888  /* Ikincil metin */
--text-muted: #6B6358      /* Soluk metin */
--border: rgba(201, 169, 110, 0.12)       /* Kenarlık */
--border-hover: rgba(201, 169, 110, 0.3)  /* Kenarlık hover */
```

### Light Theme (Opsiyonel)
```css
--gold: #A88B4A
--bg-deep: #FDFCFB
--bg-dark: #F5F0E8
--bg-card: #FFFFFF
--text-primary: #2d2520
--text-secondary: #4a4139
--text-muted: #7b6f63
```

---

## FONT DEGISIKLIGI

| Mevcut | Yeni | Kullanim |
|--------|------|----------|
| Playfair Display | Cormorant Garamond | Basliklar (h1-h6), premium his |
| Inter | Outfit | Govde metni, UI elemanlari |

---

## FAZA 1 — TASARIM SISTEMI (Temel)

### 1.1 CSS Token'lari Guncelle
- [ ] `frontend/src/app/globals.css` — Tum renk token'larini dark+gold palete cevir
- [ ] Tailwind v4 @theme blogu guncelle (renk, font, golge)
- [ ] Dark/Light tema degiskenleri tanimla (`.dark` class veya `data-theme`)
- [ ] Premium golge tanimlari ekle (shadow-gold, shadow-soft)

### 1.2 Font Degisikligi
- [ ] `frontend/src/app/[locale]/layout.tsx` — Inter+Playfair yerine Outfit+Cormorant
- [ ] Font variable'lari guncelle (`--font-sans`, `--font-serif`)

### 1.3 Theme Provider
- [ ] `ThemeProvider` component olustur (client component)
- [ ] `localStorage` ile tema tercihi kaydet
- [ ] `data-theme="dark"` / `data-theme="light"` root element'e ekle
- [ ] Theme toggle butonu (Header'a eklenecek)

---

## FAZA 2 — HEADER & FOOTER

### 2.1 Header Premium
- [ ] **HeaderClient.tsx** donusumu:
  - Seffaf baslangic → scroll'da blur + koyu arka plan
  - Nav linkleri: kucuk harf, letter-spacing, gold hover altcizgi
  - CTA butonu: gold border outline, hover'da dolu
  - Hamburger: gold 3 cizgi, animasyonlu acilis
  - Logo: mevcut logo korunacak, gold border cerceve

### 2.2 Footer Premium
- [ ] **Footer.tsx** donusumu:
  - Koyu arka plan, gold aksanlar
  - 3 sutunlu layout (marka + linkler + iletisim)
  - Alt kisim: telif hakki + sosyal medya ikonlari
  - Gold cizgi ayirici

---

## FAZA 3 — HERO SECTION

### 3.1 Hero Tam Ekran
- [ ] **Hero.tsx** donusumu:
  - Tam ekran yukseklik (100vh, min-height: 700px)
  - Mevcut slider resimleri uzerine gradient overlay
  - Badge: "Hausbesuch in Bonn & Umgebung" (DB-driven)
  - H1: Premium serif font, staggered fade-up animasyon
  - Alt metin: Kisa aciklama
  - 2 buton: "Termin Vereinbaren" (dolu) + "Mehr Erfahren" (outline)
  - Scroll indicator: alt kisimda "Scroll" yazisi + animasyonlu cizgi
  - Tum metinler DB'den (ui_hero section)

---

## FAZA 4 — ICERIK SECTIONLARI

### 4.1 HomeIntroSection → "How It Works" (Ablauf)
- [ ] **HomeIntroSection.tsx** donusumu:
  - 4 adimli surecle degistir (referanstaki gibi)
  - Adimlar: Termin wahlen → Wir kommen → Massage → Nachsorge
  - Numarali daireler (01, 02, 03, 04) + baglayan cizgi
  - Her adim DB'den yonetilebilir (ui_home_steps veya site_settings)

### 4.2 AboutSection Premium
- [ ] **AboutSection.tsx** donusumu:
  - 2 sutunlu grid (resim sol, metin sag)
  - Resim: aspect-ratio 3/4, hover zoom, dekoratif gold kose cerceveleri
  - Baslik: "Heilende Hande, spurbare Wirkung" (DB-driven)
  - Icerik: DB'den (custom_pages about)
  - Istatistik satiri: 3 stat (Erfahrung, Kunden, Hausbesuche)
  - Istatistikler DB'den (site_settings ui_about_stats)

### 4.3 ServiceSection → Tek Servis Vitrin
- [ ] **ServiceSection.tsx** donusumu:
  - Tek masaj turu oldugu icin: buyuk vitrin karti
  - Sol: Buyuk resim (mevcut service image)
  - Sag: Baslik, aciklama, ozellikler listesi, CTA
  - Fiyat YAZILMAYACAK
  - "Evlere masaj" vurgusu
  - Ozellikler: ikon + metin (Ganzkorper, 120+ Min, Hausbesuch, etc.)
  - DB-driven (services + services_i18n)

### 4.4 Feedback/Testimonials Premium
- [ ] **Feedback.tsx** donusumu:
  - 3 sutunlu grid (responsive: 1 sutun mobile)
  - Kart: koyu arka plan, gold border, hover efekt
  - Yildiz rating (gold)
  - Blockquote italic metin
  - Yazar: avatar (bas harfler), isim, konum
  - Tum veriler DB'den (reviews tablosu — zaten mevcut)

### 4.5 GutscheinHomeCta Premium
- [ ] **GutscheinHomeCta.tsx** donusumu:
  - 2 sutunlu split kart (referanstaki gift section gibi)
  - Sol: Dekoratif gorsel/emoji alan (animasyonlu hediye kutusu)
  - Sag: Baslik, aciklama, CTA butonu
  - Fiyat/tutar chipleri KALDIRILACAK
  - DB-driven (ui_gutschein)

### 4.6 AppointmentHomeCta → Premium CTA
- [ ] **AppointmentHomeCta.tsx** donusumu:
  - Tam genislikte CTA section
  - Merkezi hizalama
  - Baslik: "Bereit fur Ihre personliche Auszeit?"
  - Aciklama + 2 buton (online termin + e-mail)
  - Iletisim bilgileri (e-mail, web, konum) — ikonlu
  - Gold cizgi ayirici (ust)
  - DB-driven (ui_appointment)

### 4.7 BlogHomeSection
- [ ] **BlogHomeSection.tsx** donusumu:
  - Koyu arka plan kartlar
  - Blog yazilarinin onizleme kartlari (resim + baslik + ozet)
  - Gold aksanlar
  - DB-driven (zaten mevcut)

---

## FAZA 5 — ANIMASYONLAR & DETAYLAR

### 5.1 Scroll Reveal Animasyonlari
- [ ] IntersectionObserver bazli scroll-reveal sistemi
- [ ] `.reveal` class + `.visible` state
- [ ] Staggered delay'ler (reveal-delay-1, -2, -3)
- [ ] CSS transition: translateY(40px) → 0, opacity 0 → 1

### 5.2 Preloader (Opsiyonel)
- [ ] Sayfa yuklenmesinde "ENERGETISCHE MASSAGE" pulse animasyonu
- [ ] 0.8s sonra fade-out

### 5.3 Diger Detaylar
- [ ] Scrollbar styling (thin, gold-dark + bg-deep)
- [ ] ::selection rengi (gold bg, dark text)
- [ ] Smooth scroll davranisi
- [ ] Grain/noise texture overlay (hero icin)

---

## FAZA 6 — SEED GUNCELLEMELERI (Backend)

### 6.1 UI String'leri Guncelle
- [ ] `ui_hero` — "Hausbesuch" vurgulu basliklar (DE/TR/EN)
- [ ] `ui_home_steps` — 4 adimli surecin metinleri (YENi key)
- [ ] `ui_about_stats` — Istatistik verileri (YENi key)
- [ ] `ui_services` — "Fiyat" referanslarini kaldir
- [ ] `ui_feedback` — Premium basliklar

### 6.2 Slider Guncelle
- [ ] `191_slider_full_seed.sql` — "Hausbesuch" vurgulu slider icerikleri

---

## FAZA 7 — LIGHT THEME

- [ ] Light tema renk token'lari tanimla
- [ ] `data-theme="light"` icin CSS override'lar
- [ ] Theme toggle butonu Header'a ekle
- [ ] LocalStorage ile tercih kaydet
- [ ] System preference desteği (prefers-color-scheme)

---

## DOKUNULMAYACAK SEYLER

| Alan | Neden |
|------|-------|
| Logo | Mevcut logo korunacak |
| Resimler | Cloudinary/uploads resimleri ayni |
| URL yapisi | Linkler degismeyecek |
| Backend API'lari | Ayni endpoint'ler |
| RTK Query yapisi | Ayni hook'lar |
| Admin panel | Degisiklik yok |
| Auth sistemi | Degisiklik yok |
| i18n altyapisi | Ayni yapi (DB-driven) |
| Blog/FAQ/Contact sayfalari | Icerik sayfalari sonra yapilacak |

---

## IS SIRASI (Oncelik)

| Sira | Is | Dosyalar | Tahmini |
|------|-----|---------|---------|
| 1 | Tasarim sistemi (renkler, fontlar) | globals.css, layout.tsx | Temel |
| 2 | Theme Provider | providers.tsx, ThemeProvider.tsx | Temel |
| 3 | Header premium | HeaderClient.tsx | Kritik |
| 4 | Hero premium | Hero.tsx | Kritik |
| 5 | About premium | AboutSection.tsx | Yuksek |
| 6 | Service vitrin | ServiceSection.tsx | Yuksek |
| 7 | Feedback/testimonials | Feedback.tsx | Yuksek |
| 8 | HomeIntroSection (steps) | HomeIntroSection.tsx | Orta |
| 9 | Gutschein CTA | GutscheinHomeCta.tsx | Orta |
| 10 | Appointment CTA | AppointmentHomeCta.tsx | Orta |
| 11 | Footer premium | Footer.tsx | Orta |
| 12 | Animasyonlar | Scroll reveal, preloader | Dusuk |
| 13 | Blog kartlari | BlogHomeSection.tsx | Dusuk |
| 14 | Seed guncellemeleri | SQL dosyalari | Paralel |
| 15 | Light theme | globals.css, ThemeProvider | Son |

---

## NOTLAR

- Her component DB'den veri cekmeli — hardcoded icerik YASAK
- Fallback metinler locale-aware olmali (DE/TR/EN)
- "Energetische Massage" tek hizmet — "masaj turleri" listesi YOK
- "Evlere masaj / Hausbesuch" ana mesaj
- Fiyat hicbir yerde gosterilmeyecek
- Mevcut Tailwind v4 @theme yapisini kullan (ayri config dosyasi yok)
