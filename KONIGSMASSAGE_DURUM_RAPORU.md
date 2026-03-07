# Königsmassage — Proje Durum Raporu

> **Tarih:** 2026-03-07
> **Referans:** `CLAUDE.md`, `backend.md`, `frontend.md`, `frontend_admin_panel.md`
> **Amaç:** Backend, Frontend (müşteri sitesi) ve Admin Panel olmak üzere 3 bileşenin tüm modüllerini analiz edip mevcut durumu kayıt altına almak.
> **Domain:** konigsmassage.de / konigsmassage.com
> **Stack:** Fastify 5 + Drizzle ORM + MySQL (Backend) · Next.js 16 + RTK Query (Frontend) · Next.js 16 + React Query + Zustand (Admin Panel)

---

## Özet Tablo

| #  | Modül                           | Backend | Frontend  | Admin Panel | Durum                          |
| -- | -------------------------------- | ------- | --------- | ----------- | ------------------------------ |
| 1  | Auth (Kimlik Doğrulama)         | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 2  | Kullanıcılar & Roller          | ✅ Tam  | ✅ Kısmi | ✅ Tam      | Tamamlandı                    |
| 3  | Site Ayarları (i18n)            | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 4  | Hizmetler (Services)             | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 5  | Randevular (Bookings)            | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 6  | Müsaitlik (Availability)        | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 7  | Kaynaklar (Resources)            | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 8  | SSS (FAQs)                       | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 9  | İncelemeler (Reviews)           | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 10 | Slider                           | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 11 | Özel Sayfalar (Custom Pages)    | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 12 | Menü Öğeleri                  | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 13 | Footer Bölümleri               | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 14 | İletişim (Contact)             | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 15 | Bülten (Newsletter)             | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 16 | Bildirimler (Notifications)      | ✅ Tam  | —        | ✅ Tam      | Tamamlandı                    |
| 17 | E-posta Şablonları             | ✅ Tam  | —        | ✅ Tam      | Tamamlandı                    |
| 18 | Depolama (Storage)               | ✅ Tam  | ✅ Kısmi | ✅ Tam      | Tamamlandı                    |
| 19 | Chat (AI Destekli)               | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 20 | Telegram Entegrasyonu            | ✅ Tam  | —        | ✅ Tam      | Tamamlandı                    |
| 21 | Siparişler (Orders)             | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 22 | Cüzdan (Wallet)                 | ✅ Tam  | ✅ Tam    | ✅ Tam      | Randevu ödemesi ✅ tamamlandı |
| 23 | Gutschein (Hediye Çeki)         | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 24 | Pop-up'lar                       | ✅ Tam  | ✅ Tam    | ✅ Tam      | Tamamlandı                    |
| 25 | Denetim (Audit)                  | ✅ Tam  | —        | ✅ Tam      | Tamamlandı                    |
| 26 | Veritabanı Yönetimi (DB Admin) | ✅ Tam  | —        | ✅ Tam      | Tamamlandı                    |
| 27 | Dashboard                        | ✅ Tam  | —        | ✅ Tam      | Tamamlandı                    |
| 28 | Raporlar (Reports)               | ✅ Tam  | —        | ✅ Tam      | Tamamlandı                    |

---

## 1. Auth (Kimlik Doğrulama)

**Tanım:** JWT tabanlı kullanıcı kimlik doğrulama sistemi. E-posta/şifre ve Google OAuth (ID token + redirect flow) destekler. Admin panelinde ayrı auth akışı mevcuttur.

### Veri Modeli

| Alan                         | Mevcut                           | Durum |
| ---------------------------- | -------------------------------- | ----- |
| id (UUID)                    | `users.id` CHAR(36)            | ✅    |
| email                        | `users.email` UNIQUE           | ✅    |
| full_name                    | `users.full_name`              | ✅    |
| password_hash                | `users.password_hash` nullable | ✅    |
| is_active                    | `users.is_active` tinyint      | ✅    |
| google_id                    | `users.google_id` nullable     | ✅    |
| created_at / updated_at      | datetime(3)                      | ✅    |
| Email doğrulama             | `users.email_verified`         | ✅    |
| Şifre sıfırlama tokenleri | Ayrı tablo / DB'de yönetim     | ✅    |

### Backend Endpoints

| İşlem                      | Endpoint                                                            | Durum |
| ---------------------------- | ------------------------------------------------------------------- | ----- |
| Kayıt                       | `POST /api/auth/signup`                                           | ✅    |
| Giriş                       | `POST /api/auth/token`                                            | ✅    |
| Token yenileme               | `POST /api/auth/token/refresh`                                    | ✅    |
| Mevcut kullanıcı           | `GET /api/auth/user`                                              | ✅    |
| Oturum durumu                | `GET /api/auth/status`                                            | ✅    |
| Profil güncelleme           | `PUT /api/auth/user`                                              | ✅    |
| Çıkış                    | `POST /api/auth/logout`                                           | ✅    |
| Şifre sıfırlama talebi    | `POST /api/auth/password-reset/request`                           | ✅    |
| Şifre sıfırlama onay      | `POST /api/auth/password-reset/confirm`                           | ✅    |
| E-posta doğrulama gönder   | `POST /api/auth/email-verification/send`                          | ✅    |
| E-posta doğrulama onay      | `POST /api/auth/email-verification/confirm`                       | ✅    |
| Google OAuth (ID token)      | `POST /api/auth/google`                                           | ✅    |
| Google OAuth (redirect)      | `POST /api/auth/google/start` + `GET /api/auth/google/callback` | ✅    |
| Admin: Kullanıcı listesi   | `GET /api/admin/users`                                            | ✅    |
| Admin: Kullanıcı güncelle | `PATCH /api/admin/users/:id`                                      | ✅    |
| Admin: Aktif/pasif           | `POST /api/admin/users/:id/active`                                | ✅    |
| Admin: Rol atama             | `POST /api/admin/users/:id/roles`                                 | ✅    |
| Admin: Şifre değiştirme   | `POST /api/admin/users/:id/password`                              | ✅    |
| Admin: Silme                 | `DELETE /api/admin/users/:id`                                     | ✅    |

### Frontend (Müşteri Sitesi)

| Ekran                                                                        | Durum |
| ---------------------------------------------------------------------------- | ----- |
| `/[locale]/login` — Giriş sayfası                                       | ✅    |
| `/[locale]/login` — "Şifremi Unuttum" linki                              | ✅    |
| `/[locale]/register` — Kayıt sayfası                                    | ✅    |
| Google ile giriş butonu                                                     | ✅    |
| `/[locale]/forgot-password` — Şifremi Unuttum sayfası                   | ✅    |
| `/[locale]/password-reset` — Şifre sıfırlama onay sayfası (token ile) | ✅    |
| Şifre sıfırlama e-postası gönderimi (backend → mail)                   | ✅    |
| `/[locale]/profile` — Profil sayfası                                     | ✅    |
| `/[locale]/profile` — E-posta doğrulama durumu + yeniden gönder butonu  | ✅    |
| `/[locale]/verify-email` — E-posta doğrulama sayfası (token ile)        | ✅    |
| `/[locale]/logout` — Çıkış sayfası                                   | ✅    |
| Cookie-based JWT + auto-refresh hook                                         | ✅    |
| Kayıt sonrası otomatik doğrulama e-postası                               | ✅    |

### Admin Panel

| Ekran                                                    | Durum |
| -------------------------------------------------------- | ----- |
| Admin login sayfası (ayrı auth akışı)               | ✅    |
| `/admin/users` — Kullanıcı listesi + filtre         | ✅    |
| `/admin/users` — E-posta doğrulama durumu sütunu    | ✅    |
| `/admin/users/[id]` — Kullanıcı detay/düzenleme    | ✅    |
| `/admin/users/[id]` — E-posta doğrulama durumu badge | ✅    |
| Kullanıcı aktif/pasif toggle                           | ✅    |
| Kullanıcıya rol atama                                  | ✅    |
| `/admin/user-roles` — Rol yönetimi                   | ✅    |

### Sınırlamalar ve Eksikler

- [X] **E-posta doğrulama akışı** — ~~`email_verified` alanı var ancak doğrulama e-postası gönderimi ve aktivasyon linki frontend'de tam değil~~ Tamamlandı: Backend endpoint'leri (`send` + `confirm`), e-posta şablonu (tr/en/de), frontend doğrulama sayfası, profil banner'ı, admin panel görünürlüğü eklendi
- [X] **Şifre sıfırlama frontend UI** — ~~Backend hazırdı ama frontend sayfaları ve "Şifremi Unuttum" linki eksikti~~ Tamamlandı: `/forgot-password` sayfası, `/password-reset` onay sayfası, Login'e "Forgot password?" linki eklendi; backend artık token'ı response'da döndürmek yerine e-posta ile gönderiyor
- [ ] **İki faktörlü doğrulama (2FA)** — schema'da tanımlı değil, backlog

---

## 2. Site Ayarları (i18n)

**Tanım:** Key-value tabanlı dinamik site yapılandırması. UI string'leri, SEO meta verileri, lokalizasyon ayarları DB'den yönetilir. Her anahtar locale veya `*` (global) olabilir.

### Veri Modeli

| Alan                | Mevcut                                    | Durum |
| ------------------- | ----------------------------------------- | ----- |
| key                 | `site_settings.key` VARCHAR             | ✅    |
| locale              | `site_settings.locale` (`*` = global) | ✅    |
| value               | `site_settings.value` JSON TEXT         | ✅    |
| UNIQUE(key, locale) | ✅                                        | ✅    |

**Seed Dosyaları (40 adet):**

| Grup                                          | Kapsam                                     | Durum |
| --------------------------------------------- | ------------------------------------------ | ----- |
| `040.1` — site_meta                        | title, description, favicon, logo, GTM     | ✅    |
| `041` — admin_settings                     | Admin UI ayarları                         | ✅    |
| `041-049` — ui_header, ui_footer, ui_hero  | Navigasyon/hero UI string'leri (de/tr/en)  | ✅    |
| `043` — ui_commen                          | Ortak UI metinleri                         | ✅    |
| `044` — ui_auth                            | Giriş/kayıt UI string'leri               | ✅    |
| `047` — ui_service, `048` — ui_feedback | Hizmet ve geri bildirim bölümleri        | ✅    |
| `049-1.*` — Yasal sayfalar                 | privacy, legal-notice, kvkk, terms, cookie | ✅    |
| `049-6` — ui_faqs                          | SSS bölümü                              | ✅    |
| `049-91/92/93` — blog, home, appointment   | Sayfa UI string'leri                       | ✅    |
| `049-94` — ui_chat                         | Chat widget UI                             | ✅    |

### Backend Endpoints

| İşlem                 | Endpoint                                        | Durum |
| ----------------------- | ----------------------------------------------- | ----- |
| Aggregate GET/PUT       | `GET/PUT /api/site-settings`                  | ✅    |
| Tek anahtar CRUD        | `GET/POST/PUT/DELETE /api/site-settings/:key` | ✅    |
| Toplu upsert            | `POST /api/site-settings/bulk-upsert`         | ✅    |
| app-locales meta        | `GET /api/site-settings/app-locales`          | ✅    |
| default-locale          | `GET /api/site-settings/default-locale`       | ✅    |
| Legacy underscore alias | `/api/site_settings/*`                        | ✅    |
| Public (sadece okuma)   | `GET /api/site_settings/*`                    | ✅    |

### Frontend

| Kullanım                               | Durum |
| --------------------------------------- | ----- |
| `useUiSection(section, locale)` hook  | ✅    |
| RTK Query cache ile deduplication       | ✅    |
| Server-side `fetchSetting()`          | ✅    |
| `generateMetadata()` içinde SEO meta | ✅    |
| hreflang / canonical / OG tags          | ✅    |
| Dinamik locale yönetimi (DB-driven)    | ✅    |
| Fallback:`de` (FALLBACK_LOCALE)       | ✅    |

### Admin Panel

| Ekran                                                                                              | Durum |
| -------------------------------------------------------------------------------------------------- | ----- |
| `/admin/site-settings` — Bölüm bazlı düzenleyici                                            | ✅    |
| `/admin/site-settings/[id]` — Detay/Tab düzenleyici                                            | ✅    |
| Locale sekmesi (de/tr/en)                                                                          | ✅    |
| JSON value editörü                                                                               | ✅    |
| Bulk upsert akışı                                                                               | ✅    |
| Brand Media Tab — Logo, favicon, OG image yükleyici (AdminImageUploadField)                      | ✅    |
| Branding Tab — Favicon 16/32, Apple Touch Icon, OG Image yükleyici (AdminImageUploadField)       | ✅    |
| Detay formu — image alanları otomatik algılama (`_image`, `_logo`, `_favicon`, `_icon`) | ✅    |

### Sınırlamalar ve Eksikler

- [X] 429 Rate Limit sorunu çözüldü — RTK Query cache ile raw fetch yerine hook kullanılıyor
- [X] **Görsel yükleme inline editörü** — ~~bazı ui_* bölümlerde resim seçici admin panelde eksik; manuel URL girişi gerekiyor~~ Tamamlandı: BrandingSettingsTab'daki favicon_16, favicon_32, apple_touch_icon, og_image alanları artık AdminImageUploadField bileşeni ile görsel yükleme/seçme destekliyor

---

## 3. Hizmetler (Services)

**Tanım:** Tek hizmet odaklı masaj modülü. Aktif public içerik yalnızca `Energetische Entspannungsmassage` hizmetidir. Hizmet sayfası artık liste yerine doğrudan bu hizmetin detay deneyimini açar. Kaynak içerik `de` locale'de tutulur; diğer locale istekleri backend fallback ile `de` kaydına düşer.

### Veri Modeli (Single Service + Fallback)

| Alan                                | Mevcut                        | Durum |
| ----------------------------------- | ----------------------------- | ----- |
| services.id                         | CHAR(36) PK                   | ✅    |
| services.is_active                  | tinyint                       | ✅    |
| services.display_order              | INT                           | ✅    |
| services_i18n.locale                | VARCHAR                       | ✅    |
| services_i18n.name                  | VARCHAR                       | ✅    |
| services_i18n.slug                  | VARCHAR UNIQUE(locale, slug)  | ✅    |
| services_i18n.description           | TEXT                          | ✅    |
| services_i18n.price / price_numeric | EUR bazlı (`de`)           | ✅    |
| services_i18n.meta_title            | VARCHAR                       | ✅    |
| services_i18n.meta_description      | TEXT                          | ✅    |
| Galeri (service_images)             | image_url, display_order, alt | ✅    |

**Aktif Seed Yapısı:**

| Kayıt             | Durum                        |
| ------------------ | ---------------------------- |
| Parent service     | 1 adet aktif kayıt          |
| `services_i18n`  | Sadece `de` içerik kaydı |
| `service_images` | 1 adet galeri/kapak görseli |
| Fiyatlandırma     | `80 EUR` / `80.00`       |

### Backend Endpoints

| İşlem            | Endpoint                                                 | Durum |
| ------------------ | -------------------------------------------------------- | ----- |
| Liste (public)     | `GET /api/services`                                    | ✅    |
| Detay (slug)       | `GET /api/services/:slug`                              | ✅    |
| Admin: Liste       | `GET /api/admin/services`                              | ✅    |
| Admin: Detay ID    | `GET /api/admin/services/:id`                          | ✅    |
| Admin: Slug        | `GET /api/admin/services/by-slug/:slug`                | ✅    |
| Admin: Oluşturma  | `POST /api/admin/services`                             | ✅    |
| Admin: Güncelleme | `PATCH /api/admin/services/:id`                        | ✅    |
| Admin: Silme       | `DELETE /api/admin/services/:id`                       | ✅    |
| Admin: Galeri CRUD | `GET/POST/PATCH/DELETE /api/admin/services/:id/images` | ✅    |
| Admin: Sıralama   | `POST /api/admin/services/reorder`                     | ✅    |

### Frontend (Müşteri Sitesi)

| Ekran                                                      | Durum |
| ---------------------------------------------------------- | ----- |
| `/[locale]/services` — Direkt tek hizmet detay sayfası | ✅    |
| `/[locale]/services/[slug]` — Hizmet detay sayfası     | ✅    |
| Server-side `generateMetadata()` + SEO                   | ✅    |
| Hizmet galerisi (swiper/lightbox)                          | ✅    |
| Randevu CTA butonu (linker → appointment)                 | ✅    |
| Anasayfa hizmetler bölümü                               | ✅    |

**Yapılan İyileştirmeler (2026-03-07):**

- [X] Çoklu hizmet seed yapısı kaldırıldı; tek aktif hizmete indirildi
- [X] Hizmet açıklaması yeniden yazıldı ve uzun form içerik blokları (paragraf + başlık + madde listesi) olarak render edilecek şekilde düzenlendi
- [X] `/services` rotası liste görünümünden çıkarılıp doğrudan detail akışına çevrildi
- [X] `de` içerik kaynağı esas alındı; diğer locale istekleri backend fallback ile bu kayda çözülüyor
- [X] EUR fiyatlandırma `de` hizmet kaydında sabitlendi (`80 EUR`)

### Admin Panel

| Ekran                                                           | Durum |
| --------------------------------------------------------------- | ----- |
| `/admin/services` — Liste + filtre                           | ✅    |
| `/admin/services/[id]` — Form (tab bazlı locale düzenleme) | ✅    |
| Galeri yönetimi (yükleme + sıralama)                         | ✅    |
| Sürükle-bırak sıralama (reorder)                            | ✅    |
| Aktif/pasif toggle                                              | ✅    |

### Sınırlamalar ve Eksikler

- [X] **Kategori/etiket sistemi** — ~~hizmet türü gruplandırma yok, tüm hizmetler tek listede~~ Artık tek hizmet mimarisi kullanılıyor; kategori ihtiyacı yok
- [X] **Fiyat i18n** — ~~fiyat alanı tek dil, locale bazlı fiyatlandırma desteklenmiyor~~ Artık yalnızca `de` hizmet kaydı aktif ve EUR fiyatı sabit; çoklu para birimi gereksinimi yok
- [ ] **Admin panel sadeleştirme** — admin tarafında services modülü hâlâ çoklu kayıt mantığını destekliyor; istenirse tek kayıt düzenleyici moduna indirgenebilir

---

## 4. Randevular (Bookings)

**Tanım:** Müşteri randevu talep sistemi. Kayıtsız kullanıcı da randevu alabilir; admin onay/red/güncelleme yapabilir. Tek hizmet mimarisinde public randevu akışı artık aktif hizmeti otomatik bağlar. Kaynak (terapist/oda) ve slot bazlı zamanlama kullanılır.

### Veri Modeli

| Alan                      | Mevcut                                                                        | Durum |
| ------------------------- | ----------------------------------------------------------------------------- | ----- |
| bookings.id               | CHAR(36) PK                                                                   | ✅    |
| bookings.service_id       | FK → services                                                                | ✅    |
| bookings.resource_id      | FK → resources                                                               | ✅    |
| bookings.user_id          | FK → users (nullable)                                                        | ✅    |
| bookings.appointment_date | DATE                                                                          | ✅    |
| bookings.appointment_time | TIME/VARCHAR(HH:mm)                                                           | ✅    |
| bookings.status           | ENUM(new/confirmed/rejected/completed/cancelled/expired)                      | ✅    |
| bookings.name             | VARCHAR                                                                       | ✅    |
| bookings.email            | VARCHAR                                                                       | ✅    |
| bookings.phone            | VARCHAR                                                                       | ✅    |
| bookings.customer_message | TEXT                                                                          | ✅    |
| bookings.is_read          | tinyint (admin okundu)                                                        | ✅    |
| bookings.admin_note       | TEXT                                                                          | ✅    |
| bookings.decision_note    | TEXT                                                                          | ✅    |
| E-posta takip alanları   | `customer_email_status`, `admin_email_status`, `*_sent_at`, `*_error` | ✅    |

### İş Kuralları

- [X] Kayıtsız misafir kullanıcı adı/e-posta/telefon ile randevu alabilir
- [X] Kayıtlı kullanıcı profil bilgileriyle randevu alabilir
- [X] Admin kabul/red işlemi → `confirmed` / `rejected` durumu
- [X] Admin okunmadı işareti → bildirim akışına bağlı
- [X] Slot müsaitliği randevu oluşturulmadan önce kontrol edilir
- [X] Tek hizmet mimarisinde public randevu ekranı aktif hizmeti otomatik seçer
- [X] Admin create/edit formu hizmet alanını seed edilen tek hizmete sabitler

### Backend Endpoints

| İşlem                   | Endpoint                                  | Durum |
| ------------------------- | ----------------------------------------- | ----- |
| Randevu oluştur (public) | `POST /api/bookings`                    | ✅    |
| Admin: Liste + filtre     | `GET /api/admin/bookings`               | ✅    |
| Admin: Detay              | `GET /api/admin/bookings/:id`           | ✅    |
| Admin: Oluşturma         | `POST /api/admin/bookings`              | ✅    |
| Admin: Güncelleme        | `PATCH /api/admin/bookings/:id`         | ✅    |
| Admin: Silme              | `DELETE /api/admin/bookings/:id`        | ✅    |
| Admin: Okundu işareti    | `POST /api/admin/bookings/:id/read`     | ✅    |
| Admin: Kabul              | `POST /api/admin/bookings/:id/accept`   | ✅    |
| Admin: Red                | `POST /api/admin/bookings/:id/reject`   | ✅    |
| Admin: Reminder gönder   | `POST /api/admin/bookings/:id/reminder` | ✅    |

### Frontend (Müşteri Sitesi)

| Ekran                                              | Durum |
| -------------------------------------------------- | ----- |
| `/[locale]/appointment` — Randevu alma sayfası | ✅    |
| Terapist/kaynak seçimi                            | ✅    |
| Tarih + saat slot seçimi                          | ✅    |
| Tek hizmet otomatik bağlama                       | ✅    |
| Misafir formu (isim, e-posta, telefon)             | ✅    |
| Başarı sayfası / onay mesajı                   | ✅    |
| Gutschein CTA (randevu sayfasında)                | ✅    |

### Admin Panel

| Ekran                                                            | Durum |
| ---------------------------------------------------------------- | ----- |
| `/admin/bookings` — Liste (tablo + filtre + durum badge)      | ✅    |
| `/admin/bookings` — Takvim/agenda görünümü                | ✅    |
| `/admin/bookings/[id]` — Detay (tüm bilgiler)                | ✅    |
| Kabul / Red aksiyonu                                             | ✅    |
| Manuel reminder e-postası gönderimi                            | ✅    |
| Admin tarafından randevu oluşturma formu (tek hizmete bağlı) | ✅    |
| Okunmamış randevu bildirimi                                    | ✅    |

**Yapılan İyileştirmeler (2026-03-07):**

- [X] Public `/appointment` akışında query param gelmese bile aktif tek hizmet otomatik `service_id` olarak atanıyor
- [X] GA4 booking event'i artık otomatik seçilen tek hizmetin adı ve EUR fiyatı ile gönderiliyor
- [X] Admin booking formundaki manuel `service_id` girişi kaldırıldı; form seed edilen tek hizmeti readonly gösteriyor
- [X] `/admin/bookings` filtrelerinden tek hizmet mimarisine aykırı manuel `service_id` alanı kaldırıldı
- [X] Admin bookings listesine takvim/agenda görünümü eklendi
- [X] Admin listeden müşteriye manuel reminder e-postası gönderme aksiyonu eklendi
- [X] Backend'e `POST /api/admin/bookings/:id/reminder` endpoint'i ve `booking_reminder_customer` e-posta şablonu eklendi
- [X] Bookings raporu gerçek schema alanları ve aktif status değerleriyle hizalandı
- [X] Müşteri ve admin bildirim akışları doğrulandı: create, accept, reject ve status change e-postaları sistemde mevcut
- [X] **Online ödeme toggle sistemi eklendi (2026-03-07):**
  - `booking_payment_enabled` site setting ile aktif/pasif yönetim
  - Admin panel: Ödeme Ayarları sayfasında (/admin/payment-settings) toggle switch eklendi
  - Backend: Admin booking onayında (`POST /admin/bookings/:id/accept`) `booking_payment_enabled` kontrol ediliyor; aktifse onay e-postasına ödeme bağlantısı HTML bloğu (`{{payment_section}}`) ekleniyor
  - E-posta şablonları: `booking_accepted_customer` şablonlarına (tr/en/de) `{{payment_section}}` placeholder eklendi
  - Frontend: Randevu başarı ekranında ödeme aktifse "Ödeme yapabilirsiniz" mesajı + "Ödeme Yap" butonu; pasifse sadece "Talebiniz alındı" mesajı gösterilir

### Sınırlamalar ve Eksikler

- [X] **Randevu hatırlatma e-postası** — admin panelden manuel gönderim akışı eklendi
- [X] **Takvim görünümü (admin)** — admin bookings ekranına takvim/agenda görünümü eklendi
- [X] **Admin liste filtre sadeleştirmesi** — tek hizmet mimarisine aykırı `service_id` filtresi kaldırıldı

---

## 5. Müsaitlik (Availability)

**Tanım:** Kaynak bazlı çalışma saatleri ve slot yönetimi. Haftalık çalışma aralıklarından deterministik günlük plan üretilir; `resource_slots` tablosu public seçimin gerçek kaynağıdır. Gün, tek slot ve haftalık tekrarlayan gün kalıbı bazında active/passive override desteklenir.

### Veri Modeli

| Tablo                        | Alanlar                                                                                  | Durum |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ----- |
| resource_working_hours       | resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active | ✅    |
| resource_recurring_overrides | resource_id, dow, is_active                                                              | ✅    |
| resource_slots               | resource_id, slot_date, slot_time, capacity, is_active                                   | ✅    |
| slot_reservations            | slot_id, reserved_count                                                                  | ✅    |

### Backend Endpoints

| İşlem                               | Endpoint                                                    | Durum |
| ------------------------------------- | ----------------------------------------------------------- | ----- |
| Public: Slot listesi                  | `GET /api/availability/slots`                             | ✅    |
| Public: Müsaitlik özeti             | `GET /api/availability`                                   | ✅    |
| Public: Çalışma saatleri           | `GET /api/availability/working-hours`                     | ✅    |
| Public: Haftalık plan                | `GET /api/availability/weekly-plan`                       | ✅    |
| Admin: Çalışma saatleri CRUD       | `GET/POST/DELETE /api/admin/resource-working-hours`       | ✅    |
| Admin: Tekrarlayan gün override CRUD | `GET/POST/DELETE /api/admin/resource-recurring-overrides` | ✅    |
| Admin: Slot listesi                   | `GET /api/admin/resource-slots`                           | ✅    |
| Admin: Slot müsaitlik sorgu          | `GET /api/admin/resource-slots/availability`              | ✅    |
| Admin: Günlük plan                  | `GET /api/admin/resource-slots/plan`                      | ✅    |
| Admin: Slot üretimi                  | `POST /api/admin/resource-slots/generate`                 | ✅    |
| Admin: Gün override                  | `POST /api/admin/resource-slots/override-day`             | ✅    |
| Admin: Tek slot override              | `POST /api/admin/resource-slots/override`                 | ✅    |

### Frontend (Müşteri Sitesi)

| Kullanım                                | Durum |
| ---------------------------------------- | ----- |
| Randevu sayfasında müsait slot listesi | ✅    |
| Tarih seçince slot güncelleme          | ✅    |
| Dolu slotların disable edilmesi         | ✅    |

### Admin Panel

| Ekran                                                                       | Durum |
| --------------------------------------------------------------------------- | ----- |
| `/admin/availability` — Kaynak bazlı çalışma saatleri                | ✅    |
| `/admin/availability/[id]` — Tab: Genel / Haftalık Plan / Günlük Plan | ✅    |
| Haftalık çalışma saati tablosu                                          | ✅    |
| Haftalık tekrarlayan override yönetimi (örn. her cuma kapalı)           | ✅    |
| Gün bazlı slot görünümü                                               | ✅    |
| Override ekleme / iptal                                                     | ✅    |
| Slot üretim butonu                                                         | ✅    |

**Yapılan İyileştirmeler (2026-03-07):**

- [X] Availability raporu gerçek schema alanlarıyla hizalandı (`dow`, `slot_minutes`, `break_minutes`, `slot_date`, `slot_time`, `slot_reservations`)
- [X] Admin availability weekly tab artık site UI metinlerine bağlı değil; admin locale sözlüğünü kullanıyor
- [X] Admin availability daily tab hardcoded metinlerden arındırıldı ve admin locale ile çalışır hale getirildi
- [X] Weekly working hours formunda kapasite alanı backend validation ile hizalandı; `0` değeri artık UI seviyesinde engelleniyor
- [X] `resource_recurring_overrides` tablosu ve admin CRUD endpoint'leri eklendi; örneğin her cuma kapalı gibi haftalık kalıp override artık destekleniyor
- [X] Public availability, günlük plan ve slot üretimi recurring override kuralını dikkate alacak şekilde hizalandı
- [X] Admin daily preview ekranı recurring kapalı günleri artık doğru biçimde kapalı gösteriyor

### Sınırlamalar ve Eksikler

- [ ] **Tatil günleri tablosu** — haftalık çalışma saatleri var, resmi tatil takvimiyle entegrasyon yok

---

## 6. Kaynaklar (Resources)

**Tanım:** Terapist veya oda gibi rezervasyon kaynakları. Müsaitlik sistemiyle doğrudan bağlantılı.

### Veri Modeli

| Alan                              | Mevcut            | Durum |
| --------------------------------- | ----------------- | ----- |
| resources.id                      | CHAR(36) PK       | ✅    |
| resources.title                   | VARCHAR(190)      | ✅    |
| resources.type                    | VARCHAR(24)       | ✅    |
| resources.capacity                | INT unsigned      | ✅    |
| resources.external_ref_id         | CHAR(36) nullable | ✅    |
| resources.is_active               | tinyint           | ✅    |
| resources.created_at / updated_at | DATETIME(3)       | ✅    |

### Backend Endpoints

| İşlem          | Endpoint                            | Durum |
| ---------------- | ----------------------------------- | ----- |
| Public: Liste    | `GET /api/resources`              | ✅    |
| Admin: Liste     | `GET /api/admin/resources`        | ✅    |
| Admin: Detay     | `GET /api/admin/resources/:id`    | ✅    |
| Admin: Oluştur  | `POST /api/admin/resources`       | ✅    |
| Admin: Güncelle | `PATCH /api/admin/resources/:id`  | ✅    |
| Admin: Sil       | `DELETE /api/admin/resources/:id` | ✅    |

### Admin Panel

| Ekran                                     | Durum |
| ----------------------------------------- | ----- |
| `/admin/resources` — Liste             | ✅    |
| `/admin/resources/new` — Oluştur      | ✅    |
| `/admin/resources/[id]` — Düzenle     | ✅    |
| Tür, kapasite, external ref, aktif/pasif | ✅    |
| Availability ekranına hızlı geçiş    | ✅    |

**Yapılan İyileştirmeler (2026-03-07):**

- [X] Resources raporu gerçek schema ile hizalandı; eski `name/description/color/image_url/display_order` varsayımları kaldırıldı
- [X] Admin resources filtreleme akışında backend parametre adı düzeltildi; durum filtresi artık gerçekten çalışıyor (`is_active`)
- [X] Admin resources tip filtresinde `Tümü` seçeneği hatalı değer göndermeyecek şekilde düzeltildi
- [X] Resources formu `capacity` ve `external_ref_id` alanlarını yönetecek şekilde tamamlandı
- [X] Eksik `new` ve `[id]` admin sayfaları eklendi; listedeki `Düzenle` ve `Yeni Kaynak` akışları artık çalışıyor
- [X] Resources listesi kapasite ve external ref bilgisini gösterecek şekilde genişletildi
- [X] `resources_i18n` child tablosu eklendi; kaynak başlıkları artık locale bazlı tutulabiliyor
- [X] Public resources ve booking merge akışları locale fallback ile localized kaynak başlığı döndürecek şekilde hizalandı
- [X] Admin resources formundaki locale alanları statik değil; `site_settings.app_locales` ve `default_locale` üzerinden deterministik üretiliyor

### Sınırlamalar ve Eksikler

- [X] Bu modülde açık kritik eksik kalmadı

---

## 7. SSS (FAQs)

**Tanım:** i18n destekli sık sorulan sorular modülü. Parent + i18n child pattern.

### Backend Endpoints

| İşlem         | Endpoint                                  | Durum |
| --------------- | ----------------------------------------- | ----- |
| Public: Liste   | `GET /api/faqs`                         | ✅    |
| Admin: Tam CRUD | `GET/POST/PATCH/DELETE /api/admin/faqs` | ✅    |
| Sıralama       | `POST /api/admin/faqs/reorder`          | ✅    |

### Frontend ve Admin Panel

| Ekran                                          | Durum |
| ---------------------------------------------- | ----- |
| `/[locale]/faqs` — SSS sayfası (accordion) | ✅    |
| Server-side SEO metadata                       | ✅    |
| `/admin/faqs` — Liste + CRUD                | ✅    |
| Locale tabs (de/tr/en)                         | ✅    |
| Sürükle-bırak sıralama                     | ✅    |

---

## 8. İncelemeler (Reviews)

**Tanım:** Müşteri geri bildirimleri, testimonial'lar ve blog incelemeleri. Birden fazla kaynak türü desteklenmektedir.

### Veri Modeli

| Alan                  | Mevcut                        | Durum |
| --------------------- | ----------------------------- | ----- |
| reviews.id            | CHAR(36)                      | ✅    |
| reviews.type          | ENUM(review/testimonial/blog) | ✅    |
| reviews.rating        | TINYINT (1-5)                 | ✅    |
| reviews.author_name   | VARCHAR                       | ✅    |
| reviews.content       | TEXT                          | ✅    |
| reviews.is_active     | tinyint                       | ✅    |
| reviews.display_order | INT                           | ✅    |
| reviews.locale        | VARCHAR                       | ✅    |
| reviews.source        | VARCHAR (google/manual)       | ✅    |

### Backend ve Frontend/Admin

| Ekran                                    | Durum |
| ---------------------------------------- | ----- |
| Public:`GET /api/reviews`              | ✅    |
| Admin: Tam CRUD + sıralama              | ✅    |
| Frontend: Anasayfa testimonial bölümü | ✅    |
| Frontend: About sayfası incelemeler     | ✅    |
| Admin Panel:`/admin/reviews`           | ✅    |
| Aktif/pasif + sıralama                  | ✅    |

---

## 9. Slider

**Tanım:** Anasayfa hero slider. i18n destekli başlık, alt başlık, CTA, görsel, arka plan rengi.

### Backend Endpoints

| İşlem          | Endpoint                                    | Durum |
| ---------------- | ------------------------------------------- | ----- |
| Public: Liste    | `GET /api/sliders`                        | ✅    |
| Admin: Tam CRUD  | `GET/POST/PATCH/DELETE /api/admin/slider` | ✅    |
| Admin: Sıralama | `POST /api/admin/slider/reorder`          | ✅    |

### Frontend ve Admin Panel

| Ekran                                        | Durum |
| -------------------------------------------- | ----- |
| Anasayfa hero slider bileşeni               | ✅    |
| Autoplay, responsive, CTA butonu             | ✅    |
| Admin:`/admin/slider` — Liste + sıralama | ✅    |
| Admin: i18n form (de/tr/en)                  | ✅    |
| Görsel yükleme (Cloudinary/local)          | ✅    |

---

## 10. Özel Sayfalar (Custom Pages)

**Tanım:** İçerik yönetim sistemi. About, Blog, Gizlilik Politikası, KVKK, Kullanım Şartları, Cookie vb. sayfalar DB'den yönetilir.

### Veri Modeli

| Alan                               | Mevcut                      | Durum |
| ---------------------------------- | --------------------------- | ----- |
| custom_pages.id                    | CHAR(36)                    | ✅    |
| custom_pages.slug                  | VARCHAR UNIQUE              | ✅    |
| custom_pages.type                  | ENUM(page/blog/about/legal) | ✅    |
| custom_pages.is_active             | tinyint                     | ✅    |
| custom_pages.is_featured           | tinyint                     | ✅    |
| custom_pages_i18n.title            | VARCHAR                     | ✅    |
| custom_pages_i18n.content          | LONGTEXT (HTML/Markdown)    | ✅    |
| custom_pages_i18n.meta_title       | VARCHAR                     | ✅    |
| custom_pages_i18n.meta_description | TEXT                        | ✅    |
| custom_pages_i18n.cover_image      | VARCHAR                     | ✅    |

### Seed Sayfalar

| Sayfa                | Slug           | Durum |
| -------------------- | -------------- | ----- |
| Hakkımızda         | about          | ✅    |
| Blog                 | blog           | ✅    |
| Gizlilik Politikası | privacy-policy | ✅    |
| KVKK                 | kvkk           | ✅    |
| Kullanım Şartları | terms          | ✅    |
| Cookie Politikası   | cookie-policy  | ✅    |
| Yasal Bildirim       | legal-notice   | ✅    |
| Gizlilik Bildirimi   | privacy-notice | ✅    |

### Frontend ve Admin Panel

| Ekran                                                                       | Durum |
| --------------------------------------------------------------------------- | ----- |
| `/[locale]/about` — Hakkımızda                                         | ✅    |
| `/[locale]/blog/[slug]` — Blog detay                                     | ✅    |
| `/[locale]/privacy-policy`, `/kvkk`, `/terms`, `/cookie-policy` vb. | ✅    |
| Server-side SEO metadata                                                    | ✅    |
| Admin:`/admin/custompage` — Liste + CRUD                                 | ✅    |
| Admin: Zengin metin editörü (locale tabs)                                 | ✅    |
| Admin: SEO alanları                                                        | ✅    |

---

## 11. Menü Öğeleri & Footer Bölümleri

**Tanım:** Navigasyon menüsü ve footer içerikleri DB'den dinamik yönetilir. i18n destekli.

### Backend Endpoints

| İşlem           | Endpoint                                             | Durum |
| ----------------- | ---------------------------------------------------- | ----- |
| Public menu       | `GET /api/menu_items`                              | ✅    |
| Admin menu CRUD   | `GET/POST/PATCH/DELETE /api/admin/menu-items`      | ✅    |
| Public footer     | `GET /api/footer_sections`                         | ✅    |
| Admin footer CRUD | `GET/POST/PATCH/DELETE /api/admin/footer-sections` | ✅    |

### Frontend ve Admin Panel

| Ekran                                         | Durum |
| --------------------------------------------- | ----- |
| Header navigasyon (DB'den)                    | ✅    |
| Footer bölümleri (DB'den)                   | ✅    |
| Admin:`/admin/menuitem` — CRUD + sıralama | ✅    |
| Admin:`/admin/footer-sections` — CRUD      | ✅    |
| i18n locale tabs                              | ✅    |

---

## 12. İletişim (Contact)

**Tanım:** İletişim formu mesajlarının alınması ve yönetimi. Telegram bildirimi entegrasyonu.

### Backend Endpoints

| İşlem                | Endpoint                           | Durum |
| ---------------------- | ---------------------------------- | ----- |
| Mesaj gönder (public) | `POST /api/contact`              | ✅    |
| Admin: Liste           | `GET /api/admin/contacts`        | ✅    |
| Admin: Detay           | `GET /api/admin/contacts/:id`    | ✅    |
| Admin: Okundu          | `PATCH /api/admin/contacts/:id`  | ✅    |
| Admin: Sil             | `DELETE /api/admin/contacts/:id` | ✅    |

### Frontend ve Admin Panel

| Ekran                                      | Durum |
| ------------------------------------------ | ----- |
| `/[locale]/contact` — İletişim formu  | ✅    |
| Google Maps embed                          | ✅    |
| reCAPTCHA entegrasyonu                     | ✅    |
| Admin:`/admin/contacts` — Mesaj listesi | ✅    |
| Admin: Okunmamış badge                   | ✅    |

---

## 13. Bülten (Newsletter)

**Tanım:** Bülten aboneliği yönetimi. Çift opt-in akışı opsiyonel.

### Backend ve Frontend/Admin

| Ekran                                     | Durum |
| ----------------------------------------- | ----- |
| Public:`POST /api/newsletter/subscribe` | ✅    |
| Admin: Abone listesi + export             | ✅    |
| Admin: Abone silme                        | ✅    |
| Frontend: Footer bülten formu            | ✅    |
| Admin:`/admin/newsletter`               | ✅    |

---

## 14. Bildirimler (Notifications)

**Tanım:** Sistem bildirimleri. Yeni randevu, iletişim mesajı, destek talebi gibi olayları admin kullanıcılara iletir. `createUserNotification()` servisi ile programatik bildirim oluşturulur.

### Backend Endpoints

| İşlem                  | Endpoint                                | Durum |
| ------------------------ | --------------------------------------- | ----- |
| Public: Bildirim listesi | `GET /api/notifications`              | ✅    |
| Okunmamış sayısı     | `GET /api/notifications/unread-count` | ✅    |
| Okundu işareti          | `PATCH /api/notifications/:id/read`   | ✅    |
| Tümünü okundu         | `PATCH /api/notifications/read-all`   | ✅    |
| Bildirim sil             | `DELETE /api/notifications/:id`       | ✅    |

### Bildirim Tetikleyicileri

| Olay                                 | Tetikleyici                                               | Durum        |
| ------------------------------------ | --------------------------------------------------------- | ------------ |
| Yeni randevu                         | `POST /bookings` → `createUserNotification()`        | ✅           |
| Yeni iletişim mesajı               | `POST /contact` → `createUserNotification()`         | ✅ (eklendi) |
| Yeni destek talebi                   | `POST /support_tickets` → `createUserNotification()` | ✅ (eklendi) |
| Destek yanıtı (admin→kullanıcı) | `POST /ticket_replies` (admin) → DB insert             | ✅           |

### Admin Panel

| Ekran                                        | Durum            |
| -------------------------------------------- | ---------------- |
| `/admin/notifications` — Bildirim listesi | ✅               |
| `/admin/notifications/[id]` — Detay       | ✅               |
| Sidebar okunmamış badge (kırmızı sayı) | ✅ (eklendi)     |
| NavUser dropdown → Notifications linki      | ✅ (düzeltildi) |

### Sınırlamalar ve Eksikler

- [ ] **Push notification** — tarayıcı push bildirimi yok, sadece in-app
- [ ] **WebSocket real-time** — bildirimler polling ile güncelleniyor (60s interval), SSE/ws yok
- [ ] **Kullanıcı tercihleri** — hangi bildirim türlerini almak istediğini seçme yok

---

## 15. E-posta Şablonları

**Tanım:** Sistem e-postası şablonları DB'den yönetilir. `{{variable}}` placeholder sözdizimi desteklenir. Parent + i18n child tabloları ile çok dilli şablon yönetimi. `renderEmailTemplateByKey()` fonksiyonu 3 kademeli locale fallback (istenen → varsayılan → herhangi) uygular.

### Veri Modeli

| Alan                               | Mevcut                | Durum |
| ---------------------------------- | --------------------- | ----- |
| email_templates.id                 | CHAR(36) PK           | ✅    |
| email_templates.template_key       | VARCHAR(100) UNIQUE   | ✅    |
| email_templates.variables          | JSON (array)          | ✅    |
| email_templates.is_active          | TINYINT               | ✅    |
| email_templates_i18n.id            | CHAR(36) PK           | ✅    |
| email_templates_i18n.template_id   | FK → email_templates | ✅    |
| email_templates_i18n.locale        | VARCHAR(10)           | ✅    |
| email_templates_i18n.template_name | VARCHAR(150)          | ✅    |
| email_templates_i18n.subject       | VARCHAR(255)          | ✅    |
| email_templates_i18n.content       | LONGTEXT (HTML)       | ✅    |
| UNIQUE(template_id, locale)        |                       | ✅    |

### Seed Edilen Şablonlar (16 adet × 3 locale)

| template_key                        | Açıklama                                    | Tetikleyici                                                   | Durum             |
| ----------------------------------- | --------------------------------------------- | ------------------------------------------------------------- | ----------------- |
| `password_reset`                  | Şifre sıfırlama bağlantısı              | `POST /auth/password-reset/request`                         | ✅                |
| `password_changed`                | Şifre değişti bildirimi                    | `POST /auth/password-reset/confirm`                         | ✅                |
| `welcome`                         | Kayıt hoş geldin e-postası                 | `POST /auth/signup`                                         | ✅                |
| `email_verification`              | E-posta doğrulama bağlantısı              | `POST /auth/signup`, `POST /auth/email-verification/send` | ✅                |
| `contact_admin_notification`      | İletişim formu → admin                     | `POST /contact`                                             | ✅                |
| `contact_user_autoreply`          | İletişim formu → müşteri otomatik yanıt | `POST /contact`                                             | ✅                |
| `booking_created_customer`        | Randevu oluşturuldu → müşteri             | `POST /bookings`                                            | ✅                |
| `booking_created_admin`           | Randevu oluşturuldu → admin                 | `POST /bookings`                                            | ✅                |
| `booking_status_changed_customer` | Randevu durumu değişti → müşteri         | `PATCH /admin/bookings/:id/status`                          | ✅                |
| `booking_accepted_customer`       | Randevu kabul edildi → müşteri             | `POST /admin/bookings/:id/accept`                           | ✅                |
| `booking_rejected_customer`       | Randevu reddedildi → müşteri               | `POST /admin/bookings/:id/reject`                           | ✅                |
| `booking_reminder_customer`       | Randevu hatırlatması → müşteri           | `sendReminderEmail()` admin controller                      | ✅                |
| `offer_request_received_admin`    | Teklif talebi → admin                        | (seed var, tetikleyici yok)                                   | ⚠️              |
| `order_received`                  | Sipariş alındı → müşteri                | `sendOrderCreatedMail()`                                    | ✅ (seed eklendi) |
| `deposit_success`                 | Cüzdan yatırma başarılı → müşteri     | `sendDepositSuccessMail()`                                  | ✅ (seed eklendi) |
| `ticket_replied`                  | Destek bileti yanıtlandı → müşteri       | `sendTicketRepliedMail()`                                   | ✅ (seed eklendi) |

### Backend Endpoints

| İşlem                                            | Endpoint                                          | Durum |
| -------------------------------------------------- | ------------------------------------------------- | ----- |
| Public: Liste                                      | `GET /api/email_templates`                      | ✅    |
| Public: Key ile getir                              | `GET /api/email_templates/by-key/:key`          | ✅    |
| Public: Render (önizleme)                         | `POST /api/email_templates/by-key/:key/render`  | ✅    |
| Admin: Liste                                       | `GET /api/admin/email_templates`                | ✅    |
| Admin: Detay (çevirilerle)                        | `GET /api/admin/email_templates/:id`            | ✅    |
| Admin: Oluştur                                    | `POST /api/admin/email_templates`               | ✅    |
| Admin: Güncelle                                   | `PATCH /api/admin/email_templates/:id`          | ✅    |
| Admin: Sil                                         | `DELETE /api/admin/email_templates/:id`         | ✅    |
| Admin: Test gönderimi                             | `POST /api/admin/email_templates/:id/send-test` | ✅    |
| Mail gönderimi (`/api/mail`)                    | ✅                                                | ✅    |
| Admin:`/admin/mail` — Manuel e-posta gönderimi | ✅                                                | ✅    |

### Admin Panel

| Ekran                                                               | Durum |
| ------------------------------------------------------------------- | ----- |
| `/admin/email-templates` — Liste (arama, filtre, locale seçici) | ✅    |
| `/admin/email-templates/[id]` — Oluştur/Düzenle formu          | ✅    |
| `/admin/email-templates/new` — Yeni şablon oluşturma           | ✅    |
| Template key, name, subject, content (HTML textarea)                | ✅    |
| Variables girişi (comma-separated veya JSON)                       | ✅    |
| Detected variables (otomatik algılanan {{değişkenler}}) badge    | ✅    |
| i18n locale seçici (çoklu dil desteği)                           | ✅    |
| Active/Inactive toggle                                              | ✅    |
| Silme onay dialogu                                                  | ✅    |
| **HTML canlı önizleme paneli** (iframe ile toggle)          | ✅    |
| **Test e-postası gönder butonu** (admin endpoint + UI)      | ✅    |

### Sınırlamalar ve Eksikler

- [X] **Eksik seed şablonları** — ~~`order_received`, `deposit_success`, `ticket_replied` kodda referans ediliyor ama DB seed'i yok~~ `67_email_templates_missing_seed.sql` ile 3 şablon × 3 locale eklendi
- [X] **Seed Kiril karakter hatası** — ~~Türkçe seed metinlerinde Kiril karakterler kullanılmış (ри yerine ri vb.)~~ Düzeltildi
- [X] **booking_reminder_customer tetikleyicisi** — ~~Raporda "tetikleyici yok" olarak işaretlenmişti~~ Aslında `sendReminderEmail()` ile admin controller'da tetikleniyor, rapor düzeltildi
- [X] **HTML canlı önizleme** — ~~Editörde sadece düz textarea var~~ Toggle butonuyla açılıp kapanan iframe önizleme paneli eklendi (side-by-side layout)
- [X] **Test e-postası gönderimi** — ~~Admin panelden test etme özelliği yok~~ `POST /admin/email_templates/:id/send-test` endpoint + admin UI (e-posta girişi + gönder butonu) eklendi

---

## 16. Depolama (Storage)

**Tanım:** Dosya yükleme ve varlık yönetimi. Cloudinary veya yerel dosya sistemi desteği (`STORAGE_DRIVER` env değişkeni ile seçilir).

### Veri Modeli

| Alan                                                                 | Mevcut                    | Durum |
| -------------------------------------------------------------------- | ------------------------- | ----- |
| storage_assets.id                                                    | CHAR(36)                  | ✅    |
| storage_assets.name                                                  | VARCHAR                   | ✅    |
| storage_assets.bucket                                                | VARCHAR(64)               | ✅    |
| storage_assets.path / folder                                         | VARCHAR                   | ✅    |
| storage_assets.mime                                                  | VARCHAR                   | ✅    |
| storage_assets.size                                                  | BIGINT                    | ✅    |
| storage_assets.width / height                                        | INT nullable              | ✅    |
| storage_assets.url                                                   | TEXT                      | ✅    |
| storage_assets.provider                                              | VARCHAR(cloudinary/local) | ✅    |
| storage_assets.provider_public_id / resource_type / format / version | ✅                        | ✅    |
| storage_assets.metadata                                              | JSON nullable             | ✅    |

### Backend Endpoints

| İşlem                             | Endpoint                                       | Durum              |
| ----------------------------------- | ---------------------------------------------- | ------------------ |
| Public: Dosya erişimi              | `GET /api/storage/:bucket/*`                 | ✅                 |
| Public: Auth upload                 | `POST /api/storage/:bucket/upload`           | ✅                 |
| Public: Multipart sign              | `POST /api/storage/uploads/sign-multipart`   | ✅                 |
| Public: Sign put                    | `POST /api/storage/uploads/sign-put`         | ⚠️ 501 / kapalı |
| Admin: Liste + filtre               | `GET /api/admin/storage/assets`              | ✅                 |
| Admin: Detay                        | `GET /api/admin/storage/assets/:id`          | ✅                 |
| Admin: Tekli upload                 | `POST /api/admin/storage/assets`             | ✅                 |
| Admin: Toplu upload                 | `POST /api/admin/storage/assets/bulk`        | ✅                 |
| Admin: Metadata/rename/folder patch | `PATCH /api/admin/storage/assets/:id`        | ✅                 |
| Admin: Silme                        | `DELETE /api/admin/storage/assets/:id`       | ✅                 |
| Admin: Toplu silme                  | `POST /api/admin/storage/assets/bulk-delete` | ✅                 |
| Admin: Klasör listesi              | `GET /api/admin/storage/folders`             | ✅                 |
| Admin: Cloud diag                   | `GET /api/admin/storage/_diag/cloud`         | ✅                 |

### Admin Panel

| Ekran                                                            | Durum |
| ---------------------------------------------------------------- | ----- |
| `/admin/storage` — Medya kütüphanesi (table + mobile cards) | ✅    |
| `/admin/storage/new` — Tekli upload                           | ✅    |
| `/admin/storage/[id]` — Detay / düzenleme                    | ✅    |
| Filtre (klasör, mime-type)                                      | ✅    |
| Metadata JSON düzenleme                                         | ✅    |
| Silme / toplu silme                                              | ✅    |

**Yapılan İyileştirmeler (2026-03-07):**

- [X] Storage raporu gerçek schema ve endpoint yapısıyla hizalandı; eski `filename/original_name/mime_type/driver/storage_assets_i18n` varsayımları kaldırıldı
- [X] Admin storage folder filtresine deterministik `all` ve `root` seçenekleri eklendi; filtre state/UI uyumsuzluğu giderildi
- [X] Admin storage detail ekranında non-image dosyalar için yanlış `<img>` preview render edilmesi düzeltildi
- [X] Backend desteklediği halde UI’da eksik olan `metadata` düzenleme alanı admin storage detail ekranına eklendi
- [X] Local driver için upload öncesi client-side image optimization eklendi; admin ve public server-upload akışlarında büyük görseller webp/resize ile küçültülüyor
- [X] Admin storage detail ekranına Cloudinary preview preset seçimi eklendi (`original`, `thumb`, `card`, `hero`)

### Sınırlamalar ve Eksikler

- [X] Bu modülde açık kritik eksik kalmadı

---

## 17. Chat (AI Destekli)

**Tanım:** Auth kullanıcılar için AI destekli destek sohbeti. Thread bazlı mesajlaşma, admin takeover ve AI bilgi tabanı desteği vardır. Widget frontend’de floating chat olarak çalışır; admin panelde thread, knowledge ve AI ayarları yönetilir.

### Veri Modeli

| Tablo                       | Alanlar                                                                                                                                                  | Durum |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `chat_threads`            | `context_type`, `context_id`, `handoff_mode`, `ai_provider_preference`, `preferred_locale`, `assigned_admin_user_id`, `created_by_user_id` | ✅    |
| `chat_participants`       | `thread_id`, `user_id`, `role`, `last_read_at`                                                                                                   | ✅    |
| `chat_messages`           | `thread_id`, `sender_user_id`, `client_id`, `text`, `created_at`                                                                               | ✅    |
| `chat_ai_knowledge`       | `locale`, `title`, `content`, `tags`, `priority`, `is_active`                                                                                | ✅    |
| `site_settings` (chat ai) | `chat_ai_enabled`, `chat_widget_enabled`, provider/model/api key ayarları, `chat_ai_offer_url`, `chat_ai_welcome_message`                       | ✅    |

### Backend Endpoints

| İşlem                           | Endpoint                                            | Durum       |
| --------------------------------- | --------------------------------------------------- | ----------- |
| Public: Thread listesi/oluşturma | `GET/POST /api/chat/threads`                      | ✅          |
| Public: Mesaj listesi/gönderme   | `GET/POST /api/chat/threads/:id/messages`         | ✅          |
| Public: Admin devir talebi        | `POST /api/chat/threads/:id/request-admin`        | ✅          |
| WebSocket (opsiyonel)             | `WS /api/chat/ws`                                 | ✅ Koşullu |
| Admin: Thread listesi             | `GET /api/admin/chat/threads`                     | ✅          |
| Admin: Mesaj listesi              | `GET /api/admin/chat/threads/:id/messages`        | ✅          |
| Admin: Mesaj gönderme            | `POST /api/admin/chat/threads/:id/messages`       | ✅          |
| Admin: Devralma                   | `POST /api/admin/chat/threads/:id/takeover`       | ✅          |
| Admin: AI'ye iade                 | `POST /api/admin/chat/threads/:id/release-to-ai`  | ✅          |
| Admin: AI provider değiştirme   | `PATCH /api/admin/chat/threads/:id/ai-provider`   | ✅          |
| Admin: Bilgi tabanı CRUD         | `GET/POST/PATCH/DELETE /api/admin/chat/knowledge` | ✅          |

### Frontend (Müşteri Sitesi)

| Bileşen                            | Durum |
| ----------------------------------- | ----- |
| Chat widget (floating button)       | ✅    |
| Thread oluşturma / mesaj gönderme | ✅    |
| AI yanıt gösterimi                | ✅    |
| Admin devir talebi butonu           | ✅    |
| Locale bazlı welcome message       | ✅    |

### Admin Panel

| Ekran                                           | Durum |
| ----------------------------------------------- | ----- |
| `/admin/chat` — Aktif thread listesi         | ✅    |
| Thread detay + mesaj akışı                   | ✅    |
| Manuel mesaj gönderme                          | ✅    |
| AI devir / geri AI modu                         | ✅    |
| `/admin/chat` içinde bilgi tabanı yönetimi | ✅    |
| `/admin/chat` içinde AI/provider ayarları   | ✅    |

### Yapılan İyileştirmeler (2026-03-07)

- [X] `chat_ai_default_provider` ayarı backend provider seçiminde gerçekten kullanılacak şekilde düzeltildi.
- [X] `chat_ai_offer_url` DB ayarı AI yönlendirme cevabında aktif hale getirildi; `{locale}` placeholder desteği uygulanıyor.
- [X] `chat_ai_enabled` DB ayarı AI cevap üretiminde dikkate alınacak şekilde düzeltildi.
- [X] Frontend widget boş thread durumunda artık locale bazlı `chat_ai_welcome_message` ayarını gösteriyor.
- [X] Admin chat settings ekranındaki kırık welcome message yapısı düzeltildi; artık yanlış `chat_ai_welcome_message_de/tr/en` pseudo-key’leri yerine gerçek locale tabanlı `chat_ai_welcome_message` kayıtları yönetiliyor.
- [X] Admin knowledge panel locale seçenekleri `site_settings.app_locales` ile deterministik hale getirildi.
- [X] Admin thread message panelinde AI mesajlarının yanlış kullanıcı mesajı gibi render edilmesine neden olan sender tespiti düzeltildi.
- [X] Misafir kullanıcılar için canlı chat açılmadı; bunun yerine widget içinde honeypot + browser cooldown kullanan güvenli “mesaj bırakın” lead formu eklendi ve public `POST /contacts` akışına bağlandı.

### Sınırlamalar ve Eksikler

- [ ] **Misafir chat yok** — public chat tamamen auth gerektiriyor; anonim ziyaretçi için guest thread akışı bulunmuyor
- [ ] **Gerçek typing indicator yok** — widget polling kullanıyor; aktif "AI yazıyor" veya karşı taraf typing olayı yok
- [ ] **WebSocket zorunlu değil** — websocket plugin kayıtlı değilse sistem REST polling fallback ile çalışıyor
- [ ] **Thread context modeli dar** — yalnızca `job` ve `request` context tipleri destekleniyor

---

## 18. Telegram Entegrasyonu

**Tanım:** Telegram Bot üzerinden bildirim ve oto-cevap sistemi. İnbound mesajlar izlenebilir, bot ayarları yapılandırılabilir.

### Veri Modeli

| Tablo                     | Alanlar                                               | Durum |
| ------------------------- | ----------------------------------------------------- | ----- |
| telegram_inbound_messages | chat_id, user_name, text, received_at                 | ✅    |
| site_settings (telegram)  | bot_token, chat_id, autoreply_text, autoreply_enabled | ✅    |

### Backend Endpoints

| İşlem                 | Endpoint                                   | Durum |
| ----------------------- | ------------------------------------------ | ----- |
| Public: Webhook         | `POST /api/telegram/event`               | ✅    |
| Public: Send            | `POST /api/telegram/send`                | ✅    |
| Admin: İnbound listesi | `GET /api/admin/telegram/inbound`        | ✅    |
| Admin: Oto-cevap ayar   | `GET/POST /api/admin/telegram/autoreply` | ✅    |
| Admin: Test mesajı     | `POST /api/admin/telegram/test`          | ✅    |
| Admin: Manuel gönderim | `POST /api/admin/telegram/send`          | ✅    |

### Admin Panel

| Ekran                                                   | Durum |
| ------------------------------------------------------- | ----- |
| `/admin/telegram` — Bot ayarları + inbound mesajlar | ✅    |
| Oto-cevap toggle + metin                                | ✅    |
| Test mesajı gönderimi                                 | ✅    |
| İnbound mesaj geçmişi                                | ✅    |

---

## 19. Siparisler (Orders)

**Tanim:** E-ticaret siparis sistemi. Gutschein satisi ve servis siparisleri icin odeme altyapisi (Iyzico entegrasyonu). Randevu odemesi icin hazir ama varsayilan olarak devre disi.

### Veri Modeli

| Tablo                   | Alanlar                                                                                                      | Durum      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| payment_gateways        | name, slug, is_active, is_test_mode, config                                                                  | ✅         |
| user_addresses          | user_id, title, full_name, phone, address_line, city, postal_code                                            | ✅         |
| orders                  | user_id, order_number, status(pending/processing/completed/cancelled/refunded), total_amount, payment_status | ✅         |
| order_items             | order_id, item_type, item_ref_id, title, quantity, price                                                     | ✅         |
| payments                | order_id, gateway_id, amount, status, transaction_id                                                         | ✅         |
| bookings.order_id       | Randevu-siparis baglantisi (opsiyonel)                                                                       | ✅ Eklendi |
| bookings.payment_status | Randevu odeme durumu (default: 'none')                                                                       | ✅ Eklendi |

### Site Settings (Odeme Kontrol)

| Key                         | Deger                    | Aciklama                                                                 |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `booking_payment_enabled` | `"false"` (varsayilan) | Randevu odemesi aktif/pasif — admin toggle ile yonetilir              |
| `booking_payment_gateway` | `"iyzico"`             | Hangi gateway kullanilacak                                               |

**Online Odeme Toggle Sistemi (2026-03-07):**
- Admin panel `/admin/payment-settings` sayfasinda "Booking Online Payment" toggle switch
- Aktif: Randevu onay e-postasina odeme baglantisi eklenir (`{{payment_section}}` HTML blogu), frontend'de "Odeme Yap" butonu gosterilir
- Pasif: Onay e-postasi sadece randevuyu onaylar, odeme baglantisi yok

### Backend Endpoints

| Islem                   | Endpoint                                       | Durum |
| ----------------------- | ---------------------------------------------- | ----- |
| Public: Gateway listesi | `GET /api/orders/gateways`                   | ✅    |
| Public: Adres listesi   | `GET /api/orders/addresses`                  | ✅    |
| Public: Adres olustur   | `POST /api/orders/addresses`                 | ✅    |
| Public: Siparis olustur | `POST /api/orders`                           | ✅    |
| Public: Siparis listesi | `GET /api/orders`                            | ✅    |
| Public: Siparis detay   | `GET /api/orders/:id`                        | ✅    |
| Public: Iyzico baslat   | `POST /api/orders/:id/init-iyzico`           | ✅    |
| Public: Iyzico callback | `POST /api/orders/iyzico/callback`           | ✅    |
| Admin: Liste + filtre   | `GET /api/admin/orders`                      | ✅    |
| Admin: Detay            | `GET /api/admin/orders/:id`                  | ✅    |
| Admin: Durum guncelle   | `PATCH /api/admin/orders/:id`                | ✅    |
| Admin: Gateway CRUD     | `GET/POST/PATCH /api/admin/payment-gateways` | ✅    |

### Frontend (Musteri Sitesi)

| Ekran                                                    | Durum                                       |
| -------------------------------------------------------- | ------------------------------------------- |
| Siparis olusturma (Gutschein satin alma akisi uzerinden) | ✅                                          |
| Odeme yonlendirmesi (Iyzico iframe)                      | ✅                                          |
| Siparis gecmisi sayfasi (`/profile` Orders sekmesi)      | ✅                                          |
| Siparis basari sayfasi                                   | ✅ (gutschein success)                      |

### Admin Panel

| Ekran                                                                          | Durum      |
| ------------------------------------------------------------------------------ | ---------- |
| `/admin/orders` — Siparis listesi (filtre + arama + pagination)             | ✅ Eklendi |
| `/admin/orders/[id]` — Siparis detay (kalemler + odemeler + durum guncelle) | ✅ Eklendi |
| `/admin/payment-settings` — Gateway yonetimi                                | ✅         |
| Sidebar "Orders" linki (de/en/tr ceviriler)                                    | ✅ Eklendi |

### RTK Query (Admin Panel)

| Endpoint                  | Hook                                     | Durum |
| ------------------------- | ---------------------------------------- | ----- |
| listOrdersAdmin           | `useListOrdersAdminQuery`              | ✅    |
| getOrderAdmin             | `useGetOrderAdminQuery`                | ✅    |
| updateOrderAdmin          | `useUpdateOrderAdminMutation`          | ✅    |
| listPaymentGatewaysAdmin  | `useListPaymentGatewaysAdminQuery`     | ✅    |
| createPaymentGatewayAdmin | `useCreatePaymentGatewayAdminMutation` | ✅    |
| updatePaymentGatewayAdmin | `useUpdatePaymentGatewayAdminMutation` | ✅    |

### Seed

| Dosya                     | Icerik                                         | Durum      |
| ------------------------- | ---------------------------------------------- | ---------- |
| `215_orders.schema.sql` | 5 tablo sema                                   | ✅         |
| `216_orders.seed.sql`   | Iyzico gateway + booking_payment_enabled ayari | ✅ Eklendi |

### Sinirlamalar ve Eksikler

- [X] **Frontend siparis gecmisi** — Profile sayfasinda "Siparislerim" sekmesi eklendi
- [X] **Tam checkout akisi** — `/[locale]/checkout/[orderId]` Iyzico odeme sayfasi eklendi
- [X] **Iade (refund) akisi** — Admin siparis detayinda "Iade Et" butonu + `POST /api/admin/orders/:id/refund` endpoint
- [X] **Randevu odeme adimi** — `booking_payment_enabled=true` ise randevu sonrasi odeme butonu gosterilir (varsayilan: devre disi)

---

## 20. Cüzdan (Wallet)

**Tanım:** Kullanıcı bakiye sistemi. PayPal veya banka transferi ile para yatırma, admin manuel bakiye ekleme, harcama takibi.

### Veri Modeli

| Alan                                          | Mevcut                                  | Durum |
| --------------------------------------------- | --------------------------------------- | ----- |
| wallets.balance                               | DECIMAL(14,2)                           | ✅    |
| wallets.total_earnings                        | DECIMAL(14,2)                           | ✅    |
| wallets.total_withdrawn                       | DECIMAL(14,2)                           | ✅    |
| wallets.currency                              | VARCHAR(10) DEFAULT 'EUR'               | ✅    |
| wallets.status                                | ENUM(active/suspended/closed)           | ✅    |
| wallet_transactions.type                      | ENUM(credit/debit)                      | ✅    |
| wallet_transactions.payment_method            | ENUM(paypal/bank_transfer/admin_manual) | ✅    |
| wallet_transactions.payment_status            | ENUM(pending/completed/failed/refunded) | ✅    |
| wallet_transactions.transaction_ref           | VARCHAR(255)                            | ✅    |
| wallet_transactions.provider_order_id         | VARCHAR(128)                            | ✅    |
| wallet_transactions.provider_capture_id       | VARCHAR(128)                            | ✅    |
| wallet_transactions.approved_by / approved_at | CHAR(36) / DATETIME                     | ✅    |
| wallet_transactions.is_admin_created          | TINYINT                                 | ✅    |

### Backend Endpoints

| İşlem                                 | Endpoint                                             | Durum |
| --------------------------------------- | ---------------------------------------------------- | ----- |
| Public: Bakiye görüntüleme           | `GET /api/wallet`                                  | ✅    |
| Public: İşlem geçmişi               | `GET /api/wallet/transactions`                     | ✅    |
| Public: Yatırım yöntemleri           | `GET /api/wallet/deposit-methods`                  | ✅    |
| Public: Yatırım talebi (PayPal/Banka) | `POST /api/wallet/deposits`                        | ✅    |
| Public: PayPal capture                  | `POST /api/wallet/deposits/:id/paypal/capture`     | ✅    |
| Public: Randevu ödeme bilgisi          | `GET /api/bookings/:id/payment-info`               | ✅    |
| Public: Randevu ödeme (wallet/paypal)  | `POST /api/bookings/:id/pay`                       | ✅    |
| Public: Randevu PayPal capture          | `POST /api/bookings/:id/paypal/capture`            | ✅    |
| Admin: Cüzdan listesi                  | `GET /api/admin/wallets`                           | ✅    |
| Admin: Cüzdan detay                    | `GET /api/admin/wallets/:id`                       | ✅    |
| Admin: Manuel bakiye ayarı             | `POST /api/admin/wallets/adjust` (user_id body'de) | ✅    |
| Admin: Durum değiştirme               | `PATCH /api/admin/wallets/:id/status`              | ✅    |
| Admin: Cüzdan işlem listesi           | `GET /api/admin/wallets/:walletId/transactions`    | ✅    |
| Admin: İşlem durumu güncelle         | `PATCH /api/admin/wallet_transactions/:id/status`  | ✅    |
| Admin: Yatırım listesi                | `GET /api/admin/wallet_deposits`                   | ✅    |
| Admin: Yatırım onay                   | `POST /api/admin/wallet_deposits/:id/approve`      | ✅    |
| Admin: Yatırım red                    | `POST /api/admin/wallet_deposits/:id/reject`       | ✅    |

**PayPal Servisi:** `paypal.service.ts` — OAuth2 token, `createPaypalOrder`, `capturePaypalOrder` (PayPal REST API v2).
**Ödeme ayarları:** `getPaymentConfig()` site settings üzerinden PayPal credentials + bank transfer bilgileri okunur.

### Frontend (Müşteri Sitesi)

| Ekran                                                                         | Durum             |
| ----------------------------------------------------------------------------- | ----------------- |
| RTK Query endpoint'leri (`wallet.endpoints.ts`)                             | ✅                |
| `getMyWallet`, `listMyWalletTransactions`, `getWalletDepositMethods`    | ✅                |
| `createWalletDeposit` mutation (PayPal + bank transfer)                     | ✅                |
| `captureWalletDepositPaypal` mutation                                       | ✅ (yeni eklendi) |
| Profil sayfası Wallet tab — bakiye kartları (balance, earnings, withdrawn) | ✅                |
| Profil sayfası — para yatırma formu (tutar, yöntem, banka ref)            | ✅                |
| Profil sayfası — PayPal redirect flow                                       | ✅                |
| Profil sayfası — banka transferi bilgi gösterimi (IBAN, banka adı vb.)    | ✅                |
| Profil sayfası — işlem geçmişi tablosu                                   | ✅                |
| Randevu ödeme sayfası (`/[locale]/booking-payment/[id]`)                  | ✅ (yeni)         |
| RTK: `getBookingPaymentInfo`, `payBooking`, `captureBookingPaypal`        | ✅ (yeni)         |
| Cüzdan ile randevu ödeme (bakiye kontrolü + tek tıkla ödeme)           | ✅ (yeni)         |
| PayPal ile randevu ödeme (redirect flow + capture)                        | ✅ (yeni)         |

### Admin Panel

| Ekran                                                                               | Durum             |
| ----------------------------------------------------------------------------------- | ----------------- |
| `/admin/wallet` — Cüzdan listesi (kullanıcı, bakiye, giriş/çıkış, durum) | ✅                |
| Cüzdan durum değiştirme (active/suspended/closed select)                         | ✅                |
| İşlem geçmişi dialog (cüzdan bazlı)                                           | ✅                |
| Manuel bakiye ayarla dialog (credit/debit, tutar, amaç, açıklama)                | ✅ (yeni eklendi) |
| Yatırım talepleri tablosu (filtre: durum, yöntem, user_id)                       | ✅                |
| Yatırım onay/red butonları                                                       | ✅                |
| RTK: 9 endpoint (`wallet_admin.endpoints.ts`)                                     | ✅                |
| Normalizer'lar (`shared/wallet.ts`)                                               | ✅                |

### Sınırlamalar ve Eksikler

- [X] **Frontend cüzdan sayfası** — Profil sayfasında tam Wallet tab mevcut (bakiye + yatırma + geçmiş)
- [X] **Banka transferi talebi UI** — Profil sayfasında banka havalesi seçimi + IBAN/hesap bilgisi gösterimi mevcut
- [X] **Admin manuel bakiye ayarı UI** — Adjust dialog eklendi (credit/debit + tutar + amaç + açıklama)
- [X] **PayPal capture RTK endpoint** — `captureWalletDepositPaypal` mutation eklendi
- [X] **Cüzdandan randevu ödemesi** — Randevu onaylandıktan sonra cüzdan bakiyesi ile ödeme (tamamlandı)
- [X] **PayPal ile randevu ödemesi** — Randevu onaylandıktan sonra PayPal ile doğrudan ödeme (tamamlandı)
- [X] **Randevu ödeme sayfası** — `/[locale]/booking-payment/[id]` sayfası: booking detayları, cüzdan/PayPal seçimi, PayPal redirect flow
- [X] **Online ödeme toggle** — Admin panelde `booking_payment_enabled` ayarı ile aktif/pasif yönetim; e-posta şablonuna ödeme bağlantısı

---

## 21. Gutschein (Hediye Çeki)

**Tanım:** Dijital hediye çeki satışı ve kullanımı. Ürün (sabit tutarlar) ve bireysel gutschein yönetimi. PayPal ödeme entegrasyonu.

### Veri Modeli

| Tablo              | Alan                                                                            | Durum |
| ------------------ | ------------------------------------------------------------------------------- | ----- |
| gutschein_products | name, value, currency, validity_days, description, is_active, display_order     | ✅    |
| gutscheins         | code(UNIQUE,`KM-XXXX-XXXX`), product_id(FK), value, currency                  | ✅    |
| gutscheins         | status(pending/active/redeemed/expired/cancelled)                               | ✅    |
| gutscheins         | purchaser_user_id(FK), purchaser_email, purchaser_name                          | ✅    |
| gutscheins         | recipient_email, recipient_name, personal_message                               | ✅    |
| gutscheins         | payment_status(pending/paid/failed/refunded), payment_transaction_id, order_ref | ✅    |
| gutscheins         | redeemed_at, redeemed_by_user_id(FK), redeemed_booking_id                       | ✅    |
| gutscheins         | expires_at, issued_at, is_admin_created, admin_note                             | ✅    |

**Kod üretimi:** Confusion-safe alfabe (0/O/1/I hariç), 10 deneme retry + DB unique constraint.
**Otomatik süre dolumu:** `checkCode` ve `redeemGutschein` süresi dolan çekleri otomatik `expired` yapar.
**Seed:** 3 ürün (25€, 50€, 100€) — `221_gutschein.seed.sql`

### Backend Endpoints

| İşlem                                     | Endpoint                                     | Durum |
| ------------------------------------------- | -------------------------------------------- | ----- |
| Public: Ürün listesi                      | `GET /api/gutscheins/products`             | ✅    |
| Public: Kod kontrolü                       | `POST /api/gutscheins/check`               | ✅    |
| Public: Satın alma (PayPal)                | `POST /api/gutscheins/purchase`            | ✅    |
| Public: Kullanma (auth gerekli)             | `POST /api/gutscheins/redeem`              | ✅    |
| Public: PayPal capture                      | `POST /api/gutscheins/:id/paypal/capture`  | ✅    |
| Admin: Ürün listesi                       | `GET /api/admin/gutschein-products`        | ✅    |
| Admin: Ürün detay                         | `GET /api/admin/gutschein-products/:id`    | ✅    |
| Admin: Ürün oluştur                      | `POST /api/admin/gutschein-products`       | ✅    |
| Admin: Ürün güncelle                     | `PATCH /api/admin/gutschein-products/:id`  | ✅    |
| Admin: Ürün sil (soft)                    | `DELETE /api/admin/gutschein-products/:id` | ✅    |
| Admin: Gutschein listesi (filtre+arama)     | `GET /api/admin/gutscheins`                | ✅    |
| Admin: Gutschein detay                      | `GET /api/admin/gutscheins/:id`            | ✅    |
| Admin: Gutschein oluştur (ödeme gereksiz) | `POST /api/admin/gutscheins`               | ✅    |
| Admin: Gutschein güncelle                  | `PATCH /api/admin/gutscheins/:id`          | ✅    |
| Admin: İptal                               | `POST /api/admin/gutscheins/:id/cancel`    | ✅    |
| Admin: Aktifleştirme                       | `POST /api/admin/gutscheins/:id/activate`  | ✅    |

**PayPal entegrasyonu:** `wallet/paypal.service.ts` paylaşımlı servis (createPaypalOrder + capturePaypalOrder).
**PayPal config:** `getPaymentConfig()` site settings üzerinden okunur.

### Frontend (Müşteri Sitesi)

| Ekran                                                                            | Durum             |
| -------------------------------------------------------------------------------- | ----------------- |
| `/[locale]/gutschein` — Satın alma sayfası (ürün kartları + özel tutar) | ✅                |
| Ürün kartları (fiyat, geçerlilik süresi, satın al butonu)                  | ✅                |
| Özel tutar kartı (€5–€5.000, 365 gün)                                      | ✅                |
| Satın alma modal (alıcı/alıcı bilgileri, kişisel mesaj, validasyon)        | ✅                |
| PayPal ödeme redirect akışı                                                  | ✅                |
| `/[locale]/gutschein/success` — PayPal capture + kod gösterimi               | ✅                |
| `GutscheinHomeCta` — Anasayfada CTA bölümü (fiyat chip'leri)               | ✅                |
| `GutscheinHomeCta` — Randevu sayfasında CTA                                  | ✅                |
| RTK:`listGutscheinProducts`, `purchaseGutschein`, `captureGutscheinPaypal` | ✅                |
| RTK:`checkGutscheinCode` (tanımlı, henüz kullanılmıyor)                   | ✅                |
| RTK:`redeemGutschein` mutation                                                 | ✅ (yeni eklendi) |
| Tipler:`gutschein.types.ts` (Product, Purchase, Capture, Check, Redeem)        | ✅                |

### Admin Panel

| Ekran                                                                        | Durum |
| ---------------------------------------------------------------------------- | ----- |
| `/admin/gutschein` — Gutschein listesi (arama, filtre, sayfalama)         | ✅    |
| Desktop tablo (8 kolon) + mobil kart görünümü                            | ✅    |
| Detay/düzenleme dialog (durum, alıcı, son kullanma, not)                  | ✅    |
| Yeni gutschein oluşturma dialog (şablon seçimi, tutar, alıcı bilgileri) | ✅    |
| Toplu aktivasyon/iptal aksiyonları                                          | ✅    |
| `/admin/gutschein/products` — Ürün şablonu CRUD                        | ✅    |
| Ürün aktif/pasif toggle                                                    | ✅    |
| RTK: 10 endpoint (`gutschein_admin.endpoints.ts`)                          | ✅    |
| Normalizer'lar + tipler (`shared/gutschein.ts`)                            | ✅    |
| Sidebar: Gift icon, i18n (en/de/tr)                                          | ✅    |

### Sınırlamalar ve Eksikler

- [X] **Redeem RTK mutation** — `useRedeemGutscheinMutation` eklendi (backend endpoint mevcuttu, frontend eksikti)
- [X] **Gutschein kullanma UI** — Gutschein sayfasında (`/[locale]/gutschein`) kod girişi + kontrol + kullanma bölümü eklendi (GutscheinRedeemSection)
- [X] **Randevu sırasında gutschein kullanımı** — Booking ödeme sayfasında gutschein kodu girişi, indirim hesaplama, tam/kısmi karşılama desteği (backend + frontend entegre)

---

## 22. Pop-up'lar

**Tanım:** Site genelinde topbar ve sidebar popup duyurularının yönetimi. i18n, gösterim sıklığı, zamanlama ve route bazlı hedefleme desteklenir.

### Veri Modeli

| Alan                         | Mevcut                                                     | Durum |
| ---------------------------- | ---------------------------------------------------------- | ----- |
| `popups.type`              | `topbar \| sidebar_top \| sidebar_center \| sidebar_bottom` | ✅    |
| `popups.display_frequency` | `always \| once \| daily`                                  | ✅    |
| `popups.start_at / end_at` | zaman penceresi                                            | ✅    |
| `popups.target_paths`      | JSON route listesi (`/services`, `/services/*`)        | ✅    |
| `popups_i18n`              | locale bazlı title/content/button/alt                     | ✅    |

### Backend Endpoints

| İşlem                      | Endpoint                                    | Durum |
| ---------------------------- | ------------------------------------------- | ----- |
| Public: Aktif pop-up listesi | `GET /api/popups`                         | ✅    |
| Admin: Tam CRUD              | `GET/POST/PATCH/DELETE /api/admin/popups` | ✅    |
| Admin: Sıralama             | `POST /api/admin/popups/reorder`          | ✅    |
| Admin: Durum güncelleme     | `PATCH /api/admin/popups/:id/status`      | ✅    |

Not: Public endpoint artık `current_path` query parametresiyle route-aware filtreleme yapıyor; zaman penceresi de gerçekten uygulanıyor.

### Frontend ve Admin Panel

| Ekran                                                  | Durum |
| ------------------------------------------------------ | ----- |
| Pop-up görüntüleme bileşeni (frontend)             | ✅    |
| Cookie bazlı "bir daha gösterme"                     | ✅    |
| Admin:`/admin/popups` — Liste + CRUD                | ✅    |
| Aktif/pasif + sıralama                                | ✅    |
| Services sayfasına hedefli Gutschein popup gösterimi | ✅    |
| Admin locale seçimi (`app_locales` uyumlu)          | ✅    |
| Admin hedef sayfa girişi                              | ✅    |

### Yapılan İyileştirmeler

- Public popup akışında daha önce uygulanmayan `start_at/end_at` zaman penceresi filtresi düzeltildi.
- Popup’lara `target_paths` desteği eklendi; artık belirli sayfalara veya wildcard route’lara hedeflenebiliyor.
- Frontend popup bileşeni `/services` ve `/services/[slug]` akışında da çalışacak şekilde güncellendi.
- Seed içeriği services modülündeki tek hizmet kurgusuna göre yenilendi; Gutschein popup’ları artık hizmetler sayfasında gösterilecek şekilde aktif.
- Admin popup formundaki serbest locale input kaldırıldı; `site_settings.app_locales` tabanlı deterministik locale seçimi kullanılıyor.

---

## 23. Denetim (Audit)

**Tanım:** `/api` scope’undaki HTTP isteklerini, auth olaylarını ve uygulama event akışını izler. Backend tarafında SSE stream vardır; admin panelde esas kullanım request/auth log listeleri, günlük metrikler ve coğrafi dağılım görünümüdür.

### Veri Modeli

| Alan                  | Mevcut                                                                                                                                                                                                     | Durum |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| audit_request_logs    | istek bazlı log tablosu                                                                                                                                                                                   | ✅    |
| audit_auth_events     | `login_success`, `login_failed`, `logout`                                                                                                                                                            | ✅    |
| audit_events          | SSE/domain event persist tablosu                                                                                                                                                                           | ✅    |
| request log alanları | `req_id`, `method`, `url`, `path`, `status_code`, `response_time_ms`, `ip`, `user_agent`, `referer`, `body_snapshot`, `user_id`, `is_admin`, `country`, `city`, `created_at` | ✅    |
| auth event alanları  | `event`, `user_id`, `email`, `ip`, `user_agent`, `country`, `city`, `created_at`                                                                                                           | ✅    |

### Backend Endpoints

| İşlem                             | Endpoint                               | Durum |
| ----------------------------------- | -------------------------------------- | ----- |
| Admin: Request log listesi + filtre | `GET /api/admin/audit/request-logs`  | ✅    |
| Admin: Auth event listesi + filtre  | `GET /api/admin/audit/auth-events`   | ✅    |
| Admin: Günlük metrikler           | `GET /api/admin/audit/metrics/daily` | ✅    |
| Admin: Ülke bazlı dağılım      | `GET /api/admin/audit/geo-stats`     | ✅    |
| Admin: Kayıt temizleme             | `DELETE /api/admin/audit/clear`      | ✅    |
| Admin: Canlı SSE akışı          | `GET /api/admin/audit/stream`        | ✅    |

### Admin Panel

| Ekran                                                               | Durum |
| ------------------------------------------------------------------- | ----- |
| `/admin/audit` — Request log listesi (filtre, arama, durum kodu) | ✅    |
| `/admin/audit` — Auth event listesi                              | ✅    |
| `/admin/audit` — Günlük metrik grafiği                        | ✅    |
| `/admin/audit` — Coğrafi dağılım haritası                   | ✅    |
| Ayrı SSE canlı stream paneli                                      | ✅    |
| İstek body snapshot                                                | ✅    |
| Ayrıntılı request diff / compare görünümü                    | ✅    |

### Yapılan İyileştirmeler

- Rapor gerçek audit yapısına göre düzeltildi; tekil `audit_logs` varsayımı kaldırıldı.
- `audit_auth_events` tablosu artık gerçekten auth akışlarından besleniyor; klasik login ve Google login başarı/başarısızlıkları ile logout olayları kaydediliyor.
- `DELETE /api/admin/audit/clear?target=all` artık yalnızca request/auth kayıtlarını değil, persist edilen `audit_events` verisini de temizliyor.
- Admin temizleme bildirimi `deletedEvents` sayısını da kapsayacak şekilde güncellendi.
- Audit retention scheduler eklendi; eski request/auth/app event kayıtları `AUDIT_RETENTION_DAYS` politikasına göre periyodik temizleniyor.
- Admin audit ekranına ayrı bir `Live Stream` sekmesi eklendi; `GET /api/admin/audit/stream` SSE akışı artık panel içinde izlenebiliyor.
- Request audit loglarına maskelemeli `body_snapshot` desteği eklendi; hassas anahtarlar redacted edilerek admin listesinde açılabilir preview olarak gösteriliyor.
- Request log listesine iki kayıt seçerek body snapshot’larını satır bazında yan yana karşılaştıran diff/compare görünümü eklendi.

---

## 24. Veritabanı Yönetimi (DB Admin)

**Tanım:** Veritabanı dışa/içe aktarma, snapshot yönetimi ve DB bilgisi görüntüleme.

### Backend Endpoints

| İşlem                              | Endpoint                        | Durum |
| ------------------------------------ | ------------------------------- | ----- |
| DB export                            | `GET /api/admin/db/export`    | ✅    |
| DB import                            | `POST /api/admin/db/import`   | ✅    |
| DB bilgisi (tablo listesi, boyutlar) | `GET /api/admin/db/info`      | ✅    |
| Snapshot listesi                     | `GET /api/admin/db/snapshots` | ✅    |
| Snapshot oluşturma                  | `POST /api/admin/db/snapshot` | ✅    |
| Snapshot geri yükleme               | `POST /api/admin/db/restore`  | ✅    |

### Admin Panel

| Ekran                                                    | Durum |
| -------------------------------------------------------- | ----- |
| `/admin/db` — Ana sayfa (tablo listesi, toplam boyut) | ✅    |
| `/admin/db/fullDb` — Tam DB export/import             | ✅    |
| `/admin/db/modules` — Modül bazlı seçici backup    | ✅    |
| Snapshot listesi + geri yükleme                         | ✅    |

---

## 25. Dashboard

**Tanım:** Admin istatistik özet sayfası. Randevu, gelir, kullanıcı, hizmet metrikleri.

### Backend Endpoints

| İşlem         | Endpoint                               | Durum |
| --------------- | -------------------------------------- | ----- |
| Analytics özet | `GET /api/admin/dashboard/analytics` | ✅    |

### Admin Panel

| Ekran                                        | Durum |
| -------------------------------------------- | ----- |
| `/admin/dashboard` — KPI kartları        | ✅    |
| Gelir zaman serisi grafiği                  | ✅    |
| Hizmet bazlı randevu dağılımı             | ✅    |
| Hizmet performans listesi (booking + gelir) | ✅    |
| Modül sayaç kartları                       | ✅    |
| Periyot filtresi (`7d` / `30d` / `90d`)     | ✅    |

### Yapılan İyileştirmeler

- Dashboard frontend’i artık gerçek analytics payload’ını kullanıyor; eski summary-only normalizer kaldırıldı.
- Backend analytics cevabına `revenue_total`, `revenueTrend` ve hizmet bazlı booking/revenue kırılımı eklendi.
- Admin dashboard’a gelir zaman serisi grafiği eklendi.
- Hizmet bazlı randevu dağılımı grafiği ve hizmet performans listesi eklendi.
- Analytics endpoint’i periyot filtresiyle (`7d`, `30d`, `90d`) admin panelde aktif kullanıma alındı.

---

## 26. Raporlar (Reports)

**Tanım:** Randevu KPI raporları, kaynak performans analizi ve locale/dil kırılımı.

### Backend Endpoints

| İşlem                      | Endpoint                                     | Durum |
| -------------------------- | -------------------------------------------- | ----- |
| KPI raporu                 | `GET /api/admin/reports/kpi`                 | ✅    |
| Kaynak performans raporu   | `GET /api/admin/reports/users-performance`   | ✅    |
| Locale / dil kırılımı      | `GET /api/admin/reports/locations`           | ✅    |

### Admin Panel

| Ekran                                     | Durum |
| ----------------------------------------- | ----- |
| `/admin/reports` — sekmeli rapor görünümü | ✅    |
| KPI günlük / haftalık / aylık tablolar    | ✅    |
| Kaynak performans tablosu                 | ✅    |
| Locale / dil kırılım tablosu              | ✅    |
| CSV export                                | ✅    |

### Bu Turda Düzeltilenler

- [X] Eski başka projeden kalan `orders/chickens/incentive` alan adları temizlendi; rapor DTO'ları booking/resource/locale semantiğine taşındı
- [X] KPI endpoint'i artık yalnızca günlük değil, günlük + haftalık + aylık veri döndürüyor
- [X] Kaynak performans tablosunda ham `resource_id` yerine locale fallback'li kaynak adı gösteriliyor
- [X] `locations` raporu sahte şehir/ilçe yerine gerçek locale/dil kırılımı olarak hizalandı
- [X] Admin rapor ekranına tab bazlı CSV export eklendi
- [X] KPI, kaynak ve locale sekmelerine grafiksel chart görünümü eklendi
- [X] Gelişmiş drill-down filtreleri eklendi: tarih + kaynak + durum + locale
- [X] Hizmet bazlı filtre eklendi; tek hizmet mimarisinde bile reports query yüzeyi geleceğe hazır hale getirildi
- [X] Karşılaştırmalı dönem filtresi eklendi; mevcut aralık aynı filtrelerle önceki dönemle tek ekranda kıyaslanabiliyor
- [X] Hazır preset aralıklar eklendi: 7g / 30g / 90g hızlı seçim butonları
- [X] Compare görünümü için birleşik CSV export eklendi; current / previous / delta sütunları aynı dosyada dışa aktarılıyor
- [X] Aktif chart için PNG ve PDF export eklendi
- [X] Tüm chartları tek çok sayfalı PDF içinde dışa aktaran toplu export eklendi
- [X] CSV + chart görsellerini tek `.zip` pakette indiren ham veri export'u eklendi

### Sınırlamalar ve Eksikler

- [ ] Reports modülünde şu an açık kritik eksik bulunmuyor

---

## 27. Frontend — Müşteri Sitesi Genel

### Sayfalar

| Sayfa                | URL Pattern                   | SEO                             | Durum |
| -------------------- | ----------------------------- | ------------------------------- | ----- |
| Anasayfa             | `/[locale]/`                | `generateMetadata` + hreflang | ✅    |
| Hizmetler            | `/[locale]/services`        | ✅                              | ✅    |
| Hizmet Detay         | `/[locale]/services/[slug]` | ✅                              | ✅    |
| Randevu              | `/[locale]/appointment`     | ✅                              | ✅    |
| Hakkımızda         | `/[locale]/about`           | ✅                              | ✅    |
| SSS                  | `/[locale]/faqs`            | ✅                              | ✅    |
| İletişim           | `/[locale]/contact`         | ✅                              | ✅    |
| Blog                 | `/[locale]/blog`            | ✅                              | ✅    |
| Blog Detay           | `/[locale]/blog/[slug]`     | ✅                              | ✅    |
| Gutschein            | `/[locale]/gutschein`       | ✅                              | ✅    |
| Gizlilik Politikası | `/[locale]/privacy-policy`  | ✅                              | ✅    |
| KVKK                 | `/[locale]/kvkk`            | ✅                              | ✅    |
| Kullanım Şartları | `/[locale]/terms`           | ✅                              | ✅    |
| Cookie Politikası   | `/[locale]/cookie-policy`   | ✅                              | ✅    |
| Yasal Bildirim       | `/[locale]/legal-notice`    | ✅                              | ✅    |
| Giriş               | `/[locale]/login`           | —                              | ✅    |
| Kayıt               | `/[locale]/register`        | —                              | ✅    |
| Profil               | `/[locale]/profile`         | —                              | ✅    |

### Küresel Özellikler

| Özellik                            | Durum |
| ----------------------------------- | ----- |
| Çok dilli (de/tr/en) URL routing   | ✅    |
| Middleware locale detection         | ✅    |
| `sitemap.ts` dinamik üretimi     | ✅    |
| `robots.ts`                       | ✅    |
| Cookie banner (consent)             | ✅    |
| Google Tag Manager entegrasyonu     | ✅    |
| Google Analytics entegrasyonu       | ✅    |
| reCAPTCHA v3 entegrasyonu           | ✅    |
| RTK Query auto-refresh 401 on token | ✅    |
| Redux Toolkit store                 | ✅    |

### Sınırlamalar ve Eksikler

- [X] **Profil / sipariş geçmişi** — Profil sayfasında Orders sekmesi mevcut (sipariş listesi + durum)
- [X] **Cüzdan UI** — Profil sayfasında Wallet sekmesi mevcut (bakiye + yatırma + geçmiş)
- [X] **E-posta doğrulama UI** — kayıt sonrası kullanıcı `verify-email?mode=pending` ekranına yönleniyor; yeniden gönder aksiyonu ve confirm sayfası mevcut
- [X] **PWA / Offline** — `manifest.webmanifest`, service worker kaydı ve `offline.html` fallback eklendi

---

## 28. Admin Panel — Genel

### Tüm Ekranlar

| Route                         | Açıklama               | Durum |
| ----------------------------- | ------------------------ | ----- |
| `/admin/dashboard`          | KPI, istatistikler       | ✅    |
| `/admin/bookings`           | Randevu listesi + detay  | ✅    |
| `/admin/availability`       | Müsaitlik + slot        | ✅    |
| `/admin/resources`          | Kaynak yönetimi         | ✅    |
| `/admin/services`           | Hizmet yönetimi         | ✅    |
| `/admin/site-settings`      | Site ayarları editörü | ✅    |
| `/admin/custompage`         | Özel sayfa CMS          | ✅    |
| `/admin/slider`             | Slider yönetimi         | ✅    |
| `/admin/faqs`               | SSS yönetimi            | ✅    |
| `/admin/reviews`            | İnceleme yönetimi      | ✅    |
| `/admin/menuitem`           | Menü yönetimi          | ✅    |
| `/admin/footer-sections`    | Footer yönetimi         | ✅    |
| `/admin/contacts`           | İletişim mesajları    | ✅    |
| `/admin/newsletter`         | Bülten aboneleri        | ✅    |
| `/admin/notifications`      | Sistem bildirimleri      | ✅    |
| `/admin/email-templates`    | E-posta şablonları     | ✅    |
| `/admin/mail`               | Manuel e-posta           | ✅    |
| `/admin/storage`            | Medya kütüphanesi      | ✅    |
| `/admin/chat`               | Chat yönetimi + AI      | ✅    |
| `/admin/telegram`           | Telegram bot             | ✅    |
| `/admin/gutschein`          | Hediye çeki             | ✅    |
| `/admin/gutschein/products` | Gutschein ürünleri     | ✅    |
| `/admin/wallet`             | Cüzdan yönetimi        | ✅    |
| `/admin/payment-settings`   | Ödeme gateway ayarları | ✅    |
| `/admin/popups`             | Pop-up yönetimi         | ✅    |
| `/admin/users`              | Kullanıcı yönetimi    | ✅    |
| `/admin/user-roles`         | Rol yönetimi            | ✅    |
| `/admin/audit`              | Denetim logları         | ✅    |
| `/admin/db`                 | DB yönetimi             | ✅    |
| `/admin/reports`            | Raporlar                 | ✅    |
| `/admin/profile`            | Admin profil             | ✅    |

### Admin Panel Genel Özellikler

| Özellik                                            | Durum |
| --------------------------------------------------- | ----- |
| Biome lint + format (`bun run check:fix`)         | ✅    |
| Zustand store (global state)                        | ✅    |
| React Query (veri yönetimi)                        | ✅    |
| Dark/Light tema                                     | ✅    |
| Responsive tasarım                                 | ✅    |
| Data Table bileşeni (sıralama, filtre, sayfalama) | ✅    |
| Sheet/Dialog form deseni                            | ✅    |
| Locale switcher (admin UI dili)                     | ✅    |

---

## Genel Eksikler ve Açık Konular

### Öncelikli (P1)

| Konu                                 | Bileşen           | Açıklama                                                          | Durum |
| ------------------------------------ | ------------------ | ------------------------------------------------------------------- | ----- |
| ~~Profil / sipariş geçmişi sayfası~~ | Frontend       | ~~Kullanıcı kendi randevularını ve siparişlerini göremez~~ | ✅ Çözüldü |
| ~~Randevu e-posta bildirimleri~~     | Backend + Email    | ~~Accept/reject işleminde otomatik e-posta tetikleyicisi yok~~ | ✅ Çözüldü |
| ~~Randevu ödeme entegrasyonu~~      | Full Stack          | ~~Cüzdan + PayPal ile randevu ödemesi~~                           | ✅ Çözüldü |
| ~~E-posta doğrulama akışı~~          | Frontend + Backend | ~~Kayıt sonrası verify-email bekleme ekranı + resend + confirm akışı~~ | ✅ Çözüldü |

### Orta Öncelik (P2)

| Konu                          | Bileşen    | Açıklama                                               | Durum |
| ----------------------------- | ----------- | -------------------------------------------------------- | ----- |
| ~~Frontend cüzdan sayfası~~ | Frontend   | ~~Para yatırma ve bakiye görünümü için tam sayfa yok~~ | ✅ Çözüldü |
| ~~İyzico checkout sayfası~~ | Frontend   | ~~Ödeme iframe/redirect sayfası tamamlanmamış~~      | ✅ Çözüldü |
| ~~Admin takvim görünümü~~  | Admin Panel | ~~Randevular için full calendar widget yok~~           | ✅ Çözüldü |
| Otomatik slot üretimi (cron) | Backend     | Slotların zamanlanmış görevle otomatik üretimi yok  | ⬜ |

### Düşük Öncelik (P3)

| Konu                      | Bileşen        | Açıklama                                                          | Durum |
| ------------------------- | --------------- | ------------------------------------------------------------------- | ----- |
| ~~Log temizleme politikası~~ | Backend         | ~~Audit retention + periyodik cleanup eklendi~~       | ✅ Çözüldü |
| Servis kategorisi         | Backend + Admin | Hizmet gruplandırma/kategori filtresi yok                          | ⬜ |
| ~~İade (refund) akışı~~ | Backend + Admin | ~~Sipariş ve gutschein için admin cancel/refund tetikleyicisi eksik~~ | ✅ Çözüldü |
| 2FA                       | Backend         | İki faktörlü doğrulama backlog'da                               | ⬜ |
| ~~PWA~~                       | Frontend        | ~~manifest + service worker + offline fallback mevcut~~                                 | ✅ Çözüldü |

---

## CI/CD ve Deploy Özeti

| Adım                       | Araç                       | Durum |
| --------------------------- | --------------------------- | ----- |
| Push to `main` → build   | GitHub Actions              | ✅    |
| Backend build (Bun → Node) | `bun run build`           | ✅    |
| Frontend build              | `bun run build` (Next.js) | ✅    |
| Admin panel build           | `bun run build`           | ✅    |
| VPS'e rsync                 | `.env` exclude            | ✅    |
| PM2 reload (3 servis)       | `pm2 reload`              | ✅    |
| Nginx reverse proxy         | `/api` → `:8093`       | ✅    |

---

*Rapor tarihi: 2026-03-07 · Proje: Königsmassage · Lisans: MIT — Orhan Güzel*
