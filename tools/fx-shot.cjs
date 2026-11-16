// Phiên 211: CHỤP ẢNH hiệu ứng chiêu 3D bằng Chromium không đầu (WebGL phần mềm SwiftShader) — để AI/người nhìn được kết quả thật và bắt lỗi shader.
// Cách chạy (từ thư mục gốc repo):
//   1) npm i three@0.160.1 --prefix /duong/dan/three      (chỉ để có file three.module.js, KHÔNG thêm vào package.json của repo)
//   2) python3 -m http.server 8765 --bind 127.0.0.1 &      (phục vụ repo)
//   3) NODE_PATH=$(npm root -g) node tools/fx-shot.cjs /duong/dan/three /duong/dan/ra kim_1 moc_tuyet tho_1 ...
// Ảnh: <ra>/fx_<id>.png (chụp ngay sau lúc phát). Với fx-hoa.html / fx-thuy.html: mở bằng cùng cách route CDN → file local (xem route() bên dưới).
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const [THREE_DIR, OUT, ...ids] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await (await b.newContext({ viewport: { width: 640, height: 400 } })).newPage(); const logs = [];
  pg.on('pageerror', (e) => logs.push('PAGEERR ' + String(e).slice(0, 300)));
  pg.on('console', (m) => { if (m.type() === 'error') logs.push('ERR ' + m.text().slice(0, 300)); });
  await pg.route('**/*', (r) => {   // three.js từ CDN → file local; mọi thứ ngoài máy bị chặn
    const u = r.request().url();
    if (u.includes('three@0.160.1/')) { const f = path.join(THREE_DIR, 'node_modules/three', u.split('three@0.160.1/')[1]); return fs.existsSync(f) ? r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(f) }) : r.fulfill({ status: 404, body: '' }); }
    if (!u.startsWith('http://127.0.0.1')) return r.abort(); r.continue();
  });
  await pg.goto('http://127.0.0.1:8765/tools/fx-harness.html'); await pg.waitForFunction(() => window.ready, null, { timeout: 20000 });
  for (const id of ids) { await pg.evaluate(() => window.stop()); const g0 = await pg.evaluate((i) => window.run(i), id); await pg.waitForTimeout(Math.round((g0 + 0.38) * 1000)); await pg.screenshot({ path: path.join(OUT, 'fx_' + id + '.png') }); }
  console.log(logs.join('\n') || 'ok'); await b.close();
})();
