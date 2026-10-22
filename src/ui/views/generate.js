/* Step 8 — Generate: discipline filter, date, and downloads (ZIP package, XLSX register, JSON config).
   Errors block generation; MDB positions stay absolute when only some disciplines are generated. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon;

  function today() {
    var d = new Date(), p = function (n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function render(root, c) {
    var cfg = c.cfg, d = c.d, sum = E3D.summarizeIssues(c.issues);
    var discs = d.disciplines;
    var only = c.ui.only ? new Set(c.ui.only) : null;
    var date = c.ui.genDate || today();
    var pkg = E3D.macros.generate(cfg, { date: date, only: c.ui.only });
    var files = pkg.entries.filter(function (e) { return !e.dir; });
    var nSites = discs.reduce(function (n, dd) { return n + dd.siteOrder.length; }, 0);
    var nSep = discs.reduce(function (n, dd) { return n + dd.siteOrder.length - dd.display.length; }, 0);
    var nZones = discs.reduce(function (n, dd) { return n + dd.zones.filter(function (z) { return !z.pending; }).length; }, 0);
    var nPend = discs.reduce(function (n, dd) { return n + dd.zones.filter(function (z) { return z.pending; }).length; }, 0);
    var blocked = sum.error > 0;

    var status = blocked ? h('div', { class: 'alert err' }, icon('error-circle'), sum.error + ' error harus diperbaiki dulu.',
        h('button', { class: 'btn', style: { marginLeft: 'auto' }, on: { click: function () { c.nav('validate'); } } }, 'Lihat'))
      : sum.warning ? h('div', { class: 'alert warn' }, icon('alert'), sum.warning + ' warning. Paket tetap bisa dibuat.',
        h('button', { class: 'btn', style: { marginLeft: 'auto' }, on: { click: function () { c.nav('validate'); } } }, 'Lihat'))
      : h('div', { class: 'alert ok' }, icon('check-circle'), '0 error, 0 warning. Paket siap dibuat.');

    var chips = h('div', { class: 'chips' }, discs.map(function (dd) {
      var L = dd.disc.letter;
      return D.mdChip(L + ' · ' + dd.disc.name, !only || only.has(L), function (on) {
        var cur = new Set(c.ui.only || discs.map(function (x) { return x.disc.letter; }));
        if (on) cur.add(L); else cur.delete(L);
        c.setUi({ only: cur.size === discs.length ? null : Array.from(cur) });
      });
    }));

    var dateField = D.mdField('Tanggal di README', date, function (x) { c.ui.genDate = x; }, { support: 'YYYY-MM-DD' });
    var regName = pkg.vars.REGISTER, zipName = pkg.root + '.zip', jsonName = (cfg.project.code || 'project') + '-config.json';

    var outputs = h('div', null,
      out('zip', zipName, files.length + ' file · ' + (only ? 'disiplin ' + Array.from(only).join(', ') : 'semua disiplin') + ' · README, 00-TEAMS, B1/B2/B3, 90, 99',
        function () { downloadZip(c, date); }),
      out('sheet', regName, cfg.register.sheets.length + ' sheet · selalu lengkap untuk semua disiplin', function () { downloadXlsx(c, date); }),
      out('copy', jsonName, 'Konfigurasi lengkap: buka lagi nanti atau untuk mode perubahan', ui.files.exportConfig));
    function out(ic, name, sub, run) {
      return h('div', { class: 'out' }, h('div', { class: 'fi' }, icon(ic)), h('div', null, h('b', null, name), h('p', null, sub)),
        h('button', { class: 'btn', disabled: blocked && ic !== 'copy', on: { click: run } }, icon('download'), 'Unduh'));
    }

    var main = D.card({ title: 'Generate paket', icon: 'download', hint: 'Pilih disiplin. Posisi MDB tetap absolut; jalankan disiplin berurutan.',
      right: h('button', { class: 'btn', on: { click: function () { c.setUi({ only: null }); } } }, 'Pilih semua'),
      body: h('div', { class: 'inner' },
        h('div', { class: 'sumgrid' },
          h('div', null, h('small', null, 'Database'), h('b', null, d.dbs.length), h('span', null, discs.length + ' disiplin aktif')),
          h('div', null, h('small', null, 'Site + separator'), h('b', null, nSites), h('span', null, d.dbs.length + ' site · ' + nSep + ' separator')),
          h('div', null, h('small', null, 'Zone'), h('b', { style: { color: 'var(--md-sys-color-secondary)' } }, nZones), h('span', null, nPend ? '+ ' + nPend + ' baris PENDING di register' : 'tanpa PENDING'))),
        status,
        h('div', { class: 'section-label' }, 'Disiplin'), chips,
        h('div', { class: 'section-label' }, 'Output'), outputs,
        h('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '14px', alignItems: 'flex-start' } }, dateField,
          h('div', { class: 'row' }, h('button', { class: 'btn', on: { click: function () { c.nav('preview'); } } }, icon('eye'), 'Preview dulu'),
            h('button', { class: 'cta', disabled: blocked, on: { click: function () { downloadZip(c, date).then(function () { return downloadXlsx(c, date); }); } } },
              icon('download'), 'Generate ZIP + XLSX')))) });

    var list = h('div', { class: 'explorer', style: { maxHeight: '560px' } }, h('div', { class: 'er' }, icon('zip', 'sm'), h('b', null, pkg.root + '/')),
      pkg.entries.map(function (e) {
        var depth = e.path.replace(/\/$/, '').split('/').length;
        return h('div', { class: 'er' }, h('span', { class: 'ind' }, ' '.repeat(depth * 2) + (e.dir ? '▾' : '·')), e.dir ? h('b', null, e.path) : e.path.split('/').pop(),
          e.dir ? null : h('span', { class: 'meta' }, Math.max(1, Math.round(e.text.length / 1024)) + ' KB'));
      }));
    var tree = D.card({ title: 'Isi ZIP', icon: 'zip', hint: 'Struktur sama dengan paket ZRF (CRLF, ASCII).', body: h('div', { class: 'inner' }, list) });

    root.appendChild(h('div', { class: 'cols' }, main, tree));
  }

  function downloadZip(c, date) {
    var pkg = E3D.macros.generate(c.cfg, { date: date, only: c.ui.only });
    var bytes = E3D.zip.write(E3D.macros.toZipEntries(pkg, new Date()));
    D.download(pkg.root + '.zip', bytes, 'application/zip');
    D.snack(pkg.root + '.zip dibuat (' + pkg.entries.filter(function (e) { return !e.dir; }).length + ' file).');
    return Promise.resolve();
  }
  function downloadXlsx(c, date) {
    var reg = E3D.register.build(c.cfg, { date: date });
    return E3D.xlsx.write(reg).then(function (bytes) {
      D.download(reg.vars.REGISTER, bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      D.snack(reg.vars.REGISTER + ' dibuat.');
    });
  }

  ui.views.push({ key: 'generate', title: 'Generate', icon: 'download', render: render,
    refresh: function (root, c) { root.innerHTML = ''; render(root, c); },
    lead: 'Semua file dibuat di browser ini. Tidak ada data yang keluar dari komputer.',
    summary: function () { return 'ZIP + XLSX + JSON'; } });
})(globalThis.E3D || (globalThis.E3D = {}));
