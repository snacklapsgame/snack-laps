/**
 * Headless Chrome check at iPhone size (390×844).
 * The default page must load with no console or page errors.
 * Privacy / Ad Settings stays hidden on the web and does nothing if activated.
 *
 * A second load with ?privacyPreview=1 only adds the native-app class so the
 * screenshot can show the iPhone control. That query does not call AdMob,
 * show a UMP form, or request tracking. It is not a real-device consent test.
 */
import { createServer } from 'http';
import { mkdir, readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const root = join(fileURLToPath(import.meta.url), '..', '..', 'www');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
  try {
    let p = req.url.split('?')[0];
    if (p === '/') p = '/index.html';
    const data = await readFile(join(root, p));
    res.writeHead(200, { 'Content-Type': mime[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/`;

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push('console.error: ' + msg.text());
});

await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForSelector('#lbBtnStart', { timeout: 10000 });
await page.waitForSelector('#privacyBtnStart', { timeout: 10000 });
const hasLB = await page.$eval('#lbBtnStart', (el) => !!el && /Global Leaderboard/i.test(el.textContent || ''));
const hasPlay = await page.$eval('#playBtn', (el) => !!el);
const privacyHidden = await page.$eval('.privacySlot', (el) => getComputedStyle(el).display === 'none');
await page.evaluate(() => {
  localStorage.setItem('nomLoop.scores.v1', JSON.stringify([{ s: 12, t: Date.now() }]));
});
const stored = await page.evaluate(() => localStorage.getItem('nomLoop.scores.v1'));
await page.$eval('#privacyBtnStart', (el) => el.click());
await page.click('#playBtn');
await page.waitForFunction(() => document.getElementById('start').classList.contains('hidden'), { timeout: 5000 });

await page.goto(url + '?privacyPreview=1', { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForSelector('#privacyBtnStart', { timeout: 10000 });
const preview = await page.$eval('#privacyBtnStart', (el) => {
  const slot = el.closest('.privacySlot');
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(slot);
  return {
    text: (el.textContent || '').trim(),
    display: style.display,
    width: rect.width,
    height: rect.height,
    top: rect.top,
  };
});
const shotDir = '/opt/cursor/artifacts';
await mkdir(shotDir, { recursive: true });
const shotPath = shotDir + '/snack-laps-start-privacy-settings.png';
await page.screenshot({ path: shotPath, fullPage: false });
await page.screenshot({ path: join(fileURLToPath(import.meta.url), '..', '..', 'screenshot-privacy-ad-settings.png'), fullPage: false });
await page.$eval('#privacyBtnStart', (el) => el.click());

const ok = errors.length === 0 && hasLB && hasPlay && !!stored && privacyHidden
  && preview.display !== 'none' && preview.height > 20 && preview.top >= 0 && preview.top < 800
  && preview.text === 'Privacy / Ad Settings';

console.log(JSON.stringify({
  ok,
  hasLB,
  hasPlay,
  storedOk: !!stored,
  privacyHiddenOnWeb: privacyHidden,
  preview,
  screenshot: shotPath,
  errors,
}, null, 2));

await browser.close();
server.close();
if (!ok) process.exit(1);
