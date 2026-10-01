# AGENTS.md - konigsmassage

## SUNUCUDA DERLEME YASAK — vps-guezel sunucusu (2026-10-01, Orhan, zorunlu)

Bu proje `orhan@72.61.23.36` (1 vCPU / 3.9 GB RAM, 7+ canli site) uzerinde yayinlanir.
Sunucuda derleme dakikalarca tam CPU yer, build boyunca TUM siteler yavaslar
(2026-09-03 CPU krizi: load 36, hepsi dustu). Kural hepsihal ve guezelwebdesign'da
uygulanan kuralin aynisidir.

**Sunucuda yasak:** `bun run build`, `next build`, `tsc`, `docker build`, `bun test`,
Playwright/Chromium, lighthouse, `sudo` ile build/yazma. Sunucuda
`/etc/vps-guezel-derleme-yasak` isaret dosyasi durur — silme. Tek istisna Orhan'in
acik acil durum onayi: `SUNUCUDA_DERLE=evet-acil`.

**Yayin:** derleme yerelde (ya da CI runner'inda) yapilir; sunucuya yalniz hazir cikti
(`.next`, `dist`, release arsivi) gider; sunucuda yalniz takas + `pm2 restart` +
saglik kontrolu + basarisizsa onceki surume geri donus yapilir. Referans uygulama:
`vps-guezel/guezelwebdesign/scripts/deploy-yerel.sh` (+ `derleme-kilidi.mjs`,
`next-externals-bagla.mjs`). Bu projede ayni akis yoksa kur: kilidi
(`node scripts/derleme-kilidi.mjs &&`) build betiklerinin basina ekle, deploy'u yerel
derlemeye cevir. Kurulana kadar yayin oncesi Orhan'a danis.

**Deploy'dan once:** `df -h /` (>= 3 GB bos; 2026-10-01'de disk %100 doluydu),
commit'lenmis temiz kaynak, kalite kapisi yesil. Push'un deploy tetikleyip
tetiklemedigini `.github/workflows` icinde kontrol et — "push = deploy" varsayma.

**2026-10-01 tuzaklari (hepsi canlida yasandi):**
1. Turbopack `.next/node_modules/<paket>-<hash>` GORELI symlink'i derleyen makinenin
   node_modules'unu gosterir → sunucuda SSR 500. Gecisten once sunucuya yeniden bagla.
2. Yerelde derleyen Next surumu sunucuda calistiranla AYNI olmali.
3. Saglik kontrolu yalniz ana sayfaya bakmasin; harici paket/veri kullanan bir sayfa
   (blog, detay) da 200 donmeli.
4. Next `public/` listesini acilista onbellege alir: yeni public dosyasi restart'siz 404.
5. Root ile alinan build `.next`'i root'a birakir; PM2 (orhan) ISR onbellegine yazamaz,
   sayfalar yenilenmez (EACCES).
6. Cok kiracili/markali kurulumda `NEXT_PUBLIC_*` derlemeye gomulur: her kurulum kendi
   `.env`'iyle ayri derlenir, ayni cikti iki siteye gitmez.
7. Sunucuda `.next-*`, `*.bak`, `.env.*yedek`, eski release/kopya dizin BIRIKTIRME;
   geri donus icin tek onceki surum yeter.
8. Sunucu agaclarinda commit'lenmemis elle degisiklik var: `git pull` ile yayin yapma.
9. `~/.ssh/config`'teki `guezelwebdesign` takma adi eski IP'dir, artik bize ait degil;
   dogrudan `orhan@72.61.23.36` kullan.

**Bu projenin durumu (2026-10-01):** **Durum: kismen uyumlu.** CI (`main.yml`, yalniz workflow_dispatch) derleyip rsync'liyor, sunucuda yalniz `pm2 reload` — derleme yok. Eksik: `rsync --delete` dogrudan canli dizine yaziyor (gecis/geri donus/saglik kontrolu yok) → `deploy-yerel.sh` akisina tasinmali. Canli: `/var/www/konigsmassage` -> `vps-guezel/konigsmassage` (symlink) — CANLIDIR, silme. **Bilinen sorun (2026-10-01):** admin paneli `next ^16.1.1` ister ama sunucuda kendi `node_modules/next`'i yok; Next kok `/var/www/vps-guezel/node_modules`'tan **15.5.25** olarak cozuluyor (2026-09-03 GZLTemizlik kok kurulumu). 2026-08-18 build'i bu surumle kosuyor; bazi isteklerde `Invariant: Expected clientReferenceManifest` hatasi. Ayni sorun guezelwebdesign/gzlteknoloji panellerini tamamen dusurmustu (paneli derleyen surume baglanarak duzeltildi). 16.3.1 ile denendi, uymadi. Cozum: paneli YERELDE sunucuda calisacak Next surumuyle yeniden derleyip gonder ve `admin_panel/node_modules/next`'i o surume bagla.
