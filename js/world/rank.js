// Bảng xếp hạng (Phiên 2): logic THUẦN — không đụng DOM/mạng, có test (tests/rank.test.mjs). Giao diện: js/ui/rank.js. Máy chủ: gas/Rank.gs.

export const PING_MS = 90000;        // báo "tôi đang online" mỗi 90 giây (máy chủ coi online nếu có tín hiệu trong 150 giây)
export const REFRESH_MS = 20000;     // bảng đang mở thì tự làm mới mỗi 20 giây
const int = (v, lo, hi) => { v = Math.floor(Number(v)); if (!Number.isFinite(v)) v = lo; return Math.max(lo, Math.min(hi, v)); };
const txt = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Số có dấu chấm ngăn cách hàng nghìn: 12345 → "12.345". */
export const fmtNum = (n) => String(int(n, 0, 1e12)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * Gói điểm gửi lên máy chủ (action saveScore). sen = TỔNG hạt sen từng kiếm, đã tính sẵn bằng lifetimeSen (đổi lá không làm tụt).
 * level = kết quả levelOf(xp) ({ lv, ten }); leaf = { la, spent }; info chỉ chứa khóa [a-z0-9]{1,12} (xem gas/Rank.gs).
 */
export function buildScore({ sen = 0, leaf = null, level = null, xp = 0, done = 0, total = 0, board = false, chapter1 = false } = {}) {
  const info = {};
  if (level && level.ten) info.ten = txt(level.ten, 30);
  info.nv = int(done, 0, 9999); info.tnv = int(total, 0, 9999);
  info.ls = int(leaf && leaf.spent, 0, 1e9);        // lá bồ đề đã tiêu
  info.van = board ? 1 : 0; info.c1 = chapter1 ? 1 : 0;
  return { sen: int(sen, 0, 1e9), lv: int(level && level.lv, 1, 999), xp: int(xp, 0, 1e9), la: int(leaf && leaf.la, 0, 1e9), info };
}
/** Dấu vân của gói điểm: giống nhau nghĩa là không có gì mới để gửi (chỉ cần báo online). */
export const scoreSig = (p) => JSON.stringify([p.sen, p.lv, p.xp, p.la, p.info]);

/** "vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước"... ts = mili-giây. */
export function agoText(ts, now = Date.now()) {
  ts = Number(ts); if (!(ts > 0)) return 'chưa rõ';
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 90) return 'vừa xong';
  const m = Math.floor(s / 60); if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24); if (d < 30) return `${d} ngày trước`;
  if (d < 360) return `${Math.floor(d / 30)} tháng trước`;
  return `${Math.max(1, Math.floor(d / 365))} năm trước`;
}
export function dateText(ts) {
  ts = Number(ts); if (!(ts > 0)) return 'chưa rõ';
  const d = new Date(ts), p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
/** "Đang online" hoặc "Offline · 5 phút trước". */
export const statusText = (row, now = Date.now()) => (row && row.on ? 'Đang online' : `Offline · ${agoText(row && row.seen, now)}`);

const row = (r) => (r && /^[0-9a-f]{12}$/.test(String(r.id))
  ? { rank: int(r.rank, 1, 1e6), id: String(r.id), n: txt(r.n, 20) || 'Khách', lv: int(r.lv, 1, 999), ten: txt(r.ten, 30), sen: int(r.sen, 0, 1e9), on: !!r.on, seen: Number(r.seen) || 0 } : null);
/** Làm sạch trả lời getRank: hàng sai bị bỏ; trả null nếu cả phản hồi không dùng được. */
export function cleanList(res) {
  if (!res || !res.ok || !Array.isArray(res.top)) return null;
  return { total: int(res.total, 0, 1e6), top: res.top.map(row).filter(Boolean), me: row(res.me) };
}
/** Làm sạch trả lời getPlayer → { ...hàng, xp, la, created, info } hoặc null. */
export function cleanPlayer(res) {
  if (!res || !res.ok || !res.player) return null;
  const p = res.player, base = row(p); if (!base) return null;
  const info = {}; if (p.info && typeof p.info === 'object') for (const k of Object.keys(p.info)) { const v = p.info[k]; if (/^[a-z0-9]{1,12}$/.test(k) && (typeof v === 'number' || typeof v === 'string')) info[k] = typeof v === 'string' ? txt(v, 40) : v; }
  return { ...base, xp: int(p.xp, 0, 1e9), la: int(p.la, 0, 1e9), created: Number(p.created) || 0, info };
}

/** Các dòng "thông tin chi tiết" của thẻ người chơi: [{ k: nhãn, v: giá trị }]. Dòng nào chưa có dữ liệu thì bỏ. */
export function detailRows(p, now = Date.now()) {
  if (!p) return [];
  const i = p.info || {}, out = [];
  out.push({ k: 'Hạng', v: '#' + p.rank });
  out.push({ k: 'Cấp', v: `${p.lv}${p.ten ? ' · ' + p.ten : ''}` });
  out.push({ k: 'Trạng thái', v: statusText(p, now) });
  out.push({ k: 'Điểm công hạnh', v: fmtNum(p.xp) });
  out.push({ k: 'Hạt sen đã kiếm (tổng)', v: fmtNum(p.sen) });
  out.push({ k: 'Lá bồ đề đang có', v: fmtNum(p.la) });
  if (typeof i.ls === 'number') out.push({ k: 'Lá bồ đề đã dùng', v: fmtNum(i.ls) });
  if (typeof i.nv === 'number' && typeof i.tnv === 'number' && i.tnv > 0) out.push({ k: 'Nhiệm vụ đã xong', v: `${i.nv}/${i.tnv}` });
  if (typeof i.c1 === 'number') out.push({ k: 'Cốt truyện chương 1', v: i.c1 ? 'Đã hoàn thành' : 'Đang làm' });
  if (typeof i.van === 'number') out.push({ k: 'Ván trượt', v: i.van ? 'Đã có' : 'Chưa có' });
  if (p.created) out.push({ k: 'Tham gia từ', v: dateText(p.created) });
  if (!p.on && p.seen) out.push({ k: 'Lần cuối thấy', v: agoText(p.seen, now) });
  return out;
}
