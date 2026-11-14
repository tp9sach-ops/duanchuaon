// HỎA v2 (Phiên 157, Bản 2 mục 5.5): thẻ chiêu bổ sung cho 6 chiêu Hỏa. KHÔNG đổi id, tên, cấp, hồi chiêu, tổng hệ số trong combatSkills.js (nguồn sự thật);
// file này chỉ THÊM: gồng, cảnh báo, giá phải trả, Thiêu đốt, hất tung, đánh trên không, móc nối, cách khắc. Số (TẠM) cân bằng bằng playtest.
// Logic dùng: js/world/luatChien.js (Thiêu đốt, móc nối, khống chế). Tra cứu: js/world/chieuHoa.js. Test: tests/chieuhoa.test.mjs.
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };

// canhBao.hinh: duong {dai, rong} | non {dai, goc} | tron {r, taiMucTieu?}. Hoa văn Hỏa = 'socNhon' (sọc nhọn tỏa ra); viền đỏ ngà (gây hại).
export const HOA_V2 = deepFreeze({
  hoa_1: {
    gong: 0.25, hauDong: 0.2, tam: 8, tocDo: 18,
    canhBao: { hinh: { kieu: 'duong', dai: 8, rong: 1.2 }, hoaVan: 'socNhon' },
    thieuDot: { tang: 1 }, noLan: { r: 4, pctSatThuong: 0.5 },   // trúng mục tiêu chính: hệ số đầy đủ + 1 tầng; người trong vòng nổ nhận 50% (TẠM)
    gia: 'Đạn bay thẳng, gồng nhỏ; hết hồi chiêu mới dùng lại',
    moc: ['hoa_3'], khac: 'Né ngang (đạn thẳng); Thủy dập tầng Thiêu đốt; vật cản chặn đạn',
  },
  hoa_2: {
    gong: 0.5, huyDuoc: true, hauDong: 0,
    canhBao: { hinh: { kieu: 'tron', r: 1.5 }, hoaVan: 'socNhon' },   // rồng lửa quấn tay: đối thủ nhìn là biết đang buff
    gia: { giamGiap: 0.15, trongLucDung: true }, thieuDotDonThuong: { tang: 1, moiGiay: 1.5 },   // đòn thường trong buff áp 1 tầng, tối đa 1 lần / 1,5 s (TẠM)
    moc: [], khac: 'Ngắt gồng 0,5 s; đánh mạnh lúc giáp mỏng; Thủy dập',
  },
  hoa_3: {
    gong: 0.5, hauDong: 0.5,
    canhBao: { hinh: { kieu: 'duong', dai: 10, rong: 2 }, hoaVan: 'socNhon' },
    hatTung: { giay: 1.0, giayTuNhieuTang: 1.3, tangToiThieu: 2 }, thieuDot: { tang: 1 },
    tieuTang: { congHeSoMoiTang: 0.4 },   // ≥ 2 tầng: hất 1,3 s, tiêu hết tầng, mỗi tầng +0,4 hệ số
    moMoCombo: true,                       // mắt xích mở combo trên không
    moc: ['hoa_hoalong_4'], khac: 'Né ngang khỏi đường rồng; chiêu bất khả xâm phạm; Thủy dập Thiêu đốt trước để mất bonus',
  },
  hoa_liethoa_4: {
    gong: 0.8, hauDong: 0.5,
    canhBao: { hinh: { kieu: 'tron', r: 8 }, hoaVan: 'socNhon' },
    mua: { giay: 4, hePerSec: 0.6 }, thieuDotMoiGiay: 1,   // tổng 2,4 hệ số; mỗi giây +1 tầng (tối đa 3)
    moc: [], khac: 'Ra khỏi vòng; Thủy tạo Hơi nước dập hết tầng; ngắt gồng',
  },
  hoa_hoalong_4: {
    gong: 2, hauDong: 0.5,
    dangThuong: { nap: 2, heSo: 5.0 },
    dangTrenKhong: {   // CHỈ khi mục tiêu đang bị hất tung (sau hoa_3); tổng vẫn 5,0
      dieuKien: 'hatTung', nap: 0.8, nhay: 3, nhatDau: 0.3, // 0,3 s đầu né được chiêu mặt đất
      nhat: [0.9, 0.9, 0.9, 0.9], nhatCuoi: { heSo: 1.4, choang: 0.5 }, giuLoLung: true, matNhatKhiBiKhongChe: true,
    },
    canhBao: { hinh: { kieu: 'tron', r: 1.5, taiMucTieu: true }, hoaVan: 'socNhon' },
    moc: [], khac: 'Choáng hoặc trói TRƯỚC khi nhảy; Thủy dập Thiêu đốt; né khi nạp thường (vòng cảnh báo ở chân mục tiêu)',
  },
  hoa_tuyet: {
    gong: 1.8, hauDong: 0.6, chayCham: 0.5,   // gồng chạy chậm 50%
    canhBao: { hinh: { kieu: 'tron', r: 8 }, hoaVan: 'socNhon', tuDau: true },
    kichNo: { congHeSoMoiTang: 0.6 }, epMau: { duoi: 0.3, cong: 0.3, khongGietThang: true },
    gia: { giamGiap: 0.15, giay: 5 }, huyKhiGong: { hoanCd: 0.5 },
    moc: [], khac: 'Ngắt gồng; ra khỏi bán kính 8 m; Thủy dập tầng Thiêu đốt trước (mất phần kích nổ)',
  },
});
