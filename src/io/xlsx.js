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

/* XLSX writing: inline strings + numbers, light styling (title, header, wrap), frozen header,
   column widths and autofilter. Input = E3D.register.build() result. */
(function (E3D) {
  'use strict';
  var NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  var NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  var XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var STYLE = { text: 0, title: 1, header: 2, wrap: 3, section: 4, ok: 5, warn: 6 };

  function esc(s) {
    return String(s).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function colName(i) { var s = ''; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; } return s; }

  var STYLES = XML + '<styleSheet xmlns="' + NS + '">' +
    '<fonts count="3"><font><sz val="10"/><name val="Segoe UI"/></font><font><b/><sz val="10"/><name val="Segoe UI"/></font>' +
    '<font><b/><sz val="13"/><name val="Segoe UI"/></font></fonts>' +
    '<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEEF0F6"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE3F4EC"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFBF1DF"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="7">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  function sheetXml(sh) {
    var header = sh.rows.find(function (r) { return r.role === 'header'; });
    var data = sh.rows.filter(function (r) { return r.role === 'data'; });
    var ncol = sh.rows.reduce(function (m, r) { return Math.max(m, r.cells.length); }, 0);
    var widths = [];
    for (var i = 0; i < ncol; i++) {
      var w = sh.widths && sh.widths[i];
      if (!w) {
        w = 6;
        sh.rows.forEach(function (r) {
          if ((r.noWidth && i === 0) || r.role === 'title' || r.role === 'section' || (r.role === 'text' && r.cells.length === 1)) return;
          var v = r.cells[i];
          if (v != null) String(v).split('\n').forEach(function (l) { w = Math.max(w, l.length + 2); });
        });
        w = Math.min(w, 70);
      }
      widths.push(w);
    }
    var x = XML + '<worksheet xmlns="' + NS + '" xmlns:r="' + NS_R + '">';
    if (header && data.length) {
      x += '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + header.r + '" topLeftCell="A' + (header.r + 1) +
        '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
    }
    if (ncol) x += '<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>';
    x += '<sheetData>';
    sh.rows.forEach(function (r) {
      x += '<row r="' + r.r + '">';
      r.cells.forEach(function (v, i) {
        if (v == null) return;
        var ref = colName(i) + r.r;
        var s = r.role === 'title' ? STYLE.title : r.role === 'header' ? STYLE.header : r.role === 'section' ? STYLE.section
          : r.tones && r.tones[i] ? STYLE[r.tones[i]]
          : typeof v === 'string' && (v.indexOf('\n') >= 0 || v.length > widths[i]) && !(r.noWidth && i === 0) && !(r.role === 'text' && r.cells.length === 1) ? STYLE.wrap : STYLE.text;
        if (typeof v === 'number') x += '<c r="' + ref + '" s="' + s + '"><v>' + v + '</v></c>';
        else x += '<c r="' + ref + '" s="' + s + '" t="inlineStr"><is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
      });
      x += '</row>';
    });
    x += '</sheetData>';
    if (header && data.length) x += '<autoFilter ref="A' + header.r + ':' + colName(ncol - 1) + data[data.length - 1].r + '"/>';
    return { xml: x + '</worksheet>', filter: header && data.length ? '$A$' + header.r + ':$' + colName(ncol - 1) + '$' + data[data.length - 1].r : null };
  }

  // reg: { sheets: [{ name, rows, widths }] } -> Promise<Uint8Array>
  function writeXlsx(reg, date) {
    var enc = new TextEncoder(), when = date || new Date(), parts = [];
    var n = reg.sheets.length;
    function part(name, text) { parts.push({ name: name, data: enc.encode(text), date: when }); }
    var built = reg.sheets.map(sheetXml);
    part('[Content_Types].xml', XML + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      reg.sheets.map(function (s, i) {
        return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      }).join('') + '</Types>');
    part('_rels/.rels', XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="' + NS_R + '/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    var defined = built.map(function (b, i) {
      return b.filter ? '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' +
        esc(reg.sheets[i].name.replace(/'/g, "''")) + '\'!' + b.filter + '</definedName>' : '';
    }).join('');
    part('xl/workbook.xml', XML + '<workbook xmlns="' + NS + '" xmlns:r="' + NS_R + '"><sheets>' +
      reg.sheets.map(function (s, i) { return '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') +
      '</sheets>' + (defined ? '<definedNames>' + defined + '</definedNames>' : '') + '</workbook>');
    part('xl/_rels/workbook.xml.rels', XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      reg.sheets.map(function (s, i) {
        return '<Relationship Id="rId' + (i + 1) + '" Type="' + NS_R + '/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      }).join('') + '<Relationship Id="rId' + (n + 1) + '" Type="' + NS_R + '/styles" Target="styles.xml"/></Relationships>');
    part('xl/styles.xml', STYLES);
    built.forEach(function (b, i) { part('xl/worksheets/sheet' + (i + 1) + '.xml', b.xml); });
    return E3D.zip.writeDeflate(parts);
  }

  // Excel sheet-name rules: 1-31 chars, none of : \ / ? * [ ], unique (case-insensitive).
  function sheetNameProblems(names) {
    var out = [], seen = new Set();
    names.forEach(function (nm) {
      if (!nm || nm.length > 31) out.push('Nama sheet "' + nm + '" harus 1–31 karakter.');
      if (/[:\\\/?*\[\]]/.test(nm)) out.push('Nama sheet "' + nm + '" memakai karakter terlarang (: \\ / ? * [ ]).');
      if (seen.has(nm.toLowerCase())) out.push('Nama sheet "' + nm + '" dobel.');
      seen.add(nm.toLowerCase());
    });
    return out;
  }

  E3D.xlsx.write = writeXlsx;
  E3D.xlsx.sheetNameProblems = sheetNameProblems;
})(globalThis.E3D || (globalThis.E3D = {}));
