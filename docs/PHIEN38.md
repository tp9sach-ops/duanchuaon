# PHIÊN 38 — Xây nhà, bước 3d-2: BÊN TRONG NHÀ = MỘT CẢNH RIÊNG ĐỂ BƯỚC VÀO (BÀN GIAO, cập nhật sau từng mục nhỏ)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** repo `main` @ `3f4919d` (đọc 07/11 qua GitHub; HANDOFF.md trên trang web chỉ tới Phiên 14a, bản chuẩn là `docs/PHIEN3x.md` + `PROMPT.md` mục 7). Phiên 37 để dở mục 3d-2 chờ ptg chốt "bên trong nhà là gì". **ptg đã chốt: một cảnh riêng để bước vào.**
**Cách làm (ptg):** chia mục nhỏ, mỗi mục xong phải đưa lên GitHub ngay. **Giới hạn thật:** tích hợp GitHub của chat này CHỈ ĐỌC (ghi trả 403 "Resource not accessible by integration", đã thử `push_files`) → mỗi mục giao file đúng đường dẫn, ptg tải lên tay (trùng tên ghi đè). Chạy trong Claude Code có quyền ghi thì tự commit.

## Thiết kế đã chọn (cần ptg duyệt nếu muốn khác)
- Phòng riêng nằm CÙNG cảnh 3D nhưng ở xa: tâm `INTERIOR = (400, 400)` (lưới tìm đường chỉ phủ x −130…130, z −80…220). Dịch chuyển người chơi vào đó bằng `LGT.world.teleport`. Không cần tải cảnh mới, không giật.
- Mỗi cấp nhà một phòng (5,6×4,8 / 6,8×5,6 / 6,8×5,6 / 8,6×6 m), cửa giữa tường +z, vào là nhìn về −z (`ry = π`, camera `yaw = 0`). Chỉ phòng cấp hiện tại được đăng ký vào `layout.js` (`registerRoom(lv)` trả hàm gỡ).
- Nút "Vào nhà" hiện khi người chơi trong `DOOR_R = 8` m quanh cửa nhà MÌNH (điểm đứng `plot.front` cách cửa ≤ 7,2 m; villa có hồ bơi chắn trước cửa nên không đòi sát cửa). Nút "Ra ngoài" luôn hiện khi ở trong; ra tới `exitPlan` = `plot.front`.
- Nội thất mặc định theo cấp (data trong `ROOMS[].furniture`: giường, bàn, sofa, TV, tủ, cầu thang trang trí, bể cá...). Bước 4 (danh mục nội thất đặt/xoay/xóa) sẽ thay dữ liệu này.

## Các mục nhỏ
- [x] **3d-2a XONG (logic thuần, `node --test tests/interior.test.mjs` 9/9; `tests/smoke.mjs` đạt):** `js/world/interior.js` (INTERIOR, DOOR_R, ROOMS, roomFor, roomRect, entryPoint, doorInside, atDoor, isInterior, furnitureRects, registerRoom, doorPoint, nearDoor, enterPlan, exitPlan), `tests/interior.test.mjs`, `package.json` (thêm test vào script). Test bắt lỗi thật khi làm: kệ/tủ lòi ra ngoài tường, bể cá/tủ bị kẹt không lại gần được (đã dời), điểm ra ngoài phải đi được khi nhà+hồ bơi đã chặn.
  - `npm test` ĐẦY ĐỦ chưa đọc được kết quả cuối (chạy ~100 giây, bị cắt dòng tổng); đã chạy riêng smoke + interior đạt.
- [ ] **3d-2b Cảnh 3D phòng:** `js/scene/interior.js` → `buildInterior()` trả `{ group, show(lv), hide() }`. Sàn gỗ, 4 tường + trần ĐỀU MỘT MẶT quay vào trong (camera ở ngoài thấy xuyên như nhà búp bê; KHÔNG đưa tường vào `RECTS` để camera không bị kéo), cửa gỗ ở tường +z, cửa sổ, đèn: tạo SẴN 1–2 `PointLight` lúc dựng (đừng thêm/bớt đèn lúc chạy vì three phải biên dịch lại shader), đổi `intensity` khi hiện/ẩn. Đồ nội thất dựng theo `ROOMS[lv].furniture` (kind: bed, rug, table, lamp, crate, shelf, wardrobe, tvunit, sofa, chair, stairs, plant, tank). Gắn vào `js/scene/index.js` (`scene.add`, `LGT.interiorScene`), có `sw.js` VERSION mới (hiện `dgt-v39` → `dgt-v40`).
- [ ] **3d-2c Nối vào trò chơi:** (1) `js/world/world.js` `teleport(x, z, ry)` nhận thêm hướng (đặt `avatar.setFacing(ry, true)` và `yaw = 0`); (2) `js/ui/land.js` hoặc file mới `js/ui/house.js`: nút nổi "Vào nhà"/"Ra ngoài" (tự dựng bằng DOM, CSS nhúng bằng JS như `world.js` để khỏi sửa `index.html`), kiểm bằng `enterPlan`/`exitPlan`, khi vào: `registerRoom(lv)` + `LGT.interiorScene.show(lv)` + `LGT.inHouse = true`, khi ra: gỡ đăng ký + `hide()` + `LGT.inHouse = false`; (3) `js/scene/index.js` dòng `sheltered`: thêm `|| LGT.inHouse` để trong nhà không thấy mưa rơi; (4) nâng cấp nhà khi đang ở trong thì dựng lại phòng (gọi lại `show`, đăng ký lại); (5) đóng bảng/dừng hoạt động đang ngồi trước khi dịch chuyển.
  - Lưu ý: `findPath` (path.js) trả `null` ngoài lưới → `world.js` tự đi thẳng tới điểm bấm (`nav.setTarget`), đủ dùng cho phòng nhỏ.
  - Chưa rõ: tiếng/nhạc nền và NPC trong nhà (không làm ở bước này).
- [ ] **3d-2d Kiểm + bàn giao:** chụp ảnh Chromium (cần `npm i three playwright-core @sparticuz/chromium` trong thư mục riêng, xem HANDOFF mục 11), thử 4 cấp nhà, bấm vào/ra, đồng hồ/ngày đêm trong nhà, điện thoại; cập nhật `docs/PHIEN37.md` mục 3d-2 + `PROMPT.md` mục 7.
- Sau đó: bước 4 nội thất đặt/xoay/xóa, 5 tham quan nhà người khác + mở tiệc (cần lưu nhà lên máy chủ), 6 máy chủ xác nhận + nạp tiền (xem `docs/PHIEN34.md`).

## File thay đổi (3d-2a) — tải lên đúng đường dẫn, trùng tên ghi đè
js/world/interior.js (mới), tests/interior.test.mjs (mới), package.json (thêm `tests/interior.test.mjs` cuối script test), docs/PHIEN38.md (mới)
