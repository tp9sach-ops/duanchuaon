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
    // 1) Máy mới tinh → "Tạo nhân vật"
    const A = await newDevice(browser, { tag: 'A' });
    await waitGate(A.pg); let g = await gate(A.pg);
    ok('1. máy mới: chế độ tạo nhân vật, có ô mật khẩu + nhập lại + màu/kiểu đầu', g.mode === 'new' && g.pw && g.pw2 && g.look && g.alt && g.altText.includes('Đăng nhập'), JSON.stringify(g));
    await shot(A.pg, 'new-desktop.png');
    // mật khẩu quá ngắn / không khớp
    await fill(A.pg, { name: 'Minh An', pw: '123', pw2: '123' }); await A.pg.click('#en-go'); g = await gate(A.pg); ok('2. mật khẩu ngắn bị chặn tại máy', /ít nhất 6/.test(g.err) && g.open, g.err);
    await fill(A.pg, { pw: 'matkhau1', pw2: 'matkhau2' }); await A.pg.click('#en-go'); g = await gate(A.pg); ok('3. nhập lại không khớp bị chặn', /chưa giống nhau/.test(g.err), g.err);
    const before = gasCalls.length;
    // tạo thật
    await fill(A.pg, { pw: 'matkhau1', pw2: 'matkhau1' }); await A.pg.click('#en-go'); await waitIn(A.pg);
    ok('4. tạo "Minh An" thành công và vào chùa', gasCalls.slice(before).includes('acctCreate') && sheets.Accounts && sheets.Accounts.rows.length === 2, gasCalls.slice(before).join(','));
    ok('5. Sheet không chứa mật khẩu', !JSON.stringify(sheets.Accounts.rows).includes('matkhau1'));
    const st = await A.pg.evaluate(() => ({ acct: JSON.parse(localStorage.getItem('lgt.acct') || 'null'), name: localStorage.getItem('lgt.name'), chip: (document.querySelector('.chip-me')||{}).textContent, has: !!(window.LGT && window.LGT.account) }));
    ok('6. máy A có phiên đăng nhập + LGT.account', !!(st.acct && st.acct.token) && st.name === 'Minh An' && st.has, JSON.stringify({ n: st.name, chip: st.chip, has: st.has }));
    // chơi thêm: ghi dữ liệu game rồi để tự lưu (ẩn trang → lưu ngay)
    await A.pg.evaluate(() => { localStorage.setItem('lgt.wallet', JSON.stringify({ sen: 777 })); window.dispatchEvent(new Event('pagehide')); });
    await A.pg.waitForFunction(() => JSON.parse(localStorage.getItem('lgt.acct')).rev >= 2, null, { timeout: 60000 }).catch(() => {});
    const rev = await A.pg.evaluate(() => JSON.parse(localStorage.getItem('lgt.acct')).rev);
    console.log('   (gasCalls:', gasCalls.filter((x) => x.startsWith('acct')).join(','), ')');
    ok('7. dữ liệu chơi tự lưu lên máy chủ khi rời trang (rev tăng)', rev >= 2 && /777/.test(JSON.stringify(sheets.Accounts.rows[1].slice(9))), 'rev=' + rev);
    ok('8. không có lỗi JS ở máy A', A.errs.length === 0, A.errs.join(' | ')); await A.c.close();

    // 2) Máy B (máy khác, trống) → đăng nhập
    const B = await newDevice(browser, { tag: 'B' });
    await waitGate(B.pg); await B.pg.click('#en-alt'); g = await gate(B.pg);
    ok('9. máy B bấm "Đã có nhân vật? Đăng nhập" → chỉ còn tên + mật khẩu', g.mode === 'login' && g.pw && !g.pw2 && !g.look && g.altText.includes('Tạo mới'), JSON.stringify(g));
    await fill(B.pg, { name: 'Minh An', pw: 'saimatkhau' }); await B.pg.click('#en-go'); await B.pg.waitForFunction(() => !document.getElementById('en-err').hidden, null, { timeout: 30000 });
    g = await gate(B.pg); ok('10. sai mật khẩu → "Sai tên hoặc mật khẩu", chưa vào', /Sai tên hoặc mật khẩu/.test(g.err) && g.open, g.err);
    await shot(B.pg, 'login-error.png');
    await fill(B.pg, { pw: 'matkhau1' }); await B.pg.click('#en-go');
    await B.pg.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await waitIn(B.pg);   // tải lại rồi TỰ vào chùa
    const sb = await B.pg.evaluate(() => ({ wallet: localStorage.getItem('lgt.wallet'), name: localStorage.getItem('lgt.name'), color: localStorage.getItem('lgt.color'), acct: !!localStorage.getItem('lgt.acct'), hudShown: !document.querySelector('.hud')?.hidden }));
    ok('11. máy B đăng nhập đúng → vào thẳng chùa với ĐÚNG nhân vật + dữ liệu đã chơi (sen 777)', /777/.test(sb.wallet || '') && sb.name === 'Minh An' && sb.acct && sb.hudShown, JSON.stringify(sb));
    ok('12. không có lỗi JS ở máy B', B.errs.length === 0, B.errs.join(' | ')); await B.c.close();

    // 3) Máy C: tạo trùng tên + mật khẩu → bị chặn
    const C = await newDevice(browser, { tag: 'C' });
    await waitGate(C.pg); await fill(C.pg, { name: 'minh an', pw: 'matkhau1', pw2: 'matkhau1' }); await C.pg.click('#en-go');
    await C.pg.waitForFunction(() => !document.getElementById('en-err').hidden, null, { timeout: 30000 });
    g = await gate(C.pg); ok('13. TẠO TRÙNG tên + mật khẩu → báo đã có trên hệ thống, không vào, không tạo hàng mới', /đã có trên hệ thống/.test(g.err) && g.open && sheets.Accounts.rows.length === 2, g.err);
    await shot(C.pg, 'duplicate.png');
    await fill(C.pg, { pw: 'matkhau-khac', pw2: 'matkhau-khac' }); await C.pg.click('#en-go'); await waitIn(C.pg);
    ok('14. cùng tên nhưng mật khẩu khác → tạo được (nhân vật khác)', sheets.Accounts.rows.length === 3); await C.c.close();

    // 4) Máy D: nhân vật tạo từ trước (chưa mật khẩu) → yêu cầu đặt mật khẩu
    const D = await newDevice(browser, { tag: 'D', preset: { 'lgt.name': 'Thầy Nam', 'lgt.color': 'nau', 'lgt.hair': 'troc', 'lgt.wallet': JSON.stringify({ sen: 31 }) } });
    await waitGate(D.pg); g = await gate(D.pg);
    ok('15. nhân vật cũ trên máy → yêu cầu đặt mật khẩu (có ô nhập lại, tên giữ nguyên)', g.mode === 'claim' && g.pw && g.pw2 && g.name === 'Thầy Nam' && /Đặt mật khẩu/.test(g.title), JSON.stringify(g));
    await fill(D.pg, { pw: 'matkhau1', pw2: 'matkhau1' }); await D.pg.click('#en-go'); await waitIn(D.pg);
    const sd = await D.pg.evaluate(() => localStorage.getItem('lgt.wallet'));
    ok('16. đặt mật khẩu xong: dữ liệu cũ (sen 31) giữ nguyên và lên tài khoản', /31/.test(sd) && /31/.test(JSON.stringify(sheets.Accounts.rows[3].slice(9))), sd);

  } catch (e) { console.log('E2E LỖI:', String(e).slice(0, 600)); results.push([false, 'e2e crashed', String(e).slice(0, 200)]); }
  await browser.close(); srv.close();
  const bad = results.filter((r) => !r[0]); console.log(`\nKẾT QUẢ: ${results.length - bad.length}/${results.length} đạt`); process.exit(bad.length ? 1 : 0);
})();
