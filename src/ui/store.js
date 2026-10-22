/* App state: the config (source of truth), derived data, validation issues and UI state.
   Events: 'render' (full redraw), 'data' (config changed, no redraw of the active view),
   'issues' (validation finished). localStorage holds only the draft and UI preferences. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui = E3D.ui || {};
  var DRAFT_KEY = 'e3d-setup-generator/draft/v1';
  var PREF_KEY = 'e3d-setup-generator/prefs/v1';

  var S = {
    cfg: null, derived: null, issues: [], issuesFor: null, error: null, savedAt: null,
    ui: { mode: 'setup', step: 'project', disc: null, layout: 'group', file: null, sheet: null, only: null, query: '' }
  };
  var listeners = [];
  var validateTimer = null, saveTimer = null;

  function emit(type) { listeners.forEach(function (fn) { fn(type, S); }); }
  function subscribe(fn) { listeners.push(fn); }

  function recompute() {
    S.error = null;
    try {
      var problems = E3D.model.checkStructure(S.cfg);
      S.derived = problems.length ? null : E3D.derive(S.cfg);
      if (problems.length) { S.issues = problems; S.issuesFor = S.cfg; }
    } catch (e) { S.derived = null; S.error = e.message || String(e); }
    if (S.ui.disc && !S.cfg.disciplines.some(function (d) { return d.letter === S.ui.disc; })) S.ui.disc = null;
    if (!S.ui.disc && S.cfg.disciplines.length) S.ui.disc = S.cfg.disciplines[0].letter;
    scheduleValidate();
  }

  function scheduleValidate() {
    clearTimeout(validateTimer);
    validateTimer = setTimeout(function () {
      try { S.issues = S.derived ? E3D.validate(S.cfg, S.derived) : S.issues; }
      catch (e) { S.issues = [{ level: 'error', code: 'internal', fact: '', msg: 'Validasi gagal: ' + (e.message || e), path: '' }]; }
      S.issuesFor = S.cfg;
      emit('issues');
    }, 180);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  }
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: new Date().toISOString(), config: S.cfg }));
      S.savedAt = new Date();
    } catch (e) { S.savedAt = null; }
  }
  function readDraft() {
    try { var x = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return x && x.config ? x : null; }
    catch (e) { return null; }
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } }

  function prefs(patch) {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; } catch (e) { p = {}; }
    if (patch) { Object.assign(p, patch); try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } }
    return p;
  }

  // Load a config (preset, import, draft). Throws on unreadable configs (see model.migrate).
  function load(cfg) {
    S.cfg = E3D.model.migrate(cfg);
    S.ui.disc = null;
    recompute();
    scheduleSave();
    emit('render');
  }

  // mutate(fn): fn edits S.cfg in place. render=true redraws the active view.
  function mutate(fn, render) {
    fn(S.cfg);
    recompute();
    scheduleSave();
    emit(render ? 'render' : 'data');
  }

  function setUi(patch, render) {
    Object.assign(S.ui, patch);
    emit(render === false ? 'ui' : 'render');
  }

  ui.store = { state: S, subscribe: subscribe, load: load, mutate: mutate, setUi: setUi, readDraft: readDraft,
    clearDraft: clearDraft, saveDraft: saveDraft, prefs: prefs, revalidate: scheduleValidate };
})(globalThis.E3D || (globalThis.E3D = {}));
