// Tiếng kỹ năng / chiến đấu (Phiên 109): danh sách cue, đủ file, kế hoạch phát, nối dây vào game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { SFX_FILES, SFX_IDS, CUES, CUE_IDS, sfxUrl, planCue, fallbackOf, filesOf, gapOf } from '../js/world/sfx.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const uiFiles = readdirSync(new URL('js/ui/', root)).filter((f) => f.endsWith('.js')).map((f) => 'js/ui/' + f);

test('đủ file: mỗi tên trong danh sách có file mp3 thật, không có file thừa, mỗi file nhẹ', () => {
  const have = readdirSync(new URL('assets/sfx/', root)).filter((f) => f.endsWith('.mp3')).map((f) => f.replace(/\.mp3$/, '')).sort();
  assert.deepEqual(have, [...SFX_IDS].sort(), 'assets/sfx phải khớp SFX_FILES');
  let total = 0; for (const id of SFX_IDS) { const n = statSync(new URL(sfxUrl(id), root)).size; total += n; assert.ok(n > 1000 && n < 60000, `${id}: ${n} byte`); }
  assert.ok(total < 400000, 'tổng nhẹ để tải nhanh trên điện thoại: ' + total);
  assert.equal(sfxUrl('swoosh'), 'assets/sfx/swoosh.mp3');
});
test('15 file Gp gửi đều được dùng: mỗi file nằm trong ít nhất một cue; mỗi cue chỉ trỏ tới file có thật', () => {
  assert.equal(SFX_IDS.length, 15);
  const used = new Set(CUE_IDS.flatMap((c) => filesOf(c)));
  for (const id of SFX_IDS) assert.ok(used.has(id), 'file chưa dùng: ' + id);
  for (const f of used) assert.ok(SFX_IDS.includes(f), 'cue trỏ tới file lạ: ' + f);
  for (const c of CUE_IDS) { assert.ok(fallbackOf(c).length > 0, c + ' phải có tiếng dự phòng'); assert.ok(gapOf(c) >= 0); }
  assert.deepEqual(filesOf('khong-co'), []); assert.deepEqual(fallbackOf('khong-co'), []);
});
test('planCue: chọn kiểu chém ngẫu nhiên nhưng cố định theo rng; tốc độ/độ lớn/trễ hợp lệ', () => {
  const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
  const a = planCue('thuong', { rng: seq(0, 0.5, 0.5, 0.5) }), b = planCue('thuong', { rng: seq(0.99, 0.5, 0.5, 0.5) });
  assert.equal(a[0].file, 'thuong-1'); assert.equal(b[0].file, 'thuong-3', 'rng khác → kiểu chém khác');
  assert.equal(a.length, 2, 'Thương = tiếng chém + tiếng đâm trúng'); assert.equal(a[1].file, 'dam-trung'); assert.ok(a[1].delay > 0 && a[0].delay === 0);
  for (const c of CUE_IDS) for (const rv of [0, 0.5, 0.999]) for (const p of planCue(c, { rng: () => rv, volume: 1 })) {
    assert.ok(SFX_IDS.includes(p.file)); assert.ok(p.gain > 0 && p.gain <= 1, c + ' gain ' + p.gain); assert.ok(p.rate >= 0.5 && p.rate <= 2, c + ' rate ' + p.rate); assert.ok(p.delay >= 0 && p.delay < 1);
  }
});
test('planCue: tắt tiếng / cue lạ / đầu vào hỏng không phát; âm lượng nhân vào độ lớn nhưng không vượt 1', () => {
  assert.deepEqual(planCue('nhay', { volume: 0 }), []); assert.deepEqual(planCue('khong-co'), []);
  assert.ok(planCue('nhay', { volume: 'abc' }).length === 1, 'volume hỏng → coi như 1');
  const lo = planCue('chem-khi', { volume: 0.5, rng: () => 0 })[0].gain, hi = planCue('chem-khi', { volume: 1.5, rng: () => 0 })[0].gain; assert.ok(lo < hi && hi <= 1);
  assert.equal(planCue('nhay', { rng: () => 0, volume: 1 })[0].rate, 1.1); assert.equal(planCue('nem-da', { rng: () => 1, volume: 1 })[0].rate, 1.8);
});
test('chống dồn tiếng: cue đánh liên tục có khoảng chờ; cue hiếm (thu phục) có khoảng chờ dài', () => {
  for (const c of ['nem-da', 'da-trung', 'thuong', 'nhay', 'quai-ha']) assert.ok(gapOf(c) >= 80, c);
  for (const c of ['yq-thu-phuc', 'yq-xuat-hien']) assert.ok(gapOf(c) >= 1000, c);
});
test('nối dây: mọi cue được gọi ở đâu đó trong js/ui; kỹ năng đúng chỗ; khởi tạo trước các kỹ năng', () => {
  const src = Object.fromEntries(uiFiles.map((f) => [f, read(f)]));
  for (const c of CUE_IDS) assert.ok(uiFiles.some((f) => f !== 'js/ui/sfx.js' && src[f].includes(`'${c}'`)), 'cue chưa được gọi: ' + c);
  const has = (f, re) => assert.match(src[f], re, f);
  has('js/ui/yeuquai.js', /stone\(\) \{[\s\S]*?play\('nem-da'\)/); has('js/ui/yeuquai.js', /play\('thuong'\)/); has('js/ui/yeuquai.js', /play\('yq-thu-phuc'\)/); has('js/ui/yeuquai.js', /play\('bi-danh'\)/); has('js/ui/yeuquai.js', /play\('da-trung'\)/);
  has('js/ui/farm.js', /play\('thuong'\)/); has('js/ui/farm.js', /play\('quai-ha'\)/); has('js/ui/farm.js', /play\('tu-dong-bat'\)/); has('js/ui/farm.js', /play\('tu-dong-tat'\)/);
  has('js/ui/skill.js', /play\('nhay'\)/); has('js/ui/skill.js', /play\('len-bac'\)/);
  has('js/ui/conKhi.js', /LGT\.sfx\.play\(\{ swing: 'chem-khi-vung', go: 'chem-khi' \}/); has('js/ui/thietDau.js', /LGT\.sfx\.play\(\{ go: 'thiet-dau' \}/);
  has('js/ui/carry.js', /play\('nem'\)/); has('js/ui/npcThrow.js', /play\('nem'\)/); has('js/ui/throwPlayer.js', /play\('nem'\)/);
  const h = src['js/ui/hudMenu.js']; assert.ok(h.indexOf('initSfx()') > 0 && h.indexOf('initSfx()') < h.indexOf('initSkill(hud'), 'initSfx phải chạy trước initSkill');
  const s = src['js/ui/sfx.js']; assert.match(s, /audioCtx/); assert.match(s, /fallbackOf\(name\)/); assert.match(s, /sfxGain\(loadSettings/); assert.match(s, /MAX_VOICES/); assert.ok(!/innerHTML/.test(s));
  assert.match(read('js/ui/sound.js'), /export const audioCtx = audio/);
});
test('tiếng thật chỉ thay tiếng tổng hợp, không bỏ nó: conKhi/thietDau vẫn giữ tiếng dự phòng khi LGT.sfx chưa có', () => {
  for (const f of ['js/ui/conKhi.js', 'js/ui/thietDau.js']) { const t = read(f); assert.match(t, /if \(LGT\.sfx\) \{ LGT\.sfx\.play\(/); assert.match(t, /tone\(/); }
});
