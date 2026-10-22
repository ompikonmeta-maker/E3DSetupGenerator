/* XLSX reading: cell values only (shared strings, inline strings, numbers, booleans).
   Uses a regex scanner instead of DOMParser so it runs in the browser and in Node tests. */
(function (E3D) {
  'use strict';

  var ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  function unescapeXml(s) {
    return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-z]+);/g, function (m, e) {
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENT[e] !== undefined ? ENT[e] : m;
    });
  }
  function attr(tag, name) {
    var m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag);
    return m ? unescapeXml(m[1]) : null;
  }
  // Text of all <t> runs inside a fragment (handles rich text and xml:space).
  function texts(xml) {
    var out = '', re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g, m;
    while ((m = re.exec(xml))) out += m[1] ? unescapeXml(m[1]) : '';
    return out;
  }
  function colIndex(ref) {
    var letters = /^[A-Z]+/.exec(ref)[0], n = 0;
    for (var i = 0; i < letters.length; i++) n = n * 26 + letters.charCodeAt(i) - 64;
    return n - 1;
  }

  // Returns { sheets: [{ name, rows: Map(rowNumber -> Array(cells)) }] }; numbers stay numbers.
  function readXlsx(bytes) {
    return E3D.zip.read(bytes).then(function (entries) {
      var files = new Map(entries.map(function (e) { return [e.name, e.data]; }));
      var dec = new TextDecoder();
      function get(p) { var d = files.get(p); return d ? dec.decode(d) : null; }

      var shared = [];
      var ssx = get('xl/sharedStrings.xml');
      if (ssx) { var re = /<si>([\s\S]*?)<\/si>/g, m; while ((m = re.exec(ssx))) shared.push(texts(m[1])); }

      var rels = new Map(), relx = get('xl/_rels/workbook.xml.rels') || '';
      (relx.match(/<Relationship\b[^>]*>/g) || []).forEach(function (t) { rels.set(attr(t, 'Id'), attr(t, 'Target')); });

      var sheets = (get('xl/workbook.xml').match(/<sheet\b[^>]*>/g) || []).map(function (t) {
        var target = rels.get(attr(t, 'r:id')) || '';
        var path = target.charAt(0) === '/' ? target.slice(1) : 'xl/' + target;
        return { name: attr(t, 'name'), rows: parseSheet(get(path) || '', shared) };
      });
      return { sheets: sheets, sheet: function (name) { return sheets.find(function (s) { return s.name === name; }); } };
    });
  }

  function parseSheet(xml, shared) {
    var rows = new Map();
    var rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g, rm;
    while ((rm = rowRe.exec(xml))) {
      var r = Number(attr(rm[1], 'r')), cells = [];
      var cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, cm;
      while ((cm = cellRe.exec(rm[2] || ''))) {
        var t = attr(cm[1], 't'), body = cm[2] || '', ref = attr(cm[1], 'r');
        var v = /<v>([\s\S]*?)<\/v>/.exec(body), val;
        if (t === 's') val = shared[Number(v[1])];
        else if (t === 'inlineStr') val = texts(body);
        else if (t === 'str' || t === 'e') val = v ? unescapeXml(v[1]) : '';
        else if (t === 'b') val = v ? v[1] === '1' : null;
        else val = v ? Number(v[1]) : null;
        cells[colIndex(ref)] = val;
      }
      rows.set(r, cells);
    }
    return rows;
  }

  E3D.xlsx = { read: readXlsx, colIndex: colIndex };
})(globalThis.E3D || (globalThis.E3D = {}));
