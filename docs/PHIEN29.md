# PHIÊN 29 — Sửa nhân vật đi xuyên nhà / tường / cột / bậc thềm (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu của ptg:** xem repo, đọc kỹ; sửa lỗi nhân vật đi xuyên nhà, tường, cầu thang, bậc; làm tiếp; đẩy GitHub.
**Repo:** https://github.com/tp9sach-ops/loinhuan.github.io, `main` @ `d2237d8` lúc đọc (HANDOFF.md dừng ở Phiên 25; repo đã có Phiên 26–28b: `phien26.patch`, `js/world/shadowSnap.js`).

## Nguyên nhân (đọc mã thật)
1. Nhân vật là MỘT ĐIỂM (`layout.js` `blocked/canStep/move` chỉ kiểm tâm) → thân rộng ~0,7 m lún vào tường nhà, góc nhà, cột, lư hương, thành bậc.
2. `chanhdien.js` dựng 5 bậc đá rời (sâu 0,88 m, mặt bậc i cao (i+1)·1,14/5) nhưng `groundY` là dốc thoải nằm dưới các bậc → chân lún vào đá.
3. Thành bậc (x = ±5,45, z −17,9…−13,1) không có va chạm → đi xuyên từ bên hông.
4. Nền đá chính điện rộng ±22 nhưng vùng sàn đi được chỉ tới ±21,5 → dải 0,5 m sát nền nằm trong khối đá.
5. Bước con tối đa 0,5 m trong `walkStep` có thể nhảy qua vật mỏng khi chạy nhanh / khung hình chậm.

## Đã sửa (5 file trong zip `cap-nhat-phien29.zip`, giữ đúng đường dẫn)
- `js/world/layout.js`: `PLAYER_R = 0,35`; `bodyBlocked`, `canStepBody`, `moveBody`; `terrainBlocked` tách khỏi `blocked`; `STAIRS` + `groundY` theo mặt từng bậc; `STAIR_RAILS` (thêm vào `RECTS`); dải sát nền thành vật cản. Thân đang chạm sẵn thì `moveBody` dùng va chạm điểm cũ để vẫn bước ra được.
- `js/world/worldLogic.js`: `walkStep` dùng `moveBody`, `MAX_SUBSTEP = 0,2`.
- `tests/collision.test.mjs` (mới, 11 test) + `package.json` (thêm file test).
- `docs/PHIEN29.md` (file này).
- Không đổi: `path.js` (A* chừa 0,5 m / 0,45 m > PLAYER_R), cảnh 3D.

## Kiểm
- Ở lần chạy trước (môi trường AI, với bản repo đã tải): collision 11/11, layout 8/8, worldlogic đạt.
- **CHƯA chạy `npm test` đầy đủ** (các test spots, seats, path, landscape, outside, shelter, npc, worldsim, transport… dùng layout.js chưa chạy với thay đổi này). **CHƯA thử trình duyệt/điện thoại.**
- Workflow Pages chạy `npm test` trước khi deploy: nếu tab Actions đỏ, mở log và báo phiên sau.

## ptg cần làm
Tải 5 file trong zip lên repo (Add file → Upload files, giữ đúng thư mục, trùng tên thì ghi đè). Tích hợp GitHub của Claude hiện CHỈ ĐỌC được (`push_files` và `create_or_update_file` đều 403 "Resource not accessible by integration"); muốn phiên sau tự đẩy thì cấp Contents: Read and write.

## Rủi ro / việc kế
1. Nếu test đỏ do `blocked` đổi: chỉ có 2 thay đổi (a) `STAIR_RAILS` trong `RECTS`, (b) dải `|x| < 22`, `z ∈ [−52, −17,5]` ở vùng 'ground'. Điểm đứng/NPC/ghế nằm trong đó thì dời điểm đó, đừng nới va chạm.
2. Camera (`camStep` trong `world.js`) vẫn có thể lọt vào trong tường khi zoom gần (lỗi "nhìn xuyên nhà"): CHƯA xử lý; cần tia từ nhân vật tới camera, kéo camera lại gần khi chạm khối.
3. Chép mục này vào HANDOFF.md mục 7 (Phiên 29) và đối chiếu Phiên 26–28b, vì HANDOFF 163 KB chỉ ghi được nguyên file.
4. Việc kế theo HANDOFF Phiên 25: NPC/dân làng mở dù/áo mưa + tìm chỗ trú; đèn lồng + đồng hồ HUD; đom đóm tự nhiên + trẻ cầm lồng; rồi chú tiểu, trụ trì, tưới cây bồ đề, thiền 3 phút (master prompt, Phiên 3).
