/* Phase 3: register workbook, checked cell by cell (values only) against ZRF-E3D-Register.xlsx. */
(function (E3D) {
  'use strict';
  var T = E3D.test, G = 'Fase 3 · register XLSX';
  var REG = 'ZRF-E3D-Register.xlsx';

  function zrf() { return E3D.presets.zrf.build(); }
  function empty(v) { return v === null || v === undefined || v === ''; }

  // { 'A1': value } for non-empty cells.
  function cellMap(sheet) {
    var out = {};
    sheet.rows.forEach(function (cells, r) {
      cells.forEach(function (v, i) { if (!empty(v)) out[r + ':' + i] = v; });
    });
    return out;
  }
  function ref(k) { var p = k.split(':'); return String.fromCharCode(65 + Number(p[1])) + p[0]; }

  function compareBooks(ctx, mine, golden) {
    ctx.rows(mine.sheets.map(function (s) { return s.name; }), golden.sheets.map(function (s) { return s.name; }), 'urutan sheet');
    var total = 0, bad = [];
    golden.sheets.forEach(function (gs, i) {
      var a = cellMap(mine.sheets[i]), b = cellMap(gs);
      Object.keys(Object.assign({}, a, b)).forEach(function (k) {
        total++;
        if (a[k] !== b[k] && bad.length < 8)
          bad.push(gs.name + '!' + ref(k) + '\n  dapat: ' + JSON.stringify(a[k]) + '\n  harus: ' + JSON.stringify(b[k]));
      });
    });
    ctx.ok(!bad.length, 'sel beda:\n' + bad.join('\n'));
    return total;
  }

  T.add(G, 'Golden: isi sel 10 sheet identik dengan ZRF-E3D-Register.xlsx (tulis → baca ulang)', function (ctx) {
    var reg = E3D.register.build(zrf(), { date: '2026-10-21' });
    ctx.eq(reg.missing.length, 0, 'placeholder tak dikenal: ' + reg.missing.join(', '));
    return Promise.all([E3D.xlsx.write(reg).then(E3D.xlsx.read), E3D.xlsx.read(ctx.fixture(REG))]).then(function (b) {
      var n = compareBooks(ctx, b[0], b[1]);
      ctx.note(n + ' sel dibandingkan, semua sama');
    });
  });

  T.add(G, 'Struktur XLSX: part wajib ada, sheet pakai inlineStr + angka', function (ctx) {
    return E3D.xlsx.write(E3D.register.build(zrf())).then(function (bytes) {
      ctx.note('Register ' + Math.round(bytes.length / 1024) + ' KB (deflate)');
      return E3D.zip.read(bytes);
    }).then(function (entries) {
      var names = entries.map(function (e) { return e.name; });
      ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet10.xml']
        .forEach(function (n) { ctx.ok(names.indexOf(n) >= 0, 'part ' + n + ' tidak ada'); });
      var s4 = new TextDecoder().decode(entries.find(function (e) { return e.name === 'xl/worksheets/sheet4.xml'; }).data);
      ctx.ok(/<c r="K2" s="\d+"><v>10101<\/v><\/c>/.test(s4), 'DB No sebagai angka');
      ctx.ok(/t="inlineStr"><is><t xml:space="preserve">ZRFEQP\/DESI-R-M1D<\/t>/.test(s4), 'nama DB sebagai inlineStr');
    });
  });

  T.add(G, 'Angka di teks ikut config: 1 disiplin dimatikan → Setup Steps & Package Files berubah', function (ctx) {
    var cfg = zrf();
    cfg.disciplines.find(function (d) { return d.letter === 'N'; }).active = false;
    var reg = E3D.register.build(cfg);
    var ss = reg.sheets.find(function (s) { return s.name === 'Setup Steps'; });
    var c10 = ss.rows.find(function (r) { return r.r === 10; }).cells[2];
    ctx.ok(!/10 N/.test(c10) && /09 T$/.test(c10), 'urutan disiplin: ' + c10);
    var e11 = ss.rows.find(function (r) { return r.r === 11; }).cells[4];
    ctx.eq(e11, 'MDB-ZRF total 347', 'total MDB');
    var pf = reg.sheets.find(function (s) { return s.name === 'Package Files'; });
    ctx.ok(pf.rows.some(function (r) { return r.cells[5] === 'catalogue/spec + ENI FEED, pos 226-347'; }), 'posisi referensi');
  });

  T.add(G, 'Validasi: nama sheet melanggar aturan Excel → error', function (ctx) {
    var cfg = zrf();
    cfg.register.sheets[0].name = 'Setup/Steps';
    cfg.register.sheets[1].name = 'X'.repeat(40);
    var errs = E3D.validate(cfg).filter(function (i) { return i.code === 'sheet-name'; });
    ctx.eq(errs.length, 2, 'error sheet-name');
  });
})(globalThis.E3D || (globalThis.E3D = {}));
