# Mục 1 — Vật phẩm lá bồ đề, chọn đồ cầm/cưỡi (bàn giao)

Quy tắc ptg: sau MỖI phiên, gửi bàn giao chi tiết (.md) để phiên sau không cần memory vẫn làm đúng.

## Đã làm (trên GitHub, nhánh main)
- js/world/items.js (+ tests/items.test.mjs): Ngọc hồi máu 100 lá/10 phút/hồi ×5; Ngọc dịch chuyển 200 lá/20 phút/hết máu hồi sinh tại chỗ (nhiều lần trong hạn); Gậy như ý 400 lá, +1%. Hạn tính theo giờ thật (đổi tab không dừng).
- js/ui/items.js: cửa hàng Kim Hoàn Ngọc Lan (nvkimhoan) và Điện Máy Lam Sen (nvdienmay) qua js/ui/npc.js; chip hạn dùng góc trái; gậy trên tay + vòng sáng lan + +1% CHỈ khi đang cầm gậy (LGT.loadout.weapon === 'nhuy').
- js/ui/farmCombat.js: regenMul (hồi ×5) và tryRevive (hồi sinh tại chỗ).
- js/ui/staffMesh.js: cây gậy 3D dùng chung; hai đầu chớp lệch pha; nạp assets/models/gay-nhu-y.glb nếu có (dự phòng gậy khối).
- js/ui/board.js: hệ cưỡi theo đồ đang cầm: Thương (mặc định, ai cũng có) / Gậy như ý (cưỡi bay, vệt sáng) / Ván trượt (100 lá, GLB assets/models/skateboard.glb, không phải vũ khí). LGT.loadout = { hold, weapon, list(), choose(id) }. Khóa lưu: 'lgt.van', 'lgt.loadout'.
- js/ui/bag.js: mục “Đang cầm” (chọn Thương/Gậy/Ván). js/ui/dock.js: nhãn nút cưỡi theo đồ cầm. js/world/dock.js: dòng Ván trong Túi đồ (100 lá, ×1,5).

## ptg PHẢI tự làm
1. Giải nén cap-nhat-muc1-assets.zip vào repo: assets/models/skateboard.glb (679 KB) và assets/models/gay-nhu-y.glb (428 KB). Không đẩy được file nhị phân qua công cụ của Claude. Thiếu file thì game vẫn chạy (ván khối / gậy khối).
2. Xem trên máy thật: hướng ván (đầu/đuôi), cỡ gậy (STAFF_LEN = 1,5), gậy GLB là gậy gỗ quấn vải (bo_stuff) khác ảnh mẫu đỏ-đồng — nếu muốn gậy dựng sẵn giống ảnh mẫu thì xóa file gay-nhu-y.glb.
3. CHỐT tốc độ: MOUNT_MUL trong js/world/loadout.js hiện thương/gậy ×1,25 (TẠM), ván ×1,5. Trước đây thương bay ×2.

## Ghi chú kỹ thuật
- Thương bay cũ (mua bằng hạt sen, khóa 'lgt.board') không còn dùng; thương giờ ai cũng có.
- +1% sát thương cộng qua Oán Khí quái bãi rừng (items.js dmgTick), chưa áp cho boss yêu quái/phó bản.
- Ngọc dịch chuyển chỉ áp cho Sinh Lực bãi rừng (farmCombat); phó bản chưa nối.
- Chưa chạy npm test trong phiên này (không có sandbox repo); chạy `npm test` trước khi tiếp tục.

## Việc kế
- Mục 2 (Tự động khi chuyển tab, Tu Vi, Khải Ngộ) đã có commit Phiên 143; kiểm tra lại trên máy.
- Mục 3 (phó bản) và Mục 4 (mảnh ghép boss → linh thú) làm tiếp, từng bước.
