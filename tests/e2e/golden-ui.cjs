// Dev-only (Playwright). Usage: NODE_PATH=$(npm root -g) node tests/e2e/golden-ui.cjs <abs path to src/index.html or dist file> <out dir>
// Loads preset ZRF, screenshots all 8 steps, downloads ZIP + XLSX from the Generate step into <out dir>.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [,, page_, outDir] = process.argv;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.25, acceptDownloads: true });
  const p = await ctx.newPage();
  const net = [], errs = [];
  p.on('request', r => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) net.push(u); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + page_);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(outDir, '00-empty.png') });
  await p.getByRole('button', { name: 'Muat preset' }).click();
  await p.waitForTimeout(600);
  const steps = ['project', 'disc', 'groups', 'zones', 'refs', 'preview', 'validate', 'generate'];
  for (let i = 0; i < steps.length; i++) {
    await p.locator('.step').nth(i).click();
    await p.waitForTimeout(450);
    await p.screenshot({ path: path.join(outDir, String(i + 1).padStart(2, '0') + '-' + steps[i] + '.png') });
  }
  const zipBtn = p.locator('.out').nth(0).getByRole('button', { name: 'Unduh' });
  const [dz] = await Promise.all([p.waitForEvent('download'), zipBtn.click()]);
  await dz.saveAs(path.join(outDir, dz.suggestedFilename()));
  const xBtn = p.locator('.out').nth(1).getByRole('button', { name: 'Unduh' });
  const [dx] = await Promise.all([p.waitForEvent('download'), xBtn.click()]);
  await dx.saveAs(path.join(outDir, dx.suggestedFilename()));
  console.log('downloads:', dz.suggestedFilename(), dx.suggestedFilename());
  console.log('network requests:', net.length, net.slice(0, 3));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await b.close();
})();
