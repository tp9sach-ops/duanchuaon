// Dữ liệu + logic THUẦN của khung HUD (Phiên 13b): thanh menu dưới, lưới nút hành động, cụm nút phải-trên.
// Bố cục theo ảnh mẫu (PROMPT.md mục 9.4); chữ và biểu tượng do mình tự đặt. Không đụng DOM nên test được bằng Node.
// status 'ready' = đã có chức năng thật; 'soon' = chưa có → hiện mờ, bấm vào chỉ báo "sắp có" (không giả vờ chạy).
import { SPOTS } from '../world/spots.js';

/** Thanh menu dưới (desktop) / menu dọc bên phải (điện thoại): đúng 9 mục như ảnh mẫu. */
export const BOTTOM_MENU = [
  { id: 'nhiemvu',   label: 'Nhiệm vụ',    icon: 'scroll', status: 'ready', action: 'quest' },
  { id: 'tuido',     label: 'Túi đồ',      icon: 'bag',    status: 'ready', action: 'bag' },
  { id: 'cuahang',   label: 'Cửa hàng',    icon: 'shop',   status: 'ready', action: 'shop' },
  { id: 'congdong',  label: 'Cộng đồng',   icon: 'people', status: 'ready', action: 'chat' },
  { id: 'xephang',   label: 'Xếp hạng',    icon: 'rank',   status: 'ready', action: 'rank' },
  { id: 'bando',     label: 'Bản đồ chùa', icon: 'map',    status: 'ready', action: 'map' },
  { id: 'thienphai', label: 'Thiền phái',  icon: 'lotus',  status: 'soon' },
  { id: 'gopy',      label: 'Góp ý',       icon: 'chat',   status: 'soon' },
  { id: 'caidat',    label: 'Cài đặt',    icon: 'gear',   status: 'soon' },
];

/** Lưới 3×2 nút hành động phải-dưới. "Dâng lễ" mở bảng thắp nhang 1/3/9 (js/ui/den.js, Phiên 14c); Linh thú còn khóa. */
export const ACTIONS = [
  { id: 'lay',     label: 'Lạy Phật',  icon: 'bow',    status: 'ready', action: 'bow' },
  { id: 'trenghat', label: 'Tràng hạt', icon: 'beads',  status: 'ready', action: 'beads' },
  { id: 'tungkinh', label: 'Tụng kinh', icon: 'book',   status: 'ready', action: 'chant' },
  { id: 'thien',   label: 'Thiền',     icon: 'sit',    status: 'ready', action: 'meditate' },
  { id: 'danglee', label: 'Dâng lễ',   icon: 'incense', status: 'ready', action: 'le' },
  { id: 'linhthu', label: 'Linh thú',  icon: 'paw',    status: 'soon', locked: true },
];

/** Cụm nút tròn nhỏ phải-trên (sau hai ô số). */
export const TOP_ICONS = [
  { id: 'den',      label: 'Đèn nguyện', icon: 'lamp',  status: 'ready', action: 'den' },
  { id: 'thongbao', label: 'Thông báo', icon: 'bell',  status: 'soon' },
  { id: 'qua',      label: 'Quà',       icon: 'gift',  status: 'soon' },
  { id: 'thu',      label: 'Thư',       icon: 'mail',  status: 'soon' },
  { id: 'cauca',    label: 'Câu cá',    icon: 'fish',  status: 'ready', action: 'fish' },
  { id: 'chiase',   label: 'Chia sẻ',   icon: 'share', status: 'ready', action: 'share' },
  { id: 'trogiup',  label: 'Trợ giúp',  icon: 'help',  status: 'ready', action: 'help' },
];

/** Chữ hiện dưới nút tròn phải-trên (Phiên 69): người mới không đoán biểu tượng. Dùng nhãn gốc; chỉ rút gọn khi quá dài để không đè nút bên cạnh. */
export const CAPTION_MAX = 9;
export const LONG_PRESS_MS = 450;   // điện thoại: nhấn giữ một nút tròn → báo tên nút (không bấm)
const CAPTION_SHORT = { 'Đèn nguyện': 'Đèn', 'Thông báo': 'Báo tin' };
export function captionOf(item) {
  if (!item || !item.label) return '';
  const t = CAPTION_SHORT[item.label] || item.label;
  return t.length > CAPTION_MAX ? t.slice(0, CAPTION_MAX - 1) + '…' : t;
}

/** Số hạt sen / ngọc: GIÁ TRỊ TẠM (chưa có tiến trình — Phiên 16). Không bịa số như ảnh mẫu. */
export const WALLET_PLACEHOLDER = { sen: 0, ngoc: 0 };

/** Câu báo khi bấm Lạy Phật / Thiền mà chưa ở trong chánh điện. */
export const OUTSIDE_TEXT = 'Hãy vào chánh điện trước (nút “Vào chánh điện”), rồi bấm lại nhé.';
export const HELP_TEXT = 'Bấm vào đất để đi · bấm bồ đoàn để ngồi · kéo để xoay · cuộn hoặc chụm hai ngón để phóng to · WASD hoặc mũi tên để đi · Esc đóng bảng';
export const WELCOME_TEXT = 'Chào mừng đến Diệu Giang Tự. Bấm vào sân để đi, bấm vào cổng, ao sen, nhà tổ, gác chuông hoặc lư hương để xem.';

export const isReady = (item) => !!item && item.status === 'ready';

/** Câu báo khi bấm nút chưa có tính năng. */
export function soonText(item) {
  const name = item && item.label ? item.label : 'Tính năng này';
  return item && item.locked ? `${name} đang khóa — sẽ mở ở bản sau.` : `${name} sắp có — đang được làm.`;
}

/** Nhãn đọc cho trình đọc màn hình / chú thích: nút chưa có ghi rõ "(sắp có)". */
export function ariaLabel(item) { return isReady(item) ? item.label : `${item.label} (sắp có)`; }

/** Bấm một nút thì làm gì → mô tả thuần để UI thực thi và test kiểm. */
export function pressResult(item) {
  if (!item) return { kind: 'none' };
  if (!isReady(item)) return { kind: 'soon', text: soonText(item) };
  if (item.action === 'goto') return { kind: 'goto', id: item.target };
  if (['map', 'share', 'help', 'bow', 'meditate', 'le', 'den', 'chat', 'quest', 'beads', 'chant', 'bag', 'shop', 'fish', 'rank'].includes(item.action)) return { kind: item.action };
  return { kind: 'soon', text: soonText(item) };
}

/** "Bản đồ chùa" = danh sách điểm đến lấy thẳng từ spots.js (một nguồn duy nhất). */
export function mapEntries() { return SPOTS.map((s) => ({ id: s.id, num: s.num, label: s.label })); }

/** Số gọn: 1200 → "1,2k". */
export function formatCount(n) {
  n = Math.max(0, Math.floor(+n || 0));
  if (n < 1000) return String(n);
  return (n / 1000).toFixed(n < 10000 ? 1 : 0).replace('.', ',').replace(/,0$/, '') + 'k';
}

/** Hàng đợi thông báo giữa-trên: mỗi lần chỉ hiện một dòng, dòng mới thay dòng cũ; trùng nội dung liên tiếp thì chỉ gia hạn. */
export function createToastState() {
  let cur = null;
  return {
    push(text, ms = 4200, now = 0) { text = String(text || '').trim().slice(0, 140); if (!text) return cur; cur = { text, until: now + Math.max(1200, ms) }; return cur; },
    get(now = 0) { if (cur && now >= cur.until) cur = null; return cur; },
    clear() { cur = null; },
  };
}
