# Phiên 99 — BÀN GIAO: xong G0.1 (đối chiếu GDD v2 với mã thật)

> Ngày 2026-11-11. Repo https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Phiên này CHỈ đọc mã và viết tài liệu; KHÔNG đổi mã game; không chạy `npm test` (không có gì để test).

## 0. QUY TẮC BÀN GIAO (nguyên văn — chép vào mọi bản bàn giao)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

## 1. ptg yêu cầu (Phiên 99)
"Lập kế hoạch để triển khai từng bước theo đúng cái tôi gửi (GDD v2), cập nhật thêm cách chơi, nội dung, quái, vật phẩm, skill... và làm từ bước 1." → Bước 1 của `docs/KE_HOACH_GDD_V2.md` là **G0.1** (đối chiếu GDD với mã thật). Đã làm xong mục này; theo quy tắc, DừNG và chờ ptg nói "tiếp tục".

## 2. Kết quả
- Tạo `docs/GDD_v2_DOICHIEU.md`: bảng đúng / lệch / thiếu theo từng hạng mục GDD, danh mục nội dung hiện có (quái, kỹ năng, vật phẩm, tiền tệ), kế hoạch bổ sung nội dung, điều chỉnh kế hoạch G1–G7 và 4 câu hỏi mới cho ptg.
- **Trạng thái G0.1 = XONG (Phiên 99).** Cột Trạng thái trong `docs/KE_HOACH_GDD_V2.md` CHƯA được sửa (sửa nguyên file qua công cụ tốn kém); coi mục DOICHIEU mục 6 là nguồn đúng về tiến độ.

## 3. Phát hiện quan trọng nhất (chi tiết trong DOICHIEU)
1. "Cấp độ" trong mã là 10 cấp công hạnh (`js/world/quests.js` LEVELS, xp 0 → 1800), dùng khắp nơi (Sinh lực, sát thương nhận, ném người, Khinh thân). Tu Vi 1–150 của GDD phải là hệ RIÊNG, đặt tên biến khác (`tuvi`), không đè `level`.
2. Yêu quái hiện tại là BOSS SỰ KIỆN (`js/world/yeuquai.js`): 3 loại Đá/Nước/Lửa, **mỗi ngày 3 lần (12:00, 16:00, 20:00 giờ VN)**, dùng máu thật (hp), không có Oán Khí/Hồ Lô/Dao Động. GDD ghi "hằng tháng" là LỆCH. Chưa có quái thường.
3. Đã có hai kỹ năng GDD không nhắc: **Chém khí** (`conKhi.js`, Phiên 93) và **Thiết đầu công** (`thietDau.js`, Phiên 90); cùng ném đá, thương, ném vật/người (`strength.js`), Khinh thân 8 bậc (`skills.js`).
4. Cốt truyện thật: chương 1 (`story.js`) và chương 2 "Mảnh chuông Đá" (`story2.js`, chuông Diệu Giang + tam độc). Khác chương GDD v2 (chương 2 = Lễ Khai Ngộ). Cần ptg chọn cách hợp nhất.
5. Chưa có: Hệ Ngũ Hành, Pháp Môn, Hồ Lô, Quy Y Viện, Sổ Thu Phục (có mẫu `dex` cá), Linh Thú, Thần Khí, 10 ô trang bị, Thiền Phái, Huyền Tinh, Linh Ấn. `js/world/zones.js` có sẵn loại zone QUAI/HAM nhưng cần xác nhận đã nối vào game chưa (G7.4).
6. Công cụ tìm mã của phiên này trả "incomplete_results", nên mục "chưa có" được xác nhận bằng danh sách tên file trong `js/world` và `js/ui`, không phải grep toàn repo. Phiên sau nên `git clone` rồi grep thật trước khi viết G1.

## 4. Việc kế tiếp
1. **G0.2:** hỏi ptg 10 câu GDD mục 16 + 4 câu mới (DOICHIEU mục 7). Cho phép "mặc định". Ghi kết quả vào `PROMPT.md` mục 7 (cùng dòng nhật ký Phiên 98 và 99 còn thiếu).
2. **G0.3:** sửa 4 test hỏng (`312`, `318`, `345`, `tutorial: chủ đề mới`). Cần `git clone` + `npm test` để thấy lỗi thật; có thể phải hỏi ptg đoạn mã.
3. **G0.4:** hỏi ptg làm phần CÁ (Phiên 97) trước hay sau G1 (mặc định: sau).
4. Rồi G1.1 (theo bản điều chỉnh ở DOICHIEU mục 5). Mỗi mục: làm → npm test → đẩy GitHub → báo → chờ "tiếp tục".

## 5. Chưa kiểm / rủi ro
- Chưa đọc `docs/PHIEN81.md`, `PHIEN90.md`, `PHIEN91.md`, `js/world/yqCoop.js`, `zoneRuntime.js`, `zoneGate.js`, `zoneThu.js`, `throwPlayer`: nên đọc ở G7 và khi nối mạng.
- `PROMPT.md` mục 7 vẫn thiếu dòng Phiên 98 và 99 (file lớn, chưa sửa).

## 6. Prompt khởi động phiên sau (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/duanchuaon
Đọc PROMPT.md, docs/KE_HOACH_GDD_V2.md, docs/GDD_v2_DOICHIEU.md và docs/PHIEN99.md trước (HANDOFF.md ở gốc đã cũ).
Clone repo, chạy npm test. Làm đúng MỘT mục nhỏ kế tiếp (G0.2 nếu tôi đã trả lời câu hỏi; không thì hỏi tôi). Xong thì npm test,
đẩy GitHub (trùng tên ghi đè), báo tôi và CHỜ tôi nói "tiếp tục". Cần đoạn mã nào thì hỏi tôi, không đoán. Số liệu (TẠM) không tự chốt.
Cuối câu trả lời LUÔN đính kèm file bàn giao cập nhật (docs/PHIENxx.md) và chép nguyên văn quy tắc bàn giao. Không đủ chỗ: gửi bàn giao TRƯỚC.
```
