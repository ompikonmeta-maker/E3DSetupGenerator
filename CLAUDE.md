# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**E3D Setup Generator**: a tool that generates every AVEVA E3D project-setup macro (Team → DB → MDB → Site → Zone) plus an Excel register from one JSON configuration. The full brief is `PROMPT.md`. Read it before you start any work.

No application code exists yet. The repo holds only the brief, reference docs (`docs/`) and golden fixtures (`fixtures/`). The brief requires this way of working:

- **Plan first.** Read all of `docs/` and `fixtures/`, propose the file structure, data model, UI flow and phases, then wait for approval before writing code.
- **Work in phases**, and show results after each one: data model + formulas → macro generator + golden test → XLSX register → UI → change ("perubahan") mode.
- Talk to the user **briefly, in Indonesian**. Compare with Smart3D where relevant (their background is Smart3D).

The approved plan is in `PLAN.md`. Its findings T1–T10 (fixture quirks) are binding.

## Standing rules from the user (always apply)

- **Always give a snapshot of your work.** After each piece of work, show a screenshot (Playwright + `/opt/pw-browsers` Chromium) or a test-result excerpt, and send it with SendUserFile.
- **Keep responses concise.**
- **The tool must be future-proof (important).** Keep everything config-driven, with no ZRF values hard-coded outside `presets/`. The config carries `schemaVersion` with migrations. Keep pure core logic separate from the UI. New disciplines, groups, functions or patterns must not need code changes.
- **Ask whenever in doubt. Never assume.** This covers E3D behaviour, fixture interpretation and UX choices.

## Decisions (2026-10-22)

- Target the latest Edge/Chrome. Built-ins such as `DecompressionStream` are allowed.
- Use system fonts and inline SVG icons; don't embed Roboto or Material Symbols.
- Visual style is clean and modern, per `docs/ui-reference.webp`: soft surfaces, rounded cards, an icon rail and a secondary list panel, and a stepper.
- Code lives in `src/`. The single built file `dist/e3d-setup-generator.html` is committed, and the build runs on the dev machine only.
- Narrative register texts are free text in the config. The ZRF preset holds the exact fixture text.

## Commands

- Tests (browser, the primary runner): open `tests/test.html` and pick the four files in `fixtures/`. They are cached in IndexedDB.
- Tests (Node, dev only): `node tests/run-node.mjs [filter]`. It loads exactly the `<script src>` list of `tests/test.html`.
- Snapshot: run Playwright (global `npm root -g`, Chromium at `/opt/pw-browsers`) against `file://…/tests/test.html`, using `setInputFiles('#pick', fixtures)`.

## Code layout

- `src/core/` holds pure logic with no DOM: `util`, `model` (schema, `migrate`, defaults), `derive` (config → DBs/sites/zones/MDB positions), `validate` (issues carry `fact` numbers).
- `src/io/` holds `zip` (reader via `DecompressionStream`), `xlsx` (regex reader, cell values only) and `tables` (code lists, existing-DB tables, CSV).
- `src/presets/zrf.js` holds the ZRF config, taken from the fixtures.
- Every file is a classic script that registers on the global `E3D`. Load order is the `<script>` list in `tests/test.html`.
- Item order in the config is the register order. Display order (sites, B1/B2/B3, MDB) is derived by sorting stably by group (PLAN T1).

## Hard constraints (target environment)

- The office Windows PC has no admin rights, no server and **no Node**. The CDN is blocked, so the tool must make **zero network requests**.
- Deliverable: **one self-contained HTML file** in vanilla JS. No framework and no mandatory build step. A third-party lib (ZIP/XLSX) is allowed only when inlined. Prefer hand-written ZIP (store mode) and a minimal SpreadsheetML/xlsx writer.
- Tests must run **in the browser** (a test page or function). Node-based tests are an optional extra for the dev machine only.
- UI uses the user's MD3 toolkit in `docs/material-design-3-project/` (`md3-tokens.css`, `md3-dynamic-color.js`, `md3-components.js`). Follow its `CLAUDE.md` rules: tokens only (no raw colors) and `<md-*>` components. **Caveat:** `md3-tokens.css` line 23 `@import`s Google Fonts (Roboto + Material Symbols). That breaks the offline rule, so remove it and inline or bundle the fonts and icons locally, or fall back to system fonts.
- UI language: English for E3D terms, Indonesian for help text.

## Source of truth for E3D rules

- `docs/fakta-terverifikasi-e3d-admin.md` is the **only** allowed source for validation rules. Each fact has a stable number (e.g. 1.3, 1.7) and a [DOC]/[TES] tag. Cite these numbers in validation messages.
- Don't invent E3D behaviour. Anything in §9 "Belum Terverifikasi" (e.g. `NEW ZONE`, the GUI "Create SITE" field, `ADD db n` past the current count) must be flagged **"perlu dites"** in the output README. Ask the user before you add any new rule.
- `docs/rangkuman-zrf-setup.md` holds the ZRF decisions you need for the "ZRF" preset: disciplines R=1 … N=11 (there is no 10), group slot bases, module codes, zone suffixes and team status.
- `docs/contoh-paket-setup-zrf.md` and `docs/contoh-register-zrf.md` are text renderings of the expected outputs.

## Core generation logic (derived from the brief + fixtures)

- DB name `{TEAM}/DESI-{D}-{CODE}{F}`, site `/{D}-{CODE}{F}`. Function letters: D Installed, F Future (FU), S Study (ST), X Dummy (DU).
- `DBNO = 10000 + discOrder×100 + groupSlotBase + indexInGroup`. ZRF slot bases: MODULES 1, PIPE-RACK 11, HULL-DECK 21, HULL-BODY 31, HOOK-UP 41, OTHERS 51, FUTURE-STUDY 61, DUMMY 71. A group with more than 10 items must warn.
- MDB positions are **absolute and continuous** across disciplines in order (R 1–25, L 26–50, …). References (90) follow at 251 and above. `99-FIXUP` re-issues `CURRENT db n` for the full final order.
- B2 site order: the discipline separator `/----{DISC}----` and the group separator `/{D}----{GROUP}----` are created **before** the first site in the **same DB**. ` DB team/db` is appended only on the first site of each DB (facts 3.2–3.4). Separators can be switched off.
- Never emit `REORDER` (fails across DBs with error 41,227; facts §4).
- Zones: per-discipline suffix list. Piping makes one `-PIPE-{fluid}` per line of `fixtures/fluid-codes.txt` (TAB-separated). Every discipline's `…DUX` site gets `-STRU -EQUI -VOL -ROUTE -TIE`.

## Golden test: fixture details that override the brief

`fixtures/ZRF-SETUP-PACKAGE.zip` is the authority. Output must match it file by file, normalising only the date in the headers. Watch for these:

- All entries sit under a root folder `ZRF-SETUP-PACKAGE/`. The zip has 34 files plus directory entries.
- All files use **CRLF** and plain ASCII. Comments start with `$*`. Headers are `$* ====…` banner blocks, followed by a lone `$*` line.
- **PENDING disciplines (E, I, T, N) still get a B3 file.** It contains only their Dummy-site zones. The brief says B3 is skipped for PENDING; the fixture wins.
- The register sheet is named **"ZRF DB Register"** (project-code prefix), not "DB Register". Compare register **cell values only**, not formatting.
- `90-REFERENCE` contains commented-out lines for pending foreign DBs (`$* ADD SAIMAS/… <- SMA pending`). The reference-list model needs a "commented/pending" flag.

Other inputs: `fixtures/BASE-ENI.xlsx` is an existing-DB list used for clash checks. Use it for the edge-case test where a DB No clashes with ENI.
