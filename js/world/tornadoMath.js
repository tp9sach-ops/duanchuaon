// CƠN GIÓ LỐC CỦA CHỔI (Phiên 234, mục 2 đợt Chổi): LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ), có test: tests/tornado234.test.mjs. Hình + vẽ: js/ui/tornadoFx.js; nối với quái: js/ui/tornadoHit.js.
//  • Đòn THỨ 3 cầm Chổi: đầu chổi đập xuống, THỔI RA 3 cơn lốc nhỏ tỏa quạt về phía trước từ chỗ đập.
//  • Đòn THỨ 9 (đủ 3 chuỗi 3 đòn liền): ngoài 3 lốc nhỏ còn có 1 CƠN LỐC TO từ SAU LƯNG nhân vật đi tới (băng qua người, tiến về phía trước), trúng quái thì quái mất máu.
//  • Mọi con số là QUY ƯỚC TẠM (tam: true), chờ ptg chơi thử rồi chỉnh. Hệ số sát thương (dmgMul) là PHẦN của sát thương đánh thường gốc, sẽ chỉnh ở mục sát thương (mục 6 đợt Chổi).
export const TORN = Object.freeze({
  tam: true,
  hits: 9,            // đòn thứ mấy thì có lốc to
  comboGap: 2.5,      // giây: quá ngần này kể từ đòn trước thì đếm lại từ đầu
  delaySmall: 0.54,   // giây: lốc nhỏ bắt đầu thổi ra sau khi cú đập khởi động (= lúc đầu chổi chạm đất, broomMath.IMPACT_T)
  maxLive: 8,         // số cơn lốc sống cùng lúc (đỡ nặng máy)
  maxPerFrame: 4,     // số quái tối đa dính trong cùng một khung hình, cho MỘT cơn lốc
  small: Object.freeze({ n: 3, fan: 0.55, speed: 5.5, life: 1.5, reach: 0.9, h: 2.2, r0: 0.35, r1: 0.9, dmgMul: 0.5, cooldown: 0.5, perMonster: 2 }),
  big: Object.freeze({ back: 3.5, speed: 6.5, life: 2.6, reach: 2.4, h: 5, r0: 0.8, r1: 2.2, dmgMul: 1, cooldown: 0.45, perMonster: 4 }),
});

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/**
 * Đếm đòn cầm Chổi. prev = { c, last, step } | null (c = số chuỗi 3 đòn đã trọn); step = đòn thứ mấy trong chuỗi (1..3); now = giây.
 * Chuỗi trọn rồi (đòn 3) mà đòn kế là đòn 1 → sang chuỗi mới; chuỗi đang dở bị đứt (về đòn 1 khi chưa tới đòn 3) → làm lại chuỗi đó (chuỗi đã trọn vẫn tính); nghỉ quá comboGap → đếm lại từ đầu.
 * Trả { state, n (đòn thứ mấy trong 9), w }: w = 0 (không lốc) | 1 (3 lốc nhỏ, đòn 3 và 6) | 2 (3 lốc nhỏ + lốc to, đòn 9).
 */
export function countBroomHit(prev, step, now) {
  const s = clamp(Math.floor(num(step, 1)), 1, 3), t = num(now), p = prev && Number.isFinite(+prev.c) ? prev : { c: 0, last: -1e9, step: 0 };
  const fresh = t - num(p.last, -1e9) > TORN.comboGap;
  const c = fresh ? 0 : s === 1 && p.step === 3 ? Math.floor(p.c) + 1 : Math.floor(p.c);
  const n = c * 3 + s, w = s === 3 ? (n >= TORN.hits ? 2 : 1) : 0;
  return { state: { c: n >= TORN.hits ? 0 : c, last: t, step: n >= TORN.hits ? 0 : s }, n, w };
}

/** Danh sách cơn lốc cho kiểu w (1 = 3 lốc nhỏ, 2 = 3 lốc nhỏ + lốc to), theo hướng heading (rad; hướng đi = (sin, cos)). Mỗi cơn: { kind, ang, delay (giây chờ), ...thông số }. */
export function tornadoPlan(w, heading = 0) {
  const k = Math.floor(num(w)), h = num(heading), out = [];
  if (k < 1) return out;
  const S = TORN.small;
  for (let i = 0; i < S.n; i++) out.push({ kind: 'small', ang: h + (i - (S.n - 1) / 2) * S.fan, delay: TORN.delaySmall, ...S });
  if (k >= 2) out.push({ kind: 'big', ang: h, delay: 0, ...TORN.big });
  return out;
}

/** Điểm xuất phát cơn lốc: nhỏ = chỗ đầu chổi đập (cách người `range` m phía trước); to = SAU LƯNG người `back` m. pos {x,z}; trả {x,z}. */
export function tornadoOrigin(tn, pos, heading, range) {
  const h = num(heading), px = num(pos && pos.x), pz = num(pos && pos.z);
  if (tn && tn.kind === 'big') return { x: px - Math.sin(h) * tn.back, z: pz - Math.cos(h) * tn.back };
  return { x: px + Math.sin(h) * num(range), z: pz + Math.cos(h) * num(range) };
}

/** Cơn lốc tại giây u kể từ lúc bắt đầu thổi (đã trừ delay): { done, x, z (dời so với điểm xuất phát), a (độ đậm 0..1), r (bán kính, m), h (cao, m) }. */
export function tornadoAt(tn, u) {
  const t = num(u);
  if (t >= tn.life) return { done: true, x: 0, z: 0, a: 0, r: tn.r1, h: tn.h };
  const x = Math.max(0, t), d = tn.speed * x, k = clamp(x / tn.life, 0, 1), fin = Math.min(1, x / 0.25), fout = Math.min(1, (tn.life - x) / 0.5);
  return { done: false, x: Math.sin(tn.ang) * d, z: Math.cos(tn.ang) * d, a: Math.max(0, Math.min(fin, fout)), r: tn.r0 + (tn.r1 - tn.r0) * k, h: tn.h };
}

/**
 * Các quái bị cơn lốc quét trúng lúc giây t. pt {x,z}: chỗ cơn lốc; mons: [{ uid, x, z, oan, ghost }]; bodyOf(m) = bán kính thân;
 * rec: Map uid → { n, last } của RIÊNG cơn lốc này (hàm tự cập nhật). Bóng quái / quái đã hết Oán Khí bị bỏ. Trả gần nhất trước.
 */
export function tornadoHits(tn, pt, mons, bodyOf, rec, t) {
  const out = [];
  if (!tn || !pt || !Number.isFinite(+pt.x) || !Number.isFinite(+pt.z) || !rec) return out;
  for (const m of mons || []) {
    if (!m || m.ghost || !Number.isFinite(+m.x) || !Number.isFinite(+m.z) || !(m.oan > 0)) continue;
    const d = Math.hypot(m.x - pt.x, m.z - pt.z) - (bodyOf ? num(bodyOf(m)) : 0);
    if (d > tn.reach) continue;
    const e = rec.get(m.uid) || { n: 0, last: -1e9 };
    if (e.n >= tn.perMonster || t - e.last < tn.cooldown) continue;
    out.push({ m, d });
  }
  out.sort((a, b) => a.d - b.d);
  const pick = out.slice(0, TORN.maxPerFrame).map((o) => o.m);
  for (const m of pick) { const e = rec.get(m.uid) || { n: 0, last: -1e9 }; rec.set(m.uid, { n: e.n + 1, last: t }); }
  return pick;
}
