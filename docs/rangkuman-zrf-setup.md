# Rangkuman Setup ZRF (ZR FLNG) — AVEVA E3D

Snapshot: **2026-10-21** (rev: HULL-BODY, Dummy, urutan grup). Ini satu-satunya dokumen rangkuman: berisi semua keputusan, temuan, dan status setup project ZRF dari paket Coral/ENI yang dikirim Paris. Menggantikan versi 2026-10-16 dan `kesimpulan-zrf-2026-10-20.md`.

## 1. Project & Keputusan Dasar

| Item | Nilai |
|---|---|
| Project Jakarta | ZR FLNG (kode ZRF) |
| Sumber | ENI Coral (PDMS 12), dikonversi Paris |
| Skenario | Paris membuat project ZRF langsung (skenario 2, tanpa Replicate) |
| E3D / Administration | 3.1.8.1 / 2.1.0.1 |
| DB kerja | Jakarta membuat DB sendiri; FEED ENI dan catalog = referensi (include) |
| Access / Claim | MULTIWRITE, CLAIM IMPLICIT |
| Metode pembuatan | **Hanya macro command (Route B)**. Route Import Config dihapus (2026-10-20) |
| Lingkup sekarang | **Equipment, Piping, Safety, Structure**. Disiplin lain menyusul |
| Status | Equipment, Piping, Safety, Structure sudah dibuat. Struktur final (rev 2026-10-21) ada di `ZRF-SETUP-PACKAGE.zip` dan register |

## 2. Isi Paket & Foreign Projects

| Project | Kode | Isi | Status folder di paket |
|---|---|---|---|
| ZRF | ZRF | SYSTEM DB (zrfcom/mis/sys) | Ada |
| ACP | ACP | 10 DB catalog (steel/HVAC/cable) | Ada (via Projects/AvevaCatalogue) |
| FANO | FAN | 1 DB (SP-MASTER-PIPE) | Ada |
| SMA | SMA | UDA_ALL, WEI_ALL, CATA_PIP_GEOMETRY | **Tidak ada**, minta ke Paris |
| ENI | ENI | 2 spec/weight + 109 DB design FEED | Ada |

## 3. Perbaikan Paket Sebelum Dipakai

| File / Hal | Tindakan |
|---|---|
| evars admin & design | Ganti path `Z:\BOS\...\ZRF-E3D3\...` ke path Jakarta (atau map drive Z dengan struktur identik) |
| Baris lisensi | `AVEVA_LICENSE_SERVER_LIST = ...` ada spasi di sekitar `=`, jadi variabel tidak ter-set. Tulis ulang tanpa spasi, pakai server Jakarta |
| launch admin | Sesuaikan `AVEVA_DESIGN_INSTALLED_DIR` dan path `call evars` |
| ZRF-CREATE-DBS.mac (kiriman Paris) | Jangan dijalankan: isinya hanya include DB yang sudah tertanam di paket |

## 4. Desain Database & Site

| Aspek | Nilai |
|---|---|
| Disiplin (10) | R Equipment · L Piping · M Handling · S Safety · E Electrical · A Architecture · H HVAC · I Instrumentation · T Telecom · N Structure |
| Module (22) | lihat §5 (termasuk HB Hull Body, rev 2026-10-21) |
| Function | D = Installed, F = Future, S = Study, **X = Dummy Model** (tambahan project, rev 2026-10-21) |
| Nama DB | `TEAM/DESI-<Disc>-<Code><Func>`, contoh `ZRFPIP/DESI-L-Q1D` |
| Site | `/<Disc>-<Code><Func>`, contoh `/L-Q1D`, `/L-FUF`, `/L-STS`, `/L-DUX` |
| Deskripsi | `DB for <Disiplin> - <Module>`; dummy: `DB for <Disiplin> - Dummy Model` |
| Per disiplin | 22 Installed + Future + Study + Dummy = **25 DB / 25 site** |
| Total (10 disiplin) | 250 DB |
| Bentrok nama/nomor | 0 (dicek terhadap ENI/SMA/FAN/ACP, termasuk nama site) |

### Penomoran DB (Opsi C, rev 2026-10-21)

`DB No = 10000 + (urutan disiplin × 100) + slot`. Slot mengikuti urutan site setelah di-grouping, dengan jatah 10 nomor per grup supaya modul baru bisa disisipkan tanpa merusak urutan.

| Grup | Slot | Contoh Equipment (urutan disiplin 1) |
|---|---|---|
| MODULES | 01–10 | M1–M6 → 10101–10106 |
| PIPE-RACK | 11–20 | Q1–Q5, R1, R2 → 10111–10117 |
| HULL-DECK | 21–30 | HC, HO, HF, HL → 10121–10124 |
| HULL-BODY | 31–40 | HB → 10131 |
| HOOK-UP | 41–50 | HK → 10141 |
| OTHERS | 51–60 | FD, TR, LV → 10151–10153 |
| Future / Study | 61 / 62 | 10161 / 10162 |
| DUMMY | 71 | DUX → 10171 |

Urutan disiplin: R=1, L=2, M=3, S=4, E=5, A=6, H=7, I=8, T=9, N=11.

## 5. Module Code (22) & urutan grup

| Grup | Module | Code |
|---|---|---|
| MODULES | M1 Liquefaction 1 · M2 CO2 Removal · M3 Dehyd/Hg/NGL · M4 Fuel Gas & BOG · M5 Inlet/AGRU/HotWater · M6 Laydown Area | M1–M6 |
| PIPE-RACK | PR-M1 … PR-M5 · PR1 · PR2 | Q1–Q5 · R1 · R2 |
| HULL-DECK | Crane Laydown · Crane Offloading · Flare · LNG Offloading | HC · HO · HF · HL |
| HULL-BODY | Hull Body: area baru di dalam lambung; semua disiplin memodelkan, 1 DB per disiplin (pola ENI `DESI-x-HUD`) | HB (HU bentrok dengan site ENI) |
| HOOK-UP | Hook Up (belum ada di dokumen resmi) | HK |
| OTHERS | Fore Laydown · Turret · Living Quarters | FD · TR · LV |
| FUTURE-STUDY | Future · Study | FU (site …FUF) · ST (site …STS) |
| DUMMY | Dummy Model, **1 DB per disiplin** seperti Future/Study (dimiliki team disiplin itu). Zone per jenis: `-STRU`, `-EQUI`, `-VOL`, `-ROUTE`, `-TIE` | DU (site …DUX) |

Urutan grup di Model Explorer (rev 2026-10-21): MODULES → PIPE-RACK → HULL-DECK → HULL-BODY → HOOK-UP → OTHERS → FUTURE-STUDY → DUMMY.

Perubahan kode: Living Quarters **LQ → LV** untuk menghindari bentrok dengan site ENI /R-LQD dan /L-LQD. Turret tetap memakai skema ZRF (/N-TRD); skema dokumen /N-TASD tidak dipakai. Daftar module masih HOLD dan perlu disempurnakan setelah process block diagram.

## 6. Team, User & Access

| Disiplin | Code | Team | Status |
|---|---|---|---|
| Equipment | R | ZRFEQP | Ada |
| Piping | L | ZRFPIP | Ada |
| Handling | M | ZRFHDL | Dibuat oleh 00-TEAMS |
| Safety | S | ZRFSFT | Dibuat oleh 00-TEAMS |
| Electrical | E | ZRFELE | Ada |
| Architecture | A | ZRFARC | Dibuat oleh 00-TEAMS |
| HVAC | H | ZRFHVA | Dibuat oleh 00-TEAMS |
| Instrumentation | I | ZRFINS | Ada |
| Telecom | T | ZRFTEL | Dibuat oleh 00-TEAMS |
| Structure | N | ZRFSTR | Ada |
| Admin | — | ZRFADM | Ada, tidak memiliki DB |

- **Free user:** TSETIANTO (Admin), AANTARIKSA, PKUSUMA, SYSTEM.
- **General user:** SMRENDRA, NMHIZQIL (anggota ZRFEQP dan ZRFPIP).
- **User Paris** (PIP, ELE, INS, STR) sudah dikeluarkan dari team ZRF (keputusan 2026-10-19).
- **Akses:** DB hanya bisa **diedit** oleh team pemiliknya; disiplin lain hanya bisa **melihat**. Aturan ini juga berlaku untuk DB Study (keputusan opsi a). Free user bisa mengedit semua DB.

## 7. MDB

| Item | Nilai |
|---|---|
| MDB | Satu: **MDB-ZRF** |
| Isi (posisi) | 250 DB ZRF (1–250, per disiplin 25: Equipment 1–25, Piping 26–50, …) → catalog/spec (251–) → FEED ENI (sampai 372) |
| Total current | 372 (3 DB SMA di-comment sampai foldernya diterima); di bawah batas 1000 DB current |
| Urutan ZRF | Per disiplin R, L, M, S, E, A, H, I, T, N; di dalamnya mengikuti site order (§4) |

Batas (Admin 2.1, dicek 2026-10-21): maksimal 5000 DB per MDB, dan **maksimal 1000 DB current** pada saat yang sama. Posisi `ADD`/`CURRENT` berkisar 1–5000; ACRM E3D 1.1 yang lama menyebut 1–1000. 352 DB current masih aman. (Batas 300 yang pernah disebut berasal dari Command Reference PDMS 12 lama dan sudah dikoreksi.)

## 8. Zone (doc 3.9)

| Disiplin | Zone | Kegunaan |
|---|---|---|
| Equipment (R) | `-EQUI` | Itemized process equipment |
| | `-NIEQP` | Non-itemized process equipment (EQP/STA/LAD/PLF) |
| Piping (L) | `-PIPE-<FluidCode>` | Satu zone per fluid code (107 kode), dibuat di awal |
| | `-PIPE-VT` | Vessel trim (pengganti `-PIPE-TRIM`; hanya untuk Pipe) |
| Safety (S) | `-EQUI` · `-NIEQP-TRAN` · `-NIEQP-LONG` | Itemized safety · non-itemized transversal · non-itemized longitudinal |
| Handling (M) | `-EQUI` · `-NIEQP-TRAN` · `-NIEQP-LONG` | Sama dengan Safety |
| Architecture (A) | `-WALL` | Dinding |
| HVAC (H) | `-EQUI` · `-NIEQP` · `-DUCT` | Equipment · non-itemized · ducting |
| Structure (N), E, I, T | — | **Belum ditentukan**: penamaan tidak ada di doc 3.9 |
| Semua disiplin (Dummy, site `…DUX`) | `-STRU` · `-EQUI` · `-VOL` · `-ROUTE` · `-TIE` | Dummy structure · placeholder equipment · space reservation (akses, maintenance, escape route, keep-out) · routing envelope · interface/tie-in sementara. Harus dikecualikan dari deliverable resmi |

Total untuk 10 disiplin: 2.906 zone (termasuk HB dan 5 zone Dummy per disiplin). Perbaikan fluid code: `Bl` → `BI`, `Cl` → `CI`; FD dan FS dibiarkan meski deskripsinya sama.

## 9. Separator Site

- **Relasi DB–Site (dicek 2026-10-21 terhadap register):** setiap DB berisi tepat **1 site non-separator** (250 DB = 250 site), jadi deskripsi site sama dengan deskripsi DB-nya. Separator ikut tinggal di DB pertama grupnya: 80 DB menampung separator, maksimal 2 per DB (separator disiplin + grup di DB `…M1D`). Jadi "1 DB = 1 site" berlaku untuk site kerja, tidak untuk separator. Deskripsi baru tercatat di register; atribut DESC site di E3D belum diisi oleh macro B2.

- Dibuat di DB pertama tiap grup, **sebelum** site modulnya: `/----EQUIPMENT----` (disiplin) dan `/R----MODULES----`, `/R----PIPE-RACK----`, dan seterusnya (grup). Totalnya 9 per disiplin (1 disiplin + 8 grup).
- Hierarki E3D adalah WORLD > SITE > ZONE, dan Model Explorer tidak punya fitur grouping (hanya filter; pengelompokan lewat Collections). Jadi separator berupa site hanyalah akal-akalan, mengikuti pola project ENI.
- **Sedang ditinjau:** tampilannya dinilai kurang rapi. Opsi yang sedang dipertimbangkan:

| Opsi | Bentuk |
|---|---|
| **A (rekomendasi)** | Hanya separator disiplin: 1 per disiplin, bukan 7 |
| B | Gaya nama lain (`/=== X ===`, `/R-00-X`); karakter wajib dites dulu |
| C | MDB per disiplin |
| D | Tanpa separator |

## 10. Paket Setup (Route B)

`ZRF-SETUP-PACKAGE.zip`, total 34 file (rev 2026-10-21).

| Step | File | Modul | Isi |
|---|---|---|---|
| P | — | Admin | Hapus DB ZRF lama, pastikan MDB-ZRF kosong, tidak ada file DB lama tertinggal di folder project, tidak ada user lain yang login |
| 0 | `00-TEAMS/ZRF-00-TEAMS-ADMIN.mac` | Admin | Membuat 5 team baru |
| B1 | `xx-<D>-<TEAM>/ZRF-xx-<D>-B1-CREATE-DB-MDB-ADMIN.mac` | Admin | `CREATE DB` ×25 dan `ADD db n` ke posisi akhirnya |
| — | — | — | Masuk ulang ke Design |
| B2 | `ZRF-xx-<D>-B2-SITES-DESIGN.mac` | Design | Separator dan site berurutan, `DB` ditulis sekali per DB |
| B3 | `ZRF-xx-<D>-B3-ZONES-DESIGN.mac` | Design | Zone (R, L, M, S, A, H) |
| 90 | `90-REFERENCE/ZRF-90-REF-MDB-ADMIN.mac` | Admin | Catalog dan FEED ENI (posisi 251–372) |
| 99 | `99-FIXUP/ZRF-99-MDB-REORDER-ADMIN.mac` | Admin | `CURRENT` 1–372, hanya kalau urutan MDB salah |

Disiplin dikerjakan berurutan dari 01 sampai 10, karena posisi MDB bersifat absolut.

Pola B2 (sudah dites di Piping):

```
NEW SITE /----PIPING---- DB ZRFPIP/DESI-L-M1D
NEW SITE /L----MODULES----
NEW SITE /L-M1D
NEW SITE /L-M2D DB ZRFPIP/DESI-L-M2D
```

## 11. Sintaks Command

| Tujuan | Sintaks | Sumber |
|---|---|---|
| Team | `CREATE TEAM teamid DESC 'text'` | AVEVA (CREATE) |
| User | `CREATE USER userid/passwd FREE` / `GENERAL` | AVEVA (CREATE) |
| DB | `CREATE DB team/db DESI ACCESS MULTIWRITE CLAIM IMPLICIT DBNO n DESC 'text'` | AVEVA (CREATE) |
| MDB | `CREATE MDB /name` · `SET MDB /name` | AVEVA |
| DB ke MDB | `ADD team/db n` (current di posisi n) · `ADD team/db` (deferred) | AVEVA (ADD) |
| Pindah posisi | `CURRENT team/db n` · `DEFER team/db` | AVEVA (CURRENT, DEFER) |
| Anggota team | `SET TEAM x` lalu `TADD` / `TREM userid` | AVEVA |
| Site | `NEW SITE /name DB team/db` | Komunitas, **sudah dites**. Alternatif GUI: isian "Create SITE" di jendela Create Database (Admin 2.1, 871720), belum dites |
| Zone | `/SITE` lalu `NEW ZONE /name` | Komunitas |
| Reorder | `REORDER /a AFTER /b` (dari WORLD `/*`) | AVEVA DBRM; batasan sama DB = temuan lapangan |

Aturan nomor: DB No yang boleh dipakai 1–7000 dan 10000–250000 (7001–9999 dan 250001–255000 dicadangkan AVEVA), unik per MDB. File No 1–8192. Nama elemen wajib diawali `/`, disarankan huruf besar.

## 12. Temuan Lapangan

Semua fakta yang sudah terbukti (dari dokumentasi AVEVA dan tes langsung) dikumpulkan terpisah di **`e3d-admin/fakta-terverifikasi-e3d-admin.md`**, sebagai bahan materi belajar.

## 13. Koreksi & Pelajaran

- Batas MDB "300" berasal dari dokumen PDMS lama; yang benar 5000.
- Macro `REORDER` antar-DB dan asumsi bahwa `WithType`/`WithName` membuat site sempat dibuat tanpa dasar yang jelas; keduanya sudah dibuang.
- Jumlah DB yang perlu dibuat ulang karena renumber sempat dihitung 34; yang benar 30 (lalu diganti keputusan mulai dari nol).
- **Pelajaran:** command yang hanya bersumber dari komunitas, atau yang ditebak dari nama kolom, harus ditandai **"perlu diuji"** dan dites dulu sebelum dipakai.

## 14. Masih Terbuka

| Item | Status |
|---|---|
| Gaya separator | Menunggu pilihan opsi A/B/C/D (§9) |
| Urutan site antar-DB di Design | Belum terbukti apakah mengikuti urutan MDB |
| Error (43,41) | Tanyakan ke Alex / AVEVA support (Save Support Info) |
| Folder SMA | Minta ke Paris |
| Zone Structure (N), E, I, T | Menunggu aturan penamaan |
| Daftar module & kode HK, Study (S) | HOLD / perlu persetujuan lead |
| Password SYSTEM & foreign | Minta lewat kanal terpisah |
| Catalog referensi FEED | Konfirmasi apakah semua catalog ENI perlu di-include |
| Email ke user E3D (info site & zone) | Draf siap; cocokkan dulu dengan kondisi di Design |
| Balasan ke Alex | Draf siap, kirim sebagai reply di thread terakhirnya; cek Sent Items apakah info akses SharePoint (via Chahram) sudah pernah dikirim |

## 15. Kontak

| Nama | Peran |
|---|---|
| Alex | Paris SYS Eng, konversi Coral → E3D; ramah. Emailnya belum dibalas |
| Jamal Eddine Souhail | Yang memperkenalkan Alex; perfeksionis, jadi email ke dia harus presisi |
| Chahram | Memberi akses SharePoint untuk download paket |

## 16. Deliverable

| File | Isi |
|---|---|
| `ZRF-E3D-Register.xlsx` | Setup Steps, Package Files, Teams & Users, ZRF DB Register, Site Order (dengan Site Description dan DB No), Zones, Fluid Codes, Naming Rules, Access, Notes |
| `ZRF-SETUP-PACKAGE.zip` | Macro Route B (§10) |
| `ZRF-Site-Order-Equipment.xlsx` | Site order Equipment dengan DB No |

## Sumber

- AVEVA ACRM: [ADD](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.008.html) · [CREATE](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.023.html) · [CURRENT](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.024.html) · [DEFER](https://help.aveva.com/AVEVA_Everything3D/1.1/ACRM/ACRM8.08.027.html)
- AVEVA Administration: [CREATE](https://docs.aveva.com/bundle/administration/page/871319.html) · [ADD](https://docs.aveva.com/bundle/administration/page/871304.html) · [Create MDBs](https://docs.aveva.com/bundle/administration/page/871727.html) · [Database Access](https://docs.aveva.com/bundle/administration/page/871680.html)
- AVEVA DBRM: [REORDER](https://help.aveva.com/AVEVA_Everything3D/2.1/DBRM/DBRM4.05.5.html) · [Element names](https://help.aveva.com/AVEVA_Everything3D/2.1/DBRM/DBRM1.02.07.html)
- Model Explorer: [Getting Started](https://help.aveva.com/AVEVA_Everything3D/2.1/GS/GS7.7.4.html) · [Filters](https://help.aveva.com/AVEVA_Everything3D/1.1/DCFUG/DCFUG08.09.03.html)
- Import/Export: [Spreadsheet Data Format](https://help.aveva.com/AVEVA_Everything3D/1.1/AUGA/AUG13.13.5.html)
- [PDMS Message list (Scribd)](https://www.scribd.com/document/595389920/241316PDMS-Message-list): pesan "not in the current element's list" tercatat dengan nomor 41,231
