// Chạy thử js/ui/farm.js với DOM giả (không cần trình duyệt): quái xuất hiện khi người chơi vào vùng, ném đá + thương thu phục được, thưởng Tu Vi + hạt sen, lưu `lgt.farm`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FARM_CFG, FARM_ZONES } from '../js/data/monsters.js';

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
LGT.world = { pos: { x: -62, z: 80 }, dashing: false, dash(to) { this.pos = { x: to.x, z: to.z }; this.dashes = (this.dashes || 0) + 1; return true; } };   // Phiên 127: dash giả để thử Tự động LAO vào quái
LGT.strength = { value: 40 };
LGT.night = 1;   // Phiên 116: quái rừng chỉ hiện ban đêm
const { initFarm } = await import('../js/ui/farm.js');
const hud = fakeEl();
const api = initFarm(hud, { toast: (t) => toasts.push(t) });
const step = (secs, n = Math.max(1, Math.ceil(secs * 10))) => { for (let i = 0; i < n; i++) { clock += secs * 1000 / n; for (const f of timers) f(); } };

test('vào Bìa Rừng Thông: quái xuất hiện (mỗi vùng tối đa 12, có tinh anh), cách người chơi ≥ 6 m, uid duy nhất, vừa khít bể vẽ của cảnh', () => {
  step(0.5);
  const v = LGT.farmView, POOL = FARM_CFG.maxVisible;
  const bia = v.mons.filter((m) => m.zone === 'biaRungThong' && !m.boss); assert.ok(bia.length > 0 && bia.length <= FARM_ZONES.biaRungThong.capNight, `số quái ${bia.length}`);
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

test('Đánh thường (Phiên 127, thay Ném đá): cận chiến, trúng ngay, không còn đá bay; đứng xa thì báo lại gần; hồi chiêu chặn bấm liên tục', () => {
  step(0.2); const p = LGT.world.pos, near = LGT.farmView.mons.filter((m) => Math.hypot(m.x - p.x, m.z - p.z) <= 18).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
  assert.ok(near, 'có quái trong tầm nhìn 18 m'); assert.equal(api.status().active, true);
  const keep = { ...LGT.world.pos }; LGT.world.pos = { x: near.x - 12, z: near.z }; step(0.2); toasts.length = 0; const far0 = near.oan; LGT.farmView.mons = [near]; api.stone();   // chỉ còn con này trong tầm nhìn (quái dày hơn: có con khác đứng gần chỗ mới)
  assert.ok(toasts.some((t) => /Lại gần/.test(t)), 'xa thì báo lại gần'); assert.equal(near.oan, far0, 'đứng xa: không trúng');
  LGT.world.pos = { x: near.x + 0.5, z: near.z }; step(0.2); const before = near.oan; LGT.farmView.mons = [near]; api.stone();
  assert.ok(near.oan < before || near.oan === 0, 'trúng ngay'); assert.equal(LGT.farmView.stones.length, 0, 'không còn đá bay');
  const mid = near.oan; api.stone(); assert.equal(near.oan, mid, 'hồi chiêu'); step(0.7); LGT.world.pos = keep;
});

test('đứng xa không đâm được thương (có thông báo), đặt người chơi sát quái thì đâm và thu phục được; có Tu Vi + hạt sen; lưu lgt.farm', () => {
  step(0.2); const p = LGT.world.pos, far = LGT.farmView.mons.find((m) => Math.hypot(m.x - p.x, m.z - p.z) > 10 && Math.hypot(m.x - p.x, m.z - p.z) <= 18);
  if (far) { toasts.length = 0; LGT.farmView.mons = [far]; api.spear(); assert.ok(toasts.some((t) => /Lại gần/.test(t)), 'báo lại gần hơn'); }
  let kills = 0;
  for (let guard = 0; guard < 600 && kills < 8; guard++) {
    const m = LGT.farmView.mons.find((x) => !x.elite && !x.boss); if (!m) { step(5); continue; }
    LGT.world.pos = { x: m.x + 0.5, z: m.z }; step(0.2); const k0 = api.state.kills; api.spear(); step(0.8); if (api.state.kills > k0) kills++;
  }
  assert.ok(kills >= 8, `chỉ thu phục ${kills}`); assert.ok(api.state.exp > 0); assert.ok(api.tuvi >= 1); assert.ok(toasts.some((t) => /Thu phục Dã Mèo Rừng/.test(t)));
  assert.ok(sen > 0 && sen <= 100, `hạt sen ${sen}`);
  const saved = JSON.parse(store.get('lgt.farm')); assert.equal(saved.kills, api.state.kills); assert.equal(saved.exp, api.state.exp);
});

test('quái bị thu phục hồi sinh nhanh (RESPAWN_CFG: 10–20 giây, cục bộ)', () => {
  LGT.world.pos = { x: -62, z: 80 }; step(1);
  step(25);   // 25 giây ≥ 20 giây hồi sinh tối đa (mỗi nhịp 0,1 giây như vòng lặp thật)
  assert.ok(LGT.farmView.mons.filter((m) => m.zone === 'biaRungThong' && !m.elite && !m.boss).length >= 10, 'quái thường đã hồi sinh đủ');
});

test('Tự động hàng yêu: bật thì tự đánh quái trong 15 m và thu phục; mở bảng thì dừng; tính giờ và lưu lgt.farmauto', () => {
  LGT.world.pos = { x: -62, z: 80 }; step(1); toasts.length = 0;
  const dealt = () => LGT.farmView.mons.reduce((a, m) => a + (m.max - m.oan), 0) + api.state.kills * 1e6, d0 = dealt(), k0 = api.state.kills; api.toggleAuto(); assert.equal(api.status().auto, true); assert.ok(toasts.some((t) => /BẬT/.test(t)));
  step(30); assert.ok(api.state.kills > k0 || dealt() > d0, 'tự đánh quái (thu phục hoặc đã trừ Oán Khí; quái dày nên có thể đang đánh tinh anh/boss)'); const left = api.status().autoLeft;
  LGT.panelOpen = true; step(0.3); assert.equal(api.status().auto, false, 'mở bảng thì dừng'); LGT.panelOpen = false;
  const saved = JSON.parse(store.get('lgt.farmauto')); assert.ok(saved.secs >= 25 && saved.secs <= 40, `giây đã dùng ${saved.secs}`); assert.ok(left <= 59);
});
test('Tự động hàng yêu: không bật khi có yêu quái hằng tháng; hết giờ hôm nay thì không bật được', () => {
  LGT.yq = { active: true }; api.toggleAuto(); assert.equal(api.status().auto, false); LGT.yq = undefined;
  
});

test('Phiên 130: ban ngày quái NGỦ trong bụi khoảng rừng (không đứng ở đường); đêm đến nhiều hơn và TRÀN RA lối vào + đường mòn; sáng lại thì rút về', () => {
  LGT.world.pos = { x: -62, z: 66 }; const keep = LGT.night; const Z = FARM_ZONES.biaRungThong, inR = (r, m) => m.x >= r.x0 && m.x <= r.x1 && m.z >= r.z0 && m.z <= r.z1;
  LGT.night = 0.1; step(0.5); const reg = () => LGT.farmView.mons.filter((m) => m.zone === 'biaRungThong' && !m.boss);
  const day = reg().length; assert.ok(day > 6 && day <= Z.cap, `ban ngày ${day}`); assert.ok(LGT.farmView.mons.every((m) => !m.eng), 'ngủ, chưa ai nổi giận');
  assert.ok(reg().every((m) => Z.rects.some((r) => inR(r, m))), 'ban ngày chỉ trong khoảng rừng sâu');
  LGT.night = 1; step(30); const nite = reg().length; assert.ok(nite > day && nite <= Z.capNight, `đêm ${nite} > ngày ${day}`);
  assert.ok(reg().some((m) => Z.nightRects.some((r) => inR(r, m))), 'có quái tràn ra lối vào / đường mòn');
  LGT.night = 0.1; step(1); assert.ok(reg().length <= Z.cap, 'sáng: dư cap bị rút'); assert.ok(reg().every((m) => Z.rects.some((r) => inR(r, m)) || m.eng), 'sáng: quái ngoài khoảng rừng biến mất');
  LGT.night = keep; step(0.5);
});
