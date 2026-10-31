// Chỉ tay / Nhân tướng: kiểm tra kết quả AI trả về trước khi hiển thị (không tin dữ liệu từ máy chủ).
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const LOI_API = {
  api_disabled: 'Tính năng này cần máy chủ AI. Chủ trang chưa cấu hình địa chỉ máy chủ.',
  vision_not_configured: 'Máy chủ chưa có khóa AI. Chủ trang cần thêm ANTHROPIC_API_KEY.',
  consent_required: 'Bạn cần đồng ý trước khi gửi ảnh.',
  image_too_large: 'Ảnh quá lớn, hãy chụp lại gần hơn hoặc chọn ảnh nhỏ hơn.',
  no_image: 'Chưa có ảnh.',
  timeout: 'Máy chủ phản hồi quá lâu, hãy thử lại.',
  network: 'Không kết nối được máy chủ.',
};
export const thongBaoLoi = (code) => LOI_API[code] || (String(code).startsWith('vision_') ? 'AI chưa đọc được ảnh này, hãy thử ảnh rõ hơn.' : 'Có lỗi, hãy thử lại sau.');

/** Chuẩn hóa kết quả: giới hạn độ dài, bỏ trường lạ. Trả null nếu không dùng được. */
export function chuanHoaKetQua(r) {
  if (!r || typeof r !== 'object') return null;
  const muc = Array.isArray(r.muc) ? r.muc.slice(0, 12).map((m) => ({ ten: str(m && m.ten, 60), quanSat: str(m && m.quanSat, 300), y: str(m && m.y, 400) })).filter((m) => m.ten && (m.quanSat || m.y)) : [];
  const q = ['tot', 'vua', 'kem'].includes(r.chatLuongAnh) ? r.chatLuongAnh : 'vua';
  const out = { chatLuongAnh: q, tongQuan: str(r.tongQuan, 500), muc, loiKhuyen: Array.isArray(r.loiKhuyen) ? r.loiKhuyen.slice(0, 3).map((x) => str(x, 300)).filter(Boolean) : [], luuY: str(r.luuY, 300) || 'Nội dung chỉ mang tính tham khảo, giải trí và chiêm nghiệm văn hóa.' };
  return out.tongQuan || out.muc.length ? out : null;
}

/** Kích thước thu nhỏ giữ tỉ lệ, cạnh dài tối đa max. */
export function kichThuocThuNho(w, h, max = 1024) {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}
