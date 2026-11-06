# PHIÊN 33 — Đồ họa phố làng: gạch hồng cam, hàng rào, nhà cửa chớp, đồ chợ (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** repo `tp9sach-ops/loinhuan.github.io` `main` @ `575c7e0`. Yêu cầu ptg: "làm tiếp phiên trước" (đổi đồ họa, kiến trúc, nhà, nền sân, nền gạch theo 5 ảnh mẫu: phố gạch hồng cam, nhà cửa chớp xanh ngọc + hoa giấy leo, hàng rào tường đá + song sắt xanh đậm + trụ đá, chậu hoa vàng, lồng gà tre, ghế gỗ, khối đá ngồi, dây đèn + đèn lồng đỏ). Sandbox phiên trước mất → làm LẠI từ đầu trong phiên này.

## Đã làm (`npm test` 463/463 đạt, Node 22; đã chụp ảnh cảnh 3D bằng chromium không đầu để kiểm)
- `js/scene/textures.js`: thêm `villageTileTexture()` (gạch đỏ cam ngả hồng, xếp so le). 5 cửa hàng (didong, dienmay, kimhoan, store9sach, tachhoa) và `scene/outside.js` (vỉa hè + chợ) dùng nó thay `pavingTexture()` (sân chùa vẫn gạch xám).
- `js/world/outside.js` (dữ liệu thuần, có test): `FENCE_X=13.5`, `streetEdgeFree(side)`, `STREET_FENCES` (suy ra từ đoạn trống, chừa sân cửa hàng/đường mòn/chợ 0,6 m), `PLANTERS` (10 chậu), `MARKET_DECOR` {cages, chairs, blocks}; tất cả đăng ký vật cản trong `registerOutside()`.
- `js/scene/outside.js`: `buildFences` (tường đá + song sắt InstancedMesh + trụ có núm), `buildDecor` (chậu hoa vàng, lồng gà tre có gà, ghế gỗ, khối đá có dải nâu), `buildFestoons` (dây đèn nhiều màu + đèn lồng đỏ giữa các cặp cột đèn); nhà phố: cửa chớp xanh ngọc + bậu cửa, bệ chân đá, hoa giấy leo góc nhà, mái ngói đỏ cam hơn (cửa sổ dời sang z = 0,12w và 0,36w cho vừa chớp).
- Chợ làng thành quảng trường mở: bỏ nhà phố ngẫu nhiên ở z 116–146 hai bên (trước đây đè lên quầy và đồ chợ). Vẫn gọi `house()` vào nhóm rỗng để dãy số ngẫu nhiên các nhà khác giữ nguyên.
- `tests/decor.test.mjs` (5 test, đã thêm vào `package.json`): hàng rào không chắn sân/đường mòn/chợ; đồ trang trí không đè quầy, cột đèn, gốc đa, giếng, thân/sân cửa hàng, lối dân đi lại; dải vỉa hè |x| 6,5–11 vẫn đi suốt.
- `sw.js` VERSION `dgt-v31`.

## Bài học (đã gặp)
- Đặt đồ gần đường của dân làng có thể làm `tests/shelter.test.mjs` đỏ (đường thẳng tới chỗ trú bị chặn): chạy cả hai test sau mỗi lần dời vị trí.
- Test cũ không kiểm đồ trang trí có lọt vào thân cửa hàng không → đã thêm.

## CHƯA làm
- Chưa chụp ảnh ban đêm / mưa với mô hình mới; chưa đo FPS điện thoại (thêm InstancedMesh song sắt ~ vài trăm, nhẹ).
- Chưa có vạch trắng cong đánh dấu khu chợ như ảnh mẫu (đó là giao diện chiếm khu của game mẫu, không phải yêu cầu rõ).
- Trẻ cầm lồng đèn, âm thanh theo mùa, camera xuyên tường, gộp HANDOFF.md/PROMPT.md Phiên 26–33 (xem PHIEN31.md mục "Việc kế").
- GitHub: không đẩy được (tích hợp chỉ đọc) → tải file lên tay theo đúng đường dẫn, trùng tên ghi đè; hoặc `git apply phien33.patch`.

## File thay đổi
js/scene/textures.js, js/scene/outside.js, js/scene/{didong,dienmay,kimhoan,store9sach,tachhoa}.js, js/world/outside.js, tests/decor.test.mjs, package.json, sw.js, PHIEN33.md
