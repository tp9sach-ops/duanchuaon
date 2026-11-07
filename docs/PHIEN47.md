# PHIÊN 47 — Nhiệm vụ + hướng dẫn câu cá/phóng sinh (mục 1.4) + sửa bản đồ hồ cá — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, làm TỪNG MỤC, xong báo, chờ "tiếp tục". Muốn sửa mã thì nhận đủ đoạn TÌM và THAY BẰNG (kèm file cả cặp).
**Yêu cầu Phiên 47:** "xem repo kỹ, phân tích, hiểu rõ, làm tiếp những thứ còn thiếu". Đọc theo thứ tự: `PROMPT.md` → `docs/KE_HOACH_TONG.md` → file này → `docs/PHIEN46.md`, `PHIEN44.md`, `PHIEN45.md`. `HANDOFF.md` gốc đã cũ (đầu file ghi tới Phiên 36).

## Kiểm repo thật (main = `9345cf9`)
- `npm test` **575/575 đạt (Node 22)** trước khi sửa. Sau Phiên 47: **578/578**. Node 20 CHƯA chạy ở phiên này.
- Bản sửa Phiên 46 đã lên GitHub đúng chỗ (`js/ui/fishing.js`, `js/ui/hudMenu.js`, `js/ui/menuLogic.js`). **3 file lạc cũ vẫn còn ở `js/`** (`js/fishing.js`, `js/hudMenu.js`, `js/menuLogic.js`): đã so sánh, TRÙNG KHÍT bản đúng, không file nào import chúng (trừ chính chúng) → vô hại nhưng nên xóa tay.
- Việc 1.4 (nhiệm vụ câu cá/phóng sinh) trước phiên này: KHÔNG có chỗ nào gọi `LGT.act('cau'|'phongsinh')`; `tutorial.js` còn ghi "Phóng sinh — sắp có" dù bảng Câu cá đã chạy.

## ĐÃ LÀM (Phiên 47)
1. `js/world/quests.js`: `EVENT_TYPES` thêm `'cau'`, `'phongsinh'`; 3 nhiệm vụ mới: `m-cau` (Câu được con cá đầu tiên, 30 điểm, 2 sen), `m-phongsinh` (Phóng sinh lần đầu, 40 điểm, 3 sen), `n-phongsinh` (hằng ngày, 15 điểm, 1 sen). QUESTS: 18 → 21.
2. `js/ui/fishing.js`: câu được cá → `LGT.act('cau')`; mỗi lần phóng sinh (cá vừa câu hoặc cá trong ao) → `LGT.act('phongsinh')` (gọi trước `LGT.merit.reward`).
3. `js/world/nextGoal.js`: `CHAIN` thêm `m-cau`, `m-phongsinh` (sau `m-nangnha`) và `n-phongsinh` (cuối); `nextGoal` nhận thêm `state.orbs` (số quả cầu đang có): chưa có cầu → nói giá cầu rẻ nhất, thiếu lá thì dẫn đi kiếm hạt sen/đổi lá ở Thầy Tri khách, đủ lá thì chỉ cách mua ở tab "Quả cầu".
4. `js/ui/story.js`: `stateNow()` truyền `orbs` từ `LGT.fishing.state.orbs`.
5. `js/world/questGuide.js`: dẫn đường 3 nhiệm vụ mới: đi ra hồ cá (`PLACE_STAND.hoca`, đã kiểm đứng sát nước), rồi nhấp nháy nút `cauca`.
6. `js/world/tutorial.js`: chủ đề "Phóng sinh" viết lại thật (5 bước, số liệu lấy từ `ORBS`/`POND_MAX`); chỉ còn 1 bước ghi "sắp có" (hình 3D câu cá).
7. `js/world/minimap.js`: hồ cá vẽ `x: 56` → `x: 60` (đúng `KOI.x`).
8. `sw.js` VERSION `dgt-v52` → `dgt-v53`.
9. Test: `tests/nextgoal.test.mjs` (+1), `tests/questGuide.test.mjs` (+1), `tests/quests.test.mjs` (+1), `tests/tutorial.test.mjs` (sửa `tapIds` có `TOP_ICONS`).

## CHƯA KIỂM / RỦI RO
- Chưa mở trang thật: nút "Câu cá" nhấp nháy khi dẫn đường (`.hm-ic[data-id="cauca"]` + lớp `gd-hl`), thẻ "Việc kế tiếp" với câu cá, trên điện thoại.
- Phóng sinh tính 2 lần thưởng: thưởng nhiệm vụ (sen nhỏ) + `reward('phongsinh')` (1..3 sen, trần 10 lần/ngày). Số tạm, ptg chưa duyệt.
- Người đã có nhiều lá/cầu từ trước: nhiệm vụ mới hiện ngay là chưa xong (bình thường).
- `n-phongsinh` hằng ngày đòi có cá: người chơi mới phải có cầu (30 lá). Đã đặt cuối chuỗi nên không chặn việc khác.

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
1. **1.2 (3c) Cảnh 3D câu cá** `js/scene/fishing.js`: cầu bay, vòng sóng, bóng cá giây 4, phao nhún, hoa sen đúng cửa sổ `orb.cua`; đọc `LGT.fishing.session`; nối `js/scene/index.js`; tôn trọng reduced-motion + PERF.
2. 1.5 Lạy Phật → `LGT.merit.reward('lay', n)`; 2.2 chạy test nhiều lần; rồi giai đoạn 3 (nhà/nội thất) theo `KE_HOACH_TONG.md`.
Quy tắc: logic có test; đổi giao diện thì tăng `VERSION` trong `sw.js`; quét bí mật; đẩy GitHub; viết `docs/PHIEN48.md`.

## File thay đổi phiên này
js/world/quests.js, js/world/nextGoal.js, js/world/questGuide.js, js/world/tutorial.js, js/world/minimap.js, js/ui/fishing.js, js/ui/story.js, sw.js, tests/nextgoal.test.mjs, tests/questGuide.test.mjs, tests/quests.test.mjs, tests/tutorial.test.mjs, docs/KE_HOACH_TONG.md, docs/PHIEN47.md (mới), PROMPT.md (mục 7).
XÓA TAY trên GitHub (nếu còn): js/fishing.js, js/hudMenu.js, js/menuLogic.js.
