// Chạy thử js/ui/farm.js với DOM giả (không cần trình duyệt): quái xuất hiện khi người chơi vào vùng, ném đá + thương thu phục được, thưởng Tu Vi + hạt sen, lưu `lgt.farm`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FARM_CFG } from '../js/data/monsters.js';

const fakeEl = () => { const e = { className: '', hidden: false, textContent: '', style: {}, children: [], classList: { toggle() {}, add() {}, remove() {} }, appendChild(c) { e.children.push(c); return c; }, append(...c) { e.children.push(...c); } }; return e; };
let timers = [], clock = 1000;
const store = new Map();
const FIXED = Date.UTC(2026, 10, 11, 5, 0, 0); Date.now = () => FIXED;   // hạt giống ngẫu nhiên và ngày cố định → kết quả lặp lại được
globalThis.document = { createElement: fakeEl };
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
globalThis.location = { search: '' };
globalThis.setInterval = (f) => { timers.push(f); return timers.length; };
const realNow = performance.now.bind(performance);
globalThis.performance = { now: () => clock };
const win = globalThis.window = { LGT: {} };
const LGT = win.LGT;
const toasts = []; let sen = 0;
LGT.addMerit = (n) => { sen += n; };
LGT.world = { pos: { x: -100, z: 80 } };
LGT.strength = { value: 40 };
const { initFarm } = await import('../js/ui/farm.js');
const hud = fakeEl();
const api = initFarm(hud, { toast: (t) => toasts.push(t) });
const step = (secs, n = Math.max(1, Math.ceil(secs * 10))) => { for (let i = 0; i < n; i++) { clock += secs * 1000 / n; for (const f of timers) f(); } };

test('vào Bìa Rừng Thông: quái xuất hiện (mỗi vùng tối đa 12, có tinh anh), cách người chơi ≥ 6 m, uid duy nhất, vừa khít bể vẽ của cảnh', () => {
  step(0.5);
  const v = LGT.farmView, POOL = FARM_CFG.maxVisible;
  const bia = v.mons.filter((m) => m.zone === 'biaRungThong'); assert.ok(bia.length > 0 && bia.length <= 12, `số quái ${bia.length}`);
  assert.ok(v.mons.every((m) => m.uid && Math.hypot(m.x + 100, m.z - 80) >= 6 - 1e-9));
  assert.ok(bia.some((m) => m.elite)); assert.equal(new Set(v.mons.map((m) => m.uid)).size, v.mons.length, 'uid không trùng giữa hai vùng sát nhau');
  assert.ok(v.mons.length <= POOL, `hai vùng cùng hiện (${v.mons.length}) phải ≤ bể vẽ ${POOL}`);
});

test('đứng xa mọi vùng: không có quái, nút không hiện', () => {
  const keep = LGT.world.pos; LGT.world.pos = { x: 0, z: 0 }; step(0.5);
  assert.equal(LGT.farmView.mons.length, 0); assert.equal(api.status().active, false); LGT.world.pos = keep; step(0.5);
});

test('trong nhà hoặc đang có yêu quái hằng tháng: quái bãi rừng không nhận đòn', () => {
  LGT.inHouse = true; step(0.2); assert.equal(LGT.farmView.mons.length, 0); LGT.inHouse = false; step(0.2);
  LGT.yq = { active: true }; assert.equal(api.status().active, false); LGT.yq = undefined;
});

test('ném đá: có đá bay rồi trừ Oán Khí; hồi chiêu chặn bấm liên tục', () => {
  step(0.2); const p = LGT.world.pos, near = LGT.farmView.mons.filter((m) => Math.hypot(m.x - p.x, m.z - p.z) <= 18).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
  assert.ok(near, 'có quái trong tầm 18 m'); assert.equal(api.status().active, true);
  const before = near.oan; api.stone(); assert.equal(LGT.farmView.stones.length, 1); api.stone(); assert.equal(LGT.farmView.stones.length, 1, 'hồi chiêu');
  step(1.2); assert.ok(near.oan < before || near.oan === 0, 'đá đã trúng');
});

test('đứng xa không đâm được thương (có thông báo), đặt người chơi sát quái thì đâm và thu phục được; có Tu Vi + hạt sen; lưu lgt.farm', () => {
  step(0.2); const p = LGT.world.pos, far = LGT.farmView.mons.find((m) => Math.hypot(m.x - p.x, m.z - p.z) > 10 && Math.hypot(m.x - p.x, m.z - p.z) <= 18);
  if (far) { toasts.length = 0; api.spear(); assert.ok(toasts.some((t) => /Lại gần/.test(t)), 'báo lại gần hơn'); }
  let kills = 0;
  for (let guard = 0; guard < 600 && kills < 8; guard++) {
    const m = LGT.farmView.mons.find((x) => !x.elite); if (!m) { step(5); continue; }
    LGT.world.pos = { x: m.x + 0.5, z: m.z }; step(0.2); const k0 = api.state.kills; api.spear(); step(0.8); if (api.state.kills > k0) kills++;
  }
  assert.ok(kills >= 8, `chỉ thu phục ${kills}`); assert.ok(api.state.exp > 0); assert.ok(api.tuvi >= 1); assert.ok(toasts.some((t) => /Thu phục Dã Mèo Rừng/.test(t)));
  assert.ok(sen > 0 && sen <= 100, `hạt sen ${sen}`);
  const saved = JSON.parse(store.get('lgt.farm')); assert.equal(saved.kills, api.state.kills); assert.equal(saved.exp, api.state.exp);
});

test('quái bị thu phục hồi sinh sau 30–60 giây (cục bộ)', () => {
  LGT.world.pos = { x: -100, z: 80 }; step(1);
  step(60);   // 60 giây (mỗi nhịp 0,1 giây như vòng lặp thật)
  assert.ok(LGT.farmView.mons.filter((m) => m.zone === 'biaRungThong' && !m.elite).length >= 10, 'quái thường đã hồi sinh đủ');
});
