# PHIÊN 31 — Đom đóm tự nhiên + test thiếu (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** repo `tp9sach-ops/loinhuan.github.io` `main` @ `68c6e0a` (Phiên 29+30 đã có trên GitHub). Yêu cầu của ptg: "làm tiếp phiên trước". Sandbox phiên trước đã mất nên toàn bộ phần dưới được LÀM LẠI trong phiên này.

## Đã làm (chạy `npm test` = 452/452 đạt, Node 22)
- `tests/clocklabel.test.mjs` (3 test): file này package.json gọi nhưng chưa có trên repo → CI có thể đỏ. Đã thêm.
- `js/world/fireflies.js` (mới, thuần logic): 6 vùng (ao sen, sân chùa, vườn thiền, ao cá, bãi thông, hồ thác), `createSwarm` bay mượt (lái dần về mục tiêu lang thang, ≤1,6 m/s), `blink` nhịp riêng từng con, `fireflyLevel(night, rain)` (tối dần lên, mưa thì tắt).
- `js/scene/particles.js`: `buildFireflies` viết lại dùng swarm + màu theo đỉnh (nhấp nháy từng con); `update(t, dt)`, `setLevel`.
- `js/scene/index.js`: nối `fireflyLevel`, truyền `dt`.
- `tests/fireflies.test.mjs` (7 test), thêm vào package.json (cùng clocklabel).
- `js/world/lantern.js` (mới, thuần logic): `lanternGlow(night)` = 0,35 + 1,25×độ tối; `lanternSway`, `candleFlicker`, `carriesLantern` (chỉ trẻ scale<1).
- `js/scene/npc.js`: lồng đèn giấy cam treo trên cây tre ở TAY TRÁI (x=-0.32), đung đưa theo bước đi, sáng theo `LGT.night`, nến nhấp nháy; `js/world/outside.js`: thêm bé d8 (x=5, z 64→88) và d9 (x=-8, z 100→70, scale 0.65). Lưu ý: cổng làng có trụ ở x=±8,5 z=66 nên d8 không đi x=8.
- `tests/lantern.test.mjs` (4 test) thêm vào package.json.
- Âm thanh theo mùa/môi trường: `js/ui/soundLogic.js` thêm `SEASON_MIX` (xuan/ha/thu/dong), vị trí `SPOTS.forest` (-104,90), lớp `cicada` (ve) trong `ambientMix`: ve CHỈ mùa hạ ban ngày, to hơn trong rừng thông, tắt khi mưa/đêm; mùa đông côn trùng gần tắt, ếch im, gió mạnh; mùa xuân ếch nhiều, mùa thu ếch ít; rừng thông thêm gió (lá xào xạc). `js/ui.js`: hàm `cicadas` (sóng răng cưa ~5 kHz + nhịp rung + dập dềnh), thêm lớp `cicada` vào mix, truyền `season: LGT.season`. Mùa lạ/không có = hành vi cũ. `tests/sound.test.mjs` thêm 4 test. KHÔNG thêm tiếng chim (ptg đã yêu cầu bỏ ở bản trước, dù master prompt có ghi).
- **Responsive mọi điện thoại (yêu cầu mới của ptg):** `js/ui/viewportLogic.js` (thuần: `classify` xs/sm/md/fold/lg + cờ landscape/short/tall/square, `bottomBar` đo thanh công cụ dưới của Safari/Chrome, `keyboardOpen`, `hudScale`, `viewportState`), `js/ui/viewport.js` (đo `visualViewport`, ghi `--vvw --vvh --vv-bar --hud-s` và `data-vp/orient/short/tall/square/kbd` lên `<html>`; nghe resize, orientationchange, visualViewport resize/scroll, màn hình gập kép), `css/responsive.css` (nạp SAU CÙNG trong index.html: dùng dvh/`--vvh` thay 100vh, `--bar-gap` = max(safe-area-bottom, thanh công cụ), nhánh xs = Z Fold bìa/iPhone SE, nhánh fold/square = Z Fold mở, nhánh short = điện thoại nằm ngang, nhánh kbd = bàn phím ảo, mục tiêu chạm ≥ 40px, `touch-action:manipulation`, ô nhập ≥ 16px chống Safari tự phóng to). `index.html`: viewport thêm `interactive-widget=resizes-content`, meta mobile-web-app/apple. `js/main.js` gọi `initViewport()`; `js/scene/index.js` resize cả khi xoay/`lgt:viewport`. `tests/viewport.test.mjs` (8 test, bảng máy thật 280×653 → 430×932, 852×393 ngang, Safari toolbar 68px, bàn phím).
- **Camera không xuyên tường:** `worldLogic.clipCamDist` + `layout.solidAt(x,z,y)` (vật cản tròn/chữ nhật + khối chính điện; ao/hồ không chặn); `world.js camStep` lùi nhanh khi bị chắn (k=16), ra chậm (k=3). `tests/camclip.test.mjs` (7 test, gồm mô phỏng >2000 tổ hợp vị trí×hướng×zoom, camera không nằm trong vật đặc).
- `HANDOFF.md` và `PROMPT.md` đã thêm khối tóm tắt Phiên 26–31 (chèn trước mục "8.", an toàn nhị phân vì file có thể lẫn byte lạ).
- `sw.js` VERSION `dgt-v27`.

## CHƯA làm
- Âm thanh mới CHƯA nghe thật trên trình duyệt: độ lớn ve (VOL.cicada 0.1) và tiếng rè cần ptg nghe rồi chỉnh; chưa có tiếng lá cây riêng (dùng chung lớp gió), chưa có tiếng thác đổi theo mùa.
- Lồng đèn chỉ có quầng/emissive, chưa chiếu sáng mặt đất; chưa nhìn bằng mắt vị trí lồng so với tay bé (tay chắp trước ngực, lồng treo bên trái); độ sáng 0,35+1,25×tối cần ptg xem.
- Chưa mở trình duyệt: chưa xem kích thước/màu đom đóm (size 0.45, màu 0xffe08a), chưa đo FPS điện thoại.
- Bãi thông chỉ là ước lượng quanh (-106,90) r12; đom đóm chưa đổi theo mùa.
- `phien26.patch` ở gốc đã áp dụng, xóa được.
- RESPONSIVE CHƯA thử trên máy/trình duyệt thật hay giả lập: sandbox không có trình duyệt. Chỉ kiểm bằng test logic + cân bằng ngoặc CSS. PTG cần thử: Z Fold bìa ngoài + mở ra, iPhone Safari (thanh công cụ dưới), Chrome Android, xoay ngang, bàn phím ảo ở màn vào cửa; có thể còn chồng nút ở vài cỡ máy → gửi ảnh chụp để chỉnh.
- Camera: vật cản tròn thấp (đá, đèn đường) cũng chắn camera nên có thể giật nhẹ khi đi sát; chưa xem bằng mắt.
- Giới hạn responsive: các panel nội dung dài (tử vi, bát tự…) trong style.css/stage.css chưa rà từng cái.
- GitHub: tích hợp trước đây chỉ đọc (403 khi ghi) → tải file lên tay theo đúng đường dẫn.

## File thay đổi
js/world/fireflies.js, js/world/lantern.js, js/world/outside.js, js/world/layout.js, js/world/worldLogic.js, js/world/world.js, js/ui/viewport.js, js/ui/viewportLogic.js, js/main.js, css/responsive.css, index.html, HANDOFF.md, PROMPT.md, tests/viewport.test.mjs, tests/camclip.test.mjs, js/scene/particles.js, js/scene/index.js, js/scene/npc.js, js/ui/soundLogic.js, js/ui.js, tests/sound.test.mjs, tests/clocklabel.test.mjs, tests/fireflies.test.mjs, tests/lantern.test.mjs, package.json, sw.js, docs/PHIEN31.md

## Việc kế (làm TỪNG MỤC, xong báo rồi chờ đồng ý)
(1) PTG thử responsive trên máy thật và gửi ảnh nếu lệch. (2) Phiên 3 master prompt: chú tiểu hướng dẫn đầu tiên, trụ trì giao bình tưới, tưới cây bồ đề, thiền 3 phút, cây lớn, mở Khinh thân bậc 1, lưu tiến độ (xem PROMPT.md mục X–XI; đọc js/world/quests.js trước vì đã có hệ nhiệm vụ, tests/quests.test.mjs). (3) Rà responsive các panel nội dung dài.
