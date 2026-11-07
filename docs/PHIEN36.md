# PHIÊN 36 — Xây nhà, BƯỚC 2/6: khu dân cư, lô đất, xóm 10 nhà, mua đất 100 lá, nhà trống, bác khu phố (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** `main` sau Phiên 35 (`05a8929`). Luật: `docs/PHIEN34.md`.

## Đã làm
- **Vị trí:** phía Nam chợ làng. `js/world/land.js` `LAND_WALKS`: đường xuống xóm (x −6..6, z 144..162) và khu dân cư (x −44..44, z 160..210) — được nối vào `OUT_WALKS` (rừng tự chừa chỗ). Đường giữa z 178–190. 10 lô 12×12 m: hàng 1 z=170 (mặt hướng +z), hàng 2 z=198 (mặt hướng −z), x = −32,−16,0,16,32; id 1..10.
- **Logic thuần** `js/world/land.js` (+ `tests/land.test.mjs`, 7 test): `buyLand(land, la, reg, plotId)` (cần ≥100 lá, người chơi chọn LÔ, hệ thống gán XÓM = `firstOpenXom`: xóm 1 đủ 10 thì nhà thứ 11 vào xóm 2…), `setView/viewableXoms` (đổi xóm XEM, không đổi nhà của mình), `loadLand` (dữ liệu hỏng/sửa tay bị chỉnh), `houseRect`, `localRegistry`. `spendLa` thêm vào `js/world/merit.js`.
- **NPC Bác Tư khu phố** (`bacphuong`, x 3.6 z 153) thêm vào `VILLAGERS` (test đổi 9 → 10). Thưa chuyện → mở bảng đất (`js/ui/land.js`): lưới 10 lô, chọn lô → "Mua lô N (100 lá)", ◀ ▶ đổi xóm xem, "Dẫn tôi tới nhà". Mua xong: trừ 100 lá (`LGT.merit.spendLa`), lưu `localStorage['lgt.land']`, nhà trống thô sơ hiện ra + thành vật cản.
- **3D** `js/scene/land.js`: đường lát gạch, cột mốc 4 góc từng lô, bảng số từng lô ("Đất trống / Nhà của bạn / Có chủ"), bảng cổng "KHU DÂN CƯ Diệu Giang", nhà trống thô sơ (ván, mái tôn, cửa). `LGT.landScene.refresh(reg, view, own)`.
- `js/world/path.js`: lưới tìm đường mở rộng tới z=220 (trước đó dừng ở z=160 nên không dẫn đường tới xóm được). `tests/outside.test.mjs`: điểm (0,170) giờ là đất đi được nên đổi sang (70,170).
- `sw.js` `dgt-v36`; `index.html` nạp `css/land.css`. `npm test`: **492/492 đạt**.

## CHƯA kiểm / giới hạn (nói thật)
- CHƯA mở trình duyệt thật (không có three.js cục bộ): chưa nhìn khu dân cư, bảng số, nhà trống, bảng của bác khu phố trên điện thoại. `node --check` các file giao diện/cảnh đều qua, nhưng chưa chạy thật. Cần thử: đi xuống Nam chợ → bác Tư → chọn lô → mua (cần ≥100 lá: đổi từ 1000 hạt sen).
- **Chưa có hàng xóm thật**: sổ xóm chỉ gồm nhà của chính mình (chưa có máy chủ), nên "xem xóm 2" chưa dùng được cho tới bước 5–6. Logic gán xóm/lô đã đúng cho nhiều người và có test.
- Giá trị lá/đất chỉ ở máy người chơi, sửa localStorage được (máy chủ xác nhận làm ở bước cuối).
- Bác Tư chưa có đường đi dạo; nhà trống chưa có nội thất/cửa vào trong; tên "Khu dân cư Diệu Giang", "bác Tư" là tên tự đặt.

## Việc kế (chờ ptg "tiếp tục")
Bước 3: mô hình 4 loại nhà (nhà trống → nhà lầu 150 lá → hoa viên 400 → villa hồ bơi 900 chênh lệch), vào trong nhà, va chạm cửa, nâng cấp tại lô. Mở rộng `HOUSE_LEVELS` trong `js/world/land.js` và `hut()` trong `js/scene/land.js`.
