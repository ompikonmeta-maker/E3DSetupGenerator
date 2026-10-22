# Contoh Register ZRF (ZRF-E3D-Register.xlsx) — versi teks

Diperbarui: 2026-10-21 (rev: HULL-BODY, Dummy per disiplin, urutan grup baru). Isi workbook register project ZRF dalam bentuk tabel markdown, sebagai **contoh nyata** dokumen perencanaan admin E3D (Team, DB, Site, Zone, Access).

**Catatan untuk pembaca/chat lain:**
- Sheet ditampilkan lengkap, **kecuali** Zones (diringkas menjadi pola per disiplin) dan ZRF DB Register serta Site Order (ditampilkan untuk Piping saja, karena pola semua disiplin sama).
- Lingkup yang sedang dibuat di project: Equipment, Piping, Safety, Structure. Disiplin lain dibuat belakangan.
- Fakta yang sudah terbukti ada di `e3d-admin/fakta-terverifikasi-e3d-admin.md`.

## Sheet: Setup Steps

ZRF - SETUP FROM ZERO - command macros (package ZRF-SETUP-PACKAGE.zip)

Command macros only (Import Config route dropped 2026-10-20). Disciplines in order 01 -> 10, then 90.

| Step | What | File (in ZRF-SETUP-PACKAGE.zip) | Module | Check |
|---|---|---|---|---|
| P | Preparation | Delete all old ZRF DBs  •  MDB-ZRF empty  •  no old ZRF DB files in project folder  •  nobody logged in | Admin | Admin > Databases list |
| 0 | Teams (5 new) | 00-TEAMS/ZRF-00-TEAMS-ADMIN.mac | Admin | 10 ZRF teams + ZRFADM |
| B1 | 25 DBs + add to MDB-ZRF (final positions) | xx-<D>-<TEAM>/ZRF-xx-<D>-B1-CREATE-DB-MDB-ADMIN.mac | Admin | Q DBNO = sheet ZRF DB Register; MDB list = sheet Site Order |
| B2 | 9 separators + 25 sites, display order | ZRF-xx-<D>-B2-SITES-DESIGN.mac | Design | Explorer = sheet Site Order |
| B3 | Zones (doc 3.9) | ZRF-xx-<D>-B3-ZONES-DESIGN.mac (R L M S A H only) | Design | sheet Zones |
|  | Repeat B1-B3 per discipline | 01 R > 02 L > 03 M > 04 S > 05 E > 06 A > 07 H > 08 I > 09 T > 10 N | — | — |
| 90 | Reference DBs (catalogue + ENI FEED) | 90-REFERENCE/ZRF-90-REF-MDB-ADMIN.mac (pos 251-372) | Admin | MDB-ZRF total 372 |
| 99 | Fix-up (only if MDB order wrong) | 99-FIXUP/ZRF-99-MDB-REORDER-ADMIN.mac | Admin | — |

Notes

•  Re-enter DESIGN after each Admin step, so new DBs / MDB changes are read.

•  MDB positions are absolute (Equipment 1-25, Piping 26-50, Handling 51-75, ...): run disciplines in order. Wrong order -> run 99-FIXUP.

•  Import Config route dropped (2026-10-20). Test: Import with WithType=SITE / WithName=/site did NOT create the site; meaning of the columns not documented (help.aveva.com AUGA 13.13.x).

•  B2 pattern (tested omPik, Piping): DB written once per DB on its first site; next lines without DB go to the same DB.

•  Order: DB list follows DB No; MDB follows ADD position (right-most number in B1).

•  REORDER not used. Field finding: REORDER only between sites in the SAME DB; needs WORLD as current element (/*), else error (41,227).

•  Site order across DBs follows MDB order (to confirm after first discipline).

•  DB No rule (rev 2026-10-21): 10000 + disc order x100 + slot; MODULES 01-10, PIPE-RACK 11-20, HULL-DECK 21-30, HULL-BODY 31-40, HOOK-UP 41-50, OTHERS 51-60, Future 61, Study 62, Dummy 71 (function X).

•  Paris users (PIP, ELE, INS, STR) already removed from ZRF teams (decision 2026-10-19) - not in package.

•  E/I/T/N zones: naming not defined in doc 3.9 - no B3 file for these disciplines.

•  DB creation error (43,41) "Unable to open DB ... MCD:6 The handle is invalid" (and dabacon error 536) occurs RANDOMLY with BOTH Import Config and CREATE DB macro (tests 19-10-2026) -> environment issue, not file/syntax. Fewer errors without WithType SITE (7 -> 1 per 23 DBs). Single-DB import succeeded. Open with AVEVA support (Save Support Info).

Sources (AVEVA)

CREATE / ADD / CURRENT / DEFER - help.aveva.com/AVEVA_Everything3D/1.1/ACRM (8.08.023, 8.08.008, 8.08.024, 8.08.027)

REORDER - help.aveva.com/AVEVA_Everything3D/2.1/DBRM/DBRM4.05.5.html

Community (not AVEVA docs): NEW SITE ... DB team/db

## Sheet: Package Files

ZRF-SETUP-PACKAGE.zip - file list

| No | Folder | File | Module | Step | Content |
|---|---|---|---|---|---|
| 1 |  | 00-README.txt | — | — | Package order + preparation |
| 2 | 00-TEAMS | ZRF-00-TEAMS-ADMIN.mac | Admin | 0 | 5 new teams (+ commented block for existing teams/members) |
| 3 | 01-R-ZRFEQP | ZRF-01-R-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 1-25) |
| 4 | 01-R-ZRFEQP | ZRF-01-R-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 5 | 01-R-ZRFEQP | ZRF-01-R-B3-ZONES-DESIGN.mac | Design | B3 | 53 zones |
| 6 | 02-L-ZRFPIP | ZRF-02-L-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 26-50) |
| 7 | 02-L-ZRFPIP | ZRF-02-L-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 8 | 02-L-ZRFPIP | ZRF-02-L-B3-ZONES-DESIGN.mac | Design | B3 | 2573 zones |
| 9 | 03-M-ZRFHDL | ZRF-03-M-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 51-75) |
| 10 | 03-M-ZRFHDL | ZRF-03-M-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 11 | 03-M-ZRFHDL | ZRF-03-M-B3-ZONES-DESIGN.mac | Design | B3 | 77 zones |
| 12 | 04-S-ZRFSFT | ZRF-04-S-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 76-100) |
| 13 | 04-S-ZRFSFT | ZRF-04-S-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 14 | 04-S-ZRFSFT | ZRF-04-S-B3-ZONES-DESIGN.mac | Design | B3 | 77 zones |
| 15 | 05-E-ZRFELE | ZRF-05-E-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 101-125) |
| 16 | 05-E-ZRFELE | ZRF-05-E-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 17 | 05-E-ZRFELE | ZRF-05-E-B3-ZONES-DESIGN.mac | Design | B3 | 5 zones |
| 18 | 06-A-ZRFARC | ZRF-06-A-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 126-150) |
| 19 | 06-A-ZRFARC | ZRF-06-A-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 20 | 06-A-ZRFARC | ZRF-06-A-B3-ZONES-DESIGN.mac | Design | B3 | 29 zones |
| 21 | 07-H-ZRFHVA | ZRF-07-H-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 151-175) |
| 22 | 07-H-ZRFHVA | ZRF-07-H-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 23 | 07-H-ZRFHVA | ZRF-07-H-B3-ZONES-DESIGN.mac | Design | B3 | 77 zones |
| 24 | 08-I-ZRFINS | ZRF-08-I-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 176-200) |
| 25 | 08-I-ZRFINS | ZRF-08-I-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 26 | 08-I-ZRFINS | ZRF-08-I-B3-ZONES-DESIGN.mac | Design | B3 | 5 zones |
| 27 | 09-T-ZRFTEL | ZRF-09-T-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 201-225) |
| 28 | 09-T-ZRFTEL | ZRF-09-T-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 29 | 09-T-ZRFTEL | ZRF-09-T-B3-ZONES-DESIGN.mac | Design | B3 | 5 zones |
| 30 | 10-N-ZRFSTR | ZRF-10-N-B1-CREATE-DB-MDB-ADMIN.mac | Admin | B1 | CREATE 25 DBs + ADD to MDB-ZRF (pos 226-250) |
| 31 | 10-N-ZRFSTR | ZRF-10-N-B2-SITES-DESIGN.mac | Design | B2 | 9 separators + 25 sites (display order) |
| 32 | 10-N-ZRFSTR | ZRF-10-N-B3-ZONES-DESIGN.mac | Design | B3 | 5 zones |
| 33 | 90-REFERENCE | ZRF-90-REF-MDB-ADMIN.mac | Admin | 90 | catalogue/spec + ENI FEED, pos 251-372 |
| 34 | 99-FIXUP | ZRF-99-MDB-REORDER-ADMIN.mac | Admin | 99 | CURRENT 1-372 (only if needed) |

## Sheet: Teams & Users

ZRF - TEAMS & USERS

| Team | Disc | Discipline | Description | DBs | Status | Members |
|---|---|---|---|---|---|---|
| ZRFEQP | R | Equipment | TEAM FOR EQUIPMENT ZR FLNG | 25 | Created | SMRENDRA<br>NMHIZQIL |
| ZRFPIP | L | Piping | TEAM FOR PIPING ZR FLNG | 25 | Created | SMRENDRA<br>NMHIZQIL |
| ZRFHDL | M | Handling | TEAM FOR HANDLING ZR FLNG | 25 | To create | — |
| ZRFSFT | S | Safety | TEAM FOR SAFETY ZR FLNG | 25 | To create | — |
| ZRFELE | E | Electrical | TEAM FOR ELECTRICAL ZR FLNG | 25 | Created | — |
| ZRFARC | A | Architecture | TEAM FOR ARCHITECTURE ZR FLNG | 25 | To create | — |
| ZRFHVA | H | HVAC | TEAM FOR HVAC ZR FLNG | 25 | To create | — |
| ZRFINS | I | Instrumentation | TEAM FOR INSTRUMENT ZR FLNG | 25 | Created | — |
| ZRFTEL | T | Telecom | TEAM FOR TELECOM ZR FLNG | 25 | To create | — |
| ZRFSTR | N | Structure | TEAM FOR STRUCTURE ZR FLNG | 25 | Created | — |
| ZRFADM | — | Administration | TEAM FOR ADMINISTRATOR ZR FLNG | 0 | Created | TSETIANTO<br>AANTARIKSA<br>PKUSUMA<br>SYSTEM |
| FREE USERS - no team needed, can edit all ZRF DBs |  |  |  |  |  | TSETIANTO (Admin)<br>AANTARIKSA<br>PKUSUMA<br>SYSTEM |

Membership verified from Export Config (template_ImportConfig.xlsx). Paris users PIP, ELE, INS, STR removed from ZRF teams (decision 2026-10-19, done).

Status colours: green = Created, yellow = To create (00-TEAMS macro).

## Sheet: ZRF DB Register

(Hanya baris Piping.)

| No | Discipline | Disc Code | Team | Module/Item | Mod Code | Func | Function | DB Name | Description | DB No | File No | Type | Access | Claim | Site Name | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 26 | Piping | L | ZRFPIP | M1 - Liquefaction 1 | M1 | D | Installed | ZRFPIP/DESI-L-M1D | DB for Piping - M1 Liquefaction 1 | 10201 | System | DESI | MULTIWRITE | IMPLICIT | /L-M1D |  |
| 27 | Piping | L | ZRFPIP | M2 - CO2 Removal | M2 | D | Installed | ZRFPIP/DESI-L-M2D | DB for Piping - M2 CO2 Removal | 10202 | System | DESI | MULTIWRITE | IMPLICIT | /L-M2D |  |
| 28 | Piping | L | ZRFPIP | M3 - Dehyd/Hg/NGL | M3 | D | Installed | ZRFPIP/DESI-L-M3D | DB for Piping - M3 Dehyd/Hg/NGL | 10203 | System | DESI | MULTIWRITE | IMPLICIT | /L-M3D |  |
| 29 | Piping | L | ZRFPIP | M4 - Fuel Gas & BOG | M4 | D | Installed | ZRFPIP/DESI-L-M4D | DB for Piping - M4 Fuel Gas & BOG | 10204 | System | DESI | MULTIWRITE | IMPLICIT | /L-M4D |  |
| 30 | Piping | L | ZRFPIP | M5 - Inlet/AGRU/HotWater | M5 | D | Installed | ZRFPIP/DESI-L-M5D | DB for Piping - M5 Inlet/AGRU/HotWater | 10205 | System | DESI | MULTIWRITE | IMPLICIT | /L-M5D |  |
| 31 | Piping | L | ZRFPIP | M6 - Laydown Area | M6 | D | Installed | ZRFPIP/DESI-L-M6D | DB for Piping - M6 Laydown Area | 10206 | System | DESI | MULTIWRITE | IMPLICIT | /L-M6D |  |
| 32 | Piping | L | ZRFPIP | PR-M1 | Q1 | D | Installed | ZRFPIP/DESI-L-Q1D | DB for Piping - PR-M1 | 10211 | System | DESI | MULTIWRITE | IMPLICIT | /L-Q1D |  |
| 33 | Piping | L | ZRFPIP | PR-M2 | Q2 | D | Installed | ZRFPIP/DESI-L-Q2D | DB for Piping - PR-M2 | 10212 | System | DESI | MULTIWRITE | IMPLICIT | /L-Q2D |  |
| 34 | Piping | L | ZRFPIP | PR-M3 | Q3 | D | Installed | ZRFPIP/DESI-L-Q3D | DB for Piping - PR-M3 | 10213 | System | DESI | MULTIWRITE | IMPLICIT | /L-Q3D |  |
| 35 | Piping | L | ZRFPIP | PR-M4 | Q4 | D | Installed | ZRFPIP/DESI-L-Q4D | DB for Piping - PR-M4 | 10214 | System | DESI | MULTIWRITE | IMPLICIT | /L-Q4D |  |
| 36 | Piping | L | ZRFPIP | PR-M5 | Q5 | D | Installed | ZRFPIP/DESI-L-Q5D | DB for Piping - PR-M5 | 10215 | System | DESI | MULTIWRITE | IMPLICIT | /L-Q5D |  |
| 37 | Piping | L | ZRFPIP | PR1 | R1 | D | Installed | ZRFPIP/DESI-L-R1D | DB for Piping - PR1 | 10216 | System | DESI | MULTIWRITE | IMPLICIT | /L-R1D |  |
| 38 | Piping | L | ZRFPIP | PR2 | R2 | D | Installed | ZRFPIP/DESI-L-R2D | DB for Piping - PR2 | 10217 | System | DESI | MULTIWRITE | IMPLICIT | /L-R2D |  |
| 39 | Piping | L | ZRFPIP | Fore Laydown | FD | D | Installed | ZRFPIP/DESI-L-FDD | DB for Piping - Fore Laydown | 10251 | System | DESI | MULTIWRITE | IMPLICIT | /L-FDD |  |
| 40 | Piping | L | ZRFPIP | Turret | TR | D | Installed | ZRFPIP/DESI-L-TRD | DB for Piping - Turret | 10252 | System | DESI | MULTIWRITE | IMPLICIT | /L-TRD |  |
| 41 | Piping | L | ZRFPIP | Hull Deck - Crane Laydown | HC | D | Installed | ZRFPIP/DESI-L-HCD | DB for Piping - Hull Deck Crane Laydown | 10221 | System | DESI | MULTIWRITE | IMPLICIT | /L-HCD |  |
| 42 | Piping | L | ZRFPIP | Hull Deck - Crane Offloading | HO | D | Installed | ZRFPIP/DESI-L-HOD | DB for Piping - Hull Deck Crane Offloading | 10222 | System | DESI | MULTIWRITE | IMPLICIT | /L-HOD |  |
| 43 | Piping | L | ZRFPIP | Hull Deck - Flare | HF | D | Installed | ZRFPIP/DESI-L-HFD | DB for Piping - Hull Deck Flare | 10223 | System | DESI | MULTIWRITE | IMPLICIT | /L-HFD |  |
| 44 | Piping | L | ZRFPIP | Hull Deck - LNG Offloading | HL | D | Installed | ZRFPIP/DESI-L-HLD | DB for Piping - Hull Deck LNG Offloading | 10224 | System | DESI | MULTIWRITE | IMPLICIT | /L-HLD |  |
| 45 | Piping | L | ZRFPIP | Living Quarters | LV | D | Installed | ZRFPIP/DESI-L-LVD | DB for Piping - Living Quarters | 10253 | System | DESI | MULTIWRITE | IMPLICIT | /L-LVD |  |
| 46 | Piping | L | ZRFPIP | Hook Up | HK | D | Installed | ZRFPIP/DESI-L-HKD | DB for Piping - Hook Up | 10241 | System | DESI | MULTIWRITE | IMPLICIT | /L-HKD | Not yet in official doc |
| 47 | Piping | L | ZRFPIP | Hull Body | HB | D | Installed | ZRFPIP/DESI-L-HBD | DB for Piping - Hull Body | 10231 | System | DESI | MULTIWRITE | IMPLICIT | /L-HBD |  |
| 48 | Piping | L | ZRFPIP | Future | FU | F | Future | ZRFPIP/DESI-L-FUF | DB for Piping - Future | 10261 | System | DESI | MULTIWRITE | IMPLICIT | /L-FUF |  |
| 49 | Piping | L | ZRFPIP | Study | ST | S | Study | ZRFPIP/DESI-L-STS | DB for Piping - Study | 10262 | System | DESI | MULTIWRITE | IMPLICIT | /L-STS |  |
| 50 | Piping | L | ZRFPIP | Dummy Model | DU | X | Dummy | ZRFPIP/DESI-L-DUX | DB for Piping - Dummy Model | 10271 | System | DESI | MULTIWRITE | IMPLICIT | /L-DUX |  |

## Sheet: Site Order

(Hanya baris Piping.)

| Order | Discipline | Type | Site Name | Site Description | Created in DB | DB No | Group |
|---|---|---|---|---|---|---|---|
| 35 | Piping | Separator - discipline | /----PIPING---- |  | ZRFPIP/DESI-L-M1D | 10201 |  |
| 36 | Piping | Separator - group | /L----MODULES---- |  | ZRFPIP/DESI-L-M1D | 10201 | MODULES |
| 37 | Piping | Site | /L-M1D | DB for Piping - M1 Liquefaction 1 | ZRFPIP/DESI-L-M1D | 10201 | MODULES |
| 38 | Piping | Site | /L-M2D | DB for Piping - M2 CO2 Removal | ZRFPIP/DESI-L-M2D | 10202 | MODULES |
| 39 | Piping | Site | /L-M3D | DB for Piping - M3 Dehyd/Hg/NGL | ZRFPIP/DESI-L-M3D | 10203 | MODULES |
| 40 | Piping | Site | /L-M4D | DB for Piping - M4 Fuel Gas & BOG | ZRFPIP/DESI-L-M4D | 10204 | MODULES |
| 41 | Piping | Site | /L-M5D | DB for Piping - M5 Inlet/AGRU/HotWater | ZRFPIP/DESI-L-M5D | 10205 | MODULES |
| 42 | Piping | Site | /L-M6D | DB for Piping - M6 Laydown Area | ZRFPIP/DESI-L-M6D | 10206 | MODULES |
| 43 | Piping | Separator - group | /L----PIPE-RACK---- |  | ZRFPIP/DESI-L-Q1D | 10211 | PIPE-RACK |
| 44 | Piping | Site | /L-Q1D | DB for Piping - PR-M1 | ZRFPIP/DESI-L-Q1D | 10211 | PIPE-RACK |
| 45 | Piping | Site | /L-Q2D | DB for Piping - PR-M2 | ZRFPIP/DESI-L-Q2D | 10212 | PIPE-RACK |
| 46 | Piping | Site | /L-Q3D | DB for Piping - PR-M3 | ZRFPIP/DESI-L-Q3D | 10213 | PIPE-RACK |
| 47 | Piping | Site | /L-Q4D | DB for Piping - PR-M4 | ZRFPIP/DESI-L-Q4D | 10214 | PIPE-RACK |
| 48 | Piping | Site | /L-Q5D | DB for Piping - PR-M5 | ZRFPIP/DESI-L-Q5D | 10215 | PIPE-RACK |
| 49 | Piping | Site | /L-R1D | DB for Piping - PR1 | ZRFPIP/DESI-L-R1D | 10216 | PIPE-RACK |
| 50 | Piping | Site | /L-R2D | DB for Piping - PR2 | ZRFPIP/DESI-L-R2D | 10217 | PIPE-RACK |
| 51 | Piping | Separator - group | /L----HULL-DECK---- |  | ZRFPIP/DESI-L-HCD | 10221 | HULL-DECK |
| 52 | Piping | Site | /L-HCD | DB for Piping - Hull Deck Crane Laydown | ZRFPIP/DESI-L-HCD | 10221 | HULL-DECK |
| 53 | Piping | Site | /L-HOD | DB for Piping - Hull Deck Crane Offloading | ZRFPIP/DESI-L-HOD | 10222 | HULL-DECK |
| 54 | Piping | Site | /L-HFD | DB for Piping - Hull Deck Flare | ZRFPIP/DESI-L-HFD | 10223 | HULL-DECK |
| 55 | Piping | Site | /L-HLD | DB for Piping - Hull Deck LNG Offloading | ZRFPIP/DESI-L-HLD | 10224 | HULL-DECK |
| 56 | Piping | Separator - group | /L----HULL-BODY---- |  | ZRFPIP/DESI-L-HBD | 10231 | HULL-BODY |
| 57 | Piping | Site | /L-HBD | DB for Piping - Hull Body | ZRFPIP/DESI-L-HBD | 10231 | HULL-BODY |
| 58 | Piping | Separator - group | /L----HOOK-UP---- |  | ZRFPIP/DESI-L-HKD | 10241 | HOOK-UP |
| 59 | Piping | Site | /L-HKD | DB for Piping - Hook Up | ZRFPIP/DESI-L-HKD | 10241 | HOOK-UP |
| 60 | Piping | Separator - group | /L----OTHERS---- |  | ZRFPIP/DESI-L-FDD | 10251 | OTHERS |
| 61 | Piping | Site | /L-FDD | DB for Piping - Fore Laydown | ZRFPIP/DESI-L-FDD | 10251 | OTHERS |
| 62 | Piping | Site | /L-TRD | DB for Piping - Turret | ZRFPIP/DESI-L-TRD | 10252 | OTHERS |
| 63 | Piping | Site | /L-LVD | DB for Piping - Living Quarters | ZRFPIP/DESI-L-LVD | 10253 | OTHERS |
| 64 | Piping | Separator - group | /L----FUTURE-STUDY---- |  | ZRFPIP/DESI-L-FUF | 10261 | FUTURE-STUDY |
| 65 | Piping | Site | /L-FUF | DB for Piping - Future | ZRFPIP/DESI-L-FUF | 10261 | FUTURE-STUDY |
| 66 | Piping | Site | /L-STS | DB for Piping - Study | ZRFPIP/DESI-L-STS | 10262 | FUTURE-STUDY |
| 67 | Piping | Separator - group | /L----DUMMY---- |  | ZRFPIP/DESI-L-DUX | 10271 | DUMMY |
| 68 | Piping | Site | /L-DUX | DB for Piping - Dummy Model | ZRFPIP/DESI-L-DUX | 10271 | DUMMY |

## Sheet: Fluid Codes

Fluid Codes - piping zone /<Site>-PIPE-<Code> (doc 3.9 B)

| No | Code | Fluid (as received, spaces trimmed) | Piping zone pattern | Check |
|---|---|---|---|---|
| 1 | AD | AMINE CLOSED DRAIN | /<Site>-PIPE-AD |  |
| 2 | AE | CITRIC ACID (FOR MEG) | /<Site>-PIPE-AE |  |
| 3 | AF | ANTI-FOAM | /<Site>-PIPE-AF |  |
| 4 | AL | LEAN AMINE | /<Site>-PIPE-AL |  |
| 5 | AR | RICH AMINE | /<Site>-PIPE-AR |  |
| 6 | BA | BALLAST WATER | /<Site>-PIPE-BA |  |
| 7 | BD | BLOWDOWN | /<Site>-PIPE-BD |  |
| 8 | BE | EMULSION BREAKER | /<Site>-PIPE-BE |  |
| 9 | BF | BOIL-OFF GAS | /<Site>-PIPE-BF |  |
| 10 | BI | BIOCIDE | /<Site>-PIPE-BI | Corrected from "Bl" (confirmed 2026-10-19) |
| 11 | CA | COMPRESSED AIR | /<Site>-PIPE-CA |  |
| 12 | CB | CRYOGENIC LIQUID BLOWDOWN | /<Site>-PIPE-CB |  |
| 13 | CD | CRYOGENIC CLOSED DRAIN | /<Site>-PIPE-CD |  |
| 14 | CF | HIGH EXPANSION FOAM | /<Site>-PIPE-CF |  |
| 15 | CG | COAGULANT | /<Site>-PIPE-CG |  |
| 16 | CI | CORROSION INHIBITOR | /<Site>-PIPE-CI | Corrected from "Cl" (confirmed 2026-10-19) |
| 17 | CL | CRUDE OILWASHING | /<Site>-PIPE-CL |  |
| 18 | CN | CRYOGENIC OPEN DRAIN | /<Site>-PIPE-CN |  |
| 19 | CR | COLD MR | /<Site>-PIPE-CR |  |
| 20 | CS | CAUSTIC SODA | /<Site>-PIPE-CS |  |
| 21 | CX | CARBON DIOXYDE | /<Site>-PIPE-CX |  |
| 22 | CZ | COOUNG WATER SUPPLY | /<Site>-PIPE-CZ |  |
| 23 | DC | CLOSED DRAIN | /<Site>-PIPE-DC |  |
| 24 | DG | DEFROST GAS | /<Site>-PIPE-DG |  |
| 25 | DH | OPEN DRAIN | /<Site>-PIPE-DH |  |
| 26 | DO | DIESEL OIL | /<Site>-PIPE-DO |  |
| 27 | DP | DRY POWDER | /<Site>-PIPE-DP |  |
| 28 | DT | DIESEL TREATED | /<Site>-PIPE-DT |  |
| 29 | DU | DIESEL UNTREATED | /<Site>-PIPE-DU |  |
| 30 | DW | DRINKINGWATER | /<Site>-PIPE-DW |  |
| 31 | EV | EMERGENCY CARGO VENT | /<Site>-PIPE-EV |  |
| 32 | EW | SEA WATER RETURN | /<Site>-PIPE-EW |  |
| 33 | FA | FORMIC ACID | /<Site>-PIPE-FA |  |
| 34 | FC | COLD AND DRY HP FLARE | /<Site>-PIPE-FC |  |
| 35 | FD | COLD AND DRY LP FLARE | /<Site>-PIPE-FD | Same description as FS - kept as is (confirmed) |
| 36 | FG | FUEL GAS | /<Site>-PIPE-FG |  |
| 37 | FH | WARM AND WET HP FLARE | /<Site>-PIPE-FH |  |
| 38 | FJ | WARM AND WET LP FLARE | /<Site>-PIPE-FJ |  |
| 39 | FL | FOAMING LIQUID | /<Site>-PIPE-FL |  |
| 40 | FS | COLD AND DRY LP FLARE | /<Site>-PIPE-FS | Same description as FD - kept as is (confirmed) |
| 41 | FW | FIREWATER | /<Site>-PIPE-FW |  |
| 42 | FY | FLUSHING OIL | /<Site>-PIPE-FY |  |
| 43 | GA | ACID GAS | /<Site>-PIPE-GA |  |
| 44 | GE | CHILLED WATER | /<Site>-PIPE-GE |  |
| 45 | GY | GLYCOL (MEG) | /<Site>-PIPE-GY |  |
| 46 | HA | HYDROCHLORIC ACID | /<Site>-PIPE-HA |  |
| 47 | HL | PROCESS CONDENSATE | /<Site>-PIPE-HL |  |
| 48 | HO | HOTOIL | /<Site>-PIPE-HO |  |
| 49 | HR | HYDROGEN | /<Site>-PIPE-HR |  |
| 50 | HS | HPSTEAM | /<Site>-PIPE-HS |  |
| 51 | IA | INSTRUMENTATION AIR | /<Site>-PIPE-IA |  |
| 52 | IB | INERT BLANKET HEADER | /<Site>-PIPE-IB |  |
| 53 | IP | INERT GAS | /<Site>-PIPE-IP |  |
| 54 | IW | DESALINATED WATER | /<Site>-PIPE-IW |  |
| 55 | JZ | COOLING WATER RETURN | /<Site>-PIPE-JZ |  |
| 56 | LB | LIQUID BUTANE | /<Site>-PIPE-LB |  |
| 57 | LC | LP STEAM COND. | /<Site>-PIPE-LC |  |
| 58 | LE | LIQUID ETHANE | /<Site>-PIPE-LE |  |
| 59 | LG | LOW PRESSURE GAS | /<Site>-PIPE-LG |  |
| 60 | LN | LIQUEFIED NATURAL GAS | /<Site>-PIPE-LN |  |
| 61 | LO | LUBE OIL | /<Site>-PIPE-LO |  |
| 62 | LP | LIQUID PROPANE | /<Site>-PIPE-LP |  |
| 63 | LS | LP STEAM | /<Site>-PIPE-LS |  |
| 64 | MC | MP STEAM COND. | /<Site>-PIPE-MC |  |
| 65 | ML | METHANOL | /<Site>-PIPE-ML |  |
| 66 | MS | MP STEAM | /<Site>-PIPE-MS |  |
| 67 | NB | NON-OXIDIZING BIOCIDE | /<Site>-PIPE-NB |  |
| 68 | NG | NATURAL GAS | /<Site>-PIPE-NG |  |
| 69 | NL | NATURAL GAS LIQUIDS | /<Site>-PIPE-NL |  |
| 70 | NV | NORMAL CARGO VENT | /<Site>-PIPE-NV |  |
| 71 | NW | DEMINERALISED WATER | /<Site>-PIPE-NW |  |
| 72 | OC | OIL CLOSED DRAIN | /<Site>-PIPE-OC |  |
| 73 | OD | NON-HAZARDOUS OPEN DRAIN | /<Site>-PIPE-OD |  |
| 74 | OH | HAZARDOUS HYDROCARBON OPEN DRAI | /<Site>-PIPE-OH |  |
| 75 | OR | O2/CL2 reducer | /<Site>-PIPE-OR |  |
| 76 | OW | OILY WATER | /<Site>-PIPE-OW |  |
| 77 | OX | OXYGEN | /<Site>-PIPE-OX |  |
| 78 | PA | PROCESS AIR | /<Site>-PIPE-PA |  |
| 79 | PC | PHOSPHORIC ACID (75%) | /<Site>-PIPE-PC |  |
| 80 | PE | POLYELECTROLYTE | /<Site>-PIPE-PE |  |
| 81 | PG | PURGE GAS | /<Site>-PIPE-PG |  |
| 82 | PL | LIQUEFIED PETROLEUM GAS | /<Site>-PIPE-PL |  |
| 83 | PW | PRODUCED WATER | /<Site>-PIPE-PW |  |
| 84 | SC | SODIUM CARBONATE (FOR MEG) | /<Site>-PIPE-SC |  |
| 85 | SD | SOUDING SYSTEM | /<Site>-PIPE-SD |  |
| 86 | SE | SEAL GAS | /<Site>-PIPE-SE |  |
| 87 | SG | SLUDGES | /<Site>-PIPE-SG |  |
| 88 | SI | SCALE INHIBITOR | /<Site>-PIPE-SI |  |
| 89 | SO | SLOP OIL | /<Site>-PIPE-SO |  |
| 90 | SP | SODIUM HYPOCHLORITE | /<Site>-PIPE-SP |  |
| 91 | QW | SEA WATER SUPPLY | /<Site>-PIPE-QW |  |
| 92 | TW | TREATED WATER | /<Site>-PIPE-TW |  |
| 93 | UA | UTILITIES AIR | /<Site>-PIPE-UA |  |
| 94 | UH | HIGH PURITY NRROGEN | /<Site>-PIPE-UH |  |
| 95 | UN | UTILITIES NITROGEN | /<Site>-PIPE-UN |  |
| 96 | US | UREA | /<Site>-PIPE-US |  |
| 97 | UW | UTILITY WATER | /<Site>-PIPE-UW |  |
| 98 | VA | ATM | /<Site>-PIPE-VA |  |
| 99 | VE | DRY EMERGENCY CARGO VENT | /<Site>-PIPE-VE |  |
| 100 | VN | DRY OPERATIONAL CARGO VENT | /<Site>-PIPE-VN |  |
| 101 | VT | VESSEL TRIM | /<Site>-PIPE-VT | Vessel trim zone = -PIPE-VT (replaces doc 3.9 C -PIPE-TRIM; decision 2026-10-19). Only for Pipe, not EQP |
| 102 | VW | WET EMERGENCY CARGO VENT | /<Site>-PIPE-VW |  |
| 103 | WI | WAX INHIBITOR | /<Site>-PIPE-WI |  |
| 104 | WR | WARM MR | /<Site>-PIPE-WR |  |
| 105 | WS | WASTE SPRAY SYSTEM | /<Site>-PIPE-WS |  |
| 106 | XW | PROCESS WATER | /<Site>-PIPE-XW |  |
| 107 | YW | WAST WATER | /<Site>-PIPE-YW |  |

## Sheet: Naming Rules

Naming rules - source: project doc 3.8 / 3.9 (as provided)

| Doc | Element | Rule | Example / remark |
|---|---|---|---|
| 3.8 | Database | DB per Module and Discipline; every item modelled in its dedicated site belonging to a specific DB | e.g. piping module P1 -> site /L-P1D in DB 3052 (ENI example) |
| 3.9 A/B | Site | /<Disc>-<Module><Function> | /L-P1D  (L=discipline, P1=module, D=function) |
| 3.9 B | Zone - Piping | /<Site>-PIPE-<FluidCode> | /L-P1D-PIPE-FG (fluid code per P&ID) |
| 3.9 B | Pipe | /<Site>-<Fluid>-<Sector/System><Seq>-<Class>-<Insul> | /L-P1D-FG-001990-008-C42-V |
| 3.9 B | Branch | Automatic (/B1, /B2 ...) |  |
| 3.9 B | Branch primitives | Actuated valve / instrument / special item tags | BDV-163, FIT-013, SP-012100LH001 |
| 3.9 C | Zone - Vessel trim | ZRF: /<Site>-PIPE-VT (doc: -PIPE-TRIM, not used) | /L-P1D-PIPE-VT - decision 2026-10-19 |
| 3.9 C | Vessel trim pipe | /<Site>-TRIM-<EquipTag>-<Nozzle>-<Class>-<Insul> | doc example /LP1D-TRIM-003000VQ001-N1-C42-V (missing hyphen after L - doc typo?) |
| 3.9 D | Zone - Equipment | /<Site>-EQUI ; /<Site>-NIEQP | /R-P1D-EQUI, /R-P1D-NIEQP |
| 3.9 D | Equipment | /<Site>-<EquipTag> ; non-itemized /<Site>-<EQP\|STA\|LAD\|PLF>-<nnn> | /R-P1D-003000VQ001, /R-P1D-EQP-001 |
| 3.9 D | Sub-equipment | -BODY ; -NOZ-<letter per P&ID> | /R-P1D-003000VQ001-BODY |
| 3.9 E | Zone - Safety | /<Site>-EQUI ; -NIEQP-TRAN ; -NIEQP-LONG | /S-P1D-NIEQP-TRAN |
| 3.9 E | Safety non-itemized types | PER, SER, DCO (not used in FEED), FFE | /S-P1D-TRAN-PER-001 |
| 3.9 F | Zone - Handling | /<Site>-EQUI ; -NIEQP-TRAN ; -NIEQP-LONG | /M-P1D-NIEQP-LONG |
| 3.9 F | Handling non-itemized types | HVO, LDA, TRO, RUN, CRA, HAT | /M-P1D-TRAN-HVO-001 |
| 3.9 G | Zone - Architecture | /<Site>-WALL | /A-S1D-WALL ; structure /A-S1D-WALL-LV (doc shows /A-P1D-WALL-LV - inconsistent site) |
| 3.9 H | Zone - HVAC | /<Site>-EQUI ; -NIEQP ; -DUCT | /H-S1D-DUCT ; branches SPL, RTN, EXH, PRD |
| 3.9 I | Structure (CIV) | PDMS: ref TI-SSA-ENG-STR 3106-E ; TEKLA: Project Procedure 3D CAD | Not detailed in doc |
| 3.9 J | Turret structure | Doc: site /N-TASD ; zone /N-TASD/TM-MAS | DECISION 2026-10-19: ZRF keeps own scheme (/N-TRD); doc 3.9 J not applied |
| — | Electrical / Instrumentation / Telecom | No zone naming in doc 3.9 | PENDING |

## Sheet: Access

ZRF - DATABASE ACCESS

Principle: a DB can be EDITED by its owning team; other disciplines can only VIEW it (read-only). This also applies to Study DBs.

| Who  \  DB | Installed - own discipline | Study - own discipline | Study - other discipline | ENI FEED & catalogues (foreign) |
|---|---|---|---|---|
| Team member of the discipline (General user) | EDIT | EDIT | VIEW | VIEW |
| General user of another discipline | VIEW | VIEW | VIEW | VIEW |
| Free user (TSETIANTO, AANTARIKSA, PKUSUMA, SYSTEM) | EDIT | EDIT | EDIT | VIEW (to verify) |

Notes

•  Example: Study DB for Piping = ZRFPIP/DESI-L-STS -> only ZRFPIP members (and Free users) can edit. Full list: tab "ZRF DB Register", filter Function = Study.

•  Free users bypass all restrictions -> keep the number of Free users small.

•  VIEW cannot be hidden through team ownership. DAC can only restrict create/modify/delete and output/export/copy (not used in ZRF).

•  Foreign DBs: source [1] lists "foreign from another project" as a restricted (read-only) case; whether this also applies to Free users is not stated -> to verify.

•  Decision: option (a), 19-10-2026.

Sources

[1] Database Access - docs.aveva.com/bundle/administration/page/871680.html

[2] Teams and Users - docs.aveva.com/bundle/administration/page/871679.html

[3] Data Access Control (DAC) - docs.aveva.com/bundle/administration/page/871769.html

## Sheet: Notes

ZRF DB / Site Register — notes

Scope

Module changes

DB No formula

Name

Site

Desc

Func codes

Teams

Collision

Access

MDB

Module list

Zones

Teams macro

| Item | Isi |
|---|---|
| Scope | Per discipline: 22 modules (incl. Hull Body HB) + Future + Study + Dummy = 25 DB. 10 disciplines = 250 DB (rev 2026-10-21) |
| Module changes | 2026-10-19: Living Quarters code LQ -> LV (avoid clash with ENI sites /R-LQD, /L-LQD). Hook Up (HK, DB slot 41, own separator group HOOK-UP) added - NOT YET in official project document. |
| DB No formula | 10000 + (disc order x100) + slot (rev 2026-10-21). Slot by site-order group: MODULES 01-10, PIPE-RACK 11-20, HULL-DECK 21-30, HULL-BODY 31-40, HOOK-UP 41-50, OTHERS 51-60, Future 61, Study 62, Dummy 71 (function X, e.g. R-DUX 10171). Gaps reserved for new modules. |
| Name | TEAM/DESI-<Disc>-<Code><Func>  \| Func: D=Installed, F=Future, S=Study |
| Site | /<Disc>-<Code><Func> |
| Desc | "DB for <Disc> - <Module/Future/Study>" |
| Func codes | D & F per project doc 3.7; S (Study) and X (Dummy Model) = project additions, not in doc |
| Teams | ZRF-prefixed NEW teams, separate from EQP/PIP/STR (owners of included ENI FEED refs) |
| Collision | 0 clash with ENI/SMA/FAN/ACP names and DB numbers (verified) |
| Access | MULTIWRITE, CLAIM IMPLICIT. Syntax verified: CREATE DB team/db DESI ACCESS MULTIWRITE CLAIM IMPLICIT DBNO n DESC 'text' |
| MDB | Limit 5000 DB per MDB (current docs). 230 ZRF + 13 cat (+3 SMA pending) + 109 ENI fits one MDB; per-discipline split is optional. MDB list position range 1-1000 (ACRM ADD/CURRENT). |
| Module list | HOLD in source — refine after process block diagram |
| Zones | 2906 zones from doc 3.9 (R, L 107 fluid codes, S, M, A, H). Piping zones pre-created (decision 2026-10-19); vessel trim = -PIPE-VT, no -PIPE-TRIM. E/I/T/N zone naming PENDING. Turret: ZRF keeps own scheme /N-TRD (doc 3.9 J /N-TASD not applied). |
| Teams macro | Only the 5 missing teams are created (ZRFHDL, ZRFSFT, ZRFARC, ZRFHVA, ZRFTEL); description follows existing convention "TEAM FOR ... ZR FLNG". |

## Sheet: Zones (ringkasan)

Pola zone per disiplin, diambil dari site pertama setiap disiplin, ditambah contoh zone Dummy:

| Disiplin | Contoh site | Zone | Purpose | Doc ref | Status |
|---|---|---|---|---|---|
| Equipment | /R-M1D | /R-M1D-EQUI | Itemized process equipment | 3.9 D | Defined in doc |
| Equipment | /R-M1D | /R-M1D-NIEQP | Non-itemized process equipment (EQP/STA/LAD/PLF) | 3.9 D | Defined in doc |
| Piping | /L-M1D | /L-M1D-PIPE-AD | Piping - AMINE CLOSED DRAIN | 3.9 B | Defined in doc |
| Piping | /L-M1D | /L-M1D-PIPE-VT | Piping - VESSEL TRIM | 3.9 B | Defined in doc |
| Handling | /M-M1D | /M-M1D-EQUI | Itemized handling equipment | 3.9 F | Defined in doc |
| Handling | /M-M1D | /M-M1D-NIEQP-TRAN | Non-itemized handling - transversal | 3.9 F | Defined in doc |
| Handling | /M-M1D | /M-M1D-NIEQP-LONG | Non-itemized handling - longitudinal | 3.9 F | Defined in doc |
| Safety | /S-M1D | /S-M1D-EQUI | Itemized safety equipment | 3.9 E | Defined in doc |
| Safety | /S-M1D | /S-M1D-NIEQP-TRAN | Non-itemized safety - transversal | 3.9 E | Defined in doc |
| Safety | /S-M1D | /S-M1D-NIEQP-LONG | Non-itemized safety - longitudinal | 3.9 E | Defined in doc |
| Electrical | /E-M1D | (not defined) | Zone naming for this discipline not in doc 3.9 | — | PENDING |
| Architecture | /A-M1D | /A-M1D-WALL | Architectural wall (model type WALL) | 3.9 G | Defined in doc |
| HVAC | /H-M1D | /H-M1D-EQUI | HVAC equipment | 3.9 H | Defined in doc |
| HVAC | /H-M1D | /H-M1D-NIEQP | HVAC non-itemized | 3.9 H | Defined in doc |
| HVAC | /H-M1D | /H-M1D-DUCT | HVAC duct | 3.9 H | Defined in doc |
| Instrumentation | /I-M1D | (not defined) | Zone naming for this discipline not in doc 3.9 | — | PENDING |
| Telecom | /T-M1D | (not defined) | Zone naming for this discipline not in doc 3.9 | — | PENDING |
| Structure | /N-M1D | (not defined) | Zone naming for this discipline not in doc 3.9 | — | PENDING |
| Equipment | /R-DUX | /R-DUX-STRU | Dummy structure: temporary beam/platform/support steel until official structure model is available | project | Project addition 2026-10-21 |

Piping: satu zone `/<site>-PIPE-<FluidCode>` untuk setiap fluid code (107 kode). Setiap site Dummy (`/x-<mod>X`) punya satu zone `-STRU`.

Total baris zone di register: 3002.
