# PHIÊN 51 — Nhiệm vụ nội thất đầu tiên (mục 4.3) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, làm TỪNG MỤC, xong báo, CHỜ "tiếp tục". Sửa mã: đưa đoạn TÌM nguyên văn + THAY BẰNG đầy đủ; cần mã nào thì hỏi ptg. **Yêu cầu:** "tiếp tục".

## Thứ tự đọc
`PROMPT.md` (mục 7 cuối) → `docs/KE_HOACH_TONG.md` → `docs/PHIEN51.md` (file này) → `PHIEN50.md`, `PHIEN49.md`. `HANDOFF.md` gốc đã cũ.

## ĐÃ LÀM (mục 4.3)
Nhiệm vụ mới `m-noithat` "Đặt món nội thất đầu tiên" (+50 kinh nghiệm, +4 hạt sen): mua một món ở Cửa hàng, mở Túi đồ bấm "Đặt".
- Sự kiện `noithat` phát từ `js/ui/furni.js` (hàm `apply`) mỗi khi số món đã đặt TĂNG (kể cả khi đặt từ chế độ chỉnh sửa nhà). Dời/xoay/cất không tính.
- Gợi ý "Việc kế tiếp" (`js/world/nextGoal.js`): bỏ qua nếu chưa có nhà; có nhà mà ít lá hơn món rẻ nhất thì nói rõ và dẫn đi kiếm hạt sen; xếp sau `m-nangnha` trong `CHAIN`.
- Dẫn đường (`js/world/questGuide.js`): 2 bước chỉ nút `cuahang` rồi `tuido`.

## File thay đổi (Phiên 51)
SỬA `js/world/quests.js`, `js/world/questGuide.js`, `js/world/nextGoal.js`, `js/ui/furni.js`, `tests/quests.test.mjs`, `tests/nextgoal.test.mjs`, `tests/questGuide.test.mjs`, `sw.js` (`dgt-v56`), `docs/KE_HOACH_TONG.md`, `PROMPT.md`; MỚI `docs/PHIEN51.md`.
`npm test`: **588/588 đạt** (Node 22).

## CHƯA KIỂM / RỦI RO
Chưa thử trên trình duyệt thật: nút Cửa hàng/Túi đồ có nhấp nháy đúng khi dẫn đường không; nhiệm vụ có tự hoàn thành khi đặt món. Món rẻ nhất cần 50 lá bồ đề (lô đất 100 lá) nên người mới sau khi mua đất sẽ phải kiếm thêm lá.
Giá trị thưởng 50 xp / 4 hạt sen là tạm.

## ĐẨY GITHUB — CHƯA ĐẨY ĐƯỢC
Không có quyền đăng nhập để `git push`. Repo `main` vẫn `862cbd8`. ptg tải lên tay bộ `cap-nhat-phien51.zip` (gồm cả file Phiên 49–50 chưa lên). Giữ đúng đường dẫn, trùng tên ghi đè.

## VIỆC KẾ
1. **4.2** nhiệm vụ thử Khinh thân bậc 1 (cần nhận biết nhảy: `js/ui/skill.js`, `js/world/skills.js`) — làm được ngay nếu ptg đồng ý.
2. Cần ptg duyệt trước: 3.2 nâng hình phần trong phòng; 3.4 nhiệm vụ Vipassana; 4.1 ý chính chương 2 cốt truyện.
3. ptg thử máy thật: 3.1 vào/ra 4 cấp nhà; cảnh câu cá 3D; Lạy Phật cộng hạt sen; nhiệm vụ nội thất.
Quy tắc: logic có test; đổi giao diện thì tăng `VERSION` trong `sw.js`; quét bí mật; `npm test`; viết `docs/PHIEN52.md`.
