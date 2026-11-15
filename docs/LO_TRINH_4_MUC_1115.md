# Lộ trình 4 mục của Giang (2026-11-15) — làm lần lượt, mỗi mục xong đẩy GitHub rồi báo

(1) Mở bằng Chrome luôn mất nút ở trên; (2) đánh quái không hiện hết nút kỹ năng đã học khi vào phái, chiêu không hiển thị/đồng bộ cho tất cả; (3) nút cài đặt chỉnh to/nhỏ các nút bấm; (4) game khó điều khiển.

## Mục 1 — làm 2 lần
**Lần 1 (sw dgt-v169):** `presetFor()` trong `js/ui/compactLogic.js` ép kiểu "Gọn" cho mọi máy cảm ứng/trong khung → ẩn tên chùa, online, giờ game, menu chính, bản đồ nhỏ, nút "sắp có". Nay chỉ "Gọn" khi màn hình thật sự nhỏ (rộng ≤ 520, cao ≤ 620, hoặc cảm ứng mà rộng < 700). `STORE_KEY` đổi `lgt.ui2` → `lgt.ui3`. Test `tests/compact.test.mjs` thêm 2 ca.

**Lần 2 (sw dgt-v170):** Giang chụp lại (Chrome máy tính bảng, game nhúng iframe ở baocaonoibo.io.vn): các nút trên cùng đã hiện đủ, nhưng CẦN ĐI (`#joy`) bị tụt xuống dưới mép nhìn thấy. Nguyên nhân: iframe cao hơn phần màn hình thấy được; HUD đã co theo `--vv-top/--vvh` nhưng `#joy` (gắn thẳng vào body, `position:fixed; bottom` theo khung) thì không. Sửa: `js/ui/viewportLogic.js` ghi thêm `--vv-gap` (phần khung nằm dưới vùng nhìn thấy); `css/mobilefix.css` mục 6: `html[data-frame=true] #joy{margin-bottom:var(--vv-gap)}` và `margin-left:var(--vv-left)` khi `data-frame-x`.

Lưu ý: phiên khác cùng ngày cũng ghi `docs/PHIEN178.md` (vừa đi vừa bấm chiêu) — file đó đã được khôi phục nguyên văn; đừng ghi đè.

## VIỆC KẾ
- Chờ Giang xác nhận mục 1 (đủ nút + cần đi hiện đúng chỗ trên Chrome).
- Mục 2: nút kỹ năng theo hệ phái khi đánh quái (đọc `js/ui/dock.js`, `js/ui/heSkill.js`, `js/ui/skill.js`, `js/world/chieu*.js`) + đồng bộ chiêu cho mọi người chơi.
- Mục 3: cỡ nút trong bảng ⇄ (`js/ui/compact.js`, `--dk-s` trong `css/dock.css`).
- Mục 4: điều khiển dễ hơn.
