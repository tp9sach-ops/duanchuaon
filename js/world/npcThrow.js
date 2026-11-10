// Ném NPC (Phiên 89): đứng gần dân làng/NPC ngoài chùa → nút "Ném NPC": nhấc họ lên ném THẲNG TRƯỚC MẶT mình. LOGIC THUẦN (có test: tests/npcthrow.test.mjs).
// NPC rơi an toàn, ngồi lại một chút rồi tự đi/bay về chỗ cũ. Không mất hạt sen; có hồi chiêu mỗi NPC. KHÔNG ném trong khuôn viên chùa (cùng luật ném người).
import { throwRange, landing, inTemple, THROW_COOLDOWN_S, PICK_RADIUS } from './strength.js';

export const NPC_THROW_NEAR = PICK_RADIUS;   // đứng cách NPC tối đa bao nhiêu m thì ném được
export const MIN_RANGE = 3;                  // người yếu vẫn ném được ít nhất 3 m (mạnh hơn → xa hơn, tối đa 40 m)
export const FLY_S = 1.2, REST_S = 3.5, BACK_S = 2.2, PEAK = 2.6;
const num = (v) => (Number.isFinite(+v) ? +v : 0);

/** NPC gần nhất trong tầm: list = [{id,ten,x,z,...}] → phần tử hoặc null. */
export function nearestNpc(list, x, z, maxD = NPC_THROW_NEAR) {
  let best = null, bd = maxD; for (const p of Array.isArray(list) ? list : []) { if (!p || p.held) continue; const d = Math.hypot(num(p.x) - x, num(p.z) - z); if (d <= bd) { bd = d; best = p; } }
  return best;
}
/** Khối lượng NPC (kg) theo tỉ lệ thân hình (trẻ em nhẹ hơn). */
export const npcKg = (scale) => Math.round(50 * Math.max(0.4, Math.min(1.5, num(scale) || 1)));

/**
 * Kế hoạch một cú ném. in: { att: {str,x,z}, ry, npc: {id,x,z,scale}, cd: { [id]: giây còn lại } }.
 * Trả { ok, reason: ''|'invalid'|'temple'|'cooldown', wait, range, land: {x,z,dist}, from: {x,z} }.
 */
export function planNpcThrow({ att, ry, npc, cd = {} } = {}) {
  if (!att || !npc || !Number.isFinite(+att.x) || !Number.isFinite(+att.z) || !Number.isFinite(+npc.x) || !Number.isFinite(+npc.z)) return { ok: false, reason: 'invalid', wait: 0, range: 0, land: null, from: null };
  if (inTemple(att.x, att.z) || inTemple(npc.x, npc.z)) return { ok: false, reason: 'temple', wait: 0, range: 0, land: null, from: null };
  const w = num(cd && cd[npc.id]); if (w > 0) return { ok: false, reason: 'cooldown', wait: Math.ceil(w), range: 0, land: null, from: null };
  const range = Math.max(MIN_RANGE, throwRange(num(att.str), npcKg(npc.scale))), land = landing(npc.x, npc.z, num(ry), range);
  return { ok: true, reason: '', wait: 0, range, land, from: { x: npc.x, z: npc.z } };
}
export const reasonText = (r, wait = 0) => (r === 'temple' ? 'Đây là chốn chùa chiền — hãy ra ngoài cổng rồi hãy đùa nhé.' : r === 'cooldown' ? `Bạn vừa ném xong, đợi ${wait} giây nữa nhé.` : 'Không ném được.');

/** Bắt đầu một cú ném (trả trạng thái bay). */
export const startFlight = (from, to, now = 0) => ({ from: { x: num(from.x), z: num(from.z) }, to: { x: num(to.x), z: num(to.z) }, t0: now });
/**
 * Tư thế NPC tại thời điểm `now` (giây): { phase: 'fly'|'rest'|'back'|'done', x, y, z, spin (rad), sit (bool) }.
 * fly: vòng cung (cao PEAK m) + xoay; rest: nằm/ngồi tại chỗ rơi; back: đi lướt về chỗ cũ `home`; done: xong (trả về trạng thái bình thường).
 */
export function poseAt(th, now, home) {
  const t = num(now) - num(th.t0), h = home || th.from;
  if (t < FLY_S) { const k = Math.max(0, t) / FLY_S; return { phase: 'fly', x: th.from.x + (th.to.x - th.from.x) * k, z: th.from.z + (th.to.z - th.from.z) * k, y: Math.sin(Math.PI * k) * PEAK, spin: k * Math.PI * 4, sit: false }; }
  if (t < FLY_S + REST_S) return { phase: 'rest', x: th.to.x, z: th.to.z, y: 0, spin: 0, sit: true };
  if (t < FLY_S + REST_S + BACK_S) { const k = (t - FLY_S - REST_S) / BACK_S; return { phase: 'back', x: th.to.x + (h.x - th.to.x) * k, z: th.to.z + (h.z - th.to.z) * k, y: 0, spin: 0, sit: false }; }
  return { phase: 'done', x: h.x, z: h.z, y: 0, spin: 0, sit: false };
}
export const markNpc = (cd, id) => ({ ...(cd && typeof cd === 'object' ? cd : {}), [String(id)]: THROW_COOLDOWN_S });
