/* Mode "Perubahan" (phase 5): compare an old config with the current one. Placeholder for now. */
(function (E3D) {
  'use strict';
  var ui = E3D.ui, D = ui.dom, h = D.h;
  ui.modes.changes = { key: 'changes', title: 'Perubahan', icon: 'history', needsDerived: false,
    lead: 'Bandingkan konfigurasi lama dan baru, lalu buat paket delta (D0 hapus, D1 Admin, D2 site, D3 zone).',
    render: function (root) {
      root.appendChild(D.card({ title: 'Segera (fase 5)', icon: 'history', hint: 'Mode ini dibangun setelah UI setup disetujui.',
        body: h('div', { class: 'inner' }, h('div', { class: 'empty' }, h('b', null, 'Belum tersedia'),
          'Nanti: import config lama (JSON) → daftar DB yang dihapus/dibuat → macro ADD + CURRENT untuk menyusun ulang MDB.')) }));
    } };
})(globalThis.E3D || (globalThis.E3D = {}));
