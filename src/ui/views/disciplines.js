/* Step 2 — Disciplines & Team. List order = MDB order and folder number (NN);
   "Order" = the factor in the DB No formula. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon;

  function render(root, c) {
    var cfg = c.cfg, tb = h('tbody');
    cfg.disciplines.forEach(function (disc, i) {
      var dd = c.d.disciplines.find(function (x) { return x.disc === disc; });
      var itemsLabel = Array.isArray(disc.items) ? disc.items.length + ' item' : 'Semua';
      tb.appendChild(h('tr', { dataset: { drop: i } },
        h('td', { class: 'grip', draggable: 'true', dataset: { drag: i }, title: 'Seret untuk ubah urutan MDB' }, icon('grip')),
        h('td', null, D.mdCheckbox(disc.active, function (on) { c.mutate(function (k) { k.disciplines[i].active = on; }, true); }, 'Aktif')),
        h('td', null, D.cell(disc.letter, function (x) { c.mutate(function (k) { k.disciplines[i].letter = x.trim().toUpperCase(); }, true); }, { cls: 'code' })),
        h('td', null, D.cell(disc.name, function (x) { c.mutate(function (k) { k.disciplines[i].name = x; }, true); }, { cls: 'mid' })),
        h('td', null, D.cell(disc.order, function (x) { c.mutate(function (k) { k.disciplines[i].order = x; }, true); }, { type: 'number', cls: 'num', title: 'Urutan untuk DB No' })),
        h('td', null, D.cell(disc.team, function (x) { c.mutate(function (k) { k.disciplines[i].team = x.trim().toUpperCase(); }, true); }, { cls: 'mono' })),
        h('td', null, h('div', { class: 'row' }, D.mdSwitch(disc.teamExists, function (on) { c.mutate(function (k) { k.disciplines[i].teamExists = on; }, true); }, 'Team sudah ada'),
          h('span', { class: 'pill sm ' + (disc.teamExists ? 'ok' : 'warn') }, disc.teamExists ? 'Sudah ada' : 'Dibuat 00-TEAMS'))),
        h('td', null, D.cell(disc.members.join(', '), function (x) {
          c.mutate(function (k) { k.disciplines[i].members = x.split(/[\s,;]+/).map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean); });
        }, { cls: 'mid', placeholder: '—' })),
        h('td', null, h('button', { class: 'btn', on: { click: function () { pickItems(c, i); } } }, itemsLabel)),
        h('td', { class: 'mono muted' }, dd && dd.display.length ? '#' + dd.display[0].mdbPos + '–' + dd.display[dd.display.length - 1].mdbPos : '–'),
        h('td', null, h('button', { class: 'iconbtn', title: 'Hapus disiplin', on: { click: function () { remove(c, i); } } }, icon('x')))));
    });
    tb.appendChild(h('tr', { class: 'addrow', dataset: { drop: 'end' } }, h('td', { colspan: 11 }, h('button', { on: { click: function () {
      c.mutate(function (k) {
        var next = k.disciplines.reduce(function (m, d) { return Math.max(m, d.order || 0); }, 0) + 1;
        k.disciplines.push({ letter: '', name: '', order: next, team: '', teamExists: false, teamDescExisting: '', members: [], active: true, items: null, zones: [] });
      }, true);
    } } }, icon('plus'), 'Tambah disiplin'))));
    var table = h('table', { class: 't' }, h('thead', null, h('tr', null, h('th'), h('th', null, 'Aktif'), h('th', null, 'Letter'), h('th', null, 'Discipline'),
      h('th', null, 'Order'), h('th', null, 'Team'), h('th', null, 'Status team'), h('th', null, 'Members'), h('th', null, 'Item'), h('th', null, 'MDB'), h('th'))), tb);
    D.dragRows(tb, function (from, to) {
      c.mutate(function (k) {
        var list = k.disciplines, f = Number(from), moved = list.splice(f, 1)[0];
        var t = to === 'end' ? list.length : Number(to) - (Number(to) > f ? 1 : 0);
        list.splice(t, 0, moved);
      }, true);
    });

    var main = D.card({ title: 'Disiplin & team', icon: 'users',
      hint: 'Seret baris untuk mengubah urutan MDB dan nomor folder. <b>Order</b> = faktor di rumus DB No (ZRF: N = 11).',
      body: h('div', { class: 'inner tablewrap', style: { padding: '8px 10px' } }, table) });

    var descs = h('div', { class: 'intel' });
    c.d.disciplines.forEach(function (dd) {
      var i = cfg.disciplines.indexOf(dd.disc);
      descs.appendChild(h('div', { class: 'opt' }, h('span', { class: 'badge-code' }, dd.disc.letter),
        h('div', { class: 'grow' }, h('b', { class: 'mono' }, dd.disc.team), h('small', null, 'Macro: ' + dd.teamDesc)),
        D.cell(dd.disc.teamDescExisting, function (x) { c.mutate(function (k) { k.disciplines[i].teamDescExisting = x; }); },
          { placeholder: 'Deskripsi existing (register)', title: 'Isi kalau deskripsi team yang sudah ada berbeda dari format' })));
    });
    var teamCard = D.card({ title: 'Deskripsi team', icon: 'file', hint: 'Format di langkah 1. Kolom kanan: deskripsi team yang sudah ada, kalau berbeda (dipakai di register).',
      body: h('div', { class: 'inner' }, descs) });

    var u = cfg.users;
    var admin = D.card({ title: 'Admin & Free user', icon: 'shield', hint: 'Untuk sheet Teams & Users dan Access. Free user bisa menulis ke semua DB (fakta 1.2).',
      body: h('div', { class: 'inner' },
        h('div', { class: 'form' },
          D.mdField('Team admin', u.adminTeam.team, function (x) { c.mutate(function (k) { k.users.adminTeam.team = x.trim().toUpperCase(); }); }),
          D.mdField('Label', u.adminTeam.label, function (x) { c.mutate(function (k) { k.users.adminTeam.label = x; }); }),
          D.mdField('Deskripsi', u.adminTeam.description, function (x) { c.mutate(function (k) { k.users.adminTeam.description = x; }); }, { cls: 'full' }),
          D.mdField('Member admin', u.adminTeam.members.join(', '), function (x) {
            c.mutate(function (k) { k.users.adminTeam.members = x.split(/[\s,;]+/).map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean); });
          }, { cls: 'full' }),
          D.mdField('Free user (NAMA atau NAMA (catatan), dipisah koma)', u.freeUsers.map(function (f) { return f.note ? f.name + ' (' + f.note + ')' : f.name; }).join(', '),
            function (x) {
              c.mutate(function (k) {
                k.users.freeUsers = x.split(',').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
                  var m = /^(\S+)\s*\((.*)\)$/.exec(s);
                  return m ? { name: m[1].toUpperCase(), note: m[2] } : { name: s.toUpperCase(), note: '' };
                });
              });
            }, { cls: 'full' })),
        h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, 'Team admin sudah ada')),
          D.mdSwitch(u.adminTeam.exists, function (on) { c.mutate(function (k) { k.users.adminTeam.exists = on; }); }))) });

    root.appendChild(main);
    root.appendChild(h('div', { class: 'cols even' }, teamCard, admin));
  }

  function remove(c, i) {
    var disc = c.cfg.disciplines[i];
    D.dialog('Hapus disiplin?', h('p', { style: { margin: 0 } }, 'Disiplin ' + (disc.letter || '') + ' ' + (disc.name || '') + ' beserta aturan zone-nya akan dihapus.'),
      [{ label: 'Batal', run: function () {} }, { label: 'Hapus', primary: true, run: function () { c.mutate(function (k) { k.disciplines.splice(i, 1); }, true); } }]);
  }

  // Item subset for one discipline (null = all items).
  function pickItems(c, i) {
    var disc = c.cfg.disciplines[i], keep = new Set(Array.isArray(disc.items) ? disc.items : c.cfg.items.map(function (it) { return it.code; }));
    var list = h('div', { style: { maxHeight: '55vh', overflow: 'auto', minWidth: '360px' } });
    c.cfg.groups.forEach(function (g) {
      var items = c.cfg.items.filter(function (it) { return it.group === g.name; });
      if (!items.length) return;
      list.appendChild(h('div', { class: 'section-label' }, g.name));
      items.forEach(function (it) {
        list.appendChild(h('label', { class: 'row', style: { padding: '2px 0' } },
          D.mdCheckbox(keep.has(it.code), function (on) { if (on) keep.add(it.code); else keep.delete(it.code); }),
          h('span', { class: 'badge-code' }, it.code), it.label));
      });
    });
    D.dialog('Item untuk ' + (disc.name || disc.letter), list, [
      { label: 'Semua item', run: function () { c.mutate(function (k) { k.disciplines[i].items = null; }, true); } },
      { label: 'Batal', run: function () {} },
      { label: 'Simpan', primary: true, run: function () {
        c.mutate(function (k) { k.disciplines[i].items = k.items.map(function (it) { return it.code; }).filter(function (x) { return keep.has(x); }); }, true);
      } }]);
  }

  ui.views.push({ key: 'disc', title: 'Disiplin & Team', icon: 'users', render: render,
    lead: 'Disiplin dalam lingkup, Owning Team (fakta 1.12), dan urutan MDB. Team yang belum ada dibuat oleh 00-TEAMS.',
    summary: function (c) {
      var a = c.cfg.disciplines.filter(function (d) { return d.active; });
      return a.length + ' disiplin · ' + a.filter(function (d) { return !d.teamExists; }).length + ' team baru';
    } });
})(globalThis.E3D || (globalThis.E3D = {}));
