# Phiên 149 — Sửa theo ý ptg (14/11, 08:39): hết máu, Ngọc dịch chuyển có ghim, Ngọc hồi máu, Gậy như ý

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Danh sách 4 mục lớn (14/11) — trạng thái
1. Tự động đánh / hết máu → XONG, rồi SỬA LẠI ở phiên này (xem dưới; thay hành vi Phiên 145 và 147).
2. Bồ đoàn Hỏa, Lễ Khai Ngộ, Tu Vi, chuyển tab không đứng → XONG code (docs/PHIEN148.md, js/main.js), CHỜ ptg thử máy thật.
3. Phó bản (NPC → khu riêng, quái hồi sinh mạnh/to hơn 9 lượt → boss, rơi đồ, đã chinh phục mạnh hơn) → CHƯA LÀM, tiếp từ bước 4d docs/PHIEN140.md (xem docs/PHIEN139.md, js/world/zoneDungeon.js, js/world/dungeon.js, js/ui/dungeonZones.js, js/ui/dungeonPanel.js).
4. Linh thú từ mảnh ghép boss (3 mảnh → ghép → túi hồ lô → gọi/cưỡi/chiến đấu; kỹ năng boss tác động người chơi và quái) → CHƯA LÀM.

## Yêu cầu mới của ptg (4 điểm) — đã làm xong code, commit db9cf1d trên main
1. KHÔNG có Ngọc dịch chuyển, hết máu: về cổng chùa, hồi đầy máu, TẮT tự động hàng yêu, đứng yên tại cổng chùa. (js/ui/farmCombat.js `defeat()`: gọi `LGT.farm.toggleAuto()` nếu đang auto rồi `LGT.world.teleport(RESPAWN)`. Đã BỎ cơ chế "tự quay lại chỗ đánh sau 3 giây" của Phiên 147.)
2. CÓ Ngọc dịch chuyển, hết máu: hồi sinh TẠI CHỖ đang đứng, hoặc tại chỗ đã GHIM; tự động hàng yêu vẫn chạy. Tính năng ghim là MỚI: js/ui/items.js có nút "📍 Ghim chỗ hồi sinh" nằm dưới các chip hạn dùng ở góc trái-trên, CHỈ hiện khi Ngọc dịch chuyển còn hiệu lực; bấm để ghim vị trí hiện tại (không ghim được khi đang trong nhà), bấm lần nữa ("Bỏ ghim chỗ hồi sinh") để bỏ. Lưu localStorage 'lgt.itempin' {x, z}. `LGT.items.pinned` trả {x,z} hoặc null; farmCombat đọc và `teleport` tới đó sau `tryRevive()`. Ngọc hết hạn thì ghim không còn tác dụng (rơi về luật 1).
3. Ngọc hồi máu: vẫn ×5; khi Sinh Lực < 50% tối đa thì nhân thêm ×1,1 (= ×5,5). Hằng số `LOW_HP_FRAC = 0.5`, `LOW_HP_REGEN_MUL = 1.1` đầu js/ui/farmCombat.js; `stepVit()` xử lý phần lẻ. Mình hiểu "tăng 10% tốc độ hồi máu" là nhân thêm 1,1 lên tốc độ hiện có (không phải cộng thêm 10% của tốc độ gốc).
4. Gậy như ý: to gấp 1,4 lần cây côn/thương mặc định (côn dài 1,5 m → gậy 2,1 m, dày gấp 1,4) khi cầm tay (js/ui/items.js) và trong Túi hồ lô (js/ui/bag.js) qua hằng `STAFF_SCALE = 1.4` trong js/ui/staffMesh.js; khi cưỡi bay (js/ui/board.js) dài hơn cây thương cưỡi 25%, vệt sáng sau gậy dời theo. Ánh sáng HỒNG: texture quầng (glowTexture) đổi từ vàng sang hồng; thêm 2 quầng hồng dọc thân gậy (thở nhẹ, nhanh hơn khi đánh); cán đỏ có ánh hồng (emissive 0x8a1f5c); vòng sáng lan khi vung gậy màu `STAFF_PINK = 0xff7ac8`.

## Kiểm
- `npm test`: 1095 test, tất cả xanh, trừ MỘT test ngẫu nhiên tests/fireflies.test.mjs ("không đứng yên: sau 20 s mỗi con đã di chuyển") thỉnh thoảng fail cả trên bản gốc (không liên quan). Chạy riêng 6 lần đều xanh.
- CHƯA thử trong trình duyệt thật. Cần ptg thử: (a) hết máu khi không có ngọc → về cổng chùa và auto tắt; (b) mua Ngọc dịch chuyển, ghim chỗ, để hết máu → hồi sinh ở chỗ ghim, auto vẫn chạy; (c) nhìn kích cỡ + màu hồng của gậy trên tay / Túi hồ lô / khi cưỡi.

## Lưu ý kỹ thuật cho phiên sau
- GitHub MCP + git: gh token trong môi trường có thể hết hạn; dùng công cụ `add_repo` (access push) rồi `git push` từ bản clone, hoặc dùng công cụ create_or_update_file của GitHub MCP.
- Chưa có test tự động cho: ghim chỗ hồi sinh, nhân 1,1 dưới 50%, kích cỡ/màu gậy (đều là giao diện/3D). Có thể thêm test nguồn (đọc chuỗi) như tests/bgtick.test.mjs nếu ptg muốn.
- Dòng nhật ký Phiên 145–149 trong PROMPT.md mục 7 chưa thêm (file ~74 KB).
- Còn chữ "Túi đồ" trong toast của js/ui/items.js, js/ui/board.js, js/ui/loadout.js (xem docs/PHIEN146.md).

## Việc kế
Mục 3: phó bản từ bước 4d (docs/PHIEN140.md). Làm TỪNG bước nhỏ, npm test xanh, đẩy GitHub rồi báo. Sau đó mục 4.

## Prompt khởi động phiên mới
> Đọc docs/PHIEN149.md, docs/PHIEN148.md, docs/PHIEN140.md, docs/PHIEN139.md. Chỉ xem chỗ cần sửa. Mục 1, 2 xong (chờ ptg thử), 4 điểm sửa của 14/11 xong. Làm mục 3 (phó bản) từ bước 4d, từng bước nhỏ, npm test xanh, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN150.md kèm prompt và chép nguyên văn quy tắc ptg ở đầu file này.
