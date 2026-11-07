# PHIÊN 56 — Hoàn thiện câu cá: phím bấm + thu cầu khi rời mặt nước — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu (ptg, 2026-11-08):** "Tiếp tục hoàn thiện tính năng câu cá." Đọc theo thứ tự: PROMPT.md → docs/KE_HOACH_TONG.md → docs/PHIEN55.md (lỗi đăng nhập `blocked` vẫn chờ ptg thử phép 8) → PHIEN48.md → file này.

## Rà soát câu cá (mã thật)
Đã có đủ: logic (`js/world/fishing.js`), bảng + nút nổi (`js/ui/fishing.js`), cảnh 3D (`js/scene/fishing.js`, `js/world/fishingView.js`), nhiệm vụ `cau`/`phongsinh`, công đức phóng sinh. Hai chỗ chưa hoàn thiện đã sửa:
1. Cửa sổ hoa sen chỉ 0,5–0,9 giây mà chỉ bấm được bằng chuột vào nút "Bấm!" (kế hoạch ghi "bấm/phím cách" nhưng chưa nối phím).
2. Đi khỏi mép nước giữa lượt câu thì lượt vẫn chạy (kể cả vào nhà).

## ĐÃ LÀM
- `js/world/fishing.js`: thêm `isTapKey(e)` (Cách / Enter; bỏ qua phím lặp, Ctrl/Alt/Meta, đang gõ chữ) và `stillNearWater(x, z, waterId)` (còn trong mép nước + 1,5 m nới).
- `js/ui/fishing.js`: nghe `keydown` ở giai đoạn capture khi đang có lượt câu và bảng mở → bấm thu cá, chặn `skill.js` (Cách = nhảy) và chặn bấm đúp nút; mỗi khung hình kiểm `stillNearWater` / `LGT.inHouse`, rời nước → `leave()` thu cầu về (độ bền đã trừ, như đóng bảng giữa chừng); chữ gợi ý ghi rõ "nút này hoặc phím Cách / Enter".
- `tests/fishing.test.mjs`: +3 test. `sw.js` = `dgt-v62`. `npm test`: **650/650** (Node 22).

## CHƯA KIỂM (cần ptg xem trên trang thật)
- Cảm giác phím Cách trong lúc hoa sen nở; không còn bị nhảy cùng lúc.
- Mọi điểm "CHƯA nhìn bằng mắt" của PHIEN48.md (độ cao mặt nước, cỡ cầu/hoa sen, bóng cá ngày/đêm).
- Node 20 chưa chạy.

## CẦN PTG QUYẾT (chưa làm vì là quyết định của ptg)
1. **Có tặng 1 cầu gỗ cho người mới không?** Hiện cầu rẻ nhất 30 lá = 300 hạt sen nên người mới gần như không thể câu cá. (Nếu có: thêm `emptyFish().orbs = {go: ben}` hoặc nhận ở nhiệm vụ đầu.)
2. Duyệt số tạm: độ bền 20/30/45/70/100; giá sửa 1/5 giá; phóng sinh +1..3 hạt sen, trần 10 lần/ngày; ao tối đa 30 con.
3. Có muốn thêm "Suối Trong" (~ -111,100, r4,6) làm nơi câu thứ 4 (`addWater` trong `js/world/outside.js`) và hình 3D các con cá bơi trong ao riêng (không bắt buộc)?

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
Theo trả lời của ptg ở mục "CẦN PTG QUYẾT"; rồi kết quả phép 8 (PHIEN55) và các mục mở ở KE_HOACH_TONG.md.
