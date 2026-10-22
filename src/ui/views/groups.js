/* Step 3 — Groups & Modules. cfg.items order = register order; display order = stable sort by
   group (PLAN T1). Two layouts: per group (display) and register order. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon;

  function render(root, c) {
    var cfg = c.cfg, layout = c.ui.layout;
    var rowOf = new Map();
    if (c.dd) c.dd.display.forEach(function (r) { rowOf.set(r.item, r); });
    var funcOpts = cfg.functions.map(function (f) { return { value: f.letter, label: f.letter + ' · ' + f.name }; });
    var groupOpts = cfg.groups.map(function (g) { return { value: g.name, label: g.name }; });
    var cap = cfg.dbNumber.groupCapacity;
    var tb = h('tbody');

    function itemRow(it) {
      var idx = cfg.items.indexOf(it), r = rowOf.get(it);
      function set(field, transform) {
        return function (x) { c.mutate(function (k) { k.items[idx][field] = transform ? transform(x) : x; }, field === 'code' || field === 'func' || field === 'group'); };
      }
      return h('tr', { dataset: { drop: 'i:' + idx } },
        h('td', { class: 'grip', draggable: 'true', dataset: { drag: 'i:' + idx }, title: 'Seret' }, icon('grip')),
        h('td', null, D.cell(it.code, set('code', function (x) { return x.trim().toUpperCase(); }), { cls: 'code' })),
        h('td', null, D.cell(it.label, set('label'), { cls: 'wide', placeholder: 'Label register' })),
        h('td', null, D.cell(it.desc, set('desc'), { cls: 'wide', placeholder: 'Teks deskripsi DB' })),
        layout === 'register' ? h('td', null, D.select(groupOpts, it.group, set('group'), { cls: 'mid' })) : null,
        h('td', null, D.select(funcOpts, it.func, set('func'), { cls: 'mid' })),
        h('td', null, D.cell(it.note, set('note'), { cls: 'mid', placeholder: '—' })),
        h('td', { class: 'mono' }, r ? r.dbno : '–'),
        h('td', { class: 'mono' }, r ? r.site : '–'),
        h('td', { class: 'mono muted', style: { textAlign: 'right' } }, r ? '#' + r.mdbPos : ''),
        h('td', null, h('button', { class: 'iconbtn', title: 'Hapus item', on: { click: function () { c.mutate(function (k) { k.items.splice(idx, 1); }, true); } } }, icon('x'))));
    }

    if (layout === 'register') {
      cfg.items.forEach(function (it) { tb.appendChild(itemRow(it)); });
      tb.appendChild(addRow(c, cfg.groups.length ? cfg.groups[0].name : '', 11, 'Tambah item'));
    } else {
      cfg.groups.forEach(function (g, gi) {
        var items = cfg.items.filter(function (it) { return it.group === g.name; });
        var bar = h('span', { class: 'slotbar', title: items.length + ' dari ' + cap + ' slot' });
        for (var k = 0; k < Math.max(cap, items.length); k++) bar.appendChild(h('i', { class: k < items.length ? (k < cap ? 'f' : 'x') : '' }));
        var globalOff = !cfg.separators.group;
        tb.appendChild(h('tr', { class: 'grp', dataset: { drop: 'g:' + gi } },
          h('td', { class: 'grip', draggable: 'true', dataset: { drag: 'g:' + gi }, title: 'Seret grup' }, icon('grip')),
          h('td', { colspan: 3 }, h('div', { class: 'row' },
            D.cell(g.name, function (x) { renameGroup(c, gi, x.trim().toUpperCase()); }, { cls: 'mono', title: 'Nama grup' }),
            bar, h('span', { class: 'muted', style: { fontWeight: 400, fontSize: '12.5px' } }, items.length + '/' + cap))),
          h('td', { colspan: 2 }, h('div', { class: 'row muted', style: { fontWeight: 400 } }, 'slot',
            D.cell(g.slotBase, function (x) { c.mutate(function (k) { k.groups[gi].slotBase = x; }, true); }, { type: 'number', cls: 'num' }),
            '–' + (g.slotBase + cap - 1))),
          h('td', { colspan: 3 }, h('div', { class: 'row', style: { justifyContent: 'flex-end', fontWeight: 400 } },
            h('span', { class: 'muted', style: { fontSize: '12.5px' } }, globalOff ? 'separator mati (global)' : 'separator'),
            D.mdSwitch(g.separator !== false, function (on) { c.mutate(function (k) { k.groups[gi].separator = on; }, true); }, 'Separator grup'))),
          h('td', { colspan: 2, style: { textAlign: 'right' } }, h('button', { class: 'iconbtn', title: 'Hapus grup', on: { click: function () { removeGroup(c, gi); } } }, icon('x')))));
        items.forEach(function (it) { tb.appendChild(itemRow(it)); });
        tb.appendChild(addRow(c, g.name, 11, 'Tambah item ke ' + g.name));
      });
      tb.appendChild(h('tr', { class: 'addrow', dataset: { drop: 'gend' } }, h('td', { colspan: 11 }, h('button', { on: { click: function () { addGroup(c); } } }, icon('plus'), 'Tambah grup'))));
    }

    D.dragRows(tb, function (from, to) { move(c, from, to); });

    var head = h('tr', null, h('th'), h('th', null, 'Code'), h('th', null, 'Label'), h('th', null, 'Deskripsi'),
      layout === 'register' ? h('th', null, 'Grup') : null, h('th', null, 'Function'), h('th', null, 'Status'),
      h('th', null, 'DB No'), h('th', null, 'Site'), h('th', { style: { textAlign: 'right' } }, 'MDB'), h('th'));
    var seg = h('md-segmented-button', null,
      h('button', { 'data-value': 'group', selected: layout !== 'register' }, 'Per grup'),
      h('button', { 'data-value': 'register', selected: layout === 'register' }, 'Urutan register'));
    seg.addEventListener('change', function (e) { c.setUi({ layout: e.detail.value }); });

    var discName = c.disc ? c.disc.letter + ' · ' + c.disc.name : '–';
    var main = D.card({ title: 'Grup & modul', icon: 'layers',
      hint: layout === 'register' ? 'Urutan baris = urutan sheet DB Register. Seret untuk mengubah.'
        : 'Seret item antar-grup atau di dalam grup. Kolom DB No/Site untuk disiplin <b>' + D.esc(discName) + '</b> (pilih di panel kiri).',
      right: seg, body: h('div', { class: 'inner tablewrap', style: { padding: '8px 10px' } }, h('table', { class: 't' }, h('thead', null, head), tb)) });

    root.appendChild(main);
    root.appendChild(sideCard(c));
  }

  function addRow(c, group, span, label) {
    return h('tr', { class: 'addrow', dataset: { drop: 'add:' + group } }, h('td', { colspan: span }, h('button', { on: { click: function () {
      c.mutate(function (k) {
        var last = -1;
        k.items.forEach(function (it, i) { if (it.group === group) last = i; });
        var f = k.functions.length ? k.functions[0].letter : '';
        k.items.splice(last < 0 ? k.items.length : last + 1, 0, { code: '', label: '', desc: '', group: group, func: f, note: '' });
      }, true);
    } } }, icon('plus'), label)));
  }

  // Drag keys: 'g:<groupIndex>', 'i:<itemIndex>'; drop keys add 'add:<group>' and 'gend'.
  function move(c, from, to) {
    c.mutate(function (k) {
      var f = from.split(':'), t = to.split(':');
      if (f[0] === 'g') {
        if (t[0] !== 'g' && t[0] !== 'gend') return;
        var gi = Number(f[1]), g = k.groups.splice(gi, 1)[0];
        var ti = t[0] === 'gend' ? k.groups.length : Number(t[1]) - (Number(t[1]) > gi ? 1 : 0);
        k.groups.splice(ti, 0, g);
        return;
      }
      var ii = Number(f[1]), item = k.items[ii];
      var target = null, group = item.group;
      if (t[0] === 'i') { target = k.items[Number(t[1])]; group = target.group; }
      else if (t[0] === 'g') { group = k.groups[Number(t[1])].name; target = k.items.find(function (x) { return x.group === group && x !== item; }) || null; }
      else if (t[0] === 'add') { group = to.slice(4); }
      else return;
      if (target === item) return;
      k.items.splice(ii, 1);
      item.group = group;
      var pos;
      if (target) pos = k.items.indexOf(target);
      else { pos = -1; k.items.forEach(function (x, i) { if (x.group === group) pos = i; }); pos = pos < 0 ? k.items.length : pos + 1; }
      k.items.splice(pos, 0, item);
    }, true);
  }

  function renameGroup(c, gi, name) {
    c.mutate(function (k) {
      var old = k.groups[gi].name;
      k.groups[gi].name = name;
      k.items.forEach(function (it) { if (it.group === old) it.group = name; });
    }, true);
  }
  function addGroup(c) {
    c.mutate(function (k) {
      var cap = k.dbNumber.groupCapacity || 10;
      var next = k.groups.reduce(function (m, g) { return Math.max(m, g.slotBase + cap); }, 1);
      k.groups.push({ name: 'GROUP-' + (k.groups.length + 1), slotBase: next, separator: true });
    }, true);
  }
  function removeGroup(c, gi) {
    var g = c.cfg.groups[gi];
    var n = c.cfg.items.filter(function (it) { return it.group === g.name; }).length;
    if (n) { D.snack('Grup ' + g.name + ' masih berisi ' + n + ' item. Pindahkan atau hapus item dulu.'); return; }
    c.mutate(function (k) { k.groups.splice(gi, 1); }, true);
  }

  function sideCard(c) {
    var cfg = c.cfg, cap = cfg.dbNumber.groupCapacity, r = c.dd && c.dd.display[0];
    var bars = h('div', { class: 'bars', style: { display: 'grid', gridTemplateColumns: '104px 1fr 40px', gap: '8px 12px', alignItems: 'center', fontSize: '13px', marginTop: '12px' } });
    cfg.groups.forEach(function (g) {
      var n = cfg.items.filter(function (it) { return it.group === g.name; }).length;
      var over = cap && n > cap;
      bars.append(h('span', { class: 'muted mono' }, g.name),
        h('div', { style: { height: '9px', borderRadius: '999px', background: 'var(--md-sys-color-surface-container-high)', overflow: 'hidden' } },
          h('div', { style: { height: '100%', width: Math.min(100, cap ? n / cap * 100 : 0) + '%', borderRadius: '999px',
            background: over ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-secondary)' } })),
        h('span', { class: 'mono', style: { color: over ? 'var(--md-sys-color-error)' : '' } }, n + '/' + cap));
    });
    var list = c.issuesOf('groups');
    var intel = h('div', { class: 'intel', style: { marginTop: '8px' } });
    if (r) intel.appendChild(item('info', 'sparkle', 'Contoh DB No', r.db + ' = ' + cfg.dbNumber.base + ' + ' + r.disc.order + '×' + cfg.dbNumber.disciplineStep +
      ' + ' + r.group.slotBase + ' + ' + r.rankInGroup + ' = ' + r.dbno, ''));
    if (!list.length) intel.appendChild(item('ok', 'check-circle', 'DB No unik, dalam rentang, dan tidak bentrok', 'Dicek terhadap aturan 1–7000 / 10000–250000 dan daftar existing.', '1.3'));
    list.forEach(function (i) {
      var t = { error: ['err', 'error-circle'], warning: ['warn', 'alert'], info: ['info', 'info'] }[i.level];
      intel.appendChild(item(t[0], t[1], i.msg, '', i.fact));
    });
    return D.card({ title: 'Rumus & cek', icon: 'sparkle', hint: 'Dihitung ulang setiap kali ada perubahan',
      body: h('div', { class: 'cols even' },
        h('div', { class: 'inner' }, h('span', { class: 'muted' }, 'DB No'),
          h('div', { class: 'mono', style: { marginTop: '4px' } }, 'base + order × step + slotBase + index'), bars),
        h('div', { class: 'inner' }, intel)) });
  }

  function item(tone, ic, title, text, fact) {
    return h('div', { class: 'it' }, h('div', { class: 'ib ' + tone }, icon(ic)),
      h('div', null, h('b', null, title, fact ? h('span', { class: 'fact' }, 'fakta ' + fact) : null), text ? h('p', null, text) : null));
  }

  ui.views.push({ key: 'groups', title: 'Grup & Modul', icon: 'layers', render: render,
    lead: 'Grup menentukan urutan tampil di Model Explorer dan slot DB No. Urutan baris item = urutan register.',
    summary: function (c) { return c.cfg.groups.length + ' grup · ' + c.cfg.items.length + ' item'; } });
})(globalThis.E3D || (globalThis.E3D = {}));
