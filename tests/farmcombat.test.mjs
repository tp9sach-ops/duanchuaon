// Chạy js/ui/farm.js + js/ui/farmCombat.js với DOM giả (Phiên 130): quái bãi rừng PHẢI đánh trả khi người chơi đánh/thu phục.
// Chạy: node --test tests/farmcombat.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const fakeEl = () => { const e = { className: '', hidden: false, textContent: '', style: {}, children: [], classList: { toggle() {}, add() {}, remove() {} }, appendChild(c) { e.children.push(c); return c; }, append(...c) { e.children.push(...c); }, addEventListener() {}, setAttribute() {} }; return e; };
let timers = [], clock = 1000; const store = new Map();
const FIXED = Date.UTC(2026, 10, 11, 5, 0, 0); Date.now = () => FIXED;
globalThis.document = { createElement: fakeEl };
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
globalThis.location = { search: '' };
globalThis.setInterval = (f) => { timers.push(f); return timers.length; };
globalThis.performance = { now: () => clock };
const win = globalThis.window = { LGT: {} }, LGT = win.LGT;
const toasts = [];
LGT.addMerit = () => {};
LGT.world = { pos: { x: -62, z: 66 }, dashing: false, dash(to) { this.pos = { x: to.x, z: to.z }; return true; }, teleport(x, z) { this.pos = { x, z }; this.tp = (this.tp || 0) + 1; } };
LGT.strength = { value: 40 }; LGT.night = 1;
const { initFarm } = await import('../js/ui/farm.js');
const { initFarmCombat } = await import('../js/ui/farmCombat.js');
const hud = fakeEl(), toast = (t) => toasts.push(String(t));
const api = initFarm(hud, { toast }); initFarmCombat(hud, { toast }); const fc = LGT.farmCombat;
const step = (secs, n = Math.max(1, Math.ceil(secs * 10))) => { for (let i = 0; i < n; i++) { clock += secs * 1000 / n; for (const f of timers) f(); } };
const near = () => LGT.farmView.mons.filter((m) => !m.boss && !m.elite).sort((a, b) => Math.hypot(a.x - LGT.world.pos.x, a.z - LGT.world.pos.z) - Math.hypot(b.x - LGT.world.pos.x, b.z - LGT.world.pos.z))[0];

test('quái đang NGỦ không đánh người chơi dù đứng sát; bị đánh thì nổi giận, đuổi và gồng chiêu', () => {
  step(1); const m = near(); assert.ok(m, 'có quái'); LGT.world.pos = { x: m.x + 1.2, z: m.z }; step(3);
  assert.ok(!m.eng, 'chưa bị đánh thì vẫn ngủ'); assert.equal(fc.vitals.hp, fc.vitals.max, 'không mất Sinh Lực');
  api.spear(); step(0.2);
  const alive = LGT.farmView.mons.includes(m);
  if (alive) { assert.ok(m.eng, 'bị đánh → nổi giận'); }
});

test('đánh dở (quái còn sống): quái đánh trả — gồng chiêu rồi trừ Sinh Lực người chơi', () => {
  // Boss rất trâu nên chắc chắn còn sống sau một đòn.
  LGT.world.pos = { x: 0, z: 0 }; step(12);   // rời xa: quái hết giận, Sinh Lực hồi đầy
  LGT.world.pos = { x: -62, z: 66 }; step(1); const b = LGT.farmView.mons.find((m) => m.boss && m.zone === 'biaRungThong'); assert.ok(b, 'có boss'); assert.ok(LGT.farmView.mons.every((m) => !m.eng), 'quái đã hết giận');
  LGT.world.pos = { x: b.x + 2, z: b.z }; step(8); const hp0 = fc.vitals.hp; assert.equal(hp0, fc.vitals.max, 'đầy Sinh Lực trước khi đánh');
  LGT.farmView.mons = [b]; api.spear(); step(0.3); assert.ok(LGT.farmView.mons.includes(b), 'boss còn sống');   // chỉ còn boss trong tầm nhìn (đêm quái dày, con khác có thể đứng gần hơn) assert.ok(b.eng, 'boss nổi giận khi bị đánh');
  let winded = false, low = hp0, tp0 = LGT.world.tp || 0; for (let i = 0; i < 80; i++) { step(0.1, 1); if (b.wind > 0) winded = true; low = Math.min(low, fc.vitals.hp); }
  assert.ok(winded, 'có gồng chiêu báo trước'); assert.ok(low < hp0, `Sinh Lực phải giảm (${hp0} → ${low})`); assert.ok(hp0 - low >= 1);
  const ko = (LGT.world.tp || 0) > tp0; if (ko) assert.equal(fc.vitals.hp, fc.vitals.max, 'kiệt sức → về cửa chùa, hồi đầy, không mất gì'); else assert.ok(low > 0);
});

test('chạy xa khỏi quái đang giận: quái bỏ cuộc; kiệt sức thì về cửa chùa, quái hết giận', () => {
  const b = LGT.farmView.mons.find((m) => m.boss && m.eng); 
  if (b) { LGT.world.pos = { x: b.x + 40, z: b.z + 40 }; step(8); }
  for (const m of LGT.farmView.mons) assert.ok(!m.eng || Math.hypot(m.x - LGT.world.pos.x, m.z - LGT.world.pos.z) < 40, 'không đuổi mãi');
});
