/* Register workbook content: config -> sheets of cell values (no formatting decisions beyond
   row roles). Sheet list, names, titles and headers come from config.register. */
(function (E3D) {
  'use strict';
  var fmt = E3D.util.fmt;

  // Common placeholders for register texts (titles, headers, text sheets).
  function registerVars(cfg, pkg) {
    var d = pkg.derived, discs = d.disciplines;
    function common(list) { return list.length && list.every(function (x) { return x === list[0]; }) ? list[0] : 'n'; }
    var firstRef = d.references.find(function (r) { return !r.pending; });
    return Object.assign({}, pkg.vars, {
      PACKAGE: cfg.project.packageName,
      N_TEAMS: discs.length,
      N_NEW_TEAMS: discs.filter(function (dd) { return !dd.disc.teamExists; }).length,
      ADMINTEAM: cfg.users.adminTeam.team,
      DB_PER_DISC: common(discs.map(function (dd) { return dd.display.length; })),
      SEP_PER_DISC: common(discs.map(function (dd) { return dd.siteOrder.length - dd.display.length; })),
      REF_FROM: firstRef ? firstRef.mdbPos : '',
      MDB_TOTAL: d.mdbCount,
      N_ZONES: discs.reduce(function (s, dd) { return s + dd.zones.filter(function (z) { return !z.pending; }).length; }, 0),
      DISC_SEQUENCE: discs.map(function (dd) { return pad2(dd.index + 1) + ' ' + dd.disc.letter; }).join(' > ')
    });
  }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  // Builds rows for one sheet. Row = { r, cells, role: 'title'|'header'|'data'|'text' }.
  var KINDS = {
    text: function (sh, c) {
      return (sh.rows || []).map(function (row) {
        return { r: row.r, role: row.role || 'text', cells: row.cells.map(function (x) { return typeof x === 'string' ? c.f(x) : x; }) };
      });
    },

    packageFiles: function (sh, c) {
      var tpl = c.cfg.register.packageFiles, n = 0;
      return table(sh, c, c.pkg.entries.filter(function (e) { return !e.dir; }).map(function (e) {
        var slash = e.path.lastIndexOf('/'), t = tpl[e.kind] || { module: '', step: '', content: '' };
        var v = Object.assign({}, c.vars, e.stats, e.disc ? discVars(e.disc) : {});
        return [++n, slash < 0 ? '' : e.path.slice(0, slash), e.path.slice(slash + 1),
          fmt(t.module, v, c.missing), fmt(t.step, v, c.missing), fmt(t.content, v, c.missing)];
      }));
    },

    teams: function (sh, c) {
      var L = c.cfg.register.labels, users = c.cfg.users;
      var rows = c.d.disciplines.map(function (dd) {
        return [dd.disc.team, dd.disc.letter, dd.disc.name, dd.disc.teamDescExisting || dd.teamDesc, dd.display.length,
          dd.disc.teamExists ? L.teamCreated : L.teamToCreate, members(dd.disc.members, L)];
      });
      if (users.adminTeam.team) rows.push([users.adminTeam.team, L.none, users.adminTeam.label, users.adminTeam.description, 0,
        users.adminTeam.exists ? L.teamCreated : L.teamToCreate, members(users.adminTeam.members, L)]);
      if (users.freeUsers.length) rows.push([c.f(L.freeUsersRow), null, null, null, null, null,
        users.freeUsers.map(function (u) { return u.note ? u.name + ' (' + u.note + ')' : u.name; }).join('\n')]);
      var out = table(sh, c, rows), next = out[out.length - 1].r + 2;
      // Status cell tone (green = created, yellow = to create), as in the ZRF register.
      out.forEach(function (row) {
        if (row.role !== 'data') return;
        if (row.cells[5] === L.teamCreated) row.tones = { 5: 'ok' };
        else if (row.cells[5] === L.teamToCreate) row.tones = { 5: 'warn' };
        if (row.cells[1] == null) row.noWidth = true;   // free-users label spans the row
      });
      (sh.notes || []).forEach(function (t, i) { out.push({ r: next + i, role: 'text', cells: [c.f(t)] }); });
      return out;
    },

    dbRegister: function (sh, c) {
      var a = c.cfg.dbAttributes, L = c.cfg.register.labels, n = 0, rows = [];
      c.d.disciplines.forEach(function (dd) {
        dd.register.forEach(function (r) {
          rows.push([++n, dd.disc.name, dd.disc.letter, dd.disc.team, r.item.label, r.item.code, r.func.letter, r.func.name,
            r.db, r.desc, r.dbno, L.fileNo, a.type, a.access, a.claim, r.site, r.item.note]);
        });
      });
      return table(sh, c, rows);
    },

    siteOrder: function (sh, c) {
      var T = c.cfg.register.labels.siteTypes, n = 0, rows = [];
      c.d.disciplines.forEach(function (dd) {
        dd.siteOrder.forEach(function (s) {
          rows.push([++n, dd.disc.name, T[s.type], s.name, s.type === 'site' ? s.row.desc : null, s.row.db, s.row.dbno, s.group]);
        });
      });
      return table(sh, c, rows);
    },

    zones: function (sh, c) {
      var p = c.cfg.pendingZone, n = 0, rows = [];
      c.d.disciplines.forEach(function (dd) {
        dd.zones.forEach(function (z) {
          rows.push(z.pending
            ? [++n, dd.disc.name, dd.disc.letter, z.row.site, p.zone, p.purpose, p.docRef, p.status]
            : [++n, dd.disc.name, dd.disc.letter, z.row.site, z.name, z.purpose, z.docRef, z.status]);
        });
      });
      return table(sh, c, rows);
    },

    codeList: function (sh, c) {
      var list = c.cfg.codeLists[sh.list] || { items: [] };
      var zone = null;
      c.cfg.disciplines.some(function (d) { return d.zones.some(function (z) { if (z.forEach === sh.list) { zone = z; return true; } return false; }); });
      return table(sh, c, list.items.map(function (it, i) {
        return [i + 1, it.code, it.desc, zone ? '/<Site>' + fmt(zone.suffix, { CODE: it.code, DESC: it.desc }) : '', it.note];
      }));
    }
  };

  function members(list, L) { return list.length ? list.join('\n') : L.none; }
  function discVars(dd) {
    return { D: dd.disc.letter, TEAM: dd.disc.team, DISCIPLINE: dd.disc.name.toUpperCase(), Discipline: dd.disc.name };
  }

  // Title (row 1) + header (row 3) + data from row 4, or header row 1 + data from row 2 when untitled.
  function table(sh, c, rows) {
    var out = [], r = 1;
    if (sh.title) { out.push({ r: 1, role: 'title', cells: [c.f(sh.title)] }); r = 3; }
    out.push({ r: r, role: 'header', cells: (sh.header || []).map(c.f) });
    rows.forEach(function (cells, i) { out.push({ r: r + 1 + i, role: 'data', cells: cells }); });
    return out;
  }

  // Returns { sheets: [{ name, kind, rows }], missing }.
  function build(cfg, opts) {
    var pkg = E3D.macros.generate(cfg, opts);
    var c = { cfg: cfg, pkg: pkg, d: pkg.derived, vars: registerVars(cfg, pkg), missing: pkg.missing.slice() };
    c.f = function (s) { return fmt(s, c.vars, c.missing); };
    var sheets = cfg.register.sheets.map(function (sh) {
      var kind = KINDS[sh.kind];
      if (!kind) throw new Error('Jenis sheet register tidak dikenal: ' + sh.kind);
      return { name: c.f(sh.name), kind: sh.kind, widths: sh.widths || null, rows: kind(sh, c) };
    });
    return { sheets: sheets, missing: Array.from(new Set(c.missing)), vars: c.vars, pkg: pkg };
  }

  E3D.register = { build: build, kinds: Object.keys(KINDS) };
})(globalThis.E3D || (globalThis.E3D = {}));
