// ĐỒNG BỘ CHIẾN ĐẤU GIỮA CÁC NGƯỜI CHƠI (Phiên 220, mục 1): mọi người thấy đòn đánh, chiêu, hiệu ứng, quái đang bị đánh, máu quái và động tác quái của nhau.
// LOGIC THUẦN (không DOM, không three.js, không đồng hồ ngầm: thời gian truyền vào), có test: tests/combatshare.test.mjs. Nối vào game: js/net/combatLink.js; đường truyền: js/net/firebaseTransport.js (nhánh /combat/{uid}).
// Mỗi máy vẫn tự mô phỏng quái của mình (spawn.js). Ở đây chỉ PHÁT lại cho người khác xem: (1) hành động của mình (chiêu / đòn / trúng quái), (2) các quái mình đang đánh → máy khác dựng "bóng quái" (chỉ để xem).
// Gói của một người = { r: phòng, a: chuỗi hành động, m: chuỗi quái, t }. Chuỗi chỉ gồm [A-Za-z0-9_.,;:-] (khớp luật Firebase). Hành động cách nhau ';', trường cách nhau ','. Mọi số làm tròn thành số nguyên.
import { MONSTERS } from '../data/monsters.js';
import { ATTACK_CFG, BOSS_ATTACK_CFG } from '../data/monsterAI.js';
import { oanKhiMaxOf } from './spawn.js';   // Phiên 222: Oán Khí thật của loại quái (đoán trước sát thương trên bóng quái)

export const COMBAT = {
  sendMs: 80,         // có thay đổi: gửi tối đa ~12 lần/giây (Phiên 222: nhanh hơn cho thời gian thực)
  keepAliveMs: 3000,  // đang có quái đang đánh mà không đổi gì: 3 giây báo "còn đây" một lần (để bóng quái không hết hạn)
  actKeepMs: 1500,    // hành động nằm trong gói tối đa chừng này (người nhận bỏ trùng theo số thứ tự)
  keep: 6,            // mỗi gói mang tối đa 6 hành động gần nhất
  maxA: 520, maxM: 700, maxMons: 12,
  seeM: 60,           // chỉ phát lại hiệu ứng nếu cách mình ≤ 60 m
  stanceMs: 4500,     // người khác đứng thế chiến đấu thêm chừng này sau đòn cuối
  ghostTtlMs: 6000,   // không nhận được gói mới quá chừng này thì bóng quái biến mất
  tombMs: 3000,       // quái vừa bị hạ: không dựng lại bóng trong chừng này
};
export const COMBAT_CHARSET = /^[A-Za-z0-9_.,;:-]*$/;
export const SWING_KINDS = ['mua', 'ngang', 'nguoc', 'xoay', 'khi'];

const num = (x, d = 0) => (Number.isFinite(+x) && x !== null && x !== '' ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const I = (v, k) => String(Math.round(num(v) * k));        // số thực → số nguyên chuỗi (k = hệ số nhân)
const opt = (v, k) => (v == null || !Number.isFinite(+v) ? '' : I(v, k));
const TAG_RE = /^[a-z]{6}$/, TYPE_RE = /^[a-z]{1,12}$/, POSE_MODES = ['g', 'd', 'r', 's', 'n'], ID_RE = /^[A-Za-z0-9_]{1,40}$/, KEY_RE = /^[A-Za-z0-9]{1,20}:\d{1,6}$/, ROOM_RE = /^[A-Za-z0-9_.:-]{0,40}$/;
const wrapRy = (a) => { a = num(a); return Math.atan2(Math.sin(a), Math.cos(a)); };
const FIELDS_OK = (s) => typeof s === 'string' && COMBAT_CHARSET.test(s);

// ---------------------------------------------------------------- hành động
/** a = { k:'c', seq, id (chiêu), x, z, ry, tx?, tz? } | { k:'s', seq, kind, x, z, ry } | { k:'h', seq, key (uid quái của người đánh), dmg, id?, i?, nho?, dead?, ax?, az? }. Hỏng → ''. */
export function packAction(a) {
  if (!a || typeof a !== 'object') return '';
  const seq = Math.max(0, Math.floor(num(a.seq)));
  if (a.k === 'c') { if (!ID_RE.test(String(a.id || ''))) return ''; return [seq, 'c', a.id, I(a.x, 10), I(a.z, 10), I(wrapRy(a.ry), 100), opt(a.tx, 10), opt(a.tz, 10)].join(','); }
  if (a.k === 's') { if (!SWING_KINDS.includes(a.kind)) return ''; return [seq, 's', a.kind, I(a.x, 10), I(a.z, 10), I(wrapRy(a.ry), 100)].join(','); }
  if (a.k === 'h') {
    if (!KEY_RE.test(String(a.key || ''))) return '';
    const id = a.id == null || a.id === '' ? '' : String(a.id); if (id && !ID_RE.test(id)) return '';
    const by = a.by == null || a.by === '' ? '' : String(a.by); if (by && !TAG_RE.test(by)) return '';
    return [seq, 'h', a.key, clamp(Math.round(num(a.dmg)), 0, 99999), id, clamp(Math.floor(num(a.i)), 0, 9), a.dead ? 1 : 0, a.nho ? 1 : 0, opt(a.ax, 10), opt(a.az, 10), by].join(',');
  }
  // Phiên 222: 'd' = MÌNH đánh trúng BÓNG quái của người `owner` (mã 6 chữ) → họ trừ máu quái THẬT (máu dùng chung); 'k' = quái bị hạ bởi `killer` (mã 6 chữ, người đánh đòn cuối) → người đó nhận thưởng; 'f' = tư thế bay lướt / lao (g = bay lướt, d = lao chúi đầu, r = lao chạy, s = THẾ SẴN SÀNG CHIẾN ĐẤU (Phiên 223: người khác thấy khom/chân trước-sau NGAY khi bạn vào giao chiến, không đợi tới lúc vung đòn), n = hết), tilt = độ chúi (rad); 'r' = RỒNG HỒNG của Gậy như ý (Phiên 223: mọi người thấy rồng bay quanh người dùng), ry = hướng mặt
  if (a.k === 'd') { if (!KEY_RE.test(String(a.key || '')) || !TAG_RE.test(String(a.owner || ''))) return ''; return [seq, 'd', a.key, a.owner, clamp(Math.round(num(a.dmg)), 1, 99999), opt(a.ax, 10), opt(a.az, 10)].join(','); }
  if (a.k === 'k') { if (!KEY_RE.test(String(a.key || '')) || !TYPE_RE.test(String(a.type || '')) || !MONSTERS[a.type] || !TAG_RE.test(String(a.killer || ''))) return ''; return [seq, 'k', a.key, a.type, a.killer].join(','); }
  if (a.k === 'f') { if (!POSE_MODES.includes(a.mode)) return ''; return [seq, 'f', a.mode, clamp(Math.round(num(a.tilt) * 100), -400, 400)].join(','); }
  if (a.k === 'r') return [seq, 'r', I(wrapRy(a.ry), 100)].join(',');   // Phiên 223: rồng hồng
  if (a.k === 'w') return [seq, 'w', I(wrapRy(a.ry), 100), clamp(Math.round(num(a.rg) * 10), 0, 200)].join(',');   // Phiên 224: sói khí vàng của Gậy dạy chó (hướng vồ + tầm vồ, 0,1 m)
  if (a.k === 'p') return [seq, 'p', clamp(Math.floor(num(a.lv)), 0, 9)].join(',');   // Phiên 225: MÌNH bị quái đánh trúng (lv 0-9 = mức đau) → người khác thấy tư thế giật người + nghe tiếng
  return '';
}
const fx = (s) => (s === '' || s == null ? null : num(s) / 10);
/** Giải mã MỘT hành động; hỏng / thiếu / ký tự lạ → null. */
export function unpackAction(s) {
  if (!FIELDS_OK(s)) return null;
  const f = s.split(','), seq = Math.floor(num(f[0], -1)); if (seq < 0 || f.length < 3) return null;
  if (f[1] === 'c' && f.length === 8) { if (!ID_RE.test(f[2])) return null; return { k: 'c', seq, id: f[2], x: num(f[3]) / 10, z: num(f[4]) / 10, ry: num(f[5]) / 100, tx: fx(f[6]), tz: fx(f[7]) }; }
  if (f[1] === 's' && f.length === 6) { if (!SWING_KINDS.includes(f[2])) return null; return { k: 's', seq, kind: f[2], x: num(f[3]) / 10, z: num(f[4]) / 10, ry: num(f[5]) / 100 }; }
  if (f[1] === 'h' && f.length === 11) {
    if (!KEY_RE.test(f[2]) || (f[4] && !ID_RE.test(f[4])) || (f[10] && !TAG_RE.test(f[10]))) return null;
    return { k: 'h', seq, key: f[2], dmg: num(f[3]), id: f[4], i: clamp(Math.floor(num(f[5])), 0, 9), dead: f[6] === '1', nho: f[7] === '1', ax: fx(f[8]), az: fx(f[9]), by: f[10] };
  }
  if (f[1] === 'd' && f.length === 7) { if (!KEY_RE.test(f[2]) || !TAG_RE.test(f[3])) return null; return { k: 'd', seq, key: f[2], owner: f[3], dmg: clamp(num(f[4]), 1, 99999), ax: fx(f[5]), az: fx(f[6]) }; }
  if (f[1] === 'k' && f.length === 5) { if (!KEY_RE.test(f[2]) || !TYPE_RE.test(f[3]) || !MONSTERS[f[3]] || !TAG_RE.test(f[4])) return null; return { k: 'k', seq, key: f[2], type: f[3], killer: f[4] }; }
  if (f[1] === 'f' && f.length === 4) { if (!POSE_MODES.includes(f[2])) return null; return { k: 'f', seq, mode: f[2], tilt: clamp(num(f[3]), -400, 400) / 100 }; }
  if (f[1] === 'r' && f.length === 3) return { k: 'r', seq, ry: num(f[2]) / 100 };   // Phiên 223: rồng hồng
  if (f[1] === 'w' && f.length === 4) return { k: 'w', seq, ry: num(f[2]) / 100, rg: clamp(num(f[3]), 0, 200) / 10 };   // Phiên 224: sói khí vàng
  if (f[1] === 'p' && f.length === 3) return { k: 'p', seq, lv: clamp(Math.floor(num(f[2])), 0, 9) };   // Phiên 225: bị đánh trúng
  return null;
}
/** Giải mã cả chuỗi hành động ('a;b;c'): bỏ hành động hỏng. */
export function unpackActions(str) {
  if (!FIELDS_OK(str) || !str) return [];
  const out = []; for (const part of str.split(';').slice(0, 12)) { const a = unpackAction(part); if (a) out.push(a); } return out;
}

// ---------------------------------------------------------------- quái đang đánh
const windup = (m) => (m.slam ? BOSS_ATTACK_CFG.slamWindup : ATTACK_CFG.windup);
/** Danh sách quái MÌNH đang đánh (m.eng) → chuỗi. Mỗi quái: uid,x,z,ry,%máu,pha gồng 0-9 (0 = không gồng),giậm đất 0/1,loại. Tối đa maxMons, bỏ quái loại lạ. */
export function packMons(list) {
  const out = [];
  for (const m of Array.isArray(list) ? list : []) {
    if (out.length >= COMBAT.maxMons) break;
    if (!m || !MONSTERS[m.type] || !KEY_RE.test(String(m.uid || '')) || !(num(m.oan) > 0)) continue;
    const pct = clamp(Math.ceil(num(m.oan) / Math.max(1, num(m.max, 1)) * 100), 1, 100);
    const ph = num(m.wind) > 0 ? clamp(Math.round((1 - num(m.wind) / windup(m)) * 9), 1, 9) : 0;
    out.push([m.uid, I(m.x, 10), I(m.z, 10), I(wrapRy(m.ry), 100), pct, ph, m.slam ? 1 : 0, m.type].join(','));
  }
  return out.join(';');
}
/** Chuỗi quái → [{ key, x, z, ry, pct, ph, slam, type }]; mục hỏng bị bỏ. */
export function unpackMons(str) {
  if (!FIELDS_OK(str) || !str) return [];
  const out = [];
  for (const part of str.split(';').slice(0, COMBAT.maxMons)) {
    const f = part.split(','); if (f.length !== 8 || !KEY_RE.test(f[0]) || !MONSTERS[f[7]]) continue;
    out.push({ key: f[0], x: num(f[1]) / 10, z: num(f[2]) / 10, ry: num(f[3]) / 100, pct: clamp(num(f[4]), 0, 100), ph: clamp(Math.floor(num(f[5])), 0, 9), slam: f[6] === '1', type: f[7] });
  }
  return out;
}

// ---------------------------------------------------------------- hộp gửi
/**
 * Hộp gửi của MÌNH. push(a, tMs) gán số thứ tự tăng dần (hành động giữ ≤ actKeepMs rồi bỏ khỏi gói); setMons(list); setRoom(name); setPose({ mode, tilt }) (Phiên 222: bay lướt / lao, KHÔNG chiếm chỗ hành động).
 * packet(tMs) → { r, a?, m?, t } nếu đến lúc gửi (có thay đổi và đã ≥ sendMs, hoặc đang có quái / đang bay mà không đổi gì và đã ≥ keepAliveMs), ngược lại null. Quái hết đánh / hết bay → gửi MỘT gói báo hết rồi im.
 */
export function createOutbox() {
  let seq = 0, acts = [], mons = '', room = '', lastAt = -1e9, dirty = false, pose = '', poseOn = false;
  return {
    push(a, tMs = 0) { const s = packAction({ ...a, seq: seq + 1 }); if (!s) return 0; seq++; acts.push({ s, t: tMs }); if (acts.length > COMBAT.keep) acts.shift(); dirty = true; return seq; },
    setMons(list) { const s = packMons(list); if (s !== mons) { mons = s; dirty = true; } },
    setRoom(r) { r = String(r == null ? '' : r); if (r !== room && ROOM_RE.test(r)) { room = r; if (mons || poseOn) dirty = true; } },   // đổi phòng chỉ đáng gửi khi đang có quái / đang bay (không thì người chơi im lặng KHÔNG ghi gì lên /combat)
    setPose(o) {
      const mode = o && ['g', 'd', 'r', 's'].includes(o.mode) ? o.mode : 'n', tilt = Math.round(num(o && o.tilt) * 20) / 20, s = packAction({ k: 'f', seq: 0, mode, tilt });
      if (mode === 'n') { if (poseOn) { pose = s; poseOn = false; dirty = true; } return; }
      if (!poseOn || s !== pose) { pose = s; dirty = true; } poseOn = true;
    },
    get seq() { return seq; },
    packet(tMs) {
      acts = acts.filter((e) => tMs - e.t <= COMBAT.actKeepMs);
      if (!dirty && !mons && !poseOn) return null;
      if (tMs - lastAt < (dirty ? COMBAT.sendMs : COMBAT.keepAliveMs)) return null;
      const list = acts.map((e) => e.s), join = () => (pose ? list.concat(pose) : list).join(';'); let a = join(); while (a.length > COMBAT.maxA && list.length > 1) { list.shift(); a = join(); }
      const p = { r: room }; if (a && a.length <= COMBAT.maxA) p.a = a; if (mons && mons.length <= COMBAT.maxM) p.m = mons;
      dirty = false; lastAt = tMs; if (!poseOn) pose = ''; return { ...p, t: tMs };
    },
  };
}

// ---------------------------------------------------------------- hộp nhận
/** Hộp nhận: take(owner, str) → các hành động MỚI (số thứ tự lớn hơn lần trước), theo thứ tự. Lần đầu thấy người đó chỉ ghi mốc (không phát lại đòn cũ). */
export function createInbox() {
  const last = new Map();
  return {
    take(owner, str, isNew = false) {   // isNew = true: người MỚI xuất hiện sau khi mình đã vào (không phải bản ghi cũ) → nhận luôn các hành động đầu tiên của họ
      const acts = unpackActions(str).sort((a, b) => a.seq - b.seq);
      if (!last.has(owner)) { last.set(owner, acts.length ? acts[acts.length - 1].seq : 0); return isNew ? acts : []; }
      const prev = last.get(owner), fresh = acts.filter((a) => a.seq > prev);
      if (fresh.length) last.set(owner, fresh[fresh.length - 1].seq);
      return fresh;
    },
    forget(owner) { last.delete(owner); },
  };
}

// ---------------------------------------------------------------- bóng quái
/**
 * "Bóng quái": quái của NGƯỜI KHÁC hiện trên máy mình để xem. Đối tượng giống quái thật (đủ trường cho js/scene/farm.js vẽ): x, z, ry, oan/max, wind/slam (vòng đỏ báo đòn), eng, flash, ghost:true.
 * ingest(owner, list, tMs): cập nhật danh sách quái của người đó (quái không còn trong danh sách thì bỏ). step(dt, tMs): nội suy vị trí + bỏ bóng quá hạn. hit/kill/drop/list.
 */
export function createGhosts() {
  const map = new Map(), tomb = new Map(); let n = 0;
  const idOf = (o, k) => o + '|' + k;
  const API = {
    ingest(owner, list, tMs = 0) {
      const keep = new Set();
      for (const q of Array.isArray(list) ? list : []) {
        const id = idOf(owner, q.key); if ((tomb.get(id) || 0) > tMs) continue;
        keep.add(id);
        const T = MONSTERS[q.type], max = 100, real = oanKhiMaxOf(q.type) || 100, wt = q.ph > 0 ? (1 - q.ph / 9) * windup({ slam: q.slam }) : 0;
        let g = map.get(id);
        if (!g) {
          g = { id: ++n, uid: 'g|' + id, owner, key: q.key, type: q.type, ten: T.ten, lv: T.lv, he: T.he, elite: !!T.elite, boss: !!T.boss, x: q.x, z: q.z, ry: q.ry, tx: q.x, tz: q.z, tr: q.ry, oan: q.pct, max, real, predUntil: 0, eng: true, wind: wt, slam: q.slam, flash: 0, ghost: true, seen: tMs };
          map.set(id, g);
        } else { g.tx = q.x; g.tz = q.z; g.tr = q.ry; g.oan = g.predUntil > tMs ? Math.min(g.oan, q.pct) : q.pct; g.wind = wt; g.slam = q.slam; g.seen = tMs; }
        if (g.wind > 0) g.flash = Math.max(g.flash, 0.55);
      }
      for (const [id, g] of [...map]) if (g.owner === owner && !keep.has(id)) map.delete(id);
    },
    step(dt, tMs = 0) {
      const k = 1 - Math.exp(-clamp(num(dt), 0, 0.25) * 8);
      for (const [id, g] of [...map]) {
        if (tMs - g.seen > COMBAT.ghostTtlMs) { map.delete(id); continue; }
        if (Math.hypot(g.tx - g.x, g.tz - g.z) > 12) { g.x = g.tx; g.z = g.tz; } else { g.x += (g.tx - g.x) * k; g.z += (g.tz - g.z) * k; }
        let d = (g.tr - g.ry) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; g.ry += d * k;
        g.flash = Math.max(0, g.flash - dt);
      }
      for (const [id, t] of [...tomb]) if (t <= tMs) tomb.delete(id);
    },
    hit(owner, key) { return map.get(idOf(owner, key)) || null; },
    kill(owner, key, tMs = 0) { const id = idOf(owner, key); tomb.set(id, tMs + COMBAT.tombMs); return map.delete(id); },
    drop(owner) { for (const [id, g] of [...map]) if (g.owner === owner) map.delete(id); },
    list() { return [...map.values()]; },
    get size() { return map.size; },
  };
  return API;
}
