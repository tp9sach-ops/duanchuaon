import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { EMITTERS, NATURE_FILES, NATURE_VOL, MAX_ACTIVE, rolloff, panOf, lowpassHz, kindGates, emitterStates } from '../js/ui/spatialLogic.js';

const DAYENV = { dark: 0, season: 'xuan', rain: 0 }, NIGHTENV = { dark: 1, season: 'xuan', rain: 0 };
const at = (x, z, env, extra = {}) => emitterStates({ p: { x, z }, yaw: 0, ...env, ...extra });
const find = (st, id) => st.find((s) => s.id === id);
const loud = (st, kind) => Math.max(0, ...st.filter((s) => s.kind === kind).map((s) => s.gain));

test('file âm thanh có thật, nhỏ gọn; mỗi nguồn có loại hợp lệ, id duy nhất, ref < max', () => {
  for (const f of Object.values(NATURE_FILES)) { assert.ok(existsSync(f), f); assert.ok(statSync(f).size < 600 * 1024, f + ' quá nặng cho điện thoại'); }
  const ids = new Set();
  for (const m of EMITTERS) { assert.ok(NATURE_FILES[m.kind], m.id); assert.ok(!ids.has(m.id), 'trùng id ' + m.id); ids.add(m.id); assert.ok(m.ref > 0 && m.max > m.ref, m.id); assert.ok(isFinite(m.x) && isFinite(m.z)); }
  for (const k of Object.keys(NATURE_FILES)) assert.ok(EMITTERS.some((m) => m.kind === k) && NATURE_VOL[k] > 0 && MAX_ACTIVE[k] > 0, k);
});

test('nhỏ hơn nhạc nền: mức gốc mọi loại thấp hơn 0,55 (mức nhạc) rõ rệt', () => {
  for (const v of Object.values(NATURE_VOL)) assert.ok(v <= 0.55 * 0.55, String(v));
});

test('rolloff: to nhất khi gần, giảm đơn điệu khi xa, tắt hẳn ở max; không phải đều nhau', () => {
  assert.equal(rolloff(0, 6, 60), 1); assert.equal(rolloff(6, 6, 60), 1); assert.equal(rolloff(60, 6, 60), 0); assert.equal(rolloff(500, 6, 60), 0);
  let prev = 1; for (let d = 7; d < 60; d += 3) { const r = rolloff(d, 6, 60); assert.ok(r < prev && r > 0, `d=${d}`); prev = r; }
  assert.ok(rolloff(12, 6, 60) > 0.4 && rolloff(12, 6, 60) < 0.55, 'xa gấp đôi ≈ −6 dB');
  assert.ok(rolloff(30, 6, 60) < rolloff(12, 6, 60) * 0.5); assert.equal(rolloff(NaN, 6, 60), 0);
});

test('ếch: đứng ở ao thì to, ra xa ao thì nhỏ dần rồi im; đêm mới kêu, ban ngày im', () => {
  const near = at(8, 14, NIGHTENV), mid = at(8, 14 + 25, NIGHTENV), far = at(0, -40, NIGHTENV), day = at(8, 14, DAYENV);
  assert.ok(find(near, 'ech-ao-dong').gain > 0.5, 'bên ao: to');
  assert.ok(loud(mid, 'frog') < loud(near, 'frog') * 0.5 && loud(mid, 'frog') > 0, 'cách ao 25 m: nhỏ hơn hẳn nhưng còn nghe');
  assert.equal(loud(far, 'frog'), 0, 'trong chánh điện sau chùa: không nghe ếch');
  assert.equal(loud(day, 'frog'), 0);
});

test('chim: ban ngày dưới tán cây to, xa cây nhỏ; ban đêm im; mưa lớn làm chim im; mùa đông ít hơn mùa xuân', () => {
  const tree = at(-24, 6, DAYENV), away = at(-24, 6 + 40, DAYENV);
  assert.ok(loud(tree, 'bird') > 0.5 && loud(away, 'bird') < loud(tree, 'bird') * 0.5);
  assert.equal(loud(at(-24, 6, NIGHTENV), 'bird'), 0);
  assert.ok(loud(at(-24, 6, { ...DAYENV, rain: 1 }), 'bird') < 0.15 * loud(tree, 'bird'));
  assert.ok(loud(at(-24, 6, { ...DAYENV, season: 'dong' }), 'bird') < loud(tree, 'bird'));
});

test('dế: ban đêm ở bãi cỏ to, ban ngày im; mùa đông gần như tắt; mưa lớn thưa đi', () => {
  const g = at(-36, 42, NIGHTENV);
  assert.ok(find(g, 'de-san-tay').gain > 0.5); assert.equal(loud(at(-36, 42, DAYENV), 'cricket'), 0);
  assert.ok(loud(at(-36, 42, { ...NIGHTENV, season: 'dong' }), 'cricket') < 0.2 * loud(g, 'cricket'));
  assert.ok(loud(at(-36, 42, { ...NIGHTENV, rain: 1 }), 'cricket') < 0.3 * loud(g, 'cricket'));
});

test('hoàng hôn/rạng đông chuyển từ từ: độ tối tăng thì chim giảm, dế và ếch tăng', () => {
  let b = 2, c = -1, f = -1;
  for (const dark of [0, 0.25, 0.4, 0.55, 0.7, 1]) { const k = kindGates({ dark, season: 'xuan' }); assert.ok(k.bird <= b + 1e-9 && k.cricket >= c - 1e-9 && k.frog >= f - 1e-9, 'dark=' + dark); b = k.bird; c = k.cricket; f = k.frog; }
  assert.equal(kindGates({ night: true, season: 'ha' }).cricket, 1, 'night:true = tối hẳn (mùa hạ dế đủ đầy)'); assert.equal(kindGates({ night: false }).bird, 1);
});

test('trái/phải theo hướng nhìn: nguồn bên phải nghiêng phải, quay người thì đổi bên, sát nguồn thì về giữa, không dồn hẳn một tai', () => {
  const e = { x: 20, z: 0, ref: 5 }, p = { x: 0, z: 0 };
  assert.ok(panOf(p, 0, e) > 0.8, 'yaw 0 nhìn về −z: +x là bên phải');
  assert.ok(panOf(p, Math.PI, e) < -0.8, 'quay ngược lại thì nguồn ở bên trái');
  assert.ok(Math.abs(panOf(p, Math.PI / 2, e)) < 0.05, 'nguồn ở phía sau/trước = giữa');
  assert.ok(Math.abs(panOf({ x: 19, z: 0 }, 0, e)) < 0.3, 'sát nguồn: về gần giữa'); assert.equal(panOf({ x: 20, z: 0 }, 0, e), 0);
  for (let y = -7; y < 7; y += 0.7) assert.ok(Math.abs(panOf(p, y, e)) <= 0.9 + 1e-9);
  assert.doesNotThrow(() => panOf(p, NaN, e));
});

test('xa thì đục hơn (cắt cao thấp dần), không thấp hơn 3,5 kHz', () => {
  assert.ok(lowpassHz(0, 60) > lowpassHz(30, 60) && lowpassHz(30, 60) > lowpassHz(59, 60)); assert.ok(lowpassHz(500, 60) >= 3500);
});

test('mỗi loại chỉ giữ tối đa MAX_ACTIVE nguồn to nhất; mọi giá trị hợp lệ; không có vị trí/dữ liệu hỏng vẫn không lỗi', () => {
  for (const [x, z, env] of [[-30, 10, DAYENV], [0, 14, NIGHTENV], [-100, 90, DAYENV], [-96, 88, NIGHTENV], [0, 60, { dark: 0.5 }]]) {
    const st = emitterStates({ p: { x, z }, yaw: 1, ...env });
    for (const k of Object.keys(MAX_ACTIVE)) assert.ok(st.filter((s) => s.kind === k).length <= MAX_ACTIVE[k]);
    for (const s of st) { assert.ok(s.gain > 0 && s.gain <= 1 && Math.abs(s.pan) <= 0.9 + 1e-9 && s.cutoff >= 3500 && s.cutoff <= 16000, s.id); }
  }
  assert.doesNotThrow(() => emitterStates(undefined)); assert.doesNotThrow(() => emitterStates({ p: { x: NaN, z: 1 }, dark: 1 }));
  assert.ok(emitterStates({ p: null, dark: 1, season: 'xuan' }).length > 0, 'không có cảnh 3D: coi như đứng ở sân chùa, vẫn có tiếng');
});

test('trong chánh điện (có mái) và nơi xa mọi nguồn: tiếng nhỏ/không có', () => {
  assert.ok(loud(at(0, 14, NIGHTENV, { sheltered: true }), 'frog') < loud(at(0, 14, NIGHTENV), 'frog') * 0.6);
  assert.equal(at(0, -30, DAYENV).filter((s) => s.kind === 'bird' && s.dist > 70).length, 0);
});
