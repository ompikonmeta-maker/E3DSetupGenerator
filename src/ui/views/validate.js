/* Step 7 — Validation: every issue with its fact number; click jumps to the step that owns it. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon;
  var TONE = { error: ['err', 'error-circle', 'Error'], warning: ['warn', 'alert', 'Warning'], info: ['info', 'info', 'Info'] };

  function render(root, c) {
    var show = c.ui.levels || { error: true, warning: true, info: true };
    var sum = E3D.summarizeIssues(c.issues);
    var chips = h('div', { class: 'chips' }, ['error', 'warning', 'info'].map(function (lv) {
      return D.mdChip(TONE[lv][2] + ' · ' + sum[lv], show[lv], function (on) {
        var next = Object.assign({}, show); next[lv] = on; c.setUi({ levels: next });
      });
    }));
    var stepTitle = {};
    ui.views.forEach(function (v) { stepTitle[v.key] = v.title; });
    var byStep = {};
    c.issues.filter(function (i) { return show[i.level]; }).forEach(function (i) {
      var k = c.owner(i.path); (byStep[k] = byStep[k] || []).push(i);
    });
    var body = h('div', { class: 'inner' });
    var keys = ui.views.map(function (v) { return v.key; }).filter(function (k) { return byStep[k]; });
    if (!keys.length) body.appendChild(h('div', { class: 'alert ok', style: { margin: 0 } }, icon('check-circle'), 'Tidak ada temuan untuk filter ini.'));
    keys.forEach(function (k) {
      body.appendChild(h('div', { class: 'section-label' }, stepTitle[k] + ' · ' + byStep[k].length));
      body.appendChild(h('div', { class: 'intel' }, byStep[k].map(function (i) {
        var t = TONE[i.level];
        return h('div', { class: 'it link', on: { click: function () { c.nav(k); } } }, h('div', { class: 'ib ' + t[0] }, icon(t[1])),
          h('div', null, h('b', null, i.msg, i.fact ? h('span', { class: 'fact' }, i.fact === '' ? '' : 'fakta ' + i.fact) : h('span', { class: 'fact', style: { background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)' } }, 'aturan tool'))));
      })));
    });
    var list = D.card({ title: 'Temuan', icon: 'shield', hint: 'Error menghentikan Generate. Warning dan info tidak.', right: chips, body: body });

    var rules = [
      ['1.3', 'DB No 1–7000 atau 10000–250000, unik di MDB'], ['1.7', 'MDB maks. 5000 DB, maks. 1000 current; posisi ADD/CURRENT 1–5000'],
      ['1.12', 'Owning Team harus ada (atau dibuat 00-TEAMS)'], ['3.5', 'Nama elemen diawali "/", huruf besar disarankan'],
      ['6.11', 'Nama DB tidak boleh sudah ada'], ['§7', 'Nama site sudah dipakai → (41,12) Name already used'],
      ['§9', 'Belum terverifikasi: NEW ZONE, karakter selain huruf/angka/"-", encoding non-ASCII']
    ];
    var src = D.card({ title: 'Sumber aturan', icon: 'file', hint: 'Hanya dari docs/fakta-terverifikasi-e3d-admin.md',
      body: h('div', { class: 'inner' }, rules.map(function (r) {
        return h('div', { class: 'opt' }, h('span', { class: 'fact', style: { marginLeft: 0 } }, r[0]), h('div', { class: 'grow' }, r[1]));
      })) });
    root.appendChild(h('div', { class: 'cols' }, list, src));
  }

  ui.views.push({ key: 'validate', title: 'Validasi', icon: 'shield', render: render, refresh: function (root, c) { root.innerHTML = ''; render(root, c); },
    lead: 'Semua aturan dicek terhadap fakta E3D yang terverifikasi. Klik temuan untuk membuka langkahnya.',
    summary: function (c) { var s = E3D.summarizeIssues(c.issues); return s.error + ' error · ' + s.warning + ' warning'; } });
})(globalThis.E3D || (globalThis.E3D = {}));
