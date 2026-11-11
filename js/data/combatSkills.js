// Dữ liệu kỹ năng chiến đấu (GDD v2 mục 5.5, 6.2, 6.3; kế hoạch G2.2): 15 skill gốc + 10 Skill 4 (Pháp Môn) + 5 Tuyệt Học.
// CHƯA nối giao diện. Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1). Chỉ sửa số ở file này; tra cứu ở js/world/skillCatalog.js; test: tests/combatskills.test.mjs.
// Tên file khác `js/world/skills.js` (đó là Khinh Thân, nhảy cao) để không đè.
// Trường: id, he, slot (1|2|3|4|'tuyet'), ten, cap (Tu Vi mở khóa), cd (hồi chiêu, giây), heSo (hệ số sát thương trực tiếp, 1,5 = 150%; 0 = không gây sát thương trực tiếp),
//   fx (hiệu ứng, số liệu thô: dur = giây, r = bán kính m, pct = tỉ lệ 0..1), phapMon (chỉ Skill 4), tamAn (chỉ Tuyệt Học: Tâm Ấn tiêu), tamSo (tên trường GDD không nêu số, đang đặt giá trị tạm).
// Tên file khác `js/world/skills.js` (đó là Khinh Thân, nhảy cao) để không đè.
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };

export const SKILL_CAP = Object.freeze({ 1: 10, 2: 14, 3: 20, 4: 30, tuyet: 60 }); // GDD mục 4.3
export const TUYET_TAM_AN = 5;   // Tuyệt Học tiêu 5 Tâm Ấn
export const TUYET_CD = 60;      // hồi chiêu Tuyệt Học (giây)

// 10 Pháp Môn (GDD 5.5): mỗi Hệ 2 nhánh.
export const PHAP_MON = deepFreeze([
  { id: 'kimcang', he: 'kim', ten: 'Kim Cang Môn', vaiTro: 'Chống chịu thuần' },
  { id: 'thietky', he: 'kim', ten: 'Thiết Kỵ Môn', vaiTro: 'Cận chiến xung phong' },
  { id: 'uminh', he: 'moc', ten: 'U Minh Môn', vaiTro: 'Độc, sát thương theo thời gian' },
  { id: 'anthan', he: 'moc', ten: 'Ẩn Thân Môn', vaiTro: 'Ám sát, bùng nổ' },
  { id: 'camlo', he: 'thuy', ten: 'Cam Lộ Môn', vaiTro: 'Hồi phục, hỗ trợ đội' },
  { id: 'huyenbang', he: 'thuy', ten: 'Huyền Băng Môn', vaiTro: 'Khống chế' },
  { id: 'liethoa', he: 'hoa', ten: 'Liệt Hỏa Môn', vaiTro: 'Diện rộng' },
  { id: 'hoalong', he: 'hoa', ten: 'Hỏa Long Môn', vaiTro: 'Đơn mục tiêu, săn boss' },
  { id: 'daidia', he: 'tho', ten: 'Đại Địa Môn', vaiTro: 'Khiên cho đội' },
  { id: 'hukhong', he: 'tho', ten: 'Hư Không Môn', vaiTro: 'Kiểm soát vùng' },
]);

const S = (o) => ({ fx: {}, ...o });
export const COMBAT_SKILLS = deepFreeze([
  // ---- Skill 1 (chủ động, cấp 10) ----
  S({ id: 'kim_1', he: 'kim', slot: 1, ten: 'Kim Cương Trảm', cap: 10, cd: 6, heSo: 1.5, fx: { choang: { chance: 0.3, dur: 2 } } }),
  S({ id: 'moc_1', he: 'moc', slot: 1, ten: 'U Minh Độc Tiễn', cap: 10, cd: 5, heSo: 1.0, fx: { hits: 3, doc: { pctPerSec: 0.2, dur: 6 } } }),
  S({ id: 'thuy_1', he: 'thuy', slot: 1, ten: 'Huyền Băng Chưởng', cap: 10, cd: 6, heSo: 1.3, fx: { cham: { pct: 0.5, dur: 4 } } }),
  S({ id: 'hoa_1', he: 'hoa', slot: 1, ten: 'Liệt Hỏa Chưởng', cap: 10, cd: 7, heSo: 1.8, fx: { noLan: { r: 4 } } }),
  S({ id: 'tho_1', he: 'tho', slot: 1, ten: 'Địa Sách Chưởng', cap: 10, cd: 6, heSo: 1.4, fx: { choang: { chance: 1, dur: 1.5 } } }),
  // ---- Skill 2 (buff, cấp 14) ----
  S({ id: 'kim_2', he: 'kim', slot: 2, ten: 'Hộ Thân Cương Khí', cap: 14, cd: 20, heSo: 0, fx: { dur: 10, giap: 0.2, phanDon: { pct: 0.1, canChien: true } } }),
  S({ id: 'moc_2', he: 'moc', slot: 2, ten: 'Ẩn Thân Thuật', cap: 14, cd: 12, heSo: 0, fx: { anThan: { dur: 4 }, tocChay: 0.3, donDauChiMang: 2 } }),
  S({ id: 'thuy_2', he: 'thuy', slot: 2, ten: 'Cam Lộ Hộ Thể', cap: 14, cd: 25, heSo: 0, fx: { hoiSinhLuc: { pct: 0.25, dur: 5 }, khienBang: true } }),
  S({ id: 'hoa_2', he: 'hoa', slot: 2, ten: 'Cuồng Long Phẫn Nộ', cap: 14, cd: 18, heSo: 0, fx: { dur: 8, chiMang: 0.4, tocDanh: 0.25 } }),
  S({ id: 'tho_2', he: 'tho', slot: 2, ten: 'Đại Địa Chi Khiên', cap: 14, cd: 20, heSo: 0, fx: { dur: 10, hapThu: { pctSinhLucMax: 0.3 } } }),
  // ---- Skill 3 (Trấn Phái, cấp 20) ----
  S({ id: 'kim_3', he: 'kim', slot: 3, ten: 'Thiết Kỵ Xung Trận', cap: 20, cd: 15, heSo: 3.0, fx: { lao: { khoang: 10 }, dienRong: true, hatVang: true } }),
  S({ id: 'moc_3', he: 'moc', slot: 3, ten: 'Vạn Độc Quy Tâm', cap: 20, cd: 20, heSo: 0, fx: { suongDoc: { r: 8, dur: 6 }, cham: { pct: 0.4, dur: 6 }, mon: { pctPerSec: 0.05 } } }),
  S({ id: 'thuy_3', he: 'thuy', slot: 3, ten: 'Băng Phong Thiên Lý', cap: 20, cd: 22, heSo: 0, fx: { dongBang: { r: 10, dur: 3 }, tatCaQuai: true } }),
  S({ id: 'hoa_3', he: 'hoa', slot: 3, ten: 'Hỏa Long Xuất Hải', cap: 20, cd: 25, heSo: 4.5, fx: { duongRong: true, thieu: { dur: 3 } } }),
  S({ id: 'tho_3', he: 'tho', slot: 3, ten: 'Hư Không Trận', cap: 20, cd: 24, heSo: 0, tamSo: ['fx.vung.hePerSec'], fx: { vung: { dur: 6, cham: 0.6, hePerSec: 0.5 } } }),
  // ---- Skill 4 (Pháp Môn, cấp 30) ----
  S({ id: 'kim_kimcang_4', he: 'kim', slot: 4, phapMon: 'kimcang', ten: 'Bất Hoại Kim Thân', cap: 30, cd: 30, heSo: 0, fx: { dur: 4, giamSatThuong: 0.3, mienKhongChe: true } }),
  S({ id: 'kim_thietky_4', he: 'kim', slot: 4, phapMon: 'thietky', ten: 'Phá Trận Trảm', cap: 30, cd: 14, heSo: 2.2, fx: { xuyen: true, giamGiap: { pct: 0.15, dur: 6 } } }),
  S({ id: 'moc_uminh_4', he: 'moc', slot: 4, phapMon: 'uminh', ten: 'Độc Vụ Lan Tỏa', cap: 30, cd: 16, heSo: 0, fx: { docLan: { r: 5 } } }),
  S({ id: 'moc_anthan_4', he: 'moc', slot: 4, phapMon: 'anthan', ten: 'Lạc Diệp Truy Hồn', cap: 30, cd: 15, heSo: 2.5, fx: { laoSauLung: true, heSoKhiAnThan: 4.0 } }),
  S({ id: 'thuy_camlo_4', he: 'thuy', slot: 4, phapMon: 'camlo', ten: 'Thanh Tâm Chú', cap: 30, cd: 24, heSo: 0, fx: { hoiSinhLucDoi: { pctMax: 0.15, r: 6 }, xoaDebuff: true } }),
  S({ id: 'thuy_huyenbang_4', he: 'thuy', slot: 4, phapMon: 'huyenbang', ten: 'Hàn Băng Tỏa', cap: 30, cd: 14, heSo: 1.2, fx: { troi: { muctieu: 1, dur: 3 } } }),
  S({ id: 'hoa_liethoa_4', he: 'hoa', slot: 4, phapMon: 'liethoa', ten: 'Bạo Liệt Hỏa Vũ', cap: 30, cd: 20, heSo: 0, fx: { mua: { r: 8, dur: 4, hePerSec: 0.6 } } }),
  S({ id: 'hoa_hoalong_4', he: 'hoa', slot: 4, phapMon: 'hoalong', ten: 'Long Tức Trảm', cap: 30, cd: 18, heSo: 5.0, fx: { nap: 2, tia: true } }),
  S({ id: 'tho_daidia_4', he: 'tho', slot: 4, phapMon: 'daidia', ten: 'Thạch Giáp Trấn Phái', cap: 30, cd: 28, heSo: 0, fx: { dur: 8, khienDoi: { pctSinhLucMax: 0.15 } } }),
  S({ id: 'tho_hukhong_4', he: 'tho', slot: 4, phapMon: 'hukhong', ten: 'Dẫn Lực Địa Mạch', cap: 30, cd: 22, heSo: 0, fx: { keQuai: { r: 8 }, choang: { chance: 1, dur: 1 } } }),
  // ---- Tuyệt Học (cấp 60, tiêu 5 Tâm Ấn, hồi 60 giây) ----
  S({ id: 'kim_tuyet', he: 'kim', slot: 'tuyet', ten: 'Kim Cang Phục Ma', cap: 60, cd: 60, tamAn: 5, heSo: 0, fx: { batKhaXamPham: { dur: 5 }, noCuoi: { pctSatThuongDaChiu: 0.5 } } }),
  S({ id: 'moc_tuyet', he: 'moc', slot: 'tuyet', ten: 'Vạn Diệp Quy Tâm', cap: 60, cd: 60, tamAn: 5, heSo: 0.8, fx: { hits: 12, dur: 6, anThanSuotChieu: true } }),
  S({ id: 'thuy_tuyet', he: 'thuy', slot: 'tuyet', ten: 'Cam Lộ Triều Âm', cap: 60, cd: 60, tamAn: 5, heSo: 0, fx: { song: { r: 12 }, hoiSinhLucDoi: { pctMax: 0.4 }, chamQuai: { pct: 0.5, dur: 5 } } }),
  S({ id: 'hoa_tuyet', he: 'hoa', slot: 'tuyet', ten: 'Liên Hoa Hỏa Thế', cap: 60, cd: 60, tamAn: 5, heSo: 1.0, fx: { hits: 9, dienRong: true } }),
  S({ id: 'tho_tuyet', he: 'tho', slot: 'tuyet', ten: 'Thái Sơn Áp Đỉnh', cap: 60, cd: 60, tamAn: 5, heSo: 4.0, fx: { giamQuai: { r: 8 }, choang: { chance: 1, dur: 3 } } }),
]);
