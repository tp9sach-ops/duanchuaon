# PHIÊN 81 — Hạ tầng ZONE (va chạm theo zone + ZoneManager) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PORMT TỔNG → docs/KE_HOACH_TONG.md → docs/THIET_KE_CHIEU_SAU.md → PHIEN80.md → file này.

## Bối cảnh
ptg bảo xem lại repo kỹ, hiểu phần đang làm, làm tiếp "prompt chiều sâu" (`docs/THIET_KE_CHIEU_SAU.md`) + "prompt tổng" (`docs/PORMT TỔNG`) và đẩy GitHub.
Kiểm đầu phiên: `main` @ `0881612` (Phiên 80), `npm test` 762/762. Thiết kế chiều sâu đã được ptg duyệt (2026-11-09); mục 6 của nó ghi **mục đầu tiên là "Phiên 71: hạ tầng ZONE"** (số phiên cũ, thực tế đang là Phiên 81). Phiên này làm đúng mục đó ở mức LÕI LOGIC, giữ y nguyên hành vi hub.

## ĐÃ LÀM
- `js/world/layout.js`: **va chạm theo zone.** Hub là zone `chua` (mặc định; mọi `addCircle/addRect/addWalk/addWater` lúc import rơi vào đó nên không đổi gì). Thêm: `HUB`, `defineZone(id,{bounds,terrain?,groundY?})`, `activateZone(id)` (cất vật cản zone cũ, nạp zone mới, **đổi nội dung tại chỗ** nên mọi module đã import `CIRCLES/RECTS/WALKS/WATERS` vẫn đúng), `addToZone(id,kind,item)` (dựng zone khi chưa vào), `activeZoneId()`, `zoneRevision()`, `hasZone()`. Zone khác hub: ngoài `bounds` là bị chặn, KHÔNG có chính điện/ao/cổng/ranh giới của chùa (`region`→`'ground'`, `hallSolid`→false, `groundY` theo zone).
- `js/world/path.js`: khóa bộ nhớ đệm tìm đường thêm `activeZoneId()+zoneRevision()` (trước đây chỉ theo số vật cản → hai zone cùng số vật cản sẽ dùng nhầm lưới).
- `js/world/zones.js` (MỚI): `createZoneManager({layout,onChange})` — `register`, `validate` (cổng trỏ sai, thiếu spawn, ngân sách sai, zone mồ côi không tới được từ hub, cổng ngoài bounds), `canEnter(id,ctx)` (điều kiện mở trả lý do), `gateNear`, `tick(x,z,ctx)` (tải trước khi cách cổng ≤ bán kính + 12 m), `preload` (chống tải trùng), `release`, `travel`/`useGate` (tải → đổi va chạm → dispose zone cũ; **tải lỗi thì ở nguyên zone cũ**; không chuyển đồng thời), `roomKey(base)` (hub giữ nguyên tên cũ, zone khác `base:zoneId`), `maxPlayers`, `overBudget`, `serialize/restore` (zone chưa mở hoặc không còn → về hub), `listen`.
- `tests/zones.test.mjs` (13 test, đã thêm vào `package.json`). `sw.js` = `dgt-v87`.
- Kiểm: `npm test` **775/775 trên Node 22** (trước phiên 762). **Node 20 CHƯA kiểm được** (lệnh `npx -p node@20` hết giờ 10 phút trong môi trường AI) → ptg/GitHub Actions xem hộ.

## CHƯA LÀM (cố ý, để phiên sau làm TỪNG MỤC)
Hạ tầng mới chỉ là logic + va chạm; **chưa nối vào game thật**, nên người chơi không thấy gì đổi:
1. Chưa có `ZoneManager` trong `js/main.js`; chưa có cổng thử trong cảnh; chưa dựng/dispose cảnh 3D theo zone (hook `load/dispose` còn trống); chưa màn che ~1 giây + thanh tiến độ.
2. `js/net/room.js` chưa dùng `roomKey` (chưa lọc người theo zone); `js/world/minimap.js` chưa theo zone.
3. Lưới tìm đường `path.js` cố định X −130…130, Z −80…220: tọa độ zone mới PHẢI nằm trong khoảng này (hoặc phiên sau làm lưới theo zone).
4. Cảnh 3D hub (`js/scene/*`) và các module tự gọi `addCircle` khi import (`npc.js`, `river.js`, `land.js`…) vẫn gắn vào zone `chua` — đúng ý; zone mới phải tự đăng ký vật cản bằng `addToZone`.
5. Chưa lưu `zone`/vị trí cuối vào localStorage (có `serialize/restore`, chưa gọi).

## Việc kế (làm TỪNG MỤC, chờ ptg nói "tiếp tục")
- **Mục 82 (đề xuất):** nối `ZoneManager` vào `main.js` + `room.js` (`roomKey`) + `minimap.js` + lưu/khôi phục zone; thêm MỘT cổng thử ở rìa hub dẫn sang zone trống thử rồi quay lại; kiểm trên Chromium (có ảnh chụp). "Xong khi": hub chạy y như cũ, đi sang zone thử và về không lag, người ở hai zone không thấy nhau.
- Sau đó theo `THIET_KE_CHIEU_SAU.md` mục 6: sự kiện lịch Âm → Đạo hạnh Giới/Định/Tuệ → Zone 4 Thung Lũng Sương Mù → chương 2 + zone Vách Đại Phật → nhiệm vụ ngày → Vipassana (ptg duyệt thiết kế trước).
- Tồn từ Phiên 80: ptg cập nhật GAS (Donations) + duyệt tỉ lệ 1.000đ = 1 hạt sen; Xếp hạng/"Bảng vàng"; bơi–lặn; hai file lạc `js/PROMPT.md`, `js/sw.js` (chờ ptg trả lời có xóa không).

## Ghi nhận cho PROMPT.md mục 7 (chưa ghi được vào file đó trong phiên này)
- 2026-11-09 (Phiên 81): ptg bảo xem lại repo, đọc kỹ, làm tiếp theo "prompt chiều sâu" + "prompt tổng" và đẩy GitHub. Làm hạ tầng ZONE ở mức lõi logic (xem file này). **Quy tắc giữ nguyên:** làm từng mục nhỏ, xong báo, chờ "tiếp tục".
- Dòng cho `docs/KE_HOACH_TONG.md` (Giai đoạn 5 hoặc mục mới "Nhiều không gian"): `[~] Hạ tầng ZONE: lõi logic xong ở Phiên 81 (docs/PHIEN81.md); chưa nối vào game thật.`

## Quy ước kỹ thuật cần nhớ
- Muốn thêm zone: `manager.register({id, ten, loai:'AN'|'KQ'|'QUAI'|'HAM', bounds, spawns:{default:{x,z,ry}}, gates:[{id,x,z,r,to,spawn}], requires, load, dispose, budget})`; vật cản của zone đưa vào bằng `addToZone(id,'circle'|'rect'|'walk'|'water',item)` trong `load`. Chạy `manager.validate()` trong test (phải trả `[]`).
- Đừng gọi `layout.activateZone` trực tiếp từ giao diện; luôn qua `ZoneManager.travel/useGate` để dispose đúng.
