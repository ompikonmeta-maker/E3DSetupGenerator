/* Phase 2: macro package text and ZIP, checked file by file against ZRF-SETUP-PACKAGE.zip. */
(function (E3D) {
  'use strict';
  var T = E3D.test, G = 'Fase 2 · macro & ZIP';
  var PKG = 'ZRF-SETUP-PACKAGE.zip';
  var DATE_LINE = /^Generated \d{4}-\d{2}-\d{2}\./m;

  function zrf() { return E3D.presets.zrf.build(); }
  function norm(s) { return s.replace(DATE_LINE, 'Generated <DATE>.'); }
  function fileOf(pkg, re) { return pkg.entries.find(function (e) { return re.test(e.path); }); }

  T.add(G, 'Golden: 34 file + folder identik per file dengan ZRF-SETUP-PACKAGE.zip (tanggal README dinormalisasi)', function (ctx) {
    return E3D.zip.read(ctx.fixture(PKG)).then(function (golden) {
      var dec = new TextDecoder();
      var mine = E3D.macros.toZipEntries(E3D.macros.generate(zrf(), { date: '2030-01-02' }), new Date());
      ctx.rows(mine.map(function (e) { return e.name; }), golden.map(function (e) { return e.name; }), 'daftar entri ZIP');
      var bad = [];
      golden.forEach(function (g, i) {
        if (g.dir) return;
        var a = norm(dec.decode(mine[i].data)), b = norm(dec.decode(g.data));
        if (a !== b) {
          var al = a.split('\r\n'), bl = b.split('\r\n'), k = 0;
          while (al[k] === bl[k]) k++;
          bad.push(g.name + ' baris ' + (k + 1) + '\n  dapat: ' + JSON.stringify(al[k]) + '\n  harus: ' + JSON.stringify(bl[k]));
        }
      });
      ctx.ok(!bad.length, bad.length + ' file beda\n' + bad.slice(0, 5).join('\n'));
      ctx.note(golden.filter(function (g) { return !g.dir; }).length + ' file identik');
    });
  });

  T.add(G, 'ZIP writer: CRC32 benar, baca ulang = isi sama', function (ctx) {
    ctx.eq(E3D.zip.crc32(new TextEncoder().encode('123456789')), 0xCBF43926, 'crc32 vektor standar');
    var entries = E3D.macros.toZipEntries(E3D.macros.generate(zrf(), { date: '2026-10-22' }), new Date(2026, 9, 22, 9, 5));
    var bytes = E3D.zip.write(entries);
    return E3D.zip.read(bytes).then(function (back) {
      ctx.eq(back.length, entries.length, 'jumlah entri');
      back.forEach(function (b, i) {
        ctx.eq(b.name, entries[i].name);
        if (!b.dir) ctx.eq(new TextDecoder().decode(b.data), new TextDecoder().decode(entries[i].data), b.name);
      });
      ctx.note('ZIP store ' + Math.round(bytes.length / 1024) + ' KB, ' + entries.length + ' entri');
    });
  });

  T.add(G, 'Format: CRLF, ASCII, tanpa REORDER, B2 tulis DB sekali per DB', function (ctx) {
    var pkg = E3D.macros.generate(zrf(), { date: '2026-10-22' });
    pkg.entries.forEach(function (e) {
      if (e.dir) return;
      ctx.ok(!/[^\r]\n/.test(e.text) && /\r\n$/.test(e.text), e.path + ': bukan CRLF');
      ctx.ok(!/[^\x00-\x7f]/.test(e.text), e.path + ': non-ASCII');
      ctx.ok(!/^\s*REORDER\b/m.test(e.text), e.path + ': ada REORDER');
    });
    var b2 = fileOf(pkg, /01-R-.*B2/).text.split('\r\n').filter(function (l) { return /^NEW SITE/.test(l); });
    var withDb = b2.filter(function (l) { return / DB /.test(l); }).length;
    ctx.eq(b2.length, 34, 'NEW SITE di B2 Equipment'); ctx.eq(withDb, 25, 'baris dengan DB (= jumlah DB)');
  });

  T.add(G, 'Generate hanya disiplin terpilih: posisi MDB tetap absolut', function (ctx) {
    var pkg = E3D.macros.generate(zrf(), { date: '2026-10-22', only: ['L'] });
    var discFiles = pkg.entries.filter(function (e) { return /^\d\d-[A-Z]-/.test(e.path) && !e.dir; });
    ctx.eq(discFiles.length, 3, 'file disiplin');
    ctx.ok(discFiles.every(function (e) { return /^02-L-ZRFPIP\//.test(e.path); }), 'hanya Piping');
    ctx.ok(/\r\nADD ZRFPIP\/DESI-L-M1D 26\r\n/.test(fileOf(pkg, /B1-CREATE/).text), 'ADD L-M1D 26');
  });

  T.add(G, 'Batas: separator dimatikan / disiplin tanpa zone sama sekali → tanpa B3', function (ctx) {
    var cfg = zrf();
    cfg.separators.discipline = false; cfg.separators.group = false;
    var b2 = fileOf(E3D.macros.generate(cfg), /01-R-.*B2/).text.split('\r\n').filter(function (l) { return /^NEW SITE/.test(l); });
    ctx.eq(b2.length, 25); ctx.eq(b2[0], 'NEW SITE /R-M1D DB ZRFEQP/DESI-R-M1D');
    cfg = zrf();
    cfg.zoneSets.dummy.zones = [];
    var pkg = E3D.macros.generate(cfg);
    ctx.ok(!fileOf(pkg, /05-E-.*B3/), 'B3 Electrical tidak dibuat');
    ctx.ok(!!fileOf(pkg, /01-R-.*B3/), 'B3 Equipment tetap ada');
  });

  T.add(G, 'README: daftar "perlu dites" muncul kalau template memakai {UNTESTED}', function (ctx) {
    var cfg = E3D.model.migrate({ schemaVersion: 1 });
    var base = zrf();
    ['project', 'functions', 'zoneSets', 'codeLists', 'disciplines', 'groups', 'items', 'references'].forEach(function (k) { cfg[k] = base[k]; });
    var readme = E3D.macros.generate(cfg, { date: '2026-10-22' }).entries[0].text;
    ctx.ok(/PERLU DITES|TO BE TESTED/.test(readme) && /NEW ZONE/.test(readme), 'baris perlu dites di README default');
  });

  T.add(G, 'Validasi: placeholder tak dikenal di teks paket → error', function (ctx) {
    var cfg = zrf();
    cfg.texts.headers.b1 = 'X {FOO}';
    ctx.ok(E3D.validate(cfg).some(function (i) { return i.code === 'placeholder' && /FOO/.test(i.msg); }));
  });
})(globalThis.E3D || (globalThis.E3D = {}));
