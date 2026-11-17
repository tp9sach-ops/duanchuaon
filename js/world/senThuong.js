// Phiên 221 (mục 1): hạt sen THƯỞNG CỐ ĐỊNH (ptg chốt 17/11). LOGIC THUẦN (không DOM), có test: tests/senthuong.test.mjs.
// Thu phục 1 con yêu quái = 1 hạt sen; phóng sinh 1 con (câu cá) = 2 hạt sen. Cộng NGAY vào số sen đang có qua LGT.addMerit (js/ui/hudMenu.js).
// Trước đây: quái bãi rừng rơi ngẫu nhiên (50% × 1–3, tinh anh 5–8) và phóng sinh 1–3 hạt tùy loài hiếm/cỡ lớn; nay mọi con như nhau.
// Các trần ngày cũ GIỮ NGUYÊN: hàng yêu FARM_CFG.senCapNgay (js/world/farm.js), phóng sinh ACT_CAP.phongsinh = 10 lần/ngày (js/world/merit.js).
export const SEN_THU_PHUC = 1;
export const SEN_PHONG_SINH = 2;

/** Quà hạt sen cho MỘT lần thu phục quái bãi rừng, cùng dạng với quà rơi của spawn.js ({ hatSen }) để đưa thẳng vào settleKill. */
export const quaThuPhuc = () => ({ hatSen: SEN_THU_PHUC });
