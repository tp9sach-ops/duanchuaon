import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ORBS, SPECIES, FISH_WATERS, speciesById, POND_MAX, T_SHADOW, orbById, repairCost, nearWater, waterById, emptyFish, loadFish, buyOrb, selectOrb, repairOrb, currentOrb,
  rareChance, bigChance, rollCatch, startCast, tick, tap, keepFish, noteCaught, releaseSen, releaseFish, releaseCaught, fishLabel, pondSummary,
} from '../js/world/fishing.js';
import { emptyLeaf, claimAct, ACT_CAP } from '../js/world/merit.js';
import { KOI } from '../js/world/landscape.js';
import { THAC } from '../js/world/outside.js';
import { POND } from '../js/world/layout.js';

const rngSeed = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const run = (s, secs, dt = 0.05) => { for (let t = 0; t < secs; t += dt) s = tick(s, dt); return s; };
const owned = (id = 'go', la = 1e6) => buyOrb(emptyFish(), la, id).state;

test('luật ptg: 5 loại quả cầu, giá 30 → 1000 lá, càng đắt càng bền/may/dễ bấm; cửa sổ hoa sen loại đầu = 0,5 giây', () => {
  assert.equal(ORBS.length, 5); assert.equal(ORBS[0].gia, 30); assert.equal(ORBS[4].gia, 1000); assert.equal(ORBS[0].cua, 0.5); assert.equal(T_SHADOW, 4);
  for (let i = 1; i < ORBS.length; i++) for (const k of ['gia', 'ben', 'may', 'cua']) assert.ok(ORBS[i][k] > ORBS[i - 1][k], `${ORBS[i].id}.${k}`);
  assert.equal(new Set(ORBS.map((o) => o.id)).size, 5); assert.equal(new Set(SPECIES.map((s) => s.id)).size, SPECIES.length);
  assert.deepEqual(ORBS.map(repairCost), [6, 20, 50, 120, 200]);
});

test('ao cá riêng gồm cá, rùa, ba ba, mực; có cả loài thường và hiếm', () => {
  for (const loai of ['ca', 'rua', 'baba', 'muc']) { assert.ok(SPECIES.some((s) => s.loai === loai && !s.hiem), loai + ' thường'); assert.ok(SPECIES.some((s) => s.loai === loai && s.hiem), loai + ' hiếm'); }
});

test('nước câu: hồ cá, ao sen, hồ thác; đứng gần mép (≤3,2 m) mới quăng được', () => {
  assert.deepEqual(FISH_WATERS.map((w) => w.id), ['hoca', 'aosen', 'hothac']);
  assert.equal(nearWater(KOI.x, KOI.z).id, 'hoca'); assert.equal(nearWater(POND.x, POND.z + POND.r + 1).id, 'aosen'); assert.equal(nearWater(THAC.pool.x - THAC.pool.r - 2, THAC.pool.z).id, 'hothac');
  assert.equal(nearWater(KOI.x + KOI.r + 3.1, KOI.z).id, 'hoca'); assert.equal(nearWater(KOI.x + KOI.r + 3.5, KOI.z), null); assert.equal(nearWater(0, 200), null);
  assert.equal(waterById('xxx'), null);
});

test('mua cầu: đủ lá thì có, thiếu/đã có/lạ thì giữ nguyên; cầu đầu tiên tự chọn; không sửa bản cũ', () => {
  const s0 = emptyFish(), a = buyOrb(s0, 30, 'go');
  assert.equal(a.ok, true); assert.equal(a.cost, 30); assert.equal(a.state.sel, 'go'); assert.equal(a.state.orbs.go, 20); assert.equal(s0.sel, null); assert.deepEqual(s0.orbs, {});
  const poor = buyOrb(s0, 29, 'go'); assert.equal(poor.ok, false); assert.equal(poor.reason, 'poor'); assert.equal(poor.state, s0);
  const dup = buyOrb(a.state, 1e6, 'go'); assert.equal(dup.reason, 'owned'); assert.equal(dup.state, a.state);
  assert.equal(buyOrb(s0, 1e6, 'xyz').reason, 'unknown');
  const b = buyOrb(a.state, 100, 'da'); assert.equal(b.ok, true); assert.equal(b.state.sel, 'go', 'cầu thứ hai không tự đổi cầu đang dùng');
  assert.equal(selectOrb(b.state, 'da').state.sel, 'da'); assert.equal(selectOrb(b.state, 'kim').ok, false);
  for (const bad of [NaN, -5, 'abc', null, undefined]) assert.equal(buyOrb(s0, bad, 'go').reason, 'poor');
});

test('quăng: trừ 1 độ bền mỗi lần, không giới hạn mỗi ngày; chưa có cầu / sai nước / cầu nứt thì không quăng được', () => {
  assert.equal(startCast(emptyFish(), 'hoca').reason, 'noorb'); assert.equal(startCast(owned(), 'bien').reason, 'nowater');
  let s = owned('go'); const r = rngSeed(7);
  for (let i = 0; i < 20; i++) { const c = startCast(s, 'hoca', r); assert.equal(c.ok, true, 'lần ' + i); s = c.state; }
  assert.equal(s.orbs.go, 0); assert.equal(s.stat.cast, 20); assert.equal(currentOrb(s).cracked, true);
  const c = startCast(s, 'hoca', r); assert.equal(c.ok, false); assert.equal(c.reason, 'cracked'); assert.equal(c.state, s);
  assert.equal(ORBS[0].ben, 20, 'không có trần ngày: chỉ có độ bền cầu');
});

test('sửa cầu nứt: tốn lá (1/5 giá), chỉ khi nứt, đủ lá mới sửa; sửa xong quăng lại được', () => {
  let s = owned('go'); s = { ...s, orbs: { go: 0 } };
  assert.equal(repairOrb(s, 5, 'go').reason, 'poor'); const r = repairOrb(s, 6, 'go'); assert.equal(r.ok, true); assert.equal(r.cost, 6); assert.equal(r.state.orbs.go, 20); assert.equal(s.orbs.go, 0);
  assert.equal(repairOrb(r.state, 99, 'go').reason, 'intact'); assert.equal(repairOrb(s, 99, 'da').reason, 'notowned'); assert.equal(repairOrb(s, 99, 'q').reason, 'unknown');
  assert.equal(startCast(r.state, 'aosen', rngSeed(1)).ok, true);
});

test('nhịp câu: 4 giây bóng cá → rỉa → cắn → hoa sen đúng cửa sổ → hết thì cá thoát', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const c = startCast(owned('go'), 'hoca', rngSeed(seed)), s = c.sess;
    assert.equal(s.tShadow, 4); assert.ok(s.nibbles.length >= 1 && s.nibbles.length <= 3); assert.ok(s.nibbles[0] >= 4.8 && s.nibbles[0] <= 5.8, 'rỉa đầu sau bóng cá');
    for (let i = 1; i < s.nibbles.length; i++) assert.ok(s.nibbles[i] > s.nibbles[i - 1]);
    assert.ok(s.tBite > s.nibbles[s.nibbles.length - 1]); assert.ok(Math.abs(s.tEnd - s.tBite - 0.5) < 1e-9, 'cửa sổ hoa sen 0,5 giây');
    assert.equal(s.phase, 'wait'); assert.equal(tick(s, 0.1).phase, 'wait');
    const seq = []; let x = s; for (let t = 0; t < 12 && !x.over; t += 0.05) { x = tick(x, 0.05); if (seq[seq.length - 1] !== x.phase) seq.push(x.phase); }
    assert.deepEqual(seq, ['wait', 'shadow', 'nibble', 'lotus', 'over'], 'seed ' + seed); assert.equal(x.outcome, 'late');
  }
});

test('bấm: đúng lúc hoa sen → thu được cá; sớm → cá giật mình; kết thúc rồi bấm không đổi; khung lag không nuốt cửa sổ', () => {
  const c = startCast(owned('go'), 'hoca', rngSeed(3)), s0 = c.sess;
  const early = tap(run(s0, 2)); assert.equal(early.outcome, 'early'); assert.equal(early.over, true); assert.equal(tap(early), early); assert.equal(tick(early, 1), early);
  let s = s0; while (s.phase !== 'lotus') s = tick(s, 0.05); const got = tap(s);
  assert.equal(got.outcome, 'got'); assert.deepEqual(got.fish, s0.fish); assert.ok(SPECIES.some((x) => x.id === got.fish.sp));
  assert.equal(tap(got), got);
  let l = s0; while (l.t < l.tBite - 0.3) l = tick(l, 0.2); const before = l.t; l = tick(l, 10); assert.ok(l.t - before <= 0.25 + 1e-9, 'một khung lag chỉ chạy tối đa 0,25 giây');
  assert.equal(tick(s0, NaN).t, 0); assert.equal(tick(s0, -5).t, 0); assert.equal(tick(null, 1), null); assert.equal(tap(null), null);
  assert.equal(s0.t, 0, 'không sửa đầu vào');
});

test('cầu tốt hơn → cửa sổ dài hơn và dễ gặp loài hiếm/cỡ lớn hơn (đo bằng 4000 lần bốc)', () => {
  const wins = ORBS.map((o) => { const s = startCast(owned(o.id), 'hoca', rngSeed(5)).sess; return +(s.tEnd - s.tBite).toFixed(6); });
  assert.deepEqual(wins, [0.5, 0.6, 0.7, 0.8, 0.9]);
  const share = (orb, key) => { const r = rngSeed(99); let n = 0; for (let i = 0; i < 4000; i++) { const f = rollCatch(orb, r); if (key === 'hiem' ? speciesById(f.sp).hiem : f.lon) n++; } return n / 4000; };
  const h = ORBS.map((o) => share(o, 'hiem')); for (let i = 1; i < h.length; i++) assert.ok(h[i] > h[i - 1], 'hiếm tăng theo cầu ' + i);
  assert.ok(Math.abs(h[0] - rareChance(ORBS[0])) < 0.03); assert.ok(Math.abs(h[4] - rareChance(ORBS[4])) < 0.03);
  assert.ok(rareChance(ORBS[0]) < 0.25 && rareChance(ORBS[4]) > 0.4 && rareChance(ORBS[4]) < 0.8);
  assert.ok(share(ORBS[4], 'lon') > share(ORBS[0], 'lon')); assert.ok(bigChance(ORBS[4]) <= 0.6 && bigChance(ORBS[0]) === 0.25);
  const seen = new Set(); const r = rngSeed(11); for (let i = 0; i < 6000; i++) seen.add(rollCatch(ORBS[4], r).sp); assert.equal(seen.size, SPECIES.length, 'loài nào cũng có thể gặp');
});

test('thu cá vào ao riêng: có uid riêng, tối đa 30 con, đầy thì báo; thống kê đúng', () => {
  let s = emptyFish(); const r = rngSeed(2);
  for (let i = 1; i <= POND_MAX; i++) { const k = keepFish(s, rollCatch(ORBS[0], r)); assert.equal(k.ok, true); assert.equal(k.uid, i); s = k.state; }
  assert.equal(s.pond.length, 30); assert.equal(s.stat.got, 30);
  const full = keepFish(s, { sp: 'chep', lon: false }); assert.equal(full.ok, false); assert.equal(full.reason, 'full'); assert.equal(full.state, s); assert.equal(pondSummary(s).full, true);
  assert.equal(keepFish(emptyFish(), { sp: 'khongco' }).reason, 'unknown'); assert.equal(keepFish(emptyFish(), null).reason, 'unknown');
  assert.equal(noteCaught(emptyFish()).stat.got, 1);
});

test('phóng sinh: thưởng 1 (+1 hiếm, +1 lớn) hạt sen; thả đúng con theo uid; uid lạ không làm gì; thống kê thả', () => {
  assert.equal(releaseSen({ sp: 'chep', lon: false }), 1); assert.equal(releaseSen({ sp: 'chep', lon: true }), 2); assert.equal(releaseSen({ sp: 'koi', lon: false }), 2); assert.equal(releaseSen({ sp: 'koi', lon: true }), 3);
  assert.equal(releaseSen({ sp: 'xxx' }), 0); assert.equal(releaseSen(null), 0);
  let s = keepFish(emptyFish(), { sp: 'koi', lon: true }).state; s = keepFish(s, { sp: 'chep', lon: false }).state;
  const bad = releaseFish(s, 99); assert.equal(bad.ok, false); assert.equal(bad.state, s);
  const r = releaseFish(s, 1); assert.equal(r.ok, true); assert.equal(r.sen, 3); assert.equal(r.fish.sp, 'koi'); assert.equal(r.state.pond.length, 1); assert.equal(r.state.pond[0].uid, 2); assert.equal(r.state.stat.rel, 1); assert.equal(s.pond.length, 2);
  const again = releaseFish(r.state, 1); assert.equal(again.ok, false);
  const k = keepFish(r.state, { sp: 'baba', lon: false }); assert.equal(k.uid, 3, 'uid không dùng lại sau khi thả');
  const now = releaseCaught(emptyFish(), { sp: 'ruavang', lon: false }); assert.equal(now.ok, true); assert.equal(now.sen, 2); assert.equal(now.state.stat.rel, 1); assert.equal(now.state.stat.got, 1);
  assert.equal(releaseCaught(emptyFish(), { sp: 'zzz' }).ok, false);
});

test('trần công đức phóng sinh: 10 lần/ngày, sang ngày mới đếm lại (dùng claimAct của merit.js)', () => {
  assert.equal(ACT_CAP.phongsinh, 10);
  const d1 = new Date(2026, 10, 7, 9, 0).getTime(), d2 = new Date(2026, 10, 8, 9, 0).getTime();
  let l = emptyLeaf(); for (let i = 1; i <= 10; i++) { const r = claimAct(l, 'phongsinh', d1); assert.ok(r.ok, 'lần ' + i); l = r.leaf; }
  const over = claimAct(l, 'phongsinh', d1); assert.equal(over.ok, false); assert.equal(over.left, 0);
  assert.equal(claimAct(l, 'phongsinh', d2).ok, true);
});

test('nhãn và tóm tắt ao', () => {
  assert.equal(fishLabel({ sp: 'koi', lon: true }), 'Cá koi (hiếm, lớn)'); assert.equal(fishLabel({ sp: 'chep', lon: false }), 'Cá chép (nhỏ)'); assert.equal(fishLabel({ sp: 'x' }), '');
  let s = emptyFish(); for (const f of [{ sp: 'koi', lon: true }, { sp: 'ruanuoc', lon: false }, { sp: 'mucnang', lon: true }, { sp: 'baba', lon: false }]) s = keepFish(s, f).state;
  assert.deepEqual(pondSummary(s), { total: 4, ca: 1, rua: 1, baba: 1, muc: 1, hiem: 2, lon: 2, full: false });
});

test('đọc dữ liệu hỏng/sửa tay: rác → trống; cầu lạ bỏ, độ bền kẹp, cầu chọn phải đang có; ao lọc cá lạ/trùng uid, tối đa 30', () => {
  for (const bad of [null, undefined, 'rác{', '[]', 5, '{"orbs":"x"}']) assert.deepEqual(loadFish(bad), emptyFish());
  const l = loadFish({ orbs: { go: 999, da: -4, xx: 5, kim: 'abc' }, sel: 'da', pond: [{ uid: 5, sp: 'koi', lon: true }, { uid: 5, sp: 'chep' }, { uid: 6, sp: 'khongco' }, { uid: 'a', sp: 'chep' }, 7, null, { uid: 9, sp: 'baba', lon: 'yes' }], seq: 2, stat: { cast: -3, got: 4.9, rel: 'x' } });
  assert.deepEqual(l.orbs, { go: 20, da: 0, kim: 0 }); assert.equal(l.sel, 'da'); assert.deepEqual(l.pond, [{ uid: 5, sp: 'koi', lon: true }, { uid: 9, sp: 'baba', lon: false }]); assert.equal(l.seq, 9, 'seq theo kịp uid lớn nhất'); assert.deepEqual(l.stat, { cast: 0, got: 4, rel: 0 });
  assert.equal(loadFish({ orbs: { go: 5 }, sel: 'kim' }).sel, null);
  const many = loadFish({ pond: Array.from({ length: 80 }, (_, i) => ({ uid: i + 1, sp: 'chep' })) }); assert.equal(many.pond.length, POND_MAX);
  const round = loadFish(JSON.stringify(keepFish(owned('ngoc'), { sp: 'koi', lon: true }).state)); assert.equal(round.pond.length, 1); assert.equal(round.orbs.ngoc, 45); assert.equal(round.sel, 'ngoc');
  assert.equal(orbById('go').gia, 30);
});

// ---- Phiên 45: lời nhắc chữ + giao diện js/ui/fishing.js
import fsx from 'node:fs';
import * as F from '../js/world/fishing.js';

test('phaseText / outcomeText / orbBrief: chữ hiển thị đúng và không rỗng', () => {
  for (const p of ['wait', 'shadow', 'nibble', 'lotus']) assert.ok(F.phaseText(p, 'Hồ cá').length > 5, p);
  assert.match(F.phaseText('wait', 'Hồ cá'), /Hồ cá/);
  assert.match(F.phaseText('lotus'), /BẤM NGAY/);
  assert.equal(F.phaseText('over'), '');
  assert.match(F.outcomeText('got', { sp: 'koi', lon: true }), /Cá koi \(hiếm, lớn\)/);
  assert.match(F.outcomeText('early'), /sớm/);
  assert.match(F.outcomeText('late'), /khép/);
  assert.equal(F.outcomeText(null), '');
  assert.equal(F.orbBrief(F.ORBS[0]), 'bền 20 lần · may ×1 · hoa sen 0,5 giây');
  assert.equal(F.orbBrief(F.ORBS[4]), 'bền 100 lần · may ×4,5 · hoa sen 0,9 giây');
});

test('js/ui/fishing.js chỉ nhập những hàm có thật trong js/world/fishing.js', () => {
  const src = fsx.readFileSync(new URL('../js/ui/fishing.js', import.meta.url), 'utf8');
  const imp = src.match(/import \{([^}]*)\} from '\.\.\/world\/fishing\.js'/);
  assert.ok(imp, 'không thấy dòng nhập từ world/fishing.js');
  const names = imp[1].split(',').map((x) => x.trim()).filter(Boolean);
  for (const n of names) assert.ok(n in F, `world/fishing.js thiếu export ${n}`);
  for (const n of ['startCast', 'tick', 'tap', 'keepFish', 'releaseCaught', 'releaseFish', 'buyOrb', 'repairOrb', 'selectOrb', 'nearWater']) assert.ok(names.includes(n), `ui/fishing.js phải dùng ${n}`);
  assert.ok(!/innerHTML/.test(src), 'giao diện câu cá không được dùng innerHTML');
});

test('menu: nút Câu cá có trong cụm phải-trên và mở bảng câu cá', async () => {
  const M = await import('../js/ui/menuLogic.js');
  const it = M.TOP_ICONS.find((x) => x.id === 'cauca');
  assert.ok(it && M.isReady(it));
  assert.deepEqual(M.pressResult(it), { kind: 'fish' });
});

// ---- Phiên 56: phím bấm + rời mặt nước
test('isTapKey: Cách/Enter đạt; phím lặp, có Ctrl/Alt, đang gõ chữ, phím khác thì không', () => {
  assert.equal(F.isTapKey({ code: 'Space' }), true);
  assert.equal(F.isTapKey({ code: 'Enter', key: 'Enter' }), true);
  assert.equal(F.isTapKey({ key: ' ' }), true);
  assert.equal(F.isTapKey({ code: 'Space', repeat: true }), false);
  assert.equal(F.isTapKey({ code: 'Space', ctrlKey: true }), false);
  assert.equal(F.isTapKey({ code: 'Space', target: { tagName: 'INPUT' } }), false);
  assert.equal(F.isTapKey({ code: 'Space', target: { tagName: 'DIV', isContentEditable: true } }), false);
  assert.equal(F.isTapKey({ code: 'KeyA', key: 'a' }), false);
  assert.equal(F.isTapKey(null), false);
});

test('stillNearWater: gần mép (kể cả nới 1,5 m) còn câu; đi xa thì thu cầu; nước lạ → false', () => {
  const w = F.FISH_WATERS[0];
  assert.equal(F.stillNearWater(w.x + w.r + 1, w.z, w.id), true);
  assert.equal(F.stillNearWater(w.x + w.r + 4.5, w.z, w.id), true);     // 3,2 + 1,5 = 4,7
  assert.equal(F.stillNearWater(w.x + w.r + 5, w.z, w.id), false);
  assert.equal(F.stillNearWater(0, 0, 'khong-co'), false);
});

test('js/ui/fishing.js nối phím bấm ở giai đoạn capture và kiểm rời mặt nước', () => {
  const src = fsx.readFileSync(new URL('../js/ui/fishing.js', import.meta.url), 'utf8');
  assert.match(src, /isTapKey\(e\)/); assert.match(src, /stopImmediatePropagation/); assert.match(src, /\}, true\);/);
  assert.match(src, /stillNearWater\(p\.x, p\.z, sess\.water\)/);
});
