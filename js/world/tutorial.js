// Sổ tay hướng dẫn cách chơi + "việc nên làm kế tiếp" (Phiên 39). LOGIC THUẦN (không DOM, không three.js, có test: tests/tutorial.test.mjs).
// Giao diện: js/ui/tutorial.js. Mọi con số lấy từ merit.js / land.js (một nguồn duy nhất) nên đổi giá ở đó là chữ hướng dẫn đổi theo.
// Chỉ nói những gì ĐÃ chạy trong bản này; tính năng chưa làm (phóng sinh, nội thất) ghi rõ "sắp có", không giả vờ.
import { SEN_PER_LA, LAND_LA, MED_SECONDS_PER_SEN, DAILY_CAP } from './merit.js';
import { HOUSE_LEVELS, MAX_LV, houseLevel, upgradeCost, XOM_SIZE } from './land.js';

/** Chỗ đi tới: { npc: id } (đi tới NPC), { place: id } (đi tới nơi trong bản đồ), { tap: id } (chỉ nút cần bấm). */
const npc = (id) => ({ npc: id }), place = (id) => ({ place: id }), tap = (id) => ({ tap: id });

const L1 = HOUSE_LEVELS[1], L2 = HOUSE_LEVELS[2], L3 = HOUSE_LEVELS[3];

/** Các chủ đề. steps[i] = { text, go? , soon? }. Thứ tự = thứ tự nên đọc. */
export const TOPICS = [
  { id: 'batdau', ten: 'Cách chơi', moTa: 'Đi lại, bản đồ, nút bấm',
    steps: [
      { text: 'Bấm vào đất để nhân vật đi tới đó. Trên máy tính dùng phím W A S D hoặc mũi tên; trên điện thoại dùng cần điều khiển bên trái.' },
      { text: 'Kéo để xoay camera, cuộn hoặc chụm hai ngón để phóng to thu nhỏ. Bấm vào người, tượng, lư hương, cây để tương tác.' },
      { text: 'Bản đồ nhỏ ở góc trái cho thấy bạn (chấm sáng) và mọi nơi. Bấm vào bản đồ nhỏ để mở bản đồ lớn, rồi bấm vào một nơi hoặc một người để được dẫn tới.', go: tap('bando') },
      { text: 'Nút “Nhiệm vụ” liệt kê việc nên làm. Mỗi nhiệm vụ có nút “Dẫn đường”: nhân vật tự đi tới chỗ cần làm.', go: tap('nhiemvu') },
      { text: 'Cốt truyện mở đầu: gặp chú tiểu Minh ở ngoài cổng chùa, rồi vào chánh điện gặp thầy Trụ trì.', go: npc('chutieu') },
    ] },
  { id: 'kiemsen', ten: 'Kiếm hạt sen', moTa: 'Công đức = hạt sen',
    steps: [
      { text: 'Hạt sen là công đức của bạn (số cạnh biểu tượng hoa sen ở góc phải-trên). Vào chánh điện rồi bấm “Dâng lễ”, “Lạy Phật”, “Tụng kinh”, “Tràng hạt”, “Thiền”.', go: place('chanhdien') },
      { text: `Ngồi thiền yên ${Math.round(MED_SECONDS_PER_SEN / 60)} phút được 1 hạt sen (tối đa ${DAILY_CAP.thien} hạt mỗi ngày). Treo máy ngồi thiền vẫn tính.`, go: tap('thien') },
      { text: 'Mỗi người trong chùa và ngoài làng tặng 1 hạt sen mỗi ngày khi bạn trò chuyện. Hoa sen vàng phát sáng trong sân cho thêm lộc.', go: place('sanchua') },
      { text: 'Làm nhiệm vụ hằng ngày và hành trình để nhận thêm hạt sen và điểm công hạnh (lên cấp).', go: tap('nhiemvu') },
    ] },
  { id: 'doila', ten: 'Đổi lá bồ đề', moTa: `${SEN_PER_LA} hạt sen = 1 lá`,
    steps: [
      { text: `Lá bồ đề dùng để mua đất và nâng cấp nhà. ${SEN_PER_LA} hạt sen đổi được 1 lá bồ đề.` },
      { text: 'Đến gặp Thầy Tri khách (trước Nhà Khách, phía Đông chánh điện) và bấm vào thầy: bảng “Đổi lá bồ đề” tự mở.', go: npc('trikhach') },
      { text: 'Chọn “Đổi 1 lá”, “Đổi 5 lá” hoặc “Đổi tối đa”. Số lá hiện cạnh số hạt sen. Hạt sen đã đổi vẫn được tính vào điểm xếp hạng.' },
    ] },
  { id: 'xaydung', ten: 'Mua đất và xây nhà', moTa: `${LAND_LA} lá = một lô đất + nhà`,
    steps: [
      { text: `Cần ${LAND_LA} lá bồ đề cho một lô đất. Mua xong bạn được tặng ngay một căn nhà trống thô sơ.` },
      { text: 'Ra làng, đi qua chợ, xuống đường phía Nam tới đầu khu nhà ở và gặp Bác Tư khu phố. Bấm vào bác để mở bảng đất ở.', go: npc('bacphuong') },
      { text: `Mỗi xóm có tối đa ${XOM_SIZE} nhà. Chọn một lô trống rồi bấm “Mua lô”. Nhà thứ ${XOM_SIZE + 1} sẽ ở xóm mới.`, go: place('xom') },
      { text: `Nâng cấp nhà (trả chênh lệch giá, được nhảy cấp): ${L1.ten} ${L1.gia} lá · ${L2.ten} ${L2.gia} lá · ${L3.ten} ${L3.gia} lá (tính từ nhà trống).` },
      { text: 'Đứng gần cửa nhà, bấm nút “Vào nhà” để vào bên trong, “Ra ngoài” để ra. Nút “Dẫn tôi tới nhà” trong bảng của Bác Tư đưa bạn về trước cửa.', go: place('xom') },
      { text: 'Mua nội thất và mời khách tới tham quan, mở tiệc: đang làm, sắp có.', soon: true },
    ] },
  { id: 'phongsinh', ten: 'Phóng sinh', moTa: 'Hồ cá chép — sắp có',
    steps: [
      { text: 'Hồ cá chép nằm ở phía Đông sân chùa (đi theo hành lang, qua Gác chuông). Hiện bạn có thể ra ngắm hồ và trò chuyện, hít thở bên lương đình giữa hồ.', go: place('hoca') },
      { text: 'Thả cá phóng sinh để tích công đức đang được làm, chưa dùng được trong bản này. Khi có, bạn sẽ thả cá ngay tại hồ và nhận hạt sen.', soon: true },
    ] },
];
export const topicById = (id) => TOPICS.find((t) => t.id === id) || null;

const int = (x) => (Number.isFinite(+x) ? Math.max(0, Math.floor(+x)) : 0);

/**
 * Việc nên làm kế tiếp dựa trên hạt sen, lá bồ đề và nhà. state: { sen, la, own: {xom,plot,lv}|null }.
 * Trả { id, text, go } (go như TOPICS) — luôn có đúng một lời khuyên.
 */
export function advise(state = {}) {
  const sen = int(state.sen), la = int(state.la), own = state.own && Number.isFinite(+state.own.lv) ? state.own : null;
  const canExchange = Math.floor(sen / SEN_PER_LA);
  if (!own) {
    if (la >= LAND_LA) return { id: 'muadat', text: `Bạn đã đủ ${LAND_LA} lá bồ đề! Đến gặp Bác Tư khu phố để mua lô đất đầu tiên, bạn sẽ được tặng một căn nhà trống.`, go: npc('bacphuong') };
    if (canExchange >= 1) return { id: 'doila', text: `Bạn có ${sen} hạt sen, đổi được ${canExchange} lá bồ đề. Đến gặp Thầy Tri khách để đổi (cần ${LAND_LA - la} lá nữa để mua đất).`, go: npc('trikhach') };
    if (la > 0) return { id: 'kiemsen2', text: `Bạn có ${la} lá bồ đề, cần ${LAND_LA} lá để mua đất. Cứ thiền, tụng kinh, làm nhiệm vụ để có thêm hạt sen (${SEN_PER_LA} hạt = 1 lá).`, go: place('chanhdien') };
    return { id: 'kiemsen', text: `Bạn chưa có hạt sen. Vào chánh điện thắp nhang, lạy Phật hoặc ngồi thiền để kiếm công đức; ${SEN_PER_LA} hạt sen đổi được 1 lá bồ đề.`, go: place('chanhdien') };
  }
  const cur = houseLevel(own.lv).lv;
  if (cur < MAX_LV) {
    const nxt = HOUSE_LEVELS[cur + 1], cost = upgradeCost(cur, nxt.lv);
    if (la >= cost) return { id: 'nangnha', text: `Bạn đủ ${cost} lá để nâng nhà lên ${nxt.ten}. Gặp Bác Tư khu phố để nâng cấp.`, go: npc('bacphuong') };
    if (canExchange >= 1) return { id: 'doila2', text: `Nâng nhà lên ${nxt.ten} cần ${cost} lá, bạn có ${la}. Bạn có thể đổi thêm ${canExchange} lá từ ${sen} hạt sen ở Thầy Tri khách.`, go: npc('trikhach') };
    return { id: 'kiemsen3', text: `Nâng nhà lên ${nxt.ten} cần ${cost} lá, bạn có ${la}. Tích thêm hạt sen bằng thiền, tụng kinh, nhiệm vụ.`, go: place('chanhdien') };
  }
  return { id: 'vaonha', text: 'Nhà của bạn đã ở cấp cao nhất. Đứng gần cửa nhà và bấm “Vào nhà”. Mua nội thất, mời khách đang làm.', go: place('xom') };
}
