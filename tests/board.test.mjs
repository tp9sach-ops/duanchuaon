// Ván trượt (Phiên 92): luật mua, lên/xuống ván, hệ số tốc độ, nút trong cụm thao tác, dòng trong Túi đồ.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, loadBoard, buyBoard, toggleBoard, boardSpeedMul, canRide } from '../js/world/board.js';
import { dockButtons, bagSections } from '../js/world/dock.js';

test('loadBoard: đọc hỏng → chưa có ván; không thể "đang đứng trên ván" khi chưa có', () => {
  for (const bad of [null, undefined, '', 'xyz', '[]', 5, { own: 'yes' }]) assert.deepEqual(loadBoard(bad), { own: false, on: false });
  assert.deepEqual(loadBoard({ own: false, on: true }), { own: false, on: false });
  assert.deepEqual(loadBoard('{"own":true,"on":true}'), { own: true, on: true });
});

test('buyBoard: đủ hạt sen thì mua được, thiếu thì không, mua rồi không mua lại', () => {
  const poor = buyBoard(null, BOARD.gia - 1); assert.equal(poor.ok, false); assert.equal(poor.reason, 'poor'); assert.equal(poor.state.own, false);
  const nan = buyBoard(null, 'abc'); assert.equal(nan.ok, false);
  const ok = buyBoard(null, BOARD.gia); assert.equal(ok.ok, true); assert.equal(ok.cost, BOARD.gia); assert.deepEqual(ok.state, { own: true, on: false });
  const again = buyBoard(ok.state, 9999); assert.equal(again.ok, false); assert.equal(again.reason, 'owned');
});

test('toggleBoard: chưa có ván thì không lên được; có rồi thì lên/xuống', () => {
  assert.deepEqual(toggleBoard(null), { ok: false, reason: 'none', state: { own: false, on: false } });
  const own = { own: true, on: false };
  const up = toggleBoard(own); assert.equal(up.ok, true); assert.equal(up.state.on, true);
  assert.equal(toggleBoard(up.state).state.on, false);
  assert.equal(toggleBoard(own, true).state.on, true); assert.equal(toggleBoard(up.state, true).state.on, true);
});

test('boardSpeedMul: đứng trên ván → đúng gấp đôi, còn lại ×1', () => {
  assert.equal(BOARD.mul, 2);
  assert.equal(boardSpeedMul({ own: true, on: true }), 2);
  assert.equal(boardSpeedMul({ own: true, on: false }), 1);
  assert.equal(boardSpeedMul(null), 1);
  assert.equal(boardSpeedMul({ own: false, on: true }), 1);
});

test('canRide: chỉ khi đi lại tự do, ngoài nhà, không bơi', () => {
  assert.equal(canRide({ free: true }), true);
  assert.equal(canRide({ free: true, inHouse: true }), false);
  assert.equal(canRide({ free: true, swim: true }), false);
  assert.equal(canRide({ free: false }), false);
  assert.equal(canRide(), false);
});

test('dockButtons: nút Lên/Xuống ván chỉ hiện khi đã có ván và đang ngoài nhà', () => {
  const ids = (c) => dockButtons({ free: true, ...c }).map((b) => b.id);
  assert.ok(!ids({}).includes('vantruot'));
  assert.ok(!ids({ board: { own: false, on: false } }).includes('vantruot'));
  assert.ok(ids({ board: { own: true, on: false } }).includes('vantruot'));
  assert.ok(!ids({ board: { own: true, on: false }, inHouse: true }).includes('vantruot'));
  assert.equal(dockButtons({ free: true, board: { own: true, on: false } }).find((b) => b.id === 'vantruot').label, 'Lên ván');
  assert.equal(dockButtons({ free: true, board: { own: true, on: true } }).find((b) => b.id === 'vantruot').label, 'Xuống ván');
  assert.ok(!ids({ board: { own: true }, swim: { mode: 'swim' } }).includes('vantruot'));   // đang bơi: chỉ Lặn + Túi đồ
});

test('bagSections: Túi đồ có dòng Ván trượt theo trạng thái', () => {
  const row = (b) => bagSections({ board: b })[4].rows.find((r) => r.ten === BOARD.ten);
  assert.match(row(null).mo, /chưa có/); assert.match(row({ own: true, on: false }).mo, /đã có/); assert.match(row({ own: true, on: true }).mo, /gấp đôi/);
});
