import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSettings, saveSetting, wantsSound, tryAutoplay, ambientMix, nextDelay, clamp, V_MAX, V_DEF, KEYS } from '../js/ui/soundLogic.js';

const mem = (o = {}) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); } });

test('mặc định BẬT khi chưa từng chọn, âm lượng mặc định', () => {
  const s = loadSettings(mem());
  assert.equal(s.on, null); assert.equal(wantsSound(s), true);
  assert.equal(s.music, V_DEF); assert.equal(s.sfx, V_DEF);
});
test('nhớ lựa chọn: đã tắt thì giữ tắt; âm lượng lưu riêng nhạc và hiệu ứng', () => {
  const m = mem(); saveSetting(m, 'on', false); saveSetting(m, 'music', 0.3); saveSetting(m, 'sfx', 1.2);
  const s = loadSettings(m);
  assert.equal(s.on, false); assert.equal(wantsSound(s), false); assert.equal(s.music, 0.3); assert.equal(s.sfx, 1.2);
  saveSetting(m, 'on', true); assert.equal(loadSettings(m).on, true);
});
test('đọc được khóa âm lượng cũ lgt.vol và chịu được dữ liệu hỏng/ngoài khoảng', () => {
  assert.equal(loadSettings(mem({ [KEYS.music]: '0.9' })).music, 0.9);
  assert.equal(loadSettings(mem({ [KEYS.music]: 'abc' })).music, V_DEF);
  assert.equal(loadSettings(mem({ [KEYS.music]: '99' })).music, V_MAX);
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(loadSettings(broken).on, null); saveSetting(broken, 'on', true);
});

const fakeCtx = (state, resumes) => ({ state, resume() { return resumes ? (this.state = 'running', Promise.resolve()) : new Promise(() => {}); } });
const fakeEl = (ok) => ({ paused: true, play() { if (ok) { this.paused = false; return Promise.resolve(); } const e = new Error('blocked'); e.name = 'NotAllowedError'; return Promise.reject(e); } });

test('autoplay thành công chỉ khi ctx chạy VÀ nhạc phát', async () => {
  const r = await tryAutoplay(fakeCtx('running', true), fakeEl(true));
  assert.equal(r.playing, true); assert.equal(r.reason, 'ok');
});
test('bị chặn (ctx treo + play bị từ chối): KHÔNG báo đang phát, reason = blocked', async () => {
  const r = await tryAutoplay(fakeCtx('suspended', false), fakeEl(false), 50);
  assert.equal(r.playing, false); assert.equal(r.reason, 'blocked');
});
test('nhạc phát nhưng AudioContext vẫn treo = vẫn im lặng nên KHÔNG tính là đang phát', async () => {
  const r = await tryAutoplay(fakeCtx('suspended', false), fakeEl(true), 50);
  assert.equal(r.media, true); assert.equal(r.playing, false);
});
test('sau cử chỉ người chơi (resume được) thì phát', async () => {
  const r = await tryAutoplay(fakeCtx('suspended', true), fakeEl(true), 50);
  assert.equal(r.playing, true);
});

test('môi trường: thác to ở chân thác, im khi ở xa; chim chỉ ban ngày; côn trùng và ếch chỉ ban đêm', () => {
  const nearW = ambientMix({ p: { x: 112, z: 104 }, night: false }), far = ambientMix({ p: { x: 0, z: -30 }, night: false });
  assert.ok(nearW.water > 0.95); assert.equal(far.water, 0);
  assert.ok(nearW.birds > 0 && nearW.insects === 0 && nearW.frogs === 0);
  const n = ambientMix({ p: { x: 112, z: 100 }, night: true });
  assert.equal(n.birds, 0); assert.ok(n.insects > 0 && n.frogs > 0.5);
});
test('mõ nghe rõ gần chánh điện và nhỏ khi ở xa; chuông không tắt hẳn; mọi giá trị trong 0..1', () => {
  const hall = ambientMix({ p: { x: 0, z: -30 }, night: false }), away = ambientMix({ p: { x: 100, z: 120 }, night: false });
  assert.ok(hall.mo > 0.95); assert.equal(away.mo, 0); assert.ok(away.bell >= 0.08);
  for (const m of [hall, away, ambientMix({ p: null, night: true })]) for (const v of Object.values(m)) assert.ok(v >= 0 && v <= 1, String(v));
});
test('không có vị trí: dùng mức vừa phải, không lỗi', () => {
  const m = ambientMix({ p: null, night: false }); assert.ok(m.wind > 0 && m.birds > 0);
  assert.doesNotThrow(() => ambientMix(undefined)); assert.doesNotThrow(() => ambientMix({ p: { x: NaN, z: 1 } }));
});
test('khoảng chờ tiếng ngẫu nhiên: dương, đông (gain lớn) kêu dày hơn và không lặp dồn dập', () => {
  const lo = nextDelay('birds', 0, () => 0), hi = nextDelay('birds', 1, () => 0);
  assert.ok(hi < lo); assert.ok(hi >= 2.5 * 0.6);
  assert.ok(nextDelay('mo', 1, () => 0) >= 30); assert.ok(clamp(5, 0, 1) === 1);
});
