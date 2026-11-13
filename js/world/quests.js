// Nhiệm vụ + cấp độ của người chơi (Phiên 16 sớm). LOGIC THUẦN (không DOM, không three.js, có test): tests/quests.test.mjs.
// Mọi giá trị (điểm kinh nghiệm, hạt sen thưởng, ngưỡng cấp) là QUY ƯỚC TẠM của dự án, chờ ptg duyệt.
// Cách dùng: prog = loadProg(raw); r = record(prog, { type:'nhang', n:3 }, Date.now()); r.prog (lưu lại), r.done (nhiệm vụ vừa xong), r.levelUp.
// Giao diện: js/ui/quest.js. Các nơi phát sự kiện gọi window.LGT.act(type, arg|n) (xem js/ui/quest.js).
import { xpForLevel, levelAtXp } from './levelCurve.js';   // Phiên 138: cấp KHÔNG giới hạn

/** Các loại sự kiện hợp lệ. 'npc' và 'visit' có `arg` (id NPC / id điểm đến); 'nhang' có n = số nén; 'doila' (đổi lá), 'muadat', 'nangnha' phát từ js/ui/merit.js và js/ui/land.js (Phiên 39); 'cau' (câu được một con cá) và 'phongsinh' (thả một con về nước) phát từ js/ui/fishing.js (Phiên 47). */
export const EVENT_TYPES = ['nhang', 'bow', 'thien', 'kinh', 'niem', 'den', 'loc', 'npc', 'visit', 'chat', 'doila', 'muadat', 'nangnha', 'cau', 'phongsinh', 'noithat', 'khinhthan'];

/** Cấp độ: ngưỡng điểm tối thiểu để đạt cấp i+1 và danh hiệu. Đây là 10 cấp ĐẦU; Phiên 138: từ cấp 11 trở đi KHÔNG giới hạn (js/world/levelCurve.js), danh hiệu giữ như cấp 10. */
export const LEVELS = [
  { xp: 0, ten: 'Khách vãng lai' }, { xp: 30, ten: 'Người sơ tâm' }, { xp: 80, ten: 'Phật tử' }, { xp: 150, ten: 'Thiện tín' },
  { xp: 250, ten: 'Hộ pháp' }, { xp: 400, ten: 'Cư sĩ' }, { xp: 600, ten: 'Thiện tri thức' }, { xp: 900, ten: 'Đạo hữu' },
  { xp: 1300, ten: 'Tịnh nhân' }, { xp: 1800, ten: 'Trưởng lão cư sĩ' },
];
const XP_TABLE = LEVELS.map((l) => l.xp);
/** Thưởng hạt sen khi lên tới cấp `lv` (cấp 1 không thưởng). */
export const levelReward = (lv) => (lv > 1 ? lv * 2 : 0);

/**
 * Danh sách nhiệm vụ. loai: 'ngay' (làm lại mỗi ngày, tính theo ngày địa phương) | 'mot' (một lần suốt đời).
 * dk.key: 'nhang' | 'bow' | ... hoặc 'visit:<id>' (đến đúng điểm) ; dk.distinct = đếm số id KHÁC NHAU của sự kiện (npc, visit); dk.n = số cần đạt.
 */
export const QUESTS = [
  { id: 'n-nhang', loai: 'ngay', ten: 'Thắp nén nhang đầu ngày', mo: 'Mở "Dâng lễ" và thắp ít nhất 1 nén nhang.', dk: { key: 'nhang', n: 1 }, xp: 10, sen: 1 },
  { id: 'n-lay', loai: 'ngay', ten: 'Lạy Phật ba lạy', mo: 'Vào chánh điện, bấm "Lạy Phật" 3 lần.', dk: { key: 'bow', n: 3 }, xp: 15, sen: 1 },
  { id: 'n-kinh', loai: 'ngay', ten: 'Tụng trọn một thời kinh', mo: 'Bấm "Tụng kinh", gõ mõ tới hết một lần.', dk: { key: 'kinh', n: 1 }, xp: 20, sen: 2 },
  { id: 'n-thien', loai: 'ngay', ten: 'Ngồi thiền một lát', mo: 'Bấm "Thiền" trong chánh điện.', dk: { key: 'thien', n: 1 }, xp: 10, sen: 1 },
  { id: 'n-npc', loai: 'ngay', ten: 'Hỏi thăm một người', mo: 'Bấm vào một thầy hoặc một người dân để trò chuyện.', dk: { key: 'npc', n: 1 }, xp: 10, sen: 1 },
  { id: 'm-npc', loai: 'mot', ten: 'Làm quen mọi người', mo: 'Trò chuyện với 5 người khác nhau trong và ngoài chùa.', dk: { key: 'npc', n: 5, distinct: true }, xp: 40, sen: 3 },
  { id: 'm-lang', loai: 'mot', ten: 'Ra làng', mo: 'Đi ra khỏi cổng chùa, tới làng.', dk: { key: 'visit:lang', n: 1 }, xp: 25, sen: 2 },
  { id: 'm-thac', loai: 'mot', ten: 'Nghe tiếng thác', mo: 'Theo đường mòn tới thác nước trong rừng.', dk: { key: 'visit:thacnuoc', n: 1 }, xp: 40, sen: 3 },
  { id: 'm-rung', loai: 'mot', ten: 'Dạo rừng thông', mo: 'Đi tới khu rừng thông phía Tây.', dk: { key: 'visit:rung', n: 1 }, xp: 25, sen: 2 },
  // Phiên 60: mỗi nơi một nhiệm vụ “ghé” để hành trình dẫn người chơi đi hết mọi chỗ (xp/sen là giá trị tạm)
  { id: 'v-chanhdien', loai: 'mot', ten: 'Vào chánh điện', mo: 'Đi thẳng lối giữa sân chùa, lên bậc thềm vào chánh điện nơi có tượng Phật lớn.', dk: { key: 'visit:chanhdien', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-quanam', loai: 'mot', ten: 'Lên Quan Âm đài', mo: 'Đi vòng ra phía sau chánh điện, tới tượng Quan Âm trên đài sen.', dk: { key: 'visit:quanam', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-nhato', loai: 'mot', ten: 'Thăm Nhà Tổ', mo: 'Đi về phía Tây chánh điện, tới ngôi Nhà Tổ cổ kính.', dk: { key: 'visit:nhato', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-vuonthien', loai: 'mot', ten: 'Dạo vườn thiền', mo: 'Khu vườn yên tĩnh phía Tây chánh điện.', dk: { key: 'visit:vuonthien', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-trathat', loai: 'mot', ten: 'Ghé trà thất', mo: 'Đi về phía Tây, bên hành lang có hương trà.', dk: { key: 'visit:trathat', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-gacchuong', loai: 'mot', ten: 'Lên gác chuông', mo: 'Phía Đông sân chùa, nơi có chuông lớn.', dk: { key: 'visit:gacchuong', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-hoca', loai: 'mot', ten: 'Ngắm hồ cá koi', mo: 'Phía Đông, qua hành lang gác chuông; có cá koi bơi.', dk: { key: 'visit:hoca', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-cho', loai: 'mot', ten: 'Dạo chợ làng', mo: 'Cuối đường làng, quanh gốc đa có các quầy hàng.', dk: { key: 'visit:cho', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-dienmaylamsen', loai: 'mot', ten: 'Ghé Điện Máy Lam Sen', mo: 'Nhà phố bên trái đường làng, đoạn gần cổng làng.', dk: { key: 'visit:dienmaylamsen', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-didongsenvang', loai: 'mot', ten: 'Ghé tiệm Di Động Sen Vàng', mo: 'Nhà phố bên trái đường làng, xa hơn về phía chợ.', dk: { key: 'visit:didongsenvang', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-kimhoanngoclan', loai: 'mot', ten: 'Ghé Kim Hoàn Ngọc Lan', mo: 'Nhà phố cuối đường làng, gần chợ.', dk: { key: 'visit:kimhoanngoclan', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-suoitrong', loai: 'mot', ten: 'Ghé Suối Trong', mo: 'Cuối đường mòn thác nước, bãi bên phải: dòng suối chảy ra từ hồ thác, bờ Đông cầu đá; đứng sát mép nước là câu được.', dk: { key: 'visit:suoitrong', n: 1 }, xp: 10, sen: 1 },
  { id: 'v-thuyta', loai: 'mot', ten: 'Ngắm hồ ở Thủy tạ', mo: 'Trong bãi rừng thông, bên Hồ Rừng: đi theo lối gỗ ra nhà thủy tạ giữa hồ.', dk: { key: 'visit:thuyta', n: 1 }, xp: 10, sen: 1 },
  { id: 'v-baothap', loai: 'mot', ten: 'Lên đồi chiêm bái Bảo tháp', mo: 'Giữa đường mòn thác, rẽ lên lối đá phía Bắc: bảo tháp bảy tầng trên đồi.', dk: { key: 'visit:baothap', n: 1 }, xp: 12, sen: 1 },
  { id: 'v-daiphat', loai: 'mot', ten: 'Chiêm bái Đại Phật vách đá', mo: 'Cuối đường mòn thác nước, bãi bên phải: tượng Phật lớn khắc vào vách đá.', dk: { key: 'visit:daiphat', n: 1 }, xp: 12, sen: 1 },
  { id: 'm-dao', loai: 'mot', ten: 'Dạo khắp nơi', mo: 'Đặt chân tới 8 nơi khác nhau (sân, vườn, hồ, làng, rừng, thác...).', dk: { key: 'visit', n: 8, distinct: true }, xp: 60, sen: 5 },
  { id: 'm-den', loai: 'mot', ten: 'Thả ngọn đèn nguyện đầu tiên', mo: 'Mở "Đèn nguyện" và viết điều bạn nguyện.', dk: { key: 'den', n: 1 }, xp: 25, sen: 2 },
  { id: 'm-niem', loai: 'mot', ten: 'Lần đủ 108 hạt', mo: 'Bấm "Tràng hạt" và lần đủ một vòng.', dk: { key: 'niem', n: 1 }, xp: 30, sen: 3 },
  { id: 'm-nhang', loai: 'mot', ten: 'Hai mươi mốt nén hương', mo: 'Thắp tổng cộng 21 nén nhang.', dk: { key: 'nhang', n: 21 }, xp: 40, sen: 3 },
  { id: 'm-kinh', loai: 'mot', ten: 'Năm thời kinh', mo: 'Tụng trọn 5 lần kinh.', dk: { key: 'kinh', n: 5 }, xp: 50, sen: 4 },
  { id: 'm-doila', loai: 'mot', ten: 'Đổi lá bồ đề đầu tiên', mo: 'Gặp Thầy Tri khách và đổi hạt sen lấy lá bồ đề (10 hạt = 1 lá).', dk: { key: 'doila', n: 1 }, xp: 30, sen: 2 },
  { id: 'm-muadat', loai: 'mot', ten: 'Có mảnh đất đầu tiên', mo: 'Gom đủ lá bồ đề, gặp Bác Tư khu phố ở khu nhà ở và mua một lô đất (được tặng nhà trống).', dk: { key: 'muadat', n: 1 }, xp: 80, sen: 5 },
  { id: 'm-nangnha', loai: 'mot', ten: 'Nâng cấp nhà lần đầu', mo: 'Nâng căn nhà trống lên nhà lầu hoặc cao hơn ở chỗ Bác Tư khu phố.', dk: { key: 'nangnha', n: 1 }, xp: 60, sen: 5 },
  { id: 'm-noithat', loai: 'mot', ten: 'Đặt món nội thất đầu tiên', mo: 'Mua một món ở “Cửa hàng” rồi mở “Túi đồ” bấm “Đặt” để bày vào nhà của bạn.', dk: { key: 'noithat', n: 1 }, xp: 50, sen: 4 },
  { id: 'm-khinhthan', loai: 'mot', ten: 'Thử Khinh thân', mo: 'Dùng thân pháp bậc 1: bấm phím Space (máy tính) hoặc nút “Nhảy” bên phải (điện thoại) để bay lên 3 lần.', dk: { key: 'khinhthan', n: 3 }, xp: 30, sen: 2 },
  { id: 'm-cau', loai: 'mot', ten: 'Câu được con cá đầu tiên', mo: 'Mua một quả cầu (nút “Câu cá” → tab “Quả cầu”), đứng sát mép nước, thả cầu và bấm đúng lúc hoa sen nở.', dk: { key: 'cau', n: 1 }, xp: 30, sen: 2 },
  { id: 'm-phongsinh', loai: 'mot', ten: 'Phóng sinh lần đầu', mo: 'Câu được cá rồi bấm “Phóng sinh” để thả con vật về nước.', dk: { key: 'phongsinh', n: 1 }, xp: 40, sen: 3 },
  { id: 'n-phongsinh', loai: 'ngay', ten: 'Phóng sinh một con', mo: 'Thả một con cá, rùa hay mực về nước (câu được hoặc lấy từ ao cá riêng).', dk: { key: 'phongsinh', n: 1 }, xp: 15, sen: 1 },
  { id: 'm-loc', loai: 'mot', ten: 'Nhận lộc hoa sen vàng', mo: 'Tìm hoa sen vàng trong chùa và nhận lộc.', dk: { key: 'loc', n: 1 }, xp: 20, sen: 2 },
];
export const questById = (id) => QUESTS.find((q) => q.id === id) || null;

/** Ngày địa phương YYYY-MM-DD. */
export const dayKey = (now = Date.now()) => { const d = new Date(now), p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

const cnt = (x, max = 1e6) => (Number.isFinite(+x) ? Math.max(0, Math.min(max, Math.floor(+x))) : 0);
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const idStr = (s) => (typeof s === 'string' && /^[\w-]{1,30}$/.test(s) ? s : null);

/** Trạng thái trống. */
export const emptyProg = () => ({ xp: 0, tot: {}, seen: {}, done: {}, day: { k: '', n: {}, seen: {}, done: {} } });

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng). Dữ liệu hỏng/lạ → bỏ phần hỏng, không bao giờ ném lỗi. */
export function loadProg(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const p = emptyProg(); if (!isObj(o)) return p;
  p.xp = cnt(o.xp, 1e9);
  if (isObj(o.tot)) for (const k of Object.keys(o.tot)) if (/^[\w:-]{1,40}$/.test(k)) p.tot[k] = cnt(o.tot[k]);
  if (isObj(o.seen)) for (const k of Object.keys(o.seen)) if (EVENT_TYPES.includes(k) && Array.isArray(o.seen[k])) p.seen[k] = [...new Set(o.seen[k].map(idStr).filter(Boolean))].slice(0, 100);
  if (isObj(o.done)) for (const q of QUESTS) if (q.loai === 'mot' && o.done[q.id] === true) p.done[q.id] = true;
  if (isObj(o.day) && typeof o.day.k === 'string') {
    p.day.k = o.day.k.slice(0, 10);
    if (isObj(o.day.n)) for (const k of Object.keys(o.day.n)) if (/^[\w:-]{1,40}$/.test(k)) p.day.n[k] = cnt(o.day.n[k]);
    if (isObj(o.day.seen)) for (const k of Object.keys(o.day.seen)) if (EVENT_TYPES.includes(k) && Array.isArray(o.day.seen[k])) p.day.seen[k] = [...new Set(o.day.seen[k].map(idStr).filter(Boolean))].slice(0, 100);
    if (isObj(o.day.done)) for (const q of QUESTS) if (q.loai === 'ngay' && o.day.done[q.id] === true) p.day.done[q.id] = true;
  }
  return p;
}

/**
 * Cấp hiện tại theo điểm: { lv, ten, xp, xp0 (ngưỡng cấp này), xp1 (ngưỡng cấp sau), pct (0..100 tới cấp sau) }.
 * Phiên 138: KHÔNG có cấp tối đa — xp1 luôn có giá trị; từ cấp 11 trở đi danh hiệu giữ như cấp 10 (xem js/world/levelCurve.js).
 */
export function levelOf(xp) {
  const x = cnt(xp, 1e9), lv = levelAtXp(XP_TABLE, x), xp0 = xpForLevel(XP_TABLE, lv), xp1 = xpForLevel(XP_TABLE, lv + 1);
  return { lv, ten: LEVELS[Math.min(lv, LEVELS.length) - 1].ten, xp: x, xp0, xp1, pct: Math.round(((x - xp0) / (xp1 - xp0)) * 100) };
}

/** Sang ngày mới thì làm lại bộ đếm hằng ngày (trả bản sao). */
function rollDay(prog, now) {
  const k = dayKey(now), p = { ...prog, tot: { ...prog.tot }, seen: { ...prog.seen }, done: { ...prog.done }, day: { ...prog.day } };
  if (p.day.k !== k) p.day = { k, n: {}, seen: {}, done: {} };
  else p.day = { k, n: { ...p.day.n }, seen: { ...p.day.seen }, done: { ...p.day.done } };
  return p;
}

/** Giá trị tiến độ hiện có của nhiệm vụ q (trước khi giới hạn bởi dk.n). */
export function progressValue(prog, q, now = Date.now()) {
  const daily = q.loai === 'ngay', src = daily ? (prog.day.k === dayKey(now) ? prog.day : { n: {}, seen: {} }) : prog;
  if (q.dk.distinct) { const base = q.dk.key.split(':')[0]; return (src.seen[base] || []).length; }
  return (daily ? src.n : src.tot)[q.dk.key] || 0;
}
const isDone = (prog, q, now) => (q.loai === 'ngay' ? prog.day.k === dayKey(now) && !!prog.day.done[q.id] : !!prog.done[q.id]);

/** Danh sách nhiệm vụ kèm tiến độ để hiển thị: { q, cur, need, done }. Hằng ngày trước, một lần sau. */
export function questStatus(prog, now = Date.now()) {
  return QUESTS.map((q) => { const d = isDone(prog, q, now); return { q, need: q.dk.n, cur: d ? q.dk.n : Math.min(q.dk.n, progressValue(prog, q, now)), done: d }; })
    .sort((a, b) => (a.q.loai === b.q.loai ? 0 : a.q.loai === 'ngay' ? -1 : 1));
}

/**
 * Ghi một sự kiện. ev = { type, n?, arg? }. Trả { prog (mới, không sửa bản cũ), done: [nhiệm vụ vừa hoàn thành], gain: {xp, sen}, levelUp: {from,to,sen}|null }.
 * Sự kiện lạ/hỏng → không làm gì. Hoàn thành nhiệm vụ cộng điểm + hạt sen; lên cấp cộng thêm levelReward.
 */
export function record(prog0, ev, now = Date.now()) {
  const none = { prog: prog0, done: [], gain: { xp: 0, sen: 0 }, levelUp: null };
  if (!ev || !EVENT_TYPES.includes(ev.type)) return none;
  const arg = ev.arg == null ? null : idStr(String(ev.arg)); if ((ev.type === 'npc' || ev.type === 'visit') && !arg) return none;
  const n = ev.type === 'nhang' ? Math.max(1, Math.min(9, cnt(ev.n || 1))) : 1;
  const p = rollDay(prog0, now), keys = [ev.type]; if (arg) keys.push(ev.type + ':' + arg);
  for (const k of keys) { p.tot[k] = cnt((p.tot[k] || 0) + n); p.day.n[k] = cnt((p.day.n[k] || 0) + n); }
  if (arg) {
    for (const holder of [p, p.day]) { const list = holder.seen[ev.type] || []; if (!list.includes(arg)) holder.seen[ev.type] = [...list, arg].slice(0, 100); }
  }
  const done = []; let xp = 0, sen = 0;
  for (const q of QUESTS) {
    if (isDone(p, q, now)) continue;
    if (progressValue(p, q, now) >= q.dk.n) { if (q.loai === 'ngay') p.day.done[q.id] = true; else p.done[q.id] = true; done.push(q); xp += q.xp; sen += q.sen; }
  }
  const before = levelOf(p.xp).lv; p.xp = cnt(p.xp + xp, 1e9);
  const after = levelOf(p.xp).lv; let levelUp = null;
  if (after > before) { let bonus = 0; for (let l = before + 1; l <= after; l++) bonus += levelReward(l); sen += bonus; levelUp = { from: before, to: after, sen: bonus }; }
  return { prog: p, done, gain: { xp, sen }, levelUp };
}
