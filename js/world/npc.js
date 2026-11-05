// NPC trong chùa (Phiên 14g): thầy Trụ trì (chánh điện), thầy Tri khách (trước Nhà Khách), cư sĩ vườn thiền.
// DỮ LIỆU + LOGIC THUẦN (không three.js, có test). Bấm vào NPC → nhân vật đi tới điểm đứng → NPC nói một câu (bong bóng + thông báo),
// mỗi NPC tặng 1 hạt sen mỗi ngày (giá trị TẠM, chờ ptg duyệt). Cảnh 3D: js/scene/npc.js; giao diện: js/ui/npc.js.
import { addCircle } from './layout.js';

/** Mỗi lời ≤ 80 ký tự (giới hạn bong bóng của avatar). Lời do dự án tự soạn, mang tính nhắc nhở nhẹ nhàng, không bói toán. */
export const NPCS = [
  { id: 'truru', ten: 'Thầy Trụ trì', color: 'vang', hair: 'troc', x: 2.6, z: -40.6, ry: 0, stand: { x: 2.0, z: -37.6 },
    lines: [
      'A Di Đà Phật. Thấy bạn ghé chùa, lòng thầy cũng nhẹ đi.',
      'Thở vào biết mình đang thở vào, thở ra biết mình đang thở ra.',
      'Việc nhỏ làm bằng lòng tử tế cũng là một nén nhang.',
      'Đừng vội tìm bình an ở xa; nó ở ngay nơi bạn dừng lại.',
      'Mỗi sáng thức dậy, hỏi mình hôm nay có thể giúp được ai.',
      'Ngồi yên một lát, mây tự tan. Đừng đuổi theo suy nghĩ.',
      'Lời nói dịu dàng là món quà không tốn gì mà quý nhất.',
      'Cảm ơn bạn đã đến. Chúc bạn một ngày an lạc.',
    ] },
  { id: 'trikhach', ten: 'Thầy Tri khách', color: 'nau', hair: 'troc', x: 34.5, z: -19.5, ry: 0, stand: { x: 34.5, z: -16.4 },
    lines: [
      'Mời bạn vào Nhà Khách uống chén trà nóng nhé.',
      'Chánh điện ở phía trước, cứ đi thẳng lối giữa rồi lên bậc thềm.',
      'Vào điện nhớ bước nhẹ, nói khẽ, cho người khác được yên lòng.',
      'Chỉ giúp người khác một câu đường cũng là việc thiện.',
      'Vườn thiền phía Tây, hồ cá phía Đông, bạn cứ thong thả dạo.',
      'Trà thất phía Tây có chén trà ấm đang chờ bạn.',
      'Quan Âm đài ở sau chánh điện, đi theo hành lang là tới.',
    ] },
  { id: 'cusi', ten: 'Cư sĩ vườn thiền', color: 'lam', hair: 'bui', x: -58.5, z: -23, ry: Math.PI / 2, stand: { x: -57, z: -20.5 },
    lines: [
      'Sỏi này tôi cào mỗi sáng. Cào xong, lòng cũng phẳng như sỏi.',
      'Hòn đá ngồi yên cả trăm năm mà chẳng than mệt.',
      'Nhìn một hòn đá thật lâu, bạn sẽ nghe được chính mình.',
      'Đừng cào cho thật thẳng; đường lượn cũng đẹp.',
      'Gió qua tre nghe như tiếng kinh, bạn thấy không?',
    ] },
];

export const NPC_R = 0.5;
export const REWARD = 1;   // hạt sen mỗi NPC mỗi ngày (TẠM)
let done = false;
export function registerNpcs() { if (done) return; done = true; NPCS.forEach((n) => addCircle({ x: n.x, z: n.z, r: NPC_R })); }
registerNpcs();

export const npcById = (id) => NPCS.find((n) => n.id === id) || null;

/** Spot kiểu chương (spots.js) cho từng NPC để dùng chung cơ chế bấm → đi tới → tới nơi. */
export const npcSpot = (n) => ({ id: 'npc-' + n.id, num: '', label: n.ten, npc: n.id, look: [n.x, 2.4, n.z], stand: n.stand, r: 2.2, face: [n.x, 1, n.z], pick: { c: [n.x, (n.hy || 0) + 1.0, n.z], r: 1.0 } });

/** Ngày địa phương dạng YYYY-MM-DD (khóa tặng quà theo ngày). */
export const dayKey = (now = Date.now()) => { const d = new Date(now), p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng); dữ liệu hỏng → trạng thái trống. */
export function loadNpcState(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const ok = (x) => x && typeof x === 'object' && !Array.isArray(x);
  const last = {}, n = {};
  if (ok(o)) {
    for (const k of Object.keys(ok(o.last) ? o.last : {})) if (npcById(k) && typeof o.last[k] === 'string') last[k] = o.last[k].slice(0, 10);
    for (const k of Object.keys(ok(o.n) ? o.n : {})) if (npcById(k) && Number.isFinite(+o.n[k])) n[k] = Math.max(0, Math.min(1e6, Math.floor(+o.n[k])));
  }
  return { last, n };
}

/** Một lần thưa chuyện: trả { line, reward, state } (state mới). Lời xoay vòng theo số lần; quà chỉ khi chưa nhận hôm nay. */
export function talk(state, id, now = Date.now()) {
  const npc = npcById(id); if (!npc) return null;
  const st = loadNpcState(state), c = st.n[id] || 0, today = dayKey(now), reward = st.last[id] === today ? 0 : REWARD;
  st.n[id] = c + 1; if (reward) st.last[id] = today;
  return { npc, line: npc.lines[c % npc.lines.length], reward, state: st };
}
