/* Pure derivation: config -> DBs, site order, zones and MDB positions.
   No DOM, no I/O. Everything the macros and the register print comes from here. */
(function (E3D) {
  'use strict';
  var fmt = E3D.util.fmt;

  // Items of a discipline in register order (config.items order, optionally filtered).
  function itemsFor(cfg, disc) {
    if (!Array.isArray(disc.items)) return cfg.items.slice();
    var keep = new Set(disc.items);
    return cfg.items.filter(function (it) { return keep.has(it.code); });
  }

  // Display order = register order stably sorted by group order (PLAN T1).
  function displayOrder(cfg, items) {
    var rank = new Map(cfg.groups.map(function (g, i) { return [g.name, i]; }));
    return items.map(function (it, i) { return { it: it, i: i }; })
      .sort(function (a, b) { return (rank.get(a.it.group) - rank.get(b.it.group)) || (a.i - b.i); })
      .map(function (x) { return x.it; });
  }

  function zonesOf(cfg, disc, func) {
    var spec = func && func.zones !== 'discipline' ? (cfg.zoneSets[func.zones] || { zones: [] }).zones : disc.zones;
    var out = [];
    spec.forEach(function (z) {
      if (!z.forEach) { out.push(z); return; }
      var list = cfg.codeLists[z.forEach];
      (list ? list.items : []).forEach(function (c) {
        var v = { CODE: c.code, DESC: c.desc };
        out.push({ suffix: fmt(z.suffix, v), purpose: fmt(z.purpose, v), docRef: z.docRef, status: z.status });
      });
    });
    if (func && func.zoneStatus) out = out.map(function (z) { return Object.assign({}, z, { status: func.zoneStatus }); });
    return out;
  }

  function derive(cfg) {
    var funcs = new Map(cfg.functions.map(function (f) { return [f.letter, f]; }));
    var groups = new Map(cfg.groups.map(function (g) { return [g.name, g]; }));
    var missing = [];
    var discs = cfg.disciplines.filter(function (d) { return d.active; });
    var mdbPos = 0;

    var out = discs.map(function (disc, di) {
      var v0 = { TEAM: disc.team, D: disc.letter, DISCIPLINE: disc.name.toUpperCase(), Discipline: disc.name,
        PROJECT: cfg.project.name, PROJECTCODE: cfg.project.code };
      var regItems = itemsFor(cfg, disc);
      var rankInGroup = new Map(), dbs = new Map();

      displayOrder(cfg, regItems).forEach(function (it) {
        var g = groups.get(it.group) || { name: it.group, slotBase: 0 };
        var f = funcs.get(it.func) || { letter: it.func, name: it.func, zones: 'discipline' };
        var rank = rankInGroup.get(g.name) || 0;
        rankInGroup.set(g.name, rank + 1);
        var v = Object.assign({}, v0, { CODE: it.code, F: it.func, GROUP: g.name, ITEM: it.desc });
        var slot = g.slotBase + rank;
        dbs.set(it, {
          disc: disc, item: it, group: g, func: f, rankInGroup: rank, slot: slot,
          dbno: cfg.dbNumber.base + disc.order * cfg.dbNumber.disciplineStep + slot,
          db: fmt(cfg.formats.dbName, v, missing),
          site: fmt(cfg.formats.siteName, v, missing),
          desc: fmt(cfg.formats.dbDesc, v, missing),
          mdbPos: ++mdbPos
        });
      });

      var display = displayOrder(cfg, regItems).map(function (it) { return dbs.get(it); });

      // Site order: separators sit in the DB of the first site they precede (facts 3.3, 3.4).
      var siteOrder = [], lastGroup = null;
      display.forEach(function (row, i) {
        if (i === 0 && cfg.separators.discipline)
          siteOrder.push({ type: 'sepDiscipline', name: fmt(cfg.formats.sepDiscipline, v0, missing), row: row, group: '' });
        if (row.group.name !== lastGroup && cfg.separators.group && row.group.separator !== false)
          siteOrder.push({ type: 'sepGroup', name: fmt(cfg.formats.sepGroup, Object.assign({}, v0, { GROUP: row.group.name }), missing),
            row: row, group: row.group.name });
        lastGroup = row.group.name;
        siteOrder.push({ type: 'site', name: row.site, row: row, group: row.group.name });
      });

      var zones = [];
      display.forEach(function (row) {
        var list = zonesOf(cfg, disc, row.func);
        if (!list.length) zones.push({ row: row, pending: true });
        list.forEach(function (z) {
          zones.push({ row: row, pending: false, name: row.site + z.suffix, suffix: z.suffix,
            purpose: z.purpose, docRef: z.docRef, status: z.status });
        });
      });

      return {
        disc: disc, index: di,
        teamDesc: fmt(cfg.formats.teamDesc, v0, missing),
        register: regItems.map(function (it) { return dbs.get(it); }),
        display: display, siteOrder: siteOrder, zones: zones,
        pending: disc.zones.length === 0
      };
    });

    var refs = cfg.references.map(function (r) {
      return { ref: r, db: r.db, pending: !!r.pending, note: r.note, mdbPos: r.pending ? null : ++mdbPos };
    });

    return {
      disciplines: out,
      dbs: [].concat.apply([], out.map(function (d) { return d.display; })),
      references: refs,
      mdbCount: mdbPos,
      missingPlaceholders: Array.from(new Set(missing))
    };
  }

  E3D.derive = derive;
  E3D.deriveHelpers = { itemsFor: itemsFor, displayOrder: displayOrder, zonesOf: zonesOf };
})(globalThis.E3D || (globalThis.E3D = {}));
