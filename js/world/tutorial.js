// Sổ tay hướng dẫn cách chơi + "việc nên làm kế tiếp" (Phiên 39). LOGIC THUẦN (không DOM, không three.js, có test: tests/tutorial.test.mjs).
// Giao diện: js/ui/tutorial.js. Mọi con số lấy từ merit.js / land.js (một nguồn duy nhất) nên đổi giá ở đó là chữ hướng dẫn đổi theo.
// Chỉ nói những gì ĐÃ chạy trong bản này; tính năng chưa làm (nội thất) ghi rõ "sắp có", không giả vờ.
import { SEN_PER_LA, LAND_LA, MED_SECONDS_PER_SEN, DAILY_CAP } from './merit.js';
import { ORBS, POND_MAX } from './fishing.js';
import { HOUSE_LEVELS, MAX_LV, houseLevel, upgradeCost, XOM_SIZE } from './land.js';
import { CARRY_ITEMS, carryLimit, strengthNeeded, THROW_COOLDOWN_S, THROW_COST_SEN } from './strength.js';
import { YQ, AOE, EVENT_MIN, DIFF, MIN_SHARE } from './yeuquai.js';

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
      { text: 'Vào nhà, mở “Cửa hàng” để mua nội thất bằng lá bồ đề; mở “Túi đồ” rồi bấm “Đặt” để bày vào nhà, kéo để di chuyển và xoay. Khi đang ở ngoài nhà, bấm “Túi đồ” sẽ cho bạn xem mình đang có gì.' },
      { text: 'Mời khách tới tham quan nhà và mở tiệc: đang làm, sắp có.', soon: true },
    ] },
  { id: 'phongsinh', ten: 'Phóng sinh', moTa: 'Câu cá gieo duyên, thả về nước',
    steps: [
      { text: 'Hồ cá chép nằm ở phía Đông sân chùa (đi theo hành lang, qua Gác chuông). Ao sen trước chánh điện và hồ chân thác cũng câu được: chỉ cần đứng sát mép nước.', go: place('hoca') },
      { text: `Bấm biểu tượng “Câu cá” (cụm nút tròn góc phải-trên). Đứng sát mép nước thì có sẵn nút “Thả cầu” (hoặc “Mua cầu” nếu bạn chưa có cầu) ở góc phải-dưới. Vào tab “Quả cầu” mua quả đầu tiên: ${ORBS[0].ten} giá ${ORBS[0].gia} hạt sen; các cầu tốt hơn mua bằng lá bồ đề. Cầu càng đắt càng bền, càng dễ gặp cá hiếm.`, go: tap('cauca') },
      { text: 'Bấm “Thả cầu” (nút góc phải-dưới), đợi hoa sen nở (chỉ khoảng nửa giây) rồi bấm nút “Bấm!” hiện ngay chỗ đó (hoặc phím Space / Enter). Bấm sớm quá cá giật mình, bấm trễ cá bơi mất. Mỗi lần thả tốn 1 độ bền của cầu; cầu nứt thì sửa bằng 1/5 giá.' },
      { text: `Câu được cá thì bấm “Thu cá” (nuôi ở ao riêng, tối đa ${POND_MAX} con) hoặc “Phóng sinh” (nút “Phóng sinh”, thả về nước, nhận 1 đến 3 hạt sen; mỗi ngày tối đa 10 lần có thưởng). Cá trong tab “Ao cá” phóng sinh được bất cứ lúc nào.` },
      { text: 'Trên mặt nước bạn sẽ thấy quả cầu bay xuống, vòng sóng lan ra, bóng cá lượn quanh cầu rồi hoa sen hồng nở: đó là lúc bấm “Bấm!”.' },
    ] },
];

// Phiên 65: các chủ đề cho phần mới (cụm nút, sức mạnh, yêu quái, lộ trình). Con số lấy từ strength.js / yeuquai.js nên đổi luật là chữ theo.
const KG = CARRY_ITEMS.map((i) => `${i.ten} ${i.kg} kg`).join(' · ');
TOPICS.push(
  { id: 'nutphai', ten: 'Các nút góc phải-dưới', moTa: 'Nhảy, kỹ năng, câu cá, khiêng, đánh',
    steps: [
      { text: 'Góc phải-dưới màn hình có cụm nút tròn to, tự đổi theo việc bạn đang làm. Lần đầu mỗi nút hiện một bong bóng vàng chỉ chỗ bấm; bấm nút đó là bong bóng biến mất.' },
      { text: '“Nhảy” (bay lên) và “Kỹ năng” (luyện bậc Khinh thân) chỉ dùng được sau khi mở bậc 1: gặp Thầy trụ trì và làm nhiệm vụ tưới cây bồ đề. Trước đó nút Nhảy hiện mờ, bấm vào sẽ báo cách mở. Nút “Kỹ năng” có dấu ✦ sáng khi bạn đủ điều kiện luyện bậc kế.' },
      { text: 'Đứng sát mép nước: hiện “Thả cầu” / “Mua cầu”. Đang câu: nút “Bấm!” sáng lên khi hoa sen nở. Câu được cá: “Thu cá” hoặc “Phóng sinh”.' },
      { text: 'Đứng gần một vật khiêng được: hiện “Khiêng”. Đang khiêng: “Ném” và “Đặt xuống”. Có yêu quái trong làng: hiện “Ném đá” và “Thương”.' },
      { text: '“Túi đồ” luôn có: ngoài nhà xem mình đang có gì (hạt sen, lá bồ đề, quả cầu, cá, nội thất, sức mạnh); trong nhà mở bảng bày đồ.' },
      { text: 'Khi đang ngồi thiền, lạy hay tụng kinh, cụm nút ẩn đi cho gọn. Muốn đứng dậy bấm nút “Đứng dậy”.' },
    ] },
  { id: 'sucmanh', ten: 'Sức mạnh, khiêng và ném', moTa: 'Cấp + luyện thân + công đức',
    steps: [
      { text: 'Sức mạnh tăng theo ba thứ: cấp độ của bạn, bậc luyện thân (Khinh thân) và tổng công đức (hạt sen từng kiếm). Thu phục yêu quái còn được cộng thêm sức mạnh vĩnh viễn. Xem số sức mạnh và danh hiệu trong “Túi đồ”.' },
      { text: `Sức mạnh càng cao khiêng được vật càng nặng (vật 6 kg ai cũng khiêng được; cần ${strengthNeeded(70)} sức mạnh cho vật 70 kg, ${strengthNeeded(200)} cho 200 kg; ví dụ sức mạnh 50 khiêng tối đa ${carryLimit(50)} kg). Vật trong thế giới: ${KG}.` },
      { text: 'Đứng sát vật rồi bấm “Khiêng”. Bấm “Ném” để ném về hướng nhân vật đang nhìn: vật nhẹ và bạn khỏe thì bay xa, vật rơi xuống đất rồi tự trở về chỗ cũ sau một lúc. Vào nhà hoặc ngồi xuống thì vật tự được đặt xuống.' },
      { text: `Người có cấp VÀ sức mạnh lớn hơn bạn có thể khiêng và ném bạn dù bạn không đồng ý; nhưng không được ném trong khuôn viên chùa hay người đang ngồi thiền, hồi chiêu ${THROW_COOLDOWN_S} giây cho mỗi cặp, người ném bị trừ ${THROW_COST_SEN} hạt sen, người bị ném rơi an toàn không mất gì. Phần ném người chơi với nhau qua mạng: đang làm, sắp có.`, soon: true },
    ] },
  { id: 'yeuquai', ten: 'Yêu quái hằng tháng', moTa: 'Bảo vệ dân làng, nhận lá bồ đề',
    steps: [
      { text: `Mỗi tháng yêu quái xuất hiện ở đường làng vào một ngày cố định, hai khung giờ (giờ Việt Nam), mỗi khung ${EVENT_MIN} phút: ${DIFF.trung.hour}:00 sáng độ khó ${DIFF.trung.ten}, ${DIFF.cao.hour}:00 tối độ khó ${DIFF.cao.ten} (máu nhiều, đánh đau, gồng nhanh hơn nhưng thưởng lớn hơn). Yêu Đá, Yêu Nước, Yêu Lửa luân phiên. Khi còn dưới 14 ngày, game báo trước ngày giờ.` },
      { text: `Yêu quái sẽ GỒNG chiêu: một vùng đỏ hiện dưới đất và đậm dần. Hãy chạy ra ngoài vùng đỏ trước khi nó đánh (vòng ${AOE.slam} m quanh thân yêu đá; vành khuyên ${AOE.ringIn}–${AOE.ringOut} m của yêu nước, đứng sát thân thì an toàn; các vòng nhỏ của yêu lửa rơi gần chỗ bạn đứng).` },
      { text: 'Đánh bằng “Ném đá” (từ xa, nhẹ) và “Thương” (lại gần, mạnh hơn). Người đủ mạnh (cấp và sức mạnh cao hơn yêu quái) còn có “Ném yêu quái”. Bị trúng đòn thì mất máu; cấp càng cao càng mất ít. Hết máu thì được đưa về cửa chùa hồi sinh, bất tử vài giây.' },
      { text: `Thu phục xong, lá bồ đề rơi vãi quanh đó: chạy tới chạm vào là nhặt, ai nhanh tay thì được. Ai đánh được ít nhất ${Math.round(MIN_SHARE * 100)}% máu yêu quái nhận thêm ${DIFF.trung.xp} điểm công hạnh và ${DIFF.trung.str} sức mạnh vĩnh viễn (khung ${DIFF.cao.hour}:00: ${DIFF.cao.xp} điểm và ${DIFF.cao.str} sức mạnh).` },
      { text: 'Cùng nhiều người chơi đánh chung một yêu quái (máu chung, tranh nhặt lá): đang làm, sắp có. Hiện mỗi người tự đối đầu một con.', soon: true },
    ] },
  { id: 'lotrinh', ten: 'Lộ trình khám phá', moTa: 'Ô nào còn dấu “?” là chưa thử',
    steps: [
      { text: 'Bấm nút “Nhiệm vụ”, chọn tab “Lộ trình”. Có các trang: Khinh công, Khám phá, Gieo duyên, Đất · Nhà · Tiệc. Ô nào đã trải nghiệm hiện hình, ô chưa thì hiện dấu “?”.', go: tap('nhiemvu') },
      { text: 'Chạm một ô để xem cách làm từng bước. Ô có nút “Dẫn đường” hoặc “Mở ngay” sẽ đưa bạn tới đúng chỗ.' },
    ] },
);
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
