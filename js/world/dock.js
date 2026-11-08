// Cụm nút thao tác góc PHẢI-DƯỚI + lời chỉ chỗ bấm + nội dung Túi đồ (Phiên 62). LOGIC THUẦN (không DOM, có test): tests/dock.test.mjs. Giao diện: js/ui/dock.js, js/ui/bag.js.
// Mục đích: người chơi điện thoại chỉ cần nhìn một chỗ (ngón cái phải) cho nhảy / kỹ năng / thả cầu / bấm / thu cá / phóng sinh / túi đồ.
import { orbById, speciesById, ORBS } from './fishing.js';
import { furnitureById } from './furniture.js';
import { houseLevel } from './land.js';
import { KHINH_TEN, MAX_BAC } from './skills.js';

const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const num = (x) => (Number.isFinite(+x) ? Math.max(0, Math.floor(+x)) : 0);

/** Chữ chỉ chỗ bấm: hiện MỘT LẦN cạnh nút tương ứng (nhớ trong localStorage 'lgt.dockhint'). */
export const HINTS = {
  tap: 'Hoa sen nở thì bấm nút này NGAY!',
  cast: 'Bấm đây để thả cầu câu cá (đang đứng sát mép nước).',
  thu: 'Bấm “Thu cá” để nuôi cá trong ao riêng.',
  nhay: 'Bấm “Nhảy” để bay lên (Khinh thân).',
  kynang: 'Bạn đủ điều kiện luyện bậc kế — bấm vào đây.',
  tui: 'Túi đồ: xem bạn đang có những gì.',
  khieng: 'Có vật khiêng được ngay đây — bấm “Khiêng”. Vật nặng cần sức mạnh cao hơn.',
  nem: 'Bấm “Ném” để ném vật ra phía trước mặt.',
  da: 'Bấm “Ném đá” khi yêu quái còn xa. Khi nó gồng (vùng đỏ trên đất), chạy ra ngoài vùng đỏ!',
  thuong: 'Lại gần yêu quái rồi bấm “Thương” để đâm — mạnh hơn ném đá.',
  nemyq: 'Bạn đủ mạnh để nhấc cả yêu quái lên ném!',
};
const HINT_ORDER = ['tap', 'da', 'thuong', 'nemyq', 'cast', 'thu', 'nem', 'khieng', 'nhay', 'kynang', 'tui'];

/**
 * Các nút cần hiện, xếp từ DƯỚI lên (nút đầu = gần ngón cái nhất).
 * c = { free (đang đi lại bình thường), khinh (bậc), canTrain, water (đứng sát mép nước, ngoài nhà), fish: { phase: 'idle'|'wait'|'lotus'|'caught', hasOrb, cracked, text }, carry: { holding, heldName, near }, yq: { active, ten, canThrow } }.
 * Mỗi nút { id, label, big?, hot?, say? }. Đang ngồi/thiền/lạy → không có nút nào.
 */
export function dockButtons(c = {}) {
  const k = isObj(c) ? c : {}, f = isObj(k.fish) ? k.fish : {}, out = [];
  if (!k.free) return out;
  if (f.phase === 'wait' || f.phase === 'lotus') return [{ id: 'tap', label: 'Bấm!', big: true, hot: f.phase === 'lotus', say: String(f.text || '') }];
  if (f.phase === 'caught') return [{ id: 'thu', label: 'Thu cá', big: true, say: String(f.text || '') }, { id: 'phong', label: 'Phóng sinh', say: '' }];
  const cr = isObj(k.carry) ? k.carry : {};
  if (cr.holding) return [{ id: 'nem', label: 'Ném', big: true, say: cr.heldName ? `Đang khiêng: ${cr.heldName}` : '' }, { id: 'ha', label: 'Đặt xuống' }];   // tay đang khiêng vật: chỉ Ném / Đặt xuống
  if (cr.near) out.push({ id: 'khieng', label: 'Khiêng', big: true, say: `Gần: ${cr.near}` });
  const yq = isObj(k.yq) ? k.yq : {};
  if (yq.active) { out.push({ id: 'da', label: 'Ném đá', big: true, say: yq.ten ? `${yq.ten} đang ở làng!` : '' }, { id: 'thuong', label: 'Thương' }); if (yq.canThrow) out.push({ id: 'nemyq', label: 'Ném yêu quái' }); }
  if (k.water && !yq.active) out.push({ id: 'cast', label: f.cracked ? 'Sửa cầu' : f.hasOrb ? 'Thả cầu' : 'Mua cầu', big: true, say: f.text ? String(f.text) : '' });
  if (num(k.khinh) > 0) { out.push({ id: 'nhay', label: 'Nhảy', big: !k.water && !yq.active }); out.push({ id: 'kynang', label: 'Kỹ năng', hot: !!k.canTrain }); }
  else out.push({ id: 'nhay', label: 'Nhảy', locked: true });   // chưa mở Khinh thân: vẫn hiện nút mờ, bấm vào được chỉ cách mở (người mới không phải đoán)
  out.push({ id: 'tui', label: 'Túi đồ' });
  return out;
}

/** Chọn lời chỉ chỗ bấm cho nút đang hiện mà người chơi chưa từng được chỉ. seen = mảng id đã thấy. Trả { id, text } | null. */
export function pickHint(buttons, seen = []) {
  const have = new Set(Array.isArray(buttons) ? buttons.map((b) => b.id) : []), done = new Set(Array.isArray(seen) ? seen : []);
  for (const id of HINT_ORDER) {
    if (!have.has(id) || done.has(id)) continue;
    const b = buttons.find((x) => x.id === id); if (id === 'kynang' && !b.hot) continue;
    return { id, text: HINTS[id] };
  }
  return null;
}
/** Đọc danh sách đã chỉ (chuỗi JSON hoặc mảng); hỏng → []. */
export function loadSeen(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  return Array.isArray(o) ? [...new Set(o.filter((s) => typeof s === 'string' && HINTS[s]))] : [];
}

/** Nội dung Túi đồ khi ĐANG Ở NGOÀI NHÀ (chỉ để xem). ctx = { sen, la, fish, furni, khinh, land }. Trả [{ title, rows: [{ ten, mo }] }]. */
export function bagSections(ctx = {}) {
  const c = isObj(ctx) ? ctx : {}, f = isObj(c.fish) ? c.fish : {}, fu = isObj(c.furni) ? c.furni : {}, S = [];
  S.push({ title: 'Tiền', rows: [{ ten: 'Hạt sen', mo: String(num(c.sen)) }, { ten: 'Lá bồ đề', mo: String(num(c.la)) }] });
  const orbs = isObj(f.orbs) ? f.orbs : {}, orbRows = ORBS.filter((o) => orbs[o.id] !== undefined).map((o) => {
    const d = num(orbs[o.id]); return { ten: o.ten, mo: `${d <= 0 ? 'đã nứt' : `còn ${d}/${o.ben} lần`}${f.sel === o.id ? ' · đang dùng' : ''}` };
  });
  S.push({ title: 'Quả cầu câu cá', rows: orbRows.length ? orbRows : [{ ten: 'Chưa có quả cầu nào', mo: 'Cầu Gỗ 50 hạt sen — mua ở nút “Mua cầu” khi đứng sát nước' }] });
  const cnt = {}; for (const p of Array.isArray(f.pond) ? f.pond : []) if (isObj(p) && speciesById(p.sp)) cnt[p.sp] = (cnt[p.sp] || 0) + 1;
  const pondRows = Object.keys(cnt).map((id) => ({ ten: speciesById(id).ten, mo: '× ' + cnt[id] }));
  S.push({ title: 'Ao cá riêng', rows: pondRows.length ? pondRows : [{ ten: 'Chưa có con nào', mo: 'Câu được cá rồi bấm “Thu cá”' }] });
  const owned = isObj(fu.owned) ? fu.owned : {}, placed = Array.isArray(fu.placed) ? fu.placed : [];
  const fRows = Object.keys(owned).filter((id) => furnitureById(id) && num(owned[id]) > 0).map((id) => ({ ten: furnitureById(id).ten, mo: `× ${num(owned[id])} (đã đặt ${placed.filter((p) => p && p.id === id).length})` }));
  S.push({ title: 'Nội thất', rows: fRows.length ? fRows : [{ ten: 'Chưa có món nào', mo: 'Mua ở “Cửa hàng” khi đang ở trong nhà' }] });
  const kb = Math.min(MAX_BAC, num(c.khinh)), own = isObj(c.land) && isObj(c.land.own) ? c.land.own : null;
  S.push({ title: 'Thân pháp & nhà', rows: [{ ten: 'Sức mạnh', mo: c.strength ? `${num(c.strength.value)} · ${String(c.strength.tier || '')} · khiêng tối đa ${num(c.strength.limit)} kg` : 'chưa có' }, { ten: 'Khinh thân', mo: kb > 0 ? `bậc ${kb}/${MAX_BAC} · ${KHINH_TEN[kb]}` : 'chưa mở' }, { ten: 'Nhà', mo: own ? houseLevel(own.lv).ten : 'chưa có đất' }] });
  return S;
}
