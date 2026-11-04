// Đèn nguyện, dâng lễ (nhang) và hoa sen vàng nhận lộc (Phiên 14c). THUẦN: không DOM, có test.
// Lưu cục bộ trước (localStorage ở lớp UI); đồng bộ chung qua GAS dùng lại addPrayer/listPrayers (đã có lọc nội dung).
import { kiemTraNguyen } from './temple.js';

export const MAX_LAMPS = 50, MAX_LOG = 40, LIT_MS = 24 * 3600 * 1000;
/** Công đức nhận được — GIÁ TRỊ TẠM (ptg chưa chốt, Phiên 16 làm tiến trình thật). */
export const DEN_MERIT = { lamp: 2, nhang: { 1: 1, 3: 2, 9: 3 }, loc: 1 };
export const nhangMerit = (n) => DEN_MERIT.nhang[n] || 0;

const toInt = (v, a, b) => { v = Math.floor(+v); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : a; };
const cleanName = (s) => { const t = Array.from(String(s == null ? '' : s).replace(/\s+/g, ' ').replace(/[<>]/g, '').trim()).slice(0, 20).join(''); return t || 'Khách'; };

/** Tạo một ngọn đèn từ điều nguyện. rnd để test. Trả { ok, lamp } hoặc { ok:false, error } (empty | no_links | no_numbers). */
export function makeLamp(text, name, now = Date.now(), rnd = Math.random) {
  const v = kiemTraNguyen(text); if (!v.ok) return v;
  return { ok: true, lamp: { id: 'd' + now.toString(36) + Math.floor(rnd() * 1296).toString(36), text: v.text, name: cleanName(name), t: now, n: 1 } };
}
export const addLamp = (list, lamp) => [lamp, ...(Array.isArray(list) ? list : [])].slice(0, MAX_LAMPS);

/** Đọc dữ liệu lưu (chuỗi JSON hoặc mảng) → mảng đèn sạch: bỏ mục hỏng, cắt độ dài, lọc lại nội dung. */
export function loadLamps(raw) {
  let a = raw; if (typeof raw === 'string') { try { a = JSON.parse(raw); } catch (_) { a = null; } }
  if (!Array.isArray(a)) return [];
  return a.map((o) => {
    if (!o || typeof o.text !== 'string') return null;
    const v = kiemTraNguyen(o.text); if (!v.ok) return null;
    const t = Number(o.t); if (!Number.isFinite(t) || t <= 0) return null;
    return { id: String(o.id || 'd' + t.toString(36)).slice(0, 24), text: v.text, name: cleanName(o.name), t, n: toInt(o.n, 1, 999) };
  }).filter(Boolean).slice(0, MAX_LAMPS);
}

/** "vừa xong", "4 phút trước", "3 giờ trước", "2 ngày trước". */
export function agoText(t, now = Date.now()) {
  const s = Math.floor((now - t) / 1000);
  if (!Number.isFinite(s) || s < 45) return 'vừa xong';
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  return Math.floor(s / 86400) + ' ngày trước';
}
/** Số ngọn đang sáng (đèn thả trong 24 giờ qua, cộng theo `n`). */
export const litCount = (list, now = Date.now()) => (list || []).reduce((s, l) => s + (now - l.t < LIT_MS && now >= l.t ? l.n : 0), 0);

/** Nhật ký hoạt động: kind 'den' | 'nhang' | 'loc'. Mới nhất ở đầu. */
export function logEvent(log, kind, text, now = Date.now()) {
  return [{ k: ['den', 'nhang', 'loc'].includes(kind) ? kind : 'den', text: String(text || '').slice(0, 120), t: now }, ...(Array.isArray(log) ? log : [])].slice(0, MAX_LOG);
}
export function loadLog(raw) {
  let a = raw; if (typeof raw === 'string') { try { a = JSON.parse(raw); } catch (_) { a = null; } }
  return Array.isArray(a) ? a.filter((o) => o && typeof o.text === 'string' && Number.isFinite(+o.t)).map((o) => ({ k: ['den', 'nhang', 'loc'].includes(o.k) ? o.k : 'den', text: o.text.slice(0, 120), t: +o.t })).slice(0, MAX_LOG) : [];
}
/** Thẻ của từng tab. 'chua' = đèn của mình tại chùa này; 'tat' = tường chung từ máy chủ (shared: [{noiDung, ngay}]); 'hoat' = nhật ký. */
export function tabItems(tab, { lamps = [], shared = null, log = [] } = {}) {
  if (tab === 'chua') return lamps.map((l) => ({ kind: 'lamp', text: l.text, name: l.name, t: l.t, n: l.n }));
  if (tab === 'tat') return (shared || []).map((s) => ({ kind: 'lamp', text: String(s.noiDung || '').slice(0, 120), name: 'Ẩn danh', date: String(s.ngay || '').slice(0, 10), n: 1 }));
  if (tab === 'hoat') return log.map((e) => ({ kind: e.k, text: e.text, t: e.t }));
  return [];
}
