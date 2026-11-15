# Phiên 178 (2026-11-15) — lộ trình 4 mục của Giang

Giang báo: (1) mở bằng Chrome luôn mất các nút ở trên; (2) đánh quái không hiện hết nút kỹ năng đã học khi vào phái, chiêu không đồng bộ; (3) cho phép chỉnh to/nhỏ các nút bấm; (4) game khó điều khiển. Làm từng mục, mỗi mục xong đẩy GitHub rồi báo.

## Mục 1 — XONG: Chrome mất nút trên cùng
- Nguyên nhân: `presetFor()` (js/ui/compactLogic.js) ép kiểu "Gọn" cho MỌI máy cảm ứng hoặc đang nằm trong khung (game nhúng ở baocaonoibo.io.vn là iframe). Kiểu "Gọn" ẩn: tên chùa/online/giờ game, menu chính, bản đồ nhỏ, ghi chú, nút "sắp có" (Thông báo/Quà/Thư/Công quả). Máy tính bảng lớn cũng dính.
- Sửa: chỉ "Gọn" khi màn hình thật sự nhỏ (rộng ≤ 520, cao ≤ 620, hoặc cảm ứng mà rộng < 700); khung cao ≤ 400 vẫn "Tối giản". Còn lại "Đầy đủ".
- `STORE_KEY` đổi `lgt.ui2` → `lgt.ui3` để máy từng kẹt kiểu Gọn được đặt lại về mặc định mới (ai đã tự chỉnh giao diện sẽ phải chỉnh lại 1 lần, ở nút ⇄ góc trái-trên).
- Test `tests/compact.test.mjs` thêm 2 ca (máy tính bảng + khung → 'day'). `npm test` 1231/1231. `sw.js` = `dgt-v169`.

## VIỆC KẾ
- Mục 2: nút kỹ năng theo hệ phái khi đánh quái (đọc js/ui/dock.js, js/ui/skill.js, js/world/chieu*.js, js/ui/heSkill.js) + đồng bộ chiêu cho mọi người chơi.
- Mục 3: cài đặt cỡ nút (thêm vào bảng ⇄ trong js/ui/compact.js; biến CSS --dk-s trong css/dock.css).
- Mục 4: điều khiển dễ hơn.
