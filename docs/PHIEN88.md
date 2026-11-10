# PHIÊN 88 — Cổng thử sang "Vườn thử" (zone đầu tiên ngoài hub) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/THIET_KE_CHIEU_SAU.md → PHIEN86.md → PHIEN87.md → file này.

## ĐÃ LÀM
- `js/world/zoneThu.js` (mới, thuần): zone `vuon-thu` (đất trống x 500…540, z −20…20, đặt xa hub), cổng hub `toi-vuon-thu` ở (0, 206) r 3 (cuối khu dân cư), cổng về `ve-chua` ở (520, −15), điểm về hub `tu-vuon-thu` (0, 201).
- `js/world/zoneRuntime.js` `initZones`: thêm cổng + zone vào manager rồi `validate()` (KHÔNG làm trong `createZoneRuntime` để test hub-only cũ giữ nguyên).
- `js/scene/zones.js` (mới): dựng cổng 3D (2 cột + xà + vòng sáng) và nền cỏ Vườn thử; `dispose` giải phóng hình/vật liệu.
- `js/ui/zoneGate.js` (mới): nút "Qua cổng: …" khi đứng trong vòng cổng (chỉ khi đi bộ tự do, không trong nhà/yêu quái/đang bơi), màn che ~0,6 s, tải trước zone khi tới gần (`zones.tick`), teleport tới điểm xuất hiện. `main.js` đặt `LGT.scene` và gọi `initZoneGate`.
- `js/world/path.js` + `layout.activeBounds()`: lưới tìm đường theo bounds của zone đang chạy (hub giữ khung cũ).
- `tests/zonethu.test.mjs` (3 test, layout thật): cấu hình hợp lệ, cổng không nằm trong vật cản, đi sang/tìm đường/quay về nguyên vẹn, phòng mạng tách. `sw.js` = dgt-v94.

- `npm test` **796/796** (Node 22).

## CHƯA KIỂM / CÒN THIẾU
- Chưa nhìn bằng mắt (không WebGL): cổng 3D, nền cỏ, màn che.
- **Phòng mạng chưa đổi khi qua cổng**: `roomKey` đã đúng nhưng `js/net/room.js` chỉ đọc `roomOf` lúc vào phòng → sang Vườn thử vẫn có thể thấy/được thấy người của chùa. Việc kế: cho room.js vào lại phòng khi zone đổi (`zones.listen`).
- Zone thử không có đèn/trời/âm riêng (dùng chung cảnh chùa). Camera va chạm theo zone chưa kiểm.
- Cổng này chỉ để thử; khi có Zone thật thì thay.

## VIỆC KẾ
1. room.js đổi phòng theo zone (`zones.listen`), rồi ptg thử trên điện thoại.
2. Kiến trúc thêm (chờ ptg chọn); ptg: GAS Donations + 1.000đ = 1 hạt sen; xóa `js/PROMPT.md`, `js/sw.js` lạc?
3. THIET_KE_CHIEU_SAU mục 6: sự kiện lịch Âm → Đạo hạnh → Zone 4 → chương 2.
