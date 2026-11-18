import test from 'node:test';
import assert from 'node:assert/strict';
import { makeName, pickLook, parseSlash, isSlash, createWanderer, createVirtual, VP_CFG, CHAT_LINES } from '../js/world/virtualPlayers.js';
import { cleanName, AVATAR_COLORS } from '../js/world/avatarLogic.js';
import { chatOk } from '../js/engines/room.js';

const seeded = (s = 1) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

test('tên: 300 tên không trùng, ≤ 20 ký tự, qua cleanName không đổi, không giống máy', () => {
  const rng = seeded(7), used = new Set(), seen = [];
  for (let i = 0; i < 300; i++) { const n = makeName(rng, used); assert.ok(n.length > 0 && Array.from(n).length <= 20, n); assert.equal(cleanName(n), n); assert.ok(!used.has(n.toLowerCase())); used.add(n.toLowerCase()); seen.push(n); assert.ok(!/\b(bot|npc|virtual|player)\b/i.test(n), n); }
  assert.ok(new Set(seen.map((n) => n.split(' ').length)).size >= 3, 'nhiều kiểu độ dài tên (1, 2, 3 chữ)');
});
test('tên: tránh trùng với tên đã có (kể cả khác hoa thường)', () => {
  const used = new Set(['nguyễn văn nam']); const rng = () => 0;   // rng cố định → lần đầu ra đúng tên bị trùng, phải đổi
  const n = makeName(rng, used); assert.ok(!used.has(n.toLowerCase()));
});
test('dáng: áo nằm trong bảng chọn của người chơi, tóc troc/bui', () => {
  const rng = seeded(3), ids = new Set(AVATAR_COLORS.map((c) => c.id));
  for (let i = 0; i < 50; i++) { const l = pickLook(rng); assert.ok(ids.has(l.color)); assert.ok(l.hair === 'troc' || l.hair === 'bui'); }
});
test('lệnh gạch chéo: nhận ra "/", tin thường trả null, bỏ khoảng trắng, không phân biệt hoa thường', () => {
  assert.equal(parseSlash('xin chào'), null); assert.equal(parseSlash(''), null); assert.equal(parseSlash(null), null);
  assert.deepEqual(parseSlash('/nguoichoiao'), { cmd: 'nguoichoiao', args: [] });
  assert.deepEqual(parseSlash('  /NguoiChoiAo   xoa '), { cmd: 'nguoichoiao', args: ['xoa'] });
  assert.deepEqual(parseSlash('/'), { cmd: '', args: [] });
  assert.ok(isSlash(' /abc')); assert.ok(!isSlash('a/b'));
});
test('tin bắt đầu bằng "/" KHÔNG gửi lên phòng: chatOk trả rỗng; tin thường vẫn qua', () => {
  assert.equal(chatOk('/nguoichoiao'), ''); assert.equal(chatOk('  /abc'), '');
  assert.equal(chatOk('Chào mọi người'), 'Chào mọi người'); assert.equal(chatOk('a/b'), 'a/b');
});
test('lời nói của người ảo hợp lệ qua chatOk (không link/số điện thoại)', () => { for (const l of CHAT_LINES) assert.equal(chatOk(l), l); });
test('quản lý: mỗi lần add thêm đúng 1 người, tên khác nhau, dừng ở mức tối đa, id bắt đầu "ao-"', () => {
  const v = createVirtual({ rng: seeded(11) });
  for (let i = 1; i <= VP_CFG.max; i++) { const p = v.add(); assert.ok(p); assert.equal(v.count, i); assert.ok(p.id.startsWith('ao-')); }
  assert.equal(v.add(), null); assert.equal(v.count, VP_CFG.max);
  assert.equal(new Set(v.list.map((p) => p.name.toLowerCase())).size, VP_CFG.max);
  assert.equal(new Set(v.list.map((p) => p.id)).size, VP_CFG.max);
  v.clear(); assert.equal(v.count, 0);
});
test('quản lý: không đặt trùng tên người thật đang thấy; remove trả lại tên', () => {
  const v = createVirtual({ rng: () => 0 }); const p = v.add(['Zzz']); assert.notEqual(p.name.toLowerCase(), 'zzz');
  assert.ok(v.remove(p.id)); assert.equal(v.count, 0); assert.equal(v.remove('khong-co'), false);
});
test('đi lại: ở trong vùng home, không đi xuyên vật cản, có lúc đứng lúc đi, quay mặt theo hướng đi', () => {
  const home = { x: 0, z: 50, r: 11 }, wall = (x, z) => x > 3 && x < 5 && z > 44 && z < 56;   // một bức tường
  const w = createWanderer({ rng: seeded(5), x: 0, z: 50, home, blocked: wall });
  let walked = 0, idled = 0, lastX = 0, lastZ = 50;
  for (let i = 0; i < 60 * 600; i++) {   // 10 phút giả lập, 60 khung/giây
    const r = w.step(1 / 60);
    assert.ok(Math.hypot(r.x - home.x, r.z - home.z) <= home.r + 0.5, 'ra khỏi vùng ' + r.x + ',' + r.z);
    assert.ok(!wall(r.x, r.z), 'đi xuyên tường');
    assert.ok(Math.hypot(r.x - lastX, r.z - lastZ) <= 2.6 / 60 + 1e-6, 'bước quá dài (dịch chuyển)'); lastX = r.x; lastZ = r.z;
    if (r.state === 'walk') { walked++; assert.ok(r.speed > 0); } else idled++;
  }
  assert.ok(walked > 600 && idled > 600, `đi ${walked}, đứng ${idled}`);
});
test('đi lại: dt lớn (tab ẩn lâu) không làm nhảy xa; lời nói thỉnh thoảng có và hợp lệ', () => {
  const w = createWanderer({ rng: seeded(9), x: 0, z: 50 }); const a = w.step(5); const b = w.step(5);
  assert.ok(Math.hypot(b.x - a.x, b.z - a.z) < 0.5);
  let says = 0; for (let i = 0; i < 60 * 600; i++) { const r = w.step(1 / 60); if (r.say) { says++; assert.equal(chatOk(r.say), r.say); } }
  assert.ok(says >= 3 && says <= 20, 'số câu trong 10 phút: ' + says);
});
