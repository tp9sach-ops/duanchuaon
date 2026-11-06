# PHIÊN 31 — Đom đóm tự nhiên + test thiếu (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** repo `tp9sach-ops/loinhuan.github.io` `main` @ `68c6e0a` (Phiên 29+30 đã có trên GitHub). Yêu cầu của ptg: "làm tiếp phiên trước". Sandbox phiên trước đã mất nên toàn bộ phần dưới được LÀM LẠI trong phiên này.

## Đã làm (chạy `npm test` = 433/433 đạt, Node 22)
- `tests/clocklabel.test.mjs` (3 test): file này package.json gọi nhưng chưa có trên repo → CI có thể đỏ. Đã thêm.
- `js/world/fireflies.js` (mới, thuần logic): 6 vùng (ao sen, sân chùa, vườn thiền, ao cá, bãi thông, hồ thác), `createSwarm` bay mượt (lái dần về mục tiêu lang thang, ≤1,6 m/s), `blink` nhịp riêng từng con, `fireflyLevel(night, rain)` (tối dần lên, mưa thì tắt).
- `js/scene/particles.js`: `buildFireflies` viết lại dùng swarm + màu theo đỉnh (nhấp nháy từng con); `update(t, dt)`, `setLevel`.
- `js/scene/index.js`: nối `fireflyLevel`, truyền `dt`.
- `tests/fireflies.test.mjs` (7 test), thêm vào package.json (cùng clocklabel).
- `js/world/lantern.js` (mới, thuần logic): `lanternGlow(night)` = 0,35 + 1,25×độ tối; `lanternSway`, `candleFlicker`, `carriesLantern` (chỉ trẻ scale<1).
- `js/scene/npc.js`: lồng đèn giấy cam treo trên cây tre ở TAY TRÁI (x=-0.32), đung đưa theo bước đi, sáng theo `LGT.night`, nến nhấp nháy; `js/world/outside.js`: thêm bé d8 (x=5, z 64→88) và d9 (x=-8, z 100→70, scale 0.65). Lưu ý: cổng làng có trụ ở x=±8,5 z=66 nên d8 không đi x=8.
- `tests/lantern.test.mjs` (4 test) thêm vào package.json.
- `sw.js` VERSION `dgt-v25`.

## CHƯA làm
- Lồng đèn chỉ có quầng/emissive, chưa chiếu sáng mặt đất; chưa nhìn bằng mắt vị trí lồng so với tay bé (tay chắp trước ngực, lồng treo bên trái); độ sáng 0,35+1,25×tối cần ptg xem.
- Chưa mở trình duyệt: chưa xem kích thước/màu đom đóm (size 0.45, màu 0xffe08a), chưa đo FPS điện thoại.
- Bãi thông chỉ là ước lượng quanh (-106,90) r12; đom đóm chưa đổi theo mùa.
- Chưa cập nhật HANDOFF.md/PROMPT.md mục 7 cho Phiên 26–31 (HANDOFF.md chỉ tới Phiên 25). `phien26.patch` ở gốc đã áp dụng, xóa được.
- GitHub: tích hợp trước đây chỉ đọc (403 khi ghi) → tải file lên tay theo đúng đường dẫn.

## File thay đổi
js/world/fireflies.js, js/world/lantern.js, js/world/outside.js, js/scene/particles.js, js/scene/index.js, js/scene/npc.js, tests/clocklabel.test.mjs, tests/fireflies.test.mjs, tests/lantern.test.mjs, package.json, sw.js, docs/PHIEN31.md

## Việc kế (làm TỪNG MỤC, xong báo rồi chờ đồng ý)
(1) Âm thanh theo mùa/môi trường (ve, rừng, thác). (2) Camera xuyên tường (camStep, world.js). (3) Gộp HANDOFF.md/PROMPT.md Phiên 26–31. (4) Phiên 3 master prompt (chú tiểu, trụ trì, tưới cây bồ đề, thiền 3 phút).
