# PHIÊN 30 — Đèn lồng/biển cửa hàng theo giờ + đồng hồ HUD (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** repo `tp9sach-ops/loinhuan.github.io` `main` @ `d2237d8` + bản sửa va chạm Phiên 29 (docs/PHIEN29.md). Gói này GỘP Phiên 29 + 30; tải lên cùng lúc.
**Việc ptg yêu cầu:** "tiếp tục" → làm mục (2) trong HANDOFF-PHIEN-28 "Việc tiếp theo". Mục NPC dù/trú mưa ĐÃ có từ Phiên 28 (HANDOFF.md cũ nên không thấy).

## Đã làm
- `js/scene/temple.js`: `M.lantern.userData.nightGlow = {day 0.55, night 2.2}` → mọi đèn lồng chùa (chánh điện, Nhà Tổ, Tam quan, gác chuông) sáng dần theo `S.lamps` (cùng cơ chế đèn đường/cửa sổ của Phiên 23; `index.js` dòng ~172/226 tự gom `nightGlow`).
- 5 cửa hàng (`didong, dienmay, kimhoan, store9sach, tachhoa`): hàm `glow(c,k)` gắn `nightGlow {day:k, night:k*2.4+0.4}` → phần phát sáng của biển/đèn cửa hàng sáng hơn về đêm. LƯU Ý: mặt biển là `MeshBasicMaterial` (không có emissive) nên giữ nguyên; chỉ phần viền/đèn dùng `glow`.
- HUD: `js/ui/hud.js` thêm chip `#game-clock` (☀/☾ + "HH:MM · pha · thời tiết"), cập nhật mỗi 1 giây từ `LGT.clock/phase/night/weather.name`; `hudLogic.clockLabel` (thuần, có test); CSS cuối `css/hud.css`.
- `sw.js` VERSION dgt-v24. `tests/clocklabel.test.mjs` (3 test) thêm vào package.json.

## Kiểm
`npm test` 422/422 (Node v22; 419 Phiên 29 + 3). CHƯA mở trình duyệt thật: chưa nhìn mức sáng đèn lồng (day 0.55 có thể quá tối/sáng so với ý ptg), chưa xem chip đồng hồ chồng với chip khác trên điện thoại nhỏ.

## File thay đổi (giữ đúng đường dẫn khi tải lên)
Phiên 29: js/world/layout.js, worldLogic.js, path.js, tests/collision.test.mjs, docs/PHIEN29.md. Phiên 30: js/scene/{temple,didong,dienmay,kimhoan,store9sach,tachhoa}.js, js/ui/{hud,hudLogic}.js, css/hud.css, sw.js, tests/clocklabel.test.mjs, docs/PHIEN30.md, package.json (chung cả hai).

## Việc kế (làm TỪNG MỤC, xong báo rồi chờ đồng ý)
(3) Đom đóm tự nhiên hơn + trẻ cầm lồng đèn. (4) Âm thanh theo mùa/môi trường (ve, rừng, thác). Rồi: camera xuyên tường (camStep, world.js: tia từ người tới camera), HANDOFF.md/PROMPT.md cập nhật Phiên 26–30, rồi Phiên 3 master prompt (chú tiểu, trụ trì, tưới cây bồ đề, thiền 3 phút).
GitHub: tích hợp chỉ ĐỌC (403 khi ghi) — ptg tải file lên tay hoặc cấp Contents: Read and write.
