// Phiên 138 (mục 1): kinh nghiệm cấp độ khi thu phục quái và khi phóng sinh.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPECIES } from '../js/world/fishing.js';
import { releaseXp, RELEASE_XP } from '../js/world/xpThuong.js';
import { emptyFarm, settleKill, killXp } from '../js/world/farm.js';
import { NGUON_CFG } from '../js/data/nguon.js';
import { levelOf } from '../js/world/quests.js';

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

test('thu phục quái: hết trần Tu Vi trong ngày thì Tu Vi = 0 nhưng kinh nghiệm cấp độ (killXp) vẫn ≥ 1', () => {
  const CAP = NGUON_CFG.tranNgay.hangYeu; let f = emptyFarm(T0);
  for (let i = 0; i < CAP + 10; i++) {
    const r = settleKill(f, { lv: 3 }, { hatSen: 0 }, T0); f = r.farm;
    if (i >= CAP) { assert.equal(r.expGain, 0, 'hết trần Tu Vi'); assert.ok(killXp({ lv: 3 }) >= 1, 'vẫn có kinh nghiệm cấp độ'); }
  }
});

test('nối dây giao diện: thu phục quái không còn phụ thuộc trần Tu Vi; phóng sinh (câu được và ao cá) đều gọi releaseXp', () => {
  const farm = src('../js/ui/farm.js'), fish = src('../js/ui/fishing.js');
  assert.ok(/const xp = killXp\(mon\);/.test(farm), 'ui/farm.js: kinh nghiệm luôn tính theo killXp');
  assert.ok(!/expGain\s*>\s*0\s*\?\s*killXp/.test(farm), 'ui/farm.js: không còn điều kiện expGain > 0');
  assert.ok(/import \{ releaseXp \} from '\.\.\/world\/xpThuong\.js'/.test(fish), 'ui/fishing.js: nhập releaseXp');
  assert.ok(fish.includes('rewardRelease(r.sen, f)'), 'phóng sinh con vừa câu');
  assert.ok(fish.includes('rewardRelease(r.sen, r.fish)'), 'phóng sinh con trong ao cá');
});
