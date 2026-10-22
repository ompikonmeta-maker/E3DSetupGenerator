/* Shared helpers. Every src file registers itself on the global E3D namespace
   (classic scripts, no ES modules: file:// pages cannot load modules). */
(function (E3D) {
  'use strict';

  // Replace {KEY} placeholders. Unknown keys are kept verbatim and reported via `missing`.
  function fmt(template, vars, missing) {
    return String(template).replace(/\{([A-Za-z_]+)\}/g, function (m, key) {
      if (Object.prototype.hasOwnProperty.call(vars, key)) return String(vars[key]);
      if (missing) missing.push(key);
      return m;
    });
  }

  function placeholders(template) {
    var out = [], re = /\{([A-Za-z_]+)\}/g, m;
    while ((m = re.exec(String(template)))) out.push(m[1]);
    return out;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function countBy(list, keyFn) {
    var map = new Map();
    list.forEach(function (x) { var k = keyFn(x); map.set(k, (map.get(k) || 0) + 1); });
    return map;
  }

  // Collapse runs of whitespace and trim ("as received, spaces trimmed" in the ZRF register).
  function squash(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  E3D.util = { fmt: fmt, placeholders: placeholders, clone: clone, countBy: countBy, squash: squash };
})(globalThis.E3D || (globalThis.E3D = {}));
