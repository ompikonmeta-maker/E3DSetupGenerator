/* Step 6 — Preview: Model Explorer order for the selected discipline, every macro file
   exactly as it goes into the ZIP, and the register sheets. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon;
  var MAX_LINES = 1500, MAX_ROWS = 80;

  function render(root, c) {
    var dd = c.dd, pkg = E3D.macros.generate(c.cfg);
    var tree = h('div', { class: 'explorer' });
    if (dd) {
      var zones = {};
      dd.zones.forEach(function (z) { if (!z.pending) zones[z.row.site] = (zones[z.row.site] || 0) + 1; });
      tree.appendChild(h('div', { class: 'er' }, h('span', { class: 'ind' }, '▾'), h('b', null, 'WORLD')));
      var lastDb = null;
      dd.siteOrder.forEach(function (s) {
        var newDb = s.row.db !== lastDb; lastDb = s.row.db;
        tree.appendChild(h('div', { class: 'er', title: s.row.db },
          h('span', { class: 'ind' }, '  ' + (s.type === 'site' ? '▸' : '·')), h('span', { class: s.type === 'site' ? '' : 'sep' }, s.name),
          h('span', { class: 'meta' }, s.type === 'site' ? h('span', { class: 'zc' }, (zones[s.name] || 0) + ' zone') : null,
            h('span', null, newDb ? 'DB ' + s.row.dbno : ' '), h('span', null, '#' + s.row.mdbPos))));
      });
      if (!dd.siteOrder.length) tree.appendChild(h('div', { class: 'empty' }, 'Disiplin ini tidak punya item.'));
    }
    var explorer = D.card({ title: 'Model Explorer', icon: 'tree', hint: 'Di dalam satu DB, urutan site = urutan pembuatan (fakta 3.4). Urutan antar-DB belum terverifikasi (§9).',
      right: c.disc ? h('span', { class: 'pill mut' }, c.disc.letter + ' · ' + c.disc.name) : null, body: h('div', { class: 'inner' }, tree) });

    var tab = c.ui.previewTab || 'macro';
    var seg = h('md-segmented-button', null, h('button', { 'data-value': 'macro', selected: tab === 'macro' }, 'Macro'),
      h('button', { 'data-value': 'register', selected: tab === 'register' }, 'Register'));
    seg.addEventListener('change', function (e) { c.setUi({ previewTab: e.detail.value }); });
    var right = tab === 'register' ? registerCard(c, seg) : macroCard(c, pkg, seg);
    root.appendChild(h('div', { class: 'cols even' }, explorer, right));
  }

  function macroCard(c, pkg, seg) {
    var files = pkg.entries.filter(function (e) { return !e.dir && (!e.disc || !c.disc || e.disc.disc === c.disc); });
    var file = files.find(function (e) { return e.path === c.ui.file; }) || files.find(function (e) { return e.kind === 'b2'; }) || files[0];
    var chips = h('div', { class: 'ftabs' }, files.map(function (e) {
      var n = e.path.split('/').pop().replace(/\.(mac|txt)$/, '');
      return h('button', { class: 'ftab' + (e === file ? ' on' : ''), on: { click: function () { c.setUi({ file: e.path }); } } }, icon(e.kind === 'readme' ? 'info' : 'file'), n);
    }));
    var lines = file ? file.text.split('\r\n') : [];
    if (lines[lines.length - 1] === '') lines.pop();
    var html = lines.slice(0, MAX_LINES).map(function (l, i) {
      var t = /^\$\*/.test(l) ? '<span class="c">' + D.esc(l) + '</span>'
        : D.esc(l).replace(/^(NEW SITE|NEW ZONE|CREATE DB|CREATE TEAM|SET MDB|SET TEAM|ADD|CURRENT|TADD|SAVEWORK)\b/, '<span class="k">$1</span>').replace(/ (DB|DBNO|DESC|ACCESS|CLAIM) /g, ' <span class="k">$1</span> ');
      return '<span class="ln">' + (i + 1) + '</span>' + t;
    }).join('\n') + (lines.length > MAX_LINES ? '\n<span class="c">… ' + (lines.length - MAX_LINES) + ' baris lagi (lengkap di ZIP)</span>' : '');
    return D.card({ title: 'Isi paket', icon: 'file', hint: file ? D.esc(pkg.root + '/' + file.path) + ' · ' + lines.length + ' baris · CRLF' : '',
      right: h('div', { class: 'row' }, seg, file ? h('button', { class: 'btn', on: { click: function () { D.copyText(file.text).then(function () { D.snack('Isi file disalin.'); }); } } }, icon('copy'), 'Salin') : null),
      body: h('div', null, chips, h('div', { class: 'inner' }, h('pre', { class: 'src', html: html }))) });
  }

  function registerCard(c, seg) {
    var reg = E3D.register.build(c.cfg);
    var sh = reg.sheets.find(function (s) { return s.name === c.ui.sheet; }) || reg.sheets[0];
    var chips = h('div', { class: 'ftabs' }, reg.sheets.map(function (s) {
      return h('button', { class: 'ftab' + (s === sh ? ' on' : ''), on: { click: function () { c.setUi({ sheet: s.name }); } } }, icon('sheet'), s.name);
    }));
    var table = h('table', { class: 'sheet' });
    if (sh) {
      var ncol = sh.rows.reduce(function (m, r) { return Math.max(m, r.cells.length); }, 0);
      sh.rows.slice(0, MAX_ROWS).forEach(function (r) {
        var tr = h('tr', { class: r.role }, h('td', { class: 'n' }, r.r));
        for (var i = 0; i < ncol; i++) tr.appendChild(h('td', null, r.cells[i] == null ? '' : String(r.cells[i])));
        table.appendChild(tr);
      });
    }
    return D.card({ title: 'Isi register', icon: 'sheet', hint: sh ? sh.rows.length + ' baris di sheet ini' + (sh.rows.length > MAX_ROWS ? ' (' + MAX_ROWS + ' pertama)' : '') : '',
      right: seg, body: h('div', null, chips, h('div', { class: 'inner tablewrap', style: { maxHeight: '640px', overflow: 'auto' } }, table)) });
  }

  ui.views.push({ key: 'preview', title: 'Preview', icon: 'eye', render: render,
    lead: 'Hasil persis yang akan masuk ZIP dan register. Pilih disiplin di panel kiri.',
    summary: function (c) {
      var s = c.d.disciplines.reduce(function (n, dd) { return n + dd.siteOrder.length; }, 0);
      return s + ' site · ' + c.d.dbs.length + ' DB';
    } });
})(globalThis.E3D || (globalThis.E3D = {}));
