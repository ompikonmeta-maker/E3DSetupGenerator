/* ZIP reading. Deflate is handled by the browser's built-in DecompressionStream
   (no network, no library). */
(function (E3D) {
  'use strict';

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

  function inflateRaw(bytes) {
    var ds = new DecompressionStream('deflate-raw');
    var stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }

  // Returns [{ name, dir, data: Uint8Array }] in central-directory order.
  function readZip(input) {
    var b = input instanceof Uint8Array ? input : new Uint8Array(input);
    var eocd = -1;
    for (var i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
      if (u32(b, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return Promise.reject(new Error('Bukan file ZIP (EOCD tidak ditemukan).'));
    var count = u16(b, eocd + 10), off = u32(b, eocd + 16), dec = new TextDecoder();
    var entries = [];
    for (var n = 0; n < count; n++) {
      if (u32(b, off) !== 0x02014b50) return Promise.reject(new Error('Central directory ZIP rusak.'));
      var method = u16(b, off + 10), csize = u32(b, off + 20), nlen = u16(b, off + 28),
        xlen = u16(b, off + 30), clen = u16(b, off + 32), local = u32(b, off + 42);
      var name = dec.decode(b.subarray(off + 46, off + 46 + nlen));
      var start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
      entries.push({ name: name, method: method, raw: b.subarray(start, start + csize) });
      off += 46 + nlen + xlen + clen;
    }
    return Promise.all(entries.map(function (e) {
      var dir = /\/$/.test(e.name);
      if (e.method === 0) return { name: e.name, dir: dir, data: e.raw };
      if (e.method === 8) return inflateRaw(e.raw).then(function (d) { return { name: e.name, dir: dir, data: d }; });
      throw new Error('Metode kompresi ZIP ' + e.method + ' tidak didukung (' + e.name + ').');
    }));
  }

  E3D.zip = { read: readZip };
})(globalThis.E3D || (globalThis.E3D = {}));
