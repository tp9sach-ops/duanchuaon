// Cụm nút góc phải-dưới + túi đồ ngoài nhà (Phiên 62).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dockButtons, pickHint, loadSeen, bagSections, HINTS, dockLayout, cooldownFrac, SLOT_OF, SLOT_POS, SLOT_KEY, SLOT_CODES, A_PRIORITY } from '../js/world/dock.js';

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
  const e = bagSections({}); assert.deepEqual(e.map((s) => s.title), ['Tiền', 'Quả cầu câu cá', 'Ao cá riêng', 'Nội thất', 'Thân pháp & nhà', 'Mảnh chuông Diệu Giang']); assert.ok(e.every((s) => s.rows.length >= 1));
  assert.match(e[1].rows[0].mo, /50 hạt sen/);
  const f = bagSections({ sen: 12, la: 3, fish: { orbs: { go: 0, da: 5 }, sel: 'da', pond: [{ sp: 'koi' }, { sp: 'koi' }, { sp: 'zzz' }] }, furni: { owned: { zzz: 2 }, placed: [] }, khinh: 2, land: { own: { lv: 1 } } });
  assert.deepEqual(f[0].rows.map((r) => r.mo), ['12', '3']); assert.match(f[1].rows[0].mo, /đã nứt/); assert.match(f[1].rows[1].mo, /đang dùng/); assert.deepEqual(f[2].rows.map((r) => [r.ten, r.mo, r.n, r.ic.k]), [['Cá koi', '× 2', 2, 'fish']]);
  assert.equal(f[3].rows[0].ten, 'Chưa có món nào', 'món lạ bị bỏ'); assert.equal(f[4].rows[0].mo, 'chưa có'); assert.match(f[4].rows[1].mo, /bậc 2\/8/); assert.equal(f[4].rows[2].mo, 'Nhà lầu');
  assert.match(bagSections({ strength: { value: 40, tier: 'Khỏe khoắn', limit: 72 } })[4].rows[0].mo, /40 · Khỏe khoắn · khiêng tối đa 72 kg/);
});
test('nối dây: dock + bag trong hudMenu, câu cá chạy khi bảng đóng, nút cũ ẩn, CSS và sw', () => {
  const h = read('js/ui/hudMenu.js'), f = read('js/ui/fishing.js'), s = read('js/ui/skill.js'), d = read('js/ui/dock.js'), css = read('css/dock.css'), html = read('index.html');
  assert.match(h, /initDock\(hud/); assert.match(h, /initBag\(hud\)/); assert.match(h, /!LGT\.inHouse && LGT\.bag\) \? LGT\.bag\.open\(\)/);
  assert.match(f, /cast: castQuick, tap: pressTap, keep, release, status/); assert.ok(!/raf = 0; if \(!sess \|\| box\.hidden\)/.test(f), 'vòng câu không dừng khi đóng bảng'); assert.ok(!/fs-fab/.test(f));
  assert.match(s, /get canTrain\(\)/); assert.match(css, /body\.has-dock #jump-btn/); assert.match(css, /\.dk\{[^}]*position:absolute;right:/); assert.match(html, /css\/dock\.css/);
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
  assert.match(d, /function fit\(\)/); assert.match(d, /classList\.add\('small'\)/); assert.match(css, /\.dk\.small\{/); assert.match(css, /\.dk-b\.lock/); assert.match(d, /Khinh thân chưa mở/);
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

test('quái bãi rừng (Phiên 107): có quái gần → Ném đá + Thương nhưng vẫn giữ Nhảy / Kỹ năng / Túi đồ; yêu quái hằng tháng lấn lướt', () => {
  const base = { free: true, khinh: 1 };
  const ids = (c) => dockButtons({ ...base, ...c }).map((x) => x.id);
  assert.deepEqual(ids({}), ['nhay', 'kynang', 'tui'], 'không có quái: như cũ');
  assert.deepEqual(ids({ farm: { active: false } }), ['nhay', 'kynang', 'tui']);
  assert.deepEqual(ids({ farm: { active: true, ten: 'Dã Mèo Rừng' } }), ['da', 'thuong', 'nhay', 'kynang', 'tui']);
  const b = dockButtons({ ...base, farm: { active: true, ten: 'Dã Mèo Rừng', stoneCd: 0.8, spearCd: 0 } });
  assert.equal(b[0].wait, true); assert.equal(b[1].wait, false); assert.match(b[0].say, /Dã Mèo Rừng/);
  assert.deepEqual(ids({ farm: { active: true }, yq: { active: true, stoneCd: 0, spearCd: 0 } }), ['da', 'thuong', 'nhay'], 'có boss: chỉ một cặp Ném đá / Thương (của boss)');
  assert.deepEqual(ids({ free: false, farm: { active: true } }), [], 'đang ngồi/thiền: không nút nào');
  assert.deepEqual(ids({ carry: { holding: true }, farm: { active: true } }), ['nem', 'ha'], 'đang khiêng vật: chỉ Ném / Đặt xuống');
});

test('Tự Động Hàng Yêu (Phiên 108): nút "Tự động" chỉ hiện khi bật khả năng; đổi thành "Dừng đánh" khi đang chạy; có lời chỉ chỗ bấm', () => {
  const base = { free: true, khinh: 1 }, farm = { active: true, ten: 'Dã Mèo Rừng', canAuto: true, auto: false, autoLeft: 60 };
  assert.deepEqual(ids({ ...base, farm }), ['da', 'thuong', 'tudong', 'nhay', 'kynang', 'tui']);
  const on = dockButtons({ ...base, farm: { ...farm, auto: true, autoLeft: 41 } }).find((b) => b.id === 'tudong'); assert.equal(on.label, 'Dừng đánh'); assert.equal(on.hot, true); assert.match(on.say, /41 phút/);
  assert.ok(HINTS.tudong && HINTS.tudong.length > 20);
  assert.deepEqual(ids({ ...base, farm: { active: true } }), ['da', 'thuong', 'nhay', 'kynang', 'tui'], 'không canAuto: không có nút');
  assert.match(read('js/ui/dock.js'), /tudong: \(\) => LGT\.farm && LGT\.farm\.toggleAuto\(\)/);
});

// ------------------------------------------------------------------ Phiên 109: bố cục ô cố định
// Các hoàn cảnh để thử: duyệt mọi tổ hợp cờ chính (đủ để bắt lỗi trùng ô / nút dời chỗ).
function contexts() {
  const out = [];
  const bools = [false, true];
  for (const khinh of [0, 1, 5]) for (const water of bools) for (const yq of bools) for (const farm of bools) for (const near of bools) for (const hold of ['', 'carry', 'ply']) for (const head of bools) for (const ply of bools) {
    out.push({ free: true, khinh, canTrain: khinh > 0, water, fish: { phase: 'idle', hasOrb: true }, yq: yq ? { active: true, ten: 'Yêu Đá', canThrow: near, stoneCd: 0.5, spearCd: 0 } : { active: false }, farm: farm ? { active: true, ten: 'Heo rừng', canAuto: true, auto: false, autoLeft: 30, stoneCd: 0, spearCd: 0.2 } : { active: false },
      carry: { holding: hold === 'carry', heldName: 'Bình', near: near ? 'Bình' : '' }, ply: { holding: hold === 'ply', near: ply ? 'Lan' : '', heldName: 'Lan', left: 2 }, npc: { near: near ? 'Bác Tư' : '' },
      head: head ? { open: true, wait: false, cd: 0, dist: 6, dmg: 40 } : { open: false }, khi: { cd: 1 }, board: { own: near, on: false }, swim: { mode: 'land' } });
  }
  out.push({ free: true, swim: { mode: 'swim' } }, { free: true, swim: { mode: 'dive' } }, { free: true, fish: { phase: 'wait' } }, { free: true, fish: { phase: 'lotus' } }, { free: true, fish: { phase: 'caught' } });
  return out;
}

test('bố cục: mọi nút dockButtons có ô cố định; không hai nút nào trùng ô trong mọi hoàn cảnh', () => {
  let checked = 0;
  for (const c of contexts()) {
    const list = dockButtons(c), lay = dockLayout(list);
    assert.equal(lay.length, list.length); const cells = new Set();
    for (const L of lay) { assert.ok(L.slot, 'nút ' + L.id + ' phải có ô'); const k = L.r + ',' + L.c; assert.ok(!cells.has(k), `trùng ô ${k} (${L.id}) ở ${JSON.stringify(list.map((b) => b.id))}`); cells.add(k); assert.ok(['big', 'mid', 'small'].includes(L.size)); }
    for (const b of list) assert.ok(SLOT_OF[b.id], 'chưa gán ô cho nút ' + b.id); checked++;
  }
  assert.ok(checked > 500, 'thử đủ nhiều hoàn cảnh: ' + checked);
});
test('bố cục: nút KHÔNG dời chỗ — Nhảy, Túi đồ, Thương, Tự động... luôn ở đúng một ô dù hoàn cảnh nào', () => {
  const seenCell = {};
  for (const c of contexts()) for (const L of dockLayout(dockButtons(c))) {
    if (L.slot.startsWith('X')) continue;   // ô tràn (rất hiếm) không tính
    const k = L.r + ',' + L.c; if (!(L.id in seenCell)) seenCell[L.id] = new Set(); seenCell[L.id].add(k);
  }
  for (const id of ['nhay', 'tui', 'kynang', 'thietdau', 'chemkhi', 'tudong', 'tap', 'thu', 'phong', 'cast', 'lan', 'nem', 'ha', 'nemnguoi', 'thanguoi', 'nemyq', 'da']) assert.ok(seenCell[id], id + ' có xuất hiện');
  // các nút này không bao giờ phải nhường ô: chỉ đúng một ô ở mọi hoàn cảnh
  for (const id of ['nhay', 'tui', 'kynang', 'thietdau', 'chemkhi', 'tudong', 'thuong', 'da', 'tap', 'thu', 'phong', 'nem', 'nemnguoi', 'nemyq', 'lan']) assert.equal(seenCell[id].size, 1, id + ' luôn ở đúng một ô (không bao giờ phải nhường ô)');
});
test('bố cục: ô A là hành động chính ở góc dưới-phải; Nhảy ngay phía trên; nút nhỏ ở hàng trên cùng', () => {
  assert.deepEqual(SLOT_POS.A, { r: 1, c: 3 }); assert.deepEqual(SLOT_POS.C, { r: 2, c: 3 });
  const lay = (c) => Object.fromEntries(dockLayout(dockButtons(c)).map((L) => [L.id, L]));
  const L = lay({ free: true, khinh: 3, canTrain: true, farm: { active: true, ten: 'Heo', canAuto: true, autoLeft: 60 }, head: { open: true } });
  assert.equal(L.da.slot, 'A'); assert.equal(L.da.size, 'big'); assert.equal(L.thuong.slot, 'B'); assert.equal(L.nhay.slot, 'C'); assert.equal(L.thietdau.slot, 'D'); assert.equal(L.tudong.slot, 'F');
  assert.equal(L.tui.size, 'small'); assert.equal(L.kynang.size, 'small'); assert.equal(L.tui.r, 3);
  // người mới (chưa có quái): Nhảy mờ vẫn đúng ô C, không bị kéo xuống đáy
  assert.equal(lay({ free: true }).nhay.slot, 'C'); assert.equal(lay({ free: true }).nhay.r, 2);
});
test('bố cục: hai nút tranh ô A → chiến đấu/câu cá thắng nhặt đồ; nút thua vào ô trống, không mất', () => {
  const lay = dockLayout([{ id: 'khieng' }, { id: 'da' }, { id: 'nhay' }]);
  const by = Object.fromEntries(lay.map((L) => [L.id, L])); assert.equal(by.da.slot, 'A'); assert.notEqual(by.khieng.slot, 'A'); assert.notEqual(by.khieng.slot, by.nhay.slot); assert.equal(by.khieng.slot, 'B', 'ô trống đầu tiên theo thứ tự dự phòng');
  assert.equal(dockLayout([{ id: 'khieng' }, { id: 'tap' }]).find((L) => L.id === 'tap').slot, 'A');
  assert.ok(A_PRIORITY.indexOf('da') < A_PRIORITY.indexOf('khieng'));
  // nút lạ không làm sập, vẫn được ô trống; đầu vào hỏng → mảng rỗng
  assert.ok(dockLayout([{ id: 'la-hoac' }])[0].slot); for (const bad of [undefined, null, 5, 'x', {}, [null, 7]]) assert.deepEqual(dockLayout(bad), []);
});
test('hồi chiêu: vòng quay 0..1 theo thời gian còn lại; ngữ cảnh hỏng → 0', () => {
  assert.equal(cooldownFrac('da', { yq: { active: true, stoneCd: 0 } }), 0);
  assert.ok(Math.abs(cooldownFrac('da', { yq: { active: true, stoneCd: 0.7 } }) - 0.5) < 1e-9, 'STONE.cd = 1.4 s');
  assert.ok(Math.abs(cooldownFrac('da', { farm: { active: true, stoneCd: 1.4 } }) - 1) < 1e-9, 'quái bãi rừng cũng có vòng');
  assert.ok(Math.abs(cooldownFrac('thuong', { yq: { active: true, spearCd: 0.35 } }) - 0.5) < 1e-9);
  assert.ok(Math.abs(cooldownFrac('chemkhi', { khi: { cd: 1.5 } }) - 0.5) < 1e-9, 'Chém khí hồi 3 s'); assert.ok(Math.abs(cooldownFrac('thietdau', { head: { cd: 2.5 } }) - 0.5) < 1e-9, 'Thiết đầu công hồi 5 s');
  assert.equal(cooldownFrac('thietdau', { head: { cd: 99 } }), 1, 'không vượt 1'); assert.equal(cooldownFrac('nhay', { yq: { stoneCd: 1 } }), 0);
  for (const bad of [undefined, null, 5, 'x']) assert.equal(cooldownFrac('da', bad), 0); assert.equal(cooldownFrac('da', { farm: { stoneCd: 'abc' } }), 0);
});
test('phím tắt: 1–5 và B trỏ đúng ô, không đụng WASD/Space/M/Shift/Esc', () => {
  assert.deepEqual(Object.keys(SLOT_CODES).sort(), ['A', 'B', 'D', 'E', 'F', 'T3']);
  const all = Object.values(SLOT_CODES).flat(); for (const bad of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyM', 'ShiftLeft', 'Escape']) assert.ok(!all.includes(bad), bad);
  assert.equal(SLOT_KEY.A, '1'); assert.equal(SLOT_KEY.C, 'Space'); assert.equal(new Set(all).size, all.length, 'không phím nào gán hai ô');
});
test('nối dây Phiên 109: dock dùng ô cố định + phím tắt + vòng hồi chiêu; CSS có lưới, vòng quay, bong bóng gộp', () => {
  const d = read('js/ui/dock.js'), css = read('css/dock.css');
  assert.match(d, /dockLayout\(list\)/); assert.match(d, /cooldownFrac\(L\.id, c\)/); assert.match(d, /SLOT_CODES/); assert.match(d, /gridRow/); assert.ok(!/innerHTML/.test(d));
  assert.match(css, /\.dk-grid\{display:grid/); assert.match(css, /conic-gradient/); assert.match(css, /\.dk-tips\{/); assert.match(css, /\.dk\.kb \.dk-key/);
  for (const id of ['thuong', 'chemkhi', 'thietdau']) assert.match(d, new RegExp("'" + id + "'"), id + ' phải nằm trong FAST (bấm xuống là chạy)');
});
