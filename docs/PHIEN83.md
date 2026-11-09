# PHIÊN 83 — Đại Phật khắc vách đá làm lại (hình Phật chánh điện → đá, nổi thật) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PORMT TỔNG → docs/KE_HOACH_TONG.md → PHIEN82.md → file này.

## Lỗi ptg báo (09/11): "không thấy tượng Phật khắc trên vách đá"
Nguyên nhân: Phiên 83 mới đẩy lên 2/3 (commit 9eaf1fc). `js/scene/daiphat.js` đã nạp `assets/daiphat-da.webp` và `assets/daiphat-cao.webp` nhưng 2 ảnh CHƯA có trong repo (404), và `js/scene/outside.js` chưa làm phẳng vách thác nên tấm vách (nằm sát x ≈ 116) bị vách cũ (mặt trước lồi lõm tới x = 114,5 + nhiễu) che mất. Đồng thời `tests/daiphat.test.mjs` đỏ → `pages.yml` (deploy needs test) không deploy.

## ĐÃ LÀM (phần 3/3)
- `assets/daiphat-da.webp` (màu đá, alpha = vòm) và `assets/daiphat-cao.webp` (bản đồ độ cao): sinh bằng `python3 tools/make-daiphat-da.py` từ `assets/buddha.webp`. Đã xem ảnh: Phật + hào quang + đài sen chạm trong vòm đá, rêu ở chân.
- `js/scene/outside.js` (`buildWaterfall`): import `CLIFF_FLAT`; mặt trước khối vách ở z địa phương > 4,5 (thế giới z > 108,5, phủ cả tấm vách z 109–125) đặt phẳng tại `x = CLIFF_FLAT.xLocal` (-11,5 → thế giới 116), kể cả hàng đỉnh đáy; không dịch z các đỉnh phẳng; giữ nguyên số lần gọi `rnd()` nên phần vách khác không đổi. Phần dòng thác (z 100,8–107,2) không đổi.
- `sw.js` `VERSION` = `dgt-v90` (đổi tài nguyên ảnh).
- `npm test` **781/781 trên Node 22** (CI dùng Node 20 — chưa chạy).

## CHƯA KIỂM — ptg nhìn trên trang thật
Môi trường AI không có WebGL: chưa nhìn tượng trên cảnh. Cần xem: tượng có hiện, độ nổi (`PANEL.relief` 1,3 / `bias` -0,25 trong `js/world/daiphatPanel.js`), tượng có bị tối/sáng quá, mép vòm với vách, bóng đổ, ban đêm (ánh vàng nhẹ). Nếu tượng quá phẳng: tăng `relief` và `bumpScale` (daiphat.js). Hằng số hình học phải khớp `tools/make-daiphat-da.py`.

## VIỆC KẾ
Theo PHIEN82: nối ZoneManager vào game; kiến trúc thêm (chờ ptg chọn); trả lời có xóa `js/PROMPT.md`, `js/sw.js` (file lạc) không; Gp cập nhật GAS thùng công đức. Cập nhật PROMPT.md mục 7 + KE_HOACH_TONG dòng Phiên 83 (chưa làm trong phiên này).
