import test from 'node:test';
import assert from 'node:assert/strict';
import { cdFrac, hitStyle, pushHit, ghostStep, fmtNum, isLow, SKILL_THEME, HIT_COLOR } from '../js/world/yqFx.js';

test('cdFrac: 0..1, an toàn với dữ liệu xấu', () => {
  assert.equal(cdFrac(1.5, 3), 0.5); assert.equal(cdFrac(0, 3), 0); assert.equal(cdFrac(9, 3), 1); assert.equal(cdFrac(-1, 3), 0);
  assert.equal(cdFrac(2, 0), 0); assert.equal(cdFrac(NaN, 3), 0); assert.equal(cdFrac('x', 'y'), 0);
});
test('hitStyle: đòn mạnh to hơn, có sóng xung kích; kiểu lạ về mặc định', () => {
  const a = hitStyle('da', 12), b = hitStyle('khi', 90), c = hitStyle('nem', 5), d = hitStyle('xyz', 7);
  assert.ok(!a.big && a.text === '12' && !a.ring); assert.ok(b.big && b.text === '90!' && b.ring && b.scale > a.scale && b.shake > a.shake);
  assert.ok(c.big, 'ném yêu quái luôn là đòn nặng'); assert.equal(d.kind, 'da');
  for (const k of Object.keys(HIT_COLOR)) assert.ok(hitStyle(k, 1).hex > 0);
  assert.equal(hitStyle('da', -5).text, '0');
});
test('pushHit: id tăng dần, giữ 12 cái mới nhất, view rỗng không lỗi', () => {
  const v = { hits: [] }; for (let i = 0; i < 15; i++) pushHit(v, { dmg: i, kind: 'da' });
  assert.equal(v.hits.length, 12); assert.equal(v.hits[0].dmg, 3); assert.equal(v.hits[11].id, 15); assert.ok(v.hits.every((h, i, a) => !i || h.id > a[i - 1].id));
  assert.equal(pushHit(null, {}), null); const w = {}; pushHit(w, { dmg: 1 }); assert.equal(w.hits.length, 1);
});
test('ghostStep: máu mất → vệt sáng giữ 0,5 s rồi tụt dần; hồi máu thì theo ngay', () => {
  let g = ghostStep(null, 100, 0.016); assert.equal(g.v, 100);
  g = ghostStep(g, 80, 0.016); assert.equal(g.v, 100, 'đang giữ');
  for (let i = 0; i < 40; i++) g = ghostStep(g, 80, 0.016);   // ~0,64 s
  assert.ok(g.v < 100 && g.v >= 80);
  for (let i = 0; i < 100; i++) g = ghostStep(g, 80, 0.05); assert.equal(g.v, 80);
  assert.equal(ghostStep(g, 95, 0.016).v, 95);
});
test('fmtNum / isLow / theme', () => {
  assert.equal(fmtNum(2400), '2.400'); assert.equal(fmtNum(1234567), '1.234.567'); assert.equal(fmtNum(-3), '0'); assert.equal(fmtNum('a'), '0');
  assert.ok(isLow(10, 100) && !isLow(30, 100) && !isLow(1, 0));
  for (const t of Object.values(SKILL_THEME)) assert.ok(t.cls.startsWith('sk-') && /^#[0-9a-f]{6}$/i.test(t.css));
});
