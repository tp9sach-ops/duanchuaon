# PHIÊN 58 — Kiểm tổng repo + sửa deploy + cập nhật nhật ký — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu (ptg, 2026-11-08):** "xem repo, có rất nhiều thay đổi, đọc kỹ, phân tích và thực hiện tiếp những thứ còn thiếu". Đọc theo thứ tự: PROMPT.md → docs/KE_HOACH_TONG.md → docs/PHIEN57.md → file này.

## ĐÃ KIỂM (mã thật, main @ 2411f79 = Phiên 57)
- Clone + `npm test`: **657/657 đạt** (Node 22.23). Node 20 (nơi CI chạy) chưa chạy được ở đây.
- Mọi `import` tương đối trong `js/` trỏ đúng file (140 file quét). Chỉ `landscape.js` ở GỐC có 2 import gãy (`./layout.js`, `./placements.js`) — đây là file lạc đã ghi ở mục 2.3, không ảnh hưởng trang.
- `package.json` liệt kê 66 file test, không file nào thiếu, không test nào bị bỏ sót.
- `index.html` không tham chiếu file thiếu.
- Nhánh `am-thanh-nen` cũ (5/11) — `main` đã có nhạc nền, không cần.

## ĐÃ LÀM
1. `.github/workflows/pages.yml`: bước "Gom file tĩnh" chép thêm `chan-doan.html` (trước đó trang chẩn đoán đăng nhập của Phiên 54–55 không có trong bản deploy → 404; đã nêu ở PHIEN55 mục 4).
2. `PROMPT.md` mục 7: bổ sung nhật ký Phiên 55–58 (còn thiếu).
3. `docs/KE_HOACH_TONG.md`: thêm dòng Phiên 58.
Không đổi mã game → không cần tăng `sw.js` (vẫn `dgt-v63`).

## CHƯA LÀM VÌ CẦN PTG QUYẾT (không đoán)
1. Kết quả phép 8 của `chan-doan.html` sau khi cài lại `gas/Code.gs` (PHIEN55) — lỗi `blocked` đăng nhập còn mở.
2. "Mời tiệc": mời bạn vào nhà qua phòng Firebase? (đang "Sắp có").
3. Thêm trang "Tu tập" và "NPC" vào Lộ trình?
4. Tặng 1 cầu gỗ cho người mới? Thêm "Suối Trong" làm nơi câu thứ 4? Hình 3D cá trong ao riêng?
5. Xóa file lạc ở gốc: `phien26.patch`, `PHIEN31.md`, `PHIEN33.md`, `landscape.js`, `docs/PHIEN42_BAN_GIAO (2).md`, `(3).md` — chỉ xóa khi ptg đồng ý.
6. Giai đoạn 3.2/3.4/4.1, 5.3 bơi–lặn, 5.4 xếp hạng, 6.x (nhà người khác, máy chủ xác nhận), 6.3 MoMo.

## CHƯA KIỂM BẰNG MẮT
Bảng Lộ trình trên điện thoại thật, emoji hiển thị, cảnh 3D câu cá, các mục "CHƯA nhìn" của PHIEN48/57.

## VIỆC KẾ (xong báo, chờ "tiếp tục")
Theo trả lời của ptg ở mục "CHƯA LÀM VÌ CẦN PTG QUYẾT".
