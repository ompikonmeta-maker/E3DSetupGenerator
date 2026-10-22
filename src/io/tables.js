/* Parsers for pasted or imported lists: code lists (fluid codes) and existing-DB tables. */
(function (E3D) {
  'use strict';
  var squash = E3D.util.squash;

  // "CODE<TAB>Description" per line (Excel copy/paste). Returns { items, errors }.
  function parseCodeList(text) {
    var items = [], errors = [], seen = new Set();
    String(text).split(/\r\n|\r|\n/).forEach(function (line, i) {
      if (!line.trim()) return;
      var tab = line.indexOf('\t');
      if (tab < 0) { errors.push('Baris ' + (i + 1) + ': tidak ada TAB antara kode dan deskripsi.'); return; }
      var code = squash(line.slice(0, tab)), desc = squash(line.slice(tab + 1));
      if (!code) { errors.push('Baris ' + (i + 1) + ': kode kosong.'); return; }
      if (seen.has(code)) errors.push('Baris ' + (i + 1) + ': kode ' + code + ' dobel.');
      seen.add(code);
      items.push({ code: code, desc: desc, note: '' });
    });
    return { items: items, errors: errors };
  }

  // Header names accepted for each field (compared case-insensitively, ignoring spaces and dots).
  var HEADERS = {
    name: ['db', 'dbname', 'database', 'name'],
    dbno: ['dbno', 'number', 'dbnumber'],
    source: ['project', 'source']
  };
  function key(h) { return String(h == null ? '' : h).toLowerCase().replace(/[\s.]/g, ''); }

  // Find column indexes from a header row. Missing name/dbno columns are reported, not guessed.
  function detectColumns(header) {
    var cols = {};
    Object.keys(HEADERS).forEach(function (field) {
      var idx = header.findIndex(function (h) { return HEADERS[field].indexOf(key(h)) >= 0; });
      if (idx >= 0) cols[field] = idx;
    });
    return cols;
  }

  // rows: array of arrays, first row = header. Returns { dbs, errors, columns }.
  function existingFromRows(rows, defaultSource) {
    var header = rows[0] || [], cols = detectColumns(header), errors = [], dbs = [];
    if (cols.name === undefined) errors.push('Kolom nama DB tidak ditemukan (header: ' + HEADERS.name.join('/') + ').');
    if (cols.dbno === undefined) errors.push('Kolom DB No tidak ditemukan (header: ' + HEADERS.dbno.join('/') + ').');
    if (errors.length) return { dbs: dbs, errors: errors, columns: cols };
    rows.slice(1).forEach(function (r, i) {
      var name = squash(r[cols.name]);
      if (!name) return;
      var no = r[cols.dbno], n = typeof no === 'number' ? no : Number(squash(no));
      if (squash(no) !== '' && !Number.isFinite(n)) errors.push('Baris ' + (i + 2) + ': DB No "' + no + '" bukan angka.');
      dbs.push({ name: name, dbno: Number.isFinite(n) && squash(no) !== '' ? n : null,
        source: cols.source !== undefined ? squash(r[cols.source]) : (defaultSource || '') });
    });
    return { dbs: dbs, errors: errors, columns: cols };
  }

  // Sheet rows (Map rowNumber -> cells) from E3D.xlsx -> array of arrays in row order.
  function sheetToRows(sheet) {
    return Array.from(sheet.rows.keys()).sort(function (a, b) { return a - b; })
      .map(function (r) { return sheet.rows.get(r); });
  }

  // CSV with quotes; separator auto-detected between ',', ';' and TAB from the header line.
  function parseCsv(text) {
    var first = String(text).split(/\r?\n/)[0] || '';
    var sep = [',', ';', '\t'].sort(function (a, b) { return first.split(b).length - first.split(a).length; })[0];
    var rows = [], row = [], cell = '', q = false, s = String(text);
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) {
        if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && s[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  E3D.tables = { parseCodeList: parseCodeList, existingFromRows: existingFromRows, detectColumns: detectColumns,
    sheetToRows: sheetToRows, parseCsv: parseCsv };
})(globalThis.E3D || (globalThis.E3D = {}));
