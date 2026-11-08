# PHIÊN 64 — Sửa "mất cây rừng thông" + hiệu ứng/âm thanh ăn mừng nhiệm vụ — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu (ptg, 2026-11-08):** (a) "Mỗi lần hoàn thành nhiệm vụ hãy thêm hiệu ứng và âm thanh hấp dẫn và làm người chơi phấn khích"; (b) "cây ở rừng thông chưa có".

## ĐÃ LÀM
- **Gốc lỗi cây rừng thông:** không phải lỗi vẽ. Bộ tự giảm cấu hình (PERF governor, `js/scene/perfLogic.js`) ở mức 5 ẨN TOÀN BỘ mesh instanced của khu ngoài chùa (`forest: L < 5`) → máy yếu/điện thoại không thấy cây. Chụp Chromium thật: máy mạnh thấy rừng bình thường.
- **Sửa:** `levelPlan` thêm `forestDensity` (1 / 0,7 từ mức 3 / 0,35 từ mức 5) và `forest` luôn true; `js/scene/index.js` `applyLevel` giảm `InstancedMesh.count` theo mật độ thay vì ẩn; `outside.js` ghi `userData.full` (số lượng gốc). Test `tests/perf.test.mjs` cập nhật.
- **Ăn mừng nhiệm vụ:** `js/world/celebrate.js` (logic thuần: `planCelebration` 3 mức small/big/epic, `chaptersJustDone`, `sfxGain`, nốt nhạc ngũ cung); `js/ui/celebrate.js` (băng chữ vàng + hào quang + cánh sen/giấy bay bằng canvas + nhạc chuông bằng `tone()` + rung điện thoại; tôn trọng tắt tiếng, âm lượng hiệu ứng `lgt.vfx`, "giảm chuyển động"); `css/celebrate.css` (link trong index.html). Nối vào `js/ui/quest.js` `act()` (xong nhiệm vụ / xong cả chương / lên cấp) và `LGT.addXp` (lên cấp). Lỗi ăn mừng → quay về toast cũ. `tests/celebrate.test.mjs` (7 test) có trong package.json.
- Kiểm: `npm test` 685 test, 684 đạt; 1 test `tests/fireflies.test.mjs` ("không đứng yên: sau 20 s…") CHẬP CHỜN do ngẫu nhiên (chạy lại 3 lần: 2 đạt, 1 hỏng) — không liên quan phiên này, nên sửa sau. Chụp ảnh thật trang thử: băng chữ + cánh sen hiển thị đúng ở mức big và epic. `sw.js` = `dgt-v69`.

## CHƯA KIỂM
- Âm thanh nghe thật (chỉ kiểm logic + hình); cảm giác có "phấn khích" chưa — cần ptg nghe/xem và chỉnh.
- Rừng thông trên điện thoại/máy yếu (mức 5 còn 35% cây) — cần ptg xem; Node 20 chưa chạy.
- Dòng "Tiếp theo: …" chưa hiện cho nhiệm vụ thường (chưa truyền `nextTitle` từ thẻ Việc kế tiếp).

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
1. Sông + hồ (từ `THAC.pool`; `addWater` trong `js/world/layout.js`; minimap; có địa điểm mới thì thêm quest `v-` + PLACE_STAND + chương).
2. Thêm kiến trúc (cầu đá, bảo tháp, thủy tạ… — hỏi ptg loại nào).
3. Suối Trong (nơi câu thứ 4) + cá 3D ao riêng; trang "Tu tập" + "NPC" trong Lộ trình.
4. Xếp hạng ("Bảng vàng"), bơi–lặn. "Mời tiệc" để sau. Sửa test đom đóm chập chờn.

## GHI CHÚ THÊM (ptg báo: "nút nhảy Khinh thân trên điện thoại không thấy đâu")
- Điều tra, CHƯA sửa mã. Chụp giả lập điện thoại 390×780: khi bậc Khinh thân ≥ 1 thì cụm nút góc phải-dưới (`js/ui/dock.js`) hiện đủ "Nhảy / Kỹ năng / Túi đồ" (nút Nhảy ở ~x306,y580). Nút chỉ hiện khi `LGT.skill.level > 0` (bậc 1 mở bằng cốt truyện tưới cây bồ đề với Thầy trụ trì) và khi `world.mode==='free'`, không có bảng/hội thoại mở, không đang câu cá/khiêng vật.
- Nghi vấn chính: ptg chưa mở bậc 1 nên nút bị ẩn hoàn toàn. Đề xuất chờ ptg chọn: (A) luôn hiện nút Nhảy mờ, bấm khi chưa mở thì báo cách mở; (B) giữ như cũ.
- Lỗi bố cục thật: cột menu dọc bên phải (đến y≈470) đè lên nút Túi đồ/Kỹ năng của cụm (`css/dock.css` `.dk` bottom 176px ở ≤899px) → nên hạ cụm xuống hoặc dời cột menu.
