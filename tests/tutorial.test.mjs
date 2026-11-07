import test from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, topicById, advise } from '../js/world/tutorial.js';
import { NPCS } from '../js/world/npc.js';
import { EXTRA_POIS } from '../js/world/minimap.js';
import { PLACES } from '../js/world/outside.js';
import { LAND_LA, SEN_PER_LA } from '../js/world/merit.js';
import { BOTTOM_MENU } from '../js/ui/menuLogic.js';
import { ACTIONS, TOP_ICONS } from '../js/ui/menuLogic.js';

const placeIds = new Set([...PLACES.map((p) => p.id), ...EXTRA_POIS.map((p) => p.id)]);
const tapIds = new Set([...BOTTOM_MENU, ...ACTIONS, ...TOP_ICONS].map((i) => i.id));   // Phiên 47: nút “Câu cá” nằm ở cụm tròn phải-trên
const checkGo = (g, where) => {
  if (!g) return;
  if (g.npc) assert.ok(NPCS.some((n) => n.id === g.npc), where + ' npc ' + g.npc);
  else if (g.place) assert.ok(placeIds.has(g.place), where + ' place ' + g.place);
  else if (g.tap) assert.ok(tapIds.has(g.tap), where + ' tap ' + g.tap);
  else assert.fail(where + ' go lạ');
};

test('chủ đề: đủ cách chơi, kiếm sen, đổi lá, xây dựng, phóng sinh; mọi chỗ đi tới là có thật', () => {
  assert.deepEqual(TOPICS.map((t) => t.id), ['batdau', 'kiemsen', 'doila', 'xaydung', 'phongsinh']);
  for (const t of TOPICS) {
    assert.ok(t.ten && t.moTa && t.steps.length >= 2, t.id);
    t.steps.forEach((s, i) => { assert.ok(typeof s.text === 'string' && s.text.length > 20, `${t.id}#${i}`); checkGo(s.go, `${t.id}#${i}`); });
  }
  assert.equal(topicById('doila').ten, 'Đổi lá bồ đề'); assert.equal(topicById('x'), null);
});

test('chữ hướng dẫn dùng đúng con số của luật (đổi giá ở merit/land thì chữ theo)', () => {
  const all = TOPICS.map((t) => t.steps.map((s) => s.text).join(' ') + t.moTa).join(' ');
  assert.ok(all.includes(`${SEN_PER_LA} hạt sen`) && all.includes(`${LAND_LA} lá`));
  assert.ok(/Nhà lầu 150 lá/.test(all) && /Villa hồ bơi 900 lá/.test(all));
});

test('nội thất được ghi rõ là chưa dùng được; phóng sinh đã dùng được (không còn bước "sắp có")', () => {
  assert.ok(!topicById('phongsinh').steps.some((s) => s.soon));
  assert.ok(topicById('xaydung').steps.some((s) => s.soon && /nội thất/.test(s.text)));
});

test('gợi ý kế tiếp đi đúng chuỗi: kiếm sen → đổi lá → mua đất → nâng nhà → vào nhà', () => {
  const a = (s) => advise(s);
  assert.equal(a({}).id, 'kiemsen'); assert.equal(a({ sen: 9, la: 0 }).id, 'kiemsen');
  assert.deepEqual(a({ sen: 25, la: 0 }).go, { npc: 'trikhach' }); assert.match(a({ sen: 25, la: 0 }).text, /2 lá/);
  assert.equal(a({ sen: 3, la: 40 }).id, 'kiemsen2');
  assert.deepEqual(a({ sen: 0, la: LAND_LA }).go, { npc: 'bacphuong' }); assert.equal(a({ sen: 500, la: LAND_LA }).id, 'muadat');
  const own = (lv) => ({ xom: 1, plot: 1, lv });
  assert.equal(a({ sen: 0, la: 100, own: own(0) }).id, 'kiemsen3'); assert.match(a({ sen: 0, la: 100, own: own(0) }).text, /150 lá/);
  assert.equal(a({ sen: 0, la: 150, own: own(0) }).id, 'nangnha');
  assert.equal(a({ sen: 80, la: 10, own: own(1) }).id, 'doila2');
  assert.equal(a({ sen: 0, la: 250, own: own(1) }).id, 'nangnha'); assert.equal(a({ la: 500, own: own(2) }).id, 'nangnha');
  assert.equal(a({ la: 0, own: own(3) }).id, 'vaonha');
});

test('gợi ý chịu dữ liệu hỏng (âm, chữ, NaN, own lạ) và luôn trả một lời khuyên hợp lệ', () => {
  for (const s of [undefined, null, { sen: -5, la: 'x' }, { sen: NaN, la: Infinity, own: {} }, { own: { lv: 'a' } }, { sen: 1e12, la: 1e12 }]) {
    const r = advise(s || undefined); assert.ok(r.id && r.text.length > 20); checkGo(r.go, JSON.stringify(s));
  }
});
