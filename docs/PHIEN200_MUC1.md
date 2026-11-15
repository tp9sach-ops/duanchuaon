# Phiên 200 — MỤC 1 (tiếp): ĐỨNG ĐƯỢC TRÊN KIẾN TRÚC/ĐÁ/CÂY/TƯỢNG, KHÔNG XUYÊN; CHIÊU KHI ĐANG BAY

> Repo `main`. ptg (2026-11-16): bấm Nhảy nhiều lần = lướt tới trước đến khi chạm đất (ĐÃ CÓ từ Phiên 196–199, bỏ qua); nhân vật đứng được trên nhà, núi, đá, cây, đền, tượng, không xuyên qua; đang bay dùng được mọi chiêu. Mục 2 (đánh thường lao tới + combo 3 đòn, lướt tay tung chiêu, không quái vẫn dùng) ĐÃ XONG ở Phiên 198 (`docs/PHIEN198*`, `tests/basiccombo`, `tests/aimswipe`).

## Cơ chế mới (độ cao so với mặt đất, `feetH`)
- `js/world/layout.js`: vật cản (CIRCLES/RECTS) có thể mang `top` (m) hoặc `h` = MẶT ĐỨNG. `overTop(o, feetH)`: chân cao ≥ top−0,05 thì bay/đi QUA PHÍA TRÊN; thấp hơn thì vẫn chặn → không xuyên. Vật không có top/h chặn mọi độ cao.
  - `blocked/canStep/move/bodyBlocked/canStepBody/moveBody` thêm tham số cuối `feetH = 0` (mặc định giữ hành vi cũ).
  - `floorAt(x, z, feetH)`: mặt đứng tại điểm (mặt đất/sàn/cầu hoặc mặt trên vật mà chân đã ở trên hoặc thấp hơn ≤ `STEP_UP` 0,6 m).
  - `DECKS` + `addDeck({x,z,r,top})`: mặt đứng KHÔNG chắn đường (tán cây). Không nằm trong CIRCLES nên A* (`path.js`) không bị ảnh hưởng.
- `js/world/skills.js createJump.step(dt, floor=0)`: chạm `floor` thì đáp lại đó và đứng yên; mặt đứng biến mất (bước ra mép) thì tự rơi.
- `js/ui/skill.js` (wrap avatar.update): mỗi khung tính `floorAt` → `jump.step(dt, fl)` → `LGT.feetH = groundY + y`. `js/world/world.js` truyền `LGT.feetH` vào `walkStep` (đi bộ + bay lướt). `js/world/strength.js landing()` mặc định lấy `LGT.feetH` (lao/lướt/đạp gió qua phía trên vật thấp).
- Đang bay dùng chiêu: kiểm mã, `farm.js/dock.js/heSkill.js` không chặn theo trạng thái trên không (test canh); chiêu lao dùng `W.dash` + `landing()` đã theo `feetH`.

## Mặt đứng đã gắn (m) — QUY ƯỚC TẠM, chỉnh trong 4 file đăng ký
- `placements.js`: nhà (BUILDINGS) 4,5 · tán cây 3,6 (deck) · đèn đá 1,7 · ghế 0,55 · luống hoa 0,5.
- `landscape.js`: trà thất 3,8 · đá thiền max(0,8; r·0,9) · bệ Quan Âm 3,4 · tháp nhỏ 6 · tán cây GLB 3,4·tỉ lệ (deck).
- `outside.js`: đá lăng 2,4 · giếng 1,0 · cổ thụ 5,5 · đá 0,9+ · trụ đèn phố 3,0 · cột cổng làng 4,0 · quầy 2,4 · đình nghỉ 4,8 · miếu 3,8 · VÁCH ĐÁ Đại Phật 9 (gờ đá) · Bảo tháp 14 · 5 cửa hàng 4,6.
- Chưa làm: ĐỈNH NÚI/biên bản đồ (là ranh giới chặn, không phải vật cản có độ cao) — cần ptg nói rõ núi nào muốn đứng lên.

## Test / phiên bản
- `tests/standon.test.mjs` (10 test, đã vào `npm test`); `npm test` 1305 (1295 cũ + 10 mới) đều xanh. `sw.js` = `dgt-v188`.
- CHƯA nhìn bằng mắt (môi trường AI không có WebGL): ptg thử bay lên mái nhà / tán cây / Bảo tháp, đứng, bước ra mép (phải rơi), dùng chiêu khi đang bay. Báo CỤ THỂ nếu lệch: vật nào, độ cao đứng thấy chìm/lơ lửng bao nhiêu (chỉnh `top`).

## Việc kế
Chờ ptg báo "tiếp tục" / phản hồi khi thử. Gợi ý: chỉnh `top` theo mắt nhìn; thêm đứng trên núi/vách; hạ cánh đệm theo `jump.y − mặt đứng` (hiện đệm vẫn tính theo mặt đất).
