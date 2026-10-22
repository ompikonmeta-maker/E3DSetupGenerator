/* Step 4 — Zones: discipline zone templates, zone sets used by functions (e.g. Dummy),
   code lists that expand one zone per code (e.g. fluid codes), and the PENDING register row. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon;

  // Editable zone template table. get(k) returns the zone array inside config k.
  function zoneTable(c, zones, get, withForEach) {
    var listOpts = [{ value: '', label: 'Satu zone per site' }].concat(Object.keys(c.cfg.codeLists).map(function (k) {
      return { value: k, label: 'Per kode: ' + (c.cfg.codeLists[k].name || k) };
    }));
    var tb = h('tbody');
    zones.forEach(function (z, i) {
      function set(f) { return function (x) { c.mutate(function (k) { get(k)[i][f] = f === 'suffix' ? x.trim().toUpperCase() : x; }, f === 'forEach' || f === 'suffix'); }; }
      tb.appendChild(h('tr', { dataset: { drop: i } },
        h('td', { class: 'grip', draggable: 'true', dataset: { drag: i } }, icon('grip')),
        h('td', null, D.cell(z.suffix, set('suffix'), { cls: 'mono', placeholder: '-EQUI' })),
        h('td', { class: 'wrap' }, D.cell(z.purpose, set('purpose'), { cls: 'wide', placeholder: 'Kegunaan' })),
        h('td', null, D.cell(z.docRef, set('docRef'), { cls: 'num', placeholder: 'Doc' })),
        h('td', null, D.cell(z.status, set('status'), { cls: 'mid', placeholder: '—' })),
        withForEach ? h('td', null, D.select(listOpts, z.forEach || '', set('forEach'))) : null,
        h('td', null, h('button', { class: 'iconbtn', title: 'Hapus zone', on: { click: function () { c.mutate(function (k) { get(k).splice(i, 1); }, true); } } }, icon('x')))));
    });
    var span = withForEach ? 7 : 6;
    tb.appendChild(h('tr', { class: 'addrow', dataset: { drop: 'end' } }, h('td', { colspan: span }, h('button', { on: { click: function () {
      c.mutate(function (k) { get(k).push({ suffix: '', purpose: '', docRef: '', status: '', forEach: '' }); }, true);
    } } }, icon('plus'), 'Tambah zone'))));
    D.dragRows(tb, function (from, to) {
      c.mutate(function (k) {
        var list = get(k), f = Number(from), m = list.splice(f, 1)[0];
        list.splice(to === 'end' ? list.length : Number(to) - (Number(to) > f ? 1 : 0), 0, m);
      }, true);
    });
    return h('table', { class: 't' }, h('thead', null, h('tr', null, h('th'), h('th', null, 'Suffix'), h('th', null, 'Purpose'), h('th', null, 'Doc ref'),
      h('th', null, 'Status'), withForEach ? h('th', null, 'Ulang') : null, h('th'))), tb);
  }

  function render(root, c) {
    var cfg = c.cfg, disc = c.disc, dd = c.dd;
    if (!disc) { root.appendChild(h('div', { class: 'empty' }, h('b', null, 'Belum ada disiplin'), 'Tambahkan di langkah 2.')); return; }
    var di = cfg.disciplines.indexOf(disc);
    var nZones = dd ? dd.zones.filter(function (z) { return !z.pending; }).length : 0;
    var status = disc.zones.length ? h('span', { class: 'pill ok' }, icon('check-circle'), nZones + ' zone')
      : h('span', { class: 'pill warn' }, icon('alert'), 'PENDING');

    var ex = h('div', { class: 'explorer', style: { maxHeight: '420px' } });
    if (dd) {
      var shown = 0, lastSite = null;
      dd.zones.some(function (z) {
        if (z.row.site !== lastSite) { ex.appendChild(h('div', { class: 'er' }, h('span', { class: 'ind' }, '▸'), z.row.site, h('span', { class: 'meta' }, z.row.func.name))); lastSite = z.row.site; }
        ex.appendChild(h('div', { class: 'er' }, h('span', { class: 'ind' }, '   ·'),
          z.pending ? h('span', { class: 'muted' }, cfg.pendingZone.zone) : z.name, h('span', { class: 'meta' }, z.pending ? 'PENDING' : (z.status || ''))));
        return ++shown > 60;
      });
    }

    var main = D.card({ title: 'Zone ' + disc.letter + ' · ' + (disc.name || ''), icon: 'grid', right: status,
      hint: 'Dipakai untuk site dengan function "Zone disiplin". Kosongkan = PENDING (B3 hanya berisi zone dari set function lain).',
      body: h('div', { class: 'inner tablewrap', style: { padding: '8px 10px' } }, zoneTable(c, disc.zones, function (k) { return k.disciplines[di].zones; }, true)) });
    var preview = D.card({ title: 'Contoh hasil', icon: 'eye', hint: 'Site → zone untuk disiplin ini (60 baris pertama)', body: h('div', { class: 'inner' }, ex) });

    var sets = Object.keys(cfg.zoneSets).map(function (key) {
      var zs = cfg.zoneSets[key];
      var users = cfg.functions.filter(function (f) { return f.zones === key; }).map(function (f) { return f.letter; });
      return D.card({ title: 'Set zone: ' + (zs.name || key), icon: 'grid',
        hint: 'Dipakai function: <b>' + (users.join(', ') || 'belum ada') + '</b> (atur di langkah 1). Berlaku untuk semua disiplin.',
        right: h('div', { class: 'row' }, D.cell(zs.name, function (x) { c.mutate(function (k) { k.zoneSets[key].name = x; }, true); }, { placeholder: 'Nama set' }),
          users.length ? null : h('button', { class: 'iconbtn', title: 'Hapus set', on: { click: function () { c.mutate(function (k) { delete k.zoneSets[key]; }, true); } } }, icon('x'))),
        body: h('div', { class: 'inner tablewrap', style: { padding: '8px 10px' } }, zoneTable(c, zs.zones, function (k) { return k.zoneSets[key].zones; }, false)) });
    });
    var addSet = h('button', { class: 'btn', on: { click: function () {
      c.mutate(function (k) { var n = 1; while (k.zoneSets['set' + n]) n++; k.zoneSets['set' + n] = { name: 'Set ' + n, zones: [] }; }, true);
    } } }, icon('plus'), 'Tambah set zone');

    var lists = Object.keys(cfg.codeLists).map(function (key) { return codeListCard(c, key); });
    var addList = h('button', { class: 'btn', on: { click: function () {
      c.mutate(function (k) { var n = 1; while (k.codeLists['list' + n]) n++; k.codeLists['list' + n] = { name: 'Code list ' + n, items: [] }; }, true);
    } } }, icon('plus'), 'Tambah code list');

    var p = cfg.pendingZone;
    var pending = D.card({ title: 'Baris PENDING di register', icon: 'alert', hint: 'Ditulis di sheet Zones untuk site tanpa zone.',
      body: h('div', { class: 'inner' }, h('div', { class: 'form' },
        D.mdField('Zone', p.zone, function (x) { c.mutate(function (k) { k.pendingZone.zone = x; }); }),
        D.mdField('Purpose', p.purpose, function (x) { c.mutate(function (k) { k.pendingZone.purpose = x; }); }),
        D.mdField('Doc ref', p.docRef, function (x) { c.mutate(function (k) { k.pendingZone.docRef = x; }); }),
        D.mdField('Status', p.status, function (x) { c.mutate(function (k) { k.pendingZone.status = x; }); }))) });

    root.appendChild(h('div', { class: 'cols side' }, h('div', { class: 'stack' }, main, sets, h('div', null, addSet)),
      h('div', { class: 'stack' }, preview, lists, h('div', null, addList), pending)));
  }

  function codeListCard(c, key) {
    var list = c.cfg.codeLists[key];
    var used = c.cfg.disciplines.filter(function (d) { return d.zones.some(function (z) { return z.forEach === key; }); }).map(function (d) { return d.letter; });
    var rows = list.items.slice(0, 8).map(function (it) {
      return h('tr', null, h('td', { class: 'mono' }, it.code), h('td', { class: 'wrap' }, it.desc), h('td', { class: 'wrap muted' }, it.note));
    });
    return D.card({ title: 'Code list: ' + (list.name || key), icon: 'file',
      hint: list.items.length + ' kode · dipakai disiplin: <b>' + (used.join(', ') || 'belum ada') + '</b>',
      right: h('div', { class: 'row' },
        h('button', { class: 'btn', on: { click: function () { pasteCodes(c, key); } } }, icon('copy'), 'Paste'),
        h('button', { class: 'btn', on: { click: function () { importCodes(c, key); } } }, icon('upload'), 'Import .txt'),
        h('button', { class: 'btn', on: { click: function () { editCodes(c, key); } } }, 'Edit semua')),
      body: h('div', { class: 'inner tablewrap', style: { padding: '8px 10px' } },
        h('table', { class: 't' }, h('thead', null, h('tr', null, h('th', null, 'Code'), h('th', null, 'Deskripsi'), h('th', null, 'Catatan'))),
          h('tbody', null, rows, list.items.length > 8 ? h('tr', null, h('td', { colspan: 3, class: 'muted' }, '… ' + (list.items.length - 8) + ' kode lagi')) : null))) });
  }

  function applyCodes(c, key, text, how) {
    var res = E3D.tables.parseCodeList(text);
    if (res.errors.length) { D.snack(res.errors.slice(0, 2).join(' ') + (res.errors.length > 2 ? ' …' : '')); return false; }
    c.mutate(function (k) {
      var list = k.codeLists[key];
      if (how === 'replace') {
        var notes = new Map(list.items.map(function (it) { return [it.code, it.note]; }));
        list.items = res.items.map(function (it) { return { code: it.code, desc: it.desc, note: notes.get(it.code) || '' }; });
      } else {
        var have = new Set(list.items.map(function (it) { return it.code; }));
        res.items.forEach(function (it) { if (!have.has(it.code)) list.items.push(it); });
      }
    }, true);
    D.snack(res.items.length + ' kode dibaca.');
  }

  function pasteCodes(c, key) {
    var ta = h('textarea', { class: 'paste', placeholder: 'AD\tAMINE CLOSED DRAIN\nAE\tCITRIC ACID (FOR MEG)', style: { width: 'min(640px, 80vw)', minHeight: '40vh' } });
    D.dialog('Paste code list (KODE TAB deskripsi)', h('div', null, ta, h('div', { class: 'field-ex' }, 'Copy dua kolom dari Excel. Spasi berlebih dirapikan. Catatan yang sudah ada dipertahankan.')), [
      { label: 'Batal', run: function () {} },
      { label: 'Tambahkan', run: function () { return applyCodes(c, key, ta.value, 'append'); } },
      { label: 'Ganti semua', primary: true, run: function () { return applyCodes(c, key, ta.value, 'replace'); } }]);
  }
  function importCodes(c, key) {
    D.pickFile('.txt,.tsv,text/plain').then(function (files) {
      if (files.length) files[0].text().then(function (t) { applyCodes(c, key, t, 'replace'); });
    });
  }
  function editCodes(c, key) {
    var list = c.cfg.codeLists[key], tb = h('tbody');
    list.items.forEach(function (it, i) {
      function set(f) { return function (x) { c.mutate(function (k) { k.codeLists[key].items[i][f] = f === 'code' ? x.trim() : x; }); }; }
      tb.appendChild(h('tr', null, h('td', null, D.cell(it.code, set('code'), { cls: 'code' })), h('td', null, D.cell(it.desc, set('desc'))),
        h('td', null, D.cell(it.note, set('note'))),
        h('td', null, h('button', { class: 'iconbtn', on: { click: function (e) { e.target.closest('tr').remove(); c.mutate(function (k) { k.codeLists[key].items.splice(k.codeLists[key].items.indexOf(it), 1); }); } } }, icon('x')))));
    });
    var name = D.cell(list.name, function (x) { c.mutate(function (k) { k.codeLists[key].name = x; }); }, { placeholder: 'Nama list' });
    D.dialog('Code list', h('div', { style: { width: 'min(860px, 82vw)' } }, h('div', { class: 'row', style: { marginBottom: '8px' } }, 'Nama', name),
      h('div', { style: { maxHeight: '58vh', overflow: 'auto' } }, h('table', { class: 't' }, tb))),
      [{ label: 'Tutup', primary: true, run: function () { c.setUi({}); } }]);
  }

  ui.views.push({ key: 'zones', title: 'Zone', icon: 'grid', render: render,
    lead: 'Zone per disiplin dibuat di bawah setiap site (WORLD > SITE > ZONE, fakta 3.7). Disiplin tanpa aturan zone = PENDING.',
    summary: function (c) {
      var p = c.d.disciplines.filter(function (dd) { return dd.pending; }).length;
      var n = c.d.disciplines.reduce(function (s, dd) { return s + dd.zones.filter(function (z) { return !z.pending; }).length; }, 0);
      return n + ' zone' + (p ? ' · ' + p + ' PENDING' : '');
    } });
})(globalThis.E3D || (globalThis.E3D = {}));
