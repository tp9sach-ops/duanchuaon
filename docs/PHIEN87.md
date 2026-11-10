# PHIÊN 87 — Bơi, lặn, nhặt ngọc trai — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/KE_HOACH_TONG.md → docs/THIET_KE_CHIEU_SAU.md → PHIEN86.md → file này.

## Bối cảnh
ptg chuyển nguồn sang repo `tp9sach-ops/duanchuaon` và bảo làm tiếp việc dang dở. Việc đang làm: **Bơi lặn** (mục 5.3 tài liệu chỉ ghi "CHƯA có" → toàn bộ số liệu là **QUY ƯỚC TẠM**, ptg chưa duyệt). Đầu phiên: sw dgt-v92, test 787/787.

## ĐÃ LÀM (Phiên 87)
- `js/world/swim.js` (mới, logic thuần): SWIM {speed 0,6; diveSpeed 0,45; airMax 20 s; hồi hơi ×4 khi nổi; ngọc 6/hồ; tối đa 8 viên/ngày}; `swimWaterAt`, `stepSwimmer` (land/swim/dive), `speedMul`, `yOffset`, `pearlSpots` (cố định, tránh cầu/sàn), `loadPearls`, `tryPearl` (+1 hạt sen/viên, qua ngày mọc lại).
- `js/world/layout.js`: nước có cờ `swim` KHÔNG chặn đường (trên cầu vẫn đi bộ). `outside.js` (hồ chân thác id `hothac`), `river.js` (sông + Hồ Rừng id `horung`) gắn `swim:true`. Ao sen + hồ cá chùa KHÔNG bơi được (thiêng).
- `js/ui/swim.js` (mới): vòng 100 ms, LGT.swim {active, mode, air, speedMul, toggleDive, status}; hạ thân nhân vật dưới mặt đất (swim −0,75 / dive −1,9) bằng cách bọc `avatar.update`; thanh hơi thở + phủ xanh khi lặn; lưu ngọc ở localStorage `lgt.swim`; cộng sen qua `addMerit`.
- Nối: `world.js` nhân tốc độ `LGT.swim.speedMul`; `skill.js` không nhảy khi đang bơi; `dock.js` (world+ui) nút `lan` (Lặn↔Nổi lên 🤿) + chỉ còn Túi đồ khi ở nước; `hudMenu.js` gọi `initSwim`.
- Test: `tests/swim.test.mjs` (5), dock +1, river/outside sửa theo nghĩa "bơi được". `sw.js` = dgt-v93.

- `npm test` **793/793** (Node 22).

## CHƯA KIỂM
Chưa nhìn bằng mắt (không có WebGL): độ chìm của nhân vật, màu phủ xanh, vị trí thanh hơi, camera khi lặn. Ngọc trai chưa có mô hình 3D (chỉ nhặt khi lặn tới gần vị trí). Cần ptg thử trên điện thoại.

## VIỆC KẾ (từng mục, chờ "tiếp tục")
1. ptg thử bơi/lặn rồi chỉnh số (tốc độ, giây hơi, số ngọc/ngày) nếu cần; thêm hạt sáng ngọc trai 3D dưới đáy nếu muốn.
2. Cổng thử ở rìa hub sang zone trống, dựng/dispose cảnh theo zone, lưới `path.js` theo zone.
3. Kiến trúc thêm (đã có Thủy tạ; chờ ptg chọn thêm).
4. ptg: cập nhật GAS `Donations.gs` + duyệt 1.000đ = 1 hạt sen; trả lời có xóa `js/PROMPT.md`, `js/sw.js` (file lạc) không; xác nhận "ao riêng" = Hồ Rừng.
5. Theo THIET_KE_CHIEU_SAU mục 6: sự kiện lịch Âm → Đạo hạnh → Zone 4 → chương 2.
