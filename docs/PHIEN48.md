# PHIÊN 48 — Cảnh 3D câu cá (mục 1.2) + dọn 3 file lạc — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, làm TỪNG MỤC, xong báo, chờ "tiếp tục". Muốn sửa mã thì nhận đủ đoạn TÌM và THAY BẰNG.
**Yêu cầu Phiên 48:** "tiếp tục và đẩy phiên mới lên github". Đọc theo thứ tự: `PROMPT.md` → `docs/KE_HOACH_TONG.md` → file này → `docs/PHIEN47.md`, `PHIEN46.md`. `HANDOFF.md` gốc đã cũ.

## Kiểm đầu phiên
- Bản Phiên 47 ptg đã tự tải lên (commit `f238823`), khớp mã của mình. Quyền ghi GitHub lần này có (gọi `add_repo` quyền push rồi `git push` từ bản clone; công cụ `push_files` vẫn 403).
- `npm test` cuối phiên: **584/584 đạt (Node 22)**. Node 20 chưa chạy.

## ĐÃ LÀM
1. MỚI `js/world/fishingView.js` (logic thuần, có test): `castTarget` (điểm cầu rơi trong mặt nước, về phía người chơi), `flightPoint` (cầu bay vòng cung, `FLIGHT` 0,6 giây), `rippleAt`/`rippleTimes` (sóng lúc chạm nước và mỗi lần cá rỉa), `fishShadow` (bóng cá giây 4 → lúc cắn), `bobY` (phao chìm khi rỉa), `lotusBloom` (hoa sen nở đúng cửa sổ `orb.cua`), `orbColor`, `sessionKey`, `waterY` (độ cao mặt nước: hồ cá 0,10 · ao sen 0,06 · hồ thác 0,10 — CHƯA kiểm bằng mắt).
2. MỚI `js/scene/fishing.js`: `buildFishing(LGT, {reduce, perf})` → `{group, update(t, dt)}`. Đọc `LGT.fishing.session` + `LGT.world.pos`. Vẽ: quả cầu (màu theo loại, có quầng sáng), 5 vòng sóng, bóng cá, hoa sen hồng nở, một vòng sóng cuối ~1 giây khi phiên kết thúc. Giảm chuyển động: cầu không bay, sóng không giãn, hoa không xoay. PERF bậc ≥ 4: bỏ bóng cá và sóng thứ 3 trở đi.
3. `js/scene/index.js`: import + dựng + `fishing.update(t, dt)` cạnh `hoaSen.update`.
4. Dọn: XÓA 3 file lạc `js/fishing.js`, `js/hudMenu.js`, `js/menuLogic.js` (đã so sánh trùng khít bản trong `js/ui/`, không ai import).
5. `js/world/tutorial.js`: bỏ bước "sắp có" của chủ đề Phóng sinh (đã có hình 3D); sửa `tests/tutorial.test.mjs` tương ứng. `js/ui/fishing.js`: sửa chú thích. `sw.js` `dgt-v54`. `tests/smoke.mjs` thêm 2 file bắt buộc; `package.json` thêm `tests/fishingview.test.mjs`.
6. Test mới: `tests/fishingview.test.mjs` (6 test). Ngoài repo: chạy thật `js/scene/fishing.js` với three.js r160 (không có WebGL, chỉ dựng cảnh) ở cả 4 tổ hợp reduce/perf: cầu, sóng, bóng cá, hoa sen hiện đúng pha; vòng sóng cuối tự tắt.

## CHƯA KIỂM / RỦI RO (ptg xem trên trang thật)
- Chưa nhìn bằng mắt: độ cao mặt nước (cầu chìm hay lơ lửng?), cỡ cầu/hoa sen so với nhân vật, bóng cá có đủ rõ ban ngày/ban đêm, hoa sen có che nút bấm không. Chỉnh ở `WATER_Y`, `LAND_INSET` (fishingView.js) và các số trong `js/scene/fishing.js`.
- Ban đêm cầu và hoa sen dùng vật liệu sáng nhưng chưa thử cùng bloom/mưa.
- Cầu rơi cách mép vào trong tối đa 2,6 m (40% bán kính): hồ nhỏ có thể thấy hơi gần.
- Không còn việc "ao cá riêng 3D" (hình các con cá bơi): chỉ có dạng chữ, không bắt buộc.

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
1. 1.5 Lạy Phật → `LGT.merit.reward('lay', n)` (hudMenu.js hiện chỉ gọi `LGT.act('bow')`).
2. 2.2 chạy test nhiều lần (test lỗi thoáng qua), rồi Giai đoạn 3 (thử nhà/nội thất trên trình duyệt, hỏi ptg trước khi nâng hình trong phòng, nhiệm vụ nội thất) và Giai đoạn 4 (hỏi ptg ý chính chương 2).
Quy tắc: logic có test; đổi giao diện thì tăng `VERSION` trong `sw.js`; quét bí mật; đẩy GitHub; viết `docs/PHIEN49.md`.

## File thay đổi phiên này
MỚI: js/world/fishingView.js, js/scene/fishing.js, tests/fishingview.test.mjs, docs/PHIEN48.md. SỬA: js/scene/index.js, js/world/tutorial.js, js/ui/fishing.js, tests/tutorial.test.mjs, tests/smoke.mjs, package.json, sw.js, docs/KE_HOACH_TONG.md, PROMPT.md. XÓA: js/fishing.js, js/hudMenu.js, js/menuLogic.js.
