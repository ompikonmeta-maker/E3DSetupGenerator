# Prompt Claude Code — E3D Setup Script Generator (Teams → Zones)

> Cara pakai: buat folder project baru, salin file referensi (lihat bagian "File referensi") ke `docs/` dan `fixtures/`, lalu tempel seluruh isi di bawah garis ke Claude Code. Mulai dengan **plan mode**.

---

## Peran dan tujuan

Kamu membantu saya (admin AVEVA E3D, latar belakang Smart3D) membangun **E3D Setup Generator**: tool yang menghasilkan semua script setup project E3D, mulai dari Team, DB, MDB, Site, sampai Zone, dari satu konfigurasi. Tool ini juga menghasilkan register Excel.

Acuan nyatanya adalah project **ZRF (ZR FLNG)**, yang sudah saya setup secara manual dengan bantuan generator Python. Tool baru ini harus bisa mereproduksi paket ZRF itu, dan juga dipakai untuk project lain dengan disiplin, modul, dan aturan nama yang berbeda.

**Jangan langsung coding.** Baca dulu semua file di `docs/` dan `fixtures/`, lalu buat rencana: struktur file, model data, alur UI, dan fase pengerjaan. Tunggu persetujuan saya sebelum menulis kode.

## Batasan lingkungan (wajib)

- Komputer kantor Windows tanpa hak admin. Tidak bisa install aplikasi, dan tidak ada server.
- Jaringan kantor **memblokir CDN** (esm.run, Google Fonts, dan lainnya). Tool harus bisa jalan **100% offline, tanpa satu pun request jaringan**.
- Bentuk akhir: **satu file HTML self-contained**, vanilla JavaScript, tanpa framework dan tanpa build step yang wajib. Library pihak ketiga (misalnya untuk ZIP atau XLSX) hanya boleh dipakai kalau di-inline ke file HTML. Tulis sendiri kalau itu lebih kecil, misalnya ZIP mode store dan XML SpreadsheetML minimal.
- UI mengikuti basis **Material Design 3** milik saya (token CSS, tabel data, form, dialog, snackbar, tab, nav rail). Kalau file basisnya saya taruh di `docs/m3/`, pakai file itu. Font dan ikon harus lokal atau ikut ter-inline.
- Bahasa UI: Inggris untuk istilah E3D, Indonesia untuk teks bantuan.

## File referensi (saya siapkan di folder project)

| File | Isi | Dipakai untuk |
|---|---|---|
| `docs/fakta-terverifikasi-e3d-admin.md` | Fakta E3D berlabel [DOC] (dokumentasi AVEVA) dan [TES] (sudah dites), plus daftar "belum terverifikasi" | **Aturan validasi.** Jangan menambah aturan E3D di luar dokumen ini tanpa sumber |
| `docs/contoh-paket-setup-zrf.md` | Teks lengkap macro ZRF | Format output |
| `docs/contoh-register-zrf.md` | Isi register ZRF (sheet per sheet) | Format register |
| `docs/rangkuman-zrf-setup.md` | Keputusan dan aturan penamaan ZRF | Konfigurasi default "ZRF" |
| `fixtures/ZRF-SETUP-PACKAGE.zip` | Paket macro ZRF final (34 file) | **Golden test** |
| `fixtures/ZRF-E3D-Register.xlsx` | Register ZRF final | Golden test (isi sel, bukan format) |
| `fixtures/BASE-ENI.xlsx` | Daftar DB project lain (kolom DB, DB No., …) | Contoh input cek bentrok |
| `fixtures/fluid-codes.txt` | 107 fluid code (kode TAB deskripsi) | Contoh input zone Piping |

## Model data (konfigurasi)

Semua aturan harus bisa diatur dari UI dan disimpan sebagai **JSON** (export/import file; `localStorage` hanya untuk draft). Minimal:

1. **Project:** kode, nama MDB (misalnya `/MDB-ZRF`), format deskripsi team (`TEAM FOR {DISC} ZR FLNG`), format deskripsi DB (`DB for {Discipline} - {Module}`).
2. **Disiplin:** kode huruf (R, L, …), nama, team (ZRFEQP, …), status team (sudah ada / perlu dibuat), nomor urut untuk DB No (R=1 … N=11), dan aktif/tidak (lingkup saat ini).
3. **Grup site** (urutan tampil), masing-masing dengan **slot base** DB No. Contoh ZRF: MODULES 1, PIPE-RACK 11, HULL-DECK 21, HULL-BODY 31, HOOK-UP 41, OTHERS 51, FUTURE-STUDY 61, DUMMY 71.
4. **Modul/item** per grup: kode 2 huruf, label, dan function letter. ZRF: D = Installed, F = Future (FU), S = Study (ST), X = Dummy Model (DU).
5. **Pola nama:** DB `{TEAM}/DESI-{D}-{CODE}{F}`, site `/{D}-{CODE}{F}`, separator disiplin `/----{DISCIPLINE}----`, separator grup `/{D}----{GROUP}----`. Separator bisa dimatikan.
6. **Rumus DB No:** `10000 + urutan_disiplin × 100 + slot`, dengan slot = slot_base_grup + indeks item dalam grup.
7. **Zone per disiplin:** daftar suffix + purpose (contoh R: `-EQUI`, `-NIEQP`). Piping: satu zone per fluid code (`-PIPE-{CODE}`, dari daftar fluid code). Zone khusus function X: `-STRU`, `-EQUI`, `-VOL`, `-ROUTE`, `-TIE`. Disiplin tanpa aturan zone ditandai **PENDING**.
8. **Atribut DB:** `DESI`, `ACCESS MULTIWRITE`, `CLAIM IMPLICIT` (bisa diubah).
9. **Referensi MDB:** daftar DB catalog/foreign yang ditambahkan setelah DB project (bisa di-paste dari list).
10. **Daftar DB/site existing** untuk cek bentrok (import CSV/XLSX).

## Output yang dihasilkan (ZIP)

Struktur dan isi harus **sama dengan `fixtures/ZRF-SETUP-PACKAGE.zip`** saat konfigurasi ZRF dipakai:

```
00-README.txt
00-TEAMS/ZRF-00-TEAMS-ADMIN.mac
NN-<D>-<TEAM>/ZRF-NN-<D>-B1-CREATE-DB-MDB-ADMIN.mac   (Admin: CREATE DB + SET MDB + ADD db n)
NN-<D>-<TEAM>/ZRF-NN-<D>-B2-SITES-DESIGN.mac          (Design: separator + site, urutan tampil)
NN-<D>-<TEAM>/ZRF-NN-<D>-B3-ZONES-DESIGN.mac          (Design: zone; tidak dibuat kalau disiplin PENDING)
90-REFERENCE/ZRF-90-REF-MDB-ADMIN.mac
99-FIXUP/ZRF-99-MDB-REORDER-ADMIN.mac                 (CURRENT 1..n, final order)
```

**Aturan format macro yang sudah terbukti (jangan diubah):**
- Line ending **CRLF**. Komentar diawali `$*`. Header berupa blok komentar.
- B1: `CREATE DB {db} DESI ACCESS MULTIWRITE CLAIM IMPLICIT DBNO {n} DESC '{desc}'`, lalu `SET MDB /…`, lalu `ADD {db} {pos}` dengan posisi absolut (disiplin berurutan).
- B2: `DB` ditulis **sekali per DB**, yaitu pada site pertama di DB itu. Baris berikutnya untuk DB yang sama ditulis tanpa `DB`. Separator dibuat **sebelum** site di DB yang sama (di dalam satu DB, urutan tampil = urutan pembuatan). Diakhiri `SAVEWORK`.
- B3: baris nama site (contoh `/R-M1D`), lalu `NEW ZONE {site}-{suffix}`, blok dipisah `$*`, diakhiri `SAVEWORK`.
- **Jangan pakai `REORDER`** antar-DB. Itu gagal dengan error (41,227); lihat doc fakta §4.

**Register `.xlsx`**, dengan sheet: Setup Steps, Package Files, Teams & Users, DB Register, Site Order (termasuk kolom Site Description = deskripsi DB; kosong untuk separator), Zones, Fluid Codes, Naming Rules, Access, Notes.

## Validasi (tampilkan sebagai daftar error/warning sebelum generate)

Setiap aturan diberi sumber. Gunakan hanya yang ada di `docs/fakta-terverifikasi-e3d-admin.md`:

- DB No harus di rentang **1–7000 atau 10000–250000**, dan unik (error) — fakta 1.3.
- DB No dan nama DB tidak boleh bentrok dengan daftar existing (error). Nama site juga dicek (warning).
- Nama elemen diawali `/` dan berhuruf besar (warning) — fakta 3.5.
- Posisi MDB 1–5000, dan jumlah DB current maksimal **1000** (error) — fakta 1.7 dan §2.
- Team pemilik harus ada atau ikut dibuat (error) — fakta 1.12.
- Disiplin tanpa aturan zone menjadi PENDING (info).
- Item yang termasuk "belum terverifikasi" (misalnya `NEW ZONE`, isian Create SITE di GUI) ditandai **"perlu dites"** di README output.

## UI (alur A sampai Z)

1. **Project** → 2. **Disiplin & Team** → 3. **Grup & Modul** (tabel yang bisa di-drag untuk mengubah urutan) → 4. **Zone** → 5. **Referensi & cek bentrok** → 6. **Preview**: tabel Site Order (mirip Model Explorer) dan isi tiap macro dengan tab per file → 7. **Validasi** → 8. **Generate** ZIP dan XLSX.

Fitur tambahan:
- **Preset "ZRF"** yang memuat konfigurasi lengkap ZRF.
- Generate hanya disiplin yang dipilih.
- Mode **"perubahan"**: bandingkan konfigurasi lama dan baru, lalu hasilkan daftar DB yang harus dihapus (karena nomornya berubah), DB yang perlu dibuat, dan macro `ADD` + `CURRENT` untuk menyusun ulang MDB. Polanya mengikuti delta ZRF: D0 daftar hapus, D1 Admin, D2 site, D3 zone.

## Pengujian

- **Golden test:** dengan preset ZRF, hasil ZIP harus identik per file dengan `fixtures/ZRF-SETUP-PACKAGE.zip`. Bandingkan teksnya dan normalisasi hanya tanggal di header. Isi sel register harus sama dengan `fixtures/ZRF-E3D-Register.xlsx`.
- Sediakan halaman atau fungsi test yang bisa dijalankan di browser, karena tidak ada Node di komputer kantor. Kalau kamu memakai Node untuk test di mesin pengembangan, itu opsional saja, bukan syarat untuk menjalankan tool.
- **Uji kasus batas:** disiplin tanpa modul, grup kosong, separator dimatikan, slot penuh (lebih dari 10 item dalam satu grup harus memunculkan warning), dan DB No yang bentrok dengan ENI.

## Cara kerja yang saya harapkan

- Kerjakan per fase (model data dan rumus → generator macro + golden test → register XLSX → UI → mode perubahan). Tunjukkan hasil setiap fase sebelum lanjut.
- **Jangan berasumsi soal perilaku E3D.** Kalau butuh aturan yang tidak ada di doc fakta, tanyakan ke saya atau tandai "perlu dites".
- Penjelasan untuk saya: singkat, dalam bahasa Indonesia, dan kalau relevan bandingkan dengan Smart3D.
