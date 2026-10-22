# Fakta Terverifikasi — AVEVA E3D Administration (dari Studi Kasus ZRF)

Diperbarui: 2026-10-21 · Pemilik doc: chat **Setup ZRF** (hanya chat ini yang menulis) · Pembaca: chat belajar · Alur kerja: `e3d-admin/panduan-alur-dokumentasi.md`

## Cara membaca dokumen ini (untuk chat/penulis materi lain)

- Dokumen ini adalah **sumber bahan** untuk materi belajar E3D. Isinya **hanya fakta yang sudah terbukti**, dari dua jenis sumber:
  - **[DOC]** = tertulis di dokumentasi resmi AVEVA (link disertakan).
  - **[TES]** = sudah dibuktikan langsung oleh omPik di project ZRF (E3D 3.1.8.1 / Administration 2.1.0.1), dengan tanggal tes.
- Bagian terakhir berisi hal yang **belum terverifikasi**. Jangan ajarkan bagian itu sebagai fakta.
- Konteks project: ZRF (ZR FLNG), project E3D yang dibuat Jakarta dari paket konversi Paris (ENI Coral, PDMS 12 → E3D). Detail keputusan project ada di `e3d-admin/rangkuman-zrf-setup.md`; dokumen ini sengaja tidak mengulanginya.
- Contoh nama di dokumen ini (ZRFPIP, DESI-L-M1D, /L-M1D, dan sebagainya) diambil dari project ZRF.
- Setiap fakta punya nomor tetap (misalnya 3.3). Nomor tidak pernah dipakai ulang. Fakta yang ternyata salah tidak dihapus, tapi ditandai **[DIKOREKSI tanggal]** beserta alasannya. Fakta yang benar tapi kurang lengkap ditandai **[DIPERJELAS tanggal]**.
- Perubahan dicatat di **§10 Changelog**. Untuk memproses yang baru, baca changelog sejak tanggal terakhir diproses.

---

## 1. Database, Team, dan MDB

| # | Fakta | Sumber |
|---|---|---|
| 1.1 | Setiap DB dimiliki oleh satu **Team**. Nama DB ditulis `TEAM/NAMA`, contoh `ZRFPIP/DESI-L-M1D`. | [DOC] [CREATE](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.023.html) |
| 1.2 | User **General** hanya bisa menulis ke DB milik team-nya; DB lain hanya bisa dibaca. User **Free** bisa menulis ke semua DB. | [DOC] [Database Access](https://docs.aveva.com/bundle/administration/page/871680.html) |
| 1.3 | Nomor DB yang boleh dipakai user: **1–7000** dan **10000–250000**. Nomor 7001–9999 dan 250001–255000 dicadangkan AVEVA. Nomor DB harus unik di dalam satu MDB. | [DOC] [CREATE](https://docs.aveva.com/bundle/administration/page/871319.html) |
| 1.4 | DB **Multiwrite** bisa diakses banyak penulis sekaligus. DB **Update** hanya satu penulis. Hanya DB MODEL (DESI), CATALOGUE, DRAFT, dan ISODRAFT yang bisa multiwrite. | [DOC] [CREATE](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.023.html) |
| 1.5 | Claim mode multiwrite: **IMPLICIT** (elemen otomatis di-claim saat diubah) atau **EXPLICIT** (user harus `CLAIM` dulu). | [DOC] [CREATE](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.023.html) |
| 1.6 | **MDB** (Multiple Database) adalah daftar DB yang dibuka user saat masuk Design. DB di MDB bisa berstatus **current** (dipakai) atau **deferred** (terdaftar tapi tidak dibuka). | [DOC] [ADD](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.008.html), [DEFER](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.027.html) |
| 1.7 | Satu MDB bisa berisi hingga **5000** DB, dan **maksimal 1000** di antaranya bisa current pada saat yang sama. Batas "300" berasal dari Command Reference PDMS lama. | [DOC] [Create MDBs (871727)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871727.html) |
| 1.8 | Di daftar DB modul Admin, DB diurutkan berdasarkan **nomor DB**. | [TES] 2026-10-20 |
| 1.9 | Urutan DB di MDB ditentukan oleh **nomor posisi** pada `ADD db n` / `CURRENT db n`, bukan oleh nomor DB. | [TES] 2026-10-20 · [DOC] [CURRENT](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.024.html) |
| 1.10 | Team dan User boleh dibuat dalam **urutan apa saja**. User juga bisa dibuat lebih dulu, lalu dimasukkan ke Team lewat jendela Create Team. | [DOC] [Create Teams/Users (871711)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871711.html) |
| 1.11 | User harus menjadi **anggota Team pemilik DB** untuk bisa menulis ke DB itu. Kalau Team tidak punya user, hanya user Free yang bisa menulis ke DB milik Team tersebut. | [DOC] [Teams and Users (871679)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871679.html) |
| 1.12 | Saat membuat DB, **Owning Team dipilih dari Team yang sudah ada**. Nama DB berformat `TeamName/DatabaseName`, dan team pemilik itulah yang punya akses tulis. | [DOC] [Create Databases (871720)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871720.html) |
| 1.13 | MDB disusun dengan memilih DB yang **sudah ada di project**: daftar Project Databases menampilkan semua DB project yang belum masuk MDB, lalu dipindah sebagai current atau deferred. | [DOC] [Create MDBs (871727)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871727.html) |
| 1.14 | DB yang akan ditulis harus menjadi **DB pertama dari tipenya** (Model, Draft, dan lain-lain) di daftar member MDB. | [DOC] [Multiple Databases (871682)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871682.html) |

## 2. Command Admin (Project Definition)

Semua di bawah ini tertulis di AVEVA Administrator Command Reference (ACRM).

| Tujuan | Sintaks | Catatan | Sumber |
|---|---|---|---|
| Buat team | `CREATE TEAM teamid DESC 'teks'` | | [DOC] [CREATE](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.023.html) |
| Buat DB | `CREATE DB team/db DESI ACCESS MULTIWRITE CLAIM IMPLICIT DBNO n DESC 'teks'` | Contoh resmi: `CREATE DB STEEL/STEELDB DESI ACC MULTIW CLAIM EXPL` | [DOC] [CREATE](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.023.html) |
| Buat MDB | `CREATE MDB /nama` | | [DOC] [CREATE](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.023.html) |
| Pilih MDB | `SET MDB /nama` | Wajib sebelum `ADD`/`CURRENT` | [DOC] |
| DB ke MDB | `ADD team/db n` | Ditaruh di posisi n, rentang **1–5000** menurut Admin 2.1. **[DIKOREKSI 2026-10-21]** sebelumnya ditulis 1–1000 dari ACRM E3D 1.1. **Tanpa n → deferred** (sama dengan `DEFER`) | [DOC] [ADD (871304)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871304.html) · [ACRM 1.1](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.008.html) |
| Pindah posisi | `CURRENT team/db n` | Memindahkan DB ke posisi n, rentang **1–5000** menurut Admin 2.1 (ACRM 1.1: 1–1000). Ingat batas 1000 DB current (fakta 1.7) | [DOC] [CURRENT (871321)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871321.html) |
| Jadikan non-current | `DEFER team/db` | | [DOC] [DEFER](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.027.html) |
| Anggota team | `SET TEAM x` lalu `TADD userid` / `TREM userid` | | [DOC] |
| Ganti nama | `CNAME DB team/lama team/baru`, `CNAME TEAM lama baru`, `CNAME MDB /lama /baru` | Dokumentasi memperingatkan: CNAME DB harus dipakai dengan sangat hati-hati | [DOC] [CNAME](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.021.html) |

Fakta terkait:
- **Command** `CREATE DB` **tidak punya opsi** untuk membuat SITE atau elemen top-level lain. Opsi yang ada: tipe, PRODUCT, ACCESS (UPDATE/CONTROLLED/MULTIWRITE + CLAIM), PROTECTION, PASSWORD, EXTNO, DBNO, FINO, DESC. [DOC] [CREATE (871319)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871319.html) · [ACRM 1.1](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.023.html)
- **[DIPERJELAS 2026-10-21]** Sebaliknya, **jendela GUI Create Database** punya isian *Create* yang namanya menyesuaikan tipe DB; untuk tipe Design menjadi **"Create SITE"**. Dokumentasi juga menyebut System Administrator bisa membuat elemen tingkat pertama (misalnya Site) di DB. Jadi pernyataan lama "site hanya bisa dibuat di Design" hanya benar untuk jalur command; lewat GUI ada isian ini. Hasilnya **belum dites** di ZRF (lihat §9). [DOC] [Create Databases (871720)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871720.html), [Multiple Databases (871682)](https://help.aveva.com/AVEVA_Administration/2.1/content/en/871682.html)
- Sintaks `CREATE DB` di atas, termasuk `DBNO` dan `DESC`, sudah dipakai berhasil untuk membuat DB di ZRF. [TES] 2026-10-19/20

## 3. Command Design: membuat Site dan Zone

| # | Fakta | Sumber |
|---|---|---|
| 3.1 | Hierarki model: **WORLD > SITE > ZONE** > elemen (Equipment, Pipe, dan sebagainya). Tidak ada level "folder" di atas SITE. | [TES] terlihat langsung di Model Explorer (hierarki standar E3D) |
| 3.2 | `NEW SITE /nama DB team/db` membuat site di DB yang disebut. | [TES] 2026-10-20 (sintaks ini dari sumber komunitas, bukan dokumentasi AVEVA; sudah terbukti jalan) |
| 3.3 | `NEW SITE /nama` **tanpa** `DB` masuk ke DB yang sama dengan site yang dibuat sebelumnya. | [TES] 2026-10-20 |
| 3.4 | Di dalam satu DB, urutan site di Model Explorer **mengikuti urutan pembuatan**. Contoh salah urut: /L-M1D dibuat lebih dulu daripada separator di DB yang sama, sehingga tampil di atas `/L----MODULES----`. | [TES] 2026-10-20 (bukti: `bukti-03-model-explorer-urutan-site.png`) |
| 3.5 | Nama elemen selalu diawali `/`. E3D **case-sensitive** (/fred ≠ /FRED), dan AVEVA menyarankan huruf besar. Daftar karakter yang diizinkan tidak disebutkan di dokumentasi. | [DOC] [Element names](https://help.aveva.com/AVEVA_Everything3D/2.1/DBRM/DBRM1.02.07.html) |
| 3.6 | Elemen tidak wajib diberi nama; kalau tidak, E3D membuat nama dari posisinya di hierarki. Nama ini kurang stabil dibanding nama buatan user. | [DOC] [Element names](https://help.aveva.com/AVEVA_Everything3D/2.1/DBRM/DBRM1.02.07.html) |
| 3.7 | Satu-satunya owner sah **SITE** adalah **WORLD**. Owner sah **ZONE** adalah SITE, ZONE, atau APPLDATA. Jadi ZONE bisa bersarang di ZONE lain. | [DOC] [DMRM SITE](https://help.aveva.com/AVEVA_Everything3D/3.1/DMRM/DMRM5.09.079.html), [DMRM ZONE](https://help.aveva.com/AVEVA_Everything3D/3.1/DMRM/DMRM5.09.082.html) |
| 3.8 | **Urutan pembuatan yang wajib: Team → DB → MDB → SITE → ZONE.** DB butuh Team yang sudah ada (1.12). MDB disusun dari DB yang sudah ada (1.13). Site dibuat di DB yang current dan bisa ditulis di MDB (1.14), di bawah WORLD (3.7). Zone dibuat di bawah Site (3.7). Team dan User sendiri boleh dibuat dalam urutan apa saja (1.10). | [DOC] kesimpulan dari 1.10–1.14 dan 3.7 · [TES] urutan ini dipakai di ZRF |

Contoh pola yang terbukti menghasilkan urutan sesuai script [TES]:

```
NEW SITE /----PIPING---- DB ZRFPIP/DESI-L-M1D
NEW SITE /L----MODULES----
NEW SITE /L-M1D
NEW SITE /L-M2D DB ZRFPIP/DESI-L-M2D
NEW SITE /L-M3D DB ZRFPIP/DESI-L-M3D
```

Baris 1–3 masuk DB `DESI-L-M1D` dengan urutan: separator disiplin, separator grup, lalu site modul.

## 4. REORDER

| # | Fakta | Sumber |
|---|---|---|
| 4.1 | Sintaks: `REORDER elemen`, `REORDER elemen BEFORE posisi`, `REORDER elemen AFTER posisi`. Contoh resmi: `REORDER /ELBO3 BEFORE FIRST ELBO`. | [DOC] [REORDER](https://help.aveva.com/AVEVA_Everything3D/2.1/DBRM/DBRM4.05.5.html) |
| 4.2 | Elemen yang dipindah harus **member dari current element**. Owner-nya tidak berubah. | [DOC] [REORDER](https://help.aveva.com/AVEVA_Everything3D/2.1/DBRM/DBRM4.05.5.html) |
| 4.3 | Versi GUI: Modify > Hierarchy > Reorder. | [DOC] [DCFUG](https://help.aveva.com/AVEVA_Everything3D/2.1/DCFUG/DCFUG11.12.08.html) |
| 4.4 | REORDER site hanya berhasil kalau kedua site ada di **DB yang sama**. | [TES] omPik |
| 4.5 | Error `(41,227) SITE /R-Q1D is not in the current element's list` muncul saat REORDER dijalankan setelah `NEW SITE`. Saat itu current element adalah site baru, bukan WORLD. | [TES] 2026-10-20 (bukti: `bukti-04-error-41-227-reorder.png`) |

## 5. Model Explorer

| # | Fakta | Sumber |
|---|---|---|
| 5.1 | Model Explorer menampilkan elemen database dalam bentuk tree. **Tidak ada fitur grouping** di tree. | [DOC] [Getting Started](https://help.aveva.com/AVEVA_Everything3D/2.1/GS/GS7.7.4.html) |
| 5.2 | Ada **filter** (bawaan: Equipment, Supports, Structural, Piping; preset tambahan di Explorer Settings), dibuka dengan klik kanan di area kosong. Hanya satu filter sistem yang bisa aktif dalam satu waktu. | [DOC] [Filters](https://help.aveva.com/AVEVA_Everything3D/1.1/DCFUG/DCFUG08.09.03.html) |
| 5.3 | Pengelompokan data untuk operasi massal dilakukan lewat jendela **Collections**, bukan di tree. | [DOC] [Getting Started](https://help.aveva.com/AVEVA_Everything3D/2.1/GS/GS7.7.4.html) |
| 5.4 | Karena tidak ada folder di atas SITE, project ENI/Paris memakai **site kosong sebagai separator visual**, misalnya `/------LIVING-QUARTER-SAIPEM------` dan `/----RACK----`. Ini praktik project, bukan fitur E3D. | [TES] dilihat langsung di project ENI (bukti: `bukti-05-eni-model-explorer-separator.png`) |
| 5.5 | Di project ENI, pekerjaan study dibuat sebagai **site terpisah per modul** dengan akhiran nama, misalnya `/R-S01D` dan `/R-S01D-STUDY`, `/L-P03D-FEED-STUDY`. Di ZRF dipilih cara lain: satu DB Study per disiplin (`/x-STS`). Keduanya praktik project, bukan aturan E3D. | [TES] dilihat langsung di project ENI |

## 6. Import / Export Config (Excel)

| # | Fakta | Sumber |
|---|---|---|
| 6.1 | Import/Export Config ada di modul Admin. Data yang dipindahkan termasuk Teams, Users, dan Databases. | [DOC] [Import and Export Utilities](https://help.aveva.com/AVEVA_Everything3D/1.1/AUGA/AUG13.13.1.html) |
| 6.2 | Ada **Rollback** untuk membatalkan semua perubahan dari import terakhir. Laporan import menyebut fitur ini ada di menu Utilities. | [DOC] [Roll Back Elements](https://help.aveva.com/AVEVA_Everything3D/1.1/AUGA/AUG13.13.4.html) · [TES] |
| 6.3 | Baris pertama setiap sheet adalah baris komentar berisi deskripsi kolom. Dokumentasi tidak menjelaskan arti tiap kolom di sheet Databases. | [DOC] [Spreadsheet Data Format](https://help.aveva.com/AVEVA_Everything3D/1.1/AUGA/AUG13.13.5.html) |
| 6.4 | Header sheet Databases dari template export: `#Keyword, Owning Team, Name, Description, Type, Claim Mode, Number, WithType, WithName, Product, AreaCode`. | [TES] template_ImportConfig.xlsx |
| 6.5 | Import item yang **sudah ada** hanya menghasilkan warning `(41,12) Name *ZRFADM already used`. Item itu dilewati dan **tidak di-update** (deskripsinya tetap), sementara item baru tetap dibuat. | [TES] 2026-10-19 |
| 6.6 | File import harus berformat sama dengan hasil export (sel teks bertipe `t="str"`). File dengan sel inline-string ditolak dengan "Invalid keyword" di setiap baris. | [TES] 2026-10-19 |
| 6.7 | Mengisi `WithType=SITE` dan `WithName=/nama` **tidak membuat site**. | [TES] 2026-10-20 |
| 6.8 | Saat import, Admin membaca sheet berurutan: Teams, Foreign Includes, Extracts, Databases, Ref only DESI DBs, Working Extracts, Users, Active Directory, Active Directory Groups, DBSets, MDB <nama> (satu sheet per MDB), ACRs, ACR Groups, Scopes, Roles and Perops, Disciplines, Maturities. Setelah itu baru menambah Teams, lalu Databases. | [TES] 2026-10-19 (log import, bukti: `bukti-06-import-log-43-41.png`) |
| 6.9 | Kalau ada keyword yang tidak valid, log menampilkan `Error in sheet: Teams, row: 0. Invalid keyword.` per baris, lalu `Error: Importing aborted - errors in workbook.` Seluruh import dibatalkan. | [TES] 2026-10-19 (bukti: `bukti-06-import-invalid-keyword.png`) |
| 6.10 | Setelah import yang ada error-nya, muncul dialog **Admin Import Rollback**. Dialog ini menampilkan status per jenis elemen (Team, Databases, DBSets, MDBs, Scopes, Roles, Perops, ACRs, ACRGroups, Users, AuthenticatedUsers, AuthenticatedUsersGroup), misalnya "Import Succeeded. 5 TEAM were added" atau "Import Failed". Pilihannya **Continue**, **Rollback**, atau **Abort** (keluar dari import dan rollback semua). | [TES] 2026-10-19 (bukti: `bukti-06-import-rollback-dialog-*.png`) |
| 6.11 | Import DB yang namanya sudah ada memberi warning `(1,4) Database name already defined`. Untuk team yang sudah ada, warning-nya `(41,12) Name ... already used`. | [TES] 2026-10-19 (bukti: `bukti-06-import-rollback-dialog-2.png`) |

## 7. Error yang Teramati

| Pesan | Kapan | Status | Sumber |
|---|---|---|---|
| `(41,12) Name *X already used` | Import item yang sudah ada | Hanya warning; import tetap jalan | [TES] |
| `(41,227) SITE /x is not in the current element's list` | REORDER saat current element bukan owner site | Lihat §4 | [TES] |
| `(1,4) Database name already defined` | Import DB yang sudah ada | Warning; DB dilewati | [TES] |
| `(43,41) Unable to open DB team/db, MCD:6 The handle is invalid` | Membuat DB, **baik lewat Import maupun macro `CREATE DB`**, muncul acak | Penyebab belum diketahui. Membuat ulang DB satu per satu biasanya berhasil. Lebih jarang terjadi saat import tanpa WithType (1/22 vs 7/22) | [TES] 2026-10-19 (bukti: `bukti-07-macro-error-43-41.png`, `bukti-06-import-*.png`) |
| `(43,45) Unable to open DB team/db, dabacon error 536` | Muncul bersama (43,41) di import yang sama | Kode berbeda dari (43,41); penyebab belum diketahui | [TES] 2026-10-19 (bukti: `bukti-06-import-rollback-dialog-1.png`) |
| Daftar pesan error PDMS | — | Teks `#F is not in the current element's list` tercatat dengan nomor 41,231 (penomoran bisa berbeda antar-versi) | [PDMS Message list](https://www.scribd.com/document/595389920/241316PDMS-Message-list) (sumber pihak ketiga) |

## 8. Menerima Paket Project dari Site Lain

| # | Fakta | Sumber |
|---|---|---|
| 8.1 | File evars dan launcher kiriman berisi path dan server lisensi site asal (misalnya `Z:\BOS\...`), sehingga harus disesuaikan. | [TES] paket ZRF |
| 8.2 | Di file .bat Windows, `SET VAR = nilai` (dengan spasi di sekitar `=`) membuat variabel bernama `VAR ` dengan spasi di belakang, sehingga variabel yang dicari program tidak ter-set. | [SS64: SET](https://ss64.com/nt/set.html) · [TES] baris `AVEVA_LICENSE_SERVER_LIST = ...` di paket ZRF |
| 8.3 | Macro kiriman harus dibaca dulu sebelum dijalankan. Di kasus ZRF, `ZRF-CREATE-DBS.mac` hanya berisi include DB yang sudah tertanam di paket, jadi tidak perlu dijalankan. | [TES] |
| 8.4 | Folder project foreign yang DB-nya dirujuk harus ikut dikirim. Di ZRF, folder SMA (UDA_ALL, dan lain-lain) tidak ada di paket. | [TES] |

## 9. Belum Terverifikasi (jangan diajarkan sebagai fakta)

| Klaim | Status |
|---|---|
| Urutan site **antar-DB** di Model Explorer mengikuti urutan MDB | Belum terbukti. Di tes Piping, urutan MDB dan urutan pembuatan sama persis, jadi tidak bisa dibedakan |
| Arti kolom `WithType` / `WithName` di Import Config | Tidak didokumentasikan; tes dengan SITE gagal membuat site |
| `ADD db n` ke posisi yang melewati jumlah DB current (misalnya posisi 24 saat MDB baru berisi 0 DB) | Belum dites |
| Karakter selain huruf, angka, dan `-` dalam nama site (misalnya `=`, spasi) | Tidak didokumentasikan, belum dites |
| Penyebab error (43,41) | Belum diketahui |
| `NEW ZONE` setelah navigasi ke site | Dari sumber komunitas, belum dites di ZRF |
| Isian **Create SITE** di jendela Create Database (Admin GUI): apakah benar membuat site, dengan nama apa, dan di mana posisinya | Ada di dokumentasi (871720), belum dites di ZRF. Catatan: tes Import Config dengan WithType=SITE tidak membuat site (6.7) |

## 10. Changelog

| Tanggal | Nomor fakta | Perubahan |
|---|---|---|
| 2026-10-21 | §1–§9 (1.1–1.9, §2, 3.1–3.6, 4.1–4.5, 5.1–5.4, 6.1–6.7, §7, 8.1–8.4) | Dokumen dibuat. Semua isi berasal dari tes 2026-10-19/20 dan dokumentasi AVEVA |
| 2026-10-21 | 5.5, 6.8–6.11; §7 baris (1,4) dan (43,45); 3.4, 4.5, 5.4 diperjelas | Ditambahkan dari screenshot tes. Kode (43,45)/dabacon 536 dipisah dari (43,41). Rujukan file bukti visual ditambahkan |
| 2026-10-21 | 1.10–1.14, 3.7, 3.8 (baru); 1.7 diperbarui; §2 ADD/CURRENT [DIKOREKSI]; §2 catatan CREATE DB [DIPERJELAS]; §9 baris baru (Create SITE) | Usulan chat belajar, dicek ulang ke Admin 2.1 (871304, 871319, 871321, 871679, 871682, 871711, 871720, 871727) dan DMRM 3.1. Rentang ADD/CURRENT 1–5000 (Admin 2.1), bukan 1–1000 (ACRM 1.1); maksimal 1000 DB current. Jendela Create Database punya isian "Create SITE" untuk DB Design |
