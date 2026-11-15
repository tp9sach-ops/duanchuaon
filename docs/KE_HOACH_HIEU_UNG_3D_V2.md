# KẾ HOẠCH HIỆU ỨNG CHIÊU 3D — BẢN V2 (Phiên 201, cập nhật Phiên 202)

> Thay thế docs/KE_HOACH_HIEU_UNG_3D.md. Lý do (ptg, 2026-11-16): hiệu ứng hiện tại là "ô vuông màu" (Sprite canvas phẳng), không giống thật; trừ Thủy, các Hệ còn lại có bộ chiêu quá giống nhau và không liên quan đến Hệ.

## Hiện trạng (đã kiểm mã thật)
- Đã có: nối dây chiêu → chieuFx (heSkill.js, luyenChieu.js), 30 chiêu × 5 kiểu (tia/nổ/xoáy/mưa/hút) × loại (lửa/băng/lá/đá/kim/nước/sương).
- "Thân" chiêu: Hỏa nay dùng khối shader (fxHoa.js, Phiên 202); Thủy băng/nước (fxBang.js) và Kim (fxKim.js) vẫn là Sprite phẳng. Mộc, Thổ chưa có thân (`lua = null`).
- Nền shader/nhiễu đã có từ Phiên 201 (fxGlsl.js, fxShader.js).

## Nguyên tắc
1. KHỐI có thể tích + shader nhiễu fbm theo từng điểm ảnh, không dùng ô vuông/Sprite phẳng.
2. Màu theo vật lý (lửa: than→đỏ→cam→vàng→trắng; băng: trong, khúc xạ, viền sáng; …).
3. Mỗi chiêu có CHỮ KÝ HÌNH ẢNH riêng, đúng Hệ (bảng dưới).
4. Không đèn động; hạt tròn mềm; tôn trọng PERF/giảm chuyển động; máy yếu giảm số hạt.
5. Mỗi mục: nối vào game + trang xem thử để ptg chụp màn hình phản hồi. Không nối khi chưa có nền.

## 12 mục
1. [x] Nền tảng: GLSL (nhiễu, bảng màu lửa), vật liệu shader (khối lửa, khói, hạt, vũng sáng), trang xem thử fx-preview.html, test. (Phiên 201)
2. [x] Hỏa: khối shader trong chieuFx, 6 chiêu theo chữ ký: `js/scene/fxHoa.js` + `js/world/hoaFxMath.js` + `tests/hoafx.test.mjs`; trang xem thử `fx-hoa.html`. (Phiên 202; **CHƯA nhìn bằng mắt** — chờ ptg chụp màn hình trang fx-hoa.html và cảnh trong game)
3. [ ] Thủy: tinh thể băng thật (khối đa diện trong, viền sáng), nước/sóng có bọt.
4. [ ] Kim: kiếm khí, tấm kim loại, sét, tượng Kim Cang.
5. [ ] Mộc: tạo fxMoc.js (mũi tên gỗ, lá, hoa, sương độc, lốc lá, cây ánh sáng).
6. [ ] Thổ: tạo fxTho.js (gai đá, khiên nham, hố trọng lực, giáp đá, nứt đất, núi rơi).
7. [ ] Phản ứng trúng đòn trên quái (cháy, đóng băng, trói, nứt, điện giật).
8. [ ] Đồng bộ thời gian chiêu ↔ hiệu ứng ↔ rung màn hình (kể cả kéo dài mưa thiên thạch quá 0,95 s nếu cần).
9. [ ] Chiêu hỗ trợ + màn Tuyệt Học (điện ảnh).
10. [ ] Hậu kỳ (bloom nhẹ, mờ chuyển động) nếu máy mạnh.
11. [ ] Tối ưu máy yếu (giảm hạt, bỏ fbm tầng cao).
12. [ ] Chỉnh theo phản hồi của ptg.

## Chữ ký hình ảnh 30 chiêu
### Hỏa (đã dựng mã ở Phiên 202)
- hoa_1 Liệt Hỏa Chưởng: cầu lửa sao chổi (đầu to, đuôi thon kéo dài, tia lửa rơi, khói đen sau) · hoa_2 Cuồng Long Phẫn Nộ: áo choàng lửa (vòng lưỡi lửa xoay quanh người) · hoa_3 Hỏa Long Xuất Hải: rồng lửa nhiều đốt uốn lượn, hai sừng lửa · hoa_liethoa_4 Bạo Liệt Hỏa Vũ: mưa thiên thạch rơi chéo, chạm đất bùng cột lửa · hoa_hoalong_4 Long Tức Trảm: hơi thở rồng (tia trắng nóng, cháy sém đất) · hoa_tuyet Liên Hoa Hỏa Thế: sen lửa 9 cánh nở.
### Thủy
- Giáo tinh thể băng · Giọt nước ngọc lơ lửng trong bong bóng · Thảm băng lan có gai · Hào quang xanh lục + sen nước · Xích băng · Sóng thần có bọt.
### Kim
- Nhát chém trăng khuyết bạc · Tấm khiên lục giác xoay · Kỵ binh vàng xung phong · Tượng Kim Cang hộ vệ · Đại kiếm sét xanh nện đất nứt · Kim Cang pháp tướng khổng lồ + vòng ấn.
### Mộc
- Ba mũi tên gỗ phát sáng có bào tử · Áo lá ẩn thân · Sương thơm + hoa nở · Sương độc dày · Lốc lá lướt tới · Cây ánh sáng nghìn lá.
### Thổ
- Gai đá thành hàng · Khiên nham nứt vỡ · Hố trọng lực hút đá · Giáp đá cho đồng đội · Mạch đất nứt phát sáng kéo quái · Núi rơi + sóng xung kích + rung màn hình.

## Chưa kiểm được (môi trường AI không có WebGL)
Mọi hình ảnh và việc biên dịch shader. Trang fx-preview.html (nền) và fx-hoa.html (6 chiêu Hỏa) hiện chữ đỏ nếu shader lỗi; ptg chụp màn hình gửi lại.
