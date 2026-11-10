// Cụm nút góc phải-dưới + túi đồ ngoài nhà (Phiên 62).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dockButtons, pickHint, loadSeen, bagSections, HINTS } from '../js/world/dock.js';

const ids = (c) => dockButtons(c).map((b) => b.id);
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('nút theo hoàn cảnh: người mới có Nhảy mờ + Túi đồ; mở khinh thân có thêm Kỹ năng', () => {
  assert.deepEqual(ids({ free: true }), ['nhay', 'tui'], 'chưa mở Khinh thân: nút Nhảy vẫn hiện (mờ) để người mới biết chỗ'); assert.equal(dockButtons({ free: true })[0].locked, true); assert.equal(dockButtons({ free: true, khinh: 1 })[0].locked, undefined);
  assert.deepEqual(ids({ free: true, khinh: 1 }), ['nhay', 'kynang', 'tui']);
  assert.equal(dockButtons({ free: true, khinh: 1 })[0].big, true, 'không có nước → Nhảy là nút to');
  assert.equal(dockButtons({ free: true, khinh: 2, canTrain: true }).find((b) => b.id === 'kynang').hot, true);
  for (const bad of [undefined, null, 5, 'x', {}]) assert.deepEqual(dockButtons(bad), []);
});
test('đang ngồi/thiền/lạy (free=false) → không nút nào', () => assert.deepEqual(ids({ free: false, khinh: 3, water: true }), []));
test('câu cá: sát nước → Thả cầu / Mua cầu / Sửa cầu; đang câu → chỉ Bấm!; câu được → Thu cá + Phóng sinh', () => {
  const w = (fish) => dockButtons({ free: true, khinh: 1, water: true, fish });
  assert.equal(w({ phase: 'idle', hasOrb: true })[0].label, 'Thả cầu'); assert.equal(w({ phase: 'idle', hasOrb: false })[0].label, 'Mua cầu'); assert.equal(w({ phase: 'idle', hasOrb: true, cracked: true })[0].label, 'Sửa cầu');
  assert.deepEqual(w({ phase: 'idle', hasOrb: true }).map((b) => b.id), ['cast', 'nhay', 'kynang', 'tui']);
  const t = w({ phase: 'wait', text: 'Chờ' }); assert.deepEqual(t.map((b) => b.id), ['tap']); assert.equal(t[0].hot, false); assert.equal(t[0].say, 'Chờ');
  assert.equal(w({ phase: 'lotus' })[0].hot, true);
  assert.deepEqual(w({ phase: 'caught', text: 'Được cá' }).map((b) => b.id), ['thu', 'phong']);
  assert.deepEqual(ids({ free: true, water: false, fish: { phase: 'idle' } }), ['nhay', 'tui'], 'xa nước → không có nút thả cầu');
});
test('lời chỉ chỗ bấm: mỗi nút một lần, đúng thứ tự ưu tiên, Kỹ năng chỉ khi đủ điều kiện', () => {
  const b = dockButtons({ free: true, khinh: 1, water: true, fish: { phase: 'idle', hasOrb: true } });
  assert.equal(pickHint(b, []).id, 'cast'); assert.equal(pickHint(b, ['cast']).id, 'nhay'); assert.equal(pickHint(b, ['cast', 'nhay']).id, 'tui');
  assert.equal(pickHint(b, ['cast', 'nhay', 'tui']), null);
  assert.equal(pickHint(dockButtons({ free: true, khinh: 1, canTrain: true }), ['nhay']).id, 'kynang');
  assert.equal(pickHint(dockButtons({ free: true, khinh: 1 }), ['nhay', 'tui']), null);
  assert.equal(pickHint(dockButtons({ free: true, khinh: 1, water: true, fish: { phase: 'lotus' } }), []).id, 'tap');
  assert.equal(pickHint(null, null), null); for (const id of Object.keys(HINTS)) assert.ok(HINTS[id].length > 8);
});
test('đọc danh sách đã chỉ: rác → [], bỏ id lạ/trùng', () => {
  for (const bad of [null, undefined, 'rác{', '{}', 5]) assert.deepEqual(loadSeen(bad), []);
  assert.deepEqual(loadSeen('["cast","cast","xx",5,"tui"]'), ['cast', 'tui']);
});
test('Túi đồ ngoài nhà: tiền, cầu, ao cá, nội thất, thân pháp & nhà; rỗng thì có lời gợi ý', () => {
  const e = bagSections({}); assert.deepEqual(e.map((s) => s.title), ['Tiền', 'Quả cầu câu cá', 'Ao cá riêng', 'Nội thất', 'Thân pháp & nhà']); assert.ok(e.every((s) => s.rows.length >= 1));
  assert.match(e[1].rows[0].mo, /50 hạt sen/);
  const f = bagSections({ sen: 12, la: 3, fish: { orbs: { go: 0, da: 5 }, sel: 'da', pond: [{ sp: 'koi' }, { sp: 'koi' }, { sp: 'zzz' }] }, furni: { owned: { zzz: 2 }, placed: [] }, khinh: 2, land: { own: { lv: 1 } } });
  assert.deepEqual(f[0].rows.map((r) => r.mo), ['12', '3']); assert.match(f[1].rows[0].mo, /đã nứt/); assert.match(f[1].rows[1].mo, /đang dùng/); assert.deepEqual(f[2].rows, [{ ten: 'Cá koi', mo: '× 2' }]);
  assert.equal(f[3].rows[0].ten, 'Chưa có món nào', 'món lạ bị bỏ'); assert.equal(f[4].rows[0].mo, 'chưa có'); assert.match(f[4].rows[1].mo, /bậc 2\/8/); assert.equal(f[4].rows[2].mo, 'Nhà lầu');
  assert.match(bagSections({ strength: { value: 40, tier: 'Khỏe khoắn', limit: 72 } })[4].rows[0].mo, /40 · Khỏe khoắn · khiêng tối đa 72 kg/);
});
test('nối dây: dock + bag trong hudMenu, câu cá chạy khi bảng đóng, nút cũ ẩn, CSS và sw', () => {
  const h = read('js/ui/hudMenu.js'), f = read('js/ui/fishing.js'), s = read('js/ui/skill.js'), d = read('js/ui/dock.js'), css = read('css/dock.css'), html = read('index.html');
  assert.match(h, /initDock\(hud/); assert.match(h, /initBag\(hud\)/); assert.match(h, /!LGT\.inHouse && LGT\.bag\) \? LGT\.bag\.open\(\)/);
  assert.match(f, /cast: castQuick, tap: pressTap, keep, release, status/); assert.ok(!/raf = 0; if \(!sess \|\| box\.hidden\)/.test(f), 'vòng câu không dừng khi đóng bảng'); assert.ok(!/fs-fab/.test(f));
  assert.match(s, /get canTrain\(\)/); assert.match(css, /body\.has-dock #jump-btn/); assert.match(css, /\.dk\{position:absolute;right:/); assert.match(html, /css\/dock\.css/);
  assert.ok(!/innerHTML/.test(d), 'dock không dùng innerHTML'); assert.match(d, /pointerdown/);
});

test('khiêng: gần vật → nút Khiêng; đang khiêng → chỉ Ném + Đặt xuống', () => {
  assert.deepEqual(ids({ free: true, carry: { near: 'Bao gạo' } }), ['khieng', 'nhay', 'tui']);
  assert.deepEqual(ids({ free: true, khinh: 2, carry: { holding: true, heldName: 'Thùng gỗ' } }), ['nem', 'ha']); assert.equal(dockButtons({ free: true, carry: { holding: true, heldName: 'Thùng gỗ' } })[0].say, 'Đang khiêng: Thùng gỗ');
  assert.deepEqual(ids({ free: false, carry: { holding: true } }), []);
  assert.equal(pickHint(dockButtons({ free: true, carry: { holding: true } }), []).id, 'nem');
  assert.equal(pickHint(dockButtons({ free: true, carry: { near: 'x' } }), ['tui']).id, 'khieng');
});

test('yêu quái: có yêu quái → Ném đá + Thương (+ Ném yêu quái nếu đủ mạnh), bỏ nút thả cầu; hint đúng thứ tự', () => {
  const b = (yq, extra = {}) => dockButtons({ free: true, khinh: 1, water: true, fish: { phase: 'idle', hasOrb: true }, yq, ...extra });
  assert.deepEqual(b({ active: true, ten: 'Yêu Đá', canThrow: false }).map((x) => x.id), ['da', 'thuong', 'nhay']);
  assert.deepEqual(b({ active: true, canThrow: true }).map((x) => x.id), ['da', 'thuong', 'nemyq', 'nhay']);
  assert.equal(b({ active: true, ten: 'Yêu Đá' })[0].say, 'Yêu Đá đang ở làng!'); assert.ok(!b({ active: true }).some((x) => x.id === 'cast'));
  assert.ok(b({ active: false }).some((x) => x.id === 'cast'));
  assert.equal(pickHint(b({ active: true }), []).id, 'da'); assert.equal(pickHint(b({ active: true }), ['da']).id, 'thuong');
  assert.deepEqual(ids({ free: true, carry: { holding: true }, yq: { active: true } }), ['nem', 'ha'], 'đang khiêng vật thì chỉ Ném / Đặt xuống');
  assert.deepEqual(ids({ free: false, yq: { active: true } }), []);
});
test('nối dây: nút yêu quái + tự co lại không đè menu + Nhảy mờ chỉ cách mở', () => {
  const d = read('js/ui/dock.js'), css = read('css/dock.css');
  assert.match(d, /da: \(\) => LGT\.yq && LGT\.yq\.stone\(\)/); assert.match(d, /thuong: \(\) => LGT\.yq && LGT\.yq\.spear\(\)/); assert.match(d, /nemyq: \(\) => LGT\.yq && LGT\.yq\.throwBoss\(\)/);
  assert.match(d, /function fit\(\)/); assert.match(d, /\['wrap', 'small'\]/); assert.match(css, /\.dk\.wrap/); assert.match(css, /\.dk-b\.lock/); assert.match(d, /Khinh thân chưa mở/);
});

test('đang đánh yêu quái: chỉ còn Ném đá/Thương/(Ném yêu quái)/Nhảy; có trạng thái chờ hồi chiêu', () => {
  const b = dockButtons({ free: true, khinh: 2, yq: { active: true, ten: 'Yêu Đá', canThrow: true, stoneCd: 0.8, spearCd: 0 } });
  const ids = b.map((x) => x.id); assert.deepEqual(ids, ['da', 'thuong', 'nemyq', 'nhay']);
  assert.equal(b[0].wait, true); assert.equal(b[1].wait, false);
  const c = dockButtons({ free: true, khinh: 0, yq: { active: true, stoneCd: 0, spearCd: 0 } }).map((x) => x.id);
  assert.deepEqual(c, ['da', 'thuong'], 'chưa mở Khinh thân: không hiện Nhảy mờ khi đang đánh');
});

test('có người chơi khác ở gần → nút Khiêng người (ẩn khi đánh yêu quái/đang khiêng vật); đang khiêng người → chỉ Ném / Thả xuống', () => {
  const ids = (c) => dockButtons({ free: true, khinh: 1, ...c }).map((x) => x.id);
  assert.ok(ids({ ply: { near: 'An' } }).includes('khiengnguoi'));
  assert.ok(!ids({ ply: { near: 'An' } }).includes('nemnguoi'), 'chưa khiêng thì chưa có nút Ném');
  assert.ok(!ids({ ply: { near: '' } }).includes('khiengnguoi'));
  assert.ok(!ids({ ply: { near: 'An' }, yq: { active: true } }).includes('khiengnguoi'));
  assert.ok(!ids({ ply: { near: 'An' }, carry: { holding: true } }).includes('khiengnguoi'));
  const b = dockButtons({ free: true, khinh: 1, ply: { near: 'An' } }); assert.equal(b.find((x) => x.id === 'khiengnguoi').say, 'Gần: An');
  const h = dockButtons({ free: true, khinh: 1, water: true, ply: { near: 'An', holding: true, heldName: 'An', left: 2 } });
  assert.deepEqual(h.map((x) => x.id), ['nemnguoi', 'thanguoi'], 'đang khiêng người: chỉ Ném / Thả xuống');
  assert.equal(h[0].label, 'Ném'); assert.equal(h[0].big, true); assert.match(h[0].say, /Đang khiêng An · tự ném sau 2 giây/);
  assert.equal(dockButtons({ free: false, ply: { holding: true, heldName: 'An', left: 1 } }).length, 0, 'đang ngồi/bị khiêng (free=false): không có nút');
});

test('bơi/lặn: chỉ còn nút Lặn↔Nổi lên + Túi đồ; trên cạn không có', () => {
  assert.deepEqual(ids({ free: true, khinh: 1, water: true, swim: { mode: 'swim' } }), ['lan', 'tui']);
  assert.equal(dockButtons({ free: true, swim: { mode: 'swim' } })[0].label, 'Lặn');
  assert.equal(dockButtons({ free: true, swim: { mode: 'dive', say: 'Hơi thở: 12 giây' } })[0].label, 'Nổi lên');
  assert.ok(!ids({ free: true, khinh: 1, swim: { mode: 'land' } }).includes('lan'));
  assert.deepEqual(ids({ free: false, swim: { mode: 'swim' } }), []);
});
