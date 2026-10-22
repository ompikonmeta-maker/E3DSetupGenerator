/* Inline SVG icons (24×24, stroke = currentColor). Used directly and by the vendored MD3
   components through MD3Icon(name). No icon font, no network. */
(function (G) {
  'use strict';
  var P = {
    home: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.8 14.2c2.2.1 3.9 1.6 4.4 4.3"/>',
    layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    download: '<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
    upload: '<path d="M12 15V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M5 19.5h14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    grip: '<circle cx="9" cy="6" r="1.1"/><circle cx="15" cy="6" r="1.1"/><circle cx="9" cy="12" r="1.1"/><circle cx="15" cy="12" r="1.1"/><circle cx="9" cy="18" r="1.1"/><circle cx="15" cy="18" r="1.1"/>',
    'chevron-right': '<path d="m9.5 6 6 6-6 6"/>',
    'chevron-down': '<path d="m6 9.5 6 6 6-6"/>',
    alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.2"/><circle cx="12" cy="17" r=".6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6"/>',
    'check-circle': '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
    'error-circle': '<circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/>',
    file: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z" transform="translate(-.5 0)"/><path d="M13.5 3.5v4h4"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    tree: '<rect x="3.5" y="3.5" width="6" height="5" rx="1.2"/><rect x="14.5" y="10" width="6" height="5" rx="1.2"/><rect x="14.5" y="16" width="6" height="4.5" rx="1.2"/><path d="M6.5 8.5v10h8M6.5 12.5h8"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4.5v4h4"/><path d="M12 8v4.5l3 2"/>',
    sparkle: '<path d="M12 3.5c.6 4.2 2.3 6 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.5 5.9-2.3 6.5-6.5z"/><path d="M18.5 15.5c.3 1.7 1 2.4 2.5 2.7-1.5.3-2.2 1-2.5 2.6-.3-1.6-1-2.3-2.5-2.6 1.5-.3 2.2-1 2.5-2.7z"/>',
    moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M21.2 12h-2M4.8 12h-2M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4M18.5 18.5l-1.4-1.4M6.9 6.9 5.5 5.5"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    zip: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z" transform="translate(-.5 0)"/><path d="M11 6h1.5M11 8.5h1.5M11 11h1.5M11 13.5h1.5v3H11z"/>',
    sheet: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h16M4 15h16M10 9.5V20"/>'
  };

  function svg(name, size) {
    var p = P[name];
    if (!p) return '';
    var s = size || '1em';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + s + '" height="' + s +
      '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  G.E3DIcons = { svg: svg, names: Object.keys(P) };
})(globalThis);
