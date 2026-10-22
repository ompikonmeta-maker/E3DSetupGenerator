/* Step 1 — Project: identity, naming patterns, DB numbering/attributes, functions, separators,
   presets/files and advanced text sections (JSON). */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon;

  var FORMATS = [
    ['dbName', 'Nama DB', 'DB'], ['siteName', 'Nama site', 'site'], ['dbDesc', 'Deskripsi DB', 'desc'],
    ['teamDesc', 'Deskripsi team', 'team'], ['sepDiscipline', 'Separator disiplin', 'sepD'], ['sepGroup', 'Separator grup', 'sepG']
  ];
  var PLACEHOLDERS = '{TEAM} {D} {CODE} {F} {DISCIPLINE} {Discipline} {GROUP} {ITEM} {PROJECT} {PROJECTCODE}';

  function examples(c) {
    var dd = c.d && c.d.disciplines.find(function (x) { return x.display.length; });
    if (!dd) return {};
    var r = dd.display[0], fmt = E3D.util.fmt;
    var v = { TEAM: dd.disc.team, D: dd.disc.letter, DISCIPLINE: dd.disc.name.toUpperCase(), Discipline: dd.disc.name,
      PROJECT: c.cfg.project.name, PROJECTCODE: c.cfg.project.code, GROUP: r.group.name, CODE: r.item.code, F: r.item.func, ITEM: r.item.desc };
    return { DB: r.db, site: r.site, desc: r.desc, team: dd.teamDesc,
      sepD: fmt(c.cfg.formats.sepDiscipline, v), sepG: fmt(c.cfg.formats.sepGroup, v),
      dbno: c.cfg.dbNumber.base + ' + ' + dd.disc.order + '×' + c.cfg.dbNumber.disciplineStep + ' + ' + r.slot + ' = ' + r.dbno, row: r };
  }

  var exEls = {};
  function render(root, c) {
    var cfg = c.cfg, set = function (fn) { c.mutate(fn); };
    exEls = {};
    var ex = examples(c);

    var ident = D.card({ title: 'Identitas project', icon: 'folder', hint: 'Kode dipakai di nama file paket dan register.',
      body: h('div', { class: 'inner' }, h('div', { class: 'form' },
        D.mdField('Kode project', cfg.project.code, function (x) { set(function (k) { k.project.code = x.trim(); }); }, { support: 'Contoh: ZRF' }),
        D.mdField('Nama project', cfg.project.name, function (x) { set(function (k) { k.project.name = x; }); }, { support: 'Dipakai di deskripsi team' }),
        D.mdField('MDB', cfg.project.mdb, function (x) { set(function (k) { k.project.mdb = x.trim(); }); }, { support: 'Diawali "/" (fakta 3.5)' }),
        D.mdField('Nama folder paket', cfg.project.packageName, function (x) { set(function (k) { k.project.packageName = x.trim(); }); }, { support: 'Folder root di dalam ZIP' }))) });

    var fm = h('div', { class: 'form' });
    FORMATS.forEach(function (f) {
      var exEl = h('div', { class: 'field-ex' });
      exEls[f[2]] = exEl;
      fm.appendChild(h('div', null, D.mdField(f[1], cfg.formats[f[0]], function (x) { set(function (k) { k.formats[f[0]] = x; }); }), exEl));
    });
    var names = D.card({ title: 'Pola nama', icon: 'tree', hint: 'Placeholder: <span class="mono">' + D.esc(PLACEHOLDERS) + '</span>',
      body: h('div', { class: 'inner' }, fm) });

    var funcs = functionsCard(c);

    var num = D.card({ title: 'Nomor DB & atribut', icon: 'database', hint: 'DB No = base + urutan disiplin × step + slot',
      body: h('div', { class: 'inner' },
        h('div', { class: 'form', style: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
          D.mdField('Base', cfg.dbNumber.base, function (x) { set(function (k) { k.dbNumber.base = x; }); }, { type: 'number' }),
          D.mdField('Step disiplin', cfg.dbNumber.disciplineStep, function (x) { set(function (k) { k.dbNumber.disciplineStep = x; }); }, { type: 'number' }),
          D.mdField('Slot per grup', cfg.dbNumber.groupCapacity, function (x) { set(function (k) { k.dbNumber.groupCapacity = x; }); }, { type: 'number' }),
          D.mdField('Type', cfg.dbAttributes.type, function (x) { set(function (k) { k.dbAttributes.type = x.trim(); }); }),
          D.mdField('Access', cfg.dbAttributes.access, function (x) { set(function (k) { k.dbAttributes.access = x.trim(); }); }),
          D.mdField('Claim', cfg.dbAttributes.claim, function (x) { set(function (k) { k.dbAttributes.claim = x.trim(); }); })),
        exEls.dbno = h('div', { class: 'field-ex', style: { marginTop: '10px' } })) });

    var seps = D.card({ title: 'Separator', icon: 'layers', hint: 'Site kosong sebagai pemisah visual (praktik project, fakta 5.4). Per grup bisa diatur di langkah 3.',
      body: h('div', { class: 'inner' },
        opt('Separator disiplin', 'Contoh ' + (ex.sepD || cfg.formats.sepDiscipline), cfg.separators.discipline, function (on) { c.mutate(function (k) { k.separators.discipline = on; }); }),
        opt('Separator grup', 'Contoh ' + (ex.sepG || cfg.formats.sepGroup), cfg.separators.group, function (on) { c.mutate(function (k) { k.separators.group = on; }); })) });

    var files = D.card({ title: 'Preset & file', icon: 'copy', hint: c.S.savedAt ? 'Draft tersimpan di browser ini.' : 'Draft disimpan otomatis di browser ini.',
      body: h('div', { class: 'inner' },
        Object.keys(E3D.presets).map(function (k) {
          return h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, 'Preset ' + E3D.presets[k].name)),
            h('button', { class: 'btn', on: { click: function () { ui.files.loadPreset(k); } } }, 'Muat'));
        }),
        h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, 'Project baru'), h('small', null, 'Config kosong')),
          h('button', { class: 'btn', on: { click: ui.files.newProject } }, icon('plus'), 'Buat')),
        h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, 'Config JSON'), h('small', null, 'Simpan / buka konfigurasi lengkap')),
          h('button', { class: 'btn', on: { click: ui.files.importConfig } }, icon('upload'), 'Import'),
          h('button', { class: 'btn', on: { click: ui.files.exportConfig } }, icon('download'), 'Export'))) });

    var adv = D.card({ title: 'Lanjutan', icon: 'settings', hint: 'Teks macro, README dan isi register, sebagai JSON.',
      body: h('div', { class: 'inner' },
        jsonOpt(c, 'texts', 'Teks paket', 'Nama file, header macro, README'),
        jsonOpt(c, 'register', 'Register', 'Daftar sheet, judul, header, teks naratif'),
        jsonOpt(c, 'pendingZone', 'Baris zone PENDING', 'Isi register untuk disiplin tanpa zone')) });

    root.appendChild(h('div', { class: 'cols' }, h('div', { class: 'stack' }, ident, names, funcs), h('div', { class: 'stack' }, num, seps, files, adv)));
    refresh(root, c);
  }

  function functionsCard(c) {
    var cfg = c.cfg, tb = h('tbody');
    var zoneOpts = [{ value: 'discipline', label: 'Zone disiplin' }].concat(Object.keys(cfg.zoneSets).map(function (k) {
      return { value: k, label: 'Set: ' + (cfg.zoneSets[k].name || k) };
    }));
    cfg.functions.forEach(function (f, i) {
      tb.appendChild(h('tr', null,
        h('td', null, D.cell(f.letter, function (x) { c.mutate(function (k) { k.functions[i].letter = x.trim().toUpperCase(); }, true); }, { cls: 'code' })),
        h('td', null, D.cell(f.name, function (x) { c.mutate(function (k) { k.functions[i].name = x; }); })),
        h('td', null, D.select(zoneOpts, f.zones, function (x) { c.mutate(function (k) { k.functions[i].zones = x; }); })),
        h('td', null, D.cell(f.zoneStatus, function (x) { c.mutate(function (k) { k.functions[i].zoneStatus = x; }); }, { cls: 'wide', placeholder: '— (pakai status zone)' })),
        h('td', null, h('button', { class: 'iconbtn', title: 'Hapus', on: { click: function () { c.mutate(function (k) { k.functions.splice(i, 1); }, true); } } }, icon('x')))));
    });
    tb.appendChild(h('tr', { class: 'addrow' }, h('td', { colspan: 5 }, h('button', { on: { click: function () {
      c.mutate(function (k) { k.functions.push({ letter: '', name: '', zones: 'discipline', zoneStatus: '' }); }, true);
    } } }, icon('plus'), 'Tambah function'))));
    return D.card({ title: 'Function', icon: 'grid', hint: 'Huruf terakhir di nama DB/site. Zone: dari daftar disiplin atau dari set zone (mis. Dummy).',
      body: h('div', { class: 'inner tablewrap' }, h('table', { class: 't' },
        h('thead', null, h('tr', null, h('th', null, 'Letter'), h('th', null, 'Nama'), h('th', null, 'Zone'), h('th', null, 'Status zone (register)'), h('th'))), tb)) });
  }

  function opt(title, sub, on, onChange) {
    return h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, title), h('small', { class: 'mono' }, sub)), D.mdSwitch(on, onChange, title));
  }

  function jsonOpt(c, key, title, sub) {
    return h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, title), h('small', null, sub)),
      h('button', { class: 'btn', on: { click: function () { editJson(c, key, title); } } }, 'Edit JSON'));
  }

  function editJson(c, key, title) {
    var ta = h('textarea', { class: 'paste', style: { width: 'min(860px, 80vw)', minHeight: '55vh' } });
    ta.value = JSON.stringify(c.cfg[key], null, 2);
    var msg = h('div', { class: 'field-ex' }, 'Placeholder tak dikenal akan muncul di Validasi.');
    D.dialog(title + ' (JSON)', h('div', null, ta, msg), [
      { label: 'Batal', run: function () {} },
      { label: 'Simpan', primary: true, run: function () {
        var v;
        try { v = JSON.parse(ta.value); } catch (e) { msg.textContent = 'JSON tidak valid: ' + e.message; return false; }
        c.mutate(function (k) { k[key] = v; var m = E3D.model.migrate(k); k[key] = m[key]; }, true);
        D.snack(title + ' disimpan.');
      } }]);
  }

  function refresh(root, c) {
    var ex = examples(c);
    Object.keys(exEls).forEach(function (k) {
      if (k === 'dbno') { exEls.dbno.innerHTML = ex.dbno ? 'Contoh: <span class="mono">' + D.esc(ex.row.db) + '</span> = <span class="mono">' + D.esc(ex.dbno) + '</span>' : ''; return; }
      exEls[k].innerHTML = ex[k] ? 'Contoh: <span class="mono">' + D.esc(ex[k]) + '</span>' : '';
    });
  }

  ui.views.push({ key: 'project', title: 'Project', icon: 'folder', render: render, refresh: refresh,
    lead: 'Identitas project, pola nama, aturan nomor DB dan function. Semua aturan disimpan di config JSON.',
    summary: function (c) { return [c.cfg.project.code, c.cfg.project.mdb].filter(Boolean).join(' · ') || 'belum diisi'; } });
})(globalThis.E3D || (globalThis.E3D = {}));
