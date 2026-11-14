// DÒNG THỜI GIAN MILI-GIÂY CỦA TỪNG CHIÊU (prompt "chiêu thức 3D chuyên nghiệp" mục 3 và mục 14 điểm 1). LOGIC THUẦN, có test: tests/chieuthoigian.test.mjs.
// Mốc 0 = lúc bấm nút. Mọi mốc LẤY TỪ DỮ LIỆU CÓ SẴN, không có số mới: gồng/hậu động ở thẻ chiêu (js/world/chieuNguHanh.js), thời lượng khung phát ở lịch tư thế (js/world/chieuPose.js), hồi chiêu ở combatSkills.js.
// Bảng in sẵn cho cả 30 chiêu: docs/CHIEU_THOI_GIAN.md (tạo bằng `node tools/chieuThoiGian.mjs`).
import { chieuOf } from './chieuNguHanh.js';
import { castTimeline } from './chieuPose.js';
import { skillById } from './skillCatalog.js';
import { COMBAT_SKILLS } from '../data/combatSkills.js';

/** Cửa sổ né khoan dung theo luật mạng (ms): máy chủ/chủ phòng vẫn cho né thêm ngần này sau mốc trúng. */
export const CUA_SO_NE_MS = 150;
/** Hủy gồng bằng di chuyển mất 30% hồi chiêu (dụ chiêu); bị khống chế cắt thì mất 100% (luật lõi Bản 2 mục 3.2). */
export const MAT_CD_KHI_HUY = Object.freeze({ diChuyen: 0.3, biKhongChe: 1 });
/** Ngưỡng "đọc được" (giây) giữa lúc dấu hiệu hiện và lúc sát thương tính. `moi` = prompt chiêu thức 3D; `ban2` = Bản 2 mục 3.2 (đang dùng trong mã). */
export const NGUONG_DOC = Object.freeze({
  moi: Object.freeze({ thuong: 0.4, dienRong: 0.8, tuyet: 1.5 }),
  ban2: Object.freeze({ thuong: 0.25, dienRong: 0.5, tuyet: 1.5 }),
});

const ms = (s) => Math.round(s * 1000);
const SLOT_TXT = { 1: 'Chiêu 1', 2: 'Chiêu 2', 3: 'Chiêu 3', 4: 'Chiêu 4', tuyet: 'Tuyệt học' };

/**
 * Dòng thời gian một chiêu (mili-giây từ lúc bấm). Chiêu lạ → null.
 * moc: bam (0) · gongBatDau (0) · canhBaoHien (0: vùng cảnh báo hiện ngay khi bắt đầu gồng) · huyDuocDen (hết gồng: sau đó không hủy bằng di chuyển được) · phat · trungDon · hetHauDong · hetHoiChieu.
 * trungDon = giữa khung phát + thời gian đạn bay tới (tam ÷ tocDo, nếu thẻ khai báo cả hai). Đạn bay chậm có thể trúng SAU khi hết hậu động.
 * khung: [bắt đầu, kết thúc] của gồng / phát / thu. cuaSoNeDen = trungDon + 150 ms.
 */
export function dongThoiGian(id) {
  const c = chieuOf(id), L = castTimeline(id), sk = skillById(id); if (!c || !L || !sk) return null;
  const bay = c.tam && c.tocDo ? c.tam / c.tocDo : 0, phat = ms(L.gong), phatCuoi = ms(L.gong + L.phat), trung = ms(L.gong + L.phat * 0.5 + bay);
  return {
    id, ten: sk.ten, he: sk.he, slot: sk.slot, slotTen: SLOT_TXT[sk.slot] || String(sk.slot), cdMs: ms(sk.cd),
    moc: { bam: 0, gongBatDau: 0, canhBaoHien: 0, huyDuocDen: phat, phat, trungDon: trung, hetHauDong: ms(L.tong), hetHoiChieu: ms(sk.cd) },
    khung: { gong: [0, phat], phat: [phat, phatCuoi], thu: [phatCuoi, ms(L.tong)] },
    cuaSoNeDen: trung + CUA_SO_NE_MS, bayMs: ms(bay),
  };
}

/** Chiêu có gây hại không (vùng cảnh báo đỏ ngà, không phải buff tự thân)? Dùng để biết có áp ngưỡng "đọc được" hay không. */
const gayHai = (c) => !!c && !(c.canhBao && c.canhBao.loi) && !c.huyDuoc;
function loaiNguong(id, c) {
  const h = c.canhBao && c.canhBao.hinh;
  if (String(id).endsWith('_tuyet')) return 'tuyet';
  if (h && ((h.kieu === 'tron' && h.r >= 4) || (h.kieu === 'duong' && h.dai * h.rong >= 20))) return 'dienRong';   // diện rộng: vòng bán kính ≥ 4 m hoặc đường rộng ≥ 20 m²
  return 'thuong';
}

/**
 * Kiểm "đọc được" của một chiêu: thời gian từ lúc dấu hiệu hiện (mốc 0) tới lúc sát thương tính (trungDon) so với hai bộ ngưỡng.
 * Chiêu có lợi/buff: { gayHai: false }. Chiêu gây hại: { gayHai, loai, baoTruocMs, nguongMoiMs, datMoi, nguongBan2Ms, datBan2 }. Lạ → null.
 */
export function kiemDocDuoc(id) {
  const tl = dongThoiGian(id), c = chieuOf(id); if (!tl || !c) return null;
  if (!gayHai(c)) return { id, gayHai: false };
  const loai = loaiNguong(id, c), b = tl.moc.trungDon, nm = ms(NGUONG_DOC.moi[loai]), n2 = ms(NGUONG_DOC.ban2[loai]);
  return { id, gayHai: true, loai, baoTruocMs: b, nguongMoiMs: nm, datMoi: b >= nm, nguongBan2Ms: n2, datBan2: b >= n2 };
}

/** Dòng thời gian cả 30 chiêu theo thứ tự trong combatSkills.js. */
export const bangDongThoiGian = () => COMBAT_SKILLS.map((s) => dongThoiGian(s.id)).filter(Boolean);

/** Các hàng [nhãn, ms, ghi chú] của một dòng thời gian (cho bảng giữ-để-xem / tài liệu). */
export function hangThoiGian(tl) {
  if (!tl) return [];
  const m = tl.moc;
  return [['Bấm nút', m.bam, 'mốc 0'], ['Bắt đầu gồng', m.gongBatDau, 'tư thế dự bị'], ['Cảnh báo hiện', m.canhBaoHien, 'vùng viền + hoa văn'],
    ['Hủy được đến', m.huyDuocDen, 'di chuyển hủy: mất 30% hồi chiêu'], ['Phát', m.phat, 'bùng nổ'], ['Trúng', m.trungDon, tl.bayMs ? `đạn bay ${tl.bayMs} ms` : 'tức thì'],
    ['Hết hậu động', m.hetHauDong, 'đứng yên chịu giá'], ['Hết hồi chiêu', m.hetHoiChieu, 'tính từ lúc bấm']];
}
