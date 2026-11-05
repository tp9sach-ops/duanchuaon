// NPC trong chùa (Phiên 14g): thầy Trụ trì (chánh điện), thầy Tri khách (trước Nhà Khách), cư sĩ vườn thiền.
// DỮ LIỆU + LOGIC THUẦN (không three.js, có test). Bấm vào NPC → nhân vật đi tới điểm đứng → NPC nói một câu (bong bóng + thông báo),
// mỗi NPC tặng 1 hạt sen mỗi ngày (giá trị TẠM, chờ ptg duyệt). Cảnh 3D: js/scene/npc.js; giao diện: js/ui/npc.js.
import { addCircle } from './layout.js';
import './outside.js';   // đăng ký vùng đi bộ ngoài cổng (dân làng đứng ngoài chùa)

/** Mỗi lời ≤ 80 ký tự (giới hạn bong bóng của avatar). Lời do dự án tự soạn, mang tính nhắc nhở nhẹ nhàng, không bói toán. */
const TEMPLE_NPCS = [
  { id: 'truru', ten: 'Thầy Trụ trì', color: 'casa', hair: 'troc', beard: 'bac', x: 2.6, z: -40.6, ry: 0, stand: { x: 2.0, z: -37.6 },
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

/** Dân làng ngoài chùa (Phiên 17). Cùng cách hoạt động với NPC trong chùa. scale < 1 = trẻ em. */
export const VILLAGERS = [
  { id: 'bacnong', ten: 'Bác Hai nông dân', color: 'nau', hair: 'troc', x: -10, z: 78, ry: Math.PI / 2, stand: { x: -7.5, z: 78 },
    lines: [
      'Chào cháu. Mùa này lúa trổ đòng, nhờ trời thuận mưa hòa.',
      'Sáng nào bác cũng lên chùa thắp nén nhang rồi mới ra đồng.',
      'Làm ruộng cũng như tu: gieo đúng lúc thì gặt đúng mùa.',
      'Cháu cứ đi thẳng ra chợ làng, chiều có nhiều người lắm.',
      'Muốn nghe thác thì rẽ phải ở ngã ba, đi hết đường mòn.',
      'Muốn vào rừng thông thì rẽ trái. Nhớ mang theo ngụm nước nhé.',
    ] },
  { id: 'cohoa', ten: 'Cô Lan bán hoa', color: 'do', hair: 'bui', x: -19, z: 123.8, ry: 0, stand: { x: -19, z: 126.5 },
    lines: [
      'Hoa sen, hoa cúc, hoa huệ đây. Mua một bó dâng Phật nhé?',
      'Hoa tươi cắt từ sáng sớm, còn đọng sương đấy.',
      'Dâng hoa không cần nhiều, cốt ở tấm lòng thành.',
      'Ở làng này ai cũng quý chùa Diệu Giang lắm.',
      'Sen cô hái ở đầm sau làng, thơm lắm. Cháu ngửi thử xem.',
      'Chúc cháu một ngày bình an, hoa nở cả đường đi.',
    ] },
  { id: 'embe', ten: 'Bé Tí chăn trâu', color: 'lam', hair: 'bui', scale: 0.7, x: 11, z: 95, ry: -Math.PI / 2, stand: { x: 9, z: 95 },
    lines: [
      'Cháu chào anh chị ạ! Cháu đang đi tìm con trâu của ông.',
      'Trâu nhà cháu hiền lắm, nó thích ăn cỏ ven đường mòn.',
      'Anh chị có thấy con diều của cháu không? Nó bay lên chùa rồi.',
      'Cháu thích nghe chuông chùa, nghe xong thấy vui vui.',
      'Ra thác chơi mát lắm, nhưng đừng lội xuống sâu nhé!',
    ] },
  { id: 'ongcu', ten: 'Ông Ba gốc đa', color: 'xam', hair: 'troc', beard: 'bac', x: -4, z: 129.6, ry: Math.PI / 2, stand: { x: -4, z: 126.6 },
    lines: [
      'Gốc đa này già hơn cả làng. Ông ngồi đây nghe chuyện đời.',
      'Người ta đi rồi đến, cây đa cứ đứng yên mà thấy hết.',
      'Sống chậm lại một nhịp, mọi chuyện sẽ tự êm.',
      'Hồi xưa chùa chỉ là gian tranh nhỏ, nay khang trang thế này.',
      'Nghe ông: gặp ai cũng chào, ăn ở hiền thì phúc đến.',
    ] },
  { id: 'tieuphu', ten: 'Chú Sáu tiều phu', color: 'nau', hair: 'troc', x: -101, z: 83, ry: 0, stand: { x: -100, z: 86 },
    lines: [
      'Chú chỉ nhặt cành khô thôi, cây sống để lại cho rừng.',
      'Rừng thông nghe gió reo như tiếng kinh, cháu có thấy không?',
      'Đường mòn phía Đông thẳng tới thác nước, mát lắm.',
      'Sương sớm trong rừng lạnh. Mặc ấm vào nhé cháu.',
      'Gốc cổ thụ kia đã mấy trăm tuổi, đừng khắc tên lên thân cây.',
    ] },
  { id: 'haithuoc', ten: 'Cô Mai hái thuốc', color: 'trang', hair: 'bui', x: 93, z: 115, ry: Math.PI, stand: { x: 93, z: 112 },
    lines: [
      'Cô hái lá thuốc nam bên suối, ngày nào cũng vài rổ.',
      'Nước thác trong và mát, rửa mặt xong thấy nhẹ cả đầu.',
      'Cô tin một giấc ngủ ngon là thang thuốc quý nhất.',
      'Tiếng thác nghe lâu thì tâm cũng lắng. Cháu thử đứng nghe đi.',
      'Đừng hái hoa dại ven bờ nhé, để ong bướm còn chỗ ghé.',
    ] },
];

/** Mọi nhân vật có thể thưa chuyện: NPC trong chùa + dân làng. */
export const NPCS = [...TEMPLE_NPCS, ...VILLAGERS];

/** Hoạt động tại các điểm cảnh (Phiên 17): bấm vào cảnh → đi tới → mô tả việc làm + 1 hạt sen/ngày. Không có nhân vật; pick = khối cầu bấm được. id trùng PLACES nếu có. */
export const ACTS = [
  { id: 'gieng', ten: 'Giếng làng', act: true, x: 10, z: 127, stand: { x: 10, z: 123.8 }, pick: { c: [10, 0.8, 127], r: 1.8 },
    lines: ['Bạn kéo gầu lên: nước giếng trong và mát lạnh.', 'Một gầu nước mát rửa tay, lòng cũng nhẹ đi.', 'Nước giếng làng ngọt thanh, uống một ngụm là tỉnh người.'] },
  { id: 'dalang', ten: 'Gốc đa làng', act: true, x: 0, z: 131, stand: { x: 0, z: 127.6 }, pick: { c: [0, 3, 131], r: 3.2 },
    lines: ['Bạn ngồi dưới gốc đa hóng mát, tiếng ve rền rĩ xa xa.', 'Gió qua tán đa nghe như ai thì thầm kể chuyện xưa.', 'Dưới gốc đa, mọi bước chân vội vã đều chậm lại.'] },
  { id: 'thacnuoc', ten: 'Thác nước', act: true, x: 106, z: 104, stand: { x: 95, z: 104 }, pick: { c: [110, 6, 104], r: 9 },
    lines: ['Hơi nước mát phả vào mặt, tiếng thác át hết ồn ào trong lòng.', 'Bạn đứng lặng nghe thác đổ. Nước cứ đi, núi cứ đứng yên.', 'Cầu vồng nhỏ hiện lên trong làn hơi nước, đẹp lạ.'] },
  { id: 'hoca', ten: 'Hồ cá chép', act: true, x: 60, z: 10, stand: { x: 50, z: 10 }, pick: { c: [58, 0.2, 10], r: 5 },
    lines: ['Bạn rải một nhúm thức ăn, đàn cá chép đỏ quây lại đớp mồi.', 'Cá bơi lượn dưới lá sen, mặt nước loang những vòng tròn nhỏ.', 'Nhìn cá bơi một lát, tâm cũng thong thả theo.'] },
  { id: 'vuonthien', ten: 'Vườn thiền', act: true, x: -62, z: -20, stand: { x: -54, z: -20 }, pick: { c: [-62, 0.3, -20], r: 5 },
    lines: ['Bạn cầm cây cào, kéo từng đường sỏi chậm rãi.', 'Những vòng sóng trên sỏi như vòng tròn của hơi thở.', 'Đứng giữa vườn đá, không cần nghĩ gì cả.'] },
  { id: 'trathat', ten: 'Trà thất', act: true, x: -64, z: 8, stand: { x: -64, z: 13.5 }, pick: { c: [-64, 2, 8], r: 5 },
    lines: ['Bạn nhấp một chén trà sen, hương thơm dịu lan khắp miệng.', 'Chén trà ấm đặt trong tay, một ngày dường như chậm lại.', 'Hơi trà bốc lên mờ cả mặt kính. Bình yên là đây.'] },
  { id: 'quanam', ten: 'Quan Âm đài', act: true, x: 0, z: -63, stand: { x: 0, z: -59.5 }, pick: { c: [0, 6, -63], r: 5 },
    lines: ['Bạn chắp tay hướng về Quan Âm, lòng nhớ những người thương.', 'Ngài nhìn xuống với ánh mắt hiền từ. Bạn cúi đầu thầm niệm.', 'Một nén hương lòng gửi tới những ai đang cần được che chở.'] },
  { id: 'luongdinh', ten: 'Lương đình giữa hồ', act: true, x: 60, z: 10, stand: { x: 60, z: 10 }, pick: { c: [60, 2.5, 10], r: 3 },
    lines: ['Bạn ngồi trong lương đình giữa hồ, gió mát từ mặt nước lùa vào.', 'Từ đây nhìn mái chùa nhỏ lại, chỉ còn tiếng nước chảy.', 'Một chiếc lá sen khẽ nghiêng, giọt sương lăn xuống mặt hồ.'] },
];

export const NPC_R = 0.5;
export const REWARD = 1;   // hạt sen mỗi NPC mỗi ngày (TẠM)
let done = false;
export function registerNpcs() { if (done) return; done = true; NPCS.forEach((n) => addCircle({ x: n.x, z: n.z, r: NPC_R })); }
registerNpcs();

/** Tất cả đối tượng bấm-để-thưa-chuyện: nhân vật (NPCS) và hoạt động tại điểm cảnh (ACTS). */
export const TALKERS = [...NPCS, ...ACTS];
export const npcById = (id) => TALKERS.find((n) => n.id === id) || null;

/** Spot kiểu chương (spots.js) cho từng NPC để dùng chung cơ chế bấm → đi tới → tới nơi. */
export const npcSpot = (n) => (n.act
  ? { id: 'npc-' + n.id, num: '', label: n.ten, npc: n.id, act: true, look: [n.x, 3, n.z], stand: n.stand, r: 2.5, face: [n.x, 1, n.z], pick: n.pick }
  : { id: 'npc-' + n.id, num: '', label: n.ten, npc: n.id, look: [n.x, 2.4, n.z], stand: n.stand, r: 2.2, face: [n.x, 1, n.z], pick: { c: [n.x, (n.hy || 0) + 1.0 * (n.scale || 1), n.z], r: 1.0 * (n.scale || 1) } });

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
