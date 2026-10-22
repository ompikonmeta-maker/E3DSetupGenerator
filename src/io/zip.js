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

/* ZIP writing, store mode (no compression): small, dependency-free, readable by Windows Explorer. */
(function (E3D) {
  'use strict';
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(b) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  // DOS date/time from a JS Date (local time, 2-second resolution).
  function dosTime(d) {
    return {
      time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
      date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
    };
  }

  // entries: [{ name, data?: Uint8Array, dir?: bool, date?: Date }] -> Uint8Array
  function writeZip(entries) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    entries.forEach(function (e) {
      var name = enc.encode(e.name), data = e.dir ? new Uint8Array(0) : e.data;
      var crc = crc32(data), t = dosTime(e.date || new Date());
      var utf8 = /[^\x00-\x7f]/.test(e.name) ? 0x0800 : 0;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 10, true); lh.setUint16(6, utf8, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, t.time, true); lh.setUint16(12, t.date, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 10, true); ch.setUint16(8, utf8, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, t.time, true); ch.setUint16(14, t.date, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint32(38, e.dir ? 0x10 : 0, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, p) { return s + p.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    var all = parts.concat(central, [new Uint8Array(end.buffer)]);
    var out = new Uint8Array(offset + cdSize + 22), pos = 0;
    all.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  E3D.zip.write = writeZip;
  E3D.zip.crc32 = crc32;
})(globalThis.E3D || (globalThis.E3D = {}));
