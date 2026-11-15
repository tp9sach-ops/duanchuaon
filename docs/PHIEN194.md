# PHIÊN 194 — Mục 1: BIỂU TƯỢNG CHIÊU THEO PHONG CÁCH LIÊN QUÂN

> Repo `main`. ptg: trả lời NGẮN GỌN, làm TỪNG MỤC, xong đẩy GitHub rồi báo, chờ "tiếp tục".
> Quy tắc bàn giao (chép nguyên văn): "For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Đã có từ trước (bỏ qua)
Phiên 190–191: chiêu + đánh thường dùng được khi không có quái; thanh chiêu hiện ở khu luyện. Phiên 192: cung tròn chiêu quanh nút Đánh thường (`js/ui/actionArc.js`). Phiên 193: nút ⚙ chỉnh riêng cỡ Di chuyển / Đánh thường / Chiêu thức / Nút phụ (`js/ui/btnScale.js`).

## Phiên này (mục 1)
- `js/ui/skillIcon.js` VẼ LẠI (ảnh tham khảo ptg gửi: nút Liên Quân = tranh minh họa trong vòng tròn viền kim loại mảnh có khấc nhọn ở đỉnh):
  - Viền kim loại mảnh + khấc nhọn đỉnh; Tuyệt Học = viền vàng + hai cánh + ngọc.
  - Nền là CẢNH theo Hệ (nhận Hệ từ màu `mau` qua `HE_BY_COLOR`, không đổi chỗ gọi): Hỏa lưỡi lửa · Thủy sóng + bong bóng · Mộc dây leo + lá · Thổ tinh thể đá · Kim tia kim quang.
  - Chủ thể tô gradient có hào quang, viền tối, nét sáng, hạt sáng: hồi máu (hai bàn tay đỡ quả cầu), ẩn thân (bóng trùm mũ), khiên, tăng tốc (tia chớp), khống chế (vòng phong ấn), lao (mũi tên + vệt gió), tia (kiếm khí), vùng (sóng xung kích), chém (hai nhát cong), chọn Pháp Môn (sao bốn cánh).
  - Chữ ký `drawGlyphIcon(mau, glyph, tuyet, dim)` và `GLYPH_D` GIỮ NGUYÊN (test `heskillui` còn dùng).
- `sw.js` = `dgt-v181`.
- Đã chụp thử bằng Chromium headless: 10 hình × 5 Hệ hiển thị đúng, không lỗi JS. CHƯA xem trên nút thật trong game và CHƯA chạy `npm test` (môi trường AI không có mạng để clone repo).

## ptg kiểm
Tải lại cứng, xem thanh chiêu: hình đã giống nút Liên Quân chưa; chiêu nào nhìn chưa ra ý nghĩa thì báo tên chiêu để chỉnh hình riêng.

## Việc kế (theo danh sách ptg)
2. Nút Đánh thường còn nhỏ → to hơn. 3. Các nút Dân lễ/Cúng… chỉ hiện khi vào chánh điện, ngoài đó ẩn hẳn để nhường chỗ cụm nút to. 4. Nút ⚙ chỉnh được MỌI nút (di chuyển, đánh thường, chiêu…, cả vị trí). 5. Đánh thường lao tới + combo 3 đòn khác nhau (đòn 3 lan, quái dính đánh trả). 6. Chiêu: bấm rồi lướt ngón tay chọn hướng (vòng/vạch ngắm như ảnh); không quái vẫn dùng được nhưng không gây sát thương.
