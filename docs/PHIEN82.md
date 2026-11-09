# PHIÊN 82 — Kiến trúc thêm: Bảo tháp 7 tầng trên đồi — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PORMT TỔNG → docs/KE_HOACH_TONG.md → docs/PHIEN81.md → file này.

## Yêu cầu
ptg (09/11): "Tiếp tục và làm các kiến trúc." Hiểu là mục "thêm kiến trúc" còn mở từ PHIEN59/74/75 (cầu đá/cổng tam quan thứ hai, tháp chuông/bảo tháp trên đồi, thủy tạ). Thủy tạ đã có (Phiên 75), nên phiên này làm **Bảo tháp trên đồi**. ptg không nói rõ loại nào → chọn bảo tháp theo gợi ý của các phiên trước; **nếu ptg muốn thêm cầu đá / cổng tam quan thứ hai thì nói, làm ở phiên sau** (quy tắc: từng mục nhỏ, xong báo, chờ "tiếp tục").
Kiểm đầu phiên: `main` @ `cb12e69` (Phiên 81 — hạ tầng ZONE, đã đẩy), 775/775.

## ĐÃ LÀM
- `js/world/outside.js`: `BAO_THAP` {cx 62, cz 79, r 3.5 (vòng chặn), tang 7, h 21.9, 4 đèn đá, stand (62, 84.6)}; hai vùng đi bộ mới `duong-thap` (x59–65, z92–100: lối rẽ từ giữa đường mòn thác) và `san-thap` (x50–74, z68–93: sân lát đá); nơi mới `baothap` trong `PLACES`; đăng ký vật cản (thân tháp + 4 đèn) trong `registerOutside`.
- `js/scene/baothap.js` (MỚI): tháp bát giác 7 tầng (bán kính 2,7 → 1,02 m), mỗi tầng một mái ngói loe + 4 cửa sổ vàng (sáng hơn về đêm qua `userData.nightGlow`), cột sét + 7 vòng tướng luân + ngọc vàng, hai bậc đế, sân lát đá + lối đá, 4 đèn đá. 85 mesh, cao 21,86 m, nằm gọn trong x50–74, z68–100 (đã dựng thử bằng three@0.160.1 trong Node, KHÔNG nhìn bằng mắt). Nối ở `js/scene/outside.js` (`group.add(buildBaoThap())`); hàng cây lá rộng dọc đường mòn thác chừa x 56,5–67,5 để không mọc giữa lối lên đồi.
- Nối hệ nhiệm vụ (đúng quy tắc "nơi mới phải có nhiệm vụ + PLACE_STAND + chương"): `v-baothap` (12 điểm + 1 hạt sen) trong `quests.js`; chương c4 "Ra làng" (`chapters.js`); `journey.js` (gợi ý đường đi, biểu tượng 🗼, nút Dẫn đường); `questGuide.js` (`PLACE_STAND`); `minimap.js` (nhãn "Bảo tháp").
- Test: `tests/outside.test.mjs` +1 (tới được, chặn, đi vòng quanh tháp, sân gọn, lối nối đường mòn, không đè sông/đình/hồ thác), sửa 1 điểm (60,70 → 40,70) vì nay nằm trong sân tháp. `npm test` **776/776 trên Node 22**. Node 20 chưa chạy. `sw.js` = `dgt-v88`.

## CHƯA KIỂM — ptg nhìn trên trang thật
Hình dáng tháp (tỷ lệ, màu, mái, có bị cây/núi che, bóng đổ, cảnh đêm) chưa nhìn bằng mắt vì môi trường AI không có WebGL. Chỉnh trong `js/scene/baothap.js` (hằng số ở đầu hàm: `floorH`, `eaveH`, `towerRadii`). Mặt đất quanh tháp phẳng (không có gò đồi thật): "đồi" chỉ là cảm giác; muốn đồi nổi thật cần hàm `groundY` theo vùng (làm ở phiên sau nếu ptg muốn). Chưa cho vào tháp (chỉ ngắm/đi vòng).

## VIỆC KẾ (từng mục, chờ "tiếp tục")
1. Kiến trúc thêm nếu ptg muốn: cổng tam quan thứ hai, cầu đá cong (hỏi vị trí), tháp chuông riêng, gò đồi thật cho Bảo tháp.
2. Nối hạ tầng ZONE vào game (PHIEN81: cổng thử, `roomKey`, minimap theo zone, lưu zone cuối).
3. Cá 3D trong ao riêng, Tu tập/NPC (đã có Phiên 77–78), Xếp hạng ("Bảng vàng"), bơi–lặn; Gp cập nhật Apps Script cho thùng công đức (PHIEN80).
4. Hai file lạc `js/PROMPT.md`, `js/sw.js` (chờ ptg trả lời có xóa không).
