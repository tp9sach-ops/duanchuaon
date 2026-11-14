// Luật lõi chiến đấu chiêu thức (Phiên 156, Bản 2 mục 3). Mọi số là TẠM (tam: true), chờ playtest. Logic: js/world/luatChien.js; test: tests/luatchien.test.mjs.
export const LUAT = Object.freeze({
  tam: true,
  gstMax: 0.7,                 // giảm sát thương tổng (trang bị + chiêu) tối đa 70%
  doanGong: 0.2,               // đánh trúng người đang gồng: +20% sát thương
  huyGongMatCd: 0.3,           // hủy gồng bằng di chuyển: mất 30% hồi chiêu; bị khống chế cắt: mất 100%
  khoaToiDa: 3,                // không ai bị khóa quá 3 s liên tục
  khang: Object.freeze({ cuaSo: 8, he: [1, 0.6, 0.3], mienNhiem: 3 }),
  hatTungLai: Object.freeze({ cuaSo: 6, giay: 0.5 }),
  moc: Object.freeze({ cuaSo: 1.5, congSatThuong: 0.1, giamCd: 0.5, toiDaMat: 4, tran: 0.3 }),
  thieuDot: Object.freeze({ giay: 3, moiGiayPct: 0.08, toiDaTang: 3 }),
  chamToiDa: 0.6,              // làm chậm cộng dồn tối đa 60%
  epMau: 0.3,                  // ngưỡng ép máu
  gioiHanKhongChe: Object.freeze({ // giây tối đa theo chế độ: [PvE, Võ đài]
    choang: [3, 1.2], hatTung: [1.0, 1.0], troi: [3, 1.5], dongBang: [3, 1.2],
  }),
  batKhaXamPhamMax: Object.freeze({ pve: 5, voDai: 2 }),
});
// Phản ứng giữa các Hệ (Bản 2 mục 3.6)
export const PHAN_UNG = Object.freeze([
  { id: 'bungChay', he: ['hoa', 'moc'], chu: 'Bùng cháy', ban: 3 },
  { id: 'hoiNuoc', he: ['thuy', 'hoa'], chu: 'Hơi nước', giay: 3, giamTamNhin: 0.5 },
  { id: 'nongChay', he: ['kim', 'hoa'], chu: 'Nóng chảy', giapGiam: 0.2, giay: 4 },
  { id: 'bunLay', he: ['tho', 'thuy'], chu: 'Bùn lầy', chamThem: 0.2 },
  { id: 'gionLanh', he: ['thuy', 'kim'], chu: 'Giòn lạnh', congHeSo: 1.0 },
]);
