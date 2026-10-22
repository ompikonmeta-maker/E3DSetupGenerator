// Dev-only (Playwright). Usage: NODE_PATH=$(npm root -g) node tests/e2e/interact.cjs <abs path to html> <out dir>
// Edits through the UI (code, per-group separator, inactive discipline, error blocking, draft reload, dark mode).
const { chromium } = require('playwright');
const path = require('path');
const assert = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
(async () => {
  const [,, file, outDir] = process.argv;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.25 });
  const p = await ctx.newPage();
  const net = [], errs = [];
  p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) net.push(r.url()); });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + file);
  await p.getByRole('button', { name: 'Muat preset' }).click();
  await p.waitForTimeout(400);
  const stat = async () => (await p.locator('.stat b').first().textContent()).trim();
  assert(await stat() === '250', 'preset: 250 DB');

  // 1. edit project code through the MD3 text field
  const code = p.locator('md-text-field').first().locator('input');
  await code.fill('ABC'); await p.waitForTimeout(500);
  assert((await p.locator('.panel h2').textContent()) === 'ABC', 'kode project -> panel');

  // 2. per-group separator off (HULL-BODY) -> preview has no /R----HULL-BODY----
  await p.locator('.step').nth(2).click(); await p.waitForTimeout(300);
  const row = p.locator('tr.grp').nth(3);
  await row.locator('md-switch').click(); await p.waitForTimeout(400);
  await p.locator('.step').nth(5).click(); await p.waitForTimeout(400);
  const tree = await p.locator('.explorer').first().textContent();
  assert(!tree.includes('/R----HULL-BODY----') && tree.includes('/R----HULL-DECK----'), 'separator per grup mati');

  // 3. deactivate discipline N -> 225 DB
  await p.locator('.step').nth(1).click(); await p.waitForTimeout(300);
  await p.locator('tbody tr').nth(9).locator('md-checkbox').click(); await p.waitForTimeout(500);
  assert(await stat() === '225', 'disiplin N nonaktif -> 225 DB');

  // 4. validation reacts: make a DB No clash by setting base so R lands in reserved range
  await p.locator('.step').nth(0).click(); await p.waitForTimeout(300);
  const base = p.locator('md-text-field[label="Base"] input');
  await base.fill('7000'); await p.waitForTimeout(700);
  assert(/error/.test(await p.locator('.title .pill').textContent()), 'base 7000 -> error muncul: ' + (await p.locator('.title .pill').textContent()).trim());
  await p.locator('.step').nth(7).click(); await p.waitForTimeout(400);
  assert(await p.locator('.cta[disabled]').count() === 1, 'Generate diblokir saat ada error');
  await p.screenshot({ path: path.join(outDir, 'e2e-blocked.png') });
  await p.locator('.step').nth(0).click(); await p.waitForTimeout(300);
  await p.locator('md-text-field[label="Base"] input').fill('10000'); await p.waitForTimeout(700);

  // 5. reload -> draft restored
  await p.reload(); await p.waitForTimeout(700);
  assert((await p.locator('.panel h2').textContent()) === 'ABC' && await stat() === '225', 'draft dimuat ulang setelah reload');

  // 6. dark mode
  await p.locator('.rail .rbtn').last().click(); await p.waitForTimeout(300);
  await p.locator('.step').nth(2).click(); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(outDir, 'e2e-dark.png') });
  assert(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'tema gelap');
  assert(net.length === 0, 'tanpa request jaringan (' + net.length + ')');
  assert(errs.length === 0, 'tanpa error halaman ' + errs.join(' | '));
  await b.close();
})();
