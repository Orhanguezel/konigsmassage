# Ortak Çalışma Planı

> Güncelleme: 2026-03-04
> Bu dosya otomatik olarak her iki bilgisayarda senkronize edilir.

---

## Bilgisayarlar

| | ThinkPad L15 | TravelMate P2510 |
|---|---|---|
| **IP** | 172.20.10.6 | 172.20.10.3 |
| **CPU** | i5-1335U · 12 çekirdek | i5-7200U · 4 çekirdek |
| **RAM** | 24 GB | — |
| **Disk** | 233 GB NVMe · %27 dolu | 233 GB HDD · %74 dolu ⚠️ |
| **Rol** | Ana geliştirme | İkincil / mobil |
| **Servisler** | nginx · mysql · postgresql | mongodb · postgresql |

> ⚠️ TravelMate'in diski dolmak üzere. Temizlik önerilir.

---

## Ortak Klasör

```
~/Documents/Projeler/          ← her iki bilgisayarda eş zamanlı
    CALISMA_PLANI.md           ← bu dosya
    proje-adi/
        README.md
        src/
        ...
```

**Kural:** Yeni proje başlatırken burada bir klasör aç.
Değişiklikler otomatik senkronize edilir, bir şey yapmanıza gerek yok.

---

## İş Bölümü

### ThinkPad → Ana Geliştirme Makinesi
- Ağır işler, derleme, test
- Nginx + MySQL + PostgreSQL çalışıyor → backend geliştirme burada
- VSCode, Node.js, Python aktif
- Gücü varken tercih et

### TravelMate → İkincil / Saha Makinesi
- Hafif geliştirme, kod okuma, düzenleme
- MongoDB + PostgreSQL çalışıyor
- İnternetsiz çalışmak için ideal (sync kesilse de dosyalar yerelde kalır)
- Bağlantı tekrar kurulunca otomatik güncellenir

---

## Çalışma Akışı

```
1. Hangi bilgisayarda olursan ol → ~/Documents/Projeler/ içinde çalış
2. Dosyayı kaydet → Syncthing otomatik senkronize eder (~2 sn)
3. Diğer bilgisayara geçince → dosyalar zaten güncel
```

### Aynı anda iki bilgisayarda çalışırken
- **Farklı dosyalarda** çalışıyorsanız: sorun yok, ikisi de senkronize olur
- **Aynı dosyada** çalışıyorsanız: `git` kullanın (çakışma olmasın)

---

## Git ile Sürüm Kontrolü (Önerilen)

Her proje için:

```bash
cd ~/Documents/Projeler/proje-adi
git init
git add .
git commit -m "ilk commit"
```

Böylece kim ne değiştirdi, ne zaman — tam geçmiş tutulur.

---

## SSH ile Uzaktan Erişim

```bash
# ThinkPad'dan TravelMate'e bağlan
ssh orhan@172.20.10.3

# TravelMate'den ThinkPad'a bağlan
ssh orhan@172.20.10.6
```

---

## Yapılacaklar

- [ ] TravelMate diskini temizle (%74 dolu)
- [ ] İlk projeyi `~/Documents/Projeler/` altında oluştur
- [ ] Her proje için `git init` yap
- [ ] Ortak kullanılacak servisleri belirle (nginx/postgresql/mongodb)

---

## Notlar

_Bu alana çalışma notları, kararlar, fikirler eklenebilir._

