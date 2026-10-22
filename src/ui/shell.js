/* App shell: icon rail, side panel (project, search, disciplines), header with stats,
   stepper and the active view. Views register in E3D.ui.views (order = stepper order). */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, icon = D.icon, store = ui.store, S = store.state;
  ui.views = ui.views || [];
  ui.modes = ui.modes || {};

  // Issue path -> step key (first match wins). '' = general issue.
  var OWNERS = [
    [/^disciplines\.\d+\.zones|^zoneSets|^codeLists|^pendingZone/, 'zones'],
    [/^disciplines|^users/, 'disc'],
    [/^groups|^items/, 'groups'],
    [/^references|^existing/, 'refs'],
    [/^register|^texts/, 'generate'],
    [/^project|^formats|^separators|^dbNumber|^dbAttributes|^functions/, 'project']
  ];
  function owner(path) {
    for (var i = 0; i < OWNERS.length; i++) if (OWNERS[i][0].test(path || '')) return OWNERS[i][1];
    return 'validate';
  }

  var el = {};
  function ctx() {
    var disc = S.cfg ? S.cfg.disciplines.find(function (d) { return d.letter === S.ui.disc; }) : null;
    var dd = S.derived && disc ? S.derived.disciplines.find(function (x) { return x.disc === disc; }) : null;
    return { S: S, cfg: S.cfg, d: S.derived, issues: S.issues, ui: S.ui, disc: disc, dd: dd, owner: owner,
      mutate: store.mutate, setUi: store.setUi, nav: nav, issuesOf: issuesOf };
  }
  function issuesOf(step) { return S.issues.filter(function (i) { return owner(i.path) === step; }); }
  function view(key) { return ui.views.find(function (v) { return v.key === key; }); }
  function nav(step, patch) { store.setUi(Object.assign({ mode: 'setup', step: step }, patch || {})); }

  function stepStatus(v) {
    var list = issuesOf(v.key);
    if (list.some(function (i) { return i.level === 'error'; })) return 'err';
    if (list.some(function (i) { return i.level === 'warning' || i.code === 'zone-pending'; })) return 'warn';
    return 'done';
  }

  function mount(root) {
    el.rail = h('nav', { class: 'rail', 'aria-label': 'Mode' });
    el.panel = h('aside', { class: 'panel' });
    el.main = h('main', { class: 'main' });
    root.appendChild(h('div', { class: 'frame' }, el.rail, el.panel, el.main));
    store.subscribe(function (type) {
      if (type === 'render') render();
      else if (type === 'data' || type === 'issues') refresh();
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); var s = document.getElementById('q'); if (s) s.focus(); }
    });
    render();
  }

  function render() {
    renderRail(); renderPanel();
    el.main.innerHTML = '';
    if (!S.cfg) { el.main.appendChild(emptyState()); return; }
    el.head = h('div', { class: 'stack' });
    el.view = h('div', { class: 'stack' });
    el.main.append(el.head, el.view);
    renderHead();
    var c = ctx();
    var m = S.ui.mode !== 'setup' && ui.modes[S.ui.mode];
    var v = m || view(S.ui.step) || ui.views[0];
    el.active = v;
    if (S.error) el.view.appendChild(h('div', { class: 'alert err' }, icon('alert'), 'Config tidak bisa dihitung: ' + S.error));
    else if (!S.derived && v.needsDerived !== false) el.view.appendChild(h('div', { class: 'alert err' }, icon('alert'), 'Struktur config bermasalah. Lihat Validasi.'));
    else v.render(el.view, c);
    el.main.scrollTop = 0;
  }

  function refresh() {
    renderPanel(); renderHead();
    if (el.active && el.active.refresh && S.derived) el.active.refresh(el.view, ctx());
  }

  function renderRail() {
    el.rail.innerHTML = '';
    el.rail.appendChild(h('div', { class: 'logo', title: 'E3D Setup Generator' }, 'E3D'));
    [['setup', 'layers', 'Setup (Team → Zone)']].concat(Object.keys(ui.modes).map(function (k) { return [k, ui.modes[k].icon, ui.modes[k].title]; }))
      .forEach(function (m) {
        el.rail.appendChild(h('button', { class: 'rbtn' + (S.ui.mode === m[0] ? ' on' : ''), title: m[2], 'aria-label': m[2],
          on: { click: function () { store.setUi({ mode: m[0] }); } } }, icon(m[1])));
      });
    el.rail.appendChild(h('div', { class: 'spacer' }));
    var dark = document.documentElement.dataset.theme === 'dark';
    el.rail.appendChild(h('button', { class: 'rbtn', title: dark ? 'Tema terang' : 'Tema gelap', on: { click: toggleTheme } }, icon(dark ? 'sun' : 'moon')));
  }

  function toggleTheme() {
    var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.prefs({ theme: next });
    renderRail();
  }

  function renderPanel() {
    var p = el.panel, cfg = S.cfg, d = S.derived;
    var focused = document.activeElement && document.activeElement.id === 'q';
    p.innerHTML = '';
    if (!cfg) { p.append(h('h2', null, 'E3D Setup'), h('p', { class: 'sub' }, 'Belum ada konfigurasi.')); return; }
    p.append(h('h2', null, cfg.project.code || 'Project baru'),
      h('p', { class: 'sub' }, [cfg.project.name, cfg.project.mdb].filter(Boolean).join(' · ') || 'Isi data project di langkah 1'));
    var q = h('input', { id: 'q', placeholder: 'Cari DB, site, zone', 'aria-label': 'Cari', autocomplete: 'off' });
    q.value = S.ui.query || '';
    var results = h('div', { class: 'results' });
    q.addEventListener('input', function () { S.ui.query = q.value; fillResults(results, q.value); });
    p.append(h('label', { class: 'search' }, icon('search', 'sm'), q, h('kbd', null, 'Ctrl K')), results);
    fillResults(results, S.ui.query);
    if (focused) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }

    p.appendChild(h('button', { class: 'navh', on: { click: function () { nav('preview'); } } }, icon('database'), 'Semua DB',
      h('span', { class: 'count' }, d ? d.dbs.length : '–')));
    p.appendChild(h('div', { class: 'navh' }, icon('users'), 'Disiplin', h('span', { class: 'count off' }, cfg.disciplines.length)));
    var tree = h('div', { class: 'dtree' });
    cfg.disciplines.forEach(function (disc) {
      var dd = d && d.disciplines.find(function (x) { return x.disc === disc; });
      var count = !disc.active ? h('span', { class: 'count off' }, 'off')
        : dd && dd.pending ? h('span', { class: 'count warn' }, 'PENDING') : h('span', { class: 'count' }, dd ? dd.display.length : '–');
      tree.appendChild(h('button', { class: 'ni' + (disc.letter === S.ui.disc ? ' on' : '') + (disc.active ? '' : ' inactive'),
        on: { click: function () { store.setUi({ disc: disc.letter }); } } },
        h('span', { class: 'lt' }, disc.letter || '?'), disc.name || '(tanpa nama)', count));
    });
    p.appendChild(tree);
    p.appendChild(h('button', { class: 'navh', style: { marginTop: '6px' }, on: { click: function () { nav('refs'); } } }, icon('link'), 'Referensi MDB',
      h('span', { class: 'count' }, cfg.references.length)));
    p.appendChild(h('div', { class: 'grow' }));
    p.appendChild(h('button', { class: 'navh', on: { click: ui.files.importConfig } }, icon('upload'), 'Import config JSON'));
    p.appendChild(h('button', { class: 'navh', on: { click: ui.files.exportConfig } }, icon('download'), 'Export config JSON'));
  }

  function fillResults(box, q) {
    box.innerHTML = '';
    q = (q || '').trim().toUpperCase();
    if (q.length < 2 || !S.derived) return;
    var out = [];
    S.derived.disciplines.forEach(function (dd) {
      dd.siteOrder.forEach(function (s) {
        if (out.length < 40 && (s.name.toUpperCase().indexOf(q) >= 0 || (s.type === 'site' && s.row.db.toUpperCase().indexOf(q) >= 0)))
          out.push({ t: s.name, s: s.row.db + ' · DB No ' + s.row.dbno + ' · MDB #' + s.row.mdbPos, disc: dd.disc.letter });
      });
      dd.zones.forEach(function (z) {
        if (!z.pending && out.length < 40 && z.name.toUpperCase().indexOf(q) >= 0) out.push({ t: z.name, s: 'zone di ' + z.row.site, disc: dd.disc.letter });
      });
    });
    if (!out.length) { box.appendChild(h('div', { class: 'muted', style: { padding: '4px 10px', fontSize: '13px' } }, 'Tidak ada hasil.')); return; }
    out.forEach(function (r) {
      box.appendChild(h('button', { on: { click: function () { nav('preview', { disc: r.disc }); } } }, h('span', { class: 'mono' }, r.t), h('small', null, r.s)));
    });
  }

  function renderHead() {
    if (!el.head) return;
    var c = ctx(), d = S.derived, cfg = S.cfg;
    var m = S.ui.mode !== 'setup' && ui.modes[S.ui.mode];
    var v = m || view(S.ui.step) || ui.views[0];
    var sum = E3D.summarizeIssues(S.issues);
    var pill = sum.error ? h('span', { class: 'pill err' }, icon('alert'), sum.error + ' error')
      : sum.warning ? h('span', { class: 'pill warn' }, icon('alert'), sum.warning + ' warning')
      : h('span', { class: 'pill ok' }, icon('check-circle'), 'Validasi bersih');
    el.head.innerHTML = '';
    el.head.append(
      h('div', { class: 'crumb' }, cfg.project.code || 'Project', icon('chevron-right', 'sm'), h('b', null, v.title)),
      h('div', { class: 'head' },
        h('div', null, h('div', { class: 'title' }, h('div', { class: 'badge' }, icon(v.icon)), h('h1', null, v.title), pill),
          h('p', { class: 'lead' }, v.lead || '')),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('small', null, 'DB dibuat'), h('b', null, d ? d.dbs.length : '–')),
          h('div', { class: 'stat' }, h('small', null, 'Posisi MDB'), h('b', null, d ? d.mdbCount : '–')),
          h('button', { class: 'cta', on: { click: function () { nav('generate'); } } }, icon('download'), 'Generate'))));
    if (m) return;
    var steps = h('div', { class: 'inner steps', style: { '--n': ui.views.length } });
    ui.views.forEach(function (sv, i) {
      var st = stepStatus(sv), curr = sv.key === v.key;
      var node = curr ? icon(sv.icon) : st === 'err' ? icon('alert') : st === 'warn' ? icon('alert') : icon('check');
      steps.appendChild(h('button', { class: 'step ' + (curr ? 'cur' : st), on: { click: function () { nav(sv.key); } } },
        h('div', { class: 'node' }, node), h('b', null, (i + 1) + '. ' + sv.title), h('small', null, d && sv.summary ? sv.summary(c) : '')));
    });
    el.head.appendChild(h('section', { class: 'card', style: { padding: '14px 16px' } }, steps));
  }

  function emptyState() {
    return D.card({ title: 'Mulai', icon: 'sparkle', hint: 'Pilih titik awal. Semua bisa diubah nanti; draft tersimpan otomatis di browser ini.',
      body: h('div', { class: 'inner' },
        h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, 'Preset ZRF'), h('small', null, 'Konfigurasi lengkap ZR FLNG (paket & register final).')),
          h('button', { class: 'cta', on: { click: function () { ui.files.loadPreset('zrf'); } } }, 'Muat preset')),
        h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, 'Project baru'), h('small', null, 'Config kosong dengan pola nama default.')),
          h('button', { class: 'btn', on: { click: ui.files.newProject } }, icon('plus'), 'Buat')),
        h('div', { class: 'opt' }, h('div', { class: 'grow' }, h('b', null, 'Import config JSON'), h('small', null, 'File hasil Export sebelumnya.')),
          h('button', { class: 'btn', on: { click: ui.files.importConfig } }, icon('upload'), 'Pilih file'))) });
  }

  ui.shell = { mount: mount, owner: owner, nav: nav, ctx: ctx };
})(globalThis.E3D || (globalThis.E3D = {}));
