// Quả cầu gieo duyên + câu cá + ao cá riêng + phóng sinh (Phiên 44, việc 3a). LOGIC THUẦN (không DOM, không three.js, có test: tests/fishing.test.mjs).
// Luật ptg chốt 07/11 (docs/PHIEN41.md): quả cầu 5 loại giá 30 → 1000 lá bồ đề; KHÔNG giới hạn số lần thả mỗi ngày; cầu hư (nứt) thì tốn lá để sửa.
// Nhịp câu (docs/PHIEN41.md bước 6): quăng → 4 giây bóng cá → rỉa → cắn → hoa sen hiện 0,5 giây → bấm để thu.
// GIẢ ĐỊNH CẦN PTG DUYỆT: "quả cầu" = quả cầu quăng xuống nước để gieo duyên với cá. Mọi con số dưới đây là QUY ƯỚC TẠM (độ bền, may mắn, thưởng phóng sinh, sức chứa ao).
// Cách dùng: st = loadFish(raw); st = buyOrb(st, la, 'go').state (rồi trừ lá bằng LGT.merit.spendLa(cost));
//   const c = startCast(st, 'hoca', Math.random); st = c.state; let s = c.sess; mỗi khung: s = tick(s, dt); khi người chơi bấm: s = tap(s);
//   s.outcome === 'got' → s.fish (thu bằng keepFish hoặc phóng sinh ngay bằng releaseSen).
import { POND } from './layout.js';
import { KOI } from './landscape.js';
import { THAC } from './outside.js';
import { SUOI } from './river.js';

/** Năm loại quả cầu. gia = giá (đơn vị theo `don`: 'la' = lá bồ đề — mặc định; 'sen' = hạt sen. Phiên 57: Cầu Gỗ bán bằng 50 HẠT SEN = 5 lá); ben = số lần quăng trước khi nứt; may = hệ số nhân cơ hội gặp loài hiếm; cua = giây hoa sen hiện (0,5 giây ở loại đầu). */
export const ORBS = [
  { id: 'go', ten: 'Cầu Gỗ Bồ Đề', gia: 50, don: 'sen', ben: 20, may: 1, cua: 0.8 },
  { id: 'da', ten: 'Cầu Đá Suối', gia: 100, don: 'la', ben: 30, may: 1.4, cua: 0.9 },
  { id: 'ngoc', ten: 'Cầu Ngọc Bích', gia: 250, don: 'la', ben: 45, may: 2, cua: 1 },
  { id: 'luuly', ten: 'Cầu Lưu Ly', gia: 600, don: 'la', ben: 70, may: 3, cua: 1.1 },
  { id: 'kim', ten: 'Cầu Kim Quang', gia: 1000, don: 'la', ben: 100, may: 4.5, cua: 1.2 },
];
export const orbById = (id) => ORBS.find((o) => o.id === id) || null;
/** Đơn vị tiền của quả cầu: 'sen' (hạt sen) hoặc 'la' (lá bồ đề). */
export const orbCurrency = (orb) => (orb && orb.don === 'sen' ? 'sen' : 'la');
/** Chi phí sửa một quả cầu đã nứt (một phần năm giá, làm tròn lên; cùng đơn vị với giá cầu). */
export const repairCost = (orb) => Math.ceil(orb.gia / 5);
/** Số tiền người chơi có theo đơn vị của quả cầu. `bal` = số (lá bồ đề — cách gọi cũ) hoặc { la, sen }. */
export function balanceFor(orb, bal) {
  if (bal && typeof bal === 'object') return int(orbCurrency(orb) === 'sen' ? bal.sen : bal.la, 0, 1e9);
  return orbCurrency(orb) === 'sen' ? 0 : int(bal, 0, 1e9);
}
/** Chữ giá hiển thị: "50 hạt sen" / "100 lá". */
export const priceText = (n, orb) => `${n} ${orbCurrency(orb) === 'sen' ? 'hạt sen' : 'lá'}`;

/** Các loài: loai = ca | rua | baba | muc; hiem = loài hiếm; w = trọng số gặp (loài hiếm còn nhân với `may` của quả cầu). */
export const SPECIES = [
  { id: 'chep', ten: 'Cá chép', loai: 'ca', hiem: false, w: 30 },
  { id: 'tre', ten: 'Cá trê', loai: 'ca', hiem: false, w: 22 },
  { id: 'loc', ten: 'Cá lóc', loai: 'ca', hiem: false, w: 20 },
  { id: 'ro', ten: 'Cá rô đồng', loai: 'ca', hiem: false, w: 20 },
  { id: 'ruanuoc', ten: 'Rùa nước', loai: 'rua', hiem: false, w: 14 },
  { id: 'baba', ten: 'Ba ba', loai: 'baba', hiem: false, w: 8 },
  { id: 'mucong', ten: 'Mực ống', loai: 'muc', hiem: false, w: 6 },
  { id: 'koi', ten: 'Cá koi', loai: 'ca', hiem: true, w: 10 },
  { id: 'chepvang', ten: 'Cá chép vàng', loai: 'ca', hiem: true, w: 8 },
  { id: 'taituong', ten: 'Cá tai tượng', loai: 'ca', hiem: true, w: 6 },
  { id: 'ruavang', ten: 'Rùa vàng', loai: 'rua', hiem: true, w: 5 },
  { id: 'babahoa', ten: 'Ba ba hoa', loai: 'baba', hiem: true, w: 3 },
  { id: 'mucnang', ten: 'Mực nang', loai: 'muc', hiem: true, w: 3 },
  // Loài RIÊNG của Suối Trong (nuoc = chỉ gặp ở các nước này; loài không có `nuoc` gặp ở mọi nước, kể cả suối)
  { id: 'bongsuoi', ten: 'Cá bống suối', loai: 'ca', hiem: false, w: 26, nuoc: ['suoitrong'] },
  { id: 'chachsuoi', ten: 'Cá chạch suối', loai: 'ca', hiem: false, w: 18, nuoc: ['suoitrong'] },
  { id: 'caleng', ten: 'Cá lăng', loai: 'ca', hiem: true, w: 6, nuoc: ['suoitrong'] },
];
/** Loài có thể gặp ở nước `waterId` (không truyền = tất cả loài không giới hạn nước). */
export const speciesFor = (waterId) => SPECIES.filter((s) => !s.nuoc || (waterId && s.nuoc.includes(waterId)));
export const speciesById = (id) => SPECIES.find((s) => s.id === id) || null;

/** Nước câu được: hồ cá (Đông), ao sen trước chánh điện, hồ chân thác. (Đề xuất thêm "Suối Trong" ở phiên sau.) */
export const FISH_WATERS = [
  { id: 'hoca', ten: 'Hồ cá', x: KOI.x, z: KOI.z, r: KOI.r },
  { id: 'aosen', ten: 'Ao sen', x: POND.x, z: POND.z, r: POND.r },
  { id: 'hothac', ten: 'Hồ thác', x: THAC.pool.x, z: THAC.pool.z, r: THAC.pool.r },
  { id: 'suoitrong', ten: SUOI.ten, x: SUOI.x, z: SUOI.z, r: SUOI.r },
];
export const waterById = (id) => FISH_WATERS.find((w) => w.id === id) || null;
/** Mặt nước gần điểm (x, z) nhất mà người đứng cách mép ≤ `margin` mét (đứng trên cầu/bờ đều được); không có thì null. */
export function nearWater(x, z, margin = 3.2) {
  let best = null, bd = Infinity;
  for (const w of FISH_WATERS) { const d = Math.hypot(x - w.x, z - w.z) - w.r; if (d <= margin && d < bd) { best = w; bd = d; } }
  return best;
}

/** Phím bấm thu cá (Phiên 56): Cách hoặc Enter, không phải phím lặp, không có Ctrl/Alt/Meta, không đang gõ chữ. `e` = sự kiện keydown (hoặc đối tượng giả). */
export function isTapKey(e) {
  if (!e || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return false;
  const t = e.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return false;
  return e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === ' ' || e.key === 'Enter';
}

/** Người chơi còn đứng đủ gần đúng mặt nước đang câu không (Phiên 56: đi khỏi mép nước giữa chừng thì thu cầu về). */
export function stillNearWater(x, z, waterId, margin = 3.2) {
  const w = waterById(waterId); if (!w) return false;
  return Math.hypot(x - w.x, z - w.z) - w.r <= margin + 1.5;   // nới 1,5 m để bước chân lắc nhẹ không làm hỏng lượt câu
}

/** Ao cá riêng chứa tối đa bấy nhiêu con. */
export const POND_MAX = 30;
/** Thời gian bóng cá xuất hiện sau khi quăng (giây). */
export const T_SHADOW = 4;
const MAX_DT = 0.25;      // một khung hình lag không được nuốt mất cửa sổ hoa sen
const MAX_SEQ = 1e9;

const int = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, Math.floor(+x))) : lo);
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);

/** Trạng thái trống. orbs: { idCầu: độ bền còn lại }; sel: cầu đang dùng; pond: [{ uid, sp, lon }]; seq: bộ đếm uid; stat: thống kê. */
export const emptyFish = () => ({ v: 1, orbs: {}, sel: null, pond: [], seq: 0, stat: { cast: 0, got: 0, rel: 0 }, dex: {} });

/** Đọc dữ liệu đã lưu (chuỗi JSON hoặc đối tượng). Dữ liệu hỏng/sửa tay → bỏ phần hỏng, không bao giờ ném lỗi. */
export function loadFish(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyFish(); if (!isObj(o)) return s;
  if (isObj(o.orbs)) for (const orb of ORBS) if (Object.prototype.hasOwnProperty.call(o.orbs, orb.id)) s.orbs[orb.id] = int(o.orbs[orb.id], 0, orb.ben);
  s.sel = typeof o.sel === 'string' && s.orbs[o.sel] !== undefined ? o.sel : null;
  s.seq = int(o.seq, 0, MAX_SEQ);
  if (Array.isArray(o.pond)) {
    const seen = new Set();
    for (const f of o.pond) {
      if (s.pond.length >= POND_MAX) break;
      if (!isObj(f) || !speciesById(f.sp)) continue;
      const uid = int(f.uid, 1, MAX_SEQ); if (!(+f.uid >= 1) || seen.has(uid)) continue;
      seen.add(uid); s.pond.push({ uid, sp: f.sp, lon: f.lon === true });
      if (uid > s.seq) s.seq = uid;
    }
  }
  if (isObj(o.dex)) for (const sp of SPECIES) if (Object.prototype.hasOwnProperty.call(o.dex, sp.id)) { const c = int(o.dex[sp.id], 0, 1e9); if (c > 0) s.dex[sp.id] = c; }   // sổ sưu tầm: loài đã từng câu được (Phiên 57)
  if (isObj(o.stat)) s.stat = { cast: int(o.stat.cast, 0, 1e9), got: int(o.stat.got, 0, 1e9), rel: int(o.stat.rel, 0, 1e9) };
  return s;
}

const clone = (st) => ({ ...st, orbs: { ...st.orbs }, pond: st.pond.slice(), stat: { ...st.stat }, dex: { ...(st.dex || {}) } });
/** Ghi vào sổ sưu tầm một con vừa câu được (loài lạ thì bỏ qua). */
const noteDex = (n, fish) => { if (fish && speciesById(fish.sp)) n.dex[fish.sp] = int((n.dex[fish.sp] || 0) + 1, 0, 1e9); };

/** Mua một quả cầu. `bal` = số lá bồ đề (cách cũ) hoặc { la, sen }. Trả { ok, reason: ''|'unknown'|'owned'|'poor', cost, don: 'la'|'sen', state }. Nơi gọi tự trừ đúng loại tiền (lá: LGT.merit.spendLa(cost); hạt sen: LGT.spendSen(cost)) khi ok. Cầu mới đầy độ bền; cầu đầu tiên tự được chọn. */
export function buyOrb(st, bal, id) {
  const orb = orbById(id); if (!orb) return { ok: false, reason: 'unknown', cost: 0, state: st };
  if (st.orbs[id] !== undefined) return { ok: false, reason: 'owned', cost: orb.gia, don: orbCurrency(orb), state: st };
  if (balanceFor(orb, bal) < orb.gia) return { ok: false, reason: 'poor', cost: orb.gia, don: orbCurrency(orb), state: st };
  const n = clone(st); n.orbs[id] = orb.ben; if (!n.sel) n.sel = id;
  return { ok: true, reason: '', cost: orb.gia, don: orbCurrency(orb), state: n };
}

/** Chọn quả cầu đang dùng (phải đang có). */
export function selectOrb(st, id) {
  if (st.orbs[id] === undefined) return { ok: false, state: st };
  const n = clone(st); n.sel = id; return { ok: true, state: n };
}

/** Sửa quả cầu đã nứt (độ bền 0) bằng đúng loại tiền của cầu (`bal` như buyOrb). Trả { ok, reason: ''|'unknown'|'notowned'|'intact'|'poor', cost, don, state }. Cầu còn nguyên thì không sửa (không có sửa nửa chừng). */
export function repairOrb(st, bal, id) {
  const orb = orbById(id); if (!orb) return { ok: false, reason: 'unknown', cost: 0, state: st };
  if (st.orbs[id] === undefined) return { ok: false, reason: 'notowned', cost: 0, state: st };
  const cost = repairCost(orb);
  if (st.orbs[id] > 0) return { ok: false, reason: 'intact', cost, don: orbCurrency(orb), state: st };
  if (balanceFor(orb, bal) < cost) return { ok: false, reason: 'poor', cost, don: orbCurrency(orb), state: st };
  const n = clone(st); n.orbs[id] = orb.ben; return { ok: true, reason: '', cost, don: orbCurrency(orb), state: n };
}

/** Cầu đang dùng: { orb, dur (còn lại), cracked } hoặc null nếu chưa có cầu nào. */
export function currentOrb(st) {
  const orb = st.sel ? orbById(st.sel) : null; if (!orb || st.orbs[orb.id] === undefined) return null;
  const dur = st.orbs[orb.id]; return { orb, dur, cracked: dur <= 0 };
}

/** Cơ hội gặp loài hiếm (0..1) với quả cầu `orb`. */
export function rareChance(orb, waterId = '') {
  let c = 0, r = 0; for (const s of speciesFor(waterId || '-')) { if (s.hiem) r += s.w * orb.may; else c += s.w; }
  return r / (c + r);
}
/** Cơ hội con cá thuộc cỡ lớn (cầu tốt thì dễ lớn hơn). */
export const bigChance = (orb) => Math.min(0.6, 0.25 + 0.07 * ORBS.findIndex((o) => o.id === orb.id));

/** Bốc một con cá theo quả cầu. rng() trả [0,1). Trả { sp, lon }. */
export function rollCatch(orb, rng = Math.random, waterId = '') {
  const list = speciesFor(waterId || '-');   // không rõ nước: chỉ các loài chung
  let total = 0; for (const s of list) total += s.w * (s.hiem ? orb.may : 1);
  let x = rng() * total, pick = list[list.length - 1];
  for (const s of list) { x -= s.w * (s.hiem ? orb.may : 1); if (x < 0) { pick = s; break; } }
  return { sp: pick.id, lon: rng() < bigChance(orb) };
}

const between = (rng, a, b) => a + (b - a) * rng();

/**
 * Quăng quả cầu xuống nước `waterId`. Trừ 1 độ bền (kể cả khi cá thoát). Không giới hạn số lần quăng mỗi ngày.
 * Trả { ok, reason: ''|'nowater'|'noorb'|'cracked', state, sess }. sess = phiên câu: mốc thời gian được định sẵn lúc quăng
 * { water, orb, t, phase: 'wait'|'shadow'|'nibble'|'lotus'|'over', tShadow, nibbles[], tBite, tEnd, fish (ẩn tới khi thu), over, outcome: null|'got'|'early'|'late' }.
 */
export function startCast(st, waterId, rng = Math.random) {
  if (!waterById(waterId)) return { ok: false, reason: 'nowater', state: st, sess: null };
  const cur = currentOrb(st);
  if (!cur) return { ok: false, reason: 'noorb', state: st, sess: null };
  if (cur.cracked) return { ok: false, reason: 'cracked', state: st, sess: null };
  const n = clone(st); n.orbs[cur.orb.id] = cur.dur - 1; n.stat.cast = int(n.stat.cast + 1, 0, 1e9);
  const count = 1 + Math.floor(rng() * 3), nibbles = []; let t = T_SHADOW;
  for (let i = 0; i < count; i++) { t += i === 0 ? between(rng, 0.8, 1.8) : between(rng, 0.7, 1.5); nibbles.push(t); }
  const tBite = t + between(rng, 0.8, 1.6);
  const sess = { water: waterId, orb: cur.orb.id, t: 0, phase: 'wait', tShadow: T_SHADOW, nibbles, tBite, tEnd: tBite + cur.orb.cua, fish: rollCatch(cur.orb, rng, waterId), over: false, outcome: null };
  return { ok: true, reason: '', state: n, sess };
}

function phaseAt(s, t) {
  if (t < s.tShadow) return 'wait';
  if (t < s.nibbles[0]) return 'shadow';
  if (t < s.tBite) return 'nibble';
  if (t < s.tEnd) return 'lotus';
  return 'over';
}

/** Cho phiên câu chạy thêm `dt` giây (mỗi lần tối đa 0,25 giây). Hết cửa sổ hoa sen mà chưa bấm → cá thoát (outcome 'late'). Không sửa đầu vào. */
export function tick(s, dt) {
  if (!s || s.over) return s;
  const t = s.t + (Number.isFinite(+dt) ? Math.max(0, Math.min(MAX_DT, +dt)) : 0), phase = phaseAt(s, t);
  return phase === 'over' ? { ...s, t, phase, over: true, outcome: 'late' } : { ...s, t, phase };
}

/** Người chơi bấm. Đúng lúc hoa sen hiện → thu được cá (outcome 'got'); bấm sớm hơn → cá giật mình bỏ đi (outcome 'early'). Đã kết thúc thì không đổi. */
export function tap(s) {
  if (!s || s.over) return s;
  return s.phase === 'lotus' ? { ...s, phase: 'over', over: true, outcome: 'got' } : { ...s, phase: 'over', over: true, outcome: 'early' };
}

/** Thu cá vào ao riêng (nút "Thu cá"). Trả { ok, reason: ''|'full'|'unknown', state, uid }. Con cá đã thu được tính vào thống kê. */
export function keepFish(st, fish) {
  if (!fish || !speciesById(fish.sp)) return { ok: false, reason: 'unknown', state: st, uid: 0 };
  if (st.pond.length >= POND_MAX) return { ok: false, reason: 'full', state: st, uid: 0 };
  const n = clone(st), uid = int(n.seq + 1, 1, MAX_SEQ); n.seq = uid;
  n.pond.push({ uid, sp: fish.sp, lon: fish.lon === true }); n.stat.got = int(n.stat.got + 1, 0, 1e9); noteDex(n, fish);
  return { ok: true, reason: '', state: n, uid };
}

/** Ghi nhận một con cá câu được mà phóng sinh ngay (không vào ao): chỉ tăng thống kê câu được. */
export function noteCaught(st, fish) { const n = clone(st); n.stat.got = int(n.stat.got + 1, 0, 1e9); noteDex(n, fish); return n; }

/** Hạt sen thưởng khi phóng sinh một con: 1, +1 nếu loài hiếm, +1 nếu cỡ lớn (1..3). Nơi gọi đưa vào LGT.merit.reward('phongsinh', n) (trần 10 lần/ngày). */
export function releaseSen(fish) {
  const sp = fish && speciesById(fish.sp); if (!sp) return 0;
  return 1 + (sp.hiem ? 1 : 0) + (fish.lon === true ? 1 : 0);
}

/** Phóng sinh một con trong ao riêng theo uid. Trả { ok, fish, sen, state }. Không có uid đó thì ok=false. Hết trần công đức ngày thì nơi gọi vẫn cho thả nhưng không cộng hạt sen. */
export function releaseFish(st, uid) {
  const i = st.pond.findIndex((f) => f.uid === uid); if (i < 0) return { ok: false, fish: null, sen: 0, state: st };
  const n = clone(st), [fish] = n.pond.splice(i, 1); n.stat.rel = int(n.stat.rel + 1, 0, 1e9);
  return { ok: true, fish, sen: releaseSen(fish), state: n };
}
/** Phóng sinh con vừa câu (chưa vào ao): tăng thống kê thả. */
export function releaseCaught(st, fish) {
  const sen = releaseSen(fish); if (!sen) return { ok: false, sen: 0, state: st };
  const n = clone(st); n.stat.rel = int(n.stat.rel + 1, 0, 1e9); n.stat.got = int(n.stat.got + 1, 0, 1e9); noteDex(n, fish);
  return { ok: true, sen, state: n };
}

/** Tên hiển thị một con: "Cá koi (hiếm, lớn)". */
export function fishLabel(fish) {
  const sp = fish && speciesById(fish.sp); if (!sp) return '';
  const tags = []; if (sp.hiem) tags.push('hiếm'); tags.push(fish.lon === true ? 'lớn' : 'nhỏ');
  return `${sp.ten} (${tags.join(', ')})`;
}

/** Tóm tắt ao riêng: { total, ca, rua, baba, muc, hiem, lon, full }. */
export function pondSummary(st) {
  const r = { total: st.pond.length, ca: 0, rua: 0, baba: 0, muc: 0, hiem: 0, lon: 0, full: st.pond.length >= POND_MAX };
  for (const f of st.pond) { const sp = speciesById(f.sp); if (!sp) continue; r[sp.loai] += 1; if (sp.hiem) r.hiem += 1; if (f.lon) r.lon += 1; }
  return r;
}

/** Lời nhắc theo giai đoạn của phiên câu (giao diện chữ, Phiên 45). */
export function phaseText(phase, waterName = 'mặt nước') {
  if (phase === 'wait') return `Đã thả cầu xuống ${waterName}. Chờ một chút…`;
  if (phase === 'shadow') return 'Có bóng cá lướt qua dưới nước…';
  if (phase === 'nibble') return 'Cá đang rỉa cầu. Chưa bấm vội!';
  if (phase === 'lotus') return 'Hoa sen nở rồi — BẤM NGAY!';
  return '';
}
/** Kết quả một lượt câu → câu báo. */
export function outcomeText(outcome, fish) {
  if (outcome === 'got') return `Bạn câu được ${fishLabel(fish)}!`;
  if (outcome === 'early') return 'Bấm sớm quá, cá giật mình bỏ đi. Lần sau chờ hoa sen nở nhé.';
  if (outcome === 'late') return 'Hoa sen đã khép, cá đã đi mất. Lần sau bấm nhanh hơn nhé.';
  return '';
}
/** Mô tả ngắn một quả cầu cho cửa hàng: "bền 20 lần · may ×1 · hoa sen 0,8 giây". */
export function orbBrief(orb) {
  const n = (x) => String(x).replace('.', ',');
  return `bền ${orb.ben} lần · may ×${n(orb.may)} · hoa sen ${n(orb.cua)} giây`;
}
