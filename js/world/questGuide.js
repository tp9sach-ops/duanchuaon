// Dẫn đường nhiệm vụ (Phiên 18): bấm một nhiệm vụ → nhân vật tự đi tới chỗ cần làm + thẻ hướng dẫn từng bước.
// LOGIC THUẦN (không DOM, không three.js, có test: tests/questGuide.test.mjs). Giao diện ở js/ui/guide.js.
// planGuide(questId, prog, pos, ctx) cho biết: các bước (đã xong / đang làm / chưa), đích cần đi tới, nút cần bấm, khoảng cách còn lại.
import { questStatus } from './quests.js';
import { NPCS } from './npc.js';
import { PLACES } from './outside.js';
import { LOC_RADIUS } from './loc.js';
import { insideHall, HALL_POINT } from '../ui/hudLogic.js';
import { isStoryQuest, storyRows, emptyStory, WATER_SPOT } from './story.js';

/** Chỗ đứng đi tới được (đã kiểm bằng test) cho từng nơi trong PLACES. */
export const PLACE_STAND = {
  sanchua: { x: 0, z: 6 }, chanhdien: { x: 0, z: -30 }, nhato: { x: -38, z: -20 }, gacchuong: { x: 21.8, z: -3 },
  trathat: { x: -64, z: 12 }, vuonthien: { x: -62, z: -20 }, hoca: { x: 52, z: 10 }, quanam: { x: 0, z: -59 },
  lang: { x: 0, z: 88 }, cho: { x: 0, z: 128 }, rung: { x: -98, z: 89 }, thacnuoc: { x: 95, z: 104 },
  dienmaylamsen: { x: -15.5, z: 70 }, kimhoanngoclan: { x: 15.5, z: 131.5 }, didongsenvang: { x: -15.5, z: 112 },
};

const D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const go = (x, z, r, text, extra = {}) => ({ text, go: { x, z, r, ...extra } });
const tap = (id, text, hall = true) => ({ text, tap: id, hall });
const HALL_GO = go(HALL_POINT.x, HALL_POINT.z, 1.5, 'Đi vào chánh điện (bậc thềm phía sau Tam quan, thẳng lối giữa).', { hall: true });
const npcStep = (nid, text) => ({ text, npc: NPCS.find((n) => n.id === nid) });
const WAY_LANG = go(0, 62, 3, 'Đi qua Tam quan, theo đường đá ra phía làng.');

/** Các bước cố định của từng nhiệm vụ. Bước `go` tự dẫn đi; bước `tap` chỉ nút cần bấm (nút sẽ nhấp nháy). Bước cuối luôn là việc cần làm. */
const STATIC_STEPS = {
  'n-nhang': () => [HALL_GO, tap('danglee', 'Bấm nút “Dâng lễ” (lưới nút bên phải, hình nén hương) rồi chọn “Thắp 1 nén”.')],
  'm-nhang': () => [HALL_GO, tap('danglee', 'Bấm “Dâng lễ”, chọn “Thắp 9 nén” (hoặc 3 nén) nhiều lần cho đủ 21 nén.')],
  'n-lay': () => [HALL_GO, tap('lay', 'Bấm “Lạy Phật”. Nhân vật cúi lạy xong thì bấm tiếp, đủ 3 lạy.')],
  'n-kinh': () => [HALL_GO, tap('tungkinh', 'Bấm “Tụng kinh”, chọn một bài rồi gõ mõ (hoặc bật “Tự động gõ”) tới hết bài.')],
  'm-kinh': () => [HALL_GO, tap('tungkinh', 'Bấm “Tụng kinh”, tụng trọn bài, rồi tụng lại cho đủ 5 lần.')],
  'n-thien': () => [HALL_GO, tap('thien', 'Bấm “Thiền”. Nhân vật tự ngồi vào bồ đoàn gần nhất.')],
  'm-niem': () => [HALL_GO, tap('trenghat', 'Bấm “Tràng hạt”, rồi bấm “Lần một hạt” cho đủ 108 hạt (một vòng).')],
  'm-den': () => [tap('den', 'Bấm biểu tượng ngọn đèn (cụm nút tròn góc phải-trên), viết điều nguyện, bấm “Thả đèn nguyện”.', false)],
  'm-doila': () => [npcStep('trikhach', 'Gặp Thầy Tri khách ở trước Nhà Khách (bấm vào thầy, hoặc để mình dẫn tới): bảng “Đổi lá bồ đề” tự mở, bấm “Đổi 1 lá”.')],
  'm-muadat': () => [WAY_LANG, npcStep('bacphuong', 'Ra làng, xuống đường phía Nam tới khu nhà ở, gặp Bác Tư khu phố (bấm vào bác). Chọn lô trống rồi bấm “Mua lô” (cần đủ lá bồ đề).')],
  'm-nangnha': () => [WAY_LANG, npcStep('bacphuong', 'Gặp Bác Tư khu phố ở khu nhà ở và bấm nút “Nâng lên …” trong bảng đất ở (cần đủ lá bồ đề).')],
  'm-noithat': () => [tap('cuahang', 'Bấm “Cửa hàng” (thanh menu dưới), chọn một món rồi bấm “Mua” (cần đủ lá bồ đề, bạn phải có nhà).', false), tap('tuido', 'Mở “Túi đồ”, bấm “Đặt” ở món vừa mua để bày vào nhà.', false)],
  'm-cau': () => [go(PLACE_STAND.hoca.x, PLACE_STAND.hoca.z, 3, 'Đi ra hồ cá ở phía Đông sân chùa (qua hành lang, Gác chuông), hoặc đứng sát mép ao sen / hồ thác.'), tap('cauca', 'Bấm biểu tượng cần câu “Câu cá” (cụm nút tròn góc phải-trên). Chưa có cầu thì mở tab “Quả cầu” mua một quả, rồi sang tab “Thả cầu”, bấm “Thả cầu” và bấm “Bấm!” đúng lúc hoa sen nở.', false)],
  'm-phongsinh': () => [go(PLACE_STAND.hoca.x, PLACE_STAND.hoca.z, 3, 'Đi ra hồ cá ở phía Đông sân chùa, hoặc đứng sát mép ao sen / hồ thác.'), tap('cauca', 'Câu được cá rồi bấm “Phóng sinh”; hoặc mở tab “Ao cá” và phóng sinh từng con đã thu.', false)],
  'n-phongsinh': () => [go(PLACE_STAND.hoca.x, PLACE_STAND.hoca.z, 3, 'Đi ra hồ cá ở phía Đông sân chùa, hoặc đứng sát mép ao sen / hồ thác.'), tap('cauca', 'Mở “Câu cá”, bấm “Phóng sinh” một con vừa câu được hoặc một con trong tab “Ao cá”.', false)],
  'm-lang': () => [WAY_LANG, go(PLACE_STAND.lang.x, PLACE_STAND.lang.z, 4, 'Đi thẳng xuống đường làng cho tới khi thấy hai hàng nhà.')],
  'm-thac': () => [WAY_LANG, go(0, 104, 3, 'Đi dọc đường làng tới ngã ba, chỗ có đường mòn rẽ sang phải.'), go(PLACE_STAND.thacnuoc.x, PLACE_STAND.thacnuoc.z, 4, 'Rẽ phải, theo đường mòn tới thác nước.')],
  'm-rung': () => [WAY_LANG, go(0, 89, 3, 'Đi dọc đường làng tới ngã ba, chỗ có đường mòn rẽ sang trái.'), go(PLACE_STAND.rung.x, PLACE_STAND.rung.z, 4, 'Rẽ trái, theo đường mòn vào rừng thông.')],
};

/** Bước dẫn đường của các bước cốt truyện chương 1 (id 's-...', xem story.js). Nút 'tuoicay' do js/ui/story.js tạo. */
function storySteps(id) {
  const npc = (nid, text) => ({ text, npc: NPCS.find((n) => n.id === nid) });
  const treeGo = go(WATER_SPOT.x, WATER_SPOT.z, 1.8, 'Đi tới cây bồ đề cổ ở phía Tây chánh điện (đứng phía Đông gốc cây).');
  const water = tap('tuoicay', 'Bấm nút “Tưới cây” (hiện bên dưới thẻ mục tiêu), chờ nước rót xong.', false);
  switch (id) {
    case 's-meet': return [npc('chutieu', 'Đến gặp chú tiểu Minh ở ngoài cổng chùa (bấm vào chú, hoặc để mình dẫn tới).')];
    case 's-abbot': return [npc('truru', 'Vào chánh điện gặp thầy Trụ trì (bấm vào thầy, hoặc để mình dẫn tới).')];
    case 's-water1': case 's-water2': return [treeGo, water];
    case 's-meditate': return [HALL_GO, tap('thien', 'Bấm “Thiền”, nhân vật tự ngồi vào bồ đoàn. Ngồi yên đủ 3 phút, thanh tiến độ ở thẻ mục tiêu.')];
    default: return [];
  }
}

/** Nhiệm vụ cần nhắm đích theo tình huống (người khác, nơi chưa ghé, hoa sen vàng). */
const DYNAMIC = new Set(['n-npc', 'm-npc', 'm-dao', 'm-loc']);

function dynamicSteps(q, prog, pos, ctx) {
  if (q.id === 'n-npc' || q.id === 'm-npc') {
    const seen = new Set(q.id === 'm-npc' ? (prog.seen.npc || []) : []);   // hằng ngày: ai cũng được; hành trình: người CHƯA từng nói chuyện
    let best = null;
    for (const n of NPCS) { if (seen.has(n.id)) continue; const d = D(pos, n.stand); if (!best || d < best.d) best = { n, d }; }
    if (!best) return [{ text: 'Bạn đã trò chuyện với mọi người rồi.' }];
    return [{ text: `Đến nói chuyện với ${best.n.ten} (bấm vào nhân vật, hoặc để mình dẫn tới).`, npc: best.n }];
  }
  if (q.id === 'm-dao') {
    const seen = new Set(prog.seen.visit || []); let best = null;
    for (const p of PLACES) { const st = PLACE_STAND[p.id]; if (!st || seen.has(p.id)) continue; const d = D(pos, st); if (!best || d < best.d) best = { p, st, d }; }
    if (!best) return [{ text: 'Bạn đã ghé hết các nơi rồi.' }];
    return [go(best.st.x, best.st.z, Math.max(1.5, best.p.r * 0.5), `Đi tới ${best.p.ten} (còn ${Math.max(0, q.dk.n - seen.size)} nơi nữa).`, { dyn: true })];
  }
  if (q.id === 'm-loc') {
    const loc = ctx.loc;
    if (!loc) return [{ text: 'Hoa sen vàng chưa nở. Hãy vào sân chùa và đợi một chút.' }];
    const ms = typeof loc.msLeft === 'function' ? loc.msLeft() : 0;
    if (ms > 0 && typeof loc.active === 'function' && !loc.active()) return [{ text: `Hoa sen vàng đang nghỉ, khoảng ${Math.ceil(ms / 1000)} giây nữa sẽ nở lại.`, wait: ms }];
    const s = loc.spot; if (!s) return [{ text: 'Hoa sen vàng chưa nở. Hãy vào sân chùa và đợi một chút.' }];
    return [go(s.x, s.z, Math.min(LOC_RADIUS - 0.3, 1.2), 'Đi tới hoa sen vàng đang phát sáng trong sân chùa để nhận lộc.', { dyn: true })];
  }
  return [];
}

/**
 * Kế hoạch dẫn đường cho nhiệm vụ `questId`.
 * prog: trạng thái nhiệm vụ (loadProg); pos: {x,z}; ctx: { idx (bước đang làm, từ lần trước), loc ({active,spot,msLeft}|null), now }.
 * Trả null nếu không có nhiệm vụ đó; còn lại { id, ten, cur, need, done, idx, steps:[{text,state}], target, tap, key, dist, wait }.
 *  target: { kind:'walk', x, z, r, label } | { kind:'npc', spot:'npc-<id>', x, z, r, label } | null.
 */
export function planGuide(questId, prog, pos, ctx = {}) {
  if (isStoryQuest(questId)) return storyGuide(questId, pos, ctx);
  const row = questStatus(prog, ctx.now || Date.now()).find((r) => r.q.id === questId); if (!row) return null;
  const q = row.q, base = { id: q.id, ten: q.ten, cur: row.cur, need: row.need };
  if (row.done) return { ...base, done: true, idx: 0, steps: [], target: null, tap: null, key: q.id + ':done', dist: null, wait: 0 };
  const raw = DYNAMIC.has(q.id) ? dynamicSteps(q, prog, pos, ctx) : (STATIC_STEPS[q.id] ? STATIC_STEPS[q.id]() : []);
  if (!raw.length) return { ...base, done: false, idx: 0, steps: [{ text: q.mo, state: 'now' }], target: null, tap: null, key: q.id + ':plain', dist: null, wait: 0 };
  return buildPlan(base, q.id, raw, pos, ctx);
}

/** Dẫn đường cho bước cốt truyện. ctx.story = trạng thái cốt truyện (loadStory); thiếu thì coi như mới bắt đầu. */
function storyGuide(id, pos, ctx) {
  const row = storyRows(ctx.story || emptyStory()).find((r) => r.q.id === id), q = row.q, base = { id: q.id, ten: q.ten, cur: row.cur, need: row.need };
  if (row.done) return { ...base, done: true, idx: 0, steps: [], target: null, tap: null, key: q.id + ':done', dist: null, wait: 0 };
  if (row.locked) {
    const prev = storyRows(ctx.story || emptyStory()).find((r) => !r.done);
    return { ...base, done: false, idx: 0, steps: [{ text: `Chưa tới bước này. Hãy làm xong “${prev.q.ten}” trước.`, state: 'now' }], target: null, tap: null, key: q.id + ':locked', dist: null, wait: 0 };
  }
  return buildPlan(base, q.id, storySteps(id), pos, ctx);
}

/** Từ danh sách bước thô tạo kế hoạch: bước đang làm, đích, nút cần bấm. */
function buildPlan(base, qid, raw, pos, ctx) {
  const last = raw.length - 1; let idx = Math.max(0, Math.min(last, ctx.idx | 0));
  const reached = (s) => s.go && (s.go.hall ? insideHall(pos) : D(pos, s.go) <= s.go.r);
  for (let j = last - 1; j >= idx; j--) if (reached(raw[j])) { idx = j + 1; break; }   // đã tới (hoặc đi lướt qua) mốc nào thì sang bước sau mốc đó
  if (raw[idx].hall && !insideHall(pos)) { const h = raw.findIndex((s) => s.go && s.go.hall); if (h >= 0) idx = h; }   // ra khỏi chánh điện thì quay lại bước vào điện
  const steps = raw.map((s, i) => ({ text: s.text, state: i < idx ? 'done' : i === idx ? 'now' : 'todo' }));
  const cur = raw[idx]; let target = null;
  if (cur.go) target = { kind: 'walk', x: cur.go.x, z: cur.go.z, r: cur.go.r, label: cur.text };
  else if (cur.npc) target = { kind: 'npc', spot: 'npc-' + cur.npc.id, x: cur.npc.stand.x, z: cur.npc.stand.z, r: 2.2, label: cur.npc.ten };
  const key = `${qid}:${idx}:${target ? target.kind + ':' + (target.spot || `${target.x},${target.z}`) : 'none'}`;
  return { ...base, done: false, idx, steps, target, tap: cur.tap || null, key, dist: target ? D(pos, target) : null, wait: cur.wait || 0 };
}
