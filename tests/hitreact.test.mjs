// Quái bị trúng chiêu (Phiên 214, mục 1): logic thuần js/world/hitReact.js + việc ĐÃ NỐI vào game (main.js gọi initHitReact, farm.js gọi LGT.hitReact.onHit).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rxStart, rxPose, rxDang, amTrung, ngansachHieuUng, FX_DAY_DU, AM_TOI_DA } from '../js/world/hitReact.js';

const quai = { x: 10, z: 5, ry: 0, type: 'thachtinh' };

test('rxStart: quái hợp lệ → có kế hoạch; quái lạ/null → null', () => {
  const rx = rxStart(quai, { ax: 10, az: 0, now: 100, id: null });
  assert.ok(rx && rx.plan && rx.dur > 0 && rx.t0 === 100);
  assert.equal(rxStart(null), null);
  assert.equal(rxStart({ x: 'a', z: 1 }), null);
});

test('rxPose: bị đẩy RA XA kẻ đánh, rồi về đứng yên (done)', () => {
  const rx = rxStart(quai, { ax: 10, az: 0, now: 0, luc: 1 });   // kẻ đánh ở phía −z → quái bị đẩy sang +z
  let maxDz = 0;
  for (let t = 0; t < rx.dur; t += 0.02) { const p = rxPose(rx, t); maxDz = Math.max(maxDz, p.dz); }
  assert.ok(maxDz > 0, 'phải lùi theo hướng đòn');
  assert.equal(rxPose(rx, rx.dur + 0.01).done, true);
  assert.equal(rxDang(rx, rx.dur + 0.01), false);
  assert.equal(rxDang(rx, 0.01), true);
});

test('mức nặng (chiêu 4 / kết liễu) ngã rõ hơn mức vừa', () => {
  const nang = rxStart(quai, { ax: 10, az: 0, now: 0, luc: 0.5, ketLieu: true }), vua = rxStart(quai, { ax: 10, az: 0, now: 0, luc: 0.5 });
  const m = (rx) => { let r = 0; for (let t = 0; t < rx.dur; t += 0.02) r = Math.max(r, Math.abs(rxPose(rx, t).rx)); return r; };
  assert.equal(nang.muc, 'nang'); assert.equal(vua.muc, 'vua');
  assert.ok(m(nang) > m(vua));
});

test('boss không ngã vì đòn nặng', () => {
  const rx = rxStart({ ...quai, boss: true }, { ax: 10, az: 0, now: 0, ketLieu: true });
  assert.equal(rx.plan.nga, false);
});

test('amTrung: Kim = kim loại, Thổ = đá, còn lại da thịt; mức nặng có tiếng phụ', () => {
  assert.equal(amTrung('thachtinh', 'vua').chatLieu, 'da');
  assert.equal(amTrung('thachtinh', 'nang').them, 'chem-khi-trung');
  assert.equal(amTrung('thachtinh', 'nhe').them, null);
  assert.ok(amTrung('khongco', 'vua').file.startsWith('trung-'));
  assert.ok(amTrung('x', 'nhe').gain < amTrung('x', 'nang').gain);
});

test('ngansachHieuUng: nhiều quái trúng thì chỉ FX_DAY_DU quái đầu đủ hiệu ứng, AM_TOI_DA quái đầu có tiếng', () => {
  assert.equal(ngansachHieuUng(0).dayDu, true);
  assert.equal(ngansachHieuUng(FX_DAY_DU).dayDu, false);
  assert.equal(ngansachHieuUng(AM_TOI_DA - 1).coAm, true);
  assert.equal(ngansachHieuUng(AM_TOI_DA).coAm, false);
});

test('ĐÃ NỐI: main.js gọi initHitReact; farm.js gọi LGT.hitReact.onHit với id chiêu; scene/farm.js vẽ tư thế m.rx', () => {
  const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  assert.match(rd('js/main.js'), /hitReact\.js'\)\.then\(\(m\) => m\.initHitReact\(\)\)/);
  assert.match(rd('js/ui/farm.js'), /LGT\.hitReact && LGT\.hitReact\.onHit\(m, \{ dmg, id: o\.id/);
  assert.match(rd('js/scene/farm.js'), /rxPose\(m\.rx/);
  assert.match(rd('js/ui/hitReact.js'), /LGT\.hitReact = \{ onHit \}/);
});
