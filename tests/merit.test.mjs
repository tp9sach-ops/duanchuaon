import test from 'node:test';
import assert from 'node:assert/strict';
import { SEN_PER_LA, LAND_LA, DAILY_CAP, MED_SECONDS_PER_SEN, emptyLeaf, loadLeaf, maxLa, exchange, lifetimeSen, addMeditation, claimAct, ACT_CAP } from '../js/world/merit.js';

const T0 = new Date(2026, 10, 7, 9, 0).getTime();

test('luật ptg chốt: 10 hạt sen = 1 lá; 100 lá = một lô đất', () => { assert.equal(SEN_PER_LA, 10); assert.equal(LAND_LA, 100); assert.equal(maxLa(95), 9); assert.equal(maxLa(10), 1); assert.equal(maxLa(9), 0); assert.equal(maxLa(-3), 0); assert.equal(maxLa('x'), 0); });

test('đổi lá: đủ sen thì cộng lá, ghi spent; thiếu hoặc số sai thì giữ nguyên', () => {
  const a = exchange(emptyLeaf(), 35, 3); assert.equal(a.ok, true); assert.equal(a.cost, 30); assert.equal(a.leaf.la, 3); assert.equal(a.leaf.spent, 30);
  const poor = exchange(a.leaf, 5, 1); assert.equal(poor.ok, false); assert.equal(poor.reason, 'poor'); assert.equal(poor.leaf, a.leaf);
  for (const n of [0, -1, 1.5 - 2, NaN, 'abc', 1e9, null, undefined]) { const r = exchange(a.leaf, 1e9, n); assert.equal(r.ok, false, String(n)); assert.equal(r.reason, 'invalid'); assert.equal(r.leaf, a.leaf); }
  assert.equal(exchange(emptyLeaf(), 1000, 2.9).leaf.la, 2, 'số lẻ làm tròn xuống');
});

test('đổi không làm hỏng bản cũ và không tạo lá từ không khí', () => {
  const l0 = emptyLeaf(), r = exchange(l0, 100, 10); assert.equal(l0.la, 0); assert.equal(l0.spent, 0); assert.notEqual(r.leaf, l0);
  assert.equal(r.leaf.la * SEN_PER_LA, r.cost); assert.equal(lifetimeSen(0, r.leaf), 100, 'điểm xếp hạng không tụt sau khi đổi');
  assert.equal(lifetimeSen(40, r.leaf), 140);
});

test('đọc dữ liệu hỏng/sửa tay: rác → trống; nhiều lá hơn số sen đã tiêu → chỉnh lại spent', () => {
  for (const bad of [null, undefined, 'rác{', '[]', 5, '{"la":"x"}']) assert.deepEqual(loadLeaf(bad), emptyLeaf());
  const o = loadLeaf({ la: 50, spent: 0 }); assert.equal(o.spent, 500);
  assert.equal(loadLeaf({ la: -4 }).la, 0); assert.equal(loadLeaf(JSON.stringify({ la: 7, spent: 70 })).la, 7);
  assert.equal(loadLeaf({ day: { k: '2026-11-07', thien: 999, med: 99999 } }).day.thien, DAILY_CAP.thien);
});

test('thiền: 180 giây thật = 1 hạt sen, tối đa 10 mỗi ngày; sang ngày mới đếm lại', () => {
  let l = emptyLeaf(), sen = 0;
  for (let i = 0; i < MED_SECONDS_PER_SEN / 2; i++) { const r = addMeditation(l, 2, T0); l = r.leaf; sen += r.sen; }
  assert.equal(sen, 1);
  for (let i = 0; i < 20000; i++) { const r = addMeditation(l, 2, T0); l = r.leaf; sen += r.sen; }
  assert.equal(sen, DAILY_CAP.thien, 'chặn trần theo ngày'); assert.equal(l.day.thien, DAILY_CAP.thien);
  assert.equal(addMeditation(l, 2, T0).sen, 0);
  const next = addMeditation(l, 2, T0 + 24 * 3600 * 1000); assert.equal(next.leaf.day.thien, 0); assert.ok(next.leaf.day.med > 0);
});

test('thiền: dt lớn/xấu bị chặn, không cộng dồn một lúc', () => {
  const l = emptyLeaf();
  assert.equal(addMeditation(l, 100000, T0).sen, 0, 'một lần tối đa 2 giây');
  for (const d of [-5, NaN, 'x', undefined, 0]) { const r = addMeditation(l, d, T0); assert.equal(r.sen, 0); assert.equal(r.leaf.day.med, 0); }
  assert.equal(addMeditation(l, 100000, T0).leaf.day.med, 2);
});

test('nối giao diện: Thầy Tri khách mở bảng đổi lá, ví tính điểm xếp hạng theo tổng sen từng kiếm', async () => {
  const { readFileSync } = await import('node:fs');
  const npc = readFileSync(new URL('../js/ui/npc.js', import.meta.url), 'utf8'), hud = readFileSync(new URL('../js/ui/hudMenu.js', import.meta.url), 'utf8');
  assert.match(npc, /trikhach[\s\S]{0,80}LGT\.merit/); assert.match(hud, /initMerit\(/); assert.match(hud, /lifetimeSen\(/); assert.match(hud, /spendMerit/);
  const { npcById } = await import('../js/world/npc.js'); assert.ok(npcById('trikhach'), 'NPC trikhach phải tồn tại');
});

import { spendLa } from '../js/world/merit.js';
test('tiêu lá: đủ thì trừ, thiếu/sai thì giữ nguyên; điểm xếp hạng (spent) không đổi', () => {
  const l = exchange(emptyLeaf(), 1000, 100).leaf;
  const r = spendLa(l, 100); assert.equal(r.ok, true); assert.equal(r.leaf.la, 0); assert.equal(r.leaf.spent, l.spent); assert.equal(l.la, 100, 'không sửa bản cũ');
  for (const n of [101, 0, -1, NaN, 'x', null]) { const f = spendLa(l, n); assert.equal(f.ok, false, String(n)); assert.equal(f.leaf, l); }
  assert.equal(loadLeaf(JSON.stringify(r.leaf)).la, 0);
});

test('lạy/cúng/nhang: mỗi loại tối đa 10 lần/ngày, sang ngày mới đếm lại, loại lạ bị từ chối', () => {
  const d1 = new Date(2026, 10, 7, 9).getTime(), d2 = new Date(2026, 10, 8, 9).getTime();
  let l = emptyLeaf();
  for (let i = 1; i <= ACT_CAP.lay; i++) { const r = claimAct(l, 'lay', d1); assert.ok(r.ok); assert.equal(r.used, i); assert.equal(r.left, ACT_CAP.lay - i); l = r.leaf; }
  const full = claimAct(l, 'lay', d1); assert.equal(full.ok, false); assert.equal(full.leaf, l);
  assert.ok(claimAct(l, 'nhang', d1).ok && claimAct(l, 'cung', d1).ok, 'loại khác có lượt riêng');
  const n = claimAct(l, 'lay', d2); assert.ok(n.ok); assert.equal(n.used, 1);
  assert.equal(claimAct(l, 'abc', d1).ok, false); assert.equal(l.day.acts.lay, 10, 'không sửa đầu vào');
  const back = loadLeaf(JSON.stringify(l)); assert.equal(back.day.acts.lay, 10);
  assert.equal(loadLeaf({ day: { k: '2026-11-07', acts: { lay: 999, nhang: -3, x: 5 } } }).day.acts.lay, 10);
});

test('thiền cùng ngày giữ lượt lạy/cúng/nhang; sang ngày mới thì xóa', () => {
  const d1 = new Date(2026, 10, 7, 9).getTime(), d2 = new Date(2026, 10, 8, 9).getTime();
  const l = claimAct(emptyLeaf(), 'lay', d1).leaf;
  assert.equal(addMeditation(l, 1, d1).leaf.day.acts.lay, 1);
  assert.deepEqual(addMeditation(l, 1, d2).leaf.day.acts, {});
});
