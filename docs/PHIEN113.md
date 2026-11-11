# PHIÊN 113 — GDD v2: G2.4(b) nối bồ đoàn Ngũ Hành + giao diện Lễ Khai Ngộ — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN112.md → file này → docs/KE_HOACH_GDD_V2.md. Chỉ đọc file cần thiết.

## Yêu cầu của ptg (2026-11-11, Phiên 113)
"Xem repo tp9sach-ops/duanchuaon, chỉ xem chỗ cần thiết. Tiếp tục cập nhật từng bước theo GDD v2 (skill, vật phẩm, cách chơi, kỹ năng chiến đấu, thêm quái cố định ở các bãi rừng để farm công đức), sau đó đẩy lên GitHub." → làm đúng MỘT mục: G2.4(b). Quái bãi rừng đã có từ Phiên 107–108; thêm vùng mới cần ptg chọn (xem "Việc kế").

## Đã làm
- `js/world/heSeats.js` (logic thuần): 5 bồ đoàn Hệ dùng LẠI 5 bồ đoàn có sẵn ở hàng 0 (gần bàn thờ nhất): Kim `bd01`, Mộc `bd02`, Thủy `bd03` (bên trái lối giữa), Hỏa `bd04`, Thổ `bd05` (bên phải). Không thêm bồ đoàn mới nên lưới, đường đi, va chạm không đổi. Xuất `HE_SEAT_ID`, `HE_COLOR`, `seatOfHe`, `heOfSeat`, `heAt(p)` (đứng cách tâm ≤ 0,9 m), `heLabel`, `checkHeSeats`.
- `js/scene/boduon.js`: thân bồ đoàn giờ tô màu từng cái (instanceColor); 5 cái Hệ có màu Kim trắng bạc, Mộc xanh lá, Thủy xanh dương, Hỏa đỏ, Thổ vàng đất; 43 cái còn lại giữ nâu cũ. Màu TẠM.
- `js/ui/khaiNgo.js` (giao diện, `initKhaiNgo({toast})`, gọi từ `js/ui/thietDau.js` ngay sau `initConKhi`, cùng kiểu móc nối có sẵn của Phiên 93, nên không phải sửa `hudMenu.js` 20 KB): mỗi 400 ms xem nhân vật có đang ngồi/thiền ở bồ đoàn Hệ không. Chưa đủ Tu Vi 10 (`LGT.farm.tuvi`) → báo một lần. Đủ → bảng nhỏ giữa-trên: tên Hệ, đếm 60 giây, nút "Dùng thử: <tên Skill 1>", "Chọn Hệ này", "Đứng dậy". Chọn xong: trừ lá bồ đề qua `LGT.merit.spendLa` (0 lần đầu, 20 khi đổi Hệ), ghi `localStorage['lgt.he']` (chuỗi thường, `loadHe` đọc được), đặt `LGT.he`, phát sự kiện window `lgt:he` `{he, reset}`.
- `tests/hesseats.test.mjs` (5 test) đã thêm vào `npm test`. `npm test` 999/999 trên Node 22 (trước phiên: 994). CHƯA cập nhật dòng G2.4 trong `docs/KE_HOACH_GDD_V2.md` (file 15 KB, tải lại nguyên file dễ hỏng): phiên sau sửa ô cuối dòng G2.4 thành "(b) XONG (Phiên 113)".

## Giả định TẠM cần ptg duyệt
1. 5 bồ đoàn Hệ là 5 bồ đoàn hàng đầu (bd01–bd05), không phải bồ đoàn riêng cạnh bàn thờ. Muốn bồ đoàn riêng thì sửa `HE_SEAT_ID` và thêm vào `SEATS`/thảm.
2. Bảng chọn Hệ hiện khi đang NGỒI hoặc THIỀN đúng bồ đoàn đó (chế độ `sit`/`meditate`); lạy (`bow`) không tính.
3. Dùng thử chỉ hiện chữ báo (toast), chưa có hiệu ứng đánh thật vì chưa có thanh skill (G2.5).
4. Chưa có lời Trụ Trì mời vào chánh điện.

## Chưa làm / lưu ý
- Chưa chơi thử trên trình duyệt thật (chưa kiểm cảnh 3D, màu bồ đoàn, vị trí bảng trên điện thoại). Việc đầu phiên sau nếu ptg gửi ảnh chụp: kiểm tra bảng `#kn-box` không đè nút; nút "Đứng dậy" của bảng trùng nút "Đứng dậy" có sẵn của HUD (`#hm-stand`), có thể bỏ một trong hai.
- `LGT.he` mới chỉ được ghi; chưa có engine đánh quái nào đọc `lgt:he` để gọi `skillEngine.setHe` (cần khi làm G2.5).
- `PROMPT.md` mục 7 chưa thêm dòng Phiên 109–113 (file lớn, nên thêm một dòng gộp).
- `sw.js` VERSION vẫn `dgt-v108` (mạng trước, bộ nhớ đệm sau nên không bắt buộc tăng).

## VIỆC KẾ (một mục, chờ "tiếp tục")
**G2.5** thanh skill 5 ô (phím 1–5 trên PC, nút trên điện thoại): cần ảnh chụp giao diện điện thoại hiện tại để không chồng cụm nút phải-dưới. Đọc `lgt:he`/`LGT.he` để tạo `createSkillRuntime`. Sau đó G2.6 hiệu ứng nhẹ, G2.7 mở khóa theo cấp + nhiệm vụ Hệ Phái.
**Quái cố định thêm vùng (ptg chọn):** Hồ Thác Đại Phật (Hệ Thủy, cấp 25–45: Thủy Quỷ Hồ Thác 28, Lý Ngư Tinh 38) hoặc Đồi Bảo Tháp (Thổ, 40–65). Thêm vùng = thêm dữ liệu trong `js/data/monsters.js` (`MONSTERS`, `FARM_ZONES` với `rects` nằm trong `OUT_WALKS` của `js/world/outside.js`) + test, không cần đổi logic.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN112.md → docs/PHIEN113.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. Đã XONG: G0.1, G0.3, G0.5, G1.1–G1.4, G3.6, G1.6a, Tự Động Hàng Yêu, G2.1–G2.3, G2.4(a), G2.4(b). Chạy `npm test` trước, sửa test đỏ nếu có. Làm MỘT mục theo lời ptg (mặc định G2.5 thanh skill 5 ô: hỏi ptg ảnh chụp giao diện điện thoại trước khi đặt nút; hoặc thêm vùng quái Hồ Thác Đại Phật nếu ptg chọn), gửi bàn giao docs/PHIEN114.md, rồi CHỜ ptg nói "tiếp tục".  Chỉ đọc những file cần thiết.
