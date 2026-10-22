/* Configuration model: schema version, defaults, migration and structural checks.
   A config is plain JSON; everything project-specific lives in it (see presets/). */
(function (E3D) {
  'use strict';

  var SCHEMA_VERSION = 1;

  // Shape of a v1 config. Values here are neutral defaults, not ZRF data.
  function blank() {
    return {
      schemaVersion: SCHEMA_VERSION,
      project: { code: '', name: '', mdb: '', packageName: '' },
      formats: {
        teamDesc: 'TEAM FOR {DISCIPLINE} {PROJECT}',
        dbDesc: 'DB for {Discipline} - {ITEM}',
        dbName: '{TEAM}/DESI-{D}-{CODE}{F}',
        siteName: '/{D}-{CODE}{F}',
        sepDiscipline: '/----{DISCIPLINE}----',
        sepGroup: '/{D}----{GROUP}----'
      },
      separators: { discipline: true, group: true },
      dbNumber: { base: 10000, disciplineStep: 100, groupCapacity: 10 },
      dbAttributes: { type: 'DESI', access: 'MULTIWRITE', claim: 'IMPLICIT' },
      // zones: 'discipline' = the discipline's own zone list, otherwise a key of zoneSets.
      // zoneStatus: optional register status that replaces the zone's own status for this function.
      functions: [],
      zoneSets: {},
      pendingZone: { zone: '(not defined)', purpose: '', docRef: '', status: 'PENDING' },
      codeLists: {},
      disciplines: [],
      groups: [],
      items: [],
      references: [],
      existing: { dbs: [], sites: [] },
      users: { adminTeam: { team: '', label: 'Administration', description: '', exists: true, members: [] }, freeUsers: [] },
      texts: defaultTexts(),
      register: defaultRegister()
    };
  }

  // Register workbook: ordered sheet list. Generated kinds: packageFiles, teams, dbRegister,
  // siteOrder, zones, codeList (list: key of codeLists). kind 'text' = free rows { r, cells, role }.
  function defaultRegister() {
    return {
      sheets: [
        { kind: 'packageFiles', name: 'Package Files', title: '{PACKAGE}.zip - file list',
          header: ['No', 'Folder', 'File', 'Module', 'Step', 'Content'] },
        { kind: 'teams', name: 'Teams & Users', title: '{PROJECTCODE} - TEAMS & USERS',
          header: ['Team', 'Disc', 'Discipline', 'Description', 'DBs', 'Status', 'Members'], notes: [] },
        { kind: 'dbRegister', name: '{PROJECTCODE} DB Register',
          header: ['No', 'Discipline', 'Disc Code', 'Team', 'Module/Item', 'Mod Code', 'Func', 'Function', 'DB Name',
            'Description', 'DB No', 'File No', 'Type', 'Access', 'Claim', 'Site Name', 'Status'] },
        { kind: 'siteOrder', name: 'Site Order',
          header: ['Order', 'Discipline', 'Type', 'Site Name', 'Site Description', 'Created in DB', 'DB No', 'Group'] },
        { kind: 'zones', name: 'Zones', title: '{PROJECTCODE} - Zone Register',
          header: ['No', 'Discipline', 'Disc', 'Site', 'Zone Name', 'Purpose', 'Doc ref', 'Status'] },
        { kind: 'codeList', list: 'fluid', name: 'Fluid Codes', title: 'Fluid Codes',
          header: ['No', 'Code', 'Description', 'Zone pattern', 'Check'] }
      ],
      labels: {
        fileNo: 'System', teamCreated: 'Created', teamToCreate: 'To create', none: '—',
        freeUsersRow: 'FREE USERS - no team needed, can edit all {PROJECTCODE} DBs',
        siteTypes: { sepDiscipline: 'Separator - discipline', sepGroup: 'Separator - group', site: 'Site' }
      },
      packageFiles: {
        readme: { module: '—', step: '—', content: 'Package order + preparation' },
        teams: { module: 'Admin', step: '0', content: '{N_NEW_TEAMS} new teams (+ commented block for existing teams/members)' },
        b1: { module: 'Admin', step: 'B1', content: 'CREATE {N_DB} DBs + ADD to {MDBNAME} (pos {POS_FROM}-{POS_TO})' },
        b2: { module: 'Design', step: 'B2', content: '{N_SEP} separators + {N_SITES} sites (display order)' },
        b3: { module: 'Design', step: 'B3', content: '{N_ZONES} zones' },
        ref: { module: 'Admin', step: '90', content: 'reference DBs, pos {POS_FROM}-{POS_TO}' },
        fix: { module: 'Admin', step: '99', content: 'CURRENT {POS_FROM}-{POS_TO} (only if needed)' }
      }
    };
  }

  // Package file names and macro/README texts. Header lines get a "$* " prefix
  // ("$*" alone for an empty line). Neutral defaults; presets carry their own wording.
  function defaultTexts() {
    var BANNER = '===========================================================';
    return {
      files: {
        readme: '00-README.txt',
        teamsDir: '00-TEAMS', teams: '{PROJECTCODE}-00-TEAMS-ADMIN.mac',
        discDir: '{NN}-{D}-{TEAM}',
        b1: '{PROJECTCODE}-{NN}-{D}-B1-CREATE-DB-MDB-ADMIN.mac',
        b2: '{PROJECTCODE}-{NN}-{D}-B2-SITES-DESIGN.mac',
        b3: '{PROJECTCODE}-{NN}-{D}-B3-ZONES-DESIGN.mac',
        refDir: '90-REFERENCE', ref: '{PROJECTCODE}-90-REF-MDB-ADMIN.mac',
        fixDir: '99-FIXUP', fix: '{PROJECTCODE}-99-MDB-REORDER-ADMIN.mac',
        register: '{PROJECTCODE}-E3D-Register.xlsx'
      },
      readme: [
        '{PROJECTCODE} ({PROJECT}) - E3D SETUP PACKAGE',
        'Generated {DATE}. Full guide: {REGISTER}, sheet \'Setup Steps\'.',
        '',
        'STEPS (command macros only)',
        ' {TEAMSDIR} -> per discipline: B1 (Admin) -> B2 sites (Design) -> B3 zones (Design)',
        '',
        'ORDER: disciplines {FIRST} -> {LAST} (MDB positions follow on), then {REFDIR}.',
        'Admin steps before Design steps; re-enter DESIGN after each Admin step.',
        '{FIXDIR} only if the MDB order is wrong.',
        '{UNTESTED}'
      ].join('\n'),
      untested: 'PERLU DITES (not verified yet): {ITEMS}',
      headers: {
        teams: [BANNER, '{PROJECTCODE} - STEP 0 - TEAMS - ADMIN (SYSTEM)', 'Run once, before discipline {FIRST}.', BANNER, ''].join('\n'),
        b1: [BANNER, '{DISCIPLINE} ({TEAM}) - STEP B1 - ADMIN: CREATE {N} DB + MDB', 'Team must exist ({TEAMSDIR}).',
          'MDB positions {POS_FROM}-{POS_TO}: run disciplines in order {FIRST}->{LAST} (positions follow on).', BANNER, ''].join('\n'),
        b2: [BANNER, '{DISCIPLINE} - STEP B2 - DESIGN: separators + {N} sites (display order)',
          'DB given once per DB (first site); next lines without DB go to the same DB.', 'Re-enter DESIGN after B1.', BANNER, ''].join('\n'),
        b3: [BANNER, '{DISCIPLINE} - STEP B3 - DESIGN: zones', 'Each block: go to SITE, NEW ZONE.', BANNER, ''].join('\n'),
        ref: [BANNER, 'REFERENCE DBs - ADMIN: add to {MDBNAME}', 'Run AFTER all {N_DISC} disciplines (positions {POS_FROM}+).', BANNER, ''].join('\n'),
        fix: [BANNER, '{MDBNAME} FIX-UP - ADMIN: CURRENT db n for all (final order)',
          'Use only if the MDB order is wrong (e.g. disciplines run out of order).', BANNER, ''].join('\n')
      },
      teamsNew: '--- {N} new discipline teams ---',
      teamsExisting: '--- only if the existing {PROJECTCODE} teams were deleted (normally keep) ---',
      pendingLine: '{LINE}   <- {NOTE}',
      fixReferenceLabel: 'reference'
    };
  }

  // Templates for list entries, used to fill missing optional fields.
  var ENTRY = {
    functions: { letter: '', name: '', zones: 'discipline', zoneStatus: '' },
    disciplines: { letter: '', name: '', order: 0, team: '', teamExists: false, teamDescExisting: '',
      members: [], active: true, items: null, zones: [] },
    zone: { suffix: '', purpose: '', docRef: '', status: '', forEach: '' },
    groups: { name: '', slotBase: 0 },
    items: { code: '', label: '', desc: '', group: '', func: '', note: '' },
    references: { db: '', pending: false, note: '' },
    codeItem: { code: '', desc: '', note: '' }
  };

  // Ordered migrations: MIGRATIONS[n] upgrades a version-n config to n+1.
  var MIGRATIONS = {};

  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }

  function fill(target, defaults) {
    Object.keys(defaults).forEach(function (k) {
      if (!(k in target) || target[k] === undefined) target[k] = E3D.util.clone(defaults[k]);
      else if (isObj(defaults[k]) && isObj(target[k]) && Object.keys(defaults[k]).length) fill(target[k], defaults[k]);
    });
    return target;
  }

  // Upgrade any supported config to the current schema and fill missing optional fields.
  // Throws on configs that cannot be read (no version, or written by a newer tool).
  function migrate(input) {
    if (!isObj(input)) throw new Error('Config bukan objek JSON.');
    var cfg = E3D.util.clone(input);
    var v = cfg.schemaVersion;
    if (typeof v !== 'number') throw new Error('Config tidak punya schemaVersion.');
    if (v > SCHEMA_VERSION) throw new Error('Config dibuat oleh versi tool yang lebih baru (schema ' + v + ').');
    while (v < SCHEMA_VERSION) {
      if (!MIGRATIONS[v]) throw new Error('Tidak ada migrasi dari schema ' + v + '.');
      cfg = MIGRATIONS[v](cfg);
      v = cfg.schemaVersion;
    }
    fill(cfg, blank());
    cfg.functions.forEach(function (f) { fill(f, ENTRY.functions); });
    cfg.disciplines.forEach(function (d) {
      fill(d, ENTRY.disciplines);
      d.zones.forEach(function (z) { fill(z, ENTRY.zone); });
    });
    Object.keys(cfg.zoneSets).forEach(function (k) {
      fill(cfg.zoneSets[k], { name: k, zones: [] });
      cfg.zoneSets[k].zones.forEach(function (z) { fill(z, ENTRY.zone); });
    });
    Object.keys(cfg.codeLists).forEach(function (k) {
      fill(cfg.codeLists[k], { name: k, items: [] });
      cfg.codeLists[k].items.forEach(function (c) { fill(c, ENTRY.codeItem); });
    });
    cfg.groups.forEach(function (g) { fill(g, ENTRY.groups); });
    cfg.items.forEach(function (i) { fill(i, ENTRY.items); });
    cfg.references.forEach(function (r) { fill(r, ENTRY.references); });
    return cfg;
  }

  // Structural problems that make derivation meaningless (wrong types, dangling keys).
  function checkStructure(cfg) {
    var out = [];
    function err(path, msg) { out.push({ level: 'error', code: 'structure', fact: '', path: path, msg: msg }); }
    ['functions', 'disciplines', 'groups', 'items', 'references'].forEach(function (k) {
      if (!Array.isArray(cfg[k])) err(k, k + ' harus berupa list.');
    });
    if (out.length) return out;
    var funcs = new Set(cfg.functions.map(function (f) { return f.letter; }));
    var groups = new Set(cfg.groups.map(function (g) { return g.name; }));
    cfg.functions.forEach(function (f, i) {
      if (f.zones !== 'discipline' && !cfg.zoneSets[f.zones])
        err('functions.' + i + '.zones', 'Function ' + f.letter + ': zone set "' + f.zones + '" tidak ada.');
    });
    cfg.items.forEach(function (it, i) {
      if (!groups.has(it.group)) err('items.' + i + '.group', 'Item ' + it.code + ': grup "' + it.group + '" tidak ada.');
      if (!funcs.has(it.func)) err('items.' + i + '.func', 'Item ' + it.code + ': function "' + it.func + '" tidak ada.');
    });
    cfg.disciplines.forEach(function (d, i) {
      if (typeof d.order !== 'number') err('disciplines.' + i + '.order', 'Disiplin ' + d.letter + ': urutan harus angka.');
      d.zones.forEach(function (z, j) {
        if (z.forEach && !cfg.codeLists[z.forEach])
          err('disciplines.' + i + '.zones.' + j, 'Disiplin ' + d.letter + ': code list "' + z.forEach + '" tidak ada.');
      });
    });
    return out;
  }

  E3D.model = { SCHEMA_VERSION: SCHEMA_VERSION, blank: blank, migrate: migrate, checkStructure: checkStructure };
})(globalThis.E3D || (globalThis.E3D = {}));
