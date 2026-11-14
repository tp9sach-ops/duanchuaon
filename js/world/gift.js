// Gửi quà giữa người chơi (Phiên 161): logic THUẦN — không đụng DOM/mạng, có test (tests/gift.test.mjs). Giao diện: js/ui/gift.js. Máy chủ: gas/Gifts.gs (giftSend / giftInbox / giftClaim).
// Bốn loại quà (id khớp bảng CAP của gas/Gifts.gs): sen = hạt sen (≤1000/lần), la = lá bồ đề (≤100/lần), hoimau = Bánh sầu riêng 3 vị, dichchuyen = Bánh sầu riêng pho mai than tre (mỗi loại ≤3/lần = MAX_STACK).
// Bánh là MUA TẶNG: người gửi trả đúng giá lá bồ đề của tiệm (js/world/items.js), người nhận được thêm thời gian tác dụng như tự mua. Đồ dùng một lần (Gậy như ý, Nón, Ván trượt) không gửi được.
import { GEMS, MAX_STACK } from './items.js';

export const NOTE_MAX = 60;
export const KINDS = [
  { id: 'sen', ten: 'Hạt sen', don: 'hạt sen', cap: 1000, gem: false },
  { id: 'la', ten: 'Lá bồ đề', don: 'lá bồ đề', cap: 100, gem: false },
  ...GEMS.map((g) => ({ id: g.id, ten: g.ten, don: g.ten, cap: MAX_STACK, gem: true, gia: g.gia, giay: g.giay })),
];
const int = (v, lo, hi) => { v = Math.floor(Number(v)); if (!Number.isFinite(v)) v = lo; return Math.max(lo, Math.min(hi, v)); };
const txt = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

export const kindById = (id) => KINDS.find((k) => k.id === id) || null;
/** Số lượng hợp lệ của một loại quà (0 nếu loại lạ). */
export const cleanQty = (k, v) => (k ? int(v, 0, k.cap) : 0);

/** Chi phí { sen, la } khi gửi qty món k. Hạt sen/lá bồ đề: trừ đúng số gửi. Bánh: trừ giá lá bồ đề của tiệm × số cái. */
export function costOf(k, qty) {
  const n = cleanQty(k, qty);
  if (!k || n < 1) return { sen: 0, la: 0 };
  if (k.id === 'sen') return { sen: n, la: 0 };
  if (k.id === 'la') return { sen: 0, la: n };
  return { sen: 0, la: k.gia * n };
}
/** have = { sen, la }: đủ trả cost không. */
export const canAfford = (cost, have) => !!have && Number(have.sen) >= cost.sen && Number(have.la) >= cost.la;
/** Số lượng tối đa gửi được một lần với số sen/lá đang có (0 nếu không đủ cho một món). */
export function maxQty(k, have) {
  if (!k || !have) return 0;
  const s = Math.max(0, Math.floor(Number(have.sen) || 0)), l = Math.max(0, Math.floor(Number(have.la) || 0));
  const afford = k.id === 'sen' ? s : k.id === 'la' ? l : Math.floor(l / k.gia);
  return Math.max(0, Math.min(k.cap, afford));
}

/** Lời nhắn: giống gas/Gifts.gs giftNote_ (bỏ ký tự điều khiển, < >, link/@; không mở đầu bằng = + - @; ≤ 60 ký tự). */
export function cleanNote(s) {
  const t = txt(s, NOTE_MAX);
  if (/(https?:\/\/|www\.|@)/i.test(t)) return '';
  return t.replace(/^[=+\-@]+/, '').trim();
}

/** "10 hạt sen", "2 lá bồ đề", "1 Bánh sầu riêng 3 vị". */
export function qtyText(kind, qty) { const k = kindById(kind); return k ? `${int(qty, 0, 1e9)} ${k.don}` : ''; }
/** Dòng chữ một món quà trong hộp quà: "Minh An gửi bạn 10 hạt sen — “chúc bạn bình an”". */
export function giftLine(g) { return `${g.from} gửi bạn ${qtyText(g.kind, g.qty)}${g.note ? ` — “${g.note}”` : ''}`; }

export const NET_ERRORS = /^(network|timeout|blocked|bad_response|http_\d+)$/;
/** Phản hồi null / lỗi mạng: chưa chắc máy chủ đã nhận hay chưa (gửi lại với cùng cid thì máy chủ nhận ra). */
export const isNetError = (r) => !r || (!r.ok && NET_ERRORS.test(String(r.error)));

const ERR = {
  bad_request: 'Quà chưa hợp lệ, thử lại nhé.',
  not_ranked: 'Bạn chưa có tên trong bảng xếp hạng. Mở “Xếp hạng” một lần rồi thử lại nhé.',
  not_found: 'Không tìm thấy người nhận (có thể họ chưa vào bảng xếp hạng).',
  self: 'Không thể tự gửi quà cho mình.',
  limit: 'Bạn gửi hơi nhiều rồi. Nghỉ một lúc (tối đa 20 lần mỗi 6 giờ) rồi gửi tiếp nhé.',
  full: 'Hộp quà của người này đang đầy. Hãy đợi họ nhận bớt.',
  busy: 'Máy chủ đang bận, thử lại sau giây lát.',
  server_error: 'Máy chủ gặp lỗi, thử lại sau nhé.',
  api_disabled: 'Chưa kết nối máy chủ nên chưa gửi/nhận quà được.',
  bad_token: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
};
/** Chữ báo lỗi dễ hiểu từ mã lỗi của máy chủ / api.js. */
export function errText(code) {
  const c = String(code || '');
  if (ERR[c]) return ERR[c];
  if (NET_ERRORS.test(c) || c === '') return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.';
  return 'Chưa gửi/nhận được quà lúc này, thử lại sau nhé.';
}

/** Làm sạch trả lời giftInbox → [{ id, from, kind, qty, note, ngay }] hoặc null nếu phản hồi hỏng. Quà lạ bị bỏ. */
export function cleanInbox(res) {
  if (!res || !res.ok || !Array.isArray(res.gifts)) return null;
  const out = [];
  for (const g of res.gifts) {
    const k = g && kindById(g.kind);
    if (!k || !/^[0-9a-f]{16}$/.test(String(g.id))) continue;
    const qty = cleanQty(k, g.qty); if (qty < 1) continue;
    out.push({ id: String(g.id), from: txt(g.from, 20) || 'Một người bạn', kind: k.id, qty, note: cleanNote(g.note), ngay: Number(g.ngay) || 0 });
  }
  return out;
}

/** Tổng hợp các món vừa nhận (giftClaim.got) thành { sen, la, gems: { hoimau, dichchuyen }, n } để cộng vào game. Món lạ bị bỏ. */
export function claimPlan(got) {
  const plan = { sen: 0, la: 0, gems: {}, n: 0 };
  for (const g of Array.isArray(got) ? got : []) {
    const k = g && kindById(g.kind); if (!k) continue;
    const qty = cleanQty(k, g.qty); if (qty < 1) continue;
    plan.n++;
    if (k.id === 'sen') plan.sen += qty; else if (k.id === 'la') plan.la += qty; else plan.gems[k.id] = Math.min(MAX_STACK * 10, (plan.gems[k.id] || 0) + qty);
  }
  return plan;
}

/** Cộng qty gói bánh vào bảng hạn dùng `exp` của js/world/items.js: giống mua thêm khi còn hạn (cộng dồn, tối đa MAX_STACK lần thời lượng gốc). Trả bảng exp MỚI. */
export function grantGem(state, id, qty, now = Date.now()) {
  const g = GEMS.find((x) => x.id === id), n = int(qty, 0, MAX_STACK * 10);
  const exp = { ...((state && state.exp && typeof state.exp === 'object') ? state.exp : {}) };
  if (!g || n < 1) return exp;
  const base = Math.max(now, Number(exp[id]) || 0);
  exp[id] = Math.min(base + g.giay * 1000 * n, now + g.giay * MAX_STACK * 1000);
  return exp;
}
