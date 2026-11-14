// Test khu luyện chiêu (Phiên 150, mục 1). Chạy: node --test tests/luyenchieu.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COMBAT_SKILLS, PHAP_MON } from '../js/data/combatSkills.js';
import { HE_LIST } from '../js/data/elements.js';
import { DUNGEON_IDS } from '../js/data/dungeons.js';
import { arenaOf } from '../js/world/zoneDungeon.js';
import { ARENA } from '../js/world/duel.js';
import { THU_DEF } from '../js/world/zoneThu.js';
import { LUYEN_ID, LUYEN_ARENA, LUYEN_DUMMIES, LUYEN_SPAWN, inLuyen, returnSpawnName, returnSpawnOf, registerLuyen } from '../js/world/zoneLuyen.js';
import { listForHe, describeSkill, createDemoRuntime, DEMO_CD_MAX, DEMO_BASE_DMG } from '../js/world/luyenChieu.js';
import { createZoneRuntime } from '../js/world/zoneRuntime.js';
import { inHall } from '../js/world/seats.js';

const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
const BAD = /(độc|giết|sát (thủ|nhân)|ám sát|truy hồn|tiêu diệt)/i;

test('tên chiêu thức, môn phái, vai trò: không có chữ độc / giết / ám sát', () => {
  for (const s of COMBAT_SKILLS) assert.ok(!BAD.test(s.ten), `chiêu: ${s.ten}`);
  for (const p of PHAP_MON) { assert.ok(!BAD.test(p.ten), `môn: ${p.ten}`); assert.ok(!BAD.test(p.vaiTro || ''), `vai trò: ${p.vaiTro}`); }
  for (const s of COMBAT_SKILLS) for (const it of listForHe(s.he)) assert.ok(!BAD.test(describeSkill(it.skill)), describeSkill(it.skill));
  assert.ok(!/\bsát\b/i.test(COMBAT_SKILLS.map((s) => s.ten).join('|')), 'tên chiêu không chứa "Sát"');
});

test('mỗi Hệ có 6 chiêu để thử: ô 1, 2, 3, hai Pháp Môn ô 4, tuyệt học; hồi chiêu tập ngắn', () => {
  for (const he of HE_LIST) {
    const a = listForHe(he); assert.equal(a.length, 6, he);
    assert.deepEqual(a.map((x) => x.label.split(' · ')[0]), ['Chiêu 1', 'Chiêu 2', 'Chiêu 3', 'Chiêu 4', 'Chiêu 4', 'Tuyệt học'], he);
    assert.equal(new Set(a.map((x) => x.skill.id)).size, 6);
    for (const it of a) assert.ok(it.demoCd >= 0.5 && it.demoCd <= DEMO_CD_MAX, `${it.skill.id} ${it.demoCd}`);
  }
  assert.deepEqual(listForHe('khong-co'), []);
});

test('mô tả chiêu: có số mẫu cho chiêu đánh, chiêu hỗ trợ có tên hiệu ứng', () => {
  const a = listForHe('hoa');
  assert.ok(describeSkill(a[0].skill).startsWith(`Gây ${Math.round(DEMO_BASE_DMG * a[0].skill.heSo)}`));
  assert.ok(a[1].support && /chí mạng/i.test(describeSkill(a[1].skill)));
  assert.equal(describeSkill(null), '');
  for (const he of HE_LIST) for (const it of listForHe(he)) assert.ok(describeSkill(it.skill).length > 0);
});

test('bộ hồi chiêu tập: dùng được, hồi đúng giờ, reset', () => {
  const rt = createDemoRuntime(), it = listForHe('kim')[0];
  const r1 = rt.cast(it, 10); assert.ok(r1.ok); assert.equal(r1.dmg, Math.round(DEMO_BASE_DMG * it.skill.heSo));
  const r2 = rt.cast(it, 10.5); assert.equal(r2.ok, false); assert.equal(r2.reason, 'hoi-chieu'); assert.ok(r2.left > 0 && r2.left <= DEMO_CD_MAX);
  assert.ok(rt.left(it, 10.5) > 0);
  assert.ok(rt.cast(it, 10 + it.demoCd + 0.01).ok);
  rt.reset(); assert.ok(rt.cast(it, 0).ok);
  assert.equal(rt.cast(null, 0).ok, false);
  const sup = listForHe('thuy')[1]; assert.equal(rt.cast(sup, 0).dmg, 0);
});

test('zone luyện chiêu: không chồng zone khác, mộc nhân và điểm xuất hiện nằm trong sàn', () => {
  const b = LUYEN_ARENA.bounds;
  assert.ok(!overlap(b, ARENA.bounds) && !overlap(b, THU_DEF.bounds));
  for (const id of DUNGEON_IDS) assert.ok(!overlap(b, arenaOf(id).bounds), id);
  assert.ok(b.x0 > 600, 'xa hub');
  assert.ok(inLuyen(LUYEN_SPAWN.x, LUYEN_SPAWN.z));
  for (const d of LUYEN_DUMMIES) { assert.ok(inLuyen(d.x, d.z), d.id); assert.ok(d.z < LUYEN_ARENA.cz, 'nửa bắc'); assert.ok(Math.hypot(d.x - LUYEN_SPAWN.x, d.z - LUYEN_SPAWN.z) > 8); }
});

test('đăng ký zone: hợp lệ, tạm thời, không lưu làm zone cuối, có đường về cho từng Hệ', () => {
  const store = new Map(); const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  const rt = createZoneRuntime({ storage }); const m = rt.manager;
  const z = registerLuyen(m); assert.equal(z.id, LUYEN_ID); assert.ok(z.temp && z.viaNpc);
  assert.equal(registerLuyen(m), z, 'gọi lại không đăng ký trùng');
  assert.deepEqual(m.validate(), []);
  const hub = m.get('chua'); assert.ok(hub.spawns['tu-luyen']);
  for (const he of HE_LIST) { const sp = hub.spawns[returnSpawnName(he)]; assert.ok(sp, he); assert.deepEqual({ x: sp.x, z: sp.z }, { x: returnSpawnOf(he).x, z: returnSpawnOf(he).z }); assert.ok(inHall(sp), `${he} đứng trong chánh điện`); }
  assert.equal(returnSpawnOf('khong'), null);
});

test('đi sang khu luyện chiêu và về: ZoneManager chuyển đúng, tải lại trang thì về chùa', async () => {
  const store = new Map(); const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  const rt = createZoneRuntime({ storage }); const m = rt.manager; registerLuyen(m);
  let loaded = 0, disposed = 0; const d = m.get(LUYEN_ID); d.load = () => { loaded++; }; d.dispose = () => { disposed++; };
  const go = await m.travel(LUYEN_ID, { spawn: 'default' }); assert.ok(go.ok); assert.equal(m.current, LUYEN_ID); assert.equal(loaded, 1);
  assert.equal(m.restore(m.serialize({ x: 0, z: 0 })).zone, 'chua', 'zone tạm không được lưu làm zone cuối');
  const back = await m.travel('chua', { spawn: returnSpawnName('hoa') }); assert.ok(back.ok); assert.equal(m.current, 'chua'); assert.equal(disposed, 1);
  assert.equal(back.spawn.x, 3.6);
});

test('nối giao diện: main.js nạp khu luyện chiêu; bảng bồ đoàn có nút Luyện tập chiêu và cho ngồi dưới cấp 10', () => {
  assert.match(readFileSync(new URL('../js/main.js', import.meta.url), 'utf8'), /luyenChieu\.js'\)\.then\(\(m\) => m\.initLuyenChieu/);
  const kn = readFileSync(new URL('../js/ui/khaiNgo.js', import.meta.url), 'utf8');
  assert.match(kn, /Luyện tập chiêu/); assert.match(kn, /LGT\.luyenChieu\.enter/); assert.match(kn, /showPreview\(h, tuvi\)/);
  assert.match(readFileSync(new URL('../js/world/zoneRuntime.js', import.meta.url), 'utf8'), /registerLuyen\(rt\.manager\)/);
});
