// Phiên 131: bốn VÙNG SÂU ở bốn góc bản đồ — càng xa chùa càng nguy hiểm (cấp, Oán Khí, sát thương).
import test from 'node:test';
import assert from 'node:assert/strict';
import { FARM_ZONES, MONSTERS } from '../js/data/monsters.js';
import { OUT_WALKS } from '../js/world/outside.js';
import { ZONE_IDS, oanKhiMaxOf, monsterStats, createSpawner } from '../js/world/spawn.js';
import { strikeDamage } from '../js/world/monsterAttack.js';
import { statsOf } from '../js/world/stats.js';
import { WORLD_BOX } from '../js/world/minimap.js';
import { topicById } from '../js/world/tutorial.js';

const DEEP = { vachTayBac: ['rung-sau-vach-tbac', 'loi-vach-tbac', 'rung-sau-bac'], vachDongBac: ['rung-sau-vach-dbac', 'loi-vach-dbac', 'rung-sau-thap'], vachTayNam: ['rung-sau-vach-tnam', 'loi-vach-tnam', 'rung-sau-tay'], vachDongNam: ['rung-sau-vach-dnam', 'loi-vach-dnam', 'rung-sau-dong'] };
const W = (id) => OUT_WALKS.find((w) => w.id === id), touch = (a, b) => a.x0 <= b.x1 + 0.01 && b.x0 <= a.x1 + 0.01 && a.z0 <= b.z1 + 0.01 && b.z0 <= a.z1 + 0.01;
const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
const rng = (() => { let s = 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

test('có 8 vùng; mỗi vùng sâu nằm trọn trong khoảng đất trống riêng, nối bằng lối hẹp ≥ 6 m vào khoảng rừng cũ, ĐI TỚI ĐƯỢC từ đường làng', () => {
  assert.equal(ZONE_IDS.length, 8);
  const seen = new Set(['duong-lang']), q = [W('duong-lang')];
  while (q.length) { const a = q.pop(); for (const w of OUT_WALKS) if (!seen.has(w.id) && touch(a, w)) { seen.add(w.id); q.push(w); } }
  for (const [zid, [glade, lane, old]] of Object.entries(DEEP)) {
    const z = FARM_ZONES[zid], g = W(glade), l = W(lane); assert.ok(z && g && l, zid);
    assert.ok(z.rects.every((r) => r.x0 >= g.x0 && r.x1 <= g.x1 && r.z0 >= g.z0 && r.z1 <= g.z1), `${zid} trọn trong khoảng đất`);
    assert.ok(Math.min(l.x1 - l.x0, l.z1 - l.z0) >= 6, 'lối ≥ 6 m'); assert.ok(touch(l, g) && touch(l, W(old)), 'lối nối khoảng đất với khoảng rừng cũ');
    assert.ok(seen.has(glade), `${zid} đi tới được`);
    for (const w of OUT_WALKS) if (w.id !== glade && w.id !== lane) assert.ok(!overlap(g, w) || w.id === old && false, `${glade} chồng ${w.id}`);
    for (const r of z.nightRects) assert.ok(overlap(r, l) || (r.x0 >= l.x0 && r.x1 <= l.x1 && r.z0 >= l.z0 && r.z1 <= l.z1), 'nightRects = lối nối');
    for (const t of [...z.normal, ...z.elite, z.boss]) assert.ok(MONSTERS[t], t);
    assert.ok(g.x0 >= -138 && g.x1 <= 138 && g.z0 >= -20 && g.z1 <= 145, 'trong mặt đất');
  }
});

test('càng xa chùa càng nguy hiểm: cấp, Oán Khí và sát thương đều cao hơn vùng gần; vùng độ sâu 3 > độ sâu 2', () => {
  const near = ['biaRungThong', 'duongMon', 'hoThac', 'doiBaoThap'], gate = { x: 0, z: 34 };
  const dist = (id) => { const r = FARM_ZONES[id].rects[0]; return Math.hypot((r.x0 + r.x1) / 2 - gate.x, (r.z0 + r.z1) / 2 - gate.z); };
  for (const d of Object.keys(DEEP)) for (const n of near) assert.ok(dist(d) > dist(n) * 0.95 && FARM_ZONES[d].lvMin > FARM_ZONES[n].lvMax, `${d} xa & mạnh hơn ${n}`);
  const per = (id) => { const z = FARM_ZONES[id]; return z.normal[0]; };
  const tier = (id) => MONSTERS[FARM_ZONES[id].boss].mul;
  assert.ok(tier('vachTayNam').hp > tier('vachTayBac').hp && tier('vachDongNam').atk > tier('vachDongBac').atk);
  for (const d of Object.keys(DEEP)) {
    const t = MONSTERS[per(d)], base = 50 + 25 * t.lv; assert.equal(oanKhiMaxOf(t.id), Math.round(base * t.mul.hp)); assert.ok(t.mul.hp > 1 && t.mul.atk > 1);
    assert.equal(monsterStats(t.id).cong, Math.round(statsOf(t.lv).cong * t.mul.atk));
    assert.ok(oanKhiMaxOf(FARM_ZONES[d].boss) > oanKhiMaxOf(FARM_ZONES[d].elite[0]) && oanKhiMaxOf(FARM_ZONES[d].elite[0]) > oanKhiMaxOf(t.id));
    const hit = (id) => strikeDamage({ type: id, elite: false }, { thu: 50, max: 1e9, rel: 'thuong' });
    for (const n of near) assert.ok(hit(t.id) > hit(FARM_ZONES[n].normal[0]), `${d} đánh đau hơn ${n}`);
  }
  const mx = (ids) => Math.max(...ids.map((i) => oanKhiMaxOf(MONSTERS[FARM_ZONES[i].normal[0]].id)));
  assert.ok(mx(Object.keys(DEEP)) > mx(near) * 1.5);
  for (const n of near) assert.equal(MONSTERS[FARM_ZONES[n].normal[0]].mul, undefined, 'vùng gần giữ nguyên số cũ');
});

test('bốn vùng sâu sinh quái đúng loại/cấp; quái ngày nằm trong khoảng đất; có boss', () => {
  for (const zid of Object.keys(DEEP)) {
    const z = FARM_ZONES[zid], sp = createSpawner(zid, rng), regs = sp.mons.filter((m) => !m.boss);
    assert.equal(regs.length, z.cap); assert.ok(sp.mons.some((m) => m.boss && m.type === z.boss));
    assert.ok(regs.every((m) => z.rects.some((r) => m.x >= r.x0 && m.x <= r.x1 && m.z >= r.z0 && m.z <= r.z1)));
    assert.ok(regs.every((m) => MONSTERS[m.type].lv >= z.lvMin && MONSTERS[m.type].lv <= z.lvMax));
  }
});

// Phiên 132: bản đồ nhỏ phải phủ cả bốn vùng sâu (trước đó khung chỉ tới x −125/122 nên người ở góc bị kẹp mép) và hướng dẫn phải nhắc tám vùng.
test('bản đồ nhỏ phủ trọn mọi vùng luyện (kể cả bốn vùng sâu); hướng dẫn nhắc bốn vùng sâu và dải cấp 72–140', () => {
  for (const id of ZONE_IDS) for (const r of FARM_ZONES[id].rects) {
    assert.ok(r.x0 >= WORLD_BOX.x0 && r.x1 <= WORLD_BOX.x1 && r.z0 >= WORLD_BOX.z0 && r.z1 <= WORLD_BOX.z1, `${id} nằm trong khung bản đồ`);
  }
  for (const id of ['rung-sau-vach-tbac', 'rung-sau-vach-dbac', 'rung-sau-vach-tnam', 'rung-sau-vach-dnam']) {
    const w = W(id); assert.ok(w.x0 >= WORLD_BOX.x0 && w.x1 <= WORLD_BOX.x1, `${id} nằm trong khung bản đồ`);
  }
  const txt = topicById('hangyeu').steps.map((s) => s.text).join(' ');
  assert.ok(txt.includes('tám vùng luyện') && !txt.includes('bốn vùng luyện:'));
  for (const d of Object.keys(DEEP)) assert.ok(txt.includes(FARM_ZONES[d].ten), `hướng dẫn nhắc ${d}`);
  assert.ok(txt.includes(`${FARM_ZONES.vachTayBac.lvMin}–${FARM_ZONES.vachDongNam.lvMax}`));
});
