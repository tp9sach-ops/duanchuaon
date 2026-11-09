// Đại Phật khắc vách đá (Phiên 83): hình học tấm vách + ảnh + khớp với vách thác và vật cản. Không import three.js (CI không cài).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PANEL, CLIFF_FLAT, archOutline, panelWorldX } from '../js/world/daiphatPanel.js';
import { DAI_PHAT, THAC } from '../js/world/outside.js';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url));

test('đường viền vòm liên tục, khép kín, nằm đúng trên chữ nhật + nửa tròn', () => {
  const N = 400; let prev = archOutline(0), maxStep = 0;
  for (let i = 1; i <= N; i++) {
    const p = archOutline(i / N), d = Math.hypot(p.x - prev.x, p.y - prev.y); maxStep = Math.max(maxStep, d); prev = p;
    if (i < N) { const onSide = Math.abs(Math.abs(p.x) - PANEL.r) < 1e-6 && p.y >= -1e-6 && p.y <= PANEL.archTop + 1e-6, onArc = p.y >= PANEL.archTop - 1e-6 && Math.abs(Math.hypot(p.x, p.y - PANEL.archTop) - PANEL.r) < 1e-6; assert.ok(onSide || onArc, `điểm ${i} lệch viền`); }
  }
  assert.ok(maxStep < 0.2, `bước nhảy ${maxStep}`);
  const a = archOutline(0), z = archOutline(0.999999);
  assert.ok(Math.abs(a.x - PANEL.r) < 1e-6 && a.y === 0, 'bắt đầu ở chân bên phải');
  assert.ok(Math.abs(z.x + PANEL.r) < 1e-3 && Math.abs(z.y) < 1e-2, 'kết thúc ở chân bên trái');
  const o = archOutline(0.5, 1), top = archOutline(0.5 - 1e-9, 0); assert.ok(Math.hypot(o.x, o.y - PANEL.archTop) > PANEL.r + 0.99 && top.y > PANEL.archTop + PANEL.r - 0.01, 'out đẩy ra ngoài');
});

test('tấm vách nằm gọn trong vách thác, dưới đỉnh vách, trong đoạn vách đã làm phẳng', () => {
  assert.ok(PANEL.h <= THAC.h - 1, 'cao hơn vách');
  assert.ok(PANEL.h === PANEL.archTop + PANEL.r, 'h = chữ nhật + bán kính');
  const z0 = DAI_PHAT.z - PANEL.w / 2, z1 = DAI_PHAT.z + PANEL.w / 2;
  assert.ok(z0 >= THAC.fallZ + 1, `mép Bắc tấm (${z0}) phải nằm trong đoạn phẳng z ≥ ${THAC.fallZ}`);
  assert.ok(z1 <= THAC.fallZ + 23 - 1, `mép Nam tấm (${z1}) phải còn trên khối vách (z ≤ ${THAC.fallZ + 23})`);
  assert.ok(DAI_PHAT.w <= PANEL.w && DAI_PHAT.h <= PANEL.h, 'vùng DAI_PHAT cũ nằm trong tấm mới');
});

test('độ sâu: nền tấm sát mặt vách (nhô ≤ 0,5 m), đỉnh nổi KHÔNG lấn qua vật cản thác, nhô ra khỏi vách ≥ 0,6 m', () => {
  const base = panelWorldX(DAI_PHAT.face, 0.3), peak = panelWorldX(DAI_PHAT.face, 0.95);
  assert.ok(base <= CLIFF_FLAT.world && CLIFF_FLAT.world - base <= 0.5, `nền ${base} so với vách ${CLIFF_FLAT.world}`);
  assert.ok(peak > THAC.cliffX, `đỉnh nổi ${peak} phải sau ranh vật cản x = ${THAC.cliffX}`);
  assert.ok(CLIFF_FLAT.world - peak >= 0.6, 'khối nổi đủ để thấy');
  assert.equal(CLIFF_FLAT.world, THAC.cliffX + 13 + CLIFF_FLAT.xLocal, 'toạ độ vách phẳng khớp khối vách (tâm cliffX+13)');
  assert.ok(peak > DAI_PHAT.bac.x1, 'khối nổi không đè lên bậc đá');
});

test('ảnh đá + ảnh độ cao có mặt, là WebP, đủ lớn; script sinh ảnh khớp hằng số', () => {
  for (const f of ['assets/daiphat-da.webp', 'assets/daiphat-cao.webp']) {
    const b = read(f); assert.ok(b.length > 20000 && b.length < 1.5e6, `${f}: ${b.length} byte`);
    assert.equal(b.toString('ascii', 0, 4), 'RIFF'); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  }
  const py = read('tools/make-daiphat-da.py').toString('utf8');
  const [, W, H] = py.match(/^W, H = (\d+), (\d+)/m); const ppm = +py.match(/^PPM = ([\d.]+)/m)[1];
  assert.equal(+W, PANEL.texW); assert.equal(+H, PANEL.texH);
  assert.equal(PANEL.texW / ppm, PANEL.w); assert.equal(PANEL.texH / ppm, PANEL.h);
  assert.equal(+py.match(/^R = ([\d.]+)/m)[1], PANEL.r); assert.equal(+py.match(/^arch_top = ([\d.]+)/m)[1], PANEL.archTop);
});

test('mã cảnh dùng đúng hằng số và hai ảnh (không còn tượng dựng bằng khối cũ)', () => {
  const s = read('js/scene/daiphat.js').toString('utf8');
  for (const k of ['daiphat-da.webp', 'daiphat-cao.webp', 'displacementMap', 'bumpMap', "from '../world/daiphatPanel.js'"]) assert.ok(s.includes(k), `thiếu ${k}`);
  assert.ok(!s.includes('TorusGeometry'), 'hào quang khối cũ đã bỏ');
  const o = read('js/scene/outside.js').toString('utf8'); assert.ok(o.includes('CLIFF_FLAT.xLocal'), 'vách thác dùng CLIFF_FLAT');
});
