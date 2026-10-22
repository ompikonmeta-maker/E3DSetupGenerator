/* Phase 1: data model, formulas and validation, checked against the ZRF fixtures. */
(function (E3D) {
  'use strict';
  var T = E3D.test, G = 'Fase 1 · model & rumus';
  var PKG = 'ZRF-SETUP-PACKAGE.zip', REG = 'ZRF-E3D-Register.xlsx', ENI = 'BASE-ENI.xlsx', FLUID = 'fluid-codes.txt';

  function zrf() { return E3D.presets.zrf.build(); }
  function v(x) { return x == null ? '' : x; }

  function packageTexts(ctx) {
    return E3D.zip.read(ctx.fixture(PKG)).then(function (entries) {
      var dec = new TextDecoder(), out = {};
      entries.forEach(function (e) { if (!e.dir) out[e.name.replace(/^[^/]+\//, '')] = dec.decode(e.data); });
      return out;
    });
  }
  // Data rows from Excel row number `firstRow` on (gap rows are absent from the sheet XML).
  function sheetRows(ctx, name, firstRow) {
    return E3D.xlsx.read(ctx.fixture(REG)).then(function (wb) {
      var s = wb.sheet(name);
      if (!s) throw new Error('Sheet ' + name + ' tidak ada di register.');
      return Array.from(s.rows.keys()).filter(function (r) { return r >= firstRow; })
        .sort(function (a, b) { return a - b; }).map(function (r) { return s.rows.get(r); });
    });
  }

  T.add(G, 'Preset ZRF: migrasi idempoten, struktur bersih', function (ctx) {
    var a = zrf(), b = E3D.model.migrate(a);
    ctx.eq(JSON.stringify(a), JSON.stringify(b), 'migrate(migrate(x))');
    ctx.eq(E3D.model.checkStructure(a).length, 0, 'masalah struktur');
    var d = E3D.derive(a);
    ctx.eq(d.dbs.length, 250, 'jumlah DB');
    ctx.eq(d.mdbCount, 372, 'DB current di MDB');
    ctx.eq(d.missingPlaceholders.length, 0, 'placeholder tak dikenal');
    ctx.note('250 DB · 340 baris site order · 372 posisi MDB');
  });

  T.add(G, 'DB Register = sheet "ZRF DB Register" (urutan register, DB No, nama, deskripsi)', function (ctx) {
    return sheetRows(ctx, 'ZRF DB Register', 2).then(function (rows) {
      var cfg = zrf(), d = E3D.derive(cfg), no = 0, actual = [];
      d.disciplines.forEach(function (dd) {
        dd.register.forEach(function (r) {
          actual.push([++no, dd.disc.name, dd.disc.letter, dd.disc.team, r.item.label, r.item.code, r.func.letter, r.func.name,
            r.db, r.desc, r.dbno, cfg.dbAttributes.type, cfg.dbAttributes.access, cfg.dbAttributes.claim, r.site, r.item.note]);
        });
      });
      var expected = rows.map(function (c) {
        return [c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[12], c[13], c[14], c[15], v(c[16])];
      });
      ctx.rows(actual, expected, 'DB Register');
    });
  });

  T.add(G, 'Site Order = sheet "Site Order" (separator sebelum site di DB yang sama)', function (ctx) {
    return sheetRows(ctx, 'Site Order', 2).then(function (rows) {
      var d = E3D.derive(zrf()), n = 0, actual = [];
      var TYPE = { sepDiscipline: 'Separator - discipline', sepGroup: 'Separator - group', site: 'Site' };
      d.disciplines.forEach(function (dd) {
        dd.siteOrder.forEach(function (s) {
          actual.push([++n, dd.disc.name, TYPE[s.type], s.name, s.type === 'site' ? s.row.desc : '', s.row.db, s.row.dbno, s.group]);
        });
      });
      ctx.rows(actual, rows.map(function (c) { return [c[0], c[1], c[2], c[3], v(c[4]), c[5], c[6], v(c[7])]; }), 'Site Order');
    });
  });

  T.add(G, 'Zones = sheet "Zones" (2906 zone + 96 baris PENDING)', function (ctx) {
    return sheetRows(ctx, 'Zones', 4).then(function (rows) {
      var cfg = zrf(), d = E3D.derive(cfg), n = 0, actual = [], p = cfg.pendingZone;
      d.disciplines.forEach(function (dd) {
        dd.zones.forEach(function (z) {
          actual.push(z.pending
            ? [++n, dd.disc.name, dd.disc.letter, z.row.site, p.zone, p.purpose, p.docRef, p.status]
            : [++n, dd.disc.name, dd.disc.letter, z.row.site, z.name, z.purpose, z.docRef, z.status]);
        });
      });
      ctx.rows(actual, rows.map(function (c) { return c.slice(0, 8); }), 'Zones');
      ctx.note(actual.filter(function (r) { return r[7] !== 'PENDING'; }).length + ' zone + ' +
        actual.filter(function (r) { return r[7] === 'PENDING'; }).length + ' PENDING');
    });
  });

  T.add(G, 'Posisi MDB = ADD di B1 (1–250) dan 90-REFERENCE (251–372)', function (ctx) {
    return packageTexts(ctx).then(function (files) {
      var expected = [];
      Object.keys(files).sort().forEach(function (f) {
        if (!/B1-CREATE|90-REF/.test(f)) return;
        files[f].split('\r\n').forEach(function (l) {
          var m = /^ADD (\S+) (\d+)$/.exec(l);
          if (m) expected.push([m[1], Number(m[2])]);
        });
      });
      var d = E3D.derive(zrf());
      var actual = d.dbs.map(function (r) { return [r.db, r.mdbPos]; })
        .concat(d.references.filter(function (r) { return !r.pending; }).map(function (r) { return [r.db, r.mdbPos]; }));
      ctx.rows(actual, expected, 'ADD db n');
    });
  });

  T.add(G, 'Team: deskripsi dan status = 00-TEAMS', function (ctx) {
    return packageTexts(ctx).then(function (files) {
      var expected = [];
      files['00-TEAMS/ZRF-00-TEAMS-ADMIN.mac'].split('\r\n').forEach(function (l) {
        var m = /^(\$\* )?CREATE TEAM (\S+) DESC '(.*)'$/.exec(l);
        if (m) expected.push([m[2], m[3], !m[1]]);
      });
      var d = E3D.derive(zrf());
      var actual = d.disciplines.map(function (dd) { return [dd.disc.team, dd.teamDesc, !dd.disc.teamExists]; });
      var key = function (a, b) { return a[0] < b[0] ? -1 : 1; };
      ctx.rows(actual.sort(key), expected.sort(key), '00-TEAMS');
    });
  });

  T.add(G, 'Fluid code: parser fluid-codes.txt = preset (trim + spasi dirapikan)', function (ctx) {
    var res = E3D.tables.parseCodeList(new TextDecoder().decode(ctx.fixture(FLUID)));
    ctx.eq(res.errors.length, 0, 'error parser');
    var preset = zrf().codeLists.fluid.items.map(function (c) { return [c.code, c.desc]; });
    ctx.rows(res.items.map(function (c) { return [c.code, c.desc]; }), preset, 'fluid');
  });

  T.add(G, 'Validasi ZRF: 0 error', function (ctx) {
    var issues = E3D.validate(zrf()), s = E3D.summarizeIssues(issues);
    ctx.eq(s.error, 0, 'error: ' + issues.filter(function (i) { return i.level === 'error'; }).map(function (i) { return i.msg; }).join(' | '));
    ctx.eq(s.warning, 0, 'warning: ' + issues.filter(function (i) { return i.level === 'warning'; }).map(function (i) { return i.msg; }).join(' | '));
    ctx.note(issues.map(function (i) { return '[' + i.level + (i.fact ? ' · ' + i.fact : '') + '] ' + i.msg; }).join('\n'));
  });

  T.add(G, 'Cek bentrok ENI: 0 bentrok untuk ZRF', function (ctx) {
    return E3D.xlsx.read(ctx.fixture(ENI)).then(function (wb) {
      var res = E3D.tables.existingFromRows(E3D.tables.sheetToRows(wb.sheets[0]));
      ctx.eq(res.errors.length, 0, res.errors.join(' '));
      var cfg = zrf();
      cfg.existing.dbs = res.dbs;
      var clashes = E3D.validate(cfg).filter(function (i) { return /clash/.test(i.code); });
      ctx.eq(clashes.length, 0, clashes.map(function (i) { return i.msg; }).join(' | '));
      ctx.note(res.dbs.length + ' DB existing dibaca dari BASE-ENI.xlsx');
    });
  });

  // ---- Edge cases ----

  T.add(G, 'Batas: DB No bentrok dengan ENI → error (fakta 1.3)', function (ctx) {
    return E3D.xlsx.read(ctx.fixture(ENI)).then(function (wb) {
      var eni = E3D.tables.existingFromRows(E3D.tables.sheetToRows(wb.sheets[0])).dbs;
      var target = eni.find(function (x) { return x.dbno > 200 && x.dbno < 6000; });
      var cfg = zrf();
      cfg.existing.dbs = eni;
      cfg.dbNumber.base = target.dbno - 101;          // R-M1D = base + 1×100 + 1
      var hit = E3D.validate(cfg).filter(function (i) { return i.code === 'dbno-clash' && i.msg.indexOf('DESI-R-M1D') >= 0; });
      ctx.eq(hit.length, 1, 'error dbno-clash untuk R-M1D');
      ctx.eq(hit[0].fact, '1.3');
      ctx.note(hit[0].msg);
    });
  });

  T.add(G, 'Batas: disiplin tanpa item → warning, posisi MDB bergeser', function () {
    var cfg = zrf();
    cfg.disciplines[0].items = [];
    var d = E3D.derive(cfg), issues = E3D.validate(cfg, d);
    if (!issues.some(function (i) { return i.code === 'disc-empty'; })) throw new Error('warning disc-empty tidak muncul');
    if (d.dbs.length !== 225 || d.dbs[0].mdbPos !== 1 || d.dbs[0].disc.letter !== 'L') throw new Error('posisi MDB tidak bergeser');
  });

  T.add(G, 'Batas: grup kosong → info, separator grup tidak dibuat', function (ctx) {
    var cfg = zrf();
    cfg.items = cfg.items.filter(function (it) { return it.group !== 'HOOK-UP'; });
    var d = E3D.derive(cfg), issues = E3D.validate(cfg, d);
    ctx.ok(issues.some(function (i) { return i.code === 'group-empty'; }), 'info group-empty');
    ctx.ok(!d.disciplines[0].siteOrder.some(function (s) { return s.name === '/R----HOOK-UP----'; }), 'separator HOOK-UP masih ada');
    ctx.eq(d.dbs.find(function (r) { return r.item.code === 'FD'; }).dbno, 10151, 'DB No grup berikutnya tetap');
  });

  T.add(G, 'Batas: separator dimatikan → hanya site', function (ctx) {
    var cfg = zrf();
    cfg.separators.discipline = false; cfg.separators.group = false;
    var d = E3D.derive(cfg);
    ctx.eq(d.disciplines[0].siteOrder.length, 25);
    ctx.eq(d.disciplines[0].siteOrder[0].name, '/R-M1D');
    cfg.separators.group = true;
    ctx.eq(E3D.derive(cfg).disciplines[0].siteOrder[0].name, '/R----MODULES----', 'hanya separator grup');
  });

  T.add(G, 'Batas: grup > 10 item → warning + DB No dobel → error', function (ctx) {
    var cfg = zrf();
    for (var k = 7; k <= 11; k++) cfg.items.splice(5 + k - 6, 0, { code: 'M' + k, label: 'M' + k, desc: 'M' + k, group: 'MODULES', func: 'D', note: '' });
    var issues = E3D.validate(cfg);
    ctx.ok(issues.some(function (i) { return i.code === 'group-full' && i.level === 'warning'; }), 'warning group-full');
    var dup = issues.filter(function (i) { return i.code === 'dbno-dup'; });
    ctx.ok(dup.length > 0, 'error dbno-dup (slot 11 = PIPE-RACK)');
    ctx.note(dup[0].msg);
  });

  T.add(G, 'Batas: nama huruf kecil / karakter belum dites → warning (3.5, §9)', function (ctx) {
    var cfg = zrf();
    cfg.formats.siteName = '/{D}-{CODE}{F}x';
    ctx.ok(E3D.validate(cfg).some(function (i) { return i.code === 'name-case' && i.fact === '3.5'; }), 'name-case');
    cfg.formats.siteName = '/{D}={CODE}{F}';
    ctx.ok(E3D.validate(cfg).some(function (i) { return i.code === 'name-chars' && i.fact === '§9'; }), 'name-chars');
  });

  T.add(G, 'Batas: DB No di luar rentang / MDB > 1000 current → error (1.3, 1.7)', function (ctx) {
    var cfg = zrf();
    cfg.dbNumber.base = 7000;
    ctx.ok(E3D.validate(cfg).some(function (i) { return i.code === 'dbno-range'; }), 'dbno-range');
    cfg = zrf();
    for (var k = 0; k < 700; k++) cfg.references.push({ db: 'X/REF' + k, pending: false, note: '' });
    ctx.ok(E3D.validate(cfg).some(function (i) { return i.code === 'mdb-current' && i.fact === '1.7'; }), 'mdb-current');
  });

  T.add(G, 'Migrasi: tanpa versi / versi lebih baru ditolak; field opsional diisi', function (ctx) {
    function throws(fn) { try { fn(); return false; } catch (e) { return true; } }
    ctx.ok(throws(function () { E3D.model.migrate({}); }), 'tanpa schemaVersion');
    ctx.ok(throws(function () { E3D.model.migrate({ schemaVersion: 99 }); }), 'versi lebih baru');
    var c = E3D.model.migrate({ schemaVersion: 1, items: [{ code: 'A1' }] });
    ctx.eq(c.items[0].note, '', 'field item diisi');
    ctx.eq(c.dbNumber.base, 10000, 'default dbNumber');
  });
})(globalThis.E3D || (globalThis.E3D = {}));
