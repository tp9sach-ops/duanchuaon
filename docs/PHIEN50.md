# PHIÊN 50 — Chạy test nhiều lần (mục 2.2) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, làm TỪNG MỤC, xong báo, CHỜ "tiếp tục". Sửa mã: đưa đoạn TÌM nguyên văn + THAY BẰNG đầy đủ; cần mã nào thì hỏi ptg.
**Yêu cầu:** "tiếp tục".

## Thứ tự đọc
`PROMPT.md` (mục 7 cuối) → `docs/KE_HOACH_TONG.md` → `docs/PHIEN49.md` → file này. `HANDOFF.md` gốc đã cũ.

## ĐÃ LÀM
- Mục 2.2: chạy `npm test` nhiều lần liên tiếp (Node 22.23): **585/585 đạt ở cả 3 lần**, không thấy test lỗi thoáng qua. Đánh [x] trong `KE_HOACH_TONG.md`. Node 20 chưa chạy.
- Không sửa mã. Mục 1.5 (Phiên 49) vẫn như cũ.

## ĐẨY GITHUB — CHƯA ĐẨY ĐƯỢC
Không có quyền đăng nhập để `git push`. Repo `main` vẫn `862cbd8` (Phiên 48). ptg cần tải lên tay bộ `cap-nhat-phien50.zip` (gồm cả file Phiên 49 chưa lên): `js/engines/den.js`, `js/ui/hudMenu.js`, `tests/den.test.mjs`, `sw.js`, `docs/KE_HOACH_TONG.md`, `PROMPT.md`, `docs/PHIEN49.md`, `docs/PHIEN50.md`. Đường dẫn giữ nguyên, trùng tên ghi đè.

## VIỆC KẾ (giai đoạn 3 — nhà và nội thất)
1. 3.1 ptg thử trên máy thật: vào/ra 4 cấp nhà, nút nhà không che menu điện thoại, camera trong phòng.
2. 3.2 nâng hình phần trong phòng (`shell()` trong `js/scene/interior.js`) — HỎI ptg trước.
3. 3.4 nhiệm vụ Tâm trí Vipassana — xin ptg duyệt thiết kế trước (file thiết kế cũ không còn trong repo → hỏi ptg ý chính).
4. 4.3 nhiệm vụ nội thất đầu tiên (QUESTS + CHAIN) — làm được ngay nếu ptg đồng ý.
Quy tắc: logic có test; đổi giao diện thì tăng `VERSION` trong `sw.js` (nay `dgt-v55`); quét bí mật; `npm test`; viết `docs/PHIEN51.md`.

## Câu hỏi treo cho ptg
Mỗi lần Lạy Phật mấy hạt sen (tạm 1)? Cầu quăng xuống nước có đúng ý? Pages: Source = "GitHub Actions"?
