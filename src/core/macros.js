/* Macro package text: config + derive() -> ordered list of package entries.
   Formats follow the proven ZRF package (CRLF, "$*" comments, banner headers). */
(function (E3D) {
  'use strict';
  var fmt = E3D.util.fmt;
  var EOL = '\r\n';

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  // Header template -> comment lines.
  function header(tpl, vars, missing) {
    return fmt(tpl, vars, missing).split('\n').map(function (l) { return l ? '$* ' + l : '$*'; });
  }

  function pendingLine(cfg, line, note, missing) {
    return '$* ' + (note ? fmt(cfg.texts.pendingLine, { LINE: line, NOTE: note }, missing) : line);
  }

  function text(lines) { return lines.join(EOL) + EOL; }

  // Items flagged in fact §9 that this package relies on.
  function untestedItems(d) {
    var out = [];
    if (d.disciplines.some(function (dd) { return dd.zones.some(function (z) { return !z.pending; }); }))
      out.push('NEW ZONE after going to the SITE (fact 9)');
    return out;
  }

  // opts: { date: 'YYYY-MM-DD', only: [discipline letters] | null }
  function generate(cfg, opts) {
    opts = opts || {};
    var d = E3D.derive(cfg), T = cfg.texts, F = T.files, missing = [];
    var discs = d.disciplines;
    var only = opts.only ? new Set(opts.only) : null;
    var nn = function (dd) { return pad2(dd.index + 1); };
    var base = {
      PROJECTCODE: cfg.project.code, PROJECT: cfg.project.name, MDB: cfg.project.mdb,
      MDBNAME: cfg.project.mdb.replace(/^\//, ''), DATE: opts.date || new Date().toISOString().slice(0, 10),
      FIRST: discs.length ? nn(discs[0]) : '', LAST: discs.length ? nn(discs[discs.length - 1]) : '',
      N_DISC: discs.length
    };
    base.TEAMSDIR = fmt(F.teamsDir, base, missing);
    base.REFDIR = fmt(F.refDir, base, missing);
    base.FIXDIR = fmt(F.fixDir, base, missing);
    base.REGISTER = fmt(F.register, base, missing);
    function vars(extra) { return Object.assign({}, base, extra); }

    var entries = [];
    function dir(path) { entries.push({ path: path + '/', dir: true }); }
    function file(path, lines, kind, dd, stats) { entries.push({ path: path, text: text(lines), kind: kind, disc: dd || null, stats: stats || {} }); }

    // README
    var untested = untestedItems(d);
    var unt = untested.length ? fmt(T.untested, { ITEMS: untested.join('; ') }, missing) : '';
    var readme = T.readme.split('\n').filter(function (l) { return !(l.trim() === '{UNTESTED}' && !unt); })
      .map(function (l) { return fmt(l, vars({ UNTESTED: unt }), missing); });
    file(fmt(F.readme, base, missing), readme, 'readme');

    // 00-TEAMS
    var newTeams = discs.filter(function (dd) { return !dd.disc.teamExists; });
    var oldTeams = discs.filter(function (dd) { return dd.disc.teamExists; });
    var t = header(T.headers.teams, base, missing);
    t.push('$* ' + fmt(T.teamsNew, vars({ N: newTeams.length }), missing));
    newTeams.forEach(function (dd) { t.push(createTeam(dd)); });
    newTeams.forEach(function (dd) { if (dd.disc.members.length) t.push('SET TEAM ' + dd.disc.team, 'TADD ' + dd.disc.members.join(' ')); });
    if (oldTeams.length) {
      t.push('$*', '$* ' + fmt(T.teamsExisting, base, missing));
      oldTeams.forEach(function (dd) { t.push('$* ' + createTeam(dd)); });
      oldTeams.forEach(function (dd) {
        if (dd.disc.members.length) t.push('$* SET TEAM ' + dd.disc.team, '$* TADD ' + dd.disc.members.join(' '));
      });
    }
    dir(base.TEAMSDIR);
    file(base.TEAMSDIR + '/' + fmt(F.teams, base, missing), t, 'teams', null, { N_NEW_TEAMS: newTeams.length });

    // Per discipline: B1, B2, B3
    discs.forEach(function (dd) {
      if (only && !only.has(dd.disc.letter)) return;
      var rows = dd.display;
      var v = vars({ NN: nn(dd), D: dd.disc.letter, TEAM: dd.disc.team, DISCIPLINE: dd.disc.name.toUpperCase(),
        Discipline: dd.disc.name, N: rows.length,
        POS_FROM: rows.length ? rows[0].mdbPos : '', POS_TO: rows.length ? rows[rows.length - 1].mdbPos : '' });
      var folder = fmt(F.discDir, v, missing);
      dir(folder);

      var a = cfg.dbAttributes;
      var b1 = header(T.headers.b1, v, missing);
      rows.forEach(function (r) {
        b1.push('CREATE DB ' + r.db + ' ' + a.type + ' ACCESS ' + a.access + ' CLAIM ' + a.claim + ' DBNO ' + r.dbno + " DESC '" + r.desc + "'");
      });
      b1.push('$*', 'SET MDB ' + cfg.project.mdb);
      rows.forEach(function (r) { b1.push('ADD ' + r.db + ' ' + r.mdbPos); });
      file(folder + '/' + fmt(F.b1, v, missing), b1, 'b1', dd, { N_DB: rows.length, POS_FROM: v.POS_FROM, POS_TO: v.POS_TO });

      var b2 = header(T.headers.b2, v, missing), lastDb = null;
      dd.siteOrder.forEach(function (s) {
        b2.push('NEW SITE ' + s.name + (s.row.db !== lastDb ? ' DB ' + s.row.db : ''));
        lastDb = s.row.db;
      });
      b2.push('$*', 'SAVEWORK');
      file(folder + '/' + fmt(F.b2, v, missing), b2, 'b2', dd, { N_SITES: rows.length, N_SEP: dd.siteOrder.length - rows.length });

      var zones = dd.zones.filter(function (z) { return !z.pending; });
      if (zones.length) {
        var b3 = header(T.headers.b3, v, missing), site = null;
        zones.forEach(function (z) {
          if (z.row.site !== site) { if (site) b3.push('$*'); b3.push(z.row.site); site = z.row.site; }
          b3.push('NEW ZONE ' + z.name);
        });
        b3.push('$*', 'SAVEWORK');
        file(folder + '/' + fmt(F.b3, v, missing), b3, 'b3', dd, { N_ZONES: zones.length });
      }
    });

    // 90-REFERENCE
    var refs = d.references, firstRef = refs.find(function (r) { return !r.pending; });
    var rv = vars({ POS_FROM: firstRef ? firstRef.mdbPos : d.mdbCount + 1 });
    var ref = header(T.headers.ref, rv, missing);
    ref.push('SET MDB ' + cfg.project.mdb);
    refs.forEach(function (r) { ref.push(r.pending ? pendingLine(cfg, 'ADD ' + r.db, r.note, missing) : 'ADD ' + r.db + ' ' + r.mdbPos); });
    dir(base.REFDIR);
    file(base.REFDIR + '/' + fmt(F.ref, base, missing), ref, 'ref', null, { POS_FROM: rv.POS_FROM, POS_TO: d.mdbCount });

    // 99-FIXUP: CURRENT for the full final order
    var fix = header(T.headers.fix, base, missing);
    fix.push('SET MDB ' + cfg.project.mdb);
    discs.forEach(function (dd) {
      if (!dd.display.length) return;
      fix.push('$* ' + dd.disc.name);
      dd.display.forEach(function (r) { fix.push('CURRENT ' + r.db + ' ' + r.mdbPos); });
    });
    if (refs.length) {
      fix.push('$* ' + T.fixReferenceLabel);
      refs.forEach(function (r) { fix.push(r.pending ? pendingLine(cfg, 'CURRENT ' + r.db, r.note, missing) : 'CURRENT ' + r.db + ' ' + r.mdbPos); });
    }
    dir(base.FIXDIR);
    file(base.FIXDIR + '/' + fmt(F.fix, base, missing), fix, 'fix', null, { POS_FROM: d.mdbCount ? 1 : 0, POS_TO: d.mdbCount });

    return { root: cfg.project.packageName, entries: entries, derived: d, vars: base, missing: Array.from(new Set(missing)) };

    function createTeam(dd) { return 'CREATE TEAM ' + dd.disc.team + " DESC '" + dd.teamDesc + "'"; }
  }

  // Package entries -> ZIP entries under the root folder (root folder entry first).
  function toZipEntries(pkg, date) {
    var enc = new TextEncoder(), root = pkg.root ? pkg.root + '/' : '';
    var out = root ? [{ name: root, dir: true, date: date }] : [];
    pkg.entries.forEach(function (e) {
      out.push(e.dir ? { name: root + e.path, dir: true, date: date } : { name: root + e.path, data: enc.encode(e.text), date: date });
    });
    return out;
  }

  E3D.macros = { generate: generate, toZipEntries: toZipEntries, EOL: EOL };
})(globalThis.E3D || (globalThis.E3D = {}));
