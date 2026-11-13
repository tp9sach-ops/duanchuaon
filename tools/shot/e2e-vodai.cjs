// E2E thật (Phiên 140): vào Võ đài giao lưu bằng một lời mời GIẢ, rồi kiểm 4 nút đánh (Đánh thường / Chém khí / Thiết đầu công / Hộ thân) nằm TRONG màn hình và bấm trúng được.
// Bắt đúng lỗi Phiên 140: class `cd` của khung công đức (css/donate.css) hất nút hồi chiêu ra ngoài màn hình. Chạy:
//   export THREE_DIR=$PWD/t  (three.js r160, xem README.md)   [CHROME=/usr/bin/google-chrome nếu không có Chromium của playwright]
//   VW=390 VH=780 node tools/shot/e2e-vodai.cjs      # cần `playwright` hoặc `playwright-core` (Node); ~2 phút (WebGL phần mềm)
// Mẹo: lấy hàm xử lý gói tin giao lưu bằng cách móc Set.prototype.add (hàm có chữ "decode(") — không cần hai máy thật.
let pw; try { pw = require('playwright'); } catch (_) { pw = require('playwright-core'); }
const { chromium } = pw;
const http = require('http'), fs = require('fs'), path = require('path');
const REPO = process.env.REPO || path.resolve(__dirname, '../..'), S = process.env.OUT || __dirname, THREE = process.env.THREE_DIR || path.join(S, 't'), PORT = 8124, BASE = 'http://localhost:' + PORT;
const VW = +process.env.VW || 390, VH = +process.env.VH || 780;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/json', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(REPO, p); if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const results = []; const ok = (name, cond, extra = '') => { results.push(cond); console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  → ' + extra : '')); };
(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const c = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, serviceWorkers: 'block', hasTouch: VW < 600, isMobile: VW < 600 });
  const pg = await c.newPage(), errs = [];
  pg.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  await pg.route('**/*', (r) => {
    const u = r.request().url(); if (u.startsWith(BASE)) return r.continue();
    const m = u.match(/three@0\.160\.1\/(.*)$/); if (m) { const f = path.join(THREE, m[1]); if (fs.existsSync(f)) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) }); }
    return r.abort();
  });
  await pg.addInitScript(() => {
    try { localStorage.setItem('lgt.name', 'Giang'); localStorage.setItem('lgt.color', 'nau'); } catch (e) { /* bỏ qua */ }
    const add = Set.prototype.add; Set.prototype.add = function (v) { if (typeof v === 'function' && /decode\(/.test(String(v))) window.__sig = v; return add.call(this, v); };
  });
  try {
    await pg.goto(BASE + '/index.html?debug=1&shadow=512&x=duel', { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => window.LGT && LGT.world && LGT.duel && LGT.zones, null, { timeout: 120000 });
    await pg.waitForTimeout(8000);
    await pg.evaluate(() => { const b = [...document.querySelectorAll('.hud-btn')].find((x) => /Vào chùa/.test(x.textContent)); if (b) b.click(); });
    await pg.waitForFunction(() => LGT.world.mode === 'free' && typeof window.__sig === 'function', null, { timeout: 120000 });
    const inv = await pg.evaluate(async () => { const m = await import('/js/world/duel.js'); window.__sig('opp-1', 'Đối Thủ', m.pack.invite(m.tagOf(LGT.room.selfId()))); await new Promise((r) => setTimeout(r, 400)); return LGT.duel.mode; });
    ok('nhận lời mời giả → mode "invited"', inv === 'invited', inv);
    await pg.evaluate(() => { const b = [...document.querySelectorAll('.dl-box button')].find((x) => /Chấp nhận/.test(x.textContent)); if (b) b.click(); });
    await pg.waitForFunction(() => LGT.duel.mode === 'arena', null, { timeout: 60000 });
    await pg.waitForTimeout(3000);
    const g = await pg.evaluate(() => [...document.querySelectorAll('.dl-bar button')].map((b) => { const q = b.getBoundingClientRect(), hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { t: b.textContent, inView: q.top >= 0 && q.bottom <= innerHeight + 1 && q.left >= 0 && q.right <= innerWidth + 1, own: !!hit && (hit === b || b.contains(hit)), x: Math.round(q.left) }; }));
    ok('Võ đài có đủ 4 nút đánh', g.length === 4, g.map((x) => x.t).join(' | '));
    ok('cả 4 nút nằm trong màn hình', g.every((x) => x.inView), JSON.stringify(g.map((x) => [x.t, x.inView])));
    ok('cả 4 nút bấm trúng được (không bị lớp khác đè)', g.every((x) => x.own));
    ok('4 nút nằm ở 4 chỗ KHÁC nhau (không chồng lên nhau)', new Set(g.map((x) => x.x)).size === 4, g.map((x) => x.x).join(','));
    const dock = await pg.evaluate(() => LGT.dock.ids);
    ok('cụm nút chính trong Võ đài không có nút đánh yêu quái', !/(^|,)(da|thuong|chemkhi)(,|$)/.test(dock), dock);
    await pg.screenshot({ path: path.join(S, 'vodai-' + VW + '.png'), timeout: 180000 });
  } catch (e) { console.log('LỖI:', String(e).slice(0, 400)); results.push(false); }
  ok('không có lỗi script', errs.length === 0, errs.join(' | '));
  await browser.close(); srv.close(); const bad = results.filter((r) => !r).length; console.log(`KẾT QUẢ: ${results.length - bad}/${results.length} đạt`); process.exit(bad ? 1 : 0);
})();
