# PHIÊN 31 — Đom đóm tự nhiên + test thiếu (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** repo `tp9sach-ops/loinhuan.github.io` `main` @ `68c6e0a` (Phiên 29+30 đã có trên GitHub). Yêu cầu của ptg: "làm tiếp phiên trước". Sandbox phiên trước đã mất nên toàn bộ phần dưới được LÀM LẠI trong phiên này.

## Đã làm (chạy `npm test` = 429/429 đạt, Node 22)
- `tests/clocklabel.test.mjs` (3 test): file này package.json gọi nhưng chưa có trên repo → CI có thể đỏ. Đã thêm.
- `js/world/fireflies.js` (mới, thuần logic): 6 vùng (ao sen, sân chùa, vườn thiền, ao cá, bãi thông, hồ thác), `createSwarm` bay mượt (lái dần về mục tiêu lang thang, ≤1,6 m/s), `blink` nhịp riêng từng con, `fireflyLevel(night, rain)` (tối dần lên, mưa thì tắt).
- `js/scene/particles.js`: `buildFireflies` viết lại dùng swarm + màu theo đỉnh (nhấp nháy từng con); `update(t, dt)`, `setLevel`.
- `js/scene/index.js`: nối `fireflyLevel`, truyền `dt`.
- `tests/fireflies.test.mjs` (7 test), thêm vào package.json (cùng clocklabel).
- `sw.js` VERSION `dgt-v25`.

## CHƯA làm
- Trẻ cầm lồng đèn (js/world/lantern.js, scene/npc.js, thêm bé d8/d9 trong outside.js) — làm LẠI ở phiên sau.
- Chưa mở trình duyệt: chưa xem kích thước/màu đom đóm (size 0.45, màu 0xffe08a), chưa đo FPS điện thoại.
- Bãi thông chỉ là ước lượng quanh (-106,90) r12; đom đóm chưa đổi theo mùa.
- Chưa cập nhật HANDOFF.md/PROMPT.md mục 7 cho Phiên 26–31 (HANDOFF.md chỉ tới Phiên 25). `phien26.patch` ở gốc đã áp dụng, xóa được.
- GitHub: tích hợp trước đây chỉ đọc (403 khi ghi) → tải file lên tay theo đúng đường dẫn.

## File thay đổi
js/world/fireflies.js, js/scene/particles.js, js/scene/index.js, tests/clocklabel.test.mjs, tests/fireflies.test.mjs, package.json, sw.js, docs/PHIEN31.md

## Việc kế (làm TỪNG MỤC, xong báo rồi chờ đồng ý)
(1) Trẻ cầm lồng đèn. (2) Âm thanh theo mùa/môi trường. (3) Camera xuyên tường. (4) Gộp HANDOFF.md/PROMPT.md Phiên 26–31. (5) Phiên 3 master prompt (chú tiểu, trụ trì, tưới cây bồ đề, thiền 3 phút).
