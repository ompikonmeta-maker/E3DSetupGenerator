// Optional dev-machine runner: loads exactly the scripts listed in tests/test.html
// and runs them against the files in fixtures/. Usage: node tests/run-node.mjs [filter]
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'test.html'), 'utf8');
for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
  const file = join(here, m[1]);
  vm.runInThisContext(readFileSync(file, 'utf8'), { filename: file });
}

const fixDir = join(here, '..', 'fixtures');
const fixtures = {};
for (const f of readdirSync(fixDir)) fixtures[f] = new Uint8Array(readFileSync(join(fixDir, f)));

const filter = process.argv[2] || '';
const E3D = globalThis.E3D;
E3D.test.list.splice(0, E3D.test.list.length, ...E3D.test.list.filter((t) => (t.group + ' ' + t.name).includes(filter)));
const results = await E3D.test.run(fixtures, (r) => {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  (${r.ms} ms)`);
  if (!r.pass) console.log('      ' + r.msg.replace(/\n/g, '\n      '));
});
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} lulus`);
process.exit(failed ? 1 : 0);
