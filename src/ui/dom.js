/* Small DOM helpers shared by the views. No framework: views build elements with h()
   and bind inputs straight to config mutations through the store. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui = E3D.ui || {};

  // h('div', { class: 'x', on: { click: fn }, text: 'hi' }, child, [children], 'text')
  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'value' && 'value' in el && tag !== 'md-text-field') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }

  function icon(name, cls) { return h('span', { class: 'ic' + (cls ? ' ' + cls : ''), html: E3DIcons.svg(name) }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function card(opts) {
    var right = opts.right ? h('div', { class: 'right' }, opts.right) : null;
    return h('section', { class: 'card' + (opts.cls ? ' ' + opts.cls : '') },
      h('div', { class: 'ch' }, h('div', null, h('h3', null, opts.icon ? icon(opts.icon) : null, opts.title),
        opts.hint ? h('p', { class: 'hint', html: opts.hint }) : null), right),
      opts.body);
  }

  // Compact table input; commits on 'change' (blur / Enter) so typing never re-renders.
  function cell(value, onCommit, o) {
    o = o || {};
    var el = h('input', { class: 'cell' + (o.cls ? ' ' + o.cls : ''), type: o.type || 'text', placeholder: o.placeholder, title: o.title });
    el.value = value == null ? '' : value;
    el.addEventListener('change', function () { onCommit(o.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') el.blur(); });
    return el;
  }
  function select(options, value, onCommit, o) {
    var el = h('select', { class: 'cell' + (o && o.cls ? ' ' + o.cls : '') });
    options.forEach(function (op) {
      var opt = h('option', { value: op.value, text: op.label });
      if (op.value === value) opt.selected = true;
      el.appendChild(opt);
    });
    el.addEventListener('change', function () { onCommit(el.value); });
    return el;
  }
  // MD3 components
  function mdSwitch(on, onChange, label) {
    var el = h('md-switch', { selected: !!on, 'aria-label': label });
    el.addEventListener('change', function () { onChange(el.hasAttribute('selected')); });
    return el;
  }
  function mdCheckbox(on, onChange, label) {
    var el = h('md-checkbox', { checked: !!on, 'aria-label': label });
    el.addEventListener('change', function () { onChange(el.hasAttribute('checked')); });
    return el;
  }
  function mdChip(label, on, onChange) {
    var el = h('md-chip', { variant: 'filter', selected: !!on }, label);
    el.addEventListener('change', function () { onChange(el.hasAttribute('selected')); });
    return el;
  }
  // Outlined MD3 text field; onInput fires on every keystroke (store mutation without re-render).
  function mdField(label, value, onInput, o) {
    o = o || {};
    var el = h('md-text-field', { variant: 'outlined', label: label, value: value == null ? '' : String(value),
      type: o.type, 'supporting-text': o.support, class: o.cls });
    el.addEventListener('input', function () { onInput(o.type === 'number' ? Number(el.value) : el.value); });
    return el;
  }

  // Row drag & drop: handles carry draggable + data-drag=<key>, targets carry data-drop=<key>.
  // onDrop(fromKey, toKey, targetDataset).
  function dragRows(container, onDrop) {
    var from = null;
    var row = null;
    container.addEventListener('dragstart', function (e) {
      var g = e.target.closest && e.target.closest('[data-drag]');
      if (!g) return;
      from = g.dataset.drag;
      row = g.closest('tr') || g;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', from);
      if (row !== g) e.dataTransfer.setDragImage(row, 20, 16);
    });
    container.addEventListener('dragend', function () {
      if (row) row.classList.remove('dragging');
      clear();
      from = null; row = null;
    });
    container.addEventListener('dragover', function (e) {
      var tr = e.target.closest('[data-drop]');
      if (!tr || from === null) return;
      e.preventDefault();
      clear();
      tr.classList.add('drop-before');
    });
    container.addEventListener('drop', function (e) {
      var tr = e.target.closest('[data-drop]');
      if (!tr || from === null) return;
      e.preventDefault();
      clear();
      onDrop(from, tr.dataset.drop, tr.dataset);
    });
    function clear() { container.querySelectorAll('.drop-before').forEach(function (x) { x.classList.remove('drop-before'); }); }
  }

  function download(name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
    var a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function pickFile(accept, multiple) {
    return new Promise(function (resolve) {
      var inp = h('input', { type: 'file', accept: accept, multiple: !!multiple, style: { display: 'none' } });
      inp.addEventListener('change', function () { resolve(Array.from(inp.files || [])); inp.remove(); });
      document.body.appendChild(inp); inp.click();
    });
  }

  var snackTimer = null;
  function snack(msg) {
    var el = document.getElementById('snack');
    if (!el) { el = h('div', { id: 'snack', class: 'snack', role: 'status' }); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(snackTimer);
    snackTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  // Modal built on <md-dialog>. Returns { close }.
  function dialog(title, body, actions) {
    var dlg = h('md-dialog', null, h('span', { slot: 'headline', text: title }), body,
      h('div', { slot: 'actions', style: { display: 'flex', gap: '8px' } }, actions.map(function (a) {
        return h('md-button', { variant: a.primary ? 'filled' : 'text', on: { click: function () { if (a.run() !== false) close(); } } }, a.label);
      })));
    document.body.appendChild(dlg);
    requestAnimationFrame(function () { dlg.show(); });
    function close() { dlg.close(); setTimeout(function () { dlg.remove(); }, 300); }
    return { close: close, el: dlg };
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(fallback);
    fallback();
    return Promise.resolve();
    function fallback() {
      var ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
  }

  function readText(file) { return file.text(); }
  function readBytes(file) { return file.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }

  ui.dom = { h: h, icon: icon, esc: esc, card: card, cell: cell, select: select, mdSwitch: mdSwitch, mdCheckbox: mdCheckbox,
    mdChip: mdChip, mdField: mdField, dragRows: dragRows, download: download, pickFile: pickFile, snack: snack, dialog: dialog,
    copyText: copyText, readText: readText, readBytes: readBytes };
})(globalThis.E3D || (globalThis.E3D = {}));
