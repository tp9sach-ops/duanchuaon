// Phiên 232 (mục 1): hình dáng đủ mọi loại quái + kiểu đòn có hướng (quạt / lao thẳng / đập tròn), khóa hướng lúc gồng, luân phiên kiểu đòn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MONSTERS } from '../js/data/monsters.js';
import { ATTACK_CFG as A, PATTERNS, MON_PATTERNS } from '../js/data/monsterAI.js';
import { provoke, stepMonster, zoneOf, inZone, patternIds } from '../js/world/monsterAttack.js';

const mk = (o = {}) => ({ id: 1, type: 'dameo', he: 'moc', elite: false, zone: 'biaRungThong', x: -62, z: 60, oan: 66, max: 66, ...o });
const ctx = { thu: 5, max: 1000 };

test('dữ liệu: mọi loại quái đều có 2 kiểu đòn hợp lệ; kiểu đòn có đủ số liệu', () => {
  for (const id of Object.keys(MONSTERS)) { const l = MON_PATTERNS[id]; assert.ok(l && l.length === 2, id); for (const p of l) assert.ok(PATTERNS[p], `${id}:${p}`); }
  for (const p of Object.values(PATTERNS)) { assert.ok(['non', 'duong', 'tron'].includes(p.kieu) && p.k > 0); if (p.kieu === 'non') assert.ok(p.goc > 0 && p.goc < 360); if (p.kieu === 'duong') assert.ok(p.rong > 0 && p.lao > 0); }
  assert.deepEqual(patternIds('khong-co'), ['vuot', 'nen']); assert.ok(Object.isFrozen(PATTERNS) && Object.isFrozen(MON_PATTERNS));
});

test('inZone: quạt chỉ trúng phía trước; đường chỉ trúng trong dải hẹp; vòng tròn trúng mọi hướng', () => {
  const m = { x: 0, z: 0, ry: 0 };   // nhìn về +z
  const non = { kieu: 'non', goc: 90, dai: 3 }, duong = { kieu: 'duong', rong: 1.6, dai: 5 }, tron = { kieu: 'tron', dai: 3 };
  assert.equal(inZone(non, m, 0, 2), true); assert.equal(inZone(non, m, 1.5, 1.5), true); assert.equal(inZone(non, m, 2, 0.2), false, 'bên hông ngoài góc');
  assert.equal(inZone(non, m, 0, -2), false, 'sau lưng'); assert.equal(inZone(non, m, 0, 4), false, 'quá tầm');
  assert.equal(inZone(duong, m, 0, 4.5), true); assert.equal(inZone(duong, m, 0.7, 3), true); assert.equal(inZone(duong, m, 2, 3), false, 'lệch ngang'); assert.equal(inZone(duong, m, 0, 6), false); assert.equal(inZone(duong, m, 0, -2), false);
  for (const [x, z] of [[0, 2.5], [0, -2.5], [2.5, 0], [-2.5, 0]]) assert.equal(inZone(tron, m, x, z), true); assert.equal(inZone(tron, m, 0, 4), false);
  const r = { x: 0, z: 0, ry: Math.PI / 2 }; assert.equal(inZone(non, r, 2, 0), true, 'nhìn +x thì quạt hướng +x'); assert.equal(inZone(non, r, 0, 2), false);
});

test('zoneOf: tầm theo cấp quái × k; giậm đất của boss luôn là vòng tròn; quái chưa chọn kiểu dùng kiểu đầu của loại', () => {
  const reach = A.reach.normal * A.missSlack;
  const z1 = zoneOf(mk({ pat: 'chem' })); assert.equal(z1.kieu, 'non'); assert.ok(Math.abs(z1.dai - reach * PATTERNS.chem.k) < 1e-9);
  assert.equal(zoneOf(mk()).id, 'lao', 'dameo chưa chọn → kiểu đầu = lao');
  const b = zoneOf(mk({ type: 'laomoc', boss: true, slam: true })); assert.equal(b.kieu, 'tron'); assert.ok(b.dai > reach * 2);
  assert.equal(zoneOf(null).kieu, 'tron');
  assert.ok(zoneOf(mk({ type: 'reutinh', elite: true, pat: 'vuot' })).dai > zoneOf(mk({ pat: 'vuot' })).dai, 'tinh anh tầm xa hơn');
});

test('hướng đánh bị KHÓA lúc gồng: người chơi chạy vòng ra sau lưng quái trong lúc gồng thì né được vùng quạt', () => {
  const m = mk({ type: 'daotac' }); provoke(m); const p = { x: -60.8, z: 60 };   // đứng trước mặt (+x), cách 1,2 m
  let e = null; for (let i = 0; i < 4 && !(e && e.k === 'windup'); i++) e = stepMonster(m, 0.05, p, ctx);
  assert.equal(e.k, 'windup'); assert.equal(m.pat, 'chem'); const ry0 = m.ry; assert.ok(Math.abs(ry0 - Math.PI / 2) < 0.01);
  p.x = -63.2; p.z = 60.3;                                                       // vòng ra sau lưng quái (nó khóa nhìn +x)
  let last = null; for (let i = 0; i < 20 && !last; i++) last = stepMonster(m, 0.05, p, ctx);
  assert.deepEqual(last, { k: 'miss' }); assert.equal(m.ry, ry0, 'không xoay theo người chơi khi đang gồng'); assert.ok(m.strikeT > 0.4, 'có thời gian vung đòn cho cảnh vẽ');
});

test('đứng đúng hướng thì trúng; đòn LAO trúng xa hơn đòn vuốt cùng loại nhưng hẹp ngang', () => {
  const m = mk(); provoke(m); m.atkN = 0; const p = { x: -62 + 1.9, z: 60 }; let ev = null; for (let i = 0; i < 40 && !(ev && ev.k === 'strike'); i++) { const e = stepMonster(m, 0.05, p, ctx); if (e) ev = e; }
  assert.equal(ev.k, 'strike', 'đứng ngay trước mặt khi lao → trúng');
  const lao = zoneOf(mk({ pat: 'lao' })), vuot = zoneOf(mk({ pat: 'vuot' })); assert.ok(lao.dai > vuot.dai);
  const m2 = mk({ pat: 'lao', ry: 0 }), X = m2.x, Z = m2.z; assert.equal(inZone(lao, m2, X, Z + lao.dai - 0.1), true); assert.equal(inZone(vuot, m2, X, Z + lao.dai - 0.1), false); assert.equal(inZone(lao, m2, X + 1.8, Z + 2), false);
});

test('luân phiên kiểu đòn: đòn 1 = kiểu [0], đòn 2 = kiểu [1], đòn 3 lại [0]; boss đòn 3 là giậm đất', () => {
  const m = mk({ type: 'daotac' }); provoke(m); const seen = [];
  for (let t = 0; t < 30 && seen.length < 4; t += 0.05) { const e = stepMonster(m, 0.05, { x: -61, z: 60 }, ctx); if (e && e.k === 'windup') seen.push(m.pat); }
  assert.deepEqual(seen, ['chem', 'vuot', 'chem', 'vuot']);
  const b = mk({ type: 'laomoc', boss: true, he: 'moc' }); provoke(b); const s2 = [];
  for (let t = 0; t < 40 && s2.length < 3; t += 0.05) { const e = stepMonster(b, 0.05, { x: -60, z: 60 }, ctx); if (e && e.k === 'windup') s2.push(e.slam ? 'slam' : b.pat); }
  assert.deepEqual(s2, ['vuot', 'nen', 'slam']);
});

test('mô hình 3D: đủ mọi loại quái có hình riêng, hoạt ảnh mọi trạng thái không lỗi/NaN, cảnh vẽ chạy được (three giả có trạng thái)', () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sim');
  const r = JSON.parse(execFileSync(process.execPath, ['--import', './reg-mini.mjs', 'monstermodels-sim.mjs'], { cwd: dir, encoding: 'utf8', timeout: 60000 }).trim().split('\n').pop());
  assert.deepEqual(r.missing, [], 'loại quái chưa có hình'); assert.deepEqual(r.extra, []); assert.equal(r.fallback, true); assert.deepEqual(r.bad, []);
  for (const [id, n] of Object.entries(r.meshes)) assert.ok(n >= 10, `${id} quá đơn sơ (${n} khối)`);
  for (const [id, h] of Object.entries(r.heights)) assert.ok(h > 0.5 && h < 10, id);
  assert.ok(r.heights.thumau > r.heights.cotmoc && r.heights.kimvuong > r.heights.kimgiap && r.heights.solinh > r.heights.nhamcu, 'boss/tinh anh to hơn quái thường cùng nhóm');
  assert.ok(r.farmSlots > 16);
});

test('nối dây: cảnh vẽ dùng mô hình mới + vùng báo đòn đúng hình; stepMonster dùng inZone', () => {
  const rd = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8'), sc = rd('js/scene/farm.js'), at = rd('js/world/monsterAttack.js');
  assert.match(sc, /buildMonster\(m\.type\)/); assert.match(sc, /zoneOf\(m\)/); assert.match(sc, /s\.dgrp\.rotation\.y = m\.ry/); assert.ok(!/buildType/.test(sc));
  assert.match(at, /inZone\(zoneOf\(m\), m, px, pz\)/); assert.match(at, /!\(m\.wind > 0\)/);
});
