/* Step 5 — MDB references (catalogue/foreign DBs added after the project DBs) and the
   existing DB/site lists used for clash checks. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon;

  // Accepts "DB", "DB<TAB>note", or macro lines like "ADD DB 251" / "$* ADD DB   <- note" (commented = pending).
  function parseRefs(text) {
    var out = [];
    String(text).split(/\r\n|\r|\n/).forEach(function (line) {
      var s = line.trim();
      if (!s || /^SET MDB/i.test(s)) return;
      var pending = /^\$\*/.test(s);
      s = s.replace(/^\$\*\s*/, '');
      var note = '';
      var m = /^(.*?)\s*<-\s*(.*)$/.exec(s);
      if (m) { s = m[1]; note = m[2].trim(); }
      var tab = s.split('\t');
      if (tab.length > 1) { s = tab[0]; note = note || tab.slice(1).join(' ').trim(); }
      s = s.replace(/^(ADD|CURRENT)\s+/i, '').replace(/\s+\d+$/, '').trim();
      if (!s || /\s/.test(s)) return;
      out.push({ db: s, pending: pending, note: note });
    });
    return out;
  }

  function render(root, c) {
    var cfg = c.cfg, pos = new Map();
    c.d.references.forEach(function (r) { pos.set(r.ref, r.mdbPos); });
    var tb = h('tbody');
    cfg.references.forEach(function (r, i) {
      tb.appendChild(h('tr', { dataset: { drop: i } },
        h('td', { class: 'grip', draggable: 'true', dataset: { drag: i } }, icon('grip')),
        h('td', null, D.cell(r.db, function (x) { c.mutate(function (k) { k.references[i].db = x.trim(); }); }, { cls: 'mono wide' })),
        h('td', null, h('div', { class: 'row' }, D.mdSwitch(r.pending, function (on) { c.mutate(function (k) { k.references[i].pending = on; }, true); }, 'Pending'),
          r.pending ? h('span', { class: 'pill sm warn' }, 'di-comment') : null)),
        h('td', null, D.cell(r.note, function (x) { c.mutate(function (k) { k.references[i].note = x; }); }, { cls: 'mid', placeholder: '—', title: 'Catatan, ditulis setelah <- pada baris pending' })),
        h('td', { class: 'mono muted', style: { textAlign: 'right' } }, pos.get(r) ? '#' + pos.get(r) : '–'),
        h('td', null, h('button', { class: 'iconbtn', on: { click: function () { c.mutate(function (k) { k.references.splice(i, 1); }, true); } } }, icon('x')))));
    });
    tb.appendChild(h('tr', { class: 'addrow', dataset: { drop: 'end' } }, h('td', { colspan: 6 }, h('button', { on: { click: function () {
      c.mutate(function (k) { k.references.push({ db: '', pending: false, note: '' }); }, true);
    } } }, icon('plus'), 'Tambah DB referensi'))));
    D.dragRows(tb, function (from, to) {
      c.mutate(function (k) {
        var f = Number(from), m = k.references.splice(f, 1)[0];
        k.references.splice(to === 'end' ? k.references.length : Number(to) - (Number(to) > f ? 1 : 0), 0, m);
      }, true);
    });
    var refs = D.card({ title: 'Referensi MDB', icon: 'link', hint: 'Ditambahkan setelah DB project (macro 90). Pending = baris di-comment, tidak memakai posisi.',
      right: h('button', { class: 'btn', on: { click: function () { pasteRefs(c); } } }, icon('copy'), 'Paste list'),
      body: h('div', { class: 'inner tablewrap', style: { padding: '8px 10px', maxHeight: '640px', overflow: 'auto' } },
        h('table', { class: 't' }, h('thead', null, h('tr', null, h('th'), h('th', null, 'DB'), h('th', null, 'Pending'), h('th', null, 'Catatan'), h('th', { style: { textAlign: 'right' } }, 'MDB'), h('th'))), tb)) });

    var bySrc = E3D.util.countBy(cfg.existing.dbs, function (x) { return x.source || '(tanpa sumber)'; });
    var srcRows = Array.from(bySrc.keys()).map(function (k) { return h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, k)), h('span', { class: 'count' }, bySrc.get(k) + ' DB')); });
    var existing = D.card({ title: 'DB existing', icon: 'database', hint: 'Untuk cek bentrok DB No (fakta 1.3) dan nama DB. Import XLSX/CSV dengan kolom DB dan DB No.',
      right: h('div', { class: 'row' }, h('button', { class: 'btn', on: { click: function () { importExisting(c); } } }, icon('upload'), 'Import'),
        cfg.existing.dbs.length ? h('button', { class: 'btn danger', on: { click: function () { c.mutate(function (k) { k.existing.dbs = []; }, true); } } }, 'Kosongkan') : null),
      body: h('div', { class: 'inner' }, srcRows.length ? srcRows : h('div', { class: 'empty' }, h('b', null, 'Belum ada data'), 'Contoh: BASE-ENI.xlsx')) });

    var ta = h('textarea', { class: 'paste', placeholder: '/R-LQD\tENI\n/L-LQD\tENI' });
    ta.value = cfg.existing.sites.map(function (s) { return s.source ? s.name + '\t' + s.source : s.name; }).join('\n');
    ta.addEventListener('change', function () {
      c.mutate(function (k) {
        k.existing.sites = ta.value.split(/\r?\n/).map(function (l) { var p = l.split('\t'); return { name: p[0].trim(), source: (p[1] || '').trim() }; })
          .filter(function (x) { return x.name; });
      });
    });
    var sites = D.card({ title: 'Site existing', icon: 'tree', hint: 'Satu nama per baris (opsional: TAB sumber). Bentrok = warning (error 41,12 Name already used, §7).',
      body: h('div', { class: 'inner' }, ta) });

    var clashes = c.issues.filter(function (i) { return /clash/.test(i.code); });
    var check = D.card({ title: 'Hasil cek bentrok', icon: 'shield', hint: cfg.existing.dbs.length + ' DB dan ' + cfg.existing.sites.length + ' site existing dicek',
      body: h('div', { class: 'inner' }, clashes.length ? h('div', { class: 'intel' }, clashes.slice(0, 50).map(function (i) {
        return h('div', { class: 'it' }, h('div', { class: 'ib ' + (i.level === 'error' ? 'err' : 'warn') }, icon('alert')),
          h('div', null, h('b', null, i.msg, i.fact ? h('span', { class: 'fact' }, 'fakta ' + i.fact) : null)));
      })) : h('div', { class: 'alert ok', style: { margin: 0 } }, icon('check-circle'), 'Tidak ada bentrok nomor, nama DB, atau nama site.')) });

    root.appendChild(h('div', { class: 'cols' }, refs, h('div', { class: 'stack' }, check, existing, sites)));
  }

  function pasteRefs(c) {
    var ta = h('textarea', { class: 'paste', style: { width: 'min(640px, 80vw)', minHeight: '40vh' }, placeholder: 'MASTER/STLCATA\nADD MASTER/PADD 253\n$* ADD SAIMAS/UDA_ALL   <- SMA pending' });
    D.dialog('Paste DB referensi', h('div', null, ta, h('div', { class: 'field-ex' }, 'Satu DB per baris. Baris macro (ADD …) juga bisa; baris $* = pending, teks setelah <- = catatan.')), [
      { label: 'Batal', run: function () {} },
      { label: 'Tambahkan', run: function () { return apply('append'); } },
      { label: 'Ganti semua', primary: true, run: function () { return apply('replace'); } }]);
    function apply(how) {
      var list = parseRefs(ta.value);
      if (!list.length) { D.snack('Tidak ada DB yang terbaca.'); return false; }
      c.mutate(function (k) { k.references = how === 'replace' ? list : k.references.concat(list); }, true);
      D.snack(list.length + ' DB referensi dibaca.');
    }
  }

  function importExisting(c) {
    D.pickFile('.xlsx,.csv,.txt').then(function (files) {
      if (!files.length) return;
      var f = files[0], name = f.name.replace(/\.[^.]+$/, '');
      var rowsP = /\.xlsx$/i.test(f.name)
        ? D.readBytes(f).then(E3D.xlsx.read).then(function (wb) { return E3D.tables.sheetToRows(wb.sheets[0]); })
        : f.text().then(E3D.tables.parseCsv);
      rowsP.then(function (rows) {
        var res = E3D.tables.existingFromRows(rows, name);
        if (!res.dbs.length) { D.snack(res.errors.join(' ') || 'Tidak ada DB yang terbaca.'); return; }
        c.mutate(function (k) {
          var have = new Set(k.existing.dbs.map(function (x) { return x.name.toUpperCase(); }));
          res.dbs.forEach(function (x) { if (!have.has(x.name.toUpperCase())) k.existing.dbs.push(x); });
        }, true);
        D.snack(res.dbs.length + ' DB dibaca dari ' + f.name + (res.errors.length ? ' (' + res.errors.length + ' baris bermasalah)' : '') + '.');
      }).catch(function (e) { D.snack('Gagal membaca ' + f.name + ': ' + (e.message || e)); });
    });
  }

  ui.views.push({ key: 'refs', title: 'Referensi', icon: 'link', render: render,
    lead: 'DB catalog/foreign yang ikut dibuka di MDB, plus daftar DB dan site existing untuk cek bentrok.',
    summary: function (c) { return c.cfg.references.length + ' ref · ' + c.cfg.existing.dbs.length + ' existing'; } });
  E3D.ui.parseRefs = parseRefs;
})(globalThis.E3D || (globalThis.E3D = {}));
