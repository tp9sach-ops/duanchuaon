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

## Đã sửa (6 file trong zip `cap-nhat-phien29.zip`, giữ đúng đường dẫn)
- `js/world/layout.js`: `PLAYER_R = 0,35`; `bodyBlocked`, `canStepBody`, `moveBody`; `terrainBlocked` tách khỏi `blocked`; `STAIRS` + `groundY` theo mặt từng bậc; `STAIR_RAILS` (thêm vào `RECTS`); dải sát nền thành vật cản. Thân đang chạm sẵn thì `moveBody` dùng va chạm điểm cũ để vẫn bước ra được.
- `js/world/worldLogic.js`: `walkStep` dùng `moveBody`, `MAX_SUBSTEP = 0,2`.
- `tests/collision.test.mjs` (mới, 11 test) + `package.json` (thêm file test).
- `docs/PHIEN29.md` (file này).
- `js/world/path.js`: `CLEAR` 0,5 → 0,7 và `M` 0,45 → 0,7. Lý do: thân 0,35 m + dung sai đổi mốc của navigator 0,3 m; với lề 0,45 m nhân vật lệch mốc rồi kẹt vào trụ đèn (−4,4; −12,8) khi đi từ Chánh điện tới Lá số (test "đi giữa mọi cặp chương" đỏ). Không đổi cảnh 3D.

## Kiểm
- `git clone` repo công khai chạy được trong môi trường AI. Nền `d2237d8`: **npm test 408/408**. Sau khi áp bản sửa (6 file): **npm test 419/419** (408 + 11 test va chạm), Node v22.23.4. Lần đầu chỉ áp 5 file thì 1 test đỏ (`temple → charts`), nên mới sửa `path.js`.
- Chưa chạy trên Node 20 (CI dùng Node 20). **CHƯA thử trình duyệt/điện thoại thật** (cảm giác va chạm ở góc nhà, chân trên bậc thềm).

## ptg cần làm
Tải 6 file trong zip lên repo (Add file → Upload files, giữ đúng thư mục, trùng tên thì ghi đè). Tích hợp GitHub của Claude hiện CHỈ ĐỌC được (`push_files` và `create_or_update_file` đều 403 "Resource not accessible by integration"); muốn phiên sau tự đẩy thì cấp Contents: Read and write.

## Rủi ro / việc kế
1. (Hiện không còn test đỏ.) Nếu sau này test đỏ do `blocked` đổi: chỉ có 2 thay đổi (a) `STAIR_RAILS` trong `RECTS`, (b) dải `|x| < 22`, `z ∈ [−52, −17,5]` ở vùng 'ground'. Điểm đứng/NPC/ghế nằm trong đó thì dời điểm đó, đừng nới va chạm.
2. Camera (`camStep` trong `world.js`) vẫn có thể lọt vào trong tường khi zoom gần (lỗi "nhìn xuyên nhà"): CHƯA xử lý; cần tia từ nhân vật tới camera, kéo camera lại gần khi chạm khối.
3. Chép mục này vào HANDOFF.md mục 7 (Phiên 29) và đối chiếu Phiên 26–28b, vì HANDOFF 163 KB chỉ ghi được nguyên file.
4. Việc kế theo HANDOFF Phiên 25: NPC/dân làng mở dù/áo mưa + tìm chỗ trú; đèn lồng + đồng hồ HUD; đom đóm tự nhiên + trẻ cầm lồng; rồi chú tiểu, trụ trì, tưới cây bồ đề, thiền 3 phút (master prompt, Phiên 3).
