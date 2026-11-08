# PHIÊN 66 — Sổ tay hướng dẫn cho người không rành: cập nhật đủ phần mới, sửa chữ cũ sai — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN65.md → file này. Phiên này làm mục "Người không rành vẫn chơi được" (ptg 08/11) ở mức nhỏ, an toàn: sổ tay `?` đã có sẵn (`js/world/tutorial.js` + `js/ui/tutorial.js`, Phiên 39) nhưng **nội dung đã lỗi thời** sau các phiên 56–65.

## ĐÃ LÀM (`js/world/tutorial.js`, `tests/tutorial.test.mjs`, `js/ui/tutorial.js`, `sw.js` = `dgt-v71`)
- **Sửa chữ cũ sai:** chủ đề Phóng sinh còn ghi "Cầu Gỗ giá 30 lá" (nay **50 hạt sen**, cầu khác mua bằng lá); còn nhắc "nút nổi Câu cá" (đã thay bằng nút Thả cầu / Bấm! / Thu cá / Phóng sinh ở góc phải-dưới); chủ đề Xây nhà còn ghi nội thất "sắp có" (nay **đã dùng được**: Cửa hàng + Túi đồ + Đặt); chỉ còn "mời khách, mở tiệc" là sắp có.
- **4 chủ đề mới** (con số lấy thẳng từ `strength.js` / `yeuquai.js`, đổi luật thì chữ đổi theo): **Các nút góc phải-dưới** (Nhảy mờ/mở thế nào, Kỹ năng ✦, Thả cầu/Bấm!, Khiêng/Ném, Ném đá/Thương, Túi đồ, bong bóng chỉ chỗ) · **Sức mạnh, khiêng và ném** (sức mạnh từ đâu, bảng 8 vật theo kg, luật ném người; phần qua mạng ghi "sắp có") · **Yêu quái hằng tháng** (lịch 20:00 / 90 phút, vùng đỏ từng loại, cách đánh, hồi sinh, nhặt lá, thưởng; chơi chung ghi "sắp có") · **Lộ trình khám phá** (nút dẫn tới bảng Nhiệm vụ).
- Lời nhắc lần đầu (sau 16 giây, một lần) giờ nhắc cả cụm nút, khiêng đồ, yêu quái.
- Tests: `tests/tutorial.test.mjs` cập nhật + 1 test mới. `npm test`: **702/702** (Node 22).

## CHƯA LÀM (mục "người không rành" còn lại)
- Nút "Dẫn đường" nhấp nháy cho nhiệm vụ mới; nhãn chữ cho các nút tròn góc phải-trên (hiện chỉ biểu tượng + tooltip); màn hướng dẫn lần đầu 3 bước có mũi tên. Chờ ptg thử điện thoại thật rồi nói chỗ nào còn khó hiểu nhất để làm đúng chỗ đó, tránh phình giao diện.
- Vẫn còn nguyên các việc ở PHIEN65.md: nối mạng (máu yêu quái chung, nhặt lá tranh nhau, ném người), chỉnh số yêu quái theo cảm nhận của ptg (`?yq=lua`), sông + hồ, kiến trúc thêm, Suối Trong, trang Tu tập/NPC trong Lộ trình, kết quả phép 8 `chan-doan.html` (PHIEN55).
