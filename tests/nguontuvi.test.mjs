import test from 'node:test';
import assert from 'node:assert/strict';
import { NGUON_CFG } from '../js/data/nguon.js';
import { expToNext, levelFromExp, totalExpFor } from '../js/world/stats.js';
import { dayKeyVN, freshState, normalizeState, chenhLechFactor, expPerAction, award } from '../js/world/nguonTuVi.js';

const T0 = Date.UTC(2026, 10, 11, 10, 0, 0); // 17:00 ngày 11/11 giờ VN

test('tỉ lệ nguồn: số lần × moiLan = tyLe GDD (40/30/15/15) và tổng = 100%', () => {
  const n = NGUON_CFG.nguon, h = n.hoatDong;
  assert.ok(Math.abs(n.hangYeu.lanChuan * n.hangYeu.moiLan - n.hangYeu.tyLe) < 1e-9);
  assert.ok(Math.abs(n.nhiemVu.lanChuan * n.nhiemVu.moiLan - n.nhiemVu.tyLe) < 1e-9);
  assert.ok(Math.abs(h.loai.length * h.tranNgay * h.moiLan - h.tyLe) < 1e-9);
  assert.ok(Math.abs(n.boss.lanChuan * n.boss.moiLan - n.boss.tyLe) < 1e-9);
  assert.ok(Math.abs(n.hangYeu.tyLe + n.nhiemVu.tyLe + h.tyLe + n.boss.tyLe - 1) < 1e-9);
});

test('dayKeyVN: đổi ngày đúng lúc 00:00 giờ VN (17:00 UTC)', () => {
  assert.equal(dayKeyVN(Date.UTC(2026, 10, 11, 16, 59, 59)), '2026-11-11');
  assert.equal(dayKeyVN(Date.UTC(2026, 10, 11, 17, 0, 0)), '2026-11-12');
  assert.equal(dayKeyVN('abc'), '1970-01-01');
});

test('expPerAction: tỉ lệ theo EXP cần của cấp; tối thiểu 1; nguồn lạ và cấp 150 → 0', () => {
  assert.equal(expPerAction('hangYeu', 10), Math.round(expToNext(10) * 0.02));
  assert.equal(expPerAction('boss', 10), Math.round(expToNext(10) * 0.15));
  assert.equal(expPerAction('nhiemVu', 1), Math.round(expToNext(1) * 0.1));
  assert.equal(expPerAction('hangYeu', 1), 1); // 30×0,02 = 0,6 → tối thiểu 1
  assert.equal(expPerAction('xyz', 10), 0);
  assert.equal(expPerAction('boss', 150), 0);
});

test('chenhLechFactor: ≤5 cấp đủ; vượt thì giảm; sàn 0,1; cấp quái lạ → 1', () => {
  assert.equal(chenhLechFactor(10, 5), 1);
  assert.ok(Math.abs(chenhLechFactor(10, 4) - 0.9) < 1e-9);
  assert.ok(Math.abs(chenhLechFactor(20, 5) - 0.1) < 1e-9);
  assert.equal(chenhLechFactor(100, 3), 0.1);
  assert.equal(chenhLechFactor(10, undefined), 1);
  assert.equal(chenhLechFactor(10, 'x'), 1);
  assert.equal(chenhLechFactor(10, 30), 1); // quái mạnh hơn: đủ EXP
});

test('hàng yêu: quái yếu cho ít EXP hơn quái ngang cấp', () => {
  const a = award({ exp: 0, nguon: 'hangYeu', monsterLevel: 3, state: null, now: T0 });
  assert.equal(a.reason, 'ok');
  const base = expPerAction('hangYeu', 1);
  assert.equal(a.gain, base);
  const mid = 2000; // đã ~ cấp 11+
  const lvl = levelFromExp(mid);
  const weak = award({ exp: mid, nguon: 'hangYeu', monsterLevel: 1, state: null, now: T0 }).gain;
  const even = award({ exp: mid, nguon: 'hangYeu', monsterLevel: lvl, state: null, now: T0 }).gain;
  assert.ok(weak < even, `${weak} < ${even}`);
});

test('hoạt động chùa: mỗi loại tối đa 5 lần/ngày, loại khác không bị ảnh hưởng', () => {
  let st = null, exp = 0, ok = 0;
  for (let i = 0; i < 8; i++) {
    const r = award({ exp, nguon: 'hoatDong', loai: 'thien', state: st, now: T0 });
    st = r.state; exp = r.exp;
    if (r.reason === 'ok') ok++; else assert.equal(r.reason, 'tran-ngay');
  }
  assert.equal(ok, 5);
  const t = award({ exp, nguon: 'hoatDong', loai: 'tung', state: st, now: T0 });
  assert.equal(t.reason, 'ok');
  assert.equal(t.state.counts.thien, 5);
  assert.equal(t.state.counts.tung, 1);
});

test('hoạt động chùa: sang ngày mới (giờ VN) thì reset trần', () => {
  let st = null, exp = 0;
  for (let i = 0; i < 5; i++) { const r = award({ exp, nguon: 'hoatDong', loai: 'lay', state: st, now: T0 }); st = r.state; exp = r.exp; }
  assert.equal(award({ exp, nguon: 'hoatDong', loai: 'lay', state: st, now: T0 }).reason, 'tran-ngay');
  const sau = Date.UTC(2026, 10, 11, 17, 0, 0); // 00:00 ngày 12 giờ VN
  const r = award({ exp, nguon: 'hoatDong', loai: 'lay', state: st, now: sau });
  assert.equal(r.reason, 'ok');
  assert.equal(r.state.counts.lay, 1);
});

test('award không sửa state đầu vào; state hỏng/âm/quá trần được chuẩn hóa', () => {
  const st = freshState(T0); const copy = JSON.stringify(st);
  award({ exp: 0, nguon: 'hoatDong', loai: 'thien', state: st, now: T0 });
  assert.equal(JSON.stringify(st), copy);
  const bad = normalizeState({ day: dayKeyVN(T0), counts: { thien: 99, tung: -3, lay: 'x' } }, T0);
  assert.deepEqual(bad.counts, { thien: 5, tung: 0, lay: 0 });
  assert.deepEqual(normalizeState(42, T0), freshState(T0));
  assert.deepEqual(normalizeState({ day: '2000-01-01', counts: { thien: 5 } }, T0), freshState(T0));
});

test('award: nguồn lạ, loại lạ, cấp tối đa; leveledUp khi vượt mốc', () => {
  assert.equal(award({ exp: 0, nguon: 'abc', now: T0 }).reason, 'nguon-la');
  assert.equal(award({ exp: 0, nguon: 'hoatDong', loai: 'zzz', now: T0 }).reason, 'loai-la');
  assert.equal(award({ exp: 0, nguon: 'hoatDong', now: T0 }).gain, 0);
  assert.equal(award({ exp: 1e9, nguon: 'boss', now: T0 }).reason, 'cap-toi-da');
  const r = award({ exp: expToNext(1) - 1, nguon: 'boss', now: T0 });
  assert.equal(r.leveledUp, true);
  assert.equal(r.tuvi, 2);
  assert.equal(award({ exp: NaN, nguon: 'boss', now: T0 }).exp, expPerAction('boss', 1));
});

test('một ngày cày đủ trần hoạt động chùa ≈ 15% EXP của cấp (ở cấp giữa)', () => {
  const lv = 15, base = totalExpFor(lv); let st = null, exp = base, gain = 0; // đầu cấp 15: cày đủ trần vẫn chưa lên cấp, nên đo được đúng tỉ lệ
  for (const loai of NGUON_CFG.nguon.hoatDong.loai) for (let i = 0; i < 5; i++) { const r = award({ exp, nguon: 'hoatDong', loai, state: st, now: T0 }); st = r.state; gain += r.gain; exp = base + gain; }
  const need = expToNext(lv);
  assert.ok(Math.abs(gain / need - 0.15) < 0.02, `gain/need = ${gain / need}`);
});
