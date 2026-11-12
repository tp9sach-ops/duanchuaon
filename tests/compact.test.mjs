import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, IDS, PRESETS, AUTO_ORDER, cleanHide, makeState, parseState, serializeState, setShown, matchPreset, toggleFocus, presetFor, shortestAngle, camMove, dockScale, CAM_KINDS } from '../js/ui/compactLogic.js';
import { dragCamera, zoomCamera, CAM_DIST, CAM_PITCH } from '../js/world/worldLogic.js';

test('mọi kiểu hiển thị và thứ tự tự ẩn chỉ dùng nhóm hợp lệ', () => {
  for (const k of Object.keys(PRESETS)) for (const id of PRESETS[k].hide) assert.ok(IDS.includes(id), k + ':' + id);
  for (const id of AUTO_ORDER) assert.ok(IDS.includes(id), id);
  assert.equal(new Set(IDS).size, GROUPS.length);
  assert.deepEqual(PRESETS.day.hide, []);
});

test('cleanHide bỏ id lạ, trùng và giữ thứ tự nhóm', () => {
  assert.deepEqual(cleanHide(['soon', 'xyz', 'map', 'soon']), ['map', 'soon']);
  assert.deepEqual(cleanHide(null), []); assert.deepEqual(cleanHide('map'), []);
});

test('lưu rồi đọc lại trạng thái; chuỗi hỏng/thiếu dùng kiểu mặc định và chưa tính là đã lưu', () => {
  const st = { ...makeState('gon'), prev: ['map'] };
  const back = parseState(serializeState(st), 'day');
  assert.deepEqual(back.hide, st.hide); assert.equal(back.ac, true); assert.deepEqual(back.prev, ['map']); assert.equal(back.saved, true);
  for (const bad of [null, undefined, '', '{', '[]', '{"v":2,"h":[]}', '{"v":1,"h":"x"}']) {
    const s = parseState(bad, 'gon'); assert.deepEqual(s.hide, PRESETS.gon.hide); assert.equal(s.saved, false);
  }
  assert.deepEqual(parseState(JSON.stringify({ v: 1, h: ['map', 'bogus'], ac: 0 })).hide, ['map']);
});

test('setShown ẩn/hiện một nhóm, id lạ giữ nguyên; matchPreset nhận ra kiểu có sẵn', () => {
  let st = makeState('day');
  st = setShown(st, 'map', false); assert.deepEqual(st.hide, ['map']); assert.equal(matchPreset(st), null);
  st = setShown(st, 'map', true); assert.equal(matchPreset(st), 'day');
  assert.equal(setShown(st, 'zzz', false), st);
  assert.equal(matchPreset(makeState('gon')), 'gon'); assert.equal(matchPreset(makeState('min')), 'min');
});

test('nút ⛶: vào Tối giản nhớ trạng thái cũ, bấm lại thì trả về đúng trạng thái đó', () => {
  const a = setShown(makeState('day'), 'icons', false);
  const m = toggleFocus(a); assert.equal(matchPreset(m), 'min'); assert.deepEqual(m.prev, a.hide);
  const r = toggleFocus(m); assert.deepEqual(r.hide, a.hide); assert.equal(r.prev, null);
  const noPrev = toggleFocus({ ...makeState('min'), prev: null }, PRESETS.gon.hide); assert.deepEqual(noPrev.hide, PRESETS.gon.hide);
});

test('kiểu mặc định theo thiết bị', () => {
  assert.equal(presetFor({ coarse: false, framed: false, w: 1280, h: 720 }), 'day');
  assert.equal(presetFor({ coarse: true, w: 390, h: 800 }), 'gon');
  assert.equal(presetFor({ coarse: false, framed: true, w: 900, h: 500 }), 'gon');
  assert.equal(presetFor({ coarse: true, w: 740, h: 360 }), 'min');
  assert.equal(presetFor({ coarse: false, framed: false, w: 1280, h: 560 }), 'gon');
  assert.equal(presetFor(), 'day');
});

test('shortestAngle luôn trong (−π, π]', () => {
  const eq = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + ' ≠ ' + b);
  eq(shortestAngle(0, Math.PI / 2), Math.PI / 2); eq(shortestAngle(0, 3 * Math.PI / 2), -Math.PI / 2);
  eq(shortestAngle(3, -3), 2 * Math.PI - 6); eq(shortestAngle(10, 10), 0); eq(shortestAngle(0, 2 * Math.PI), 0);
  assert.ok(shortestAngle(0, Math.PI) > 0);
});

test('camMove: áp dx, dy, dz vào dragCamera/zoomCamera thì camera tới đúng đích', () => {
  const cam = { yaw: 2.1, pitch: 0.5, dist: 8 }, facing = 0.7;
  const m = camMove('reset', cam, facing);
  const r = dragCamera(cam.yaw, cam.pitch, m.dx, m.dy), d = zoomCamera(cam.dist, m.dz);
  const want = facing + Math.PI, diff = Math.atan2(Math.sin(r.yaw - want), Math.cos(r.yaw - want));
  assert.ok(Math.abs(diff) < 1e-6, 'yaw ra sau lưng'); assert.ok(Math.abs(r.pitch - CAM_PITCH.def) < 1e-6); assert.ok(Math.abs(d - CAM_DIST.def) < 1e-6);
  const far = camMove('far', cam, facing), n = zoomCamera(cam.dist, far.dz); assert.ok(Math.abs(n - 8.5) < 1e-6); assert.equal(far.dx, 0); assert.equal(far.dy, 0);
  const hi = camMove('high', cam, facing), p = dragCamera(0, cam.pitch, 0, hi.dy).pitch; assert.ok(Math.abs(p - 0.85) < 1e-6); assert.equal(hi.dz, 0);
});

test('camMove kẹp theo giới hạn camera và từ chối dữ liệu hỏng', () => {
  assert.equal(camMove('nope', { yaw: 0, pitch: 0.3, dist: 5 }, 0), null);
  assert.equal(camMove('near', null, 0), null); assert.equal(camMove('near', { yaw: NaN, pitch: 0.3, dist: 5 }, 0), null); assert.equal(camMove('near', { yaw: 0, pitch: 0.3, dist: 0 }, 0), null);
  const m = camMove('near', { yaw: 0, pitch: 0.3, dist: CAM_DIST.min }, 0); assert.ok(m.dz > 0, 'đã gần hơn mức gần thì không kéo thêm vào trong');
  assert.equal(camMove('reset', { yaw: 1, pitch: 0.3, dist: 5 }, undefined).dx, 0, 'chưa biết hướng nhìn thì giữ yaw');
  for (const k of Object.keys(CAM_KINDS)) assert.ok(camMove(k, { yaw: 0, pitch: 0.4, dist: 6 }, 1));
});

test('dockScale: vừa chỗ thì giữ nguyên, thiếu chỗ thì co nhưng không dưới 0,5', () => {
  assert.equal(dockScale({ bottom: 600, limitTop: 100, height: 186 }), 1);
  assert.equal(dockScale({ bottom: 400, limitTop: 250, height: 200 }), 0.75);
  assert.equal(dockScale({ bottom: 300, limitTop: 290, height: 186 }), 0.5);
  assert.equal(dockScale({ bottom: 300, limitTop: 400, height: 186 }), 0.5);
  assert.equal(dockScale({}), 1); assert.equal(dockScale({ bottom: 300, limitTop: NaN, height: 186 }), 1);
});
