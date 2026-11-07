# PHIÊN 37 — Xây nhà, BƯỚC 3/6: 4 loại nhà + nâng cấp (BÀN GIAO, CẬP NHẬT SAU TỪNG MỤC NHỎ)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** `main` @ `c28060d` (Phiên 36). Luật xây nhà + bảng giá: `docs/PHIEN34.md`; bước 2 (đất/xóm): `docs/PHIEN36.md`.
**Cách làm (ptg yêu cầu):** chia bước 3 thành mục nhỏ, MỖI MỤC xong là đưa file lên GitHub ngay để hết token giữa chừng vẫn không mất.
**Giới hạn phiên này (nói thật):** tích hợp GitHub của phiên chat chỉ ĐỌC (ghi trả 403 "Resource not accessible by integration"), nên không tự đẩy được → mỗi mục giao file đúng đường dẫn repo, ptg tải lên tay (trùng tên ghi đè). Phiên chạy trong Claude Code có quyền ghi thì tự commit.

## Các mục nhỏ của bước 3
- [x] **3a** Logic thuần (đã thử, 5 test mới đạt trên Node 22 với `merit.js` giả):
  - `js/world/land.js`: `HOUSE_LEVELS` 4 cấp {lv, ten, hw, hd, gia}: 0 Nhà trống thô sơ (3×2.6, tặng) / 1 Nhà lầu (3.6×3, 150 lá) / 2 Nhà hoa viên (3.6×3, 400) / 3 Villa hồ bơi (4.4×3.2, 900). `gia` = giá niêm yết, nâng cấp trả CHÊNH LỆCH (0→1 = 150, 1→2 = 250, 2→3 = 500, 0→3 = 900), được nhảy cấp.
  - Hàm mới: `MAX_LV`, `houseLevel(lv)` (kẹp 0..3), `upgradeCost(from,to)`, `upgradeHouse(land, la, reg, to?)` → `{ok, reason:''|'noland'|'maxed'|'invalid'|'poor', cost, land, reg}`; không sửa đầu vào; nơi gọi tự trừ lá bằng `LGT.merit.spendLa(cost)` khi ok. `loadLand` dùng `houseLevel` (lv 9 → 3). `houseRect` dùng `houseLevel`.
  - `tests/land.test.mjs`: test đọc dữ liệu đổi (lv 9 → 3) + 4 test mới (cấp nhà, giá chênh lệch, nâng cấp, cấp đích sai). Kỳ vọng sau khi tải lên: `npm test` = 492 − 0 + 4 = 496 đạt (cần phiên có repo chạy để xác nhận).
- [x] **3b** XONG (đã chụp ảnh Chromium thật: nhà lầu, nhà hoa viên, villa; không lỗi JS): `js/scene/land.js` thêm `houseModel(lv, face)` (export) = nhà lầu 2 tầng mái ngói chóp + ban công; nhà hoa viên = nhà lầu + vườn trước nhà (thảm cỏ, hàng rào trắng, 12 bông hoa, 2 cây); villa = khối hiện đại 2 tầng lệch, vách kính, hồ bơi nước xanh sàn gỗ trước nhà. `refresh()` đọc `rec.lv` / `me.lv`, dựng lại mô hình khi đổi cấp (giải phóng geometry/vật liệu cũ, đặt tâm theo `houseRect(plot, lv)`); bảng số lô của mình hiện tên cấp. Chưa kiểm: nhìn cận villa/hồ bơi, ban đêm, FPS điện thoại. Hồ bơi CHỈ TRANG TRÍ (đi xuyên qua được) → va chạm làm ở 3d. `sw.js` VERSION `dgt-v38`.
- [x] **3c** XONG (phiên làm tiếp, `npm test` 497/497 đạt trên Node 22): `js/ui/land.js` hiện tên cấp hiện tại (`houseLevel(lv).ten`), mỗi cấp cao hơn một nút "Nâng lên … (N lá)" (mờ + "cần N lá" khi thiếu), `upgrade(to)` gọi `upgradeHouse` rồi `LGT.merit.spendLa(cost)` (thiếu lá thì không đổi gì), rồi `save(); placeHouse(); draw()`; `placeHouse()` đã dùng `houseRect(plot, lv)` nên vật cản đổi theo cấp; `css/land.css` thêm `.ld-act` xuống hàng; `tests/landui.test.mjs` (1 test: mọi tên nhập trong ui/land.js có thật trong world/land.js) đã thêm vào `package.json`; `sw.js` VERSION `dgt-v37`. **Chưa làm:** hình 3D theo cấp (3b) nên nâng cấp mới đổi chữ + vật cản, chưa đổi hình nhà; chưa thử trên trình duyệt thật.
- [~] **3d-1 XONG: va chạm hồ bơi villa** — `js/world/land.js` `poolRect(plot, lv)` (null nếu lv<3; chữ nhật hồ + vành 0,25 m, khớp `villa()` trong scene), `js/ui/land.js` `placeHouse()` giờ quản lý MẢNG vật cản (thân nhà + hồ), `tests/landpool.test.mjs` (3 test: chỉ villa có hồ; hồ nằm trong lô, không đè nhà, không chắn điểm đứng trước nhà, nằm phía mặt tiền; kích thước khớp mô hình) đã vào `package.json`; `sw.js` `dgt-v39`. **3d-2 CÒN LẠI:** cửa vào nhà + vào trong nhà (cần ptg chốt: bên trong là cảnh riêng hay chỉ ngồi/nghỉ trước cửa? chưa có thiết kế → hỏi ptg, không đoán).
- Sau đó: bước 4 nội thất, 5 tham quan + tiệc, 6 máy chủ xác nhận + nạp tiền (xem `docs/PHIEN34.md`).

## Ghi chú
- `houseRect` chừa ≥ 4,5 m sân trước và 1 m hai bên cho mọi cấp (có test) để dành chỗ vườn / hồ bơi.
- Chưa mở trình duyệt thật; `npm test` đầy đủ chưa chạy (không có bản repo cục bộ).

## File thay đổi (3a)
js/world/land.js, tests/land.test.mjs, docs/PHIEN37.md
## File thay đổi (3c)
js/ui/land.js, css/land.css, tests/landui.test.mjs, package.json, sw.js, docs/PHIEN37.md
## File thay đổi (3b)
js/scene/land.js, sw.js (dgt-v38), docs/PHIEN37.md
## File thay đổi (3d-1)
js/world/land.js, js/ui/land.js, tests/landpool.test.mjs, package.json, sw.js (dgt-v39), docs/PHIEN37.md
