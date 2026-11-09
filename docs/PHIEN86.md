# PHIÊN 86 — Bản đồ nhỏ theo zone + bù bàn giao Phiên 84–85 — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PORMT TỔNG → docs/KE_HOACH_TONG.md → docs/THIET_KE_CHIEU_SAU.md → PHIEN81.md → file này.

## Bối cảnh
ptg bảo xem lại repo (nhiều thay đổi), đọc kỹ, làm tiếp phần còn thiếu theo prompt và đẩy GitHub. Kiểm đầu phiên: `main` @ `70a6e8f` (Phiên 85), `npm test` 786/786 (Node 22).

## Bù bàn giao các phiên chưa có file
- **Phiên 83** (xem PHIEN83.md): Đại Phật khắc vách đá; ảnh `assets/daiphat-da.webp`, `assets/daiphat-cao.webp`, làm phẳng vách thác trong `js/scene/outside.js`. `sw.js` dgt-v90.
- **Phiên 84**: KHÔNG có commit/bàn giao mang tên này. Commit `ec3d5a3` (ptg tải lên tay) sửa `js/ui/accountGate.js` + thêm `js/ui/dialog.js` (`askConfirm`) thay `confirm()` bị chặn trong khung nhúng, làm đăng nhập im lặng dừng.
- **Phiên 85** (commit `987ac5b`, `70a6e8f`): nối ZoneManager vào game. `js/world/zoneRuntime.js` (`createZoneRuntime`, `initZones`; đặt `LGT.zones`, `LGT.zoneStart`; lưu `lgt.zone` ở localStorage + khi `pagehide`), `js/main.js` gọi `initZones`, `js/net/room.js` truyền `roomOf` = `LGT.zones.roomKey(base)`, `js/net/roomClient.js` đổi phòng theo zone (đổi zone thì `API.reset()`), `tests/zoneruntime.test.mjs`. Hiện chỉ có zone hub `chua` nên người chơi không thấy đổi. `sw.js` dgt-v91.

## ĐÃ LÀM (Phiên 86)
- `js/world/minimap.js`: `mapAvailable(zones)` — true khi chưa có zone hoặc `zones.current === 'chua'`; import `HUB_ID` từ `zones.js`.
- `js/ui/minimap.js`: ngoài hub thì ẩn bản đồ nhỏ, tự đóng bản đồ lớn, khóa phím M.
- `tests/minimap.test.mjs` +1 test. `sw.js` = `dgt-v92`.
- `npm test` **787/787 trên Node 22**. Node 20: lần chạy cũng 787/787 nhưng chưa xác nhận npm dùng đúng Node 20 → CI Actions xem hộ.

## CHƯA KIỂM
Chưa nhìn trên trình duyệt (môi trường AI không có WebGL). Hành vi ẩn bản đồ chỉ kiểm bằng test hàm thuần; hiện chưa có zone thứ hai nên chưa kích hoạt trong game thật.

## VIỆC KẾ (từng mục, chờ "tiếp tục")
1. Cổng thử ở rìa hub dẫn sang zone trống rồi quay lại; dựng/dispose cảnh 3D theo zone (hook `load/dispose`); màn che ~1 giây; lưới `path.js` theo zone (hiện cố định X −130…130, Z −80…220).
2. Kiến trúc thêm (cổng tam quan thứ hai, cầu đá cong, tháp chuông riêng): chờ ptg chọn.
3. Ptg: cập nhật GAS thùng công đức (`gas/Donations.gs`) + duyệt 1.000đ = 1 hạt sen; trả lời có xóa `js/PROMPT.md`, `js/sw.js` (file lạc) không.
4. Sau đó theo THIET_KE_CHIEU_SAU mục 6: sự kiện lịch Âm → Đạo hạnh → Zone 4 → chương 2.
