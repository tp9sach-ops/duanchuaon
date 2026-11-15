# Lộ trình 4 mục của Giang (2026-11-15) — làm lần lượt, mỗi mục xong đẩy GitHub rồi báo

(1) Mở bằng Chrome luôn mất nút ở trên; (2) đánh quái không hiện hết nút kỹ năng đã học khi vào phái, chiêu không hiển thị/đồng bộ cho tất cả; (3) nút cài đặt chỉnh to/nhỏ các nút bấm; (4) game khó điều khiển.

## Mục 1 — làm 2 lần
**Lần 1 (sw dgt-v169):** `presetFor()` trong `js/ui/compactLogic.js` ép kiểu "Gọn" cho mọi máy cảm ứng/trong khung → ẩn tên chùa, online, giờ game, menu chính, bản đồ nhỏ, nút "sắp có". Nay chỉ "Gọn" khi màn hình thật sự nhỏ (rộng ≤ 520, cao ≤ 620, hoặc cảm ứng mà rộng < 700). `STORE_KEY` đổi `lgt.ui2` → `lgt.ui3`. Test `tests/compact.test.mjs` thêm 2 ca.

**Lần 2 (sw dgt-v170):** Giang chụp lại (Chrome máy tính bảng, game nhúng iframe ở baocaonoibo.io.vn): các nút trên cùng đã hiện đủ, nhưng CẦN ĐI (`#joy`) bị tụt xuống dưới mép nhìn thấy. Nguyên nhân: iframe cao hơn phần màn hình thấy được; HUD đã co theo `--vv-top/--vvh` nhưng `#joy` (gắn thẳng vào body, `position:fixed; bottom` theo khung) thì không. Sửa: `js/ui/viewportLogic.js` ghi thêm `--vv-gap` (phần khung nằm dưới vùng nhìn thấy); `css/mobilefix.css` mục 6: `html[data-frame=true] #joy{margin-bottom:var(--vv-gap)}` và `margin-left:var(--vv-left)` khi `data-frame-x`.

Lưu ý: phiên khác cùng ngày cũng ghi `docs/PHIEN178.md` (vừa đi vừa bấm chiêu) — file đó đã được khôi phục nguyên văn; đừng ghi đè.

## Mục 2 — chiêu thức của phái (Giang chọn làm CẢ BA, lần lượt từng bước)
Hiện trạng tìm thấy: thanh chiêu (`js/ui/heSkill.js`) chỉ có 3 ô Q/W/E; ô 4 (Pháp Môn, cấp 30) và Tuyệt Học (cấp 60) chưa có nút; Pháp Môn chưa chọn ở đâu; Tâm Ấn không được cộng ở giao diện; chiêu hỗ trợ (`heSo = 0`: khiên, buff, hồi máu, ẩn thân…) chỉ báo "sắp có", chưa có tác dụng; hiệu ứng chiêu của mình người khác chưa chắc thấy.
- **Bước A — XONG (sw dgt-v171):** `heSkill.js` hiện đủ 5 ô: Q W E + T (Pháp Môn) + Y (Tuyệt Học), xếp 2 hàng (3 + 2). Ô 4: khóa tới cấp 30; đủ cấp mà chưa chọn thì chạm để mở bảng chọn 1 trong 2 Pháp Môn của Hệ, lưu `localStorage lgt.phapmon` (khóa lgt.* tự đồng bộ theo tài khoản). Tuyệt Học hiện Tâm Ấn `x/5`; mỗi chiêu trúng quái +1 Tâm Ấn (`rt.onHit(1)` trong `cast`). Chưa làm: chọn lại Pháp Môn sau khi đã chọn (chưa có cách đổi); đòn đánh thường chưa cộng Tâm Ấn.
- **Bước B — CHƯA:** cho chiêu hỗ trợ (heSo = 0) có tác dụng thật (khiên, hồi máu, buff công/tốc đánh, ẩn thân…) theo `fx` trong `js/data/combatSkills.js`.
- **Bước C — CHƯA:** đồng bộ — người chơi khác thấy hiệu ứng chiêu của mình (qua `js/net/*`, xem cách `avatarChibi`/`gearSync` đồng bộ hiện nay).

## VIỆC KẾ
- Chờ Giang thử bước A (5 nút chiêu hiện đúng, không đè nút khác) rồi nói "tiếp tục" → Bước B.
- Mục 3: cỡ nút trong bảng ⇄ (`js/ui/compact.js`, `--dk-s` trong `css/dock.css`).
- Mục 4: điều khiển dễ hơn.
