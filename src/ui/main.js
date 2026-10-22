/* Entry point: theme preference, shell, and the saved draft (if any). */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, store = ui.store;
  var prefs = store.prefs();
  if (prefs.theme) document.documentElement.dataset.theme = prefs.theme;

  function start() {
    ui.shell.mount(document.getElementById('app'));
    var draft = store.readDraft();
    if (draft) {
      try { store.load(draft.config); ui.dom.snack('Draft terakhir dimuat (' + draft.savedAt.slice(0, 16).replace('T', ' ') + ').'); }
      catch (e) { ui.dom.snack('Draft tidak bisa dibuka: ' + e.message); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(globalThis.E3D || (globalThis.E3D = {}));
