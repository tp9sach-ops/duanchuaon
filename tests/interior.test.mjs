// Bên trong nhà (Phiên 38, 3d-2a): phòng riêng theo cấp, đồ nội thất, đăng ký va chạm, cửa vào/ra, kế hoạch vào nhà.
import test from 'node:test';
import assert from 'node:assert/strict';
import { INTERIOR, DOOR_R, ROOMS, roomFor, roomRect, entryPoint, doorInside, atDoor, isInterior, furnitureRects, registerRoom, doorPoint, nearDoor, enterPlan, exitPlan, houseAction, netPos } from '../js/world/interior.js';
import { PLOTS, HOUSE_LEVELS, houseRect, poolRect, LAND_WALKS, loadLand } from '../js/world/land.js';
import { blocked, bodyBlocked, canStepBody, WALKS, RECTS, addRect, addWalk } from '../js/world/layout.js';

const lvs = HOUSE_LEVELS.map((h) => h.lv);

test('4 phòng, cấp cao hơn thì rộng hơn hoặc bằng; cấp sai được kẹp', () => {
  assert.equal(ROOMS.length, 4);
  for (let i = 1; i < 4; i++) assert.ok(ROOMS[i].w * ROOMS[i].d >= ROOMS[i - 1].w * ROOMS[i - 1].d);
  assert.equal(roomFor(9), ROOMS[3]); assert.equal(roomFor(-2), ROOMS[0]); assert.equal(roomFor(NaN), ROOMS[0]);
});

test('khu phòng xa mọi vùng đi bộ ngoài trời và lưới tìm đường (−130…130 × −80…220)', () => {
  for (const L of lvs) { const r = roomRect(L); assert.ok(r.x0 > 130 + 20 && r.z0 > 220 + 20, 'phòng nằm ngoài lưới tìm đường'); }
  for (const w of LAND_WALKS) assert.ok(INTERIOR.x - 12 > w.x1 && INTERIOR.z - 12 > w.z1);
  assert.ok(isInterior(INTERIOR.x, INTERIOR.z) && !isInterior(0, 0) && !isInterior(0, 170));
});

test('đồ nội thất: id không trùng, nằm trong phòng, đồ đặc không đè nhau', () => {
  for (const r of ROOMS) {
    const ids = new Set(); for (const f of r.furniture) { assert.ok(!ids.has(f.id), `${r.lv}:${f.id} trùng`); ids.add(f.id); assert.ok(f.x - f.w / 2 >= -r.w / 2 - 1e-9 && f.x + f.w / 2 <= r.w / 2 + 1e-9 && f.z - f.d / 2 >= -r.d / 2 - 1e-9 && f.z + f.d / 2 <= r.d / 2 + 1e-9, `${r.lv}:${f.id} ra ngoài phòng`); }
    const s = r.furniture.filter((f) => f.solid);
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      const a = s[i], b = s[j], ov = Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 1e-9 && Math.abs(a.z - b.z) < (a.d + b.d) / 2 - 1e-9;
      assert.ok(!ov, `cấp ${r.lv}: ${a.id} đè ${b.id}`);
    }
  }
});

test('đăng ký phòng: trước khi đăng ký bị chặn; sau khi đăng ký đi được; gỡ thì trở lại như cũ', () => {
  for (const L of lvs) {
    const nw = WALKS.length, nr = RECTS.length, c = entryPoint(L);
    assert.ok(blocked(c.x, c.z), 'chưa đăng ký thì phải bị chặn (không đi tới được từ ngoài)');
    const off = registerRoom(L);
    assert.ok(WALKS.length === nw + 1 && RECTS.length === nr + furnitureRects(L).length);
    assert.ok(!blocked(c.x, c.z) && !bodyBlocked(c.x, c.z), 'chỗ vào phải đi được');
    const r = roomRect(L); assert.ok(blocked(r.x1 + 0.5, INTERIOR.z) && blocked(INTERIOR.x, r.z1 + 0.5), 'ngoài tường phải bị chặn');
    off(); assert.equal(WALKS.length, nw); assert.equal(RECTS.length, nr); assert.ok(blocked(c.x, c.z));
  }
});

test('từ chỗ vào đi được tới mọi đồ dùng (giường, ghế, sofa, bàn, cầu thang...) và lại gần cửa', () => {
  for (const L of lvs) {
    const off = registerRoom(L), r = roomRect(L), S = 0.25, st = entryPoint(L), seen = new Set(), q = [[Math.round(st.x / S), Math.round(st.z / S)]];
    seen.add(q[0].join(','));
    while (q.length) {
      const [i, j] = q.pop();
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj, k = a + ',' + b; if (seen.has(k) || !canStepBody(i * S, j * S, a * S, b * S)) continue; seen.add(k); q.push([a, b]); }
    }
    const reach = (x, z, rad) => { for (const k of seen) { const [a, b] = k.split(',').map(Number); if (Math.hypot(a * S - x, b * S - z) <= rad) return true; } return false; };
    for (const f of roomFor(L).furniture.filter((q2) => q2.solid)) assert.ok(reach(INTERIOR.x + f.x, INTERIOR.z + f.z, Math.max(f.w, f.d) / 2 + 0.9), `cấp ${L}: không lại gần được ${f.id}`);
    const d = doorInside(L); assert.ok(reach(d.x, d.z - 0.6, 0.4), `cấp ${L}: không ra được cửa`);
    off();
  }
});

test('cửa nhà: gần cửa từ chỗ đứng trước lô, xa khi ở lô hàng xóm/hàng đối diện', () => {
  for (const p of PLOTS) for (const L of lvs) {
    assert.ok(nearDoor(p.front, p, L), `lô ${p.id} cấp ${L}: chỗ đứng trước lô phải gần cửa`);
    const d = doorPoint(p, L), r = houseRect(p, L); assert.ok(d.x >= r.x0 && d.x <= r.x1, 'cửa nằm trên mặt nhà');
    for (const o of PLOTS) if (o.id !== p.id) assert.ok(!nearDoor(o.front, p, L), `lô ${o.id} không được thấy cửa lô ${p.id}`);
  }
  assert.ok(DOOR_R >= 6 && DOOR_R <= 10);
});

test('kế hoạch vào nhà: chưa có đất / xa cửa / đã ở trong nhà / hợp lệ', () => {
  const pl = PLOTS[2], land = loadLand({ own: { xom: 1, plot: pl.id, lv: 2 } });
  assert.equal(enterPlan(loadLand(null), pl.front).reason, 'noland');
  assert.equal(enterPlan(land, { x: 0, z: 100 }).reason, 'far');
  const ok = enterPlan(land, pl.front);
  assert.ok(ok.ok && ok.lv === 2 && Math.abs(ok.spawn.ry - Math.PI) < 1e-9 && isInterior(ok.spawn.x, ok.spawn.z));
  assert.equal(enterPlan(land, ok.spawn).reason, 'inside');
  assert.equal(exitPlan(loadLand(null)), null);
});

test('điểm ra ngoài (trước lô) luôn đi được khi nhà và hồ bơi đã chặn đường', () => {
  const walks = LAND_WALKS.map((w) => { const c = { ...w }; addWalk(c); return c; });   // khu dân cư đi được (ở trang thật do outside/land đăng ký)
  for (const p of PLOTS) for (const L of lvs) {
    const added = [houseRect(p, L), poolRect(p, L)].filter(Boolean).map((r) => { const c = { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }; addRect(c); return c; });
    const out = exitPlan(loadLand({ own: { xom: 1, plot: p.id, lv: L } }));
    assert.ok(out && !bodyBlocked(out.x, out.z), `lô ${p.id} cấp ${L}: điểm ra ngoài bị chặn`);
    for (const c of added) RECTS.splice(RECTS.indexOf(c), 1);
  }
  for (const c of walks) WALKS.splice(WALKS.indexOf(c), 1);
});

test('atDoor: đúng ở sát cửa, sai ở giữa phòng', () => {
  for (const L of lvs) { const d = doorInside(L); assert.ok(atDoor({ x: d.x, z: d.z - 0.5 }, L)); assert.ok(!atDoor({ x: INTERIOR.x, z: INTERIOR.z }, L)); }
});

test('houseAction: hiện đúng nút theo chỗ đứng', () => {
  const pl = PLOTS[2], land = loadLand({ own: { xom: 1, plot: pl.id, lv: 1 } });
  assert.equal(houseAction(loadLand(null), pl.front), '', 'chưa có đất thì không hiện gì');
  assert.equal(houseAction(land, { x: 0, z: 100 }), '', 'xa cửa thì không hiện');
  assert.equal(houseAction(land, pl.front), 'enter');
  assert.equal(houseAction(land, entryPoint(1)), 'exit', 'ở trong phòng thì chỉ còn nút ra');
  assert.equal(houseAction(land, null), '');
});

test('netPos: ngoài sân giữ nguyên; trong phòng gửi vị trí trước cửa nhà, luôn trong ±200 (sửa L4)', () => {
  const pl = PLOTS[0], land = { own: { xom: 1, plot: pl.id, lv: 1 } };
  const out = netPos(land, { x: 12.5, z: -3 });
  assert.deepEqual(out, { x: 12.5, z: -3, r: null });
  const inside = netPos(land, entryPoint(1));
  assert.equal(inside.x, pl.front.x); assert.equal(inside.z, pl.front.z);
  assert.ok(Math.abs(inside.x) <= 200 && Math.abs(inside.z) <= 200);
  assert.equal(typeof inside.r, 'number');
  for (const lv of lvs) { const q = netPos(land, entryPoint(lv)); assert.ok(Math.abs(q.x) <= 200 && Math.abs(q.z) <= 200); }
  assert.deepEqual(netPos(null, entryPoint(0)), { x: 0, z: 0, r: null }, 'chưa có đất mà ở trong phòng: về gốc, không gửi tọa độ phòng');
  assert.deepEqual(netPos(land, null), { x: 0, z: 0, r: null });
});

test('nhà trống: không có đồ sẵn; món người chơi đặt (xoay) chặn đúng chỗ và gỡ đăng ký thì hết', () => {
  for (const r of ROOMS) assert.equal(r.furniture.length, 0);
  assert.equal(furnitureRects(0).length, 0);
  const placed = [{ uid: 1, id: 'x', x: 1, z: -1, w: 1.6, d: 0.4, rw: 0.4, rd: 1.6, h: 1, solid: true }, { uid: 2, id: 'y', x: 0, z: 0, w: 2, d: 2, h: 0.02, solid: false }];
  const rs = furnitureRects(0, placed); assert.equal(rs.length, 1);
  assert.ok(Math.abs((rs[0].x1 - rs[0].x0) - 0.4) < 1e-9 && Math.abs((rs[0].z1 - rs[0].z0) - 1.6) < 1e-9, 'dùng kích thước đã xoay');
  const nr = RECTS.length, off = registerRoom(0, placed);
  assert.equal(RECTS.length, nr + 1); off(); assert.equal(RECTS.length, nr);
});
