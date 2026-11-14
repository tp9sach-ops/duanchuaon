// Tra cứu thẻ chiêu cả 5 Hệ (Phiên 158). LOGIC THUẦN, có test: tests/chieunguhanh.test.mjs. Hỏa: js/data/chieuHoa.js; Kim/Mộc/Thủy/Thổ: js/data/chieuNguHanh.js.
import { HOA_V2 } from '../data/chieuHoa.js';
import { CHIEU_4HE } from '../data/chieuNguHanh.js';

/** Thẻ bổ sung (gồng, cảnh báo, giá, móc nối, khắc) của chiêu `id`; lạ → null. */
export const chieuOf = (id) => CHIEU_4HE[id] || HOA_V2[id] || null;
/** Danh sách chiêu đã móc nối với `id` (dùng làm tham số thứ 2 của luatChien.chuoiMoc). Lạ → []. */
export const mocOf = (id) => { const c = chieuOf(id); return c && Array.isArray(c.moc) ? c.moc : []; };
/** Thời gian báo trước (giây) = gồng + thời gian đạn bay tới (tam/tocDo) nếu có; lạ → 0. */
export const baoTruoc = (id) => { const c = chieuOf(id); return c ? Math.round((c.gong + (c.tam && c.tocDo ? c.tam / c.tocDo : 0)) * 100) / 100 : 0; };
/** Chiêu có vùng có lợi (viền xanh nhạt: khiên, hồi máu) không? */
export const laVungLoi = (id) => { const c = chieuOf(id); return !!(c && c.canhBao && c.canhBao.loi); };
