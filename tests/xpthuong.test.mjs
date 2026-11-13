// Phiên 138: kinh nghiệm cấp độ khi thu phục quái và khi phóng sinh; cấp công hạnh và Tu Vi KHÔNG còn trần.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPECIES } from '../js/world/fishing.js';
import { releaseXp, RELEASE_XP } from '../js/world/xpThuong.js';
import { emptyFarm, settleKill, killXp } from '../js/world/farm.js';
import { levelOf, LEVELS } from '../js/world/quests.js';
import { xpForLevel, levelAtXp } from '../js/world/levelCurve.js';

const T0 = Date.UTC(2026, 10, 13, 5, 0, 0);   // 12:00 giờ VN, 13/11/2026
const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('releaseXp: 2 cơ bản, +2 loài hiếm, +1 cỡ lớn', () => {
  assert.equal(releaseXp({ sp: 'chep', lon: false }), RELEASE_XP.base);
  assert.equal(releaseXp({ sp: 'chep', lon: true }), RELEASE_XP.base + RELEASE_XP.lon);
  assert.equal(releaseXp({ sp: 'koi', lon: false }), RELEASE_XP.base + RELEASE_XP.hiem);
  assert.equal(releaseXp({ sp: 'koi', lon: true }), RELEASE_XP.base + RELEASE_XP.hiem + RELEASE_XP.lon);
});

test('releaseXp: loài lạ hoặc đầu vào hỏng → 0, không ném lỗi', () => {
  for (const bad of [null, undefined, {}, { sp: 'khongco' }, 5, 'x', []]) assert.equal(releaseXp(bad), 0);
});

test('releaseXp: mọi loài, cả cỡ nhỏ và lớn, đều cho 2..5 kinh nghiệm', () => {
  for (const sp of SPECIES) for (const lon of [false, true]) { const x = releaseXp({ sp: sp.id, lon }); assert.ok(x >= 2 && x <= 5, `${sp.id} lon=${lon} → ${x}`); }
});

test('phóng sinh liên tục đủ để lên cấp: 15 lần cá chép nhỏ = 30 điểm = cấp 2', () => {
  assert.equal(levelOf(0).lv, 1);
  assert.equal(levelOf(15 * releaseXp({ sp: 'chep', lon: false })).lv, 2);
});

test('thu phục quái: Phiên 138 không còn trần Tu Vi theo ngày — hạ 100 lần trong một ngày vẫn lần nào cũng có Tu Vi và kinh nghiệm cấp độ', () => {
  let f = emptyFarm(T0);
  for (let i = 0; i < 100; i++) {
    const r = settleKill(f, { lv: 3 }, { hatSen: 0 }, T0); f = r.farm;
    assert.ok(r.expGain > 0, `lần ${i + 1} phải có Tu Vi`); assert.equal(r.expCapped, false);
    assert.ok(killXp({ lv: 3 }) >= 1, 'có kinh nghiệm cấp độ');
  }
});

test('cấp công hạnh KHÔNG giới hạn: cấp 10 ở 1800 điểm, cấp 11 ở 2400, cấp 12 ở 3100; điểm cực lớn vẫn ra cấp hợp lệ', () => {
  const L = LEVELS.length;
  assert.deepEqual([levelOf(1799).lv, levelOf(1800).lv, levelOf(2399).lv, levelOf(2400).lv, levelOf(3099).lv, levelOf(3100).lv], [9, 10, 10, 11, 11, 12]);
  const big = levelOf(1e9);
  assert.ok(big.lv > L, 'vượt cấp 10'); assert.ok(big.xp1 > big.xp && big.xp >= big.xp0); assert.ok(big.pct >= 0 && big.pct <= 100); assert.equal(big.ten, LEVELS[L - 1].ten);
  assert.equal(levelOf(1800).xp1, 2400);
});

test('đường cong cấp: đơn điệu, liên tục, không bỏ cấp; xpForLevel và levelAtXp là hàm ngược của nhau', () => {
  const table = LEVELS.map((l) => l.xp); let prev = 0;
  for (let x = 0; x <= 60000; x += 37) { const v = levelOf(x); assert.ok(v.lv >= prev && v.lv - prev <= 1 || prev === 0, `x=${x}`); assert.ok(x >= v.xp0 && x < v.xp1, `x=${x} trong [${v.xp0}, ${v.xp1})`); prev = v.lv; }
  for (let lv = 1; lv <= 300; lv++) { assert.equal(levelAtXp(table, xpForLevel(table, lv)), lv, `cấp ${lv}`); if (lv > 1) assert.equal(levelAtXp(table, xpForLevel(table, lv) - 1), lv - 1, `ngay dưới cấp ${lv}`); }
  for (const bad of [-5, NaN, 'x', null, undefined]) assert.equal(levelAtXp(table, bad), 1);
});

test('nối dây giao diện: thu phục quái không còn phụ thuộc trần Tu Vi; phóng sinh (câu được và ao cá) đều gọi releaseXp', () => {
  const farm = src('../js/ui/farm.js'), fish = src('../js/ui/fishing.js');
  assert.ok(/const xp = killXp\(mon\);/.test(farm), 'ui/farm.js: kinh nghiệm luôn tính theo killXp');
  assert.ok(!/expGain\s*>\s*0\s*\?\s*killXp/.test(farm), 'ui/farm.js: không còn điều kiện expGain > 0');
  assert.ok(/import \{ releaseXp \} from '\.\.\/world\/xpThuong\.js'/.test(fish), 'ui/fishing.js: nhập releaseXp');
  assert.ok(fish.includes('rewardRelease(r.sen, f)'), 'phóng sinh con vừa câu');
  assert.ok(fish.includes('rewardRelease(r.sen, r.fish)'), 'phóng sinh con trong ao cá');
});
