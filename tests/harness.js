/* Minimal test harness shared by tests/test.html (browser) and tests/run-node.mjs (Node).
   Fixtures are passed in as { fileName: Uint8Array }. */
(function (E3D) {
  'use strict';
  var tests = [];

  function AssertError(msg) { this.message = msg; }

  function makeCtx(fixtures) {
    var notes = [];
    return {
      fixtures: fixtures,
      notes: notes,
      note: function (s) { notes.push(String(s)); },
      fixture: function (name) {
        if (!fixtures[name]) throw new AssertError('Fixture ' + name + ' belum dipilih.');
        return fixtures[name];
      },
      ok: function (cond, msg) { if (!cond) throw new AssertError(msg || 'Kondisi tidak terpenuhi.'); },
      eq: function (actual, expected, msg) {
        if (actual !== expected) throw new AssertError((msg ? msg + ': ' : '') + 'dapat ' + JSON.stringify(actual) + ', harus ' + JSON.stringify(expected));
      },
      // Compare two row lists; reports the first differences with row numbers.
      rows: function (actual, expected, label) {
        var diffs = [], n = Math.max(actual.length, expected.length);
        for (var i = 0; i < n && diffs.length < 5; i++) {
          var a = JSON.stringify(actual[i]), e = JSON.stringify(expected[i]);
          if (a !== e) diffs.push('baris ' + (i + 1) + '\n  dapat: ' + a + '\n  harus: ' + e);
        }
        if (diffs.length) throw new AssertError((label || 'rows') + ': ' + actual.length + ' vs ' + expected.length + ' baris\n' + diffs.join('\n'));
      }
    };
  }

  function add(group, name, fn) { tests.push({ group: group, name: name, fn: fn }); }

  function run(fixtures, onResult) {
    var results = [];
    return tests.reduce(function (p, t) {
      return p.then(function () {
        var ctx = makeCtx(fixtures), t0 = Date.now();
        return Promise.resolve().then(function () { return t.fn(ctx); }).then(
          function () { return { pass: true }; },
          function (e) { return { pass: false, msg: e instanceof AssertError ? e.message : (e && e.stack) || String(e) }; }
        ).then(function (r) {
          var res = { group: t.group, name: t.name, pass: r.pass, msg: r.msg || '', notes: ctx.notes, ms: Date.now() - t0 };
          results.push(res);
          if (onResult) onResult(res);
        });
      });
    }, Promise.resolve()).then(function () { return results; });
  }

  E3D.test = { add: add, run: run, list: tests };
})(globalThis.E3D || (globalThis.E3D = {}));
