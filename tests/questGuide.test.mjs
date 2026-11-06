import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTS, emptyProg, record } from '../js/world/quests.js';
import { planGuide, PLACE_STAND } from '../js/world/questGuide.js';
import { PLACES } from '../js/world/outside.js';
import { NPCS } from '../js/world/npc.js';
import { SPAWN } from '../js/world/layout.js';
import { HALL_POINT } from '../js/ui/hudLogic.js';
import { free, findPath } from '../js/world/path.js';

const T0 = new Date(2026, 10, 5, 9, 0).getTime();
const P0 = { x: SPAWN.x, z: SPAWN.z };
const loc = { active: () => true, msLeft: () => 0, spot: { x: -14, z: 28 } };
const reachable = (t) => { const p = findPath(P0.x, P0.z, t.x, t.z); const e = p && p[p.length - 1]; return !!e && Math.hypot(e.x - t.x, e.z - t.z) < 0.6; };

test('mọi nhiệm vụ đều có kế hoạch dẫn đường với ít nhất một bước có chữ', () => {
  for (const q of QUESTS) {
    const p = planGuide(q.id, emptyProg(), P0, { loc, now: T0 });
    assert.ok(p, q.id); assert.equal(p.done, false); assert.ok(p.steps.length >= 1, q.id);
    assert.ok(p.steps.every((s) => typeof s.text === 'string' && s.text.length > 5), q.id);
    assert.ok(p.steps.some((s) => s.state === 'now'), q.id);
  }
  assert.equal(planGuide('khong-co', emptyProg(), P0), null);
});

test('mọi đích đi bộ của các nhiệm vụ đều đi tới được từ chỗ xuất hiện', () => {
  for (const q of QUESTS) {
    let idx = 0;
    for (let k = 0; k < 6; k++) {
      const p = planGuide(q.id, emptyProg(), P0, { loc, now: T0, idx });
      if (p.target && p.target.kind === 'walk') { assert.ok(free(p.target.x, p.target.z), `${q.id} đích bị chặn ${p.target.x},${p.target.z}`); assert.ok(reachable(p.target), `${q.id} không có đường`); }
      idx = p.idx + 1;
    }
  }
  for (const p of PLACES) { const s = PLACE_STAND[p.id]; assert.ok(s, p.id); assert.ok(free(s.x, s.z), p.id + ' chỗ đứng bị chặn'); assert.ok(reachable(s), p.id + ' không có đường'); assert.ok(Math.hypot(s.x - p.x, s.z - p.z) <= p.r, p.id + ' chỗ đứng nằm ngoài vùng ghé'); }
});

test('nhiệm vụ trong chánh điện: ngoài sân thì dẫn vào điện, vào rồi thì chỉ nút cần bấm, ra khỏi điện thì quay lại bước vào điện', () => {
  const out = planGuide('n-lay', emptyProg(), P0, { now: T0 });
  assert.equal(out.idx, 0); assert.equal(out.target.kind, 'walk'); assert.equal(out.tap, null); assert.ok(out.dist > 50);
  const inn = planGuide('n-lay', emptyProg(), { x: HALL_POINT.x, z: HALL_POINT.z }, { now: T0, idx: 0 });
  assert.equal(inn.idx, 1); assert.equal(inn.tap, 'lay'); assert.equal(inn.target, null); assert.deepEqual(inn.steps.map((s) => s.state), ['done', 'now']);
  const back = planGuide('n-lay', emptyProg(), P0, { now: T0, idx: 1 });
  assert.equal(back.idx, 0); assert.equal(back.tap, null);
  for (const [id, btn] of [['n-nhang', 'danglee'], ['m-nhang', 'danglee'], ['n-kinh', 'tungkinh'], ['m-kinh', 'tungkinh'], ['n-thien', 'thien'], ['m-niem', 'trenghat']]) assert.equal(planGuide(id, emptyProg(), HALL_POINT, { now: T0, idx: 1 }).tap, btn, id);
  const den = planGuide('m-den', emptyProg(), P0, { now: T0 }); assert.equal(den.tap, 'den'); assert.equal(den.target, null);
});

test('nhiệm vụ nói chuyện: chọn người gần nhất; hành trình bỏ qua người đã gặp', () => {
  const a = planGuide('m-npc', emptyProg(), { x: -4, z: 126 }, { now: T0 });
  assert.equal(a.target.kind, 'npc'); assert.equal(a.target.spot, 'npc-ongcu');
  let prog = emptyProg(); prog = record(prog, { type: 'npc', arg: 'ongcu' }, T0).prog;
  const b = planGuide('m-npc', prog, { x: -4, z: 126 }, { now: T0 });
  assert.notEqual(b.target.spot, 'npc-ongcu'); assert.ok(NPCS.some((n) => 'npc-' + n.id === b.target.spot));
  const d = planGuide('n-npc', emptyProg(), { x: -4, z: 126 }, { now: T0 });   // hằng ngày: ai cũng được tính
  assert.equal(d.target.kind, 'npc');
});

test('nhiệm vụ dạo khắp nơi: chọn nơi chưa ghé gần nhất; đã ghé thì bỏ qua', () => {
  const a = planGuide('m-dao', emptyProg(), { x: 0, z: 90 }, { now: T0 });
  assert.equal(a.target.kind, 'walk'); assert.ok(Math.hypot(a.target.x, a.target.z - 88) < 1);   // đang đứng ở đường làng → đích là đường làng (gần nhất, chưa ghé)
  const prog = record(emptyProg(), { type: 'visit', arg: 'lang' }, T0).prog;
  const b = planGuide('m-dao', prog, { x: 0, z: 90 }, { now: T0 });
  assert.ok(!(Math.hypot(b.target.x, b.target.z - 88) < 1));
});

test('hoa sen vàng: nở thì dẫn tới hoa; đang nghỉ thì báo thời gian chờ', () => {
  const on = planGuide('m-loc', emptyProg(), P0, { loc, now: T0 });
  assert.equal(on.target.x, -14); assert.equal(on.target.z, 28);
  const off = planGuide('m-loc', emptyProg(), P0, { loc: { active: () => false, msLeft: () => 45000, spot: loc.spot }, now: T0 });
  assert.equal(off.target, null); assert.equal(off.wait, 45000); assert.match(off.steps[0].text, /45 giây/);
  assert.equal(planGuide('m-loc', emptyProg(), P0, { loc: null, now: T0 }).target, null);
});

test('nhiệm vụ đã xong thì báo xong, không còn đích', () => {
  const prog = record(emptyProg(), { type: 'thien' }, T0).prog;
  const p = planGuide('n-thien', prog, P0, { now: T0 });
  assert.equal(p.done, true); assert.equal(p.target, null); assert.equal(p.tap, null);
});

test('đi ra làng: bước sau không tự nhảy khi chưa tới; tới ngã ba thì sang bước rẽ', () => {
  const a = planGuide('m-thac', emptyProg(), P0, { now: T0, idx: 0 });
  assert.equal(a.steps.length, 3); assert.equal(a.idx, 0);
  const b = planGuide('m-thac', emptyProg(), { x: 0, z: 104 }, { now: T0, idx: 0 });
  assert.equal(b.idx, 2); assert.equal(Math.round(b.target.x), 95);
});
