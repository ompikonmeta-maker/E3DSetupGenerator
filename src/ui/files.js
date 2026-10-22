/* Config file actions: preset, new, import/export JSON. Replacing a config asks first. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h, store = ui.store, S = store.state;

  function replaceConfig(next, label) {
    if (!S.cfg) { apply(); return; }
    D.dialog('Ganti konfigurasi?', h('p', { style: { margin: 0, maxWidth: '420px' } },
      'Konfigurasi sekarang (' + (S.cfg.project.code || 'tanpa kode') + ') akan diganti dengan ' + label +
      '. Export JSON dulu kalau masih perlu.'),
      [{ label: 'Batal', run: function () {} }, { label: 'Export dulu', run: function () { exportConfig(); return false; } },
       { label: 'Ganti', primary: true, run: apply }]);
    function apply() {
      try { store.load(next()); store.setUi({ mode: 'setup', step: 'project' }); D.snack(label + ' dimuat.'); }
      catch (e) { D.snack('Gagal: ' + (e.message || e)); }
    }
  }

  function loadPreset(key) {
    var p = E3D.presets[key];
    replaceConfig(function () { return p.build(); }, 'preset ' + p.name);
  }
  function newProject() { replaceConfig(function () { return E3D.model.blank(); }, 'project baru'); }

  function importConfig() {
    D.pickFile('.json,application/json').then(function (files) {
      if (!files.length) return;
      files[0].text().then(function (txt) {
        var json;
        try { json = JSON.parse(txt); } catch (e) { D.snack('File bukan JSON yang valid.'); return; }
        try { E3D.model.migrate(json); } catch (e) { D.snack(e.message); return; }
        replaceConfig(function () { return json; }, files[0].name);
      });
    });
  }

  function exportConfig() {
    if (!S.cfg) return;
    D.download((S.cfg.project.code || 'project') + '-config.json', JSON.stringify(S.cfg, null, 2) + '\n', 'application/json');
    D.snack('Config diekspor.');
  }

  ui.files = { loadPreset: loadPreset, newProject: newProject, importConfig: importConfig, exportConfig: exportConfig };
})(globalThis.E3D || (globalThis.E3D = {}));
