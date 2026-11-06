import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSettings, saveSetting, wantsSound, tryAutoplay, ambientMix, nextDelay, clamp, V_MAX, V_DEF, KEYS, thunderParams } from '../js/ui/soundLogic.js';

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

test('môi trường: thác to ở chân thác, im khi ở xa; không có chim; côn trùng và ếch chỉ ban đêm', () => {
  const nearW = ambientMix({ p: { x: 112, z: 104 }, night: false }), far = ambientMix({ p: { x: 0, z: -30 }, night: false });
  assert.ok(nearW.water > 0.95); assert.equal(far.water, 0);
  assert.ok(nearW.insects === 0 && nearW.frogs === 0); assert.equal('birds' in nearW, false, 'không còn tiếng chim');
  const n = ambientMix({ p: { x: 112, z: 100 }, night: true });
  assert.ok(n.insects > 0 && n.frogs > 0.5);
});
test('mõ nghe rõ gần chánh điện và nhỏ khi ở xa; chuông không tắt hẳn; mọi giá trị trong 0..1', () => {
  const hall = ambientMix({ p: { x: 0, z: -30 }, night: false }), away = ambientMix({ p: { x: 100, z: 120 }, night: false });
  assert.ok(hall.mo > 0.95); assert.equal(away.mo, 0); assert.ok(away.bell >= 0.08);
  for (const m of [hall, away, ambientMix({ p: null, night: true })]) for (const v of Object.values(m)) assert.ok(v >= 0 && v <= 1, String(v));
});
test('không có vị trí: dùng mức vừa phải, không lỗi', () => {
  const m = ambientMix({ p: null, night: false }); assert.ok(m.wind > 0);
  assert.doesNotThrow(() => ambientMix(undefined)); assert.doesNotThrow(() => ambientMix({ p: { x: NaN, z: 1 } }));
});
test('khoảng chờ tiếng ngẫu nhiên: dương, đông (gain lớn) kêu dày hơn và không lặp dồn dập', () => {
  const lo = nextDelay('frogs', 0, () => 0), hi = nextDelay('frogs', 1, () => 0);
  assert.ok(hi < lo); assert.ok(hi >= 1.5 * 0.6);
  assert.ok(nextDelay('mo', 1, () => 0) >= 30); assert.ok(clamp(5, 0, 1) === 1);
});

test('mưa (Phiên 25): trời quang thì tiếng mưa = 0; mưa càng lớn càng to; gió mạnh lên; trong chánh điện nhỏ lại; côn trùng thưa, chuông/mõ nhỏ bớt', () => {
  const at = { x: 0, z: 60 }, dry = ambientMix({ p: at, night: true, rain: 0, wind: 0 });
  assert.equal(dry.rain, 0);
  const r = [0.2, 0.5, 1].map((rain) => ambientMix({ p: at, night: true, rain, wind: rain }));
  assert.ok(r[0].rain > 0.1 && r[0].rain < r[1].rain && r[1].rain < r[2].rain && r[2].rain <= 1, 'mưa to dần: ' + r.map((x) => x.rain));
  assert.ok(r[2].wind > dry.wind, 'gió mạnh hơn khi giông'); assert.ok(r[2].insects < dry.insects * 0.4, 'côn trùng thưa khi mưa lớn'); assert.ok(r[2].bell < dry.bell);
  const roof = ambientMix({ p: { x: 0, z: -30 }, night: false, rain: 1, wind: 1, sheltered: true }), open = ambientMix({ p: { x: 0, z: -30 }, night: false, rain: 1, wind: 1 });
  assert.ok(roof.rain < open.rain * 0.5 && roof.wind < open.wind, 'có mái: mưa và gió nhỏ lại');
  for (const m of [...r, roof, open, ambientMix({ p: null, night: true, rain: 1, wind: 1 })]) for (const v of Object.values(m)) assert.ok(v >= 0 && v <= 1, String(v));
  assert.equal(ambientMix({ p: at, night: false }).rain, 0, 'không truyền mưa thì như cũ'); assert.doesNotThrow(() => ambientMix({ p: at, rain: NaN, wind: 'x' }));
});
test('thunderParams: sấm gần to hơn, dài hơn và có tiếng nổ; sấm xa nhỏ, trầm; giá trị luôn hợp lệ', () => {
  const near = thunderParams(1), far = thunderParams(0.25);
  assert.ok(near.gain > far.gain && near.dur > far.dur && near.cutoff > far.cutoff && near.crack === true && far.crack === false);
  for (const v of [-1, 0, 0.5, 1, 9, NaN, undefined]) { const t = thunderParams(v); assert.ok(t.gain > 0 && t.gain <= 1 && t.dur > 1 && t.cutoff > 100, String(v)); }
});

// Phiên 31: âm thanh theo mùa và môi trường
import { SEASON_MIX, SPOTS } from '../js/ui/soundLogic.js';
const at = (x, z, extra = {}) => ambientMix({ p: { x, z }, night: false, rain: 0, wind: 0, ...extra });
test('ve chỉ có mùa hạ ban ngày; không có ban đêm, mưa lớn tắt dần', () => {
  assert.ok(at(0, 60, { season: 'ha' }).cicada > 0); assert.equal(at(0, 60, { season: 'xuan' }).cicada, 0); assert.equal(at(0, 60, { season: 'dong' }).cicada, 0);
  assert.equal(at(0, 60, { season: 'ha', night: true }).cicada, 0); assert.ok(at(0, 60, { season: 'ha', rain: 1 }).cicada === 0);
  assert.equal(at(0, 60).cicada, 0);
});
test('trong rừng thông ve to hơn và gió xào xạc hơn so với sân chùa', () => {
  const f = at(SPOTS.forest.x, SPOTS.forest.z, { season: 'ha' }), t = at(0, -8, { season: 'ha' });
  assert.ok(f.cicada > t.cicada); assert.ok(f.wind > t.wind);
});
test('mùa đông: côn trùng gần như tắt, ếch im, gió mạnh hơn mùa xuân; mùa xuân ếch nhiều hơn mùa thu (ban đêm)', () => {
  const d = at(0, 70, { season: 'dong', night: true }), x = at(0, 70, { season: 'xuan', night: true }), th = at(0, 70, { season: 'thu', night: true });
  assert.ok(d.insects < x.insects * 0.3); assert.equal(d.frogs, 0); assert.ok(at(0, 70, { season: 'dong' }).wind > at(0, 70, { season: 'xuan' }).wind); assert.ok(x.frogs > th.frogs);
});
test('mùa lạ/không có = hành vi cũ; mọi lớp luôn trong 0..1, kể cả khi không biết vị trí', () => {
  for (const season of [undefined, 'xx', 'xuan', 'ha', 'thu', 'dong']) for (const night of [false, true]) for (const p of [null, { x: 0, z: 60 }, SPOTS.forest, SPOTS.water]) {
    const m = ambientMix({ p, night, rain: 0.3, wind: 1, season }); for (const k of Object.keys(m)) assert.ok(m[k] >= 0 && m[k] <= 1, `${season}/${night}/${k}=${m[k]}`);
  }
  assert.equal(at(0, 60, { night: true }).insects, at(0, 60, { night: true, season: 'thu' }).insects); assert.ok(SEASON_MIX.ha.cicada === 1);
});
