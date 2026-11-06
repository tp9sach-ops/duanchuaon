// Phiên 31/33: camera không xuyên vật đặc nhưng bay qua phía trên vật thấp (chậu hoa, ghế, lồng gà, tường rào thấp).
import test from 'node:test';
import assert from 'node:assert/strict';
import { clipCamDist } from '../js/world/worldLogic.js';
import { solidAt } from '../js/world/layout.js';
import { PLANTERS, MARKET_DECOR, STREET_FENCES, STALLS } from '../js/world/outside.js';
import '../js/world/placements.js';
import '../js/world/landscape.js';

test('clipCamDist: không gặp vật đặc thì giữ nguyên; gặp thì lùi lại, không dưới minDist', () => {
  const p = { x: 0, y: 0, z: 0 }, wall = (x, z) => z > 3;
  assert.equal(clipCamDist(p, 0, 0, 2, wall), 2);
  const d = clipCamDist(p, 0, 0, 6, wall); assert.ok(d < 3 && d >= 0.9);
  assert.equal(clipCamDist(p, 0, 0, 6, () => true), 6, 'đang đứng trong vật cản thì không cắt');
  assert.equal(clipCamDist(p, 0, 0, 6, (x, z) => z > 0.5), 0.9);
});

test('vật thấp không chắn camera ở độ cao đầu người, vật cao thì có', () => {
  for (const p of [...PLANTERS, ...MARKET_DECOR.cages, ...MARKET_DECOR.chairs, ...MARKET_DECOR.blocks]) { assert.equal(solidAt(p.x, p.z, 1.6), false, `(${p.x},${p.z}) cao 1,6 m bay qua`); assert.equal(solidAt(p.x, p.z, 0.3), true, `(${p.x},${p.z}) sát đất là đặc`); }
  for (const f of STREET_FENCES) { const z = (f.z0 + f.z1) / 2; assert.equal(solidAt(f.x, z, 1.6), false); assert.equal(solidAt(f.x, z, 0.4), true); }
  const s = STALLS[0]; assert.equal(solidAt(s.x, s.z, 1.6), true, 'quầy chợ vẫn đặc ở mọi độ cao');
});
