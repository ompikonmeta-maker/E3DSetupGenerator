# Rencana — E3D Setup Generator

Status: **draf, menunggu persetujuan**. Belum ada kode yang ditulis.

## 1. Temuan dari fixture (yang memengaruhi desain)

| # | Temuan | Dampak |
|---|---|---|
| T1 | Urutan baris **DB Register** ≠ urutan tampil. Register: M1–M6, Q1–Q5, R1, R2, **FD, TR**, HC, HO, HF, HL, **LV, HK, HB**, FU, ST, DU. Site Order, B1 (`CREATE`/`ADD`), B2, B3 dan 99 memakai urutan grup. | Modul disimpan sebagai **satu daftar master** (urutan register). Urutan tampil = daftar master yang di-*stable-sort* per urutan grup. Indeks slot = peringkat di dalam grup. Satu model menghasilkan dua urutan. |
| T2 | Label modul ≠ teks deskripsi: `Hull Deck - Crane Laydown` vs `DB for … - Hull Deck Crane Laydown`; `M1 - Liquefaction 1` vs `… - M1 Liquefaction 1`. | Per modul ada `label` (register) dan `descText` (DESC DB/site). |
| T3 | Deskripsi team yang sudah ada bisa berbeda dari format: register `TEAM FOR INSTRUMENT ZR FLNG`, macro (baris di-comment) `TEAM FOR INSTRUMENTATION ZR FLNG`. | Per team ada `existingDesc` opsional (dipakai di register); macro tetap memakai format. |
| T4 | B3 Piping = 107 zone fluid per site (VT sudah termasuk di daftar fluid), **bukan** 107 + `-PIPE-VT`. Site `…DUX` hanya mendapat 5 zone Dummy, tanpa zone disiplin. | Aturan zone: zone disiplin untuk site function D/F/S; zone Dummy untuk function X. |
| T5 | Sheet Zones berisi baris `(not defined)` / PENDING per site untuk E/I/T/N (3002 baris = 2906 zone + 96 baris pending). | Register menulis baris placeholder untuk disiplin PENDING. |
| T6 | Teks di register sudah agak basi: Setup Steps menulis "B3 … (R L M S A H only)" dan "no B3 file for these disciplines", padahal ZIP berisi B3 untuk E/I/T/N. | Sheet naratif (Setup Steps-notes, Naming Rules, Access, Notes) = **teks bebas di konfigurasi**. Preset ZRF memuat teks persis supaya golden test lolos. Jumlah/posisi dihitung otomatis. |
| T7 | `90-REFERENCE`: baris pending ditulis `$* ADD X   <- SMA pending` dan tidak memakan nomor posisi. `99-FIXUP` mengikuti pola yang sama (`$* CURRENT …`). | Item referensi punya `pending` + `pendingNote`. |
| T8 | Tanggal hanya muncul di `00-README.txt` (`Generated 2026-10-21`). | Normalisasi golden test cukup pada baris itu. |
| T9 | Register memakai sel `inlineStr` dan angka bertipe `n`. Fluid code di `fluid-codes.txt` punya spasi di belakang (`VT      `). | Parser fluid melakukan trim. Writer XLSX cukup inlineStr + number. |
| T10 | `BASE-ENI.xlsx` (619 baris) hanya berisi nama DB + DB No. Nama site ENI (mis. `/R-LQD`) tidak ada di sana. | Cek bentrok site butuh daftar terpisah (paste/CSV). |

## 2. Struktur file

```
src/                      kode sumber, script klasik (tanpa ES module: file:// memblokir module)
  core/model.js           skema config, default, migrasi versi
  core/derive.js          config → daftar DB, site order, zone, posisi MDB (murni, tanpa DOM)
  core/validate.js        aturan validasi + nomor fakta
  core/macros.js          teks B1/B2/B3/00/90/99/README (CRLF)
  core/register.js        data sheet register (array of rows)
  core/diff.js            mode perubahan (D0–D3)
  io/zip.js               writer ZIP mode store (CRC32) + reader (inflate via DecompressionStream)
  io/xlsx.js              writer xlsx minimal (inlineStr) + reader (untuk BASE-ENI / golden)
  io/csv.js, io/fluid.js  parser input
  presets/zrf.js          preset ZRF lengkap
  ui/*.js, ui/app.css     8 langkah UI di atas toolkit MD3
  index.html              halaman dev: memuat src/* langsung, bisa dibuka dari file://
tests/
  test.html               test runner di browser (pilih fixture lewat file picker / drag-drop)
  cases/*.js              golden test + kasus batas
  run-node.mjs            opsional, hanya mesin dev
tools/build.py            gabung src/* + MD3 toolkit → dist/ (hanya di mesin dev)
dist/e3d-setup-generator.html   SATU file final, di-commit ke repo → ini yang dibawa ke kantor
```

Tidak ada build step yang wajib bagi Anda: file `dist/` sudah jadi dan di-commit. `src/index.html` juga bisa langsung dibuka tanpa build.

## 3. Model data (JSON, `schemaVersion: 1`)

```js
{
  project:  { code:'ZRF', name:'ZR FLNG', mdb:'/MDB-ZRF',
              teamDescFmt:'TEAM FOR {DISC} {NAME}', dbDescFmt:'DB for {Discipline} - {Desc}',
              packageName:'ZRF-SETUP-PACKAGE' },
  patterns: { db:'{TEAM}/DESI-{D}-{CODE}{F}', site:'/{D}-{CODE}{F}',
              sepDisc:'/----{DISCIPLINE}----', sepGroup:'/{D}----{GROUP}----',
              sepDiscOn:true, sepGroupOn:true },
  dbAttr:   { type:'DESI', access:'MULTIWRITE', claim:'IMPLICIT', dbnoBase:10000, discStep:100 },
  functions:[ {letter:'D', name:'Installed'}, {letter:'F', name:'Future'},
              {letter:'S', name:'Study'}, {letter:'X', name:'Dummy'} ],
  disciplines:[ { letter:'R', name:'Equipment', team:'ZRFEQP', teamExists:true,
                  existingDesc:null, members:['SMRENDRA','NMHIZQIL'], order:1,
                  active:true, zones:[{suffix:'-EQUI', purpose:'…', docRef:'3.9 D'}, …],
                  zoneMode:'list' | 'fluid' | 'pending' } , … ],
  groups:   [ { name:'MODULES', slotBase:1 }, { name:'PIPE-RACK', slotBase:11 }, … ],
  modules:  [ /* urutan register (T1) */
              { code:'M1', label:'M1 - Liquefaction 1', descText:'M1 Liquefaction 1',
                group:'MODULES', func:'D', status:'' }, … ],
  dummyZones:[ {suffix:'-STRU', purpose:'…'}, … ],     // untuk function X
  fluidCodes:[ {code:'AD', desc:'AMINE CLOSED DRAIN'}, … ],
  references:[ { db:'MASTER/STLCATA', pending:false, note:'' }, … ],
  existing: { dbs:[{name, dbno, project}], sites:['/R-LQD', …] },
  adminTeam:{ team:'ZRFADM', desc:'…', members:[…] }, freeUsers:[…],
  registerText:{ setupSteps:{…}, namingRules:[…], access:{…}, notes:[…] }   // T6
}
```

Rumus (di `derive.js`):
- `displayOrder` = modul master, di-stable-sort per urutan grup.
- `slot = group.slotBase + rankInGroup`; `DBNO = dbnoBase + disc.order × discStep + slot`.
- Posisi MDB = berurutan untuk disiplin aktif (urutan disiplin), di dalamnya `displayOrder`; referensi non-pending menyusul.

## 4. Validasi (sumber = nomor fakta)

| Level | Aturan | Fakta |
|---|---|---|
| Error | DB No di luar 1–7000 / 10000–250000, atau duplikat | 1.3 |
| Error | DB No / nama DB bentrok dengan daftar existing | 1.3 (DB No unik), 6.11 `(1,4) Database name already defined` |
| Warning | Nama site bentrok dengan daftar existing | §7 `(41,12) Name already used` |
| Warning | Nama tidak diawali `/` atau bukan huruf besar | 3.5 |
| Error | Posisi MDB > 5000, atau DB current > 1000 | 1.7, §2 |
| Error | Team pemilik tidak ada dan tidak ikut dibuat | 1.12 |
| Warning | Grup berisi > 10 item (slot meluap ke grup berikutnya) | aturan project (bukan E3D) |
| Info | Disiplin tanpa zone → PENDING | — |
| "perlu dites" (README) | `NEW ZONE`, `ADD db n` melewati jumlah current, karakter selain huruf/angka/`-` | §9 |

## 5. Alur UI (nav rail, 8 langkah)

1 Project → 2 Disiplin & Team → 3 Grup & Modul (drag untuk urutan; kolom slot/DB No dihitung langsung) → 4 Zone (list per disiplin, fluid code paste/import, zone Dummy) → 5 Referensi & cek bentrok (paste list, import CSV/XLSX) → 6 Preview (tabel Site Order ala Model Explorer + tab per file macro) → 7 Validasi (error/warning/info, klik untuk lompat ke field) → 8 Generate (pilih disiplin, unduh ZIP + XLSX + JSON).

Toolbar: Load preset ZRF · Import/Export JSON · draft otomatis di `localStorage`.

## 6. Mode perubahan

Input: config lama (JSON) + config sekarang. Output ZIP delta:
- **D0** daftar DB yang harus dihapus (nama sama, DB No berubah → hapus lalu buat ulang; atau DB hilang).
- **D1** Admin: `CREATE DB` untuk yang baru/dibuat ulang + `ADD`/`CURRENT` untuk menyusun ulang MDB.
- **D2** Design: site untuk DB baru (pola B2).
- **D3** Design: zone untuk site baru.

Detail format D0–D3 akan saya tanyakan lagi saat fase 5 (belum ada contoh delta ZRF di fixture).

## 7. Fase

| Fase | Isi | Bukti selesai |
|---|---|---|
| 1 | `model.js`, `derive.js`, `validate.js`, preset ZRF | Test: 250 DB, DB No & posisi sama dengan fixture; validasi bersih untuk ZRF |
| 2 | `macros.js`, `zip.js` + golden test | 34 file identik dengan `ZRF-SETUP-PACKAGE.zip` (hanya tanggal README dinormalisasi) |
| 3 | `register.js`, `xlsx.js` | Isi sel 10 sheet identik dengan `ZRF-E3D-Register.xlsx` |
| 4 | UI + MD3 + build `dist/` | Preset ZRF → generate dari UI menghasilkan output fase 2/3; tanpa satu pun request jaringan |
| 5 | Mode perubahan | Contoh delta dari dua config |

Kasus batas yang dites: disiplin tanpa modul, grup kosong, separator dimatikan, > 10 item dalam grup, DB No bentrok ENI (`BASE-ENI.xlsx`).

## 8. Pertanyaan untuk Anda

1. **Browser di kantor**: Edge/Chrome versi berapa? Saya mau memakai `DecompressionStream` (bawaan browser) untuk membaca XLSX/ZIP, jadi tidak perlu library inflate.
2. **Font & ikon**: pakai font sistem (Segoe UI) + ikon SVG inline (~25 ikon) supaya file kecil? Opsi lainnya, Roboto + Material Symbols di-embed (+ beberapa MB).
3. **Build**: setuju dengan `src/` + `dist/` satu file yang di-commit (build hanya di mesin dev)?
4. **Teks naratif register** (T6): setuju jadi teks bebas di konfigurasi (preset ZRF = teks persis)? Atau sebaiknya teks yang basi diperbaiki sekalian (dengan konsekuensi golden test register ikut disesuaikan)?
