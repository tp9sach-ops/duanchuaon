// HIỆU ỨNG 30 chiêu Ngũ Hành (Phiên 165, Bản 2 mục 6). DỮ LIỆU THUẦN, số TẠM (chờ nhìn bằng mắt + playtest). KHÔNG đổi id/tên/cấp/hồi chiêu/hệ số (nguồn: combatSkills.js).
// Hình + hoa văn vùng cảnh báo lấy từ THẺ CHIÊU (chieuOf); file này chỉ thêm: kiểu bay hạt, loại hạt, số hạt (bậc "vừa"), vệt, quầng sáng, rung màn hình, khựng đòn, tiếng.
// Bản giảm cho máy yếu / bản đầy đủ cho máy mạnh: js/world/chieuFxPlan.js (nhân số hạt + chặn trần + tắt vệt/sáng/rung/khựng).
// mode: tia (bay thẳng theo hướng chiêu) | no (nổ tỏa từ tâm) | xoay (xoáy quanh người, bay lên) | mua (rơi từ trên xuống) | hut (hút vào tâm)
// loai: lua | bang | la | da | kim | nuoc | suong (chỉ đổi cỡ + độ sáng hạt)
// am: tên "cue" CÓ SẴN trong js/world/sfx.js (không thêm file/cue mới): gong (lúc bắt đầu gồng) · phat (lúc phát) · trung (lúc trúng; chiêu hỗ trợ không có)
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };

/** Màu 2 tông mỗi Hệ (hạt chọn ngẫu nhiên giữa hai tông). */
export const FX_COLOR = deepFreeze({ kim: [0xf1e6c4, 0xd9d9e0], moc: [0x7fd18a, 0xc9f0a8], thuy: [0x8fd6f5, 0xe4f6ff], hoa: [0xff7a3d, 0xffd25a], tho: [0xc8a060, 0xe6d3a3] });
export const FX_LOAI = deepFreeze({ lua: { co: 0.3, sang: 1 }, bang: { co: 0.24, sang: 0.8 }, la: { co: 0.3, sang: 0.7 }, da: { co: 0.34, sang: 0.5 }, kim: { co: 0.2, sang: 1 }, nuoc: { co: 0.26, sang: 0.8 }, suong: { co: 0.5, sang: 0.4 } });
export const HAT_TOI_DA = Object.freeze({ yeu: 150, vua: 300, cao: 800 });   // trần số hạt MỘT chiêu theo bậc máy (Bản 2 mục 11)

const S = (mode, loai, n, o = {}) => ({ mode, loai, n, vet: false, sang: 0.5, rung: 0, dung: 0, ...o });
const A = (gong, phat, trung) => (trung ? { gong, phat, trung } : { gong, phat });
// rung 0..1 (biên độ tương đối), dung = mili giây khựng đòn, sang 0..1 (quầng sáng lúc phát), vet = vệt kéo dọc đường đi
export const CHIEU_FX = deepFreeze({
  // ---- Kim: tia lóe, mảnh kim loại, vệt chém ----
  kim_1: S('tia', 'kim', 90, { vet: true, rung: 0.25, dung: 60, am: A('tu-dong-bat', 'chem-khi-vung', 'da-trung') }),
  kim_2: S('xoay', 'kim', 80, { sang: 0.6, am: A('khieng', 'len-bac') }),
  kim_3: S('tia', 'kim', 160, { vet: true, sang: 0.7, rung: 0.7, dung: 90, am: A('tu-dong-bat', 'thiet-dau', 'thiet-dau-trung') }),
  kim_kimcang_4: S('xoay', 'kim', 100, { sang: 0.7, am: A('khieng', 'len-bac') }),
  kim_thietky_4: S('tia', 'kim', 110, { vet: true, rung: 0.5, dung: 80, am: A('tu-dong-bat', 'chem-khi', 'chem-khi-trung') }),
  kim_tuyet: S('no', 'kim', 240, { sang: 1, rung: 1, dung: 100, am: A('yq-xuat-hien', 'len-bac', 'chem-khi-trung') }),
  // ---- Mộc: lá bay, khói, bào tử ----
  moc_1: S('tia', 'la', 120, { sang: 0.4, rung: 0.1, am: A('khieng', 'nem', 'da-trung') }),
  moc_2: S('xoay', 'la', 90, { sang: 0.3, am: A('khieng', 'nem') }),
  moc_3: S('no', 'suong', 200, { sang: 0.4, am: A('khieng', 'nem') }),
  moc_uminh_4: S('no', 'suong', 150, { sang: 0.4, rung: 0.2, am: A('khieng', 'nem', 'da-trung') }),
  moc_anthan_4: S('xoay', 'la', 100, { vet: true, sang: 0.5, rung: 0.3, dung: 60, am: A('khieng', 'nem-da', 'da-trung') }),
  moc_tuyet: S('xoay', 'la', 250, { sang: 0.9, rung: 0.6, dung: 80, am: A('yq-xuat-hien', 'nem', 'chem-khi-trung') }),
  // ---- Thủy: tinh thể, sương, giọt ----
  thuy_1: S('tia', 'bang', 100, { vet: true, sang: 0.5, rung: 0.15, am: A('khieng', 'nem-da', 'da-trung') }),
  thuy_2: S('xoay', 'nuoc', 90, { sang: 0.5, am: A('khieng', 'len-bac') }),
  thuy_3: S('no', 'bang', 240, { sang: 0.8, rung: 0.6, dung: 80, am: A('khieng', 'nem-da', 'chem-khi-trung') }),
  thuy_camlo_4: S('no', 'nuoc', 170, { sang: 0.6, am: A('khieng', 'len-bac') }),
  thuy_huyenbang_4: S('tia', 'bang', 110, { vet: true, sang: 0.5, rung: 0.2, dung: 60, am: A('khieng', 'nem-da', 'da-trung') }),
  thuy_tuyet: S('no', 'nuoc', 260, { sang: 1, rung: 0.5, am: A('yq-xuat-hien', 'len-bac') }),
  // ---- Thổ: bụi, đá vụn, rung nền ----
  tho_1: S('tia', 'da', 110, { rung: 0.5, dung: 70, am: A('khieng', 'thiet-dau', 'thiet-dau-trung') }),
  tho_2: S('xoay', 'da', 90, { sang: 0.4, am: A('khieng', 'len-bac') }),
  tho_3: S('hut', 'da', 200, { sang: 0.5, rung: 0.4, am: A('khieng', 'thiet-dau', 'da-trung') }),
  tho_daidia_4: S('xoay', 'da', 150, { sang: 0.5, am: A('khieng', 'len-bac') }),
  tho_hukhong_4: S('hut', 'da', 220, { sang: 0.5, rung: 0.5, dung: 60, am: A('khieng', 'thiet-dau', 'da-trung') }),
  tho_tuyet: S('mua', 'da', 260, { sang: 1, rung: 1, dung: 100, am: A('yq-xuat-hien', 'thiet-dau', 'thiet-dau-trung') }),
  // ---- Hỏa: tia lửa, tàn than ----
  hoa_1: S('tia', 'lua', 110, { vet: true, sang: 0.7, rung: 0.3, dung: 60, am: A('tu-dong-bat', 'chem-khi', 'chem-khi-trung') }),
  hoa_2: S('xoay', 'lua', 100, { sang: 0.7, am: A('tu-dong-bat', 'len-bac') }),
  hoa_3: S('tia', 'lua', 170, { vet: true, sang: 0.8, rung: 0.7, dung: 90, am: A('tu-dong-bat', 'chem-khi', 'chem-khi-trung') }),
  hoa_liethoa_4: S('mua', 'lua', 250, { sang: 0.8, rung: 0.6, dung: 70, am: A('tu-dong-bat', 'chem-khi', 'chem-khi-trung') }),
  hoa_hoalong_4: S('no', 'lua', 200, { vet: true, sang: 0.9, rung: 0.8, dung: 100, am: A('tu-dong-bat', 'chem-khi', 'chem-khi-trung') }),
  hoa_tuyet: S('no', 'lua', 260, { sang: 1, rung: 1, dung: 100, am: A('yq-xuat-hien', 'chem-khi', 'chem-khi-trung') }),
});
