// E2E thật: Chromium + game thật + gas/Accounts.gs chạy trong vm (thay cho GAS thật). Chạy: node e2e.cjs
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const { createHash, randomUUID } = require('crypto');
const REPO = process.env.REPO || path.resolve(__dirname, '../..'), S = process.env.OUT || __dirname, THREE = process.env.THREE_DIR || path.join(S, 't');
const PORT = 8123, BASE = 'http://localhost:' + PORT;

// ---- GAS giả (code thật trong vm)
const sheets = {}, cache = new Map();
const mkSheet = () => { const rows = []; let max = 1000; return { rows, getLastRow: () => rows.length, getMaxRows: () => max, getLastColumn: () => (rows[0] ? rows[0].length : 1), insertRowsAfter: (_p, n) => { max += n; }, appendRow: (a) => rows.push(a.slice()),
  getRange: (r, c, nr = 1, nc = 1) => { const rg = { t: false, setNumberFormat() { rg.t = true; return rg; },
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const v = rows[r - 1 + i] && rows[r - 1 + i][c - 1 + j]; return v === undefined ? '' : v; })),
    setValues: (vals) => vals.forEach((row, i) => row.forEach((x, j) => { let v = x; if (!rg.t && typeof v === 'string' && /^\d+(\.\d+)?$/.test(v)) v = Number(v); const R = r - 1 + i; while (rows.length <= R) rows.push([]); rows[R][c - 1 + j] = v; })) }; return rg; } }; };
const ctx = { console, Date,
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'sheet-1', setProperty() {} }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = mkSheet()) }) },
  Session: { getScriptTimeZone: () => 'UTC' },
  Utilities: { DigestAlgorithm: { SHA_256: 1 }, Charset: { UTF_8: 1 }, computeDigest: (_a, s) => Array.from(createHash('sha256').update(String(s), 'utf8').digest(), (b) => (b > 127 ? b - 256 : b)), getUuid: () => randomUUID(), formatDate: (d) => d.toISOString().slice(0, 19) },
  CacheService: { getScriptCache: () => ({ get: (k) => (cache.has(k) ? cache.get(k) : null), put: (k, v) => cache.set(k, String(v)), remove: (k) => cache.delete(k) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: 1 }, createTextOutput: (s) => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }) } };
vm.createContext(ctx);
for (const f of ['Code.gs', 'Storage.gs', 'Accounts.gs']) vm.runInContext(fs.readFileSync(path.join(REPO, 'gas', f), 'utf8'), ctx);
const gasCalls = [];
const gas = (body) => { let a = ''; try { a = JSON.parse(body).action; } catch (_) {} gasCalls.push(a); return vm.runInContext('doPost', ctx)({ postData: { contents: body } }).getContent(); };

// ---- máy chủ tĩnh
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(REPO, p); if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); });

const results = []; const ok = (name, cond, extra = '') => { results.push([cond, name, extra]); console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  → ' + extra : '')); };

async function newDevice(browser, { viewport = { width: 1280, height: 720 }, preset = null, tag }) {
  const c = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' }), pg = await c.newPage(), errs = [];
  pg.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  pg.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource|fonts|net::/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await pg.route('**/*', (r) => {
    const u = r.request().url();
    if (u.startsWith(BASE)) return r.continue();
    if (u.includes('script.google.com')) { const body = r.request().postData() || '{}'; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: gas(body) }); }
    const m = u.match(/three@0\.160\.1\/(.*)$/);
    if (m) { const f = path.join(THREE, m[1]); if (fs.existsSync(f)) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) }); }
    return r.abort();
  });
  if (preset) await pg.addInitScript((p) => { if (!sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded', '1'); for (const [k, v] of Object.entries(p)) localStorage.setItem(k, v); } }, preset);
  await pg.goto(BASE + '/index.html?shadow=512&x=' + tag, { waitUntil: 'domcontentloaded' });
  return { c, pg, errs };
}
const gate = (pg) => pg.evaluate(() => { const f = document.querySelector('.enter-card'); const vis = (s) => { const e = f.querySelector(s); return !!e && !e.hidden && e.offsetParent !== null; };
  return { open: !document.getElementById('enter').hidden, mode: f.dataset.mode, title: document.getElementById('enter-ttl').textContent, go: document.getElementById('en-go').textContent, pw: vis('#en-pw'), pw2: vis('#en-pw2'), look: vis('.en-look'), alt: vis('#en-alt'), altText: document.getElementById('en-alt').textContent, out: vis('#en-out'), err: document.getElementById('en-err').hidden ? '' : document.getElementById('en-err').textContent, temp: vis('#en-temp'), name: document.getElementById('en-name').value, nameDisabled: document.getElementById('en-name').disabled, hud: !document.querySelector('.hud') || !document.querySelector('.hud').hidden }; });
const waitGate = (pg) => pg.waitForFunction(() => { const e = document.getElementById('enter'); return e && !e.hidden && document.querySelector('.enter-card') && document.getElementById('enter-ttl').textContent !== 'Bước vào cửa chùa' || (e && !e.hidden && window.LGT && window.LGT.account === undefined && false); }, null, { timeout: 240000 });
const waitIn = (pg) => pg.waitForFunction(() => { const e = document.getElementById('enter'); return e && e.hidden; }, null, { timeout: 240000 });
const fill = async (pg, { name, pw, pw2 }) => { if (name !== undefined) await pg.fill('#en-name', name); if (pw !== undefined) await pg.fill('#en-pw', pw); if (pw2 !== undefined) await pg.fill('#en-pw2', pw2); };

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const shot = (pg, n) => pg.screenshot({ path: path.join(S, n), timeout: 180000 });
  try {
    for (const vp of [{ width: 390, height: 780, tag: 'phone' }, { width: 360, height: 640, tag: 'small' }]) {
      const E = await newDevice(browser, { tag: 'M' + vp.tag, viewport: { width: vp.width, height: vp.height } });
      await waitGate(E.pg);
      await E.pg.waitForFunction(() => { const i = document.getElementById('sound-invite'); return !i || i.hidden || true; });
      await E.pg.waitForTimeout(3000);
      const geo = await E.pg.evaluate(() => { const c = document.querySelector('.enter-card').getBoundingClientRect(), b = document.getElementById('en-go').getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, Math.min(b.top + b.height / 2, innerHeight - 2)); const inv = document.getElementById('sound-invite'), ir = inv && !inv.hidden ? inv.getBoundingClientRect() : null;
        return { card: [Math.round(c.top), Math.round(c.bottom)], vh: innerHeight, btn: [Math.round(b.top), Math.round(b.bottom)], hitIsBtn: !!hit && (hit.id === 'en-go' || !!hit.closest('#en-go')), hit: hit && (hit.id || hit.className || hit.tagName), invite: ir ? [Math.round(ir.top), Math.round(ir.bottom)] : 'ẩn', hScroll: document.documentElement.scrollWidth > innerWidth, cardScrolls: document.querySelector('.enter-card').scrollHeight > document.querySelector('.enter-card').clientHeight + 1 }; });
      ok(vp.tag + ': thẻ nằm trong màn hình, chạm giữa nút gửi trúng nút (không bị lời mời bật nhạc đè), không tràn ngang', geo.card[0] >= 0 && geo.card[1] <= geo.vh + 1 && geo.hitIsBtn && !geo.hScroll, JSON.stringify(geo));
      await shot(E.pg, 'mobile-' + vp.tag + '.png');
      if (vp.tag === 'phone') {
        await E.pg.route('**script.google.com/**', (r) => r.abort());
        await E.pg.fill('#en-name', 'Mất Mạng'); await E.pg.fill('#en-pw', 'matkhau1'); await E.pg.fill('#en-pw2', 'matkhau1'); await E.pg.click('#en-go');
        await E.pg.waitForFunction(() => !document.getElementById('en-err').hidden, null, { timeout: 90000 });
        const g = await gate(E.pg); ok('phone: mất mạng khi tạo → báo lỗi + nút "Chơi tạm", chưa vào', /Chưa kết nối/.test(g.err) && g.temp && g.open, g.err);
        await shot(E.pg, 'mobile-error.png');
        await E.pg.click('#en-temp'); await waitIn(E.pg);
        ok('phone: "Chơi tạm" vào được chùa, chưa gắn tài khoản', !(await E.pg.evaluate(() => localStorage.getItem('lgt.acct'))) && E.errs.length === 0, E.errs.join('|'));
      }
      await E.c.close();
    }
  } catch (e) { console.log('LỖI:', String(e).slice(0, 500)); results.push([false, 'crash', '']); }
  await browser.close(); srv.close(); const bad = results.filter((r) => !r[0]); console.log(`KẾT QUẢ: ${results.length - bad.length}/${results.length} đạt`); process.exit(bad.length ? 1 : 0);
})();
