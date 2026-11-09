// Lộ trình (Phiên 57): các trang ô hình trong bảng Nhiệm vụ — vừa là đường đi, vừa là những điểm thú vị của game; ô chưa trải nghiệm hiện dấu "?".
// LOGIC THUẦN (không DOM, không three.js, có test): tests/journey.test.mjs. Giao diện: js/ui/journey.js.
// Dùng: pages = buildJourney({ prog, khinh, capNguoi, sen, fish, land, furni }); mỗi trang { id, ten, mo, tiles: [{ id, icon, ten, mo, done, how: [bước], quest?, act? }], done, total }.
// Mọi gợi ý chỗ (hướng đi) là chữ cố định của dự án, không chèn HTML. Con số bậc khinh công lấy từ js/world/skills.js (QUY ƯỚC TẠM chờ ptg duyệt).
import { KHINH_YEU_CAU, KHINH_TEN, KHINH_THAN_CAO, MAX_BAC } from './skills.js';
import { ORBS, SPECIES } from './fishing.js';
import { HOUSE_LEVELS } from './land.js';
import { PLACES } from './outside.js';
import { TIERS } from './strength.js';
import { DIFF, SLOT_ORDER, EVENT_MIN } from './yeuquai.js';
import { NPCS } from './npc.js';

const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const num = (x) => (Number.isFinite(+x) ? Math.max(0, Math.floor(+x)) : 0);

/** Gợi ý đường tới từng nơi (chữ cố định; nơi nào chưa có gợi ý thì dùng nút Dẫn đường của nhiệm vụ). */
export const PLACE_HINT = {
  sanchua: 'Ngay sau cổng Tam quan, sân lát đá trước chánh điện.',
  chanhdien: 'Đi thẳng lối giữa, lên bậc thềm vào chánh điện.',
  nhato: 'Một ngôi nhà cổ kính phía Tây chánh điện.',
  gacchuong: 'Phía Đông sân chùa, nơi có chuông lớn.',
  trathat: 'Đi về phía Tây, bên hành lang có hương trà.',
  vuonthien: 'Khu vườn yên tĩnh phía Tây chánh điện.',
  hoca: 'Phía Đông sân chùa, qua hành lang gác chuông; có cá koi bơi.',
  quanam: 'Phía sau chánh điện, tượng Quan Âm trên đài.',
  lang: 'Đi thẳng ra khỏi cổng Tam quan, xuống đường làng.',
  cho: 'Cuối đường làng, quanh gốc đa có các quầy hàng.',
  rung: 'Ngã ba đường làng, rẽ trái theo đường mòn vào rừng thông.',
  thacnuoc: 'Ngã ba đường làng, rẽ phải theo đường mòn tới thác nước.',
  suoitrong: 'Bãi thác nước: dòng suối chảy ra từ hồ chân thác, bờ Đông cây cầu đá. Đứng sát mép suối rồi bấm “Thả cầu” để câu cá bống, cá chạch, cá lăng.',
  thuyta: 'Trong bãi rừng thông (rẽ trái ở đường làng), đi vòng bờ Hồ Rừng rồi theo lối gỗ ra nhà thủy tạ.',
  daiphat: 'Cuối đường mòn thác nước, bãi bên phải: tượng Phật lớn khắc vào vách đá.',
  dienmaylamsen: 'Nhà phố bên trái đường làng, đoạn gần cổng làng.',
  kimhoanngoclan: 'Nhà phố cuối đường làng, gần chợ.',
  didongsenvang: 'Nhà phố bên trái đường làng, xa hơn nữa về phía chợ.',
};
/** Nhiệm vụ có nút “Dẫn đường” cho từng nơi (id nhiệm vụ trong js/world/quests.js). */
export const PLACE_QUEST = { lang: 'm-lang', thacnuoc: 'm-thac', rung: 'm-rung', ...Object.fromEntries(['chanhdien', 'quanam', 'nhato', 'vuonthien', 'trathat', 'gacchuong', 'hoca', 'cho', 'dienmaylamsen', 'didongsenvang', 'kimhoanngoclan', 'daiphat', 'thuyta', 'suoitrong'].map((id) => [id, 'v-' + id])) };
const ICON = { sanchua: '⛩️', chanhdien: '🛕', nhato: '🏯', gacchuong: '🔔', trathat: '🍵', vuonthien: '🧘', hoca: '🐟', quanam: '🪷', lang: '🏘️', cho: '🧺', rung: '🌲', thacnuoc: '💧', daiphat: '🗿', thuyta: '🏮', suoitrong: '🎣', dienmaylamsen: '🔌', kimhoanngoclan: '💍', didongsenvang: '📱' };

const seenVisit = (prog) => new Set((prog && isObj(prog.seen) && Array.isArray(prog.seen.visit)) ? prog.seen.visit : []);
const tot = (prog, k) => num(prog && prog.tot && prog.tot[k]);
const questDone = (prog, id) => !!(prog && prog.done && prog.done[id]);

/** Trang 1 — Khinh công 8 bậc. Bậc đã đạt = ✓; bậc kế = có nút Luyện; chưa tới = “?”. */
export function pageKhinh({ khinh = 0, capNguoi = 1, sen = 0 } = {}) {
  const bac = Math.max(0, Math.min(MAX_BAC, num(khinh)));
  const tiles = [];
  for (let b = 1; b <= MAX_BAC; b++) {
    const y = KHINH_YEU_CAU[b], how = [];
    if (b === 1) how.push('Hoàn thành chuỗi nhiệm vụ cốt truyện “Chăm sóc cây bồ đề” (tưới cây) để mở bậc 1.', 'Sau đó bấm Space (máy tính) hoặc nút “Nhảy” (điện thoại) để bay lên.');
    else { how.push(`Cần đạt bậc ${b - 1} trước.`, `Cần cấp độ người chơi từ ${y.cap} trở lên (hiện cấp ${capNguoi}).`, `Cần ${y.sen} hạt sen (hiện có ${num(sen)}).`, 'Mở bảng Khinh thân (nút Khinh thân ở thanh dưới) rồi bấm “Luyện”.'); }
    how.push(`Nhảy cao khoảng ${KHINH_THAN_CAO[b]} m (trong nhà tối đa 1,6 m).`);
    tiles.push({ id: 'kc' + b, icon: '🕊️', ten: `Bậc ${b} · ${KHINH_TEN[b]}`, mo: b === 1 ? 'Mở bằng cốt truyện' : `Cấp ${y.cap} · ${y.sen} hạt sen`, done: bac >= b, how, act: b === bac + 1 ? (b === 1 ? { kind: 'story' } : { kind: 'skill' }) : null });
  }
  return mk('khinh', 'Khinh công', 'Tám bậc thân pháp: càng cao nhảy càng xa.', tiles);
}

/** Trang 2 — Khám phá: các nơi trong và ngoài chùa. Nơi chưa ghé: tên ẩn thành “Nơi chưa biết”, chạm vào xem gợi ý. */
export function pageKham({ prog = null } = {}) {
  const seen = seenVisit(prog);
  const tiles = PLACES.map((p) => {
    const done = seen.has(p.id), how = [PLACE_HINT[p.id] || 'Đi dạo tìm quanh khu vực này.', 'Đứng trong khu vực đó là được tính “đã ghé”.'];
    return { id: 'kp-' + p.id, icon: ICON[p.id] || '📍', ten: done ? p.ten : 'Nơi chưa biết', mo: done ? 'Đã ghé' : 'Chưa ghé', done, how, quest: PLACE_QUEST[p.id] || null, act: null, secret: !done, real: p.ten };
  });
  return mk('kham', 'Khám phá', 'Những nơi đáng ghé trong chùa và ngoài làng.', tiles);
}

/** Trang 3 — Gieo duyên: mua cầu, câu cá, phóng sinh, sưu tầm từng loài. */
export function pageGieoDuyen({ prog = null, fish = null } = {}) {
  const f = isObj(fish) ? fish : {}, orbs = isObj(f.orbs) ? f.orbs : {}, stat = isObj(f.stat) ? f.stat : {}, dex = isObj(f.dex) ? f.dex : {};
  const tiles = [];
  tiles.push({ id: 'gd-mua', icon: '🎣', ten: 'Mua quả cầu đầu tiên', mo: 'Cầu Gỗ: 50 hạt sen', done: Object.keys(orbs).length > 0, how: ['Mở nút “Câu cá” (cụm nút tròn góc phải-trên) → tab “Quả cầu”.', 'Cầu Gỗ Bồ Đề giá 50 hạt sen; các cầu tốt hơn mua bằng lá bồ đề.'], act: { kind: 'fishing', tab: 'orbs' } });
  tiles.push({ id: 'gd-cau', icon: '🐟', ten: 'Thu phục cá đầu tiên', mo: 'Thả cầu, bấm đúng lúc hoa sen nở', done: questDone(prog, 'm-cau') || num(stat.got) > 0 || tot(prog, 'cau') > 0, how: ['Đứng sát mép nước (hồ cá, ao sen hoặc hồ thác).', 'Bấm “Thả cầu”, chờ hoa sen nở (khoảng nửa giây) rồi bấm “Bấm!” / Space / Enter.'], quest: 'm-cau', act: { kind: 'fishing', tab: 'cast' } });
  tiles.push({ id: 'gd-phong', icon: '🕊️', ten: 'Phóng sinh lần đầu', mo: 'Thả cá về nước, được hạt sen', done: questDone(prog, 'm-phongsinh') || num(stat.rel) > 0 || tot(prog, 'phongsinh') > 0, how: ['Câu được cá rồi bấm “Phóng sinh”, hoặc thả từ tab “Ao cá”.', 'Mỗi ngày tối đa 10 lần có thưởng hạt sen.'], quest: 'm-phongsinh', act: { kind: 'fishing', tab: 'pond' } });
  tiles.push({ id: 'gd-ao', icon: '🏞️', ten: 'Nuôi cá trong ao riêng', mo: `Đã thu ${num((f.pond || []).length)} con`, done: Array.isArray(f.pond) && f.pond.length > 0, how: ['Câu được cá rồi bấm “Thu cá”.', 'Ao riêng chứa tối đa 30 con.'], act: { kind: 'fishing', tab: 'pond' } });
  for (const o of ORBS.slice(1)) tiles.push({ id: 'gd-orb-' + o.id, icon: '🔮', ten: o.ten, mo: `${o.gia} lá bồ đề`, done: orbs[o.id] !== undefined, how: [`Mua bằng ${o.gia} lá bồ đề (đổi hạt sen lấy lá ở Thầy Tri khách, 10 hạt = 1 lá).`, 'Cầu càng tốt: càng bền, càng dễ gặp cá hiếm.'], act: { kind: 'fishing', tab: 'orbs' } });
  for (const s of SPECIES) { const c = num(dex[s.id]), done = c > 0; tiles.push({ id: 'gd-sp-' + s.id, icon: s.loai === 'rua' ? '🐢' : s.loai === 'baba' ? '🐢' : s.loai === 'muc' ? '🦑' : '🐟', ten: done ? s.ten : 'Loài chưa gặp', mo: done ? `Đã gặp ${c} lần${s.hiem ? ' · hiếm' : ''}` : (s.hiem ? 'Hiếm' : 'Chưa gặp'), done, how: [s.hiem ? 'Loài hiếm: dùng cầu tốt hơn để dễ gặp hơn.' : 'Loài thường: thả cầu ở các mặt nước là có thể gặp.', 'Câu được là tự ghi vào sổ sưu tầm.'], secret: !done, real: s.ten, act: { kind: 'fishing', tab: 'cast' } }); }
  return mk('gieoduyen', 'Gieo duyên', 'Mua cầu, thu phục cá, phóng sinh, sưu tầm các loài.', tiles);
}

/** Trang 4 — Đất · nhà · nội thất · tiệc. */
export function pageNhaCua({ prog = null, land = null, furni = null } = {}) {
  const own = land && isObj(land) && isObj(land.own) ? land.own : null, lv = own ? num(own.lv) : 0;
  const owned = furni && isObj(furni.owned) ? Object.keys(furni.owned).length : 0, placed = furni && Array.isArray(furni.placed) ? furni.placed.length : 0;
  const tiles = [
    { id: 'nc-la', icon: '🍃', ten: 'Đổi lá bồ đề', mo: '10 hạt sen = 1 lá', done: questDone(prog, 'm-doila') || tot(prog, 'doila') > 0, how: ['Gặp Thầy Tri khách trong chùa và chọn đổi hạt sen lấy lá bồ đề.'], quest: 'm-doila', act: { kind: 'merit' } },
    { id: 'nc-dat', icon: '🏞️', ten: 'Mua mảnh đất đầu tiên', mo: 'Được tặng nhà trống', done: !!own || questDone(prog, 'm-muadat'), how: ['Gom đủ lá bồ đề.', 'Đi xuống cuối đường làng gặp Bác Tư khu phố rồi chọn mua đất.'], quest: 'm-muadat' },
  ];
  for (const h of HOUSE_LEVELS.slice(1)) tiles.push({ id: 'nc-nha' + h.lv, icon: h.lv === 1 ? '🏠' : h.lv === 2 ? '🏡' : '🏖️', ten: h.ten, mo: `${h.gia} lá bồ đề`, done: !!own && lv >= h.lv, how: [h.lv === 1 ? 'Cần có đất rồi nâng căn nhà trống lên.' : `Cần nhà cấp ${h.lv - 1} trước.`, 'Gặp Bác Tư khu phố và chọn nâng cấp nhà (trả phần chênh lệch).'], quest: h.lv === 1 ? 'm-nangnha' : null });
  tiles.push({ id: 'nc-mua', icon: '🛋️', ten: 'Mua món nội thất đầu tiên', mo: `Đã có ${owned} món`, done: owned > 0, how: ['Vào nhà mình rồi mở “Cửa hàng”.', 'Mua bằng lá bồ đề.'], act: { kind: 'furni', tab: 'shop' } });
  tiles.push({ id: 'nc-dat-do', icon: '🪑', ten: 'Bày nội thất vào nhà', mo: `Đã đặt ${placed} món`, done: placed > 0 || questDone(prog, 'm-noithat'), how: ['Mở “Túi đồ” rồi bấm “Đặt”.', 'Có thể di chuyển và xoay đồ trong nhà.'], quest: 'm-noithat', act: { kind: 'furni', tab: 'bag' } });
  tiles.push({ id: 'nc-tiec', icon: '🎉', ten: 'Mời tiệc', mo: 'Sắp có', done: false, soon: true, how: ['Tính năng mời bạn bè tới nhà dự tiệc đang được chuẩn bị, chưa mở.'] });
  return mk('nhacua', 'Đất · Nhà · Tiệc', 'Từ mảnh đất đầu tiên tới căn nhà đầy đủ nội thất.', tiles);
}

/** Trang 6 — Tu tập: các việc tu hằng ngày trong chùa. Ô đã làm khi tổng số lần ghi nhận (prog.tot) > 0. */
const TU_TAP = [
  { key: 'nhang', icon: '🪔', ten: 'Thắp nhang', quest: 'm-nhang', how: ['Mở “Dâng lễ” ở thanh dưới màn hình và bấm thắp nén nhang.', 'Thắp đủ 21 nén có nhiệm vụ riêng.'], unit: 'nén' },
  { key: 'bow', icon: '🙏', ten: 'Lạy Phật', quest: 'n-lay', how: ['Vào chánh điện, đứng trước tượng Phật lớn.', 'Bấm “Lạy Phật”; mỗi ngày lạy ba lạy có thưởng.'], unit: 'lạy' },
  { key: 'kinh', icon: '📿', ten: 'Tụng kinh', quest: 'm-kinh', how: ['Trong chánh điện bấm “Tụng kinh”.', 'Gõ mõ theo nhịp tới hết một thời; đủ 5 thời có nhiệm vụ riêng.'], unit: 'thời' },
  { key: 'thien', icon: '🧘', ten: 'Ngồi thiền', quest: 'n-thien', how: ['Trong chánh điện bấm “Thiền”.', 'Khi đang thiền, người khác không ném bạn được.'], unit: 'lần' },
  { key: 'niem', icon: '📿', ten: 'Lần tràng hạt', quest: 'm-niem', how: ['Bấm “Tràng hạt” rồi lần đủ 108 hạt một vòng.'], unit: 'vòng' },
  { key: 'den', icon: '🏮', ten: 'Thả đèn nguyện', quest: 'm-den', how: ['Mở “Đèn nguyện”, viết điều bạn nguyện rồi thả đèn.'], unit: 'ngọn' },
  { key: 'loc', icon: '🌼', ten: 'Nhận lộc hoa sen vàng', quest: 'm-loc', how: ['Tìm hoa sen vàng đang nở trong chùa (có chấm sáng trên bản đồ nhỏ) rồi đứng gần để nhận lộc.'], unit: 'lần' },
  { key: 'doila', icon: '🍃', ten: 'Đổi lá bồ đề', quest: 'm-doila', how: ['Gặp Thầy Tri khách ở phía Đông chùa.', 'Đổi hạt sen lấy lá bồ đề (10 hạt = 1 lá).'], unit: 'lần' },
];
export function pageTuTap({ prog = null } = {}) {
  const tiles = TU_TAP.map((t) => { const n = tot(prog, t.key); return { id: 'tt-' + t.key, icon: t.icon, ten: t.ten, mo: n > 0 ? `Đã làm ${n} ${t.unit}` : 'Chưa làm', done: n > 0, how: t.how.slice(), quest: t.quest, act: null }; });
  return mk('tutap', 'Tu tập', 'Những việc tu hằng ngày trong chùa: nhang, lạy, kinh, thiền, đèn nguyện.', tiles);
}

/** Trang 7 — Dân làng: từng người trong và ngoài chùa (chỉ các người có hội thoại, không tính điểm cảnh). Đã gặp = đã trò chuyện (prog.seen.npc). */
export function pageNguoi({ prog = null } = {}) {
  const seen = new Set((prog && isObj(prog.seen) && Array.isArray(prog.seen.npc)) ? prog.seen.npc : []);
  const tiles = NPCS.filter((n) => !n.act).map((n) => {
    const done = seen.has(n.id), where = n.z < 40 ? 'trong chùa' : n.z < 150 ? 'ngoài làng' : 'khu nhà ở';
    return { id: 'ng-' + n.id, icon: '🧑', ten: done ? n.ten : 'Người chưa quen', mo: done ? 'Đã trò chuyện' : 'Chưa gặp', done, how: [`Người này ở ${where}.`, 'Bấm vào nhân vật để trò chuyện, hoặc dùng nút “Dẫn đường”.'], quest: null, act: null, secret: !done, real: n.ten };
  });
  return mk('nguoi', 'Dân làng', 'Làm quen với mọi người trong và ngoài chùa.', tiles);
}

/** Trang 5 — Sức mạnh · Yêu quái: các bậc sức mạnh (khiêng/ném vật nặng) và hai khung giờ yêu quái hằng tháng. ctx.str = sức mạnh hiện tại; ctx.yq = { kills, bonus }. */
export function pageSucManh(ctx = {}) {
  const { str = 0, yq = null } = isObj(ctx) ? ctx : {}, s = num(str), y = isObj(yq) ? yq : {}, tiles = [];
  for (const t of TIERS.slice(1)) tiles.push({ id: 'sm-' + t.min, icon: '💪', ten: t.ten, mo: `Sức mạnh từ ${t.min}`, done: s >= t.min, how: ['Sức mạnh tăng theo cấp nhân vật, bậc Khinh thân và tổng hạt sen đã tích.', 'Ngoài làng có 8 vật để khiêng và ném, từ thùng gỗ nhẹ tới khúc gỗ lim 200 kg: bấm “Khiêng” khi đứng gần.', `Bạn đang có ${s} sức mạnh.`], act: null });
  tiles.push({ id: 'sm-yq-thu', icon: '👹', ten: 'Thu phục yêu quái đầu tiên', mo: 'Mỗi tháng một ngày, hai khung giờ', done: num(y.kills) > 0, how: [`Mỗi tháng yêu quái xuất hiện ở đường làng vào một ngày cố định, ${SLOT_ORDER.length} khung giờ: ${SLOT_ORDER.map((k) => `${DIFF[k].hour}:00 (độ khó ${DIFF[k].ten})`).join(', ')}, mỗi khung ${EVENT_MIN} phút.`, 'Bấm “Ném đá” khi nó còn xa; khi nó gồng (vùng đỏ trên đất) hãy chạy ra ngoài; lại gần bấm “Thương”.', 'Đánh đủ phần công thì nhận điểm, sức mạnh vĩnh viễn và nhặt lá bồ đề rơi ra — ai nhanh tay nhặt được.'], act: null });
  tiles.push({ id: 'sm-yq-bonus', icon: '⭐', ten: 'Sức mạnh từ yêu quái', mo: `+${num(y.bonus)} sức mạnh vĩnh viễn`, done: num(y.bonus) > 0, how: ['Mỗi lần thu phục thành công được thêm sức mạnh vĩnh viễn; khung giờ độ khó cao thưởng nhiều hơn.'], act: null });
  return mk('sucmanh', 'Sức mạnh · Yêu quái', 'Khiêng đồ nặng, ném người, bảo vệ dân làng khỏi yêu quái.', tiles);
}

function mk(id, ten, mo, tiles) { return { id, ten, mo, tiles, total: tiles.filter((t) => !t.soon).length, done: tiles.filter((t) => t.done).length }; }

/** Dựng toàn bộ các trang. ctx lạ/thiếu → trang vẫn dựng được (mọi ô chưa làm). */
export function buildJourney(ctx = {}) {
  const c = isObj(ctx) ? ctx : {};
  return [pageKhinh(c), pageKham(c), pageGieoDuyen(c), pageNhaCua(c), pageSucManh(c), pageTuTap(c), pageNguoi(c)];
}
