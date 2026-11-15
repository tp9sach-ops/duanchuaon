# PHIÊN 192 — Mục 1: BỐ CỤC NÚT KIỂU MOBA (theo ảnh Liên Quân của Gp)

> Repo `main`. Gp: trả lời NGẮN GỌN, làm TỪNG MỤC, xong đẩy GitHub rồi báo, chờ "tiếp tục".

## Đã có từ Phiên 191 (bỏ qua)
Dock hiện Đánh thường/Thương/Nhảy ở khu luyện tập (`LGT.luyenChieu.basic/status`); thanh chiêu hiện ở khu luyện; sửa lỗi `paint()` (`locked`). Chiêu + đánh thường khi không có quái (Phiên 190) đã xong.

## Phiên này
- `js/ui/actionArc.js` (MỚI, nạp từ `js/ui/btnScale.js`): một cụm nút dùng chung mọi khu.
  - Đánh thường (ô A, to nhất) ở góc; hàng đáy đi sang trái: Thương, Nhảy, Thiết đầu, Chém khí/Khiêng người, Tự động, Cưỡi (mỗi nút một cột cố định, không dời chỗ).
  - Chiêu phái xếp CUNG TRÒN quanh nút Đánh thường: 1-2-3 vòng trong, Pháp Môn + Tuyệt Học vòng ngoài (nhỏ hơn 20%).
  - Màn thấp: tự thu cung (tối thiểu 55%); còn chỉnh thêm bằng ⚙ Cỡ nút.
  - Chỉ đổi vị trí/cỡ (CSS `!important` + style nội tuyến); logic nút không đổi.
- `tests/heskillui.test.mjs`: sửa phép kiểm lỗi thời của Phiên 189 (đã làm `npm test` đỏ sau Phiên 191) + test hình học cung (không chồng nút).
- `sw.js` = `dgt-v180`.

## CHƯA nhìn bằng mắt / chưa chạy `npm test` (môi trường AI không có trình duyệt, không chạy được Node)
Gp mở game, tải lại cứng, báo: cung có đè joystick / nút khác không, nút nào nhỏ quá, hàng đáy có tràn sang joystick không (khi hiện cả 6 nút).

## Việc kế
#5 Đánh thường lao tới + combo 3 đòn (đòn 3 lan, quái dính đánh trả); #6 bấm chiêu rồi lướt ngón tay chọn hướng (có vòng/vạch ngắm như ảnh).
