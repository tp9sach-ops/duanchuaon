// Chân khí THẬT (Phiên 215, mục 2): js/world/mana.js + việc nối vào heSkill.js / conKhi.js / combatPose.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MANA, maxMana, costOf, createMana, manaPool } from '../js/world/mana.js';

const mk = (o = {}) => { let t = 0; const p = createMana({ now: () => t, ...o }); return { p, adv: (s) => { t += s; } }; };

test('maxMana tăng theo cấp; cấp lạ → như cấp 1', () => {
  assert.equal(maxMana(1), MANA.base); assert.equal(maxMana(11), MANA.base + 10 * MANA.perLevel);
  assert.equal(maxMana(0), MANA.base); assert.equal(maxMana('x'), MANA.base); assert.equal(maxMana(-5), MANA.base);
});

test('costOf: mỗi ô chiêu có giá, ô sau đắt hơn; ô lạ = 0', () => {
  assert.ok(costOf(1) > 0 && costOf(1) < costOf(2) && costOf(2) < costOf(3) && costOf(3) < costOf(4) && costOf(4) < costOf('tuyet'));
  assert.equal(costOf('abc'), 0); assert.equal(costOf('__proto__'), 0); assert.equal(costOf(undefined), 0);
});

test('spend: đủ thì trừ; thiếu thì giữ nguyên và trả false', () => {
  const { p } = mk();
  assert.equal(p.value, MANA.base);
  assert.equal(p.spend(60), true); assert.equal(p.value, MANA.base - 60);
  assert.equal(p.spend(60), false); assert.equal(p.value, MANA.base - 60, 'không trừ khi thiếu');
  assert.equal(p.can(40), true); assert.equal(p.can(41), false);
});

test('tự hồi theo thời gian, không vượt tối đa', () => {
  const { p, adv } = mk(); p.spend(50); adv(2);
  assert.equal(p.value, MANA.base - 50 + 2 * MANA.regen);
  adv(1000); assert.equal(p.value, MANA.base);
});

test('hết Chân khí thì không dùng được chiêu cho tới khi hồi đủ giá', () => {
  const { p, adv } = mk(); p.spend(95);   // còn 5
  assert.equal(p.can(costOf(1)), false);
  adv(2); assert.equal(p.can(costOf(1)), true, '5 + 2×5 = 15');
});

test('setMax: lên cấp thì cộng phần chênh; hạ thì cắt', () => {
  const { p } = mk(); p.spend(40); p.setMax(130);
  assert.equal(p.max, 130); assert.equal(p.value, 60 + 30);
  p.setMax(50); assert.equal(p.value, 50);
});

test('dữ liệu lạ không làm hỏng kho', () => {
  const { p } = mk(); assert.equal(p.spend(NaN), true); assert.equal(p.spend(-5), true); assert.equal(p.value, MANA.base);
  const q = createMana({ max: 'x' }); assert.equal(q.max, MANA.base);
});

test('manaPool: một kho dùng chung trên LGT', () => {
  const L = {}; const a = manaPool(L), b = manaPool(L); assert.equal(a, b); assert.equal(L.mana, a);
});

test('ĐÃ NỐI: heSkill chặn khi thiếu + trừ khi tung; Chém khí trừ 30; combatPose đọc kho chung', () => {
  const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  const hs = rd('js/ui/heSkill.js');
  assert.equal((hs.match(/if \(!manaOk\(slot, sk\)\) return false;/g) || []).length, 3, 'castSupport + castDir + cast chính');
  assert.equal((hs.match(/manaSpend\(slot\);/g) || []).length >= 3, true);
  assert.match(hs, /Không đủ Chân khí cho/);
  assert.match(rd('js/ui/conKhi.js'), /pool\.spend\(MANA\.khi\)/);
  const cp = rd('js/ui/combatPose.js'); assert.match(cp, /manaPool\(LGT\)/); assert.doesNotMatch(cp, /MANA_SKILL/);
});
