import test from 'node:test';
import assert from 'node:assert/strict';
import { OUT_WALKS, PLACES, WALKERS, STALLS, VILLAGE_GATE, STREET_LAMPS, THAC, STORE_9SACH, STORE_TACHHOA, placesAt, placeById } from '../js/world/outside.js';
import { readFileSync } from 'node:fs';
import { VILLAGERS, ACTS } from '../js/world/npc.js';
import { blocked, canStep, SPAWN } from '../js/world/layout.js';
import { findPath } from '../js/world/path.js';
import '../js/world/placements.js';
import '../js/world/landscape.js';

function reach() {
  const S = 0.5, key = (i, j) => i + ',' + j, seen = new Set(), q = [[Math.round(SPAWN.x / S), Math.round(SPAWN.z / S)]]; seen.add(key(...q[0]));
  while (q.length) { const [i, j] = q.pop(); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj, k = key(ni, nj); if (seen.has(k)) continue; if (blocked(ni * S, nj * S) || !canStep(i * S, j * S, ni * S, nj * S)) continue; seen.add(k); q.push([ni, nj]); } }
  return (x, z) => seen.has(key(Math.round(x / S), Math.round(z / S)));
}
const has = reach();

test('ngoài chùa: mọi vùng đi bộ nối liền với chỗ xuất hiện (đường làng, chợ, bãi thác, bãi rừng)', () => {
  for (const [x, z] of [[0, 62], [0, 148], [-30, 125], [30, 142], [95, 104], [20, 104], [-100, 89], [-14, 89], [90, 118], [-105, 100]]) assert.ok(has(x, z), `(${x},${z}) phải đi tới được`);
  for (const w of OUT_WALKS) { const hit = [[w.x0 + 1, w.z0 + 1], [w.x1 - 1, w.z1 - 1], [(w.x0 + w.x1) / 2, (w.z0 + w.z1) / 2]].some(([x, z]) => !blocked(x, z) && has(x, z)); assert.ok(hit, w.id + ' có chỗ đi tới được'); }
});

test('ngoài chùa: ngoài vùng đi bộ là chặn (rừng, nhà dân, sườn núi chỉ để nhìn); mặt thác và hồ chân thác cũng chặn', () => {
  for (const [x, z] of [[-60, 120], [60, 70], [150, 104], [0, 170], [-20, 100], [60, 120]]) assert.equal(blocked(x, z), true, `(${x},${z})`);
  assert.equal(blocked(THAC.pool.x, THAC.pool.z), true, 'hồ chân thác'); assert.equal(blocked(THAC.pool.x + THAC.pool.r - 0.5, THAC.pool.z), true);
});

test('cổng làng, quầy chợ, đèn đường không chặn lối chính: còn ≥ 10 m giữa hai trụ cổng và đi thẳng được dọc vỉa hè', () => {
  const [a, b] = VILLAGE_GATE.posts; assert.ok(b - a - 2 * VILLAGE_GATE.r >= 10);
  for (const z of [66]) for (let x = -6; x <= 6; x += 0.5) assert.equal(blocked(x, z), false);
  assert.equal(new Set(STALLS.map((s) => s.x + ',' + s.z)).size, STALLS.length);
  for (const s of STALLS) assert.ok(s.x0 > -34 && s.x1 < 34 && s.z0 > 116 && s.z1 < 146, 'quầy nằm trong chợ');
  for (const l of STREET_LAMPS) assert.equal(Math.abs(l.x), 12);
  for (const z of [70, 100, 125, 148]) assert.equal(blocked(6, z), false, 'lòng đường thông ở z=' + z);
});

test('dân đi lại: toàn bộ đoạn đường đi đều trống (không xuyên vật cản)', () => {
  assert.ok(WALKERS.length >= 6); assert.equal(new Set(WALKERS.map((w) => w.id)).size, WALKERS.length);
  for (const w of WALKERS) {
    const [[x0, z0], [x1, z1]] = w.path, L = Math.hypot(x1 - x0, z1 - z0);
    for (let t = 0; t <= L; t += 0.5) { const x = x0 + (x1 - x0) * t / L, z = z0 + (z1 - z0) * t / L; assert.equal(blocked(x, z), false, `${w.id} tại (${x.toFixed(1)},${z.toFixed(1)})`); }
  }
});

test('điểm "đã ghé": id duy nhất, mỗi nơi có chỗ đứng đi tới được trong bán kính, placesAt đúng', () => {
  assert.equal(new Set(PLACES.map((p) => p.id)).size, PLACES.length); assert.ok(PLACES.length >= 8, 'đủ cho nhiệm vụ "dạo khắp nơi" (8 nơi)');
  for (const p of PLACES) {
    let ok = false; for (let a = 0; a < 360 && !ok; a += 15) for (let r = 0; r <= p.r; r += 1) { const x = p.x + Math.cos(a * Math.PI / 180) * r, z = p.z + Math.sin(a * Math.PI / 180) * r; if (!blocked(x, z) && has(x, z)) { ok = true; break; } }
    assert.ok(ok, p.id + ' phải có chỗ đứng đi tới được');
  }
  assert.ok(placesAt({ x: 0, z: 90 }).includes('lang')); assert.ok(placesAt({ x: 95, z: 104 }).includes('thacnuoc')); assert.deepEqual(placesAt({ x: 500, z: 500 }), []);
  assert.equal(placeById('rung').ten, 'Rừng thông'); assert.equal(placeById('khong-co'), null);
});

test('tìm đường từ cổng chùa tới dân làng, thác nước, rừng thông, chợ làng', () => {
  for (const t of [...VILLAGERS, ...ACTS.filter((a) => a.id === 'thacnuoc' || a.id === 'gieng' || a.id === 'dalang')]) {
    const p = findPath(SPAWN.x, SPAWN.z, t.stand.x, t.stand.z); assert.ok(p && p.length, t.id + ' có đường đi');
    for (const q of p) assert.equal(blocked(q.x, q.z), false, t.id + ' đường không xuyên vật cản');
  }
});

test('Cửa hàng 9 Sạch: địa chỉ 124 Mậu Thân (không còn địa chỉ trong ảnh mẫu), sân trước đi tới được, thân nhà và đồ trước cửa chặn, cửa vào còn lối rộng', () => {
  assert.equal(STORE_9SACH.diaChi, '124 Mậu Thân');
  const code = readFileSync(new URL('../js/scene/store9sach.js', import.meta.url), 'utf8') + readFileSync(new URL('../js/world/outside.js', import.meta.url), 'utf8');
  assert.ok(!/468A|Trần Phú|Ba Đình/.test(code), 'địa chỉ của ảnh mẫu không được còn trong mã');
  const { san, than, props } = STORE_9SACH;
  for (const [x, z] of [[san.x0 + 0.5, STORE_9SACH.z], [16.5, 81.5], [15, 82.5], [18, 80.5]]) { assert.equal(blocked(x, z), false, `sân trước (${x},${z}) phải đi được`); assert.ok(has(x, z), `(${x},${z}) phải đi tới được từ chỗ xuất hiện`); }
  for (const [x, z] of [[than.x0 + 1, STORE_9SACH.z], [than.x1 - 1, than.z0 + 1], [22, 78]]) assert.equal(blocked(x, z), true, `thân nhà (${x},${z}) chặn`);
  for (const c of Object.values(props)) { assert.equal(blocked(c.x, c.z), true, 'đồ trước cửa chặn'); assert.ok(c.x > san.x0 && c.x < san.x1 && c.z > san.z0 && c.z < san.z1, 'đồ nằm trong sân'); }
  // lối thẳng từ vỉa hè tới cửa rộng ≥ 3 m (dọc z = tâm) — không bị phông, giỏ hoa, standee chặn
  let free = 0; for (let z = san.z0; z <= san.z1; z += 0.25) { let ok = true; for (let x = 13; x <= than.x0 - 0.3; x += 0.25) if (blocked(x, z)) { ok = false; break; } if (ok) free += 0.25; }
  assert.ok(free >= 3, 'lối vào cửa hàng rộng ' + free + ' m');
  assert.ok(findPath(0, 80, 17, 81.5)?.length, 'tìm đường từ giữa đường làng tới trước cửa hàng');
});

test('Tách Hoa: sân trước đi tới được, thân nhà và xe hồng chặn, lối vào ≥ 3 m, không chồng lên Cửa hàng 9 Sạch', () => {
  const { san, than, props } = STORE_TACHHOA;
  assert.ok(san.z0 >= STORE_9SACH.san.z1, 'sân hai cửa hàng không chồng nhau');
  for (const [x, z] of [[san.x0 + 0.5, STORE_TACHHOA.z], [16.5, 89], [18, STORE_TACHHOA.z]]) { assert.equal(blocked(x, z), false, `(${x},${z}) đi được`); assert.ok(has(x, z), `(${x},${z}) tới được`); }
  for (const [x, z] of [[than.x0 + 1, STORE_TACHHOA.z], [22, 90]]) assert.equal(blocked(x, z), true);
  for (const c of Object.values(props)) { assert.equal(blocked(c.x, c.z), true); assert.ok(c.x > san.x0 && c.x < san.x1 && c.z > san.z0 && c.z < san.z1); }
  let free = 0; for (let z = san.z0; z <= san.z1; z += 0.25) { let ok = true; for (let x = 13; x <= than.x0 - 0.3; x += 0.25) if (blocked(x, z)) { ok = false; break; } if (ok) free += 0.25; }
  assert.ok(free >= 3, 'lối vào rộng ' + free + ' m');
  assert.ok(findPath(0, 90, 17, 89)?.length, 'tìm đường tới Tách Hoa');
});
