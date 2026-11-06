// Phiên 33: đồ trang trí phố cổ (hàng rào, chậu hoa, lồng gà, ghế, khối đá) không được chặn lối và không đè lên nhau.
import test from 'node:test';
import assert from 'node:assert/strict';
import { OUT_WALKS, STREET_FENCES, PLANTERS, MARKET_DECOR, STALLS, STREET_LAMPS, DA_LANG, GIENG, WALKERS, FENCE_X, VILLAGE_GATE, streetEdgeFree, STORE_9SACH, STORE_TACHHOA, STORE_DIDONG, STORE_DIENMAY, STORE_KIMHOAN } from '../js/world/outside.js';
import { blocked, canStep, SPAWN } from '../js/world/layout.js';
import '../js/world/placements.js';
import '../js/world/landscape.js';

const STORES = [STORE_9SACH, STORE_TACHHOA, STORE_DIDONG, STORE_DIENMAY, STORE_KIMHOAN];
const inRect = (x, z, r, m = 0) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;
const ITEMS = [...PLANTERS.map((p) => ({ ...p, t: 'chậu' })), ...MARKET_DECOR.cages.map((p) => ({ ...p, t: 'lồng' })), ...MARKET_DECOR.chairs.map((p) => ({ ...p, t: 'ghế' })), ...MARKET_DECOR.blocks.map((p) => ({ ...p, t: 'khối đá' }))];
const segDist = (px, pz, [[x0, z0], [x1, z1]]) => { const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((px - x0) * dx + (pz - z0) * dz) / L2)); return Math.hypot(px - (x0 + dx * t), pz - (z0 + dz * t)); };

test('hàng rào phố: đứng ngoài vùng đi bộ khác, không cắt chợ, sân cửa hàng hay đường mòn', () => {
  assert.ok(STREET_FENCES.length >= 4);
  for (const f of STREET_FENCES) {
    assert.equal(Math.abs(f.x), FENCE_X); assert.ok(f.z1 - f.z0 >= 2.5);
    for (let z = f.z0; z <= f.z1; z += 0.5) {
      for (const w of OUT_WALKS) if (w.id !== 'duong-lang') assert.equal(inRect(f.x, z, w), false, `hàng rào (${f.x},${z}) không nằm trong vùng ${w.id}`);
      for (const st of STORES) assert.equal(inRect(f.x, z, st.san), false, `hàng rào (${f.x},${z}) không chắn sân ${st.id}`);
    }
  }
});

test('đoạn trống mép đường: mỗi phía ≥ 2 đoạn, không chồng chợ (z 116–146) và sân cửa hàng', () => {
  for (const side of [-1, 1]) {
    const free = streetEdgeFree(side); assert.ok(free.length >= 2, 'phía ' + side);
    for (const [a, b] of free) { assert.ok(b > a); assert.ok(b <= 116 || a >= 146, 'không chồng chợ'); for (const st of STORES) if (Math.sign(st.front) === side) assert.ok(b <= st.san.z0 || a >= st.san.z1, 'không chồng sân ' + st.id); }
  }
});

test('đồ trang trí: nằm trong vùng đi bộ, không đè nhau, quầy chợ, cột đèn, gốc đa, giếng', () => {
  for (const it of ITEMS) {
    assert.ok(OUT_WALKS.some((w) => inRect(it.x, it.z, w)), `${it.t} (${it.x},${it.z}) phải ở vùng đi bộ`);
    for (const s of STALLS) assert.equal(inRect(it.x, it.z, s, it.r), false, `${it.t} không đè quầy`);
    for (const st of STORES) { assert.equal(inRect(it.x, it.z, st.than, it.r), false, `${it.t} (${it.x},${it.z}) không nằm trong thân ${st.id}`); if (!PLANTERS.includes(it)) assert.equal(inRect(it.x, it.z, st.san, it.r), false, `${it.t} không đè sân ${st.id}`); }
    for (const c of [...STREET_LAMPS, DA_LANG, GIENG]) assert.ok(Math.hypot(it.x - c.x, it.z - c.z) > it.r + (c.r || 0.25) + 0.3, `${it.t} (${it.x},${it.z}) cách vật cản`);
  }
  for (let i = 0; i < ITEMS.length; i++) for (let j = i + 1; j < ITEMS.length; j++) assert.ok(Math.hypot(ITEMS[i].x - ITEMS[j].x, ITEMS[i].z - ITEMS[j].z) > ITEMS[i].r + ITEMS[j].r + 0.2, `${ITEMS[i].t} và ${ITEMS[j].t} không chồng`);
});

test('đồ trang trí cách xa lối dân đi lại ≥ 1 m (không chặn dân làng)', () => {
  for (const it of ITEMS) for (const w of WALKERS) assert.ok(segDist(it.x, it.z, w.path) > it.r + 1, `${it.t} (${it.x},${it.z}) cách đường của ${w.id}`);
});

test('đồ trang trí là vật cản thật; dải giữa vỉa hè (|x| 6,5–11) vẫn đi suốt được', () => {
  for (const it of ITEMS) assert.equal(blocked(it.x, it.z), true, `${it.t} chặn tại tâm`);
  for (const f of STREET_FENCES) assert.equal(blocked(f.x, (f.z0 + f.z1) / 2), true, 'hàng rào chặn');
  for (let z = 62; z <= 114; z += 0.5) for (const x of [-11, -9.5, -8, -6.5, 6.5, 8, 9.5, 11]) {
    if (Math.abs(z - VILLAGE_GATE.z) < 1.3 && Math.abs(Math.abs(x) - 8.5) < 1.3) continue;   // trụ cổng làng
    assert.equal(blocked(x, z), false, `vỉa hè trống (${x},${z})`);
  }
  for (const z of [62, 70, 98, 112]) assert.equal(blocked(0, z), false);
  assert.ok(canStep(SPAWN.x, SPAWN.z, SPAWN.x, SPAWN.z + 0.5));
});
