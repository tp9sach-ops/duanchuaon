// 24 THẺ CHIÊU Kim / Mộc / Thủy / Thổ (Phiên 158, Bản 2 mục 5.1–5.4). KHÔNG đổi id, tên, cấp, hồi chiêu, hệ số trong combatSkills.js (nguồn sự thật);
// file này chỉ THÊM: gồng, hậu động, vùng cảnh báo (hình + hoa văn theo Hệ), giá phải trả, móc nối, cách khắc. Số (TẠM) cân bằng bằng playtest. Hỏa: js/data/chieuHoa.js.
// canhBao.hinh: duong {dai, rong} | non {dai, goc} | tron {r, taiMucTieu?, coDan?}; loi: true = vùng có lợi (viền xanh nhạt), mặc định gây hại (viền đỏ ngà).
// Hoa văn: kim 'vachCheo', moc 'hoaVanLa', thuy 'gonSong', tho 'oVuong' (hỏa 'socNhon'). Tư thế (mục 5) và hiệu ứng (mục 6) làm ở mục sau.
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };
const VAN = { kim: 'vachCheo', moc: 'hoaVanLa', thuy: 'gonSong', tho: 'oVuong' };
const C = (he, o) => ({ ...o, canhBao: { ...o.canhBao, hoaVan: VAN[he] } });

export const KIM_V2 = {
  kim_1: C('kim', { gong: 0.3, hauDong: 0.3, canhBao: { hinh: { kieu: 'non', dai: 3, goc: 90 } }, gia: 'Gồng 0,3 s, hậu động 0,3 s', moc: ['kim_3', 'kim_thietky_4'], khac: 'Lùi ngoài 3 m hoặc né ngang trong lúc gồng' }),
  kim_2: C('kim', { gong: 0.3, huyDuoc: true, hauDong: 0, canhBao: { hinh: { kieu: 'tron', r: 1.5 }, loi: true }, phanTran: 0.3, gia: 'Gồng 0,3 s; viền vàng bao người suốt 10 s nên bị đọc ra', moc: [], khac: 'Hỏa (Nóng chảy −20% giáp); đòn xuyên giáp (Phá Trận Trảm); phản tính vào trần phản 30%' }),
  kim_3: C('kim', { gong: 0.5, hauDong: 0.8, lao: 0.35, canhBao: { hinh: { kieu: 'duong', dai: 10, rong: 2.5 } }, gia: 'Trượt thì hở 0,8 s', moc: [], khac: 'Né ngang khỏi vạch; chặn đường bằng vật cản (Thổ); trừng phạt trong 0,8 s hở' }),
  kim_kimcang_4: C('kim', { gong: 0.2, hauDong: 0.3, canhBao: { hinh: { kieu: 'tron', r: 1.2 }, loi: true }, gia: { chayCham: 0.3, trongLucDung: true }, moc: [], khac: 'Kéo/đẩy (vẫn bị); chờ hết 4 s; Hỏa + Kim' }),
  kim_thietky_4: C('kim', { gong: 0.45, hauDong: 0.4, canhBao: { hinh: { kieu: 'duong', dai: 5, rong: 1.2 } }, gia: 'Chém dọc một đường hẹp', moc: [], khac: 'Né ngang (đường hẹp); đánh vào lúc gồng giơ tay' }),
  kim_tuyet: C('kim', { gong: 1.5, hauDong: 0.6, canhBao: { hinh: { kieu: 'tron', r: 6 }, tuDau: true }, noCuoi: { pct: 0.5 }, batKhaXamPham: { pve: 5, voDai: 2 }, huyKhiGong: { hoanCd: 0.5 }, moc: [], khac: 'Choáng/trói/ngắt trong 1,5 s gồng (hoàn 50% hồi chiêu); đứng ngoài vòng nổ cuối' }),
};
export const MOC_V2 = {
  moc_1: C('moc', { gong: 0.25, hauDong: 0.2, tam: 14, tocDo: 22, canhBao: { hinh: { kieu: 'non', dai: 14, goc: 20 } }, tongHeSoLaTong: 'KIỂM skillEngine: heSo 1,0 là tổng hay mỗi mũi (fx.hits = 3)', moc: [], khac: 'Né ngang; vật cản chặn đạn; Thủy xóa mờ mắt' }),
  moc_2: C('moc', { gong: 0.2, huyDuoc: true, hauDong: 0, canhBao: { hinh: { kieu: 'tron', r: 1 }, loi: true }, anThan: { voKhiDanh: true, hienMoKhiGan: 2 }, baoHieu: 'Vài lá rụng tại chỗ khi biến mất', moc: [], khac: 'Đòn diện rộng; Bùng cháy làm lộ; đứng sát' }),
  moc_3: C('moc', { gong: 0.5, hauDong: 0.4, canhBao: { hinh: { kieu: 'tron', r: 8 } }, moc: [], khac: 'Ra khỏi vùng; Hỏa đốt tan (Bùng cháy, nhưng gây Thiêu đốt cho người trong vùng)' }),
  moc_uminh_4: C('moc', { gong: 0.5, hauDong: 0.3, canhBao: { hinh: { kieu: 'tron', r: 5, taiMucTieu: true } }, dieuKien: { mucTieuDangDinh: ['moc_1', 'moc_3'] }, lanMoiGiay: 1, gia: 'Chỉ hiệu lực với mục tiêu đang dính U Minh Linh Tiễn hoặc Vạn Hương; gồng nâng 0,4 → 0,5 s để đủ ngưỡng diện rộng (Bản 2 ghi 0,4, lệch có chủ đích)', moc: [], khac: 'Thủy xóa debuff; đứng tản ra' }),
  moc_anthan_4: C('moc', { gong: 0.2, hauDong: 0.4, lao: { khoang: 8, sauLung: true }, canhBao: { hinh: { kieu: 'tron', r: 1.2, taiMucTieu: true } }, gia: 'Hậu động 0,4 s LỘ vị trí', moc: [], khac: 'Quay lưng cảnh giác; đòn diện rộng; trừng phạt trong 0,4 s' }),
  moc_tuyet: C('moc', { gong: 1.5, hauDong: 0.6, canhBao: { hinh: { kieu: 'tron', r: 4 }, tuDau: true }, anThanSuotChieu: true, huyKhiGong: { hoanCd: 0.5 }, moc: [], khac: 'Ngắt gồng; ra khỏi bán kính 4 m; đòn diện rộng làm lộ' }),
};
export const THUY_V2 = {
  thuy_1: C('thuy', { gong: 0.25, hauDong: 0.2, tam: 10, canhBao: { hinh: { kieu: 'duong', dai: 10, rong: 1.2 } }, moc: [], khac: 'Né ngang; Hỏa phá băng' }),
  thuy_2: C('thuy', { gong: 0.3, huyDuoc: true, hauDong: 0, canhBao: { hinh: { kieu: 'tron', r: 1.5 }, loi: true }, khien: { vaKhiNhan: 1, giam: 0.5 }, gia: 'Khiên vỡ khi nhận 1 đòn (giảm 50% đòn đó)', moc: [], khac: 'Đòn xuyên khiên; cắt hồi máu (chiêu ép máu)' }),
  thuy_3: C('thuy', { gong: 1.0, hauDong: 0.5, canhBao: { hinh: { kieu: 'tron', r: 10 } }, moc: [], khac: 'Ngoài 10 m; Hỏa phá băng; né trong 1,0 s gồng' }),
  thuy_camlo_4: C('thuy', { gong: 0.5, hauDong: 0.3, canhBao: { hinh: { kieu: 'tron', r: 6 }, loi: true }, xoaDebuff: 'mem', moc: [], khac: 'Đồng đội ngoài 6 m không nhận; ngắt gồng' }),
  thuy_huyenbang_4: C('thuy', { gong: 0.4, hauDong: 0.3, tam: 10, tocDo: 24, canhBao: { hinh: { kieu: 'duong', dai: 10, rong: 1 } }, moc: [], khac: 'Né ngang; chặn bằng vật cản; kháng lũy tiến' }),
  thuy_tuyet: C('thuy', { gong: 1.8, hauDong: 0.6, chayCham: 0.5, canhBao: { hinh: { kieu: 'tron', r: 12 }, tuDau: true, loi: true }, huyKhiGong: { hoanCd: 0.5 }, moc: [], khac: 'Ngắt gồng; kẻ địch tránh khỏi vùng 12 m' }),
};
export const THO_V2 = {
  tho_1: C('tho', { gong: 0.35, hauDong: 0.3, canhBao: { hinh: { kieu: 'duong', dai: 4, rong: 2 } }, moc: [], khac: 'Né ngang; nhảy' }),
  tho_2: C('tho', { gong: 0.3, huyDuoc: true, hauDong: 0, canhBao: { hinh: { kieu: 'tron', r: 1.5 }, loi: true }, khien: { vaDayLui: 2 }, gia: 'Khiên vỡ đẩy lùi 2 m (TẠM)', moc: [], khac: 'Mộc xuyên; đánh đủ sát thương để phá khiên' }),
  tho_3: C('tho', { gong: 0.6, hauDong: 0.4, canhBao: { hinh: { kieu: 'tron', r: 6 } }, moc: [], khac: 'Ra khỏi vùng; chiêu bay lên hoặc lao' }),
  tho_daidia_4: C('tho', { gong: 0.5, hauDong: 0.3, canhBao: { hinh: { kieu: 'tron', r: 6 }, loi: true }, moc: [], khac: 'Đòn xuyên khiên' }),
  tho_hukhong_4: C('tho', { gong: 0.5, hauDong: 0.3, canhBao: { hinh: { kieu: 'tron', r: 8, coDan: true } }, moc: [], khac: 'Ra khỏi vùng khi gồng; chiêu bất khả xâm phạm; kháng lũy tiến' }),
  tho_tuyet: C('tho', { gong: 1.8, hauDong: 0.8, canhBao: { hinh: { kieu: 'tron', r: 8 }, tuDau: true, bongNui: true }, huyKhiGong: { hoanCd: 0.5 }, moc: [], khac: 'Ra khỏi bóng núi; ngắt gồng; Mộc xuyên' }),
};
export const CHIEU_4HE = deepFreeze({ ...KIM_V2, ...MOC_V2, ...THUY_V2, ...THO_V2 });
