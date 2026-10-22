/* Validation. E3D rules come only from docs/fakta-terverifikasi-e3d-admin.md;
   `fact` holds the fact number. Rules with fact '' are tool/project rules, not E3D rules. */
(function (E3D) {
  'use strict';

  var LIMITS = {
    dbnoRanges: [[1, 7000], [10000, 250000]],   // fact 1.3
    mdbPosMax: 5000,                            // fact 1.7, §2 ADD/CURRENT
    currentMax: 1000                            // fact 1.7
  };
  var SAFE_NAME = /^\/[A-Z0-9-]*$/;             // other characters: untested (fact §9)

  function validate(cfg, derived) {
    var out = [];
    function add(level, code, fact, msg, path) { out.push({ level: level, code: code, fact: fact, msg: msg, path: path || '' }); }

    E3D.model.checkStructure(cfg).forEach(function (x) { out.push(x); });
    if (out.length) return out;
    var d = derived || E3D.derive(cfg);

    d.missingPlaceholders.forEach(function (k) {
      add('error', 'placeholder', '', 'Placeholder {' + k + '} tidak dikenal di salah satu format nama.', 'formats');
    });

    if (!cfg.project.mdb) add('error', 'mdb-missing', '§2', 'Nama MDB kosong; SET MDB butuh nama.', 'project.mdb');
    else checkName(cfg.project.mdb, 'MDB', 'project.mdb');

    // DB numbers and names
    var byNo = new Map(), byName = new Map();
    d.dbs.forEach(function (r) {
      var inRange = LIMITS.dbnoRanges.some(function (rg) { return r.dbno >= rg[0] && r.dbno <= rg[1]; });
      if (!inRange) add('error', 'dbno-range', '1.3', r.db + ': DB No ' + r.dbno + ' di luar rentang 1–7000 / 10000–250000.', dbPath(r));
      push(byNo, r.dbno, r); push(byName, r.db, r);
    });
    byNo.forEach(function (rows, no) {
      if (rows.length > 1) add('error', 'dbno-dup', '1.3', 'DB No ' + no + ' dipakai ' + rows.length + ' DB: ' + names(rows) + '.', dbPath(rows[0]));
    });
    byName.forEach(function (rows, name) {
      if (rows.length > 1) add('error', 'dbname-dup', '6.11', 'Nama DB ' + name + ' muncul ' + rows.length + ' kali.', dbPath(rows[0]));
    });

    // Clash with existing DBs / sites
    var exNo = new Map(), exName = new Map(), exSite = new Map();
    cfg.existing.dbs.forEach(function (x) {
      if (x.dbno !== '' && x.dbno != null) exNo.set(Number(x.dbno), x);
      exName.set(String(x.name).toUpperCase(), x);
    });
    cfg.existing.sites.forEach(function (x) { exSite.set(String(x.name), x); });
    d.dbs.forEach(function (r) {
      var a = exNo.get(r.dbno);
      if (a) add('error', 'dbno-clash', '1.3', r.db + ': DB No ' + r.dbno + ' sudah dipakai ' + a.name + src(a) + '.', dbPath(r));
      var b = exName.get(r.db.toUpperCase());
      if (b) add('error', 'dbname-clash', '6.11', r.db + ': nama DB sudah ada' + src(b) + '.', dbPath(r));
    });

    // Site, separator and zone names
    var siteNames = new Map();
    d.disciplines.forEach(function (dd) {
      dd.siteOrder.forEach(function (s) {
        push(siteNames, s.name, s);
        checkName(s.name, 'Site', 'disciplines.' + cfg.disciplines.indexOf(dd.disc));
        if (exSite.has(s.name)) add('warning', 'site-clash', '§7', 'Site ' + s.name + ' sudah ada' + src(exSite.get(s.name)) + ' (error 41,12 Name already used).', 'existing.sites');
      });
      var zseen = new Set();
      dd.zones.forEach(function (z) {
        if (z.pending) return;
        if (!zseen.has(z.suffix)) { zseen.add(z.suffix); checkName(z.name, 'Zone', 'disciplines.' + cfg.disciplines.indexOf(dd.disc) + '.zones'); }
      });
    });
    siteNames.forEach(function (rows, name) {
      if (rows.length > 1) add('warning', 'site-dup', '§7', 'Nama site ' + name + ' muncul ' + rows.length + ' kali (error 41,12 Name already used).', '');
    });

    // MDB limits
    var maxPos = d.mdbCount;
    if (maxPos > LIMITS.mdbPosMax) add('error', 'mdb-pos', '1.7', 'Posisi MDB sampai ' + maxPos + '; maksimal ' + LIMITS.mdbPosMax + '.', 'references');
    if (maxPos > LIMITS.currentMax) add('error', 'mdb-current', '1.7', maxPos + ' DB current; maksimal ' + LIMITS.currentMax + ' sekaligus.', 'references');

    // Teams
    cfg.disciplines.forEach(function (disc, i) {
      if (!disc.active) return;
      if (!disc.team) add('error', 'team-missing', '1.12', 'Disiplin ' + disc.letter + ' belum punya Owning Team.', 'disciplines.' + i + '.team');
    });

    // Groups and slots (project rule: fixed slot capacity per group)
    var cap = cfg.dbNumber.groupCapacity;
    d.disciplines.forEach(function (dd) {
      var path = 'disciplines.' + cfg.disciplines.indexOf(dd.disc);
      if (!dd.display.length) add('warning', 'disc-empty', '', 'Disiplin ' + dd.disc.letter + ' tidak punya item; tidak ada DB/site yang dibuat.', path);
      if (dd.pending) add('info', 'zone-pending', '', 'Disiplin ' + dd.disc.letter + ' belum punya aturan zone (PENDING).', path + '.zones');
    });
    var perGroup = E3D.util.countBy(cfg.items, function (it) { return it.group; });
    cfg.groups.forEach(function (g, i) {
      var n = perGroup.get(g.name) || 0;
      if (!n) add('info', 'group-empty', '', 'Grup ' + g.name + ' kosong; separator grup tidak dibuat.', 'groups.' + i);
      if (cap && n > cap) add('warning', 'group-full', '', 'Grup ' + g.name + ' berisi ' + n + ' item; jatah slot ' + cap + ' (slot ' + g.slotBase + '–' + (g.slotBase + cap - 1) + ').', 'groups.' + i);
      var last = g.slotBase + n - 1;
      if (n && last >= cfg.dbNumber.disciplineStep) add('error', 'slot-overflow', '', 'Grup ' + g.name + ': slot ' + last + ' melewati jatah per disiplin (' + cfg.dbNumber.disciplineStep + ').', 'groups.' + i);
    });

    // Package texts: unknown placeholders and non-ASCII output (encoding in E3D macros not verified)
    if (E3D.macros) {
      var reg = E3D.register ? E3D.register.build(cfg, { date: '2000-01-01' }) : null;
      var pkg = reg ? reg.pkg : E3D.macros.generate(cfg, { date: '2000-01-01' });
      (reg ? reg.missing : pkg.missing).forEach(function (k) {
        add('error', 'placeholder', '', 'Placeholder {' + k + '} tidak dikenal di teks paket/register.', 'texts');
      });
      if (reg && E3D.xlsx && E3D.xlsx.sheetNameProblems) E3D.xlsx.sheetNameProblems(reg.sheets.map(function (s) { return s.name; }))
        .forEach(function (m) { add('error', 'sheet-name', '', m + ' (aturan Excel)', 'register.sheets'); });
      pkg.entries.forEach(function (e) {
        if (!e.dir && /[^\x00-\x7f]/.test(e.text))
          add('warning', 'non-ascii', '§9', e.path + ' berisi karakter non-ASCII; encoding di E3D belum dites (perlu dites).', 'texts');
      });
    }

    // Untested commands used by the package (fact §9)
    if (d.disciplines.some(function (dd) { return dd.zones.some(function (z) { return !z.pending; }); }))
      add('info', 'untested-new-zone', '§9', 'NEW ZONE setelah navigasi ke site belum dites di ZRF (perlu dites).', '');

    return out;

    function checkName(name, kind, path) {
      if (name.charAt(0) !== '/') add('warning', 'name-slash', '3.5', kind + ' ' + name + ' tidak diawali "/".', path);
      if (name !== name.toUpperCase()) add('warning', 'name-case', '3.5', kind + ' ' + name + ' tidak huruf besar.', path);
      else if (!SAFE_NAME.test(name)) add('warning', 'name-chars', '§9', kind + ' ' + name + ' memakai karakter selain huruf, angka dan "-" (perlu dites).', path);
    }
  }

  function push(map, k, v) { if (!map.has(k)) map.set(k, []); map.get(k).push(v); }
  function names(rows) { return rows.map(function (r) { return r.db; }).join(', '); }
  function src(x) { return x.source ? ' (' + x.source + ')' : ''; }
  function dbPath(r) { return 'items.' + r.item.code; }

  // Sorted view used by UIs and reports.
  function summarize(issues) {
    var c = { error: 0, warning: 0, info: 0 };
    issues.forEach(function (i) { c[i.level]++; });
    return c;
  }

  E3D.validate = validate;
  E3D.validateLimits = LIMITS;
  E3D.summarizeIssues = summarize;
})(globalThis.E3D || (globalThis.E3D = {}));
