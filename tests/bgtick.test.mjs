// Phiên 143: nhịp nền (game chạy tiếp khi chuyển tab) + kiểm các module giao diện đã được NỐI vào main.js (Phiên 141 viết mà quên gọi).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bgTick } from '../js/bgTick.js';
import { SECT_LV, effLevel, canJoinSect } from '../js/world/heQuest.js';
import { canKhaiNgo } from '../js/world/khaiNgo.js';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('bgTick: không có Worker thì rơi về setInterval, hàm đăng ký được gọi và hủy được', async () => {
  let n = 0; const off = bgTick.on(() => { n++; });
  await new Promise((r) => setTimeout(r, 450));
  assert.ok(n >= 2, 'đã nhận nhịp: ' + n);
  off(); const keep = n; await new Promise((r) => setTimeout(r, 300));
  assert.equal(n, keep, 'sau khi hủy không nhận thêm');
  assert.equal(bgTick.usingWorker, false);   // Node không có Worker toàn cục
});
test('bgTick: một hàm lỗi không làm hỏng hàm khác', async () => {
  let ok = 0; const a = bgTick.on(() => { throw new Error('x'); }), b = bgTick.on(() => { ok++; });
  const warn = console.warn; console.warn = () => {};
  await new Promise((r) => setTimeout(r, 250)); console.warn = warn; a(); b();
  assert.ok(ok >= 1);
});
test('vòng lặp game dùng bgTick, không tự setInterval và không dừng khi tab ẩn', () => {
  const farm = src('js/ui/farm.js'), fc = src('js/ui/farmCombat.js'), sc = src('js/main.js');
  assert.match(farm, /bgTick\.on\(tick\)/); assert.match(fc, /bgTick\.on\(tick\)/); assert.match(sc, /bgTick\.on\(/);
  assert.doesNotMatch(farm, /setInterval\(tick,\s*100\)/); assert.doesNotMatch(fc, /setInterval\(tick,\s*100\)/);
  assert.doesNotMatch(farm.match(/function autoStep[\s\S]*?\n  }\n/)[0], /document\.hidden/, 'Tự động hàng yêu không được dừng vì tab ẩn');
});
test('Lễ Khai Ngộ + thanh chiêu phái đã được nối vào main.js (heSkill trước khaiNgo)', () => {
  const h = src('js/main.js');
  assert.match(h, /initHeSkill\(hud/); assert.match(h, /initKhaiNgo\(/);
  assert.ok(h.indexOf('initHeSkill(hud') < h.indexOf('initKhaiNgo('));
});
test('Lễ Khai Ngộ dùng cấp hiệu dụng: thấy "Cấp 10" (dù Tu Vi thấp) là gia nhập phái được', () => {
  assert.equal(SECT_LV, 10);
  assert.equal(canKhaiNgo(effLevel(3, 10)), true);
  assert.equal(canJoinSect(effLevel(3, 9)), false);
  assert.match(src('js/ui/khaiNgo.js'), /capHieuDung/);
});
test('LGT.farm có chiêu phái + thông tin Tu Vi cho HUD', () => {
  const f = src('js/ui/farm.js');
  for (const k of ['skillReady', 'skillHit', 'tuviInfo']) assert.match(f, new RegExp(k));
  assert.match(src('js/ui/hud.js'), /id="tuvi-tx"/);
});
